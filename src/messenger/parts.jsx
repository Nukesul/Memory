import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { firstName } from '../roster';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { useMessenger, want } from './store';

export const ONLINE_MS = 150000;
export const isOnline = (iso) => Boolean(iso) && Date.now() - new Date(iso).getTime() < ONLINE_MS;
export const EMOJI = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

/** Name of a conversation as the viewer sees it. */
export function convName(row, people, me, t) {
  if (!row) return '';
  if (row.kind === 'class') return t('msg_class');
  if (row.kind === 'group') return row.title || t('msg_group');
  const other = row.members?.find((p) => p !== me);
  return people.find((p) => p.id === other)?.name || '…';
}
export const otherOf = (row, me) => (row?.kind === 'direct' ? row.members?.find((p) => p !== me) : null);

export function ConvAvatar({ row, size = 52 }) {
  const { people, me, presence } = useApp();
  const style = { width: size, height: size };
  if (row.kind === 'direct') {
    const p = people.find((x) => x.id === otherOf(row, me?.id));
    return (
      <span className="conv-av" style={style}>
        {p ? <Avatar p={p} className="round" /> : <span className="conv-av-mono">?</span>}
        {p && isOnline(presence[p.id]) && <i className="presence" />}
      </span>
    );
  }
  if (row.kind === 'class') {
    return (
      <span className="conv-av class" style={style} aria-hidden="true">
        <span className="brand-mark">2J</span>
      </span>
    );
  }
  // Group: two faces stacked.
  const faces = (row.members || []).filter((id) => id !== me?.id).slice(0, 2).map((id) => people.find((p) => p.id === id)).filter(Boolean);
  return (
    <span className="conv-av group" style={style} aria-hidden="true">
      {faces.map((p) => (
        <Avatar key={p.id} p={p} className="round" />
      ))}
    </span>
  );
}

export const clock = (lang, iso) => new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
export function shortWhen(lang, iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return clock(lang, iso);
  const days = (now - d) / 864e5;
  if (days < 6) return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(d);
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(d);
}
export function dayLabel(lang, iso, t) {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return t('today');
  if (d.toDateString() === y.toDateString()) return t('yesterday');
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) }).format(d);
}

/** One-line preview of a message for the inbox and quotes. */
export function previewText(m, t) {
  if (!m) return '';
  if (m.deleted || m.deleted_at) return t('msg_deleted');
  if (m.kind === 'photo') return `📷 ${m.text || t('msg_photo')}`;
  if (m.kind === 'voice') return `🎤 ${t('msg_voice')}`;
  if (m.kind === 'post') return `🖼 ${m.text || t('msg_post')}`;
  if (m.kind === 'system') return t('msg_system_short');
  return m.text;
}

/** System lines ("Asel added Baiel"). */
export function systemText(m, people, t) {
  const name = (id) => firstName(people.find((p) => p.id === Number(id))?.name || '?');
  const [what, arg] = (m.text || '').split(/:(.*)/s);
  const who = name(m.from_id);
  if (what === 'created') return t('sys_created', { who });
  if (what === 'renamed') return t('sys_renamed', { who, title: arg });
  if (what === 'added') return t('sys_added', { who, names: arg.split(',').map(name).join(', ') });
  if (what === 'removed') return t('sys_removed', { who, name: name(arg) });
  if (what === 'left') return t('sys_left', { who });
  return m.text;
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;
export const linkify = (text) =>
  text.split(URL_RE).map((part, i) =>
    i % 2 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">{part}</a>
    ) : (
      part
    ),
  );

/** A private chat file: asks for a signed link and renders when it arrives. */
export function useFileUrl(path) {
  const url = useMessenger((s) => (path ? s.urls[path] : null));
  useEffect(() => {
    if (path && !url) want([path]);
  }, [path, url]);
  return url;
}

const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export function VoicePlayer({ att, localUrl }) {
  const { t } = useApp();
  const remote = useFileUrl(localUrl ? null : att?.path);
  const src = localUrl || remote;
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const dur = att?.dur || 0;
  useEffect(() => () => audio.current?.pause(), []);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };
  return (
    <span className="voice">
      <button type="button" className="voice-btn" onClick={toggle} disabled={!src} aria-label={t(playing ? 'msg_pause' : 'msg_play')}>
        <Icon name={playing ? 'pause' : 'play'} size={18} />
      </button>
      <span className="voice-bar" aria-hidden="true"><span style={{ width: `${dur ? Math.min(100, (pos / dur) * 100) : 0}%` }} /></span>
      <span className="voice-time">{fmtDur(playing || pos ? pos : dur)}</span>
      {src && (
        <audio
          ref={audio}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setPos(0);
          }}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        />
      )}
    </span>
  );
}

export function ChatImage({ att, localUrl, onOpen }) {
  const thumb = useFileUrl(localUrl ? null : att.thumb || att.path);
  const src = localUrl || thumb;
  const ratio = att.w && att.h ? att.w / att.h : 1;
  return (
    <button type="button" className="chat-img" style={{ aspectRatio: Math.max(0.6, Math.min(1.8, ratio)) }} onClick={onOpen} disabled={!onOpen}>
      {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="img-wait" />}
    </button>
  );
}

export function PersonPicker({ selected, onToggle, exclude = [], query = '' }) {
  const { people, presence } = useApp();
  const q = query.trim().toLowerCase();
  const list = people.filter((p) => !exclude.includes(p.id) && (!q || p.name.toLowerCase().includes(q)));
  return (
    <ul className="pick-list">
      {list.map((p) => {
        const on = selected.includes(p.id);
        return (
          <li key={p.id}>
            <button type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => onToggle(p.id)}>
              <span className="has-presence">
                <Avatar p={p} className="mini round" />
                {isOnline(presence[p.id]) && <i className="presence" />}
              </span>
              <span className="pick-name">{p.name}</span>
              <span className={`pick-check ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
