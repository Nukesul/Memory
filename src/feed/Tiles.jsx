import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { asset } from '../people';
import { href } from '../router';
import { firstName } from '../roster';
import { COUNTRY_HUE } from '../config';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { toggleLike, toggleSave, useFeed } from './store';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Number of columns for the width we have: 2 on a phone, up to 5 on a big screen. */
function useColumns(ref) {
  const [state, setState] = useState({ n: 2, w: 360 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => {
      const w = el.clientWidth || 360;
      const n = w < 600 ? 2 : w < 860 ? 3 : w < 1120 ? 4 : 5;
      setState((s) => (s.n === n && Math.abs(s.w - w) < 2 ? s : { n, w }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return state;
}

/** Height of a tile in units of its own width (only used to balance the columns). */
const guess = (p, colW) => {
  const media = p.media[0];
  const body = p.media.length ? (media.h && media.w ? 1 / clamp(media.w / media.h, 0.67, 1.6) : 1) : 0.5 + Math.min(p.caption.length, 160) / 260;
  const text = p.media.length && p.caption ? 38 / colW : 0;
  return body + text + 40 / colW;
};

/**
 * Posts as a masonry wall (Pinterest-style). Each post goes into the currently shortest column,
 * in order, so the newest are at the top and appending older ones never moves what you already see.
 */
export function Masonry({ ids, posts, showAuthor = true }) {
  const box = useRef(null);
  const { n, w } = useColumns(box);
  const cols = useMemo(() => {
    const colW = Math.max(120, (w - (n - 1) * 10) / n);
    const lists = Array.from({ length: n }, () => []);
    const heights = Array(n).fill(0);
    for (const id of ids) {
      const p = posts[id];
      if (!p) continue;
      let k = 0;
      for (let i = 1; i < n; i++) if (heights[i] < heights[k] - 0.02) k = i;
      lists[k].push(id);
      heights[k] += guess(p, colW) + 10 / colW;
    }
    return lists;
  }, [ids, posts, n, w]);
  return (
    <div className="wall" ref={box} style={{ '--cols': n }}>
      {cols.map((list, k) => (
        <div key={k} className="wall-col">
          {list.map((id, i) => <PostTile key={id} id={id} showAuthor={showAuthor} eager={k + i * n < 4} />)}
        </div>
      ))}
    </div>
  );
}

/** One post as a tile: the first photo at its own proportions, a short caption and a like. */
const PostTile = memo(function PostTile({ id, showAuthor, eager }) {
  const { t, person, toast } = useApp();
  const post = useFeed((s) => s.posts[id]);
  if (!post) return null;
  const author = person(post.author_id);
  const m = post.media[0];
  const ratio = m ? clamp(m.w / m.h, 0.67, 1.6) : null;
  const like = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleLike(post.id);
    } catch {
      toast(t('post_err'), 'err');
    }
  };
  const save = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toast(t((await toggleSave(post.id)) ? 'post_saved' : 'post_unsaved'));
    } catch {
      toast(t('post_err'), 'err');
    }
  };
  // The 480 px copy is enough for a tile; the bigger one is offered to dense screens.
  const long = (side) => (m.w >= m.h ? side : Math.round(side * (m.w / m.h)));
  return (
    <article className={`pin ${m ? '' : 'text'}`} style={{ '--hue': COUNTRY_HUE[author?.country] ?? 160 }}>
      <a className="pin-link" href={href(`post/${post.id}`)} aria-label={`${author?.name || ''}${post.caption ? ': ' + post.caption.slice(0, 80) : ''}`}>
        {m ? (
          <span className="pin-media" style={{ aspectRatio: ratio }}>
            <img
              src={asset(m.thumb)}
              srcSet={m.feed && m.feed !== m.thumb ? `${asset(m.thumb)} ${long(480)}w, ${asset(m.feed)} ${long(1080)}w` : undefined}
              sizes="(max-width: 600px) 50vw, 25vw"
              alt=""
              width={m.w}
              height={m.h}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={(e) => e.currentTarget.classList.add('in')}
            />
            {post.media.length > 1 && <span className="pin-multi"><Icon name="layers" size={14} /> {post.media.length}</span>}
          </span>
        ) : (
          <span className="pin-note">{post.caption}</span>
        )}
        {m && post.caption && <span className="pin-caption">{post.caption}</span>}
      </a>
      {m && (
        <button type="button" className={`pin-save ${post.saved ? 'on' : ''}`} onClick={save} aria-pressed={post.saved} aria-label={t(post.saved ? 'post_unsave' : 'post_save')}>
          <Icon name="bookmark" size={18} className={post.saved ? 'fill' : ''} />
        </button>
      )}
      <footer className="pin-foot">
        {showAuthor ? (
          <a className="pin-who" href={href(`p/${post.author_id}`)}>
            <Avatar p={author} className="mini round" />
            <span>{author ? firstName(author.name) : '?'}</span>
          </a>
        ) : (
          <span />
        )}
        <button type="button" className={`pin-like ${post.liked ? 'on' : ''}`} onClick={like} aria-pressed={post.liked} aria-label={t('post_like')}>
          <Icon name="heart" size={18} className={post.liked ? 'fill' : ''} />
          {post.likes > 0 && <span>{post.likes}</span>}
        </button>
      </footer>
    </article>
  );
});
