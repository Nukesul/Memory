import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../app-context';
import { Icon } from '../components/Icons';
import { EmptyState } from '../components/ui';
import PostCard from './PostCard';
import { Masonry } from './Tiles';
import { listOf, loadList, showPending, useFeed } from './store';

/** Calls `onHit` when the element scrolls into view (loads the next page a screen before the end). */
function useSentinel(onHit, active) {
  const ref = useRef(null);
  const cb = useRef(onHit);
  cb.current = onHit;
  useEffect(() => {
    if (!active || !ref.current || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && cb.current(), { rootMargin: '900px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [active]);
  return ref;
}

function Skeleton() {
  return (
    <div className="post-card skeleton" aria-hidden="true">
      <div className="pc-head"><span className="sk-av" /><span className="sk-line w40" /></div>
      <div className="sk-media" />
      <div className="pc-body"><span className="sk-line w60" /><span className="sk-line w30" /></div>
    </div>
  );
}

function TileSkeleton() {
  const h = [1.25, 0.9, 1.5, 1.1, 0.8, 1.35];
  return (
    <div className="wall skeleton" aria-hidden="true" style={{ '--cols': 2 }}>
      {[0, 1].map((c) => (
        <div key={c} className="wall-col">
          {h.filter((_, i) => i % 2 === c).map((r, i) => <span key={i} className="sk-pin" style={{ aspectRatio: 1 / r }} />)}
        </div>
      ))}
    </div>
  );
}

function ListState({ l, onRetry, empty }) {
  const { t } = useApp();
  if (l.error && !l.ids.length) {
    return (
      <EmptyState
        icon="info"
        title={t(l.error === 'network' ? 'post_err_offline' : 'post_err_load')}
        action={<button type="button" className="btn" onClick={onRetry}>{t('retry')}</button>}
      />
    );
  }
  if (l.loaded && !l.ids.length) return empty;
  return null;
}

/** The feed: newest first, ten at a time, the next page loads as you scroll. */
export function FeedList({ listKey = 'home', empty, view = 'tiles' }) {
  const { t } = useApp();
  const l = useFeed((s) => listOf(s, listKey));
  const pending = useFeed((s) => (listKey === 'home' ? s.pending.length : 0));
  const posts = useFeed((s) => s.posts);
  useEffect(() => {
    if (!l.loaded && !l.loading) loadList(listKey);
  }, [listKey]); // eslint-disable-line
  const more = useSentinel(() => !l.loading && !l.done && !l.error && loadList(listKey), l.loaded && !l.done);

  return (
    <div className={`feed v-${view}`}>
      {pending > 0 && (
        <button
          type="button"
          className="feed-pending"
          onClick={() => {
            showPending();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Icon name="arrow" size={16} /> {t('feed_new', { n: pending })}
        </button>
      )}
      {view === 'tiles' ? <Masonry ids={l.ids} posts={posts} /> : l.ids.map((id, i) => <PostCard key={id} id={id} eager={i < 2} />)}
      {!l.loaded && l.loading && (view === 'tiles' ? <TileSkeleton /> : (
        <>
          <Skeleton />
          <Skeleton />
        </>
      ))}
      <ListState l={l} onRetry={() => loadList(listKey)} empty={empty} />
      {l.loaded && !l.done && (
        <div ref={more} className="feed-more">
          {l.error ? (
            <button type="button" className="btn btn-ghost" onClick={() => loadList(listKey)}>{t('retry')}</button>
          ) : (
            <span className="spinner" aria-label={t('loading')} />
          )}
        </div>
      )}
      {l.loaded && l.done && l.ids.length > 3 && <p className="feed-end">{t('feed_end')}</p>}
    </div>
  );
}

/** A person's posts, saved posts or search results, as a masonry wall. */
export function PostGrid({ listKey, filter, empty, showAuthor = true }) {
  const { t } = useApp();
  const l = useFeed((s) => listOf(s, listKey));
  const posts = useFeed((s) => s.posts);
  useEffect(() => {
    if (!l.loaded && !l.loading) loadList(listKey);
  }, [listKey]); // eslint-disable-line
  const more = useSentinel(() => !l.loading && !l.done && !l.error && loadList(listKey), l.loaded && !l.done);
  const ids = useMemo(() => (filter ? l.ids.filter((id) => posts[id] && filter(posts[id])) : l.ids), [l.ids, posts, filter]);

  return (
    <>
      <Masonry ids={ids} posts={posts} showAuthor={showAuthor} />
      {!l.loaded && l.loading && <TileSkeleton />}
      <ListState l={l} onRetry={() => loadList(listKey)} empty={empty} />
      {l.loaded && l.ids.length > 0 && !ids.length && l.done && empty}
      {l.loaded && !l.done && (
        <div ref={more} className="feed-more">
          {l.error ? <button type="button" className="btn btn-ghost" onClick={() => loadList(listKey)}>{t('retry')}</button> : <span className="spinner" aria-label={t('loading')} />}
        </div>
      )}
    </>
  );
}
