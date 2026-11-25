import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { ANNOUNCE_MAX } from '../config';
import { auth } from '../store';
import { api } from '../store';
import { href } from '../router';
import { firstName } from '../roster';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';

const MB = 1024 * 1024;
const mb = (n) => `${(n / MB).toFixed(n > 10 * MB ? 0 : 1)} MB`;

export default function Admin() {
  const { t, me, isAdmin } = useApp();
  if (!me || !isAdmin) {
    return (
      <section className="page admin">
        <h1 className="page-title">{t('admin_title')}</h1>
        <p className="empty">{t('admin_only')}</p>
        <a className="btn" href={href('me')}>{t('open_cabinet')}</a>
      </section>
    );
  }
  return <Panel />;
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

function Panel() {
  const { t, state, people, person, refresh, deleteNote, toast, removePhoto, saveProfile } = useApp();
  const [tab, setTab] = useState('members');
  const [stats, setStats] = useState(null);
  const [text, setText] = useState('');
  const [chat, setChat] = useState([]);
  const [armed, setArmed] = useState(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (fn, args = {}) => {
      const r = await api.admin(fn, args);
      if (!r?.ok) throw new Error('forbidden');
      return r;
    },
    [],
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
      toast(t('err_generic'), 'err');
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
  const TABS = ['members', 'stats', 'announce', 'mod', 'people', 'backup'];
  return (
    <section className="page admin">
      <header className="cab-head">
        <div>
          <h1 className="page-title">{t('admin_title')}</h1>
          <p className="page-lead">{t('admin_lead')}</p>
        </div>
      </header>

      <div className="tabs admin-tabs" role="tablist">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(`admin_tab_${k}`)}</button>
        ))}
      </div>

      {tab === 'members' && <Members />}

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
        </div>
      )}
    </section>
  );
}

const fmtDate = (lang, iso) => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const ERRS = { already_registered: 'adm_m_err_registered', no_account: 'adm_m_err_noacc', cannot_disable_self: 'adm_m_err_self' };

/** Accounts: invite classmates, send password-reset links, switch an account off. */
function Members() {
  const { t, lang, people, toast, meId } = useApp();
  const [rows, setRows] = useState(null);
  const [link, setLink] = useState(null); // { person, kind, url } — shown once
  const [busy, setBusy] = useState(null);
  const load = useCallback(() => auth.members().then(setRows).catch(() => setRows([])), []);
  useEffect(() => {
    load();
  }, [load]);
  const by = Object.fromEntries((rows || []).map((r) => [r.person_id, r]));
  const base = `${location.origin}${location.pathname}`;

  const make = async (p, kind) => {
    setBusy(p.id);
    try {
      const code = await auth.createInvite(p.id, kind);
      setLink({ person: p, kind, url: `${base}#/${kind}/${code}` });
      await load();
    } catch (e) {
      const key = Object.keys(ERRS).find((k) => e.message.includes(k));
      toast(t(key ? ERRS[key] : 'err_generic'), 'err');
    } finally {
      setBusy(null);
    }
  };
  const act = async (p, fn) => {
    setBusy(p.id);
    try {
      await fn();
      await load();
    } catch (e) {
      const key = Object.keys(ERRS).find((k) => e.message.includes(k));
      toast(t(key ? ERRS[key] : 'err_generic'), 'err');
    } finally {
      setBusy(null);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast(t('adm_m_copied'));
    } catch {
      toast(t('err_generic'), 'err');
    }
  };
  const share = () => navigator.share?.({ title: 'Memoris', text: t(link.kind === 'join' ? 'adm_m_share_join' : 'adm_m_share_reset', { name: link.person.name }), url: link.url }).catch(() => {});

  if (!rows) return <div className="loading" role="status"><span className="spin" /> {t('loading')}</div>;
  const registered = people.filter((p) => by[p.id]?.email).length;

  return (
    <div className="admin-card">
      <p className="muted small">{t('adm_m_lead', { n: registered, total: people.length })}</p>
      {link && (
        <div className="invite-link" role="status">
          <b>{t(link.kind === 'join' ? 'adm_m_link_join' : 'adm_m_link_reset', { name: link.person.name })}</b>
          <input readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label={t('adm_m_link_label')} />
          <small>{t(link.kind === 'join' ? 'adm_m_once_join' : 'adm_m_once_reset')}</small>
          <div className="row">
            <button type="button" className="btn btn-small" onClick={copy}><Icon name="link" size={16} /> {t('adm_m_copy')}</button>
            {navigator.share && <button type="button" className="btn btn-small btn-ghost" onClick={share}><Icon name="share" size={16} /> {t('adm_m_share')}</button>}
            <button type="button" className="link-btn" onClick={() => setLink(null)}>{t('close')}</button>
          </div>
        </div>
      )}
      <ul className="admin-list people members">
        {people.map((p) => {
          const r = by[p.id];
          let status = t('adm_m_none');
          if (r?.email) status = r.disabled ? t('adm_m_disabled') : t('adm_m_registered', { email: r.email });
          else if (r?.invite_kind === 'join') status = t('adm_m_invited', { date: fmtDate(lang, r.invite_expires) });
          return (
            <li key={p.id} className={r?.disabled ? 'off' : ''}>
              <Avatar p={p} className="mini round" />
              <span className="m-info"><b>{p.name}</b><small>{status}{r?.email && r.invite_kind === 'reset' ? ` · ${t('adm_m_reset_open')}` : ''}</small></span>
              <span className="m-actions">
                {!r?.email && (
                  <button className="btn btn-small" disabled={busy === p.id} onClick={() => make(p, 'join')}>{t(r?.invite_kind ? 'adm_m_reinvite' : 'adm_m_invite')}</button>
                )}
                {!r?.email && r?.invite_kind && (
                  <button className="btn btn-small btn-ghost" disabled={busy === p.id} onClick={() => act(p, () => auth.revokeInvites(p.id))}>{t('adm_m_revoke')}</button>
                )}
                {r?.email && (
                  <button className="btn btn-small btn-ghost" disabled={busy === p.id} onClick={() => make(p, 'reset')}>{t('adm_m_reset')}</button>
                )}
                {r?.email && p.id !== meId && (
                  <button className="btn btn-small btn-ghost" disabled={busy === p.id} onClick={() => act(p, () => auth.setDisabled(p.id, !r.disabled))}>{t(r.disabled ? 'adm_m_enable' : 'adm_m_disable')}</button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
