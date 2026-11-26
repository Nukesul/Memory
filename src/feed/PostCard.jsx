import { memo, useEffect, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { asset } from '../people';
import { href, go } from '../router';
import { firstName } from '../roster';
import { ago } from '../time';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { toggleLike, toggleSave, useFeed } from './store';
import { LikersSheet, PostMenu, ShareSheet } from './Sheets';

const TAP_MS = 260;
const ratioOf = (m) => (m?.w && m?.h ? m.w / m.h : 1);
const clampRatio = (r, tall) => Math.min(1.91, Math.max(tall ? 0.6 : 0.8, r));

/** Photos of a post, swiped sideways. Double tap likes, a single tap opens full screen. */
export function Carousel({ post, eager, onLike, tall }) {
  const { openPhotos, person } = useApp();
  const media = post.media;
  const box = clampRatio(ratioOf(media[0]), tall);
  const track = useRef(null);
  const tap = useRef({ t: 0, timer: null });
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);
  const n = media.length;

  useEffect(() => () => clearTimeout(tap.current.timer), []);
  const onScroll = () => {
    const el = track.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  const to = (k) => {
    const el = track.current;
    if (el) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' });
  };
  const open = (k) => openPhotos(media.map((m) => ({ full: m.full, thumb: m.thumb, orig: m.orig, cap: post.caption, personId: post.author_id })), k);
  const onTap = (k) => {
    const now = Date.now();
    if (now - tap.current.t < TAP_MS) {
      clearTimeout(tap.current.timer);
      tap.current.t = 0;
      setBurst((b) => b + 1);
      onLike(true);
      return;
    }
    tap.current.t = now;
    tap.current.timer = setTimeout(() => open(k), TAP_MS);
  };

  return (
    <div className="pc-media" style={{ '--ratio': box }}>
      <div className="pc-track" ref={track} onScroll={onScroll}>
        {media.map((m, k) => {
          const r = ratioOf(m);
          const fit = Math.abs(r - box) / box < 0.12 ? 'cover' : 'contain';
          return (
            <button
              key={k}
              type="button"
              className={`pc-slide ${fit}`}
              onClick={() => onTap(k)}
              aria-label={`${person(post.author_id)?.name || ''} · ${k + 1}/${n}`}
            >
              <img
                src={asset(m.feed || m.full)}
                alt={k === 0 ? post.caption.slice(0, 120) : ''}
                loading={eager && k === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable="false"
                onLoad={(e) => e.currentTarget.classList.add('in')}
              />
            </button>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <span className="pc-count" aria-hidden="true">{i + 1}/{n}</span>
          <button type="button" className="pc-arrow prev" onClick={() => to(i - 1)} disabled={i === 0} aria-label="‹" tabIndex={-1}><Icon name="left" size={18} /></button>
          <button type="button" className="pc-arrow next" onClick={() => to(i + 1)} disabled={i === n - 1} aria-label="›" tabIndex={-1}><Icon name="right" size={18} /></button>
        </>
      )}
      {burst > 0 && <span key={burst} className="pc-burst" aria-hidden="true"><Icon name="heart" size={96} className="fill" /></span>}
      {n > 1 && (
        <span className="pc-dots" aria-hidden="true">
          {media.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}
        </span>
      )}
    </div>
  );
}

function Caption({ post, full }) {
  const { t, person } = useApp();
  const [open, setOpen] = useState(full);
  if (!post.caption) return null;
  const author = person(post.author_id);
  const long = post.caption.length > 140 || post.caption.split('\n').length > 3;
  return (
    <p className={`pc-caption ${open || !long ? 'open' : ''} ${post.media.length ? '' : 'text-only'}`}>
      <a className="pc-who" href={href(`p/${post.author_id}`)}>{author ? firstName(author.name) : '?'}</a>{' '}
      <span className="pc-text">{post.caption}</span>
      {long && !open && (
        <button type="button" className="pc-more" onClick={() => setOpen(true)}>{t('post_more')}</button>
      )}
    </p>
  );
}

/** One post in the feed (or on its own page with `full`). */
function PostCard({ id, full = false, eager = false, onComment }) {
  const { t, lang, person, me, toast } = useApp();
  const post = useFeed((s) => s.posts[id]);
  const [sheet, setSheet] = useState(null);
  const [pop, setPop] = useState(false);
  if (!post) return null;
  const author = person(post.author_id);
  const like = async (on) => {
    if (on === true && post.liked) return;
    if (!post.liked) {
      setPop(true);
      setTimeout(() => setPop(false), 400);
    }
    try {
      await toggleLike(post.id, on);
    } catch {
      toast(t('post_err'), 'err');
    }
  };
  const save = async () => {
    try {
      const on = await toggleSave(post.id);
      toast(t(on ? 'post_saved' : 'post_unsaved'));
    } catch {
      toast(t('post_err'), 'err');
    }
  };
  const firstLiker = post.likers?.find((x) => x !== me?.id) ?? post.likers?.[0];
  const byMe = firstLiker === me?.id;
  const likerName = firstName(person(firstLiker)?.name || '…');

  return (
    <article className={`post-card ${full ? 'full' : ''}`} aria-labelledby={`pc-${post.id}`}>
      <header className="pc-head">
        <a className="pc-av" href={href(`p/${post.author_id}`)} tabIndex={-1} aria-hidden="true">
          <Avatar p={author} className="mini round" />
        </a>
        <span className="pc-names">
          <a id={`pc-${post.id}`} href={href(`p/${post.author_id}`)}>{author?.name || '?'}</a>
          <small>
            <a href={href(`post/${post.id}`)} className="pc-time"><time dateTime={post.created_at}>{ago(lang, post.created_at)}</time></a>
            {post.edited_at && <> · {t('post_edited')}</>}
          </small>
        </span>
        <button type="button" className="pc-icon" onClick={() => setSheet('menu')} aria-label={t('post_actions')}>
          <Icon name="more" size={22} />
        </button>
      </header>

      {post.media.length > 0 && <Carousel post={post} eager={eager} onLike={like} tall={full} />}
      {!post.media.length && <Caption post={post} full />}

      <div className="pc-actions">
        <button type="button" className={`pc-icon like ${post.liked ? 'on' : ''} ${pop ? 'pop' : ''}`} onClick={() => like()} aria-pressed={post.liked} aria-label={t('post_like')}>
          <Icon name="heart" size={26} className={post.liked ? 'fill' : ''} />
        </button>
        <button type="button" className="pc-icon" onClick={() => (onComment ? onComment() : go(`post/${post.id}`))} aria-label={t('post_comment')}>
          <Icon name="comment" size={25} />
        </button>
        <button type="button" className="pc-icon" onClick={() => setSheet('share')} aria-label={t('post_send')}>
          <Icon name="send" size={24} />
        </button>
        <span className="pc-spacer" />
        <button type="button" className={`pc-icon save ${post.saved ? 'on' : ''}`} onClick={save} aria-pressed={post.saved} aria-label={t(post.saved ? 'post_unsave' : 'post_save')}>
          <Icon name="bookmark" size={24} className={post.saved ? 'fill' : ''} />
        </button>
      </div>

      <div className="pc-body">
        {post.likes > 0 && (
          <button type="button" className="pc-likes" onClick={() => setSheet('likers')}>
            {byMe
              ? post.likes === 1 ? t('post_liked_me') : t('post_liked_me_many', { n: post.likes - 1 })
              : post.likes === 1 ? t('post_liked_one', { name: likerName }) : t('post_liked_many', { name: likerName, n: post.likes - 1 })}
          </button>
        )}
        {post.media.length > 0 && <Caption post={post} full={full} />}
        {!full && post.comments > 0 && (
          <a className="pc-comments" href={href(`post/${post.id}`)}>{t('post_comments_all', { n: post.comments })}</a>
        )}
        {!full && post.comments === 0 && (
          <a className="pc-comments quiet" href={href(`post/${post.id}`)}>{t('post_comment_add')}</a>
        )}
      </div>

      {sheet === 'menu' && <PostMenu post={post} onClose={() => setSheet(null)} onShare={() => setSheet('share')} />}
      {sheet === 'share' && <ShareSheet post={post} onClose={() => setSheet(null)} />}
      {sheet === 'likers' && <LikersSheet post={post} onClose={() => setSheet(null)} />}
    </article>
  );
}

export default memo(PostCard);
