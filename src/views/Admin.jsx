import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { ADMIN_ID, ANNOUNCE_MAX } from '../config';
import { api } from '../store';
import { href } from '../router';
import { firstName } from '../roster';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';

const PIN_KEY = 'memoris:pin';
const MB = 1024 * 1024;
const readPin = () => {
  try {
    return sessionStorage.getItem(PIN_KEY) || '';
  } catch {
    return '';
  }
};
const savePin = (v) => {
  try {
    if (v) sessionStorage.setItem(PIN_KEY, v);
    else sessionStorage.removeItem(PIN_KEY);
  } catch {
    /* ignore */
  }
};
const mb = (n) => `${(n / MB).toFixed(n > 10 * MB ? 0 : 1)} MB`;

export default function Admin() {
  const { t, me } = useApp();
  const [pin, setPin] = useState(readPin);
  if (!me || me.id !== ADMIN_ID) {
    return (
      <section className="page admin">
        <h1 className="page-title">{t('admin_title')}</h1>
        <p className="empty">{t('admin_only')}</p>
        <a className="btn" href={href('me')}>{t('open_cabinet')}</a>
      </section>
    );
  }
  if (!pin) return <PinGate onOk={(v) => { savePin(v); setPin(v); }} />;
  return <Panel pin={pin} onLock={() => { savePin(''); setPin(''); }} onPin={(v) => { savePin(v); setPin(v); }} />;
}

function PinGate({ onOk }) {
  const { t } = useApp();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api.admin('admin_check', { p_pin: v });
      if (r?.ok) onOk(v);
      else setErr(t('admin_wrong'));
    } catch {
      setErr(t('err_generic'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="page admin">
      <h1 className="page-title">{t('admin_title')}</h1>
      <p className="page-lead">{t('admin_pin_lead')}</p>
      <form className="composer admin-pin" onSubmit={submit}>
        <label htmlFor="admin-pin">{t('admin_pin')}</label>
        <input id="admin-pin" type="password" inputMode="numeric" autoComplete="off" value={v} onChange={(e) => setV(e.target.value)} autoFocus />
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn" disabled={busy || !v}>{t('admin_unlock')}</button>
      </form>
    </section>
  );
}

function Meter({ label, used, limit }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="meter">
      <div className="meter-top"><b>{label}</b><span>{mb(used)} / {mb(limit)}</span></div>
      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${Math.max(2, pct)}%` }} className={pct > 80 ? 'hot' : ''} /></div>
    </div>
  );
}

function Panel({ pin, onLock, onPin }) {
  const { t, state, people, person, refresh, deleteNote, toast, removePhoto, saveProfile } = useApp();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [text, setText] = useState('');
  const [chat, setChat] = useState([]);
  const [armed, setArmed] = useState(null);
  const [pins, setPins] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (fn, args = {}) => {
      const r = await api.admin(fn, { p_pin: pin, ...args });
      if (!r?.ok) {
        onLock();
        throw new Error('pin');
      }
      return r;
    },
    [pin, onLock],
  );

  const loadStats = useCallback(async () => {
    try {
      setStats(await call('admin_stats'));
    } catch (e) {
      console.error(e);
    }
  }, [call]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    if (tab === 'mod') api.adminLoadChat().then(setChat).catch(() => setChat([]));
  }, [tab]);

  const guard = (fn) => async (...a) => {
    setBusy(true);
    try {
      await fn(...a);
    } catch (e) {
      if (e.message !== 'pin') toast(t('err_generic'), 'err');
    } finally {
      setBusy(false);
    }
  };

  const post = guard(async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await call('admin_post', { p_text: text.trim() });
    setText('');
    await refresh();
    toast(t('admin_posted'));
  });
  const unpost = guard(async (id) => {
    await call('admin_remove_announcement', { p_id: id });
    await refresh();
  });
  const rmChat = guard(async (id) => {
    await api.deleteMessage(id);
    setChat((l) => l.filter((m) => m.id !== id));
  });
  const rmNote = guard(async (id) => {
    await deleteNote(id);
  });
  const reset = guard(async (id) => {
    if (armed !== id) {
      setArmed(id);
      setTimeout(() => setArmed((a) => (a === id ? null : a)), 4000);
      return;
    }
    const photos = state.profiles[id]?.data?.photos || [];
    for (const ph of photos) await removePhoto(ph).catch(() => {});
    await saveProfile(id, {});
    setArmed(null);
    toast(t('admin_reset_done'));
  });
  const backup = guard(async () => {
    const data = await api.adminBackup();
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `memoris-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  const changePin = guard(async (e) => {
    e.preventDefault();
    if (pins.b.length < 6) {
      toast(t('admin_pin_short'), 'err');
      return;
    }
    await call('admin_change_pin', { p_new: pins.b });
    onPin(pins.b);
    setPins({ a: '', b: '' });
    toast(t('admin_pin_changed'));
  });

  const TABS = ['stats', 'announce', 'mod', 'people', 'backup'];
  return (
    <section className="page admin">
      <header className="cab-head">
        <div>
          <h1 className="page-title">{t('admin_title')}</h1>
          <p className="page-lead">{t('admin_lead')}</p>
        </div>
        <div className="cab-actions">
          <button className="btn btn-ghost btn-small" onClick={onLock}><Icon name="lock" size={16} /> {t('admin_lock')}</button>
        </div>
      </header>

      <div className="tabs admin-tabs" role="tablist">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(`admin_tab_${k}`)}</button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="admin-card">
          {!stats ? <p className="muted">{t('loading')}</p> : (
            <>
              <ul className="stat-grid">
                {[['filled', `${stats.filled}/${people.length}`], ['notes', stats.notes], ['messages', stats.messages], ['votes', stats.votes], ['autographs', stats.autographs], ['capsules', stats.capsules]].map(([k, v]) => (
                  <li key={k}><b>{v}</b><span>{t(`admin_s_${k}`)}</span></li>
                ))}
              </ul>
              <Meter label={t('admin_photos', { n: stats.photo_files })} used={stats.photo_bytes} limit={1024 * MB} />
              <Meter label={t('admin_db')} used={stats.db_bytes} limit={500 * MB} />
              <p className="muted small">{t('admin_free')}</p>
              <button className="btn btn-small btn-ghost" onClick={loadStats}><Icon name="shuffle" size={16} /> {t('admin_refresh')}</button>
            </>
          )}
        </div>
      )}

      {tab === 'announce' && (
        <div className="admin-card">
          <form className="composer" onSubmit={post}>
            <label htmlFor="ann">{t('admin_ann_label')}</label>
            <textarea id="ann" rows={3} maxLength={ANNOUNCE_MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('admin_ann_ph')} />
            <div className="composer-row"><span className="count">{text.length}/{ANNOUNCE_MAX}</span><button className="btn" disabled={busy || !text.trim()}><Icon name="send" size={18} /> {t('admin_post')}</button></div>
          </form>
          <ul className="admin-list">
            {state.announcements.length === 0 && <li className="muted">{t('admin_ann_none')}</li>}
            {state.announcements.map((a) => (
              <li key={a.id}><span>{a.text}</span><button className="icon-btn" onClick={() => unpost(a.id)} aria-label={t('delete')}><Icon name="trash" size={18} /></button></li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'mod' && (
        <div className="admin-card">
          <h2>{t('admin_notes')}</h2>
          <ul className="admin-list">
            {state.notes.length === 0 && <li className="muted">{t('admin_none')}</li>}
            {state.notes.slice(0, 60).map((n) => (
              <li key={n.id}>
                <span><b>{firstName(person(n.from_id)?.name || '?')} → {firstName(person(n.to_id)?.name || '?')}:</b> {n.text}</span>
                <button className="icon-btn" onClick={() => rmNote(n.id)} aria-label={t('delete')}><Icon name="trash" size={18} /></button>
              </li>
            ))}
          </ul>
          <h2>{t('admin_chat')}</h2>
          <p className="muted small">{t('admin_dm_note')}</p>
          <ul className="admin-list">
            {chat.length === 0 && <li className="muted">{t('admin_none')}</li>}
            {chat.map((m) => (
              <li key={m.id}>
                <span><b>{firstName(person(m.from_id)?.name || '?')}:</b> {m.text}</span>
                <button className="icon-btn" onClick={() => rmChat(m.id)} aria-label={t('delete')}><Icon name="trash" size={18} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'people' && (
        <div className="admin-card">
          <p className="muted small">{t('admin_reset_note')}</p>
          <ul className="admin-list people">
            {people.map((p) => (
              <li key={p.id}>
                <Avatar p={p} className="mini round" />
                <span><b>{p.name}</b>{p.filled ? '' : ` · ${t('admin_empty')}`}</span>
                <button className={`btn btn-small ${armed === p.id ? '' : 'btn-ghost'}`} onClick={() => reset(p.id)} disabled={busy}>{armed === p.id ? t('admin_confirm') : t('admin_reset')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'backup' && (
        <div className="admin-card">
          <p>{t('admin_backup_text')}</p>
          <button className="btn" onClick={backup} disabled={busy}><Icon name="download" size={18} /> {t('admin_backup')}</button>
          <form className="composer admin-pin" onSubmit={changePin}>
            <label htmlFor="newpin">{t('admin_new_pin')}</label>
            <input id="newpin" type="password" inputMode="numeric" autoComplete="new-password" value={pins.b} onChange={(e) => setPins({ ...pins, b: e.target.value })} />
            <button className="btn btn-ghost btn-small" disabled={busy || pins.b.length < 6}>{t('admin_change')}</button>
          </form>
        </div>
      )}
    </section>
  );
}
