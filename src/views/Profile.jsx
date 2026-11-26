import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { byId } from '../roster';
import { href } from '../router';
import { completion } from '../people';
import { Sheet } from '../components/Sheet';
import { NoteCard, NoteComposer } from '../components/Notes';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Autographs } from '../components/Autographs';
import { EmptyState, Segmented } from '../components/ui';
import { PostGrid } from '../feed/Feed';
import { loadCount, useFeed } from '../feed/store';

const ONLINE_MS = 150000;

export default function Profile({ id }) {
  const { t, people, state, me, openPhotos, toast, country, presence } = useApp();
  const [tab, setTab] = useState('posts');
  const base = byId(id);
  const postCount = useFeed((s) => (base ? s.counts[base.id] : null));
  useEffect(() => {
    if (base) loadCount(base.id);
  }, [base?.id]); // eslint-disable-line
  if (!base) {
    return (
      <section className="page narrow">
        <EmptyState icon="search" title={t('not_found')} action={<a className="btn" href={href('explore')}>{t('nav_explore')}</a>} />
      </section>
    );
  }
  const p = people.find((x) => x.id === base.id);
  const notes = state.notes.filter((n) => n.to_id === p.id);
  const isMe = me?.id === p.id;
  const prog = completion({ ...p.data, avatar: p.avatar, photos: p.photos });
  const online = !isMe && presence[p.id] && Date.now() - new Date(presence[p.id]).getTime() < ONLINE_MS;
  const bio = (p.data.quote || p.data.hello || '').trim();
  const share = async () => {
    const url = `${location.origin}${location.pathname}#/p/${p.id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t('link_copied'));
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <section className="page profile narrow">
      {!isMe && (
        <a className="page-back inline" href={href('explore')}>
          <Icon name="left" size={20} /> {t('nav_explore')}
        </a>
      )}
      <header className="prof-head">
        <button type="button" className="prof-avatar" onClick={() => p.avatar && openPhotos([{ ...p.avatar, personId: p.id }], 0)} aria-label={t('open_photo')} disabled={!p.avatar}>
          <Avatar p={p} full className="round" />
          {online && <i className="presence big" title={t('chat_online')} />}
        </button>
        <div className="prof-id">
          <h1 className="prof-name">{p.name}</h1>
          <p className="prof-sub">
            <Flag code={p.country} /> {country(p.country)}
            {p.data.role ? <> · {p.data.role}</> : null}
          </p>
          {p.data.nickname && <p className="prof-nick">“{p.data.nickname}”</p>}
        </div>
      </header>

      {bio && <p className="prof-bio">{bio}</p>}

      <ul className="prof-stats">
        <li><b>{postCount ?? '–'}</b><span>{t('stat_posts')}</span></li>
        <li><b>{notes.length}</b><span>{t('stat_notes')}</span></li>
        <li><b>{Math.round((prog.done / prog.total) * 100)}%</b><span>{t('prof_filled')}</span></li>
      </ul>

      <div className="prof-actions">
        {isMe ? (
          <>
            <a className="btn" href={href('me/edit')}><Icon name="edit" size={18} /> {t('prof_edit')}</a>
            <a className="btn btn-ghost" href={href('settings')}><Icon name="settings" size={18} /> {t('nav_settings')}</a>
          </>
        ) : (
          <>
            {me && <a className="btn" href={href(`chat/${p.id}`)}><Icon name="chat" size={18} /> {t('write_message')}</a>}
            <button type="button" className="btn btn-ghost icon-only" onClick={() => setTab('notes')} aria-label={t('write_note')} title={t('write_note')}><Icon name="note" size={18} /></button>
          </>
        )}
        <button type="button" className="btn btn-ghost icon-only" onClick={share} aria-label={t('share')}><Icon name="share" size={18} /></button>
      </div>

      {!p.filled && (
        <aside className="hint" role="note">
          <b>{isMe ? t('banner_me') : t('banner_other', { name: p.name.split(' ')[0] })}</b>
          {isMe && <a className="btn btn-small" href={href('me/edit')}>{t('prof_edit')}</a>}
        </aside>
      )}

      <Segmented
        label={p.name}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'posts', label: t('prof_tab_posts'), icon: 'grid' },
          ...(isMe ? [{ value: 'saved', label: t('prof_tab_saved'), icon: 'bookmark' }] : []),
          { value: 'about', label: t('prof_tab_about'), icon: 'user' },
          { value: 'notes', label: t('prof_tab_notes'), icon: 'note' },
        ]}
      />

      {tab === 'posts' && (
        <PostGrid
          key={p.id}
          listKey={`a${p.id}`}
          empty={
            <EmptyState
              icon="photo"
              title={isMe ? t('prof_no_posts_me') : t('prof_no_posts', { name: p.name.split(' ')[0] })}
              action={isMe ? <a className="btn" href={href('create')}>{t('create_post_title')}</a> : null}
            />
          }
        />
      )}

      {tab === 'saved' && isMe && <PostGrid listKey="saved" empty={<EmptyState icon="bookmark" title={t('saved_empty')} text={t('saved_empty_note')} />} />}

      {tab === 'about' && <Sheet p={p} data={{ ...p.data, avatar: p.avatar, photos: p.photos }} examples={!p.filled} bare />}

      {tab === 'notes' && (
        <div className="prof-notes">
          <Autographs person={p} />
          <section className="notes-section">
            <h2>{t('notes_for', { name: p.name.split(' ')[0] })}</h2>
            {notes.length > 0 ? (
              <div className="note-wall">
                {notes.map((n, i) => (
                  <NoteCard key={n.id} note={n} index={i} />
                ))}
              </div>
            ) : (
              <p className="muted">{t('notes_empty')}</p>
            )}
            {!isMe && (
              <div id="note-form">
                <NoteComposer toId={p.id} />
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
