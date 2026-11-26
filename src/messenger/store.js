// Messenger state that lives outside React components, so a conversation keeps its messages, scroll
// position, draft and unsent messages while you move around the app.
import { useSyncExternalStore } from 'react';
import { ls } from '../store';
import { processImage } from '../image';
import { MsgError, PAGE, mapi, uuid } from './api';

const DRAFTS = 'memoris:drafts';
const OUTBOX = 'memoris:outbox';
let state = fresh();
const subs = new Set();
function fresh() {
  return { me: null, status: 'idle', inbox: [], convs: {}, outbox: [], drafts: ls.get(DRAFTS, {}), live: false, urls: {} };
}
function set(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  subs.forEach((f) => f());
}
const conv = (id) => state.convs[id] || { messages: [], hasMore: true, loaded: false, loading: false, members: [], pinned: [], typing: {}, scroll: null };
function setConv(id, patch) {
  set((s) => ({ convs: { ...s.convs, [id]: { ...conv(id), ...(typeof patch === 'function' ? patch(conv(id)) : patch) } } }));
}
const upsert = (list, row) => {
  const i = list.findIndex((m) => m.id === row.id);
  if (i >= 0) {
    const next = list.slice();
    next[i] = { ...list[i], ...row };
    return next;
  }
  const next = [...list, row];
  return list.length && list[list.length - 1].id > row.id ? next.sort((a, b) => a.id - b.id) : next;
};
const persistOutbox = () => ls.set(OUTBOX, state.outbox.filter((o) => o.kind === 'text').map(({ preview, files, voice, ...rest }) => rest)); // eslint-disable-line no-unused-vars

export function useMessenger(selector = (s) => s) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => selector(state),
  );
}
export const getState = () => state;

/* ───────── lifecycle ───────── */
let off = null;
let poll = null;
let wasLive = false;
export async function start(me) {
  if (state.me === me && off) return;
  stop();
  set({ ...fresh(), me, status: 'loading', outbox: ls.get(OUTBOX, []).map((o) => ({ ...o, status: 'failed' })) });
  await refreshInbox();
  off = mapi.subscribe({
    message: onMessage,
    member: onMember,
    conversation: onConversation,
    refresh: () => resync(),
    status: (st) => {
      const live = st === 'SUBSCRIBED';
      set({ live });
      // Anything that happened while the connection was down is fetched once it is back.
      if (live && wasLive === false && state.status === 'ready') resync();
      wasLive = live;
    },
  });
  let ticks = 0;
  const tick = () => {
    ticks += 1;
    if (ticks % 600 === 0) set({ urls: {} }); // signed file links last 6 hours; renew every 5
    if (document.visibilityState === 'visible') refreshInbox();
  };
  poll = setInterval(tick, 30000);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
}
export function stop() {
  off?.();
  off = null;
  clearInterval(poll);
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('online', onOnline);
  wasLive = false;
  state = fresh();
  subs.forEach((f) => f());
}
function onVisible() {
  if (document.visibilityState === 'visible') resync();
}
function onOnline() {
  resync();
  for (const o of state.outbox) if (o.status === 'failed') retry(o.client_id);
}
export async function refreshInbox() {
  try {
    const rows = await mapi.inbox();
    set({ inbox: rows, status: 'ready' });
  } catch (e) {
    if (state.status !== 'ready') set({ status: 'error' });
    console.error(e);
  }
}
/** Bring the inbox and every open conversation up to date (after sleep, reconnect, or in demo mode). */
async function resync() {
  await refreshInbox();
  for (const id of Object.keys(state.convs)) {
    const c = conv(id);
    if (!c.loaded) continue;
    const last = c.messages[c.messages.length - 1]?.id ?? 0;
    try {
      const [newer, members, pinned] = await Promise.all([mapi.messages(Number(id), { after: last, limit: 200 }), mapi.members(Number(id)), mapi.pinned(Number(id))]);
      // Edits, deletions and reactions on messages already on screen: reload the visible window.
      const window_ = c.messages.length ? await mapi.messages(Number(id), { after: c.messages[0].id - 1, limit: Math.min(400, c.messages.length + 200) }) : newer;
      setConv(id, { messages: window_.length ? window_ : newer, members, pinned });
    } catch {
      /* stays as it was */
    }
  }
}

/* ───────── realtime ───────── */
function onMessage(event, row) {
  if (!row?.conversation_id) {
    refreshInbox();
    return;
  }
  const id = row.conversation_id;
  if (state.convs[id]?.loaded) {
    setConv(id, (c) => ({
      messages: upsert(c.messages, row),
      pinned: row.pinned_at ? upsert(c.pinned.filter((m) => m.id !== row.id), row) : c.pinned.filter((m) => m.id !== row.id),
    }));
  }
  if (event === 'INSERT' && row.client_id) set((s) => ({ outbox: s.outbox.filter((o) => o.client_id !== row.client_id) }));
  // The inbox row: last message, order, unread count.
  const known = state.inbox.find((r) => r.id === id);
  if (!known) {
    refreshInbox();
    return;
  }
  if (event === 'INSERT') {
    const last = { id: row.id, from_id: row.from_id, kind: row.kind, text: (row.text || '').slice(0, 140), deleted: Boolean(row.deleted_at), n: (row.attachments || []).length, created_at: row.created_at };
    const mine = row.from_id === state.me;
    set((s) => ({
      inbox: [
        ...s.inbox.map((r) => (r.id === id ? { ...r, last, last_message_at: row.created_at, unread: mine || row.kind === 'system' ? r.unread : r.unread + 1, last_read_id: mine ? row.id : r.last_read_id } : r)),
      ].sort(order),
    }));
  } else if (known.last?.id === row.id) {
    set((s) => ({ inbox: s.inbox.map((r) => (r.id === id ? { ...r, last: { ...r.last, text: (row.text || '').slice(0, 140), deleted: Boolean(row.deleted_at) } } : r)) }));
  }
}
function onMember(event, row, old) {
  const who = row?.person_id ?? old?.person_id;
  const id = row?.conversation_id ?? old?.conversation_id;
  if (who === state.me) {
    // Added to a group, removed, or read on another device.
    if (event !== 'UPDATE') refreshInbox();
    else set((s) => ({ inbox: s.inbox.map((r) => (r.id === id ? { ...r, pinned: row.pinned, muted: row.muted, last_read_id: row.last_read_id, unread: row.last_read_id >= (r.last?.id ?? 0) ? 0 : r.unread } : r)).sort(order) }));
  }
  if (id && state.convs[id]?.loaded) {
    if (event === 'DELETE') setConv(id, (c) => ({ members: c.members.filter((m) => m.person_id !== who) }));
    else setConv(id, (c) => ({ members: c.members.some((m) => m.person_id === who) ? c.members.map((m) => (m.person_id === who ? { ...m, ...row } : m)) : [...c.members, row] }));
  }
}
function onConversation(event, row) {
  if (!row?.id) return;
  if (!state.inbox.some((r) => r.id === row.id)) {
    refreshInbox();
    return;
  }
  set((s) => ({ inbox: s.inbox.map((r) => (r.id === row.id ? { ...r, title: row.title, avatar: row.avatar, last_message_at: row.last_message_at } : r)).sort(order) }));
}
const order = (a, b) => Number(b.pinned) - Number(a.pinned) || String(b.last_message_at).localeCompare(String(a.last_message_at));

/* ───────── conversation ───────── */
export async function openConv(id) {
  const c = conv(id);
  if (c.loaded || c.loading) return;
  setConv(id, { loading: true, error: null });
  try {
    const [messages, members, pinned] = await Promise.all([mapi.messages(id), mapi.members(id), mapi.pinned(id)]);
    setConv(id, { messages, members, pinned, loaded: true, loading: false, hasMore: messages.length >= PAGE });
  } catch (e) {
    setConv(id, { loading: false, error: e.message || 'server' });
  }
}
export async function loadOlder(id) {
  const c = conv(id);
  if (!c.loaded || c.loadingOlder || !c.hasMore || !c.messages.length) return;
  setConv(id, { loadingOlder: true });
  try {
    const older = await mapi.messages(id, { before: c.messages[0].id });
    setConv(id, (cur) => ({ messages: [...older, ...cur.messages], hasMore: older.length >= PAGE, loadingOlder: false }));
  } catch {
    setConv(id, { loadingOlder: false });
  }
}
/** Load history back to a message (used by "jump to the quoted message" and search). */
export async function loadUntil(id, messageId) {
  for (let i = 0; i < 20; i++) {
    const c = conv(id);
    if (!c.hasMore || c.messages.some((m) => m.id <= messageId)) return;
    await loadOlder(id);
  }
}
export const rememberScroll = (id, top) => {
  if (state.convs[id]) state.convs[id].scroll = top; // no re-render needed
};

let readTimers = {};
export function markRead(id, upto) {
  const row = state.inbox.find((r) => r.id === id);
  if (!row || upto <= (row.last_read_id || 0)) return;
  set((s) => ({ inbox: s.inbox.map((r) => (r.id === id ? { ...r, last_read_id: upto, unread: upto >= (r.last?.id ?? 0) ? 0 : r.unread } : r)) }));
  clearTimeout(readTimers[id]);
  readTimers[id] = setTimeout(() => mapi.rpc('mark_read', { p_conv: id, p_upto: upto }).catch(() => {}), 400);
}

/* ───────── drafts ───────── */
export function setDraft(id, text) {
  const drafts = { ...state.drafts, [id]: text };
  if (!text) delete drafts[id];
  set({ drafts });
  ls.set(DRAFTS, drafts);
}

/* ───────── sending ───────── */
/**
 * Shows the message at once, then uploads and stores it. A failed message stays in the list with
 * "Retry"; the client id guarantees a retry can never store it twice.
 */
export async function send(id, { text = '', files = [], voice = null, replyTo = null, post = null }) {
  const client_id = uuid();
  const kind = post ? 'post' : voice ? 'voice' : files.length ? 'photo' : 'text';
  const item = {
    client_id, conversation_id: id, from_id: state.me, text: text.trim().slice(0, 2000), kind, reply_to: replyTo,
    created_at: new Date().toISOString(), status: 'sending', files, voice, attachments: post ? [post] : undefined,
    preview: files.map((f) => URL.createObjectURL(f)),
  };
  set((s) => ({ outbox: [...s.outbox, item] }));
  persistOutbox();
  return deliver(item);
}
async function deliver(item) {
  try {
    let attachments = item.attachments || [];
    if (!attachments.length && item.files?.length) {
      attachments = [];
      for (const f of item.files) {
        const img = await processImage(f);
        const [full, thumb] = await Promise.all([mapi.uploadFile(item.conversation_id, img.full, img.full.type), mapi.uploadFile(item.conversation_id, img.thumb, img.thumb.type)]);
        attachments.push({ type: 'image', path: full, thumb, w: img.w, h: img.h });
      }
    }
    if (!attachments.length && item.voice) {
      const path = await mapi.uploadFile(item.conversation_id, item.voice.blob, item.voice.mime);
      attachments = [{ type: 'audio', path, dur: item.voice.dur, mime: item.voice.mime.split(';')[0] }];
    }
    item.attachments = attachments; // keep uploads if the insert fails, so a retry does not upload again
    const row = await mapi.send({
      conversation_id: item.conversation_id, from_id: item.from_id, text: item.text, kind: item.kind,
      attachments, reply_to: item.reply_to, client_id: item.client_id,
    });
    set((s) => ({ outbox: s.outbox.filter((o) => o.client_id !== item.client_id) }));
    persistOutbox();
    if (state.convs[row.conversation_id]?.loaded) setConv(row.conversation_id, (c) => ({ messages: upsert(c.messages, row) }));
    set((s) => ({
      inbox: s.inbox
        .map((r) => (r.id === row.conversation_id ? { ...r, last_message_at: row.created_at, last_read_id: row.id, last: { id: row.id, from_id: row.from_id, kind: row.kind, text: row.text.slice(0, 140), deleted: false, n: attachments.length, created_at: row.created_at } } : r))
        .sort(order),
    }));
    item.preview?.forEach((u) => URL.revokeObjectURL(u));
    return row;
  } catch (e) {
    set((s) => ({ outbox: s.outbox.map((o) => (o.client_id === item.client_id ? { ...item, status: 'failed', error: e.message } : o)) }));
    persistOutbox();
    throw e;
  }
}
export function retry(clientId) {
  const item = state.outbox.find((o) => o.client_id === clientId);
  if (!item || item.status === 'sending') return undefined;
  const next = { ...item, status: 'sending' };
  set((s) => ({ outbox: s.outbox.map((o) => (o.client_id === clientId ? next : o)) }));
  return deliver(next).catch(() => {});
}
export function discard(clientId) {
  set((s) => ({ outbox: s.outbox.filter((o) => o.client_id !== clientId) }));
  persistOutbox();
}

/* ───────── message actions ───────── */
const patchMessage = (id, convId, patch) => setConv(convId, (c) => ({ messages: c.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
export async function edit(m, text) {
  const v = text.trim();
  if (!v || v === m.text) return;
  const before = { text: m.text, edited_at: m.edited_at };
  patchMessage(m.id, m.conversation_id, { text: v, edited_at: new Date().toISOString() });
  try {
    const row = await mapi.edit(m.id, v);
    patchMessage(m.id, m.conversation_id, row);
  } catch (e) {
    patchMessage(m.id, m.conversation_id, before);
    throw e;
  }
}
export async function remove(m) {
  await mapi.rpc('delete_message', { p_id: m.id });
  patchMessage(m.id, m.conversation_id, { deleted_at: new Date().toISOString(), text: '', attachments: [], reactions: {}, pinned_at: null });
  setConv(m.conversation_id, (c) => ({ pinned: c.pinned.filter((x) => x.id !== m.id) }));
}
export async function react(m, emoji) {
  const before = m.reactions || {};
  const set_ = new Set(before[emoji] || []);
  if (set_.has(state.me)) set_.delete(state.me);
  else set_.add(state.me);
  const next = { ...before };
  if (set_.size) next[emoji] = [...set_];
  else delete next[emoji];
  patchMessage(m.id, m.conversation_id, { reactions: next });
  try {
    const server = await mapi.rpc('react_message', { p_id: m.id, p_emoji: emoji });
    if (server) patchMessage(m.id, m.conversation_id, { reactions: server });
  } catch (e) {
    patchMessage(m.id, m.conversation_id, { reactions: before });
    throw e;
  }
}
export async function pin(m, on) {
  await mapi.rpc('pin_message', { p_id: m.id, p_pin: on });
  const row = { ...m, pinned_at: on ? new Date().toISOString() : null, pinned_by: on ? state.me : null };
  setConv(m.conversation_id, (c) => ({
    messages: c.messages.map((x) => (x.id === m.id ? row : x)),
    pinned: on ? [row, ...c.pinned.filter((x) => x.id !== m.id)] : c.pinned.filter((x) => x.id !== m.id),
  }));
}
export async function forward(m, targets) {
  for (const cid of targets) await mapi.rpc('forward_message', { p_id: m.id, p_conv: cid, p_client: uuid() });
  await refreshInbox();
  for (const cid of targets) {
    if (state.convs[cid]?.loaded) {
      const c = conv(cid);
      const newer = await mapi.messages(cid, { after: c.messages[c.messages.length - 1]?.id ?? 0, limit: 50 });
      setConv(cid, (cur) => ({ messages: newer.reduce(upsert, cur.messages) }));
    }
  }
}

/* ───────── conversations ───────── */
export async function openDirect(personId) {
  const existing = state.inbox.find((r) => r.kind === 'direct' && r.members.includes(personId) && r.members.includes(state.me));
  if (existing) return existing.id;
  const id = await mapi.rpc('open_direct', { p_other: personId });
  await refreshInbox();
  return id;
}
export async function createGroup(title, members) {
  const id = await mapi.rpc('create_group', { p_title: title, p_members: members });
  await refreshInbox();
  return id;
}
async function groupCall(id, fn, args) {
  await mapi.rpc(fn, { p_conv: id, ...args });
  await refreshInbox();
  if (state.convs[id]?.loaded) {
    const [members, newer] = await Promise.all([mapi.members(id), mapi.messages(id, { after: conv(id).messages.at(-1)?.id ?? 0, limit: 50 })]);
    setConv(id, (c) => ({ members, messages: newer.reduce(upsert, c.messages) }));
  }
}
export const renameGroup = (id, title) => groupCall(id, 'update_group', { p_title: title, p_avatar: null });
export const addMembers = (id, ids) => groupCall(id, 'add_members', { p_members: ids });
export const removeMember = (id, person) => groupCall(id, 'remove_member', { p_person: person });
export const setRole = (id, person, role) => groupCall(id, 'set_member_role', { p_person: person, p_role: role });
export async function leave(id) {
  await mapi.rpc('leave_conversation', { p_conv: id });
  set((s) => {
    const convs = { ...s.convs };
    delete convs[id];
    return { convs, inbox: s.inbox.filter((r) => r.id !== id) };
  });
}
export async function setConvFlag(id, flag, value) {
  // Pinned and muted belong to my membership row; the database lets me change only those.
  set((s) => ({ inbox: s.inbox.map((r) => (r.id === id ? { ...r, [flag]: value } : r)).sort(order) }));
  try {
    await mapi.rpc('set_conv_flag', { p_conv: id, p_flag: flag, p_value: value });
  } catch (e) {
    set((s) => ({ inbox: s.inbox.map((r) => (r.id === id ? { ...r, [flag]: !value } : r)).sort(order) }));
    throw e;
  }
}
export const search = (q) => mapi.rpc('search_messages', { p_q: q });

/* ───────── private files ───────── */
let wanted = new Set();
let flushT = null;
/** Ask for signed links in batches; components read them from state.urls. */
export function want(paths) {
  let added = false;
  for (const p of paths) {
    if (p && !state.urls[p] && !wanted.has(p)) {
      wanted.add(p);
      added = true;
    }
  }
  if (!added || flushT) return;
  flushT = setTimeout(async () => {
    const batch = [...wanted];
    wanted = new Set();
    flushT = null;
    try {
      const got = await mapi.urls(batch);
      set((s) => ({ urls: { ...s.urls, ...got } }));
    } catch {
      /* the next render asks again */
    }
  }, 30);
}

export { MsgError };
