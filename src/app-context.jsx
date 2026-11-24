import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, CLOUD, ls } from './store';
import { DICT } from './i18n';
import { COUNTRIES } from './config';
import { buildAll, isFilled } from './people';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const detectLang = () => {
  const l = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return l === 'ja' ? 'ja' : ['ru', 'ky', 'kk'].includes(l) ? 'ru' : 'en';
};

export function AppProvider({ children }) {
  // ── language ──
  const [lang, setLangState] = useState(() => ls.get('memoris:lang', null) || detectLang());
  const setLang = (l) => {
    ls.set('memoris:lang', l);
    setLangState(l);
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = useCallback(
    (key, vars) => {
      let s = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
      if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
      return s;
    },
    [lang],
  );
  const country = useCallback((code) => COUNTRIES[code]?.[lang] || COUNTRIES[code]?.en || code, [lang]);

  // ── theme ──
  const [theme, setThemeState] = useState(() => document.documentElement.dataset.theme || 'light');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    ls.set('memoris:theme', next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#07061a' : '#1c1a3a');
    setThemeState(next);
  };
  useEffect(() => {
    try {
      localStorage.setItem('memoris:theme', theme);
    } catch {
      /* ignore */
    }
  }, []); // eslint-disable-line

  // ── install as an app (Chrome/Android fires this event; iPhone uses Share → Add to Home Screen) ──
  const [installEvt, setInstallEvt] = useState(null);
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    setInstallEvt(null);
  };

  // ── data ──
  const cached = CLOUD ? ls.get('memoris:cache', null) : null;
  const [state, setState] = useState({
    profiles: cached?.profiles || {},
    notes: cached?.notes || [],
    votes: cached?.votes || [],
    status: cached ? 'ready' : 'loading',
  });
  const lastLoad = useRef(0);
  const refresh = useCallback(async () => {
    lastLoad.current = Date.now();
    try {
      const d = await api.load();
      if (CLOUD) ls.set('memoris:cache', d);
      setState({ profiles: d.profiles, notes: d.notes, votes: d.votes || [], status: 'ready' });
    } catch (e) {
      console.error(e);
      setState((s) => (s.status === 'ready' ? s : { ...s, status: 'error' }));
    }
  }, []);
  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoad.current > 60000) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const people = useMemo(() => buildAll(state.profiles), [state.profiles]);

  // ── session (who is logged in on this device) ──
  const [meId, setMeId] = useState(() => ls.get('memoris:me', null));
  const login = (id) => {
    ls.set('memoris:me', id);
    setMeId(id);
  };
  const logout = () => {
    ls.del('memoris:me');
    setMeId(null);
  };
  const me = people.find((p) => p.id === meId) || null;
  const person = useCallback((id) => people.find((p) => p.id === Number(id)) || null, [people]);

  // ── toasts ──
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    setToasts((l) => [...l, { id, text, kind }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 3200);
  }, []);

  // ── lightbox ──
  const [box, setBox] = useState(null);
  const openPhotos = (items, index) => setBox({ items, index });
  const closePhotos = () => setBox(null);

  // ── mutations ──
  const saveProfile = useCallback(async (id, data) => {
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') {
        if (v.trim()) clean[k] = v.trim();
      } else if (v != null) clean[k] = v;
    }
    const row = await api.saveProfile(id, clean, isFilled(clean));
    setState((s) => {
      const profiles = { ...s.profiles, [id]: row };
      if (CLOUD) ls.set('memoris:cache', { profiles, notes: s.notes, votes: s.votes });
      return { ...s, profiles };
    });
    return row;
  }, []);

  const addNote = async (toId, text, color) => {
    const row = await api.addNote({ to_id: toId, from_id: meId, text: text.trim(), color });
    setState((s) => ({ ...s, notes: [row, ...s.notes] }));
  };
  const deleteNote = async (id) => {
    await api.deleteNote(id);
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  };

  // ── chat ──
  const [chat, setChat] = useState([]);
  const [seen, setSeen] = useState(() => ls.get('memoris:seen', {}));
  const fast = useRef(false);
  const setChatFast = useCallback((v) => {
    fast.current = v;
  }, []);
  const refreshChat = useCallback(async () => {
    if (!meId) return;
    try {
      setChat(await api.loadChat(meId));
    } catch (e) {
      console.error(e);
    }
  }, [meId]);
  useEffect(() => {
    if (!meId) {
      setChat([]);
      return undefined;
    }
    refreshChat();
    let last = Date.now();
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last >= (fast.current ? 4000 : 30000)) {
        last = Date.now();
        refreshChat();
      }
    }, 2000);
    return () => clearInterval(id);
  }, [meId, refreshChat]);
  const markSeen = useCallback((room) => {
    setSeen((s) => {
      const next = { ...s, [room]: Date.now() };
      ls.set('memoris:seen', next);
      return next;
    });
  }, []);
  const sendMessage = async (toId, text) => {
    const row = await api.sendMessage({ from_id: meId, to_id: toId, text: text.trim() });
    setChat((l) => [...l, row]);
  };
  const editMessage = async (id, text) => {
    const edited_at = await api.editMessage(id, text.trim());
    setChat((l) => l.map((m) => (m.id === id ? { ...m, text: text.trim(), edited_at } : m)));
  };
  const reactMessage = async (id, emoji) => {
    const msg = chat.find((m) => m.id === id);
    if (!msg) return;
    const cur = { ...(msg.reactions || {}) };
    const list = new Set(cur[emoji] || []);
    if (list.has(meId)) list.delete(meId);
    else list.add(meId);
    if (list.size) cur[emoji] = [...list];
    else delete cur[emoji];
    setChat((l) => l.map((m) => (m.id === id ? { ...m, reactions: cur } : m)));
    try {
      await api.reactMessage(id, cur);
    } catch (e) {
      setChat((l) => l.map((m) => (m.id === id ? msg : m)));
      throw e;
    }
  };
  const deleteMessage = async (id) => {
    await api.deleteMessage(id);
    setChat((l) => l.filter((m) => m.id !== id));
  };
  // Unread = messages from others, newer than the last time I opened that room.
  const unread = useMemo(() => {
    const by = {};
    for (const m of chat) {
      if (m.from_id === meId) continue;
      const room = m.to_id == null ? 'all' : String(m.from_id);
      if (new Date(m.created_at).getTime() > (seen[room] || 0)) by[room] = (by[room] || 0) + 1;
    }
    return by;
  }, [chat, seen, meId]);

  const vote = async (category, targetId) => {
    const row = { voter_id: meId, category, target_id: targetId };
    await api.saveVote(row);
    setState((s) => ({ ...s, votes: [...s.votes.filter((v) => !(v.voter_id === meId && v.category === category)), row] }));
  };

  const value = {
    vote, chat, unread, reactMessage, refreshChat, setChatFast, markSeen, sendMessage, editMessage, deleteMessage,
    lang, setLang, t, country, theme, toggleTheme,
    state, people, person, refresh, meId, me, login, logout,
    toasts, toast, box, openPhotos, closePhotos,
    saveProfile, uploadPhoto: api.uploadPhoto, removePhoto: api.removePhoto, addNote, deleteNote,
    cloud: CLOUD, canInstall: Boolean(installEvt), install,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
