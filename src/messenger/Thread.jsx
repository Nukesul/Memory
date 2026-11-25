import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { firstName } from '../roster';
import { href } from '../router';
import { Icon } from '../components/Icons';
import { mapi } from './api';
import Bubble from './Bubble';
import Composer from './Composer';
import { ConvAvatar, convName, dayLabel, isOnline, otherOf, previewText, shortWhen } from './parts';
import { ForwardSheet, MessageMenu } from './Sheets';
import { discard, getState, loadOlder, loadUntil, markRead, openConv, react, rememberScroll, retry, useMessenger, want } from './store';

const GROUP_MS = 5 * 60 * 1000;
const NEAR_BOTTOM = 140;

export default function Thread({ id, focus, desktop }) {
  const { t, lang, people, me, presence, openPhotos, toast } = useApp();
  const row = useMessenger((s) => s.inbox.find((r) => r.id === id));
  const c = useMessenger((s) => s.convs[id]);
  const outbox = useMessenger((s) => s.outbox);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [menu, setMenu] = useState(null);
  const [fwd, setFwd] = useState(null);
  const [flash, setFlash] = useState(null);
  const [below, setBelow] = useState(0); // new messages under the visible part
  const [typing, setTyping] = useState({});
  const [atBottom, setAtBottom] = useState(true);
  const list = useRef(null);
  const stick = useRef(true);
  const firstUnread = useRef(undefined); // decided once per opening
  const prevFirst = useRef(null);
  const prevHeight = useRef(0);
  const typingCh = useRef(null);

  useEffect(() => {
    openConv(id);
    setReplyTo(null);
    setEditing(null);
    setBelow(0);
    stick.current = true;
    firstUnread.current = undefined;
  }, [id]);

  // "Typing…": private channel per conversation.
  useEffect(() => {
    if (!me) return undefined;
    const ch = mapi.typing(id, me.id, (p) => setTyping((cur) => ({ ...cur, [p]: Date.now() })));
    typingCh.current = ch;
    const tick = setInterval(() => setTyping((cur) => Object.fromEntries(Object.entries(cur).filter(([, ts]) => Date.now() - ts < 4000))), 1500);
    return () => {
      clearInterval(tick);
      ch.close();
      typingCh.current = null;
    };
  }, [id, me]);

  const messages = c?.messages || [];
  const pending = outbox.filter((o) => o.conversation_id === id);
  const items = useMemo(() => [...messages, ...pending], [messages, pending]);
  const byId = useMemo(() => Object.fromEntries(messages.map((m) => [m.id, m])), [messages]);
  const others = (c?.members || []).filter((m) => m.person_id !== me?.id);
  const lastId = messages.length ? messages[messages.length - 1].id : 0;

  if (c?.loaded && firstUnread.current === undefined && row) {
    firstUnread.current = messages.find((m) => m.id > row.last_read_id && m.from_id !== me?.id && m.kind !== 'system')?.id ?? null;
  }

  // Ask for signed links of every visible photo at once.
  useEffect(() => {
    const paths = [];
    for (const m of messages) for (const a of m.attachments || []) paths.push(a.thumb || a.path);
    if (paths.length) want(paths);
  }, [messages]);

  // Scroll: first open → first unread (or the bottom); my message or at the bottom → follow;
  // reading older messages → stay put and count what arrived below.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || !c?.loaded) return;
    const first = items[0]?.id ?? items[0]?.client_id;
    if (prevFirst.current === null) {
      const target = focus ? el.querySelector(`[data-mid="${focus}"]`) : firstUnread.current ? el.querySelector(`[data-mid="${firstUnread.current}"]`) : null;
      if (target) target.scrollIntoView({ block: focus ? 'center' : 'start' });
      else if (c.scroll != null && !focus) el.scrollTop = c.scroll;
      else el.scrollTop = el.scrollHeight;
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    } else if (first !== prevFirst.current && prevHeight.current) {
      // Older messages were added on top: keep the same message under the finger.
      el.scrollTop += el.scrollHeight - prevHeight.current;
    } else if (stick.current) {
      el.scrollTop = el.scrollHeight;
    }
    prevFirst.current = first;
    prevHeight.current = el.scrollHeight;
  }, [items, c?.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    prevFirst.current = null;
    prevHeight.current = 0;
  }, [id]);

  // New message from someone while I read older ones → show the "new messages" button.
  const seenLast = useRef(lastId);
  useEffect(() => {
    if (lastId > seenLast.current) {
      const fresh = messages.filter((m) => m.id > seenLast.current && m.from_id !== me?.id && m.kind !== 'system').length;
      if (!stick.current && fresh) setBelow((n) => n + fresh);
    }
    seenLast.current = lastId;
  }, [lastId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Read up to the newest message while I am at the bottom and the app is in front.
  useEffect(() => {
    if (!lastId || !stick.current || document.visibilityState !== 'visible') return;
    markRead(id, lastId);
  }, [id, lastId, below]);
  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && stick.current && lastId && markRead(id, lastId);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [id, lastId]);

  const onScroll = () => {
    const el = list.current;
    rememberScroll(id, el.scrollTop);
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    stick.current = near;
    if (near !== atBottom) setAtBottom(near);
    if (near && below) {
      setBelow(0);
      if (lastId) markRead(id, lastId);
    }
    if (el.scrollTop < 240 && c?.hasMore && !c.loadingOlder) loadOlder(id);
  };
  const toBottom = () => {
    const el = list.current;
    stick.current = true;
    setBelow(0);
    setAtBottom(true);
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    if (lastId) markRead(id, lastId);
  };
  const jump = useCallback(
    async (mid) => {
      await loadUntil(id, mid);
      requestAnimationFrame(() => {
        const el = list.current?.querySelector(`[data-mid="${mid}"]`);
        if (!el) return toast(t('msg_not_loaded'), 'err');
        stick.current = false;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setFlash(mid);
        setTimeout(() => setFlash(null), 1400);
        return undefined;
      });
    },
    [id, t, toast],
  );
  useEffect(() => {
    if (focus && c?.loaded) jump(Number(focus));
  }, [focus, c?.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const openImages = useCallback(
    (m, index) => {
      const imgs = (m.attachments || []).filter((a) => a.type === 'image');
      want(imgs.flatMap((a) => [a.path, a.thumb]));
      const s = getState().urls;
      openPhotos(imgs.map((a) => ({ full: s[a.path] || s[a.thumb], thumb: s[a.thumb] || s[a.path], w: a.w, h: a.h, personId: m.from_id })), index);
    },
    [openPhotos],
  );
  const onReact = useCallback((m, e) => react(m, e).catch(() => toast(t('chat_err'), 'err')), [t, toast]);

  // Read receipts: in a direct chat, whether the other person has read up to the message;
  // in groups, whether at least one other member has.
  const readUpTo = others.length ? (row?.kind === 'direct' ? others[0].last_read_id : Math.max(...others.map((m) => m.last_read_id))) : 0;

  if (!row && c?.error) {
    return (
      <div className="thread empty-thread">
        <p className="muted">{t('msg_conv_missing')}</p>
        <a className="btn" href={href('chat')}>{t('nav_messages')}</a>
      </div>
    );
  }

  const name = row ? convName(row, people, me?.id, t) : '';
  const other = row ? people.find((p) => p.id === otherOf(row, me?.id)) : null;
  const typers = Object.keys(typing).map(Number).filter((p) => p !== me?.id);
  let sub;
  if (typers.length) sub = <span className="typing">{t(typers.length > 1 ? 'msg_typing_many' : 'msg_typing', { name: firstName(people.find((p) => p.id === typers[0])?.name || '') })}</span>;
  else if (row?.kind === 'direct' && other) sub = isOnline(presence[other.id]) ? t('chat_online') : presence[other.id] ? t('chat_seen', { when: shortWhen(lang, presence[other.id]) }) : '';
  else if (row) sub = t('msg_members_n', { n: row.members?.length || 0 });
  const pinned = c?.pinned?.[0];

  return (
    <div className="thread">
      <header className="thread-head">
        {!desktop && (
          <a className="icon-btn" href={href('chat')} aria-label={t('back')}>
            <Icon name="left" size={24} />
          </a>
        )}
        <a className="thread-who" href={href(`chat/c${id}/info`)}>
          {row && <ConvAvatar row={row} size={40} />}
          <span>
            <b>{name}</b>
            <small>{sub}</small>
          </span>
        </a>
        <a className="icon-btn" href={href(`chat/c${id}/info`)} aria-label={t('msg_info')}>
          <Icon name="info" size={22} />
        </a>
      </header>

      {pinned && (
        <button type="button" className="pinned-bar" onClick={() => jump(pinned.id)}>
          <Icon name="pin" size={16} />
          <span>
            <b>{t('msg_pinned')}{c.pinned.length > 1 ? ` · ${c.pinned.length}` : ''}</b>
            <small>{previewText(pinned, t)}</small>
          </span>
        </button>
      )}

      <div className="thread-list" ref={list} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions">
        {!c?.loaded ? (
          <div className="thread-loading" role="status"><span className="spin" /></div>
        ) : (
          <>
            {c.hasMore ? (
              <div className="older" role="status">{c.loadingOlder ? <span className="spin" /> : null}</div>
            ) : (
              <p className="thread-start">{t('msg_start', { name })}</p>
            )}
            {items.map((m, i) => {
              const prev = items[i - 1];
              const next = items[i + 1];
              const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
              const sameAsPrev = prev && !newDay && prev.from_id === m.from_id && prev.kind !== 'system' && new Date(m.created_at) - new Date(prev.created_at) < GROUP_MS;
              const sameAsNext = next && next.from_id === m.from_id && next.kind !== 'system' && new Date(next.created_at) - new Date(m.created_at) < GROUP_MS && new Date(next.created_at).toDateString() === new Date(m.created_at).toDateString();
              const mine = m.from_id === me?.id;
              const key = m.id || m.client_id;
              return (
                <Fragment key={key}>
                  {newDay && <p className="day-sep"><span>{dayLabel(lang, m.created_at, t)}</span></p>}
                  {m.id && m.id === firstUnread.current && <p className="unread-sep"><span>{t('msg_unread_here')}</span></p>}
                  <Bubble
                    item={m}
                    mine={mine}
                    grouped={sameAsPrev}
                    showName={row?.kind !== 'direct' && !sameAsPrev}
                    showAvatar={row?.kind !== 'direct' && !sameAsNext}
                    quoted={m.reply_to ? byId[m.reply_to] : null}
                    readState={m.id && m.id <= readUpTo ? 'read' : 'sent'}
                    flash={flash === m.id}
                    onMenu={setMenu}
                    onReply={setReplyTo}
                    onJump={jump}
                    onOpenImages={openImages}
                    onRetry={(x) => retry(x.client_id)}
                    onDiscard={(x) => discard(x.client_id)}
                    onReact={onReact}
                  />
                </Fragment>
              );
            })}
          </>
        )}
      </div>

      {below > 0 && (
        <button type="button" className="jump" onClick={toBottom}>
          <Icon name="arrow" size={16} /> {t('msg_new_below', { n: below })}
        </button>
      )}
      {below === 0 && !atBottom && c?.loaded && (
        <button type="button" className="jump round" onClick={toBottom} aria-label={t('msg_to_latest')}>
          <Icon name="arrow" size={18} />
        </button>
      )}

      <Composer
        convId={id}
        replyTo={replyTo}
        editing={editing}
        disabled={!row}
        onCancelReply={() => setReplyTo(null)}
        onCancelEdit={() => setEditing(null)}
        onTyping={() => typingCh.current?.send()}
        onSent={() => {
          setReplyTo(null);
          stick.current = true;
          setBelow(0);
        }}
      />

      {menu && <MessageMenu m={menu} row={row} onClose={() => setMenu(null)} onReply={setReplyTo} onEdit={setEditing} onForward={setFwd} />}
      {fwd && <ForwardSheet m={fwd} onClose={() => setFwd(null)} />}
    </div>
  );
}
