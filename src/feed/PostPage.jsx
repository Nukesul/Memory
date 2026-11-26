import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { href } from '../router';
import { firstName } from '../roster';
import { ago } from '../time';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { EmptyState } from '../components/ui';
import PostCard from './PostCard';
import { addComment, deleteComment, editComment, likeComment, loadComments, loadPost, useFeed } from './store';

const MAX = 1000;

function Comment({ c, post, onReply, onEdit, isReply }) {
  const { t, lang, person, me, isAdmin, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const who = person(c.author_id);
  const mine = c.author_id === me?.id;
  const canDelete = mine || post.author_id === me?.id || isAdmin;
  if (c.deleted_at) {
    return (
      <li className={`cmt-item gone ${isReply ? 'reply' : ''}`}>
        <span className="cmt-gone"><Icon name="trash" size={14} /> {t('post_comment_deleted')}</span>
      </li>
    );
  }
  const like = () => likeComment(post.id, c.id).catch(() => toast(t('post_err'), 'err'));
  const del = async () => {
    try {
      await deleteComment(post.id, c.id);
    } catch {
      toast(t('post_err'), 'err');
    }
    setConfirm(false);
  };
  return (
    <li className={`cmt-item ${isReply ? 'reply' : ''}`} id={`cmt-${c.id}`}>
      <a href={href(`p/${c.author_id}`)} className="cmt-av" tabIndex={-1} aria-hidden="true"><Avatar p={who} className="mini round" /></a>
      <div className="cmt-main">
        <p className="cmt-text">
          <a className="cmt-who" href={href(`p/${c.author_id}`)}>{who ? firstName(who.name) : '?'}</a> {c.text}
        </p>
        <div className="cmt-meta">
          <time dateTime={c.created_at}>{ago(lang, c.created_at)}</time>
          {c.edited_at && <span>{t('post_edited')}</span>}
          {c.likes > 0 && <span>{t('post_comment_likes', { n: c.likes })}</span>}
          <button type="button" onClick={() => onReply(c)}>{t('chat_reply')}</button>
          {mine && <button type="button" onClick={() => onEdit(c)}>{t('edit')}</button>}
          {canDelete && !confirm && <button type="button" onClick={() => setConfirm(true)}>{t('delete')}</button>}
          {confirm && (
            <span className="cmt-confirm">
              <button type="button" className="danger" onClick={del}>{t('post_comment_delete_yes')}</button>
              <button type="button" onClick={() => setConfirm(false)}>{t('cancel')}</button>
            </span>
          )}
        </div>
      </div>
      <button type="button" className={`cmt-like ${c.liked ? 'on' : ''}`} onClick={like} aria-pressed={c.liked} aria-label={t('post_like')}>
        <Icon name="heart" size={15} className={c.liked ? 'fill' : ''} />
      </button>
    </li>
  );
}

function Comments({ post }) {
  const { t, me, person, toast } = useApp();
  const c = useFeed((s) => s.comments[post.id]);
  const [text, setText] = useState('');
  const [reply, setReply] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  useEffect(() => {
    loadComments(post.id);
  }, [post.id]);
  // Top comments in order, each followed by its replies.
  const tree = useMemo(() => {
    const items = c?.items || [];
    const tops = items.filter((x) => !x.parent_id);
    return tops
      .map((top) => ({ top, replies: items.filter((x) => x.parent_id === top.id) }))
      .filter(({ top, replies }) => !top.deleted_at || replies.some((r) => !r.deleted_at));
  }, [c]);
  const focus = () => setTimeout(() => input.current?.focus(), 30);
  const startReply = (cm) => {
    setEditing(null);
    setReply(cm);
    const name = firstName(person(cm.author_id)?.name || '');
    if (cm.author_id !== me?.id && !text.trim()) setText(`@${name} `);
    focus();
  };
  const startEdit = (cm) => {
    setReply(null);
    setEditing(cm);
    setText(cm.text);
    focus();
  };
  const cancel = () => {
    setReply(null);
    setEditing(null);
    setText('');
  };
  const submit = async (e) => {
    e?.preventDefault();
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      if (editing) await editComment(post.id, editing.id, v);
      else {
        const row = await addComment(post.id, v, reply ? reply.parent_id || reply.id : null);
        setTimeout(() => document.getElementById(`cmt-${row?.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
      }
      cancel();
    } catch {
      toast(t('post_err'), 'err');
    }
    setBusy(false);
  };

  return (
    <section className="comments" aria-labelledby="cmt-title">
      <h2 id="cmt-title" className="cmt-title">{t('post_comments_title')}{post.comments ? ` · ${post.comments}` : ''}</h2>
      {!c || (c.loading && !c.loaded) ? (
        <p className="muted">{t('loading')}</p>
      ) : c.error && !c.loaded ? (
        <p className="muted">{t('post_err_load')} <button type="button" className="link-btn" onClick={() => loadComments(post.id)}>{t('retry')}</button></p>
      ) : tree.length === 0 ? (
        <p className="muted cmt-empty">{t('post_comments_empty')}</p>
      ) : (
        <ul className="cmt-list">
          {tree.map(({ top, replies }) => (
            <li key={top.id} className="cmt-thread">
              <ul>
                <Comment c={top} post={post} onReply={startReply} onEdit={startEdit} />
                {replies.map((r) => <Comment key={r.id} c={r} post={post} onReply={startReply} onEdit={startEdit} isReply />)}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {me && (
        <form className="cmt-composer" onSubmit={submit}>
          {(reply || editing) && (
            <div className="cmt-mode">
              <span>{editing ? t('post_comment_editing') : t('post_comment_reply_to', { name: firstName(person(reply.author_id)?.name || '') })}</span>
              <button type="button" onClick={cancel} aria-label={t('cancel')}><Icon name="close" size={16} /></button>
            </div>
          )}
          <div className="cmt-row">
            <Avatar p={me} className="mini round" />
            <textarea
              ref={input}
              value={text}
              rows={1}
              maxLength={MAX}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX));
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) submit(e);
                if (e.key === 'Escape') cancel();
              }}
              placeholder={t('post_comment_ph')}
              aria-label={t('post_comment_ph')}
              enterKeyHint="send"
            />
            <button type="submit" className="cmt-send" disabled={!text.trim() || busy}>{editing ? t('save') : t('post_comment_send')}</button>
          </div>
        </form>
      )}
    </section>
  );
}

/** #/post/<id>: the post with all its comments. */
export default function PostPage({ id }) {
  const { t } = useApp();
  const pid = Number(id);
  const post = useFeed((s) => s.posts[pid]);
  const [state, setState] = useState(post ? 'ready' : 'loading');
  useEffect(() => {
    let alive = true;
    if (!Number.isFinite(pid)) return setState('missing');
    loadPost(pid)
      .then((row) => alive && setState(row ? 'ready' : 'missing'))
      .catch((e) => alive && setState(e.message === 'network' ? 'offline' : 'error'));
    return () => {
      alive = false;
    };
  }, [pid]);
  const back = () => (history.length > 1 ? history.back() : (location.hash = '#/'));
  const head = (
    <div className="post-page-head">
      <button type="button" className="page-back" onClick={back} aria-label={t('back')}><Icon name="left" size={22} /></button>
      <h1 className="page-title">{t('post_title')}</h1>
    </div>
  );
  if (!post) {
    return (
      <section className="page narrow post-page">
        {head}
        {state === 'loading' ? (
          <p className="muted">{t('loading')}</p>
        ) : (
          <EmptyState
            icon={state === 'missing' ? 'trash' : 'info'}
            title={t(state === 'missing' ? 'post_missing' : state === 'offline' ? 'post_err_offline' : 'post_err_load')}
            action={<a className="btn" href={href('')}>{t('nav_home')}</a>}
          />
        )}
      </section>
    );
  }
  return (
    <section className="page narrow post-page">
      {head}
      <PostCard id={pid} full eager onComment={() => document.querySelector('.cmt-composer textarea')?.focus()} />
      <Comments post={post} />
    </section>
  );
}

