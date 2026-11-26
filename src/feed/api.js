// Feed data access. Same shape in both modes:
//   cloud: Supabase (posts, post_media, post_likes, post_comments, comment_likes, saved_posts; feed() RPC;
//          photos go to the public "photos" bucket under "<person>/p/…")
//   demo:  this browser only, so the whole feed can be tried without a server.
import { CLOUD, ls, photoPath, supabase as sb } from '../store';
import { ROSTER } from '../roster';
import { buildPerson } from '../people';
import { processPostImage } from '../image';

export const PAGE = 10;
const BUCKET = 'photos';
const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
const extOf = (b) => (b.type === 'image/webp' ? 'webp' : b.type === 'image/png' ? 'png' : 'jpg');

export class FeedError extends Error {}
const fail = (error) => {
  const m = error?.message || String(error || '');
  if (/fetch|network|Failed to fetch|Load failed/i.test(m)) return new FeedError('network');
  if (/42501|permission|row-level|forbidden|Unauthorized/i.test(m) || error?.code === '42501') return new FeedError('forbidden');
  if (/exceeded|too large|413|Payload/i.test(m)) return new FeedError('too_big');
  if (/storage-full/.test(m)) return new FeedError('storage_full');
  return new FeedError('server');
};

/* ───────────────────────────── cloud ───────────────────────────── */
const cloud = {
  async list({ before = null, author = null, saved = false, ids = null, limit = PAGE } = {}) {
    const { data, error } = await sb.rpc('feed', { p_before: before, p_limit: limit, p_author: author, p_saved: saved, p_ids: ids });
    if (error) throw fail(error);
    return data;
  },
  async count(author) {
    const { count, error } = await sb.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', author);
    if (error) throw fail(error);
    return count || 0;
  },
  async storageUsed() {
    const { data, error } = await sb.rpc('photo_storage_used');
    if (error) throw fail(error);
    return Number(data) || 0;
  },
  /**
   * Uploads every size of every photo, then stores the post. If anything fails, files that were
   * already uploaded are removed again, so a failed post never leaves files behind.
   */
  async create(me, { caption, photos }, onProgress) {
    const uploaded = [];
    const put = async (blob) => {
      const path = `${me}/p/${Date.now().toString(36)}-${rnd()}.${extOf(blob)}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
      if (error) throw fail(error);
      uploaded.push(path);
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    };
    let postId = null;
    try {
      const media = [];
      let done = 0;
      const total = photos.reduce((n, p) => n + (p.orig ? 4 : 3), 0);
      const tick = () => onProgress?.(++done / total);
      for (const p of photos) {
        const [full, feed, thumb, orig] = await Promise.all([
          put(p.full).then((u) => (tick(), u)),
          put(p.feed).then((u) => (tick(), u)),
          put(p.thumb).then((u) => (tick(), u)),
          p.orig ? put(p.orig).then((u) => (tick(), u)) : null,
        ]);
        media.push({ full, feed, thumb, orig, w: p.w, h: p.h, bytes: p.full.size + p.feed.size + p.thumb.size + (p.orig?.size || 0) });
      }
      const { data: post, error } = await sb.from('posts').insert({ author_id: me, caption }).select('id').single();
      if (error) throw fail(error);
      postId = post.id;
      const rows = media.map((m, idx) => ({ post_id: postId, idx, full_url: m.full, feed_url: m.feed, thumb_url: m.thumb, orig_url: m.orig, w: m.w, h: m.h, bytes: m.bytes }));
      const { error: e2 } = await sb.from('post_media').insert(rows);
      if (e2) throw fail(e2);
      return postId;
    } catch (e) {
      if (postId) await sb.from('posts').delete().eq('id', postId);
      if (uploaded.length) await sb.storage.from(BUCKET).remove(uploaded).catch(() => {});
      throw e instanceof FeedError ? e : fail(e);
    }
  },
  async editCaption(id, caption) {
    const { data, error } = await sb.from('posts').update({ caption, edited_at: new Date().toISOString() }).eq('id', id).select('id');
    if (error) throw fail(error);
    if (!data?.length) throw new FeedError('forbidden');
  },
  /** Deletes the post, then the files that belong only to it (never the shared profile photos of old posts). */
  async remove(post) {
    const { data, error } = await sb.from('posts').delete().eq('id', post.id).select('id');
    if (error) throw fail(error);
    if (!data?.length) throw new FeedError('forbidden');
    const paths = post.media.filter((m) => m.own).flatMap((m) => [m.full, m.feed, m.thumb, m.orig]).map(photoPath).filter(Boolean);
    if (paths.length) await sb.storage.from(BUCKET).remove([...new Set(paths)]).catch(() => {});
  },
  async like(id, me, on) {
    const { error } = on ? await sb.from('post_likes').insert({ post_id: id, person_id: me }) : await sb.from('post_likes').delete().eq('post_id', id).eq('person_id', me);
    if (error && error.code !== '23505') throw fail(error);
  },
  async save(id, me, on) {
    const { error } = on ? await sb.from('saved_posts').insert({ post_id: id, person_id: me }) : await sb.from('saved_posts').delete().eq('post_id', id).eq('person_id', me);
    if (error && error.code !== '23505') throw fail(error);
  },
  async likers(id) {
    const { data, error } = await sb.from('post_likes').select('person_id,created_at').eq('post_id', id).order('created_at', { ascending: false });
    if (error) throw fail(error);
    return data.map((r) => r.person_id);
  },
  async comments(postId, me) {
    const { data, error } = await sb.from('post_comments').select('*').eq('post_id', postId).order('id', { ascending: true }).limit(500);
    if (error) throw fail(error);
    const ids = data.map((c) => c.id);
    let likes = [];
    if (ids.length) {
      const r = await sb.from('comment_likes').select('comment_id,person_id').in('comment_id', ids);
      if (r.error) throw fail(r.error);
      likes = r.data;
    }
    return data.map((c) => ({ ...c, likes: likes.filter((l) => l.comment_id === c.id).length, liked: likes.some((l) => l.comment_id === c.id && l.person_id === me) }));
  },
  async addComment(row) {
    const { data, error } = await sb.from('post_comments').insert(row).select().single();
    if (error) throw fail(error);
    return { ...data, likes: 0, liked: false };
  },
  async editComment(id, text) {
    const { data, error } = await sb.from('post_comments').update({ text, edited_at: new Date().toISOString() }).eq('id', id).select('id');
    if (error) throw fail(error);
    if (!data?.length) throw new FeedError('forbidden');
  },
  async deleteComment(id) {
    const { error } = await sb.rpc('delete_comment', { p_id: id });
    if (error) throw fail(error);
  },
  async likeComment(id, me, on) {
    const { error } = on ? await sb.from('comment_likes').insert({ comment_id: id, person_id: me }) : await sb.from('comment_likes').delete().eq('comment_id', id).eq('person_id', me);
    if (error && error.code !== '23505') throw fail(error);
  },
  subscribe(handlers) {
    const ch = sb
      .channel('memoris-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (p) => handlers.post?.(p.eventType, p.new, p.old))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, (p) => handlers.like?.(p.eventType, p.new, p.old))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, (p) => handlers.comment?.(p.eventType, p.new, p.old))
      .subscribe((status) => handlers.status?.(status));
    return () => sb.removeChannel(ch);
  },
};

/* ───────────────────────────── demo ───────────────────────────── */
const DKEY = 'memoris:demo-feed';
const listeners = new Set();
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('memoris-demo-feed') : null;
const toDataUrl = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
function dread() {
  let s = ls.get(DKEY, null);
  if (!s) {
    // Like the real move: everyone's profile photos become their first post.
    s = { seq: 0, cseq: 0, posts: [], media: [], likes: [], comments: [], clikes: [], saved: [] };
    const start = Date.now() - 20 * 864e5;
    ROSTER.map((b) => buildPerson(b, null))
      .filter((p) => p.photos.length)
      .forEach((p, i) => {
        const id = ++s.seq;
        s.posts.push({ id, author_id: p.id, caption: '', created_at: new Date(start + i * 3.6e6 * 7).toISOString(), edited_at: null, legacy: true });
        p.photos.slice(0, 10).forEach((ph, idx) => s.media.push({ post_id: id, idx, full: ph.full, feed: ph.full, thumb: ph.thumb, orig: null, w: 1200, h: 1500, own: false }));
      });
    ls.set(DKEY, s);
  }
  return s;
}
function dwrite(s, events = []) {
  if (!ls.set(DKEY, s)) throw new FeedError('storage_full');
  for (const e of events) {
    listeners.forEach((f) => f(e));
    bc?.postMessage(e);
  }
}
bc && (bc.onmessage = (ev) => listeners.forEach((f) => f(ev.data)));
const shape = (s, p, me) => {
  const likes = s.likes.filter((l) => l.post_id === p.id).sort((a, b) => b.at - a.at);
  return {
    ...p,
    media: s.media.filter((m) => m.post_id === p.id).sort((a, b) => a.idx - b.idx).map(({ full, feed, thumb, orig, w, h, own }) => ({ full, feed, thumb, orig, w, h, own })),
    likes: likes.length,
    liked: likes.some((l) => l.person_id === me),
    comments: s.comments.filter((c) => c.post_id === p.id && !c.deleted_at).length,
    saved: s.saved.some((x) => x.post_id === p.id && x.person_id === me),
    likers: likes.slice(0, 3).map((l) => l.person_id),
  };
};
const offline = () => {
  if (window.__memorisDemoOffline) throw new FeedError('network');
};
const demoMe = () => ls.get('memoris:demo-auth', {})?.session?.personId ?? null;
const demo = {
  async list({ before = null, author = null, saved = false, ids = null, limit = PAGE } = {}) {
    offline();
    const s = dread();
    const me = demoMe();
    return s.posts
      .filter((p) => (before == null || p.id < before) && (author == null || p.author_id === author) && (!saved || s.saved.some((x) => x.post_id === p.id && x.person_id === me)) && (!ids || ids.includes(p.id)))
      .sort((a, b) => b.id - a.id)
      .slice(0, limit)
      .map((p) => shape(s, p, me));
  },
  async count(author) {
    return dread().posts.filter((p) => p.author_id === author).length;
  },
  async storageUsed() {
    return JSON.stringify(dread()).length;
  },
  async create(me, { caption, photos }, onProgress) {
    offline();
    const s = dread();
    const id = ++s.seq;
    // Demo keeps only the small size (browser storage is tiny).
    const media = [];
    for (let i = 0; i < photos.length; i++) {
      const u = await toDataUrl(photos[i].thumb);
      media.push({ post_id: id, idx: i, full: u, feed: u, thumb: u, orig: null, w: photos[i].w, h: photos[i].h, own: true });
      onProgress?.((i + 1) / photos.length);
    }
    s.posts.push({ id, author_id: me, caption, created_at: new Date().toISOString(), edited_at: null, legacy: false });
    s.media.push(...media);
    dwrite(s, [{ t: 'post', ev: 'INSERT', row: { id, author_id: me } }]);
    return id;
  },
  async editCaption(id, caption) {
    offline();
    const s = dread();
    const p = s.posts.find((x) => x.id === id);
    if (!p || p.author_id !== demoMe()) throw new FeedError('forbidden');
    p.caption = caption;
    p.edited_at = new Date().toISOString();
    dwrite(s, [{ t: 'post', ev: 'UPDATE', row: { id } }]);
  },
  async remove(post) {
    offline();
    const s = dread();
    s.posts = s.posts.filter((p) => p.id !== post.id);
    s.media = s.media.filter((m) => m.post_id !== post.id);
    s.likes = s.likes.filter((m) => m.post_id !== post.id);
    s.comments = s.comments.filter((m) => m.post_id !== post.id);
    s.saved = s.saved.filter((m) => m.post_id !== post.id);
    dwrite(s, [{ t: 'post', ev: 'DELETE', old: { id: post.id } }]);
  },
  async like(id, me, on) {
    offline();
    const s = dread();
    s.likes = s.likes.filter((l) => !(l.post_id === id && l.person_id === me));
    if (on) s.likes.push({ post_id: id, person_id: me, at: Date.now() });
    dwrite(s, [{ t: 'like', row: { post_id: id } }]);
  },
  async save(id, me, on) {
    offline();
    const s = dread();
    s.saved = s.saved.filter((l) => !(l.post_id === id && l.person_id === me));
    if (on) s.saved.push({ post_id: id, person_id: me });
    dwrite(s);
  },
  async likers(id) {
    return dread().likes.filter((l) => l.post_id === id).sort((a, b) => b.at - a.at).map((l) => l.person_id);
  },
  async comments(postId, me) {
    offline();
    const s = dread();
    return s.comments
      .filter((c) => c.post_id === postId)
      .sort((a, b) => a.id - b.id)
      .map((c) => ({ ...c, likes: s.clikes.filter((l) => l.comment_id === c.id).length, liked: s.clikes.some((l) => l.comment_id === c.id && l.person_id === me) }));
  },
  async addComment(row) {
    offline();
    const s = dread();
    let parent = row.parent_id ? s.comments.find((c) => c.id === row.parent_id) : null;
    if (parent?.parent_id) parent = s.comments.find((c) => c.id === parent.parent_id);
    const c = { id: ++s.cseq, post_id: row.post_id, author_id: row.author_id, parent_id: parent?.id ?? null, text: row.text, created_at: new Date().toISOString(), edited_at: null, deleted_at: null };
    s.comments.push(c);
    dwrite(s, [{ t: 'comment', row: { post_id: c.post_id } }]);
    return { ...c, likes: 0, liked: false };
  },
  async editComment(id, text) {
    offline();
    const s = dread();
    const c = s.comments.find((x) => x.id === id);
    if (!c || c.author_id !== demoMe()) throw new FeedError('forbidden');
    c.text = text;
    c.edited_at = new Date().toISOString();
    dwrite(s, [{ t: 'comment', row: { post_id: c.post_id } }]);
  },
  async deleteComment(id) {
    offline();
    const s = dread();
    const c = s.comments.find((x) => x.id === id);
    if (!c) return;
    c.deleted_at = new Date().toISOString();
    c.text = '';
    dwrite(s, [{ t: 'comment', row: { post_id: c.post_id } }]);
  },
  async likeComment(id, me, on) {
    offline();
    const s = dread();
    s.clikes = s.clikes.filter((l) => !(l.comment_id === id && l.person_id === me));
    if (on) s.clikes.push({ comment_id: id, person_id: me });
    dwrite(s);
  },
  subscribe(handlers) {
    const f = (e) => {
      if (e.t === 'post') handlers.post?.(e.ev, e.row || {}, e.old || {});
      if (e.t === 'like') handlers.like?.('INSERT', e.row, {});
      if (e.t === 'comment') handlers.comment?.('INSERT', e.row, {});
    };
    listeners.add(f);
    setTimeout(() => handlers.status?.('SUBSCRIBED'), 0);
    return () => listeners.delete(f);
  },
};

export const fapi = CLOUD ? cloud : demo;
// Demo builds only: lets the automated checks measure the photo sizes.
if (!CLOUD && typeof window !== 'undefined') window.__memorisFeedTest = { processPostImage };
