// Messenger data access. Two implementations with the same shape:
//   cloud: Supabase (tables conversations, conversation_members, messages; RPCs; private "chat" bucket)
//   demo:  this browser only, so the whole interface can be tried and tested without a server.
import { CLOUD, ls, supabase as sb } from '../store';

export const PAGE = 40;
const BUCKET = 'chat';
const SIGN_TTL = 6 * 3600; // seconds
const uuid = () => crypto.randomUUID();
const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
const extOf = (mime) => ({ 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/aac': 'aac' })[mime.split(';')[0]] || 'bin';

// Errors the screen knows how to explain.
export class MsgError extends Error {}
const fail = (error) => {
  const m = error?.message || '';
  if (/fetch|network|Failed to fetch|Load failed/i.test(m)) return new MsgError('network');
  if (/forbidden|42501|permission/i.test(m) || error?.code === '42501') return new MsgError('forbidden');
  if (/not_found/.test(m)) return new MsgError('not_found');
  if (/bad_title/.test(m)) return new MsgError('bad_title');
  return new MsgError('server');
};

/* ───────────────────────────── cloud ───────────────────────────── */
const signed = new Map(); // path -> { url, exp }
const cloud = {
  async inbox() {
    const { data, error } = await sb.rpc('inbox');
    if (error) throw fail(error);
    return data;
  },
  async members(conv) {
    const { data, error } = await sb.from('conversation_members').select('person_id,role,last_read_id,joined_at').eq('conversation_id', conv);
    if (error) throw fail(error);
    return data;
  },
  async messages(conv, { before = null, after = null, limit = PAGE } = {}) {
    let q = sb.from('messages').select('*').eq('conversation_id', conv);
    if (after != null) q = q.gt('id', after).order('id', { ascending: true }).limit(limit);
    else {
      if (before != null) q = q.lt('id', before);
      q = q.order('id', { ascending: false }).limit(limit);
    }
    const { data, error } = await q;
    if (error) throw fail(error);
    return after != null ? data : data.reverse();
  },
  async pinned(conv) {
    const { data, error } = await sb.from('messages').select('*').eq('conversation_id', conv).not('pinned_at', 'is', null).order('pinned_at', { ascending: false }).limit(20);
    if (error) throw fail(error);
    return data;
  },
  async media(conv) {
    const { data, error } = await sb.from('messages').select('id,from_id,attachments,created_at').eq('conversation_id', conv).eq('kind', 'photo').is('deleted_at', null).order('id', { ascending: false }).limit(200);
    if (error) throw fail(error);
    return data;
  },
  // The client id makes a retry safe: the same message is never stored twice.
  async send(row) {
    const { data, error } = await sb.from('messages').insert(row).select().single();
    if (!error) return data;
    if (error.code === '23505') {
      const { data: same } = await sb.from('messages').select('*').eq('client_id', row.client_id).maybeSingle();
      if (same) return same;
    }
    throw fail(error);
  },
  async edit(id, text) {
    const { data, error } = await sb.from('messages').update({ text, edited_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
    if (error) throw fail(error);
    if (!data) throw new MsgError('not_changed');
    return data;
  },
  async rpc(fn, args) {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw fail(error);
    return data;
  },
  async uploadFile(conv, blob, mime) {
    const path = `${conv}/${Date.now()}-${rnd()}.${extOf(mime)}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: mime.split(';')[0], cacheControl: '31536000', upsert: false });
    if (error) throw fail(error);
    return path;
  },
  /** Signed links for private chat files, cached until shortly before they expire. */
  async urls(paths) {
    const now = Date.now();
    const need = [...new Set(paths)].filter((p) => p && !(signed.get(p)?.exp > now + 600e3));
    for (let i = 0; i < need.length; i += 100) {
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(need.slice(i, i + 100), SIGN_TTL);
      if (error) throw fail(error);
      for (const r of data) if (r.signedUrl) signed.set(r.path, { url: r.signedUrl, exp: now + SIGN_TTL * 1000 });
    }
    return Object.fromEntries(paths.map((p) => [p, signed.get(p)?.url]));
  },
  subscribe(handlers) {
    const ch = sb
      .channel('memoris-messenger')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (p) => handlers.message?.(p.eventType, p.new, p.old))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, (p) => handlers.member?.(p.eventType, p.new, p.old))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (p) => handlers.conversation?.(p.eventType, p.new))
      .subscribe((status) => handlers.status?.(status));
    return () => sb.removeChannel(ch);
  },
  /** "Typing…" travels over a private channel that only members of the conversation may join. */
  typing(conv, me, onTyping) {
    const ch = sb.channel(`conv:${conv}`, { config: { private: true, broadcast: { self: false } } });
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => payload?.p !== me && onTyping(payload.p));
    ch.subscribe();
    return {
      send: () => ch.send({ type: 'broadcast', event: 'typing', payload: { p: me } }).catch(() => {}),
      close: () => sb.removeChannel(ch),
    };
  },
};

/* ───────────────────────────── demo ───────────────────────────── */
const DKEY = 'memoris:demo-msgr';
const listeners = new Set();
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('memoris-demo-msgr') : null;
const blobs = new Map(); // path -> object URL (this tab only)
const demoMe = () => ls.get('memoris:demo-auth', {})?.session?.personId ?? null;
function dread() {
  let s = ls.get(DKEY, null);
  if (!s) {
    s = { seq: 100, convs: [{ id: 1, kind: 'class', title: null, avatar: null, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() }], members: [], messages: [] };
    for (let p = 1; p <= 20; p++) s.members.push({ conversation_id: 1, person_id: p, role: p === 2 ? 'owner' : 'member', last_read_id: 0, pinned: false, muted: false, joined_at: new Date().toISOString() });
    ls.set(DKEY, s);
  }
  return s;
}
function dwrite(s, events) {
  ls.set(DKEY, s);
  for (const e of events) {
    listeners.forEach((h) => h(e));
    bc?.postMessage(e);
  }
}
bc?.addEventListener('message', (ev) => listeners.forEach((h) => h(ev.data)));
const isMember = (s, conv, p) => s.members.some((m) => m.conversation_id === conv && m.person_id === p);
const roleOf = (s, conv, p) => s.members.find((m) => m.conversation_id === conv && m.person_id === p)?.role;
const need = (cond, code = 'forbidden') => {
  if (!cond) throw new MsgError(code);
};
function dInsert(s, row) {
  const msg = {
    id: ++s.seq, created_at: new Date().toISOString(), edited_at: null, reactions: {}, reply_to: null, attachments: [], kind: 'text',
    forwarded_from: null, pinned_at: null, pinned_by: null, deleted_at: null, to_id: null, client_id: null, ...row,
  };
  s.messages.push(msg);
  const c = s.convs.find((x) => x.id === msg.conversation_id);
  c.last_message_at = msg.created_at;
  const mine = s.members.find((m) => m.conversation_id === msg.conversation_id && m.person_id === msg.from_id);
  if (mine) mine.last_read_id = Math.max(mine.last_read_id, msg.id);
  return msg;
}
function dDirect(s, a, b) {
  const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
  let c = s.convs.find((x) => x.direct_key === key);
  if (!c) {
    c = { id: ++s.seq, kind: 'direct', title: null, avatar: null, direct_key: key, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() };
    s.convs.push(c);
    for (const p of [a, b]) s.members.push({ conversation_id: c.id, person_id: p, role: 'member', last_read_id: 0, pinned: false, muted: false, joined_at: c.created_at });
  }
  return c.id;
}
const demoRpc = {
  inbox(s, me) {
    return s.members
      .filter((m) => m.person_id === me)
      .map((cm) => {
        const c = s.convs.find((x) => x.id === cm.conversation_id);
        const msgs = s.messages.filter((m) => m.conversation_id === c.id);
        const l = msgs[msgs.length - 1];
        return {
          id: c.id, kind: c.kind, title: c.title, avatar: c.avatar, last_message_at: c.last_message_at, pinned: cm.pinned, muted: cm.muted, my_role: cm.role, last_read_id: cm.last_read_id,
          unread: msgs.filter((m) => m.id > cm.last_read_id && m.from_id !== me && !m.deleted_at && m.kind !== 'system').length,
          members: s.members.filter((x) => x.conversation_id === c.id).map((x) => x.person_id).sort((a, b) => a - b),
          last: l ? { id: l.id, from_id: l.from_id, kind: l.kind, text: (l.text || '').slice(0, 140), deleted: Boolean(l.deleted_at), n: l.attachments.length, created_at: l.created_at } : null,
        };
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.last_message_at.localeCompare(a.last_message_at));
  },
  open_direct(s, me, { p_other }) {
    need(p_other && p_other !== me, 'bad_request');
    return dDirect(s, me, p_other);
  },
  create_group(s, me, { p_title, p_members }) {
    need((p_title || '').trim(), 'bad_title');
    const c = { id: ++s.seq, kind: 'group', title: p_title.trim().slice(0, 60), avatar: null, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() };
    s.convs.push(c);
    s.members.push({ conversation_id: c.id, person_id: me, role: 'owner', last_read_id: 0, pinned: false, muted: false, joined_at: c.created_at });
    for (const p of new Set(p_members)) if (p !== me) s.members.push({ conversation_id: c.id, person_id: p, role: 'member', last_read_id: 0, pinned: false, muted: false, joined_at: c.created_at });
    dInsert(s, { conversation_id: c.id, from_id: me, kind: 'system', text: 'created' });
    return c.id;
  },
  update_group(s, me, { p_conv, p_title }) {
    need(['owner', 'admin'].includes(roleOf(s, p_conv, me)));
    need((p_title || '').trim(), 'bad_title');
    s.convs.find((c) => c.id === p_conv).title = p_title.trim().slice(0, 60);
    dInsert(s, { conversation_id: p_conv, from_id: me, kind: 'system', text: `renamed:${p_title.trim()}` });
  },
  add_members(s, me, { p_conv, p_members }) {
    need(['owner', 'admin'].includes(roleOf(s, p_conv, me)));
    const added = p_members.filter((p) => !isMember(s, p_conv, p));
    const top = Math.max(0, ...s.messages.filter((m) => m.conversation_id === p_conv).map((m) => m.id));
    for (const p of added) s.members.push({ conversation_id: p_conv, person_id: p, role: 'member', last_read_id: top, pinned: false, muted: false, joined_at: new Date().toISOString() });
    if (added.length) dInsert(s, { conversation_id: p_conv, from_id: me, kind: 'system', text: `added:${added.join(',')}` });
  },
  remove_member(s, me, { p_conv, p_person }) {
    const r = roleOf(s, p_conv, me);
    const tr = roleOf(s, p_conv, p_person);
    need(r === 'owner' || (r === 'admin' && tr === 'member'));
    s.members = s.members.filter((m) => !(m.conversation_id === p_conv && m.person_id === p_person));
    dInsert(s, { conversation_id: p_conv, from_id: me, kind: 'system', text: `removed:${p_person}` });
  },
  set_member_role(s, me, { p_conv, p_person, p_role }) {
    need(roleOf(s, p_conv, me) === 'owner' && p_person !== me);
    const m = s.members.find((x) => x.conversation_id === p_conv && x.person_id === p_person);
    if (m && m.role !== 'owner') m.role = p_role;
  },
  leave_conversation(s, me, { p_conv }) {
    need(s.convs.find((c) => c.id === p_conv)?.kind === 'group', 'cannot_leave');
    const was = roleOf(s, p_conv, me);
    s.members = s.members.filter((m) => !(m.conversation_id === p_conv && m.person_id === me));
    if (was === 'owner') {
      const next = s.members.filter((m) => m.conversation_id === p_conv).sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'))[0];
      if (next) next.role = 'owner';
    }
    dInsert(s, { conversation_id: p_conv, from_id: me, kind: 'system', text: 'left' });
  },
  delete_message(s, me, { p_id }) {
    const m = s.messages.find((x) => x.id === p_id);
    need(m && isMember(s, m.conversation_id, me), 'not_found');
    need(m.from_id === me || ['owner', 'admin'].includes(roleOf(s, m.conversation_id, me)));
    Object.assign(m, { deleted_at: new Date().toISOString(), text: '', attachments: [], reactions: {}, pinned_at: null, pinned_by: null });
    return m;
  },
  pin_message(s, me, { p_id, p_pin }) {
    const m = s.messages.find((x) => x.id === p_id);
    need(m && isMember(s, m.conversation_id, me) && !m.deleted_at, 'not_found');
    const kind = s.convs.find((c) => c.id === m.conversation_id).kind;
    need(kind === 'direct' || ['owner', 'admin'].includes(roleOf(s, m.conversation_id, me)));
    Object.assign(m, { pinned_at: p_pin ? new Date().toISOString() : null, pinned_by: p_pin ? me : null });
    return m;
  },
  forward_message(s, me, { p_id, p_conv, p_client }) {
    const m = s.messages.find((x) => x.id === p_id);
    need(m && isMember(s, m.conversation_id, me) && isMember(s, p_conv, me), 'not_found');
    if (s.messages.some((x) => x.client_id === p_client)) return null;
    return dInsert(s, { conversation_id: p_conv, from_id: me, kind: m.kind, text: m.text, attachments: m.attachments, forwarded_from: m.forwarded_from || m.id, client_id: p_client }).id;
  },
  react_message(s, me, { p_id, p_emoji }) {
    const m = s.messages.find((x) => x.id === p_id);
    need(m && isMember(s, m.conversation_id, me) && !m.deleted_at, 'not_found');
    const set = new Set(m.reactions[p_emoji] || []);
    if (set.has(me)) set.delete(me);
    else set.add(me);
    if (set.size) m.reactions = { ...m.reactions, [p_emoji]: [...set] };
    else {
      const { [p_emoji]: _gone, ...rest } = m.reactions; // eslint-disable-line no-unused-vars
      m.reactions = rest;
    }
    return m.reactions;
  },
  mark_read(s, me, { p_conv, p_upto }) {
    const cm = s.members.find((m) => m.conversation_id === p_conv && m.person_id === me);
    const top = Math.max(0, ...s.messages.filter((m) => m.conversation_id === p_conv).map((m) => m.id));
    if (cm) cm.last_read_id = Math.max(cm.last_read_id, Math.min(p_upto, top));
    return cm;
  },
  set_conv_flag(s, me, { p_conv, p_flag, p_value }) {
    const cm = s.members.find((m) => m.conversation_id === p_conv && m.person_id === me);
    if (cm && (p_flag === 'pinned' || p_flag === 'muted')) cm[p_flag] = p_value;
  },
  search_messages(s, me, { p_q }) {
    const q = (p_q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const mine = new Set(s.members.filter((m) => m.person_id === me).map((m) => m.conversation_id));
    return s.messages.filter((m) => mine.has(m.conversation_id) && !m.deleted_at && m.kind !== 'system' && (m.text || '').toLowerCase().includes(q)).reverse().slice(0, 50);
  },
};
const demo = {
  async inbox() {
    return demoRpc.inbox(dread(), demoMe());
  },
  async members(conv) {
    const s = dread();
    need(isMember(s, conv, demoMe()), 'not_found');
    return s.members.filter((m) => m.conversation_id === conv);
  },
  async messages(conv, { before = null, after = null, limit = PAGE } = {}) {
    const s = dread();
    need(isMember(s, conv, demoMe()), 'not_found');
    const all = s.messages.filter((m) => m.conversation_id === conv);
    if (after != null) return all.filter((m) => m.id > after).slice(0, limit);
    const older = before != null ? all.filter((m) => m.id < before) : all;
    return older.slice(-limit);
  },
  async pinned(conv) {
    return dread().messages.filter((m) => m.conversation_id === conv && m.pinned_at).sort((a, b) => b.pinned_at.localeCompare(a.pinned_at));
  },
  async media(conv) {
    return dread().messages.filter((m) => m.conversation_id === conv && m.kind === 'photo' && !m.deleted_at).reverse();
  },
  async send(row) {
    const s = dread();
    const me = demoMe();
    need(row.from_id === me && isMember(s, row.conversation_id, me));
    const same = row.client_id && s.messages.find((m) => m.client_id === row.client_id);
    if (same) return same;
    if (window.__memorisDemoOffline) throw new MsgError('network'); // lets tests simulate a lost connection
    const msg = dInsert(s, row);
    dwrite(s, [{ t: 'message', e: 'INSERT', row: msg }]);
    return msg;
  },
  async edit(id, text) {
    const s = dread();
    const m = s.messages.find((x) => x.id === id);
    need(m && m.from_id === demoMe() && !m.deleted_at, 'not_changed');
    Object.assign(m, { text, edited_at: new Date().toISOString() });
    dwrite(s, [{ t: 'message', e: 'UPDATE', row: m }]);
    return m;
  },
  async rpc(fn, args) {
    const s = dread();
    const me = demoMe();
    const out = demoRpc[fn](s, me, args || {});
    const events = [{ t: 'refresh' }];
    if (out && typeof out === 'object' && 'conversation_id' in out && 'id' in out && 'kind' in out) events.unshift({ t: 'message', e: 'UPDATE', row: out });
    dwrite(s, events);
    return out && typeof out === 'object' && 'reactions' in out ? undefined : out;
  },
  async uploadFile(conv, blob, mime) {
    const path = `${conv}/${Date.now()}-${rnd()}.${extOf(mime)}`;
    blobs.set(path, URL.createObjectURL(blob));
    return path;
  },
  async urls(paths) {
    return Object.fromEntries(paths.map((p) => [p, blobs.get(p) || '']));
  },
  subscribe(handlers) {
    const h = (ev) => {
      if (ev.t === 'message') handlers.message?.(ev.e, ev.row, null);
      else handlers.refresh?.();
    };
    listeners.add(h);
    handlers.status?.('SUBSCRIBED');
    return () => listeners.delete(h);
  },
  typing(conv, me, onTyping) {
    const ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`memoris-typing-${conv}`) : null;
    ch?.addEventListener('message', (e) => e.data?.p !== me && onTyping(e.data.p));
    return { send: () => ch?.postMessage({ p: me }), close: () => ch?.close() };
  },
};

export const mapi = CLOUD ? cloud : demo;
export { uuid };
