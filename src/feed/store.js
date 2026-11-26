// Feed state that lives outside React, so the feed keeps its posts and scroll while you move around.
// Lists: "home" (everyone, newest first), "a<id>" (one person's posts), "saved" (my saved posts).
import { useSyncExternalStore } from 'react';
import { processPostImage } from '../image';
import { FeedError, PAGE, fapi } from './api';

let state = fresh();
const subs = new Set();
function fresh() {
  return { me: null, posts: {}, lists: {}, comments: {}, counts: {}, pending: [], live: false };
}
function set(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  subs.forEach((f) => f());
}
export function useFeed(selector = (s) => s) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => selector(state),
  );
}
export const getFeed = () => state;
const emptyList = { ids: [], done: false, loading: false, loaded: false, error: null };
export const listOf = (s, key) => s.lists[key] || emptyList;
const setList = (key, patch) => set((s) => ({ lists: { ...s.lists, [key]: { ...listOf(s, key), ...(typeof patch === 'function' ? patch(listOf(s, key)) : patch) } } }));
const merge = (rows) => set((s) => ({ posts: { ...s.posts, ...Object.fromEntries(rows.map((r) => [r.id, r])) } }));
const patchPost = (id, fn) => set((s) => (s.posts[id] ? { posts: { ...s.posts, [id]: { ...s.posts[id], ...fn(s.posts[id]) } } } : {}));
const paramsFor = (key) => (key === 'home' ? {} : key === 'saved' ? { saved: true } : { author: Number(key.slice(1)) });

/* ───────── lifecycle ───────── */
let off = null;
let dirty = new Set();
let timer = null;
let wasLive = false;
let dropped = false;
export function start(me) {
  if (state.me === me && off) return;
  stop();
  set({ ...fresh(), me });
  off = fapi.subscribe({
    status: (st) => {
      const live = st === 'SUBSCRIBED';
      set({ live });
      // Back after a drop: bring what is on screen up to date.
      if (live && dropped) {
        Object.keys(state.posts).forEach((id) => dirty.add(Number(id)));
        flush();
      }
      if (live) {
        wasLive = true;
        dropped = false;
      } else if (wasLive) dropped = true;
    },
    post: (ev, row, old) => {
      if (ev === 'DELETE') return drop(old?.id);
      if (ev === 'INSERT') return incoming(row.id);
      if (state.posts[row.id]) mark(row.id);
    },
    like: (ev, row, old) => mark((row && row.post_id) || old?.post_id),
    comment: (ev, row) => {
      const id = row?.post_id;
      if (!id) return;
      mark(id);
      if (state.comments[id]?.loaded) loadComments(id, { quiet: true });
    },
  });
}
export function stop() {
  off?.();
  off = null;
  wasLive = false;
  dropped = false;
  clearTimeout(timer);
  dirty = new Set();
  state = fresh();
  subs.forEach((f) => f());
}
function mark(id) {
  if (!id || !state.posts[id]) return;
  dirty.add(id);
  clearTimeout(timer);
  timer = setTimeout(flush, 400);
}
async function flush() {
  const ids = [...dirty];
  dirty = new Set();
  if (ids.length) await refreshPosts(ids).catch(() => {});
}
/** A new post from someone (or from my other device): shown after a tap, so the feed never jumps. */
async function incoming(id) {
  if (state.posts[id] || state.pending.includes(id)) return;
  const fetchOne = () => fapi.list({ ids: [id], limit: 1 }).then((r) => r[0]).catch(() => null);
  // The change can arrive a moment before the row is readable (another tab, a busy server): look twice.
  const row = (await fetchOne()) || (await new Promise((r) => setTimeout(r, 600)).then(fetchOne));
  if (!row || state.posts[id]) return;
  merge([row]);
  const k = `a${row.author_id}`;
  if (state.lists[k]?.loaded) setList(k, (l) => ({ ids: [row.id, ...l.ids.filter((x) => x !== row.id)] }));
  set((s) => ({ counts: s.counts[row.author_id] != null ? { ...s.counts, [row.author_id]: s.counts[row.author_id] + 1 } : s.counts }));
  if (state.lists.home?.loaded) set((s) => ({ pending: [row.id, ...s.pending] }));
}
export function showPending() {
  const ids = state.pending;
  set({ pending: [] });
  setList('home', (l) => ({ ids: [...ids, ...l.ids.filter((x) => !ids.includes(x))].sort((a, b) => b - a) }));
}
function drop(id) {
  if (!id) return;
  set((s) => {
    const posts = { ...s.posts };
    const author = posts[id]?.author_id;
    delete posts[id];
    const lists = Object.fromEntries(Object.entries(s.lists).map(([k, l]) => [k, { ...l, ids: l.ids.filter((x) => x !== id) }]));
    const counts = author != null && s.counts[author] ? { ...s.counts, [author]: s.counts[author] - 1 } : s.counts;
    return { posts, lists, counts, pending: s.pending.filter((x) => x !== id) };
  });
}

/* ───────── reading ───────── */
export async function loadList(key, { reset = false } = {}) {
  const l = listOf(state, key);
  if (l.loading || (!reset && l.done && l.loaded)) return;
  setList(key, { loading: true, error: null });
  try {
    const before = reset || !l.ids.length ? null : l.ids[l.ids.length - 1];
    const rows = await fapi.list({ ...paramsFor(key), before, limit: PAGE });
    merge(rows);
    const ids = rows.map((r) => r.id);
    setList(key, (cur) => ({ ids: reset ? ids : [...cur.ids, ...ids.filter((x) => !cur.ids.includes(x))], done: rows.length < PAGE, loading: false, loaded: true }));
    if (reset && key === 'home') set({ pending: [] });
  } catch (e) {
    setList(key, { loading: false, error: e.message || 'server' });
  }
}
export async function refreshPosts(ids) {
  const rows = [];
  for (let i = 0; i < ids.length; i += 50) rows.push(...(await fapi.list({ ids: ids.slice(i, i + 50), limit: 50 })));
  merge(rows);
  const got = new Set(rows.map((r) => r.id));
  ids.filter((id) => !got.has(id)).forEach(drop);
  return rows;
}
/** One post (for its own page). Resolves null when it does not exist (or was deleted). */
export async function loadPost(id) {
  const rows = await refreshPosts([id]);
  return rows[0] || null;
}
export async function loadCount(author) {
  const n = await fapi.count(author).catch(() => null);
  if (n != null) set((s) => ({ counts: { ...s.counts, [author]: n } }));
}
export const storageUsed = () => fapi.storageUsed();
export const likers = (id) => fapi.likers(id);

/* ───────── likes and saves (shown at once, undone if the server says no) ───────── */
export async function toggleLike(id, on) {
  const p = state.posts[id];
  if (!p) return;
  const want = on ?? !p.liked;
  if (want === p.liked) return;
  const before = { liked: p.liked, likes: p.likes, likers: p.likers };
  patchPost(id, (x) => ({ liked: want, likes: x.likes + (want ? 1 : -1), likers: want ? [state.me, ...(x.likers || []).filter((v) => v !== state.me)].slice(0, 3) : (x.likers || []).filter((v) => v !== state.me) }));
  try {
    await fapi.like(id, state.me, want);
  } catch (e) {
    patchPost(id, () => before);
    throw e;
  }
}
export async function toggleSave(id) {
  const p = state.posts[id];
  if (!p) return;
  const want = !p.saved;
  patchPost(id, () => ({ saved: want }));
  if (state.lists.saved?.loaded) setList('saved', (l) => ({ ids: want ? [id, ...l.ids.filter((x) => x !== id)].sort((a, b) => b - a) : l.ids.filter((x) => x !== id) }));
  try {
    await fapi.save(id, state.me, want);
  } catch (e) {
    patchPost(id, () => ({ saved: !want }));
    throw e;
  }
  return want;
}

/* ───────── writing posts ───────── */
export const MAX_PHOTOS = 10;
export const CAPTION_MAX = 2200;
export async function prepare(files, { original }) {
  const out = [];
  for (const f of files) out.push(await processPostImage(f, { original }));
  return out;
}
export async function create({ caption, photos }, onProgress) {
  const id = await fapi.create(state.me, { caption: caption.trim().slice(0, CAPTION_MAX), photos }, onProgress);
  const [row] = await fapi.list({ ids: [id], limit: 1 }).catch(() => []);
  if (row) {
    merge([row]);
    for (const k of ['home', `a${state.me}`]) if (state.lists[k]?.loaded) setList(k, (l) => ({ ids: [id, ...l.ids.filter((x) => x !== id)] }));
    set((s) => ({ counts: s.counts[state.me] != null ? { ...s.counts, [state.me]: s.counts[state.me] + 1 } : s.counts, pending: s.pending.filter((x) => x !== id) }));
  }
  return id;
}
export async function editCaption(id, caption) {
  const v = caption.trim().slice(0, CAPTION_MAX);
  const p = state.posts[id];
  if (!p || v === p.caption) return;
  const before = { caption: p.caption, edited_at: p.edited_at };
  patchPost(id, () => ({ caption: v, edited_at: new Date().toISOString() }));
  try {
    await fapi.editCaption(id, v);
  } catch (e) {
    patchPost(id, () => before);
    throw e;
  }
}
export async function removePost(id) {
  const p = state.posts[id];
  if (!p) return;
  await fapi.remove(p);
  drop(id);
}

/* ───────── comments ───────── */
const cOf = (id) => state.comments[id] || { items: [], loaded: false, loading: false, error: null };
const setC = (id, patch) => set((s) => ({ comments: { ...s.comments, [id]: { ...cOf(id), ...(typeof patch === 'function' ? patch(cOf(id)) : patch) } } }));
export async function loadComments(postId, { quiet = false } = {}) {
  if (!quiet) setC(postId, { loading: true, error: null });
  try {
    const items = await fapi.comments(postId, state.me);
    setC(postId, { items, loaded: true, loading: false, error: null });
  } catch (e) {
    setC(postId, { loading: false, error: quiet ? cOf(postId).error : e.message || 'server' });
  }
}
export async function addComment(postId, text, parentId = null) {
  const v = text.trim().slice(0, 1000);
  if (!v) return null;
  const row = await fapi.addComment({ post_id: postId, author_id: state.me, text: v, parent_id: parentId });
  setC(postId, (c) => ({ items: c.items.some((x) => x.id === row.id) ? c.items : [...c.items, row] }));
  patchPost(postId, (p) => ({ comments: p.comments + 1 }));
  return row;
}
export async function editComment(postId, id, text) {
  const v = text.trim().slice(0, 1000);
  if (!v) return;
  const before = cOf(postId).items.find((c) => c.id === id);
  setC(postId, (c) => ({ items: c.items.map((x) => (x.id === id ? { ...x, text: v, edited_at: new Date().toISOString() } : x)) }));
  try {
    await fapi.editComment(id, v);
  } catch (e) {
    setC(postId, (c) => ({ items: c.items.map((x) => (x.id === id ? before : x)) }));
    throw e;
  }
}
export async function deleteComment(postId, id) {
  await fapi.deleteComment(id);
  setC(postId, (c) => ({ items: c.items.map((x) => (x.id === id ? { ...x, text: '', deleted_at: new Date().toISOString() } : x)) }));
  patchPost(postId, (p) => ({ comments: Math.max(0, p.comments - 1) }));
}
export async function likeComment(postId, id) {
  const c = cOf(postId).items.find((x) => x.id === id);
  if (!c) return;
  const want = !c.liked;
  const flip = (on) => setC(postId, (cc) => ({ items: cc.items.map((x) => (x.id === id ? { ...x, liked: on, likes: x.likes + (on ? 1 : -1) } : x)) }));
  flip(want);
  try {
    await fapi.likeComment(id, state.me, want);
  } catch (e) {
    flip(!want);
    throw e;
  }
}

export { FeedError };
// Demo builds only: lets the automated checks look at the feed state.
if (typeof window !== 'undefined' && window.__memorisFeedTest) window.__memorisFeedTest.state = () => state;
