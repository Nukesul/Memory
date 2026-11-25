import { createClient } from '@supabase/supabase-js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;
/** true = real shared storage (Supabase). false = demo mode that lives only in this browser. */
export const CLOUD = Boolean(URL_ && KEY_);

// The session is kept in this browser and refreshed automatically, so people stay signed in.
const sb = CLOUD
  ? createClient(URL_, KEY_, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'memoris-auth' } })
  : null;
const BUCKET = 'photos';

export const ls = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const rid = () => Math.random().toString(36).slice(2, 8);
const toDataUrl = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });

// ───────── Photos ─────────
// The bucket is readable by direct link (fast, cacheable); writes are limited to your own folder.
// Older builds stored short-lived signed links in drafts, so both address forms are understood.
const PUB = `/storage/v1/object/public/${BUCKET}/`;
const SIGN = `/storage/v1/object/sign/${BUCKET}/`;
const SIGNED_KEY = 'memoris:signed';
export const photoPath = (u) => {
  if (typeof u !== 'string') return null;
  const i = u.indexOf(PUB);
  if (i >= 0) return decodeURIComponent(u.slice(i + PUB.length).split('?')[0]);
  const j = u.indexOf(SIGN);
  if (j >= 0) return decodeURIComponent(u.slice(j + SIGN.length).split('?')[0]);
  return null;
};
const canonical = (u) => {
  const path = photoPath(u);
  return path ? `${URL_}${PUB}${path.split('/').map(encodeURIComponent).join('/')}` : u;
};
const deepMap = (v, fn) => {
  if (typeof v === 'string') return fn(v);
  if (Array.isArray(v)) return v.map((x) => deepMap(x, fn));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepMap(x, fn)]));
  return v;
};
const unsign = (v) => deepMap(v, (u) => (photoPath(u) ? canonical(u) : u));
const withSigned = async (v) => unsign(v);
/** 128 random bits, so a photo address cannot be guessed. */
const randomName = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

// ───────── Accounts (invite-only) ─────────
const fnErr = async (error) => {
  // functions.invoke wraps non-2xx answers; the body carries our short error code.
  try {
    const body = await error.context.json();
    return new Error(body.error || 'server');
  } catch {
    return new Error('network');
  }
};
const cloudAuth = {
  async session() {
    const { data } = await sb.auth.getSession();
    return toSession(data.session);
  },
  onChange(cb) {
    const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
    return () => data.subscription.unsubscribe();
  },
  async signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'creds' : /fetch|network/i.test(error.message) ? 'network' : 'server');
  },
  async signOut() {
    await sb.auth.signOut();
  },
  async updatePassword(password) {
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw new Error(/should be different|same/i.test(error.message) ? 'same_password' : /weak|least|characters/i.test(error.message) ? 'weak_password' : /fetch|network/i.test(error.message) ? 'network' : 'server');
  },
  async invite(action, payload) {
    const { data, error } = await sb.functions.invoke('auth-invite', { body: { action, ...payload } });
    if (error) throw await fnErr(error);
    return data;
  },
  async isAdmin() {
    const { data, error } = await sb.rpc('is_admin');
    if (error) return false;
    return data === true;
  },
  async members() {
    const { data, error } = await sb.rpc('admin_members');
    if (error) throw error;
    return data;
  },
  async createInvite(person, kind) {
    const { data, error } = await sb.rpc('admin_create_invite', { p_person: person, p_kind: kind });
    if (error) throw new Error(error.message);
    return data;
  },
  async revokeInvites(person) {
    const { error } = await sb.rpc('admin_revoke_invites', { p_person: person });
    if (error) throw error;
  },
  async setDisabled(person, disabled) {
    const { error } = await sb.rpc('admin_set_disabled', { p_person: person, p_disabled: disabled });
    if (error) throw new Error(error.message);
  },
};
function toSession(s) {
  const id = Number(s?.user?.app_metadata?.person_id);
  return s && id ? { personId: id, email: s.user.email } : null;
}

// ───────── Supabase adapter ─────────
const cloud = {
  async load() {
    const [p, n, v, a] = await Promise.all([
      sb.from('profiles').select('id,filled,data,updated_at'),
      sb.from('notes').select('*').order('created_at', { ascending: false }).limit(300),
      sb.from('votes').select('voter_id,category,target_id'),
      sb.from('announcements').select('id,text,created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    if (p.error) throw p.error;
    if (n.error) throw n.error;
    const rows = await withSigned(p.data);
    // Votes are optional: the site still works if the table is missing.
    return { profiles: Object.fromEntries(rows.map((r) => [r.id, r])), notes: n.data, votes: v.error ? [] : v.data, announcements: a.error ? [] : a.data };
  },
  async saveProfile(id, data, filled) {
    const row = { id, data, filled, updated_at: new Date().toISOString() };
    const { error } = await sb.from('profiles').upsert({ ...row, data: unsign(data) });
    if (error) throw error;
    return row;
  },
  async uploadPhoto(id, { full, thumb, w, h }) {
    const base = `${id}/${Date.now()}-${randomName()}`;
    const ext = (b) => (b.type === 'image/webp' ? 'webp' : 'jpg');
    const put = async (path, blob) => {
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
        contentType: blob.type,
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw error;
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    };
    const [fullUrl, thumbUrl] = await Promise.all([put(`${base}.${ext(full)}`, full), put(`${base}-t.${ext(thumb)}`, thumb)]);
    return withSigned({ full: fullUrl, thumb: thumbUrl, w, h });
  },
  async removePhoto(photo) {
    // Best effort: delete the files behind a removed photo.
    const paths = [photo.full, photo.thumb].map(photoPath).filter(Boolean);
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
  },
  async addNote(note) {
    const { data, error } = await sb.from('notes').insert(note).select().single();
    if (error) throw error;
    return data;
  },
  async deleteNote(id) {
    const { error } = await sb.from('notes').delete().eq('id', id);
    if (error) throw error;
  },
  async saveVote(vote) {
    const { error } = await sb.from('votes').upsert(vote);
    if (error) throw error;
  },
  // Chat: the class room plus private messages that involve me.
  async loadChat(me) {
    const { data, error } = await sb
      .from('messages')
      .select('*')
      .or(`to_id.is.null,from_id.eq.${me},to_id.eq.${me}`)
      .order('created_at', { ascending: false })
      .limit(250);
    if (error) throw error;
    return data.reverse();
  },
  async sendMessage(m) {
    const { data, error } = await sb.from('messages').insert(m).select().single();
    if (error) throw error;
    return data;
  },
  // Both check that the database really changed a row: with row level security a refused
  // change is not an error, it just touches nothing, and the screen must not pretend otherwise.
  async editMessage(id, text) {
    const edited_at = new Date().toISOString();
    const { data, error } = await sb.from('messages').update({ text, edited_at }).eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('not_changed');
    return edited_at;
  },
  async deleteMessage(id) {
    const { data, error } = await sb.from('messages').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('not_changed');
  },
  // Reactions go through a function: it only toggles my own id on a message I can see.
  async reactMessage(id, reactions, emoji) {
    const { data, error } = await sb.rpc('react_message', { p_id: id, p_emoji: emoji });
    if (error) throw error;
    return data;
  },
  // Autographs: loaded per page so the home screen stays light.
  async loadAutographs(toId) {
    const { data, error } = await sb.from('autographs').select('from_id,to_id,ink,created_at').eq('to_id', toId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async saveAutograph(row) {
    const { error } = await sb.from('autographs').upsert({ ...row, created_at: new Date().toISOString() });
    if (error) throw error;
  },
  async deleteAutograph(fromId, toId) {
    const { error } = await sb.from('autographs').delete().eq('from_id', fromId).eq('to_id', toId);
    if (error) throw error;
  },
  // Time capsule: the list shows who has written; the text is only fetched for the author, or for everyone once it opens.
  async loadCapsuleMeta() {
    const { data, error } = await sb.rpc('capsule_meta');
    if (error) throw error;
    return data;
  },
  async getCapsule(id) {
    const { data, error } = await sb.from('capsules').select('*').eq('author_id', id).maybeSingle();
    if (error) throw error;
    return data;
  },
  async loadAllCapsules() {
    const { data, error } = await sb.from('capsules').select('*').order('updated_at');
    if (error) throw error;
    return data;
  },
  async saveCapsule(row) {
    const { error } = await sb.from('capsules').upsert({ ...row, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
  async deleteCapsule(id) {
    const { error } = await sb.from('capsules').delete().eq('author_id', id);
    if (error) throw error;
  },
  // Instant chat: any change to `messages` is a signal to reload. The payload is ignored on purpose.
  subscribeMessages(onChange) {
    const ch = sb
      .channel('memoris-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => onChange())
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  },
  // Admin: the database checks that the signed-in person is an admin.
  async admin(fn, args = {}) {
    const { p_pin, ...rest } = args; // eslint-disable-line no-unused-vars
    const { data, error } = await sb.rpc(fn, rest);
    if (error) throw error;
    return data;
  },
  async adminLoadChat() {
    const { data, error } = await sb.from('messages').select('*').is('to_id', null).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data;
  },
  async adminBackup() {
    const t = async (name, cols = '*') => {
      const { data, error } = await sb.from(name).select(cols);
      if (error) throw error;
      return data;
    };
    return {
      profiles: await t('profiles'),
      notes: await t('notes'),
      votes: await t('votes'),
      class_chat: (await t('messages')).filter((m) => m.to_id == null),
      announcements: await t('announcements'),
      capsule_writers: (await sb.rpc('capsule_meta')).data || [],
    };
  },
  // Push subscriptions go through functions, so nobody can read other people's endpoints.
  async savePushSub(args) {
    const { error } = await sb.rpc('save_push_sub', args);
    if (error) throw error;
  },
  async updatePushPrefs(args) {
    const { error } = await sb.rpc('update_push_prefs', args);
    if (error) throw error;
  },
  async removePushSub(endpoint) {
    const { error } = await sb.rpc('remove_push_sub', { p_endpoint: endpoint });
    if (error) throw error;
  },
  // Daily question: everyone's answers for the last weeks (about 20 people x 45 days).
  async touchPresence(id) {
    const { error } = await sb.from('presence').upsert({ person_id: id, seen_at: new Date().toISOString() });
    if (error) throw error;
  },
  async setPresenceVisible(id, visible) {
    const { error } = await sb.from('presence').upsert({ person_id: id, visible, seen_at: new Date().toISOString() });
    if (error) throw error;
  },
  async loadPresence() {
    const { data, error } = await sb.from('presence').select('person_id,seen_at,visible');
    if (error) throw error;
    return data;
  },
};

// ───────── Local demo adapter ─────────
const DEMO_KEY = 'memoris:demo';
const demo = {
  read: () => ({ votes: [], announcements: [], ...ls.get(DEMO_KEY, { profiles: {}, notes: [] }) }),
  write(v) {
    if (!ls.set(DEMO_KEY, v)) throw new Error('storage-full');
  },
  async load() {
    return demo.read();
  },
  async saveProfile(id, data, filled) {
    const s = demo.read();
    s.profiles[id] = { id, data, filled, updated_at: new Date().toISOString() };
    demo.write(s);
    return s.profiles[id];
  },
  async uploadPhoto(id, { full, thumb, w, h }) {
    return { full: await toDataUrl(full), thumb: await toDataUrl(thumb), w, h };
  },
  async removePhoto() {},
  async addNote(note) {
    const s = demo.read();
    const row = { ...note, id: Date.now() + rid(), created_at: new Date().toISOString() };
    s.notes = [row, ...s.notes];
    demo.write(s);
    return row;
  },
  async deleteNote(id) {
    const s = demo.read();
    s.notes = s.notes.filter((n) => n.id !== id);
    demo.write(s);
  },
  async loadChat(me) {
    return (demo.read().messages || []).filter((m) => m.to_id == null || m.from_id === me || m.to_id === me);
  },
  async sendMessage(m) {
    const s = demo.read();
    const row = { ...m, id: Date.now(), created_at: new Date().toISOString(), edited_at: null };
    s.messages = [...(s.messages || []), row];
    demo.write(s);
    return row;
  },
  async editMessage(id, text) {
    const s = demo.read();
    const edited_at = new Date().toISOString();
    s.messages = (s.messages || []).map((m) => (m.id === id ? { ...m, text, edited_at } : m));
    demo.write(s);
    return edited_at;
  },
  async deleteMessage(id) {
    const s = demo.read();
    s.messages = (s.messages || []).filter((m) => m.id !== id);
    demo.write(s);
  },
  async reactMessage(id, reactions) {
    const s = demo.read();
    s.messages = (s.messages || []).map((m) => (m.id === id ? { ...m, reactions } : m));
    demo.write(s);
  },
  async saveVote(vote) {
    const s = demo.read();
    s.votes = [...s.votes.filter((v) => !(v.voter_id === vote.voter_id && v.category === vote.category)), vote];
    demo.write(s);
  },
  async loadAutographs(toId) {
    return (demo.read().autographs || []).filter((a) => a.to_id === toId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async saveAutograph(row) {
    const s = demo.read();
    s.autographs = [...(s.autographs || []).filter((a) => !(a.from_id === row.from_id && a.to_id === row.to_id)), { ...row, created_at: new Date().toISOString() }];
    demo.write(s);
  },
  async deleteAutograph(fromId, toId) {
    const s = demo.read();
    s.autographs = (s.autographs || []).filter((a) => !(a.from_id === fromId && a.to_id === toId));
    demo.write(s);
  },
  async loadCapsuleMeta() {
    return (demo.read().capsules || []).map(({ author_id, updated_at }) => ({ author_id, updated_at }));
  },
  async getCapsule(id) {
    return (demo.read().capsules || []).find((c) => c.author_id === id) || null;
  },
  async loadAllCapsules() {
    return demo.read().capsules || [];
  },
  async saveCapsule(row) {
    const s = demo.read();
    s.capsules = [...(s.capsules || []).filter((c) => c.author_id !== row.author_id), { ...row, updated_at: new Date().toISOString() }];
    demo.write(s);
  },
  async deleteCapsule(id) {
    const s = demo.read();
    s.capsules = (s.capsules || []).filter((c) => c.author_id !== id);
    demo.write(s);
  },
  subscribeMessages(onChange) {
    const h = (e) => e.key === DEMO_KEY && onChange();
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  },
  // Demo mode has no server: whoever is signed in as the admin classmate is the admin.
  async admin(fn, args = {}) {
    const ok = dread().session?.personId === 2;
    const s = demo.read();
    if (!ok) return { ok: false };
    if (fn === 'admin_post') {
      s.announcements = [{ id: Date.now(), text: args.p_text, created_at: new Date().toISOString() }, ...(s.announcements || [])];
      demo.write(s);
    } else if (fn === 'admin_remove_announcement') {
      s.announcements = (s.announcements || []).filter((a) => a.id !== args.p_id);
      demo.write(s);
    } else if (fn === 'admin_stats') {
      const prof = Object.values(s.profiles || {});
      return {
        ok: true, profiles: prof.length, filled: prof.filter((p) => p.filled).length, notes: s.notes.length,
        messages: (s.messages || []).length, votes: s.votes.length, autographs: (s.autographs || []).length, capsules: (s.capsules || []).length,
        photo_files: 0, photo_bytes: 0, db_bytes: JSON.stringify(s).length,
      };
    }
    return { ok: true };
  },
  async adminLoadChat() {
    return (demo.read().messages || []).filter((m) => m.to_id == null).reverse();
  },
  async adminBackup() {
    const s = demo.read();
    return { profiles: Object.values(s.profiles || {}), notes: s.notes, votes: s.votes, class_chat: (s.messages || []).filter((m) => m.to_id == null), announcements: s.announcements || [], capsule_writers: (s.capsules || []).map((c) => ({ author_id: c.author_id, updated_at: c.updated_at })) };
  },
  async savePushSub() {},
  async updatePushPrefs() {},
  async removePushSub() {},
  async touchPresence(id) {
    const s = demo.read();
    s.presence = { ...(s.presence || {}), [id]: new Date().toISOString() };
    demo.write(s);
  },
  async setPresenceVisible(id, visible) {
    const s = demo.read();
    s.presenceHidden = { ...(s.presenceHidden || {}), [id]: !visible };
    demo.write(s);
  },
  async loadPresence() {
    const hidden = demo.read().presenceHidden || {};
    return Object.entries(demo.read().presence || {}).map(([id, seen_at]) => ({ person_id: Number(id), seen_at, visible: !hidden[id] }));
  },
};

// Demo accounts live in this browser only, so the whole sign-in flow can be tried without a server.
const DEMO_AUTH = 'memoris:demo-auth';
const demoListeners = new Set();
const dread = () => ({ accounts: {}, invites: {}, session: null, ...ls.get(DEMO_AUTH, {}) });
const dwrite = (v) => {
  ls.set(DEMO_AUTH, v);
  demoListeners.forEach((cb) => cb(v.session));
};
const randCode = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b % 64]).join('').slice(0, 22);
const demoAuth = {
  async session() {
    return dread().session;
  },
  onChange(cb) {
    demoListeners.add(cb);
    return () => demoListeners.delete(cb);
  },
  async signIn(email, password) {
    const s = dread();
    const a = s.accounts[email.trim().toLowerCase()];
    if (!a || a.pw !== password || a.disabled) throw new Error('creds');
    s.session = { personId: a.personId, email: email.trim().toLowerCase() };
    dwrite(s);
  },
  async signOut() {
    const s = dread();
    s.session = null;
    dwrite(s);
  },
  async updatePassword(password) {
    const s = dread();
    if (!password || password.length < 8) throw new Error('weak_password');
    const a = s.accounts[s.session?.email];
    if (a) {
      if (a.pw === password) throw new Error('same_password');
      a.pw = password;
    }
    dwrite(s);
  },
  /** Demo only: enter as a classmate without an account. */
  async enterAs(personId) {
    const s = dread();
    s.session = { personId, email: `demo${personId}@memoris.demo` };
    dwrite(s);
  },
  async invite(action, { code, email, password }) {
    const s = dread();
    const inv = s.invites[code];
    if (!inv || inv.used || inv.exp < Date.now()) throw new Error('invalid');
    if (action === 'info') return { person_id: inv.person, kind: inv.kind };
    if (!password || password.length < 8) throw new Error('weak_password');
    if (action === 'join') {
      const e = (email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new Error('bad_email');
      if (s.accounts[e]) throw new Error('email_taken');
      if (Object.values(s.accounts).some((a) => a.personId === inv.person)) throw new Error('already_registered');
      s.accounts[e] = { pw: password, personId: inv.person, created: new Date().toISOString() };
      inv.used = true;
      dwrite(s);
      return { ok: true, email: e };
    }
    const entry = Object.entries(s.accounts).find(([, a]) => a.personId === inv.person);
    if (!entry) throw new Error('no_account');
    entry[1].pw = password;
    inv.used = true;
    if (s.session?.personId === inv.person) s.session = null;
    dwrite(s);
    return { ok: true, email: entry[0] };
  },
  async isAdmin() {
    return dread().session?.personId === 2;
  },
  async members() {
    const s = dread();
    const ids = new Set([...Object.values(s.accounts).map((a) => a.personId), ...Object.values(s.invites).map((i) => i.person)]);
    return [...ids].map((id) => {
      const acc = Object.entries(s.accounts).find(([, a]) => a.personId === id);
      const inv = Object.values(s.invites).filter((i) => i.person === id && !i.used && i.exp > Date.now()).sort((a, b) => b.exp - a.exp)[0];
      return { person_id: id, email: acc?.[0] || null, registered_at: acc?.[1].created || null, disabled: Boolean(acc?.[1].disabled), invite_kind: inv?.kind || null, invite_expires: inv ? new Date(inv.exp).toISOString() : null };
    });
  },
  async createInvite(person, kind) {
    const s = dread();
    const has = Object.values(s.accounts).some((a) => a.personId === person);
    if (kind === 'join' && has) throw new Error('already_registered');
    if (kind === 'reset' && !has) throw new Error('no_account');
    for (const i of Object.values(s.invites)) if (i.person === person && i.kind === kind) i.used = true;
    const code = randCode();
    s.invites[code] = { person, kind, exp: Date.now() + (kind === 'join' ? 14 : 1) * 864e5, used: false };
    dwrite(s);
    return code;
  },
  async revokeInvites(person) {
    const s = dread();
    for (const i of Object.values(s.invites)) if (i.person === person) i.used = true;
    dwrite(s);
  },
  async setDisabled(person, disabled) {
    const s = dread();
    for (const a of Object.values(s.accounts)) if (a.personId === person) a.disabled = disabled;
    dwrite(s);
  },
};

export const api = CLOUD ? cloud : demo;
export const auth = CLOUD ? cloudAuth : demoAuth;
/** Forget everything this browser cached about the class (used on sign-out). */
export const clearLocalData = () => {
  ['memoris:cache', SIGNED_KEY, 'memoris:me', 'memoris:seen', 'memoris:pushprefs'].forEach((k) => ls.del(k));
};
