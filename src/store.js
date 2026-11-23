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
    const [p, n] = await Promise.all([
      sb.from('profiles').select('id,filled,data,updated_at'),
      sb.from('notes').select('*').order('created_at', { ascending: false }).limit(300),
    ]);
    if (p.error) throw p.error;
    if (n.error) throw n.error;
    return { profiles: Object.fromEntries(p.data.map((r) => [r.id, r])), notes: n.data };
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
};

// ───────── Local demo adapter ─────────
const DEMO_KEY = 'memoris:demo';
const demo = {
  read: () => ls.get(DEMO_KEY, { profiles: {}, notes: [] }),
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
};

export const api = CLOUD ? cloud : demo;
