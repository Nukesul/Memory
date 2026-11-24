import { createClient } from '@supabase/supabase-js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;
/** true = real shared storage (Supabase). false = demo mode that lives only in this browser. */
export const CLOUD = Boolean(URL_ && KEY_);

const sb = CLOUD ? createClient(URL_, KEY_, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
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

// ───────── Supabase adapter ─────────
const cloud = {
  async load() {
    const [p, n, v] = await Promise.all([
      sb.from('profiles').select('id,filled,data,updated_at'),
      sb.from('notes').select('*').order('created_at', { ascending: false }).limit(300),
      sb.from('votes').select('voter_id,category,target_id'),
    ]);
    if (p.error) throw p.error;
    if (n.error) throw n.error;
    // Votes are optional: the site still works if the table is missing.
    return { profiles: Object.fromEntries(p.data.map((r) => [r.id, r])), notes: n.data, votes: v.error ? [] : v.data };
  },
  async saveProfile(id, data, filled) {
    const row = { id, data, filled, updated_at: new Date().toISOString() };
    const { error } = await sb.from('profiles').upsert(row);
    if (error) throw error;
    return row;
  },
  async uploadPhoto(id, { full, thumb, w, h }) {
    const base = `${id}/${Date.now()}-${rid()}`;
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
    return { full: fullUrl, thumb: thumbUrl, w, h };
  },
  async removePhoto(photo) {
    // Best effort: delete the files behind a removed photo.
    const marker = `/object/public/${BUCKET}/`;
    const paths = [photo.full, photo.thumb]
      .filter((u) => u && u.includes(marker))
      .map((u) => decodeURIComponent(u.split(marker)[1]));
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
  async editMessage(id, text) {
    const edited_at = new Date().toISOString();
    const { error } = await sb.from('messages').update({ text, edited_at }).eq('id', id);
    if (error) throw error;
    return edited_at;
  },
  async deleteMessage(id) {
    const { error } = await sb.from('messages').delete().eq('id', id);
    if (error) throw error;
  },
  async reactMessage(id, reactions) {
    const { error } = await sb.from('messages').update({ reactions }).eq('id', id);
    if (error) throw error;
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
    const { data, error } = await sb.from('capsules').select('author_id,updated_at');
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
};

// ───────── Local demo adapter ─────────
const DEMO_KEY = 'memoris:demo';
const demo = {
  read: () => ({ votes: [], ...ls.get(DEMO_KEY, { profiles: {}, notes: [] }) }),
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
};

export const api = CLOUD ? cloud : demo;
