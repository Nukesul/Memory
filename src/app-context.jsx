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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0e1714' : '#1f3b34');
    setThemeState(next);
  };
  useEffect(() => {
    try {
      localStorage.setItem('memoris:theme', theme);
    } catch {
      /* ignore */
    }
  }, []); // eslint-disable-line

  // ── data ──
  const cached = CLOUD ? ls.get('memoris:cache', null) : null;
  const [state, setState] = useState({
    profiles: cached?.profiles || {},
    notes: cached?.notes || [],
    status: cached ? 'ready' : 'loading',
  });
  const lastLoad = useRef(0);
  const refresh = useCallback(async () => {
    lastLoad.current = Date.now();
    try {
      const d = await api.load();
      if (CLOUD) ls.set('memoris:cache', d);
      setState({ profiles: d.profiles, notes: d.notes, status: 'ready' });
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
      if (CLOUD) ls.set('memoris:cache', { profiles, notes: s.notes });
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

  const value = {
    lang, setLang, t, country, theme, toggleTheme,
    state, people, refresh, meId, me, login, logout,
    toasts, toast, box, openPhotos, closePhotos,
    saveProfile, uploadPhoto: api.uploadPhoto, removePhoto: api.removePhoto, addNote, deleteNote,
    cloud: CLOUD,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
