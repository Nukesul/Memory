import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { href } from '../router';
import { firstName } from '../roster';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';

const MAX = 500;
const EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ONLINE_MS = 150000;
const isOnline = (iso) => Boolean(iso) && Date.now() - new Date(iso).getTime() < ONLINE_MS;

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
/** Plain text with clickable links; nothing is ever injected as HTML. */
const linkify = (text) =>
  text.split(URL_RE).map((part, i) =>
    i % 2 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">{part}</a>
    ) : (
      part
    ),
  );

const dayLabel = (lang, iso, t) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today.getTime() - 864e5);
  if (d.toDateString() === today.toDateString()) return t('chat_today');
  if (d.toDateString() === yest.toDateString()) return t('chat_yesterday');
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(d);
};

export default function Chat({ room: arg }) {
  const { t, me } = useApp();
  if (!me) {
    return (
      <section className="page">
        <h1 className="page-title">{t('nav_messages')}</h1>
        <p className="page-lead">{t('chat_login')}</p>
        <a className="btn btn-big-link" href={href('me')}>{t('open_cabinet')}</a>
      </section>
    );
  }
  return <ChatRooms me={me} arg={arg} />;
}

function ChatRooms({ me, arg }) {
  const { t, people, chat, unread, setChatFast, refreshChat, markSeen, presence } = useApp();
  const others = people.filter((p) => p.id !== me.id);
  const room = arg && (arg === 'all' || others.some((p) => String(p.id) === arg)) ? arg : null;
  const open = room || 'all'; // on wide screens the class room is shown by default

  useEffect(() => {
    setChatFast(true);
    refreshChat();
    return () => setChatFast(false);
  }, [setChatFast, refreshChat]);

  // Last message per room, for the list.
  const last = useMemo(() => {
    const by = {};
    for (const m of chat) {
      const key = m.to_id == null ? 'all' : String(m.from_id === me.id ? m.to_id : m.from_id);
      by[key] = m;
    }
    return by;
  }, [chat, me.id]);

  const ordered = useMemo(
    () =>
      [...others].sort((a, b) => {
        const ta = last[a.id] ? new Date(last[a.id].created_at).getTime() : 0;
        const tb = last[b.id] ? new Date(last[b.id].created_at).getTime() : 0;
        return tb - ta || a.id - b.id;
      }),
    [others, last],
  );

  const preview = (m) => (m ? `${m.from_id === me.id ? t('chat_you') + ': ' : ''}${m.text}` : t('chat_empty_room'));

  return (
    <section className={`page chat ${room ? 'in-room' : ''}`}>
      <div className="chat-layout">
        <aside className="chat-list" aria-label={t('chat_rooms')}>
          <h1 className="page-title chat-title">{t('nav_messages')}</h1>
          <a className={`room ${open === 'all' ? 'on' : ''}`} href={href('chat/all')}>
            <span className="room-icon" aria-hidden="true">🏫</span>
            <span className="room-info">
              <b>{t('chat_class')}</b>
              <small>{preview(last.all)}</small>
            </span>
            {unread.all > 0 && <span className="badge">{unread.all}</span>}
          </a>
          <p className="room-sep">{t('chat_private')}</p>
          <ul>
            {ordered.map((p) => (
              <li key={p.id}>
                <a className={`room ${open === String(p.id) ? 'on' : ''}`} href={href(`chat/${p.id}`)}>
                  <span className="has-presence">
                    <Avatar p={p} className="mini round" />
                    {isOnline(presence[p.id]) && <i className="presence" title={t('chat_online')} />}
                  </span>
                  <span className="room-info">
                    <b>{p.name}</b>
                    <small>{preview(last[p.id])}</small>
                  </span>
                  {unread[p.id] > 0 && <span className="badge">{unread[p.id]}</span>}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <Thread key={open} room={open} me={me} people={people} markSeen={markSeen} />
      </div>
    </section>
  );
}

const timeFmt = (lang, iso) => {
  const d = new Date(iso);
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat(lang, same ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
};

function Thread({ room, me, people, markSeen }) {
  const { t, lang, chat, sendMessage, editMessage, deleteMessage, reactMessage, toast, presence, refreshChat } = useApp();
  const toId = room === 'all' ? null : Number(room);
  const other = toId ? people.find((p) => p.id === toId) : null;
  const msgs = useMemo(
    () => chat.filter((m) => (toId == null ? m.to_id == null : (m.from_id === me.id && m.to_id === toId) || (m.from_id === toId && m.to_id === me.id))),
    [chat, toId, me.id],
  );
  const byId = (id) => people.find((p) => p.id === id);

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // { id, text }
  const [confirm, setConfirm] = useState(null);
  const [picker, setPicker] = useState(null);
  const react = async (id, emoji) => {
    setPicker(null);
    try {
      await reactMessage(id, emoji);
    } catch {
      toast(t('chat_err'), 'err');
    }
  };
  const box = useRef(null);
  const stick = useRef(true);
  const [replyTo, setReplyTo] = useState(null);
  const [away, setAway] = useState(false); // scrolled up while new messages arrive
  const [flash, setFlash] = useState(null);
  const input = useRef(null);
  const seenCount = useRef(0);
  const lastSeen = other ? presence[other.id] : null;
  const presenceText = !other ? null : isOnline(lastSeen) ? t('chat_online') : lastSeen ? t('chat_seen', { when: timeFmt(lang, lastSeen) }) : null;

  // Opening a room (and any new message while it is open) counts as read.
  useEffect(() => {
    markSeen(room);
  }, [room, msgs.length, markSeen]);

  useLayoutEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
    // A message from somebody else arrived while I was reading older ones.
    const grew = msgs.length > seenCount.current && seenCount.current > 0;
    if (grew && !stick.current && msgs[msgs.length - 1]?.from_id !== me.id) setAway(true);
    seenCount.current = msgs.length;
  }, [msgs.length, room]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = box.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (stick.current) setAway(false);
  };
  const jump = () => {
    const el = box.current;
    stick.current = true;
    setAway(false);
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };
  const goTo = (id) => {
    const el = box.current?.querySelector(`[data-mid="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setFlash(id);
    setTimeout(() => setFlash(null), 1300);
  };
  const startReply = (m) => {
    setReplyTo(m);
    setPicker(null);
    input.current?.focus();
  };

  const send = async (e) => {
    e?.preventDefault();
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      stick.current = true;
      await sendMessage(toId, v, replyTo?.id || null);
      setText('');
      setReplyTo(null);
    } catch (err) {
      console.error(err);
      toast(t('chat_err'), 'err');
    } finally {
      setBusy(false);
    }
  };
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape' && replyTo) setReplyTo(null);
  };
  const saveEdit = async () => {
    const v = editing.text.trim();
    if (!v) return;
    try {
      await editMessage(editing.id, v);
      setEditing(null);
    } catch {
      toast(t('chat_err'), 'err');
      refreshChat(); // show what the server really has
    }
  };
  const remove = async (id) => {
    try {
      await deleteMessage(id);
    } catch {
      toast(t('chat_err'), 'err');
      refreshChat();
    }
    setConfirm(null);
  };

  return (
    <div className="thread">
      <header className="thread-head">
        <a className="back" href={href('chat')} aria-label={t('nav_chat')}>
          <Icon name="left" size={22} />
        </a>
        {other ? (
          <a className="thread-who" href={href(`p/${other.id}`)}>
            <span className="has-presence">
              <Avatar p={other} className="mini round" />
              {isOnline(lastSeen) && <i className="presence" />}
            </span>
            <span>
              <b>{other.name}</b>
              <small><Flag code={other.country} /> {presenceText || t('chat_private_note')}</small>
            </span>
          </a>
        ) : (
          <div className="thread-who">
            <span className="room-icon" aria-hidden="true">🏫</span>
            <span>
              <b>{t('chat_class')}</b>
              <small>{t('chat_class_note')}</small>
            </span>
          </div>
        )}
      </header>

      <div className="msgs" ref={box} onScroll={onScroll} role="log" aria-live="polite">
        {msgs.length === 0 && <p className="chat-hello">{other ? t('chat_start_private', { name: firstName(other.name) }) : t('chat_start_class')}</p>}
        {msgs.map((m, i) => {
          const mine = m.from_id === me.id;
          const from = byId(m.from_id);
          const prev = msgs[i - 1];
          const grouped = prev && prev.from_id === m.from_id && new Date(m.created_at) - new Date(prev.created_at) < 5 * 60000;
          const isEditing = editing?.id === m.id;
          const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
          const rx = Object.entries(m.reactions || {}).filter(([, ids]) => ids.length);
          const quoted = m.reply_to ? chat.find((x) => x.id === m.reply_to) : null;
          const quotedFrom = quoted ? byId(quoted.from_id) : null;
          return (
            <Fragment key={m.id}>
              {newDay && <div className="day-sep"><span>{dayLabel(lang, m.created_at, t)}</span></div>}
            <div data-mid={m.id} className={`msg ${mine ? 'mine' : ''} ${grouped && !newDay ? 'grouped' : ''} ${flash === m.id ? 'flash' : ''}`}>
              {!mine && !grouped ? <Avatar p={from} className="mini round" /> : !mine && <span className="mini-gap" />}
              <div className="msg-col">
                {!mine && !grouped && !other && <small className="msg-name">{from ? firstName(from.name) : '?'}</small>}
                {isEditing ? (
                  <div className="bubble editing">
                    <textarea
                      autoFocus
                      rows={2}
                      maxLength={MAX}
                      value={editing.text}
                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                    <span className="edit-row">
                      <button type="button" className="link-btn" onClick={() => setEditing(null)}>{t('cancel')}</button>
                      <button type="button" className="btn btn-small" onClick={saveEdit}>{t('save')}</button>
                    </span>
                  </div>
                ) : (
                  <div className="bubble">
                    {m.reply_to &&
                      (quoted ? (
                        <button type="button" className="quote" onClick={() => goTo(quoted.id)}>
                          <b>{quoted.from_id === me.id ? t('chat_you') : quotedFrom ? firstName(quotedFrom.name) : '?'}</b>
                          <span>{quoted.text}</span>
                        </button>
                      ) : (
                        <span className="quote gone">{t('chat_orig_gone')}</span>
                      ))}
                    {linkify(m.text)}
                  </div>
                )}
                {rx.length > 0 && (
                  <div className="reactions">
                    {rx.map(([emoji, ids]) => (
                      <button key={emoji} type="button" className={`rx ${ids.includes(me.id) ? 'on' : ''}`} onClick={() => react(m.id, emoji)} aria-pressed={ids.includes(me.id)}>
                        {emoji} <b>{ids.length}</b>
                      </button>
                    ))}
                  </div>
                )}
                {picker === m.id && (
                  <div className="picker" role="menu">
                    {EMOJI.map((e) => (
                      <button key={e} type="button" role="menuitem" onClick={() => react(m.id, e)}>{e}</button>
                    ))}
                  </div>
                )}
                <small className="msg-meta">
                  {timeFmt(lang, m.created_at)}
                  {m.edited_at && <span> · {t('chat_edited')}</span>}
                  {!isEditing && (
                    <button type="button" className="rp" onClick={() => startReply(m)} aria-label={t('chat_reply')}>
                      <Icon name="reply" size={15} />
                    </button>
                  )}
                  {!isEditing && (
                    <button type="button" className="rx-add" onClick={() => setPicker(picker === m.id ? null : m.id)} aria-label={t('chat_react')} aria-expanded={picker === m.id}>
                      <Icon name="smile" size={15} />
                    </button>
                  )}
                  {mine && !isEditing && (
                    <span className="msg-actions">
                      <button type="button" onClick={() => setEditing({ id: m.id, text: m.text })} aria-label={t('edit')}>
                        <Icon name="edit" size={14} />
                      </button>
                      {confirm === m.id ? (
                        <button type="button" className="danger" onClick={() => remove(m.id)}>{t('chat_delete_q')}</button>
                      ) : (
                        <button type="button" onClick={() => setConfirm(m.id)} aria-label={t('delete')}>
                          <Icon name="trash" size={14} />
                        </button>
                      )}
                    </span>
                  )}
                </small>
              </div>
            </div>
            </Fragment>
          );
        })}
      </div>

      {away && (
        <button type="button" className="jump" onClick={jump}>
          <Icon name="arrow" size={16} /> {t('chat_jump')}
        </button>
      )}
      {replyTo && (
        <div className="reply-bar">
          <span>
            <b>{t('chat_replying', { name: replyTo.from_id === me.id ? t('chat_you') : firstName(byId(replyTo.from_id)?.name || '?') })}</b>: {replyTo.text}
          </span>
          <button type="button" onClick={() => setReplyTo(null)} aria-label={t('chat_cancel_reply')}>✕</button>
        </div>
      )}
      <form className="composer-bar" onSubmit={send}>
        <textarea
          ref={input}
          value={text}
          rows={1}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={other ? t('chat_ph_private', { name: firstName(other.name) }) : t('chat_ph_class')}
          aria-label={t('chat_ph_class')}
          enterKeyHint="send"
        />
        <button className="send" disabled={!text.trim() || busy} aria-label={t('chat_send')}>
          <Icon name="send" size={22} />
        </button>
      </form>
    </div>
  );
}
