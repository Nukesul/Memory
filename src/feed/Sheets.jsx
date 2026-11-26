import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { href, go, useRoute } from '../router';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { ConvAvatar, convName } from '../messenger/parts';
import { openDirect, send, useMessenger } from '../messenger/store';
import { CAPTION_MAX, editCaption, likers, removePost, toggleSave } from './store';

const postUrl = (id) => `${location.origin}${location.pathname}#/post/${id}`;

/** The ··· menu of a post. */
export function PostMenu({ post, onClose, onShare }) {
  const { t, me, isAdmin, toast } = useApp();
  const [section, arg] = useRoute();
  const [mode, setMode] = useState('list');
  const [text, setText] = useState(post.caption);
  const [busy, setBusy] = useState(false);
  const mine = post.author_id === me?.id;
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast(t(ok));
      onClose();
    } catch {
      toast(t('post_err'), 'err');
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ url: postUrl(post.id) });
      else {
        await navigator.clipboard.writeText(postUrl(post.id));
        toast(t('link_copied'));
      }
    } catch {
      /* cancelled */
    }
    onClose();
  };
  const del = () =>
    run(async () => {
      await removePost(post.id);
      if (section === 'post' && Number(arg) === post.id) go('');
    }, 'post_deleted');

  return (
    <BottomSheet onClose={onClose} labelId="pm-title">
      <div className="sheet-body msg-menu post-menu">
        <h2 id="pm-title" className="visually-hidden">{t('post_actions')}</h2>
        {mode === 'edit' ? (
          <form
            className="pm-edit"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => editCaption(post.id, text), 'post_caption_saved');
            }}
          >
            <label htmlFor="pm-cap" className="pm-label">{t('post_caption')}</label>
            <textarea id="pm-cap" value={text} onChange={(e) => setText(e.target.value.slice(0, CAPTION_MAX))} rows={5} maxLength={CAPTION_MAX} autoFocus placeholder={t('post_caption_ph')} />
            <small className="pm-count">{text.length} / {CAPTION_MAX}</small>
            {!post.media.length && !text.trim() && <small className="pm-warn">{t('post_empty_caption')}</small>}
            <div className="row-actions">
              <button type="submit" className="btn" disabled={busy || (!post.media.length && !text.trim())}>{t('save')}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode('list')}>{t('cancel')}</button>
            </div>
            <p className="muted small">{t('post_edit_note')}</p>
          </form>
        ) : mode === 'delete' ? (
          <div className="mm-confirm">
            <p>{t('post_delete_q')}</p>
            {post.legacy && <p className="muted small">{t('post_delete_legacy')}</p>}
            <div className="row-actions">
              <button type="button" className="btn btn-danger" onClick={del} disabled={busy}>{busy ? t('auth_signing') : t('delete')}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode('list')}>{t('cancel')}</button>
            </div>
          </div>
        ) : (
          <ul className="mm-list">
            {section !== 'post' && (
              <li><a className="mm-link" href={href(`post/${post.id}`)} onClick={onClose}><Icon name="comment" size={20} /> {t('post_open')}</a></li>
            )}
            <li><button type="button" onClick={() => run(() => toggleSave(post.id), post.saved ? 'post_unsaved' : 'post_saved')}><Icon name="bookmark" size={20} /> {t(post.saved ? 'post_unsave' : 'post_save')}</button></li>
            <li><button type="button" onClick={() => { onClose(); onShare(); }}><Icon name="send" size={20} /> {t('post_send')}</button></li>
            <li><button type="button" onClick={copy}><Icon name="link" size={20} /> {t('post_copy_link')}</button></li>
            {mine && <li><button type="button" onClick={() => setMode('edit')}><Icon name="edit" size={20} /> {t('post_edit_caption')}</button></li>}
            {(mine || isAdmin) && <li><button type="button" className="danger" onClick={() => setMode('delete')}><Icon name="trash" size={20} /> {t('post_delete')}</button></li>}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}

/** Send a post to one or more chats (existing ones, or a new direct chat with a classmate). */
export function ShareSheet({ post, onClose }) {
  const { t, people, me, toast } = useApp();
  const inbox = useMessenger((s) => s.inbox);
  const [picked, setPicked] = useState([]); // "c<id>" for a chat, "p<id>" for a person without one
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => {
    const withDirect = new Set(inbox.filter((r) => r.kind === 'direct').flatMap((r) => r.members || []));
    const chats = inbox.map((r) => ({ key: `c${r.id}`, row: r, name: convName(r, people, me?.id, t) }));
    const others = people.filter((p) => p.id !== me?.id && !withDirect.has(p.id)).map((p) => ({ key: `p${p.id}`, p, name: p.name }));
    const qq = q.trim().toLowerCase();
    return [...chats, ...others].filter((x) => !qq || x.name.toLowerCase().includes(qq));
  }, [inbox, people, me, q, t]);
  const toggle = (k) => setPicked((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));
  const submit = async () => {
    if (busy || !picked.length) return;
    setBusy(true);
    const att = { type: 'post', post_id: post.id, author_id: post.author_id, thumb: post.media[0]?.thumb || null, caption: post.caption.slice(0, 140) };
    let ok = 0;
    for (const k of picked) {
      try {
        const id = k[0] === 'c' ? Number(k.slice(1)) : await openDirect(Number(k.slice(1)));
        await send(id, { text: note, post: att });
        ok++;
      } catch {
        /* counted below */
      }
    }
    if (ok === picked.length) {
      toast(t('post_sent', { n: ok }));
      onClose();
    } else {
      toast(t('post_sent_partly', { ok, n: picked.length }), 'err');
      setBusy(false);
    }
  };
  return (
    <BottomSheet onClose={onClose} labelId="ps-title">
      <div className="sheet-body pick-sheet">
        <h2 id="ps-title">{t('post_send')}</h2>
        <div className="search-box">
          <Icon name="search" size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} />
        </div>
        <ul className="pick-list">
          {rows.map((x) => {
            const on = picked.includes(x.key);
            return (
              <li key={x.key}>
                <button type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => toggle(x.key)}>
                  {x.row ? <ConvAvatar row={x.row} size={36} /> : <Avatar p={x.p} className="mini round" />}
                  <span className="pick-name">{x.name}</span>
                  <span className={`pick-check ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
                </button>
              </li>
            );
          })}
          {!rows.length && <li className="muted small pick-empty">{t('search_nothing')}</li>}
        </ul>
        {picked.length > 0 && (
          <input className="ps-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder={t('post_send_note')} aria-label={t('post_send_note')} />
        )}
        <button type="button" className="btn btn-big" disabled={!picked.length || busy} onClick={submit}>
          {busy ? t('auth_signing') : t('msg_send_n', { n: picked.length })}
        </button>
      </div>
    </BottomSheet>
  );
}

/** Who liked a post. */
export function LikersSheet({ post, onClose }) {
  const { t, person } = useApp();
  const [ids, setIds] = useState(null);
  useEffect(() => {
    likers(post.id).then(setIds).catch(() => setIds([]));
  }, [post.id, post.likes]);
  return (
    <BottomSheet onClose={onClose} labelId="lk-title">
      <div className="sheet-body pick-sheet">
        <h2 id="lk-title">{t('post_likes_title')}</h2>
        {ids == null ? (
          <p className="muted">{t('loading')}</p>
        ) : (
          <ul className="pick-list">
            {ids.map((id) => {
              const p = person(id);
              return (
                <li key={id}>
                  <a className="pick-row" href={href(`p/${id}`)} onClick={onClose}>
                    <Avatar p={p} className="mini round" />
                    <span className="pick-name">{p?.name || '?'}</span>
                    <Icon name="heart" size={18} className="fill heart-ico" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
