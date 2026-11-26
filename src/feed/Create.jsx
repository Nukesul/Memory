import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { go } from '../router';
import { CLOUD } from '../store';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { CAPTION_MAX, MAX_PHOTOS, create, prepare, storageUsed } from './store';

const GB = 1024 ** 3;
const ORIG_LIMIT = 700 * 1024 ** 2; // stop offering originals before the free 1 GB runs out
const mb = (b) => (b / 1024 ** 2 < 10 ? (b / 1024 ** 2).toFixed(1) : Math.round(b / 1024 ** 2));

// What you picked stays while you look around the app, until you publish or clear it.
const draft = { items: [], caption: '', original: false };
let seq = 0;

/** #/create: new post with up to 10 photos (or just text). */
export default function Create() {
  const { t, me, toast } = useApp();
  const [items, setItems] = useState(draft.items);
  const [caption, setCaption] = useState(draft.caption);
  const [original, setOriginal] = useState(draft.original);
  const [used, setUsed] = useState(null);
  const [phase, setPhase] = useState(null); // null | {step:'prep'|'up', k, n, p}
  const [error, setError] = useState(null);
  const picker = useRef(null);
  const prepared = useRef(new Map()); // item key + original flag -> processed sizes (so a retry does not redo the work)

  useEffect(() => {
    draft.items = items;
    draft.caption = caption;
    draft.original = original;
  }, [items, caption, original]);
  useEffect(() => {
    storageUsed().then(setUsed).catch(() => setUsed(null));
  }, []);
  const origBlocked = used != null && used > ORIG_LIMIT;
  useEffect(() => {
    if (origBlocked && original) setOriginal(false);
  }, [origBlocked]); // eslint-disable-line

  const add = (files) => {
    const imgs = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    const room = MAX_PHOTOS - items.length;
    if (imgs.length > room) toast(t('create_max', { n: MAX_PHOTOS }), 'err');
    const next = imgs.slice(0, Math.max(0, room)).map((file) => ({ key: `f${++seq}`, file, url: URL.createObjectURL(file) }));
    if (next.length) setItems((l) => [...l, ...next]);
    setError(null);
  };
  const removeAt = (k) =>
    setItems((l) => {
      URL.revokeObjectURL(l[k].url);
      return l.filter((_, i) => i !== k);
    });
  const move = (k, d) =>
    setItems((l) => {
      const j = k + d;
      if (j < 0 || j >= l.length) return l;
      const next = l.slice();
      [next[k], next[j]] = [next[j], next[k]];
      return next;
    });
  const clear = () => {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setCaption('');
    setError(null);
  };

  const busy = Boolean(phase);
  const can = !busy && (items.length > 0 || caption.trim().length > 0);
  const submit = async () => {
    if (!can) return;
    setError(null);
    try {
      const photos = [];
      for (let k = 0; k < items.length; k++) {
        setPhase({ step: 'prep', k: k + 1, n: items.length, p: 0 });
        const key = `${items[k].key}:${original ? 1 : 0}`;
        if (!prepared.current.has(key)) {
          const [ready] = await prepare([items[k].file], { original });
          prepared.current.set(key, ready);
        }
        photos.push(prepared.current.get(key));
      }
      setPhase({ step: 'up', p: 0 });
      const id = await create({ caption, photos }, (p) => setPhase({ step: 'up', p }));
      items.forEach((it) => URL.revokeObjectURL(it.url));
      prepared.current.clear();
      draft.items = [];
      draft.caption = '';
      setItems([]);
      setCaption('');
      setPhase(null);
      toast(t('create_done'));
      go(`post/${id}`);
    } catch (e) {
      setPhase(null);
      const m = e?.message;
      setError(m === 'not-image' ? 'create_err_image' : m === 'network' ? 'post_err_offline' : m === 'too_big' ? 'create_err_big' : m === 'storage_full' ? 'create_err_demo_full' : 'create_err');
    }
  };

  const total = items.length;
  return (
    <section className="page narrow create-page">
      <div className="post-page-head">
        <button type="button" className="page-back" onClick={() => (history.length > 1 ? history.back() : go(''))} aria-label={t('back')} disabled={busy}><Icon name="left" size={22} /></button>
        <h1 className="page-title">{t('create_post_title')}</h1>
        {(total > 0 || caption) && !busy && <button type="button" className="link-btn cp-clear" onClick={clear}>{t('clear')}</button>}
      </div>

      <div className="cp-photos">
        {items.map((it, k) => (
          <figure key={it.key} className="cp-item">
            <img src={it.url} alt="" />
            <span className="cp-n">{k + 1}</span>
            {!busy && (
              <span className="cp-tools">
                <button type="button" onClick={() => move(k, -1)} disabled={k === 0} aria-label={t('create_move_left')}><Icon name="left" size={16} /></button>
                <button type="button" onClick={() => move(k, 1)} disabled={k === total - 1} aria-label={t('create_move_right')}><Icon name="right" size={16} /></button>
                <button type="button" onClick={() => removeAt(k)} aria-label={t('delete')}><Icon name="close" size={16} /></button>
              </span>
            )}
          </figure>
        ))}
        {total < MAX_PHOTOS && !busy && (
          <button type="button" className="cp-add" onClick={() => picker.current?.click()}>
            <Icon name={total ? 'plus' : 'camera'} size={total ? 24 : 32} />
            <span>{total ? t('create_add_more', { n: MAX_PHOTOS - total }) : t('create_pick')}</span>
          </button>
        )}
        <input
          ref={picker}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            add(e.target.files || []);
            e.target.value = '';
          }}
        />
      </div>
      {total > 1 && <p className="muted small cp-hint">{t('create_order_hint')}</p>}

      <div className="cp-caption">
        <Avatar p={me} className="mini round" />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))}
          rows={4}
          maxLength={CAPTION_MAX}
          placeholder={t('post_caption_ph')}
          aria-label={t('post_caption')}
          disabled={busy}
        />
      </div>
      <small className="cp-count">{caption.length} / {CAPTION_MAX}</small>

      {total > 0 && (
        <label className={`cp-orig ${origBlocked ? 'off' : ''}`}>
          <input type="checkbox" checked={original} disabled={busy || origBlocked} onChange={(e) => setOriginal(e.target.checked)} />
          <span>
            <b>{t('create_orig')}</b>
            <small>{origBlocked ? t('create_orig_full') : t('create_orig_note')}</small>
          </span>
        </label>
      )}
      {CLOUD && used != null && (
        <p className="muted small cp-storage">{t('create_storage', { used: mb(used), total: GB / 1024 ** 3 })}</p>
      )}
      {!CLOUD && <p className="muted small cp-storage">{t('create_demo_note')}</p>}

      {error && (
        <p className="cp-error" role="alert">
          <Icon name="info" size={18} /> {t(error)}
        </p>
      )}

      <button type="button" className="btn btn-big cp-submit" onClick={submit} disabled={!can}>
        {phase?.step === 'prep'
          ? t('create_preparing', { k: phase.k, n: phase.n })
          : phase?.step === 'up'
            ? t('create_uploading', { p: Math.round(phase.p * 100) })
            : error
              ? t('retry')
              : t('create_publish')}
      </button>
      {busy && (
        <div className="cp-progress" aria-hidden="true">
          <i style={{ width: `${phase.step === 'prep' ? ((phase.k - 1) / phase.n) * 40 : 40 + phase.p * 60}%` }} />
        </div>
      )}
      {busy && <p className="muted small cp-stay">{t('create_stay')}</p>}
    </section>
  );
}
