import { memo, useRef } from 'react';
import { useApp } from '../app-context';
import { firstName } from '../roster';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { ChatImage, VoicePlayer, clock, linkify, previewText, systemText, useFileUrl } from './parts';

const LONG_MS = 420;
const SWIPE = 64;

function Images({ m, local, onOpen }) {
  const imgs = local ? local.map((u, i) => ({ type: 'image', path: `local-${i}`, url: u })) : (m.attachments || []).filter((a) => a.type === 'image');
  if (!imgs.length) return null;
  return (
    <span className={`chat-imgs n${Math.min(imgs.length, 4)}`}>
      {imgs.slice(0, 4).map((a, i) => (
        <span key={a.path} className="chat-img-wrap">
          <ChatImage att={a} localUrl={a.url} onOpen={local ? null : () => onOpen(m, i)} />
          {i === 3 && imgs.length > 4 && <span className="more-n">+{imgs.length - 4}</span>}
        </span>
      ))}
    </span>
  );
}

function Quote({ quoted, onJump }) {
  const { t, people, me } = useApp();
  if (!quoted) return <span className="quote gone">{t('chat_orig_gone')}</span>;
  const who = quoted.from_id === me?.id ? t('chat_you') : firstName(people.find((p) => p.id === quoted.from_id)?.name || '?');
  return (
    <button type="button" className="quote" onClick={(e) => { e.stopPropagation(); onJump(quoted.id); }}>
      <b>{who}</b>
      <span>{previewText(quoted, t)}</span>
    </button>
  );
}

/**
 * One message. Long press (or right click) opens the actions; swiping right replies.
 * `item` is either a stored message or a not-yet-sent one from the outbox (status sending/failed).
 */
function Bubble({ item, mine, showName, showAvatar, grouped, quoted, readState, flash, onMenu, onReply, onJump, onOpenImages, onRetry, onDiscard, onReact }) {
  const { t, lang, people, me } = useApp();
  const row = useRef(null);
  const press = useRef(null);
  const from = people.find((p) => p.id === item.from_id);
  const pending = Boolean(item.status);
  const deleted = Boolean(item.deleted_at);

  if (item.kind === 'system') {
    return <p className="sys-line">{systemText(item, people, t)}</p>;
  }

  const startPress = (e) => {
    if (pending || deleted || e.button > 0) return;
    const p = e.touches?.[0] || e;
    press.current = { x: p.clientX, y: p.clientY, dx: 0, t: setTimeout(() => {
      press.current && (press.current.fired = true);
      navigator.vibrate?.(8);
      onMenu(item);
    }, LONG_MS) };
  };
  const movePress = (e) => {
    const s = press.current;
    if (!s) return;
    const p = e.touches?.[0] || e;
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (Math.abs(dy) > 12 || Math.abs(dx) > 12) clearTimeout(s.t);
    // Swipe to reply: only to the right, mostly horizontal.
    if (e.pointerType !== 'mouse' && dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      s.dx = Math.min(dx, SWIPE + 16);
      if (row.current) row.current.style.transform = `translateX(${s.dx}px)`;
    }
  };
  const endPress = () => {
    const s = press.current;
    if (!s) return;
    clearTimeout(s.t);
    if (row.current) row.current.style.transform = '';
    if (s.dx >= SWIPE) {
      navigator.vibrate?.(8);
      onReply(item);
    }
    press.current = null;
  };

  const rx = Object.entries(item.reactions || {}).filter(([, ids]) => ids.length);
  const audio = (item.attachments || []).find((a) => a.type === 'audio');
  const forwardedFrom = item.forwarded_from ? true : false;

  return (
    <div
      ref={row}
      data-mid={item.id || item.client_id}
      className={`msg ${mine ? 'mine' : ''} ${grouped ? 'grouped' : ''} ${flash ? 'flash' : ''} ${pending ? `is-${item.status}` : ''}`}
      onPointerDown={startPress}
      onPointerMove={movePress}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onContextMenu={(e) => {
        if (pending || deleted) return;
        e.preventDefault();
        onMenu(item);
      }}
    >
      <span className="reply-hint" aria-hidden="true"><Icon name="reply" size={18} /></span>
      {!mine && (showAvatar ? <Avatar p={from} className="mini round msg-av" /> : <span className="msg-av-gap" />)}
      <div className="msg-col">
        {showName && !mine && <small className="msg-name">{from ? firstName(from.name) : '?'}</small>}
        <div className={`bubble ${deleted ? 'deleted' : ''} ${item.kind === 'photo' && !item.text ? 'media-only' : ''}`}>
          {deleted ? (
            <span className="deleted-text"><Icon name="trash" size={14} /> {t('msg_deleted')}</span>
          ) : (
            <>
              {forwardedFrom && <span className="fwd-label"><Icon name="forward" size={13} /> {t('msg_forwarded')}</span>}
              {item.reply_to && <Quote quoted={quoted} onJump={onJump} />}
              <Images m={item} local={pending && item.preview?.length ? item.preview : null} onOpen={onOpenImages} />
              {audio && <VoicePlayer att={audio} />}
              {pending && item.voice && !audio && <VoicePlayer att={{ dur: item.voice.dur }} localUrl={item.voice.url} />}
              {item.text && <span className="bubble-text">{linkify(item.text)}</span>}
            </>
          )}
          <span className="bubble-meta">
            {item.pinned_at && <Icon name="pin" size={11} />}
            {item.edited_at && !deleted && <span>{t('chat_edited')}</span>}
            <time dateTime={item.created_at}>{clock(lang, item.created_at)}</time>
            {mine && !deleted && (
              <span className={`msg-tick ${pending ? item.status : readState}`} aria-label={t(`msg_status_${pending ? item.status : readState}`)}>
                {item.status === 'sending' ? <Icon name="clock" size={12} /> : item.status === 'failed' ? '!' : readState === 'read' ? '✓✓' : '✓'}
              </span>
            )}
          </span>
        </div>
        {rx.length > 0 && (
          <div className="reactions">
            {rx.map(([emoji, ids]) => (
              <button key={emoji} type="button" className={`rx ${ids.includes(me?.id) ? 'on' : ''}`} onClick={() => onReact(item, emoji)} aria-pressed={ids.includes(me?.id)} aria-label={`${emoji} ${ids.length}`}>
                {emoji} {ids.length > 1 && <b>{ids.length}</b>}
              </button>
            ))}
          </div>
        )}
        {item.status === 'failed' && (
          <span className="failed-row">
            <span>{t('msg_not_sent')}</span>
            <button type="button" className="link-btn" onClick={() => onRetry(item)}>{t('retry')}</button>
            <button type="button" className="link-btn danger" onClick={() => onDiscard(item)}>{t('delete')}</button>
          </span>
        )}
      </div>
      {!pending && !deleted && (
        <button type="button" className="msg-more" onClick={() => onMenu(item)} aria-label={t('msg_actions')}>
          <Icon name="more" size={18} />
        </button>
      )}
    </div>
  );
}

export default memo(Bubble);
export { useFileUrl };
