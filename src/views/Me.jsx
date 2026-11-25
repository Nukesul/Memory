import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { COUNTRY_ORDER, FIELDS, FUN_FIELDS, MAX_PHOTOS } from '../config';
import { byId } from '../roster';
import { sampleFor } from '../samples';
import { asset, buildPerson, completion } from '../people';
import { processImage } from '../image';
import { href } from '../router';
import { ls } from '../store';
import { Sheet } from '../components/Sheet';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';
import { AccountSettings, NotifySettings } from '../components/NotifySettings';

export default function Me() {
  const { me } = useApp();
  return me ? <Editor key={me.id} p={me} /> : null;
}

/* ───────────── Editor: the cabinet ───────────── */
function Editor({ p }) {
  const { t, lang, country, logout, saveProfile, uploadPhoto, removePhoto, toast, cloud, isAdmin } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const draftKey = `memoris:draft:${p.id}`;
  const sample = sampleFor(p.id, lang);

  const [draft, setDraft] = useState(() => {
    const stored = cloud ? ls.get(draftKey, null) : null;
    return stored || { ...p.data, avatar: p.avatar, photos: p.photos };
  });
  const [status, setStatus] = useState('idle'); // idle | dirty | saving | saved | error
  const [stamp, setStamp] = useState(0);
  const [busy, setBusy] = useState(0);
  const [tab, setTab] = useState('edit');

  const latest = useRef(draft);
  const dirty = useRef(false);
  const inflight = useRef(false);
  const again = useRef(false);
  const timer = useRef(null);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    if (inflight.current) {
      again.current = true;
      return;
    }
    inflight.current = true;
    setStatus('saving');
    try {
      do {
        again.current = false;
        dirty.current = false;
        await saveProfile(p.id, latest.current);
      } while (again.current || dirty.current);
      if (cloud) ls.del(draftKey);
      setStatus('saved');
      setStamp((n) => n + 1);
    } catch (e) {
      console.error(e);
      dirty.current = true;
      setStatus('error');
    } finally {
      inflight.current = false;
    }
  }, [p.id, saveProfile, cloud, draftKey]);

  const change = useCallback(
    (patch) => {
      const next = { ...latest.current, ...(typeof patch === 'function' ? patch(latest.current) : patch) };
      latest.current = next;
      setDraft(next);
      dirty.current = true;
      setStatus('dirty');
      if (cloud) ls.set(draftKey, next);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 900);
    },
    [flush, cloud, draftKey],
  );

  // Save when the tab is hidden; warn if something is unsaved.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush();
    const onUnload = (e) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
      flush();
    };
  }, [flush]);

  const addFiles = async (files, kind) => {
    let list = [...files];
    if (kind === 'photo') {
      const room = MAX_PHOTOS - (latest.current.photos || []).length;
      if (list.length > room) toast(t('photos_max', { n: MAX_PHOTOS }), 'err');
      list = list.slice(0, Math.max(room, 0));
    } else list = list.slice(0, 1);
    for (const f of list) {
      setBusy((b) => b + 1);
      try {
        const img = await processImage(f);
        const up = await uploadPhoto(p.id, img);
        if (kind === 'avatar') {
          const old = latest.current.avatar;
          change({ avatar: up });
          if (old && !old.seed) removePhoto(old).catch(() => {});
        } else change((d) => ({ photos: [...(d.photos || []), { ...up, cap: '' }] }));
      } catch (e) {
        console.error(e);
        toast(e.message === 'storage-full' ? t('err_full') : t('err_photo'), 'err');
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };
  const dropPhoto = (i) => {
    const gone = latest.current.photos[i];
    change((d) => ({ photos: d.photos.filter((_, k) => k !== i) }));
    if (gone && !gone.seed) removePhoto(gone).catch(() => {});
  };
  const setCaption = (i, cap) => change((d) => ({ photos: d.photos.map((ph, k) => (k === i ? { ...ph, cap } : ph)) }));

  const pageLink = `${location.origin}${location.pathname}#/p/${p.id}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageLink);
      toast(t('link_copied'));
    } catch {
      toast(pageLink);
    }
  };
  const downloadData = () => {
    const out = { name: shownName, country: shownCountry, ...latest.current };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = `2J-${shownName.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const resetAll = () => {
    if (!confirmReset) return setConfirmReset(true);
    [latest.current.avatar, ...(latest.current.photos || [])].filter((x) => x && !x.seed).forEach((x) => removePhoto(x).catch(() => {}));
    const fresh = buildPerson(byId(p.id), null);
    const next = { avatar: fresh.avatar, photos: fresh.photos };
    latest.current = next;
    setDraft(next);
    dirty.current = true;
    setStatus('dirty');
    setConfirmReset(false);
    flush();
    toast(t('reset_done'));
  };

  const prog = completion(draft);
  const checkLabels = ['c_photo', 'c_dream', 'c_memory', 'c_quote', 'c_message', 'c_photos', 'c_fun'];
  const shownName = (draft.name || '').trim() || p.baseName;
  const shownCountry = draft.country || p.baseCountry;
  const live = { ...p, name: shownName, country: shownCountry, avatarY: draft.avatarY ?? p.avatarY };
  const photos = draft.photos || [];
  const statusText = { idle: '', dirty: t('st_dirty'), saving: t('st_saving'), saved: t('st_saved'), error: t('st_error') }[status];

  return (
    <section className="page cabinet">
      <header className="cab-head">
        <div>
          <p className="cab-hi">{t('cab_hi', { name: shownName.split(' ')[0] })}</p>
          <h1 className="page-title">{t('cab_title')}</h1>
          <p className="cab-who">
            <Flag code={shownCountry} /> {shownName} · {country(shownCountry)}
          </p>
        </div>
        <div className="cab-actions">
          <a className="btn btn-ghost btn-small" href={href(`p/${p.id}`)}>{t('view_page')}</a>
          {isAdmin && <a className="btn btn-small" href={href('admin')}><Icon name="lock" size={16} /> {t('admin_title')}</a>}
          <button className="btn btn-ghost btn-small" onClick={() => { flush().then(logout); }}>{t('logout')}</button>
        </div>
      </header>

      <div className="progress-card">
        <div className="progress-top">
          <b>{t('progress', { n: prog.done, total: prog.total })}</b>
          <span className={`save-state ${status}`} role="status" aria-live="polite">
            {status === 'saved' && <span key={stamp} className="stamp-pop" aria-hidden="true">済</span>}
            {statusText}
            {status === 'error' && <button className="link-btn" onClick={flush}>{t('retry')}</button>}
          </span>
        </div>
        <ul className="checks">
          {prog.checks.map((ok, i) => (
            <li key={i} className={ok ? 'ok' : ''}>
              <Icon name={ok ? 'check' : 'plus'} size={14} /> {t(checkLabels[i])}
            </li>
          ))}
        </ul>
        {!cloud && <p className="demo-note">{t('demo_note')}</p>}
      </div>

      <div className="tabs" role="tablist">
        {['edit', 'preview'].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {t(`tab_${k}`)}
          </button>
        ))}
      </div>

      <div className={`cab-grid tab-${tab}`}>
        <form className="cab-form" onSubmit={(e) => { e.preventDefault(); flush(); }}>
          <p className="intro">{t('cab_intro')}</p>

          <fieldset>
            <legend>{t('sec_name')}</legend>
            <label className="field">
              <span className="field-label">{t('f_name')}</span>
              <span className="field-hint">{t('h_name')}</span>
              <input value={draft.name ?? p.baseName} maxLength={40} autoComplete="off" onChange={(e) => change({ name: e.target.value })} onBlur={(e) => !e.target.value.trim() && change({ name: undefined })} />
            </label>
            <label className="field">
              <span className="field-label">{t('f_country')}</span>
              <span className="field-hint">{t('h_country')}</span>
              <select value={shownCountry} onChange={(e) => change({ country: e.target.value })}>
                {COUNTRY_ORDER.map((c) => (
                  <option key={c} value={c}>{country(c)}</option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>{t('sec_portrait')}</legend>
            <div className="portrait-edit">
              <div className="portrait-slot">
                <Avatar p={{ ...live, avatar: draft.avatar || null }} full />
                {busy > 0 && <span className="spin" aria-label={t('uploading')} />}
              </div>
              <div>
                <label className="btn btn-ghost">
                  <Icon name="camera" size={18} /> {draft.avatar && !draft.avatar.seed ? t('photo_change') : t('photo_upload')}
                  <input type="file" accept="image/*" hidden onChange={(e) => { addFiles(e.target.files, 'avatar'); e.target.value = ''; }} />
                </label>
                <p className="hint">{t('portrait_hint')}</p>
                {draft.avatar && (
                  <label className="range">
                    <span>{t('f_avatarY')}</span>
                    <input type="range" min="0" max="100" step="5" value={draft.avatarY ?? p.avatarY ?? 20} onChange={(e) => change({ avatarY: Number(e.target.value) })} />
                  </label>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>{t('sec_about')}</legend>
            {FIELDS.map((f) => (
              <label key={f.key} className="field">
                <span className="field-label">{t(`f_${f.key}`)}</span>
                <span className="field-hint">{t(`h_${f.key}`)}</span>
                {f.rows === 1 ? (
                  <input value={draft[f.key] || ''} maxLength={f.max} onChange={(e) => change({ [f.key]: e.target.value })} placeholder={sample[f.key]} lang={f.key === 'jpWord' ? 'ja' : undefined} />
                ) : (
                  <textarea value={draft[f.key] || ''} maxLength={f.max} rows={f.rows} onChange={(e) => change({ [f.key]: e.target.value })} placeholder={sample[f.key]} />
                )}
                <span className="count">{(draft[f.key] || '').length}/{f.max}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>{t('sec_fun')}</legend>
            <p className="hint wide">{t('h_fun')}</p>
            <div className="fun-grid">
              {FUN_FIELDS.map((f) => (
                <label key={f.key} className="field fun">
                  <span className="field-label"><span aria-hidden="true">{f.emoji}</span> {t(`f_${f.key}`)}</span>
                  <span className="field-hint">{t(`h_${f.key}`)}</span>
                  <input type={f.type || 'text'} value={draft[f.key] || ''} maxLength={f.max} onChange={(e) => change({ [f.key]: e.target.value })} placeholder={f.type ? undefined : sample[f.key]} />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t('sec_photos', { n: photos.length, max: MAX_PHOTOS })}</legend>
            <ul className="photo-edit">
              {photos.map((ph, i) => (
                <li key={ph.full + i}>
                  <div className="thumb">
                    <img src={asset(ph.thumb)} alt="" loading="lazy" />
                    <button type="button" className="thumb-del" onClick={() => dropPhoto(i)} aria-label={t('delete')}>
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <input value={ph.cap || ''} maxLength={60} onChange={(e) => setCaption(i, e.target.value)} placeholder={t('caption')} aria-label={t('caption')} />
                </li>
              ))}
              {photos.length < MAX_PHOTOS && (
                <li>
                  <label className="add-tile">
                    {busy > 0 ? <span className="spin" aria-label={t('uploading')} /> : <Icon name="plus" size={28} />}
                    <span>{t('photo_add')}</span>
                    <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, 'photo'); e.target.value = ''; }} />
                  </label>
                </li>
              )}
            </ul>
          </fieldset>

          <button className="btn btn-big" type="submit" disabled={status === 'saving'}>
            {t('save_now')}
          </button>

          <NotifySettings />
          <AccountSettings />

          <div className="cab-tools">
            <button type="button" className="btn btn-small btn-ghost" onClick={copyLink}>
              <Icon name="link" size={16} /> {t('copy_link')}
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={downloadData}>
              <Icon name="download" size={16} /> {t('download_data')}
            </button>
            <button type="button" className={`btn btn-small ${confirmReset ? 'btn-danger' : 'btn-ghost'}`} onClick={resetAll} onBlur={() => setConfirmReset(false)}>
              <Icon name="trash" size={16} /> {confirmReset ? t('reset_confirm') : t('reset_page')}
            </button>
          </div>
        </form>

        <aside className="cab-preview" aria-label={t('tab_preview')}>
          <p className="preview-label">{t('preview_label')}</p>
          <Sheet p={{ ...live, filled: p.filled || prog.done > 0 }} data={draft} examples />
        </aside>
      </div>
    </section>
  );
}
