import { useApp } from '../app-context';
import { byId } from '../roster';
import { href } from '../router';
import { Sheet } from '../components/Sheet';
import { NoteCard, NoteComposer } from '../components/Notes';
import { Icon } from '../components/Icons';

export default function Profile({ id }) {
  const { t, people, state, me, openPhotos } = useApp();
  const base = byId(id);
  if (!base) {
    return (
      <section className="page">
        <p className="empty">{t('not_found')}</p>
        <a className="btn" href={href('people')}>{t('nav_people')}</a>
      </section>
    );
  }
  const p = people.find((x) => x.id === base.id);
  const idx = people.findIndex((x) => x.id === p.id);
  const prev = people[(idx - 1 + people.length) % people.length];
  const next = people[(idx + 1) % people.length];
  const notes = state.notes.filter((n) => n.to_id === p.id);
  const isMe = me?.id === p.id;
  const photoItems = p.photos.map((ph) => ({ ...ph, personId: p.id }));

  return (
    <section className="page profile">
      <nav className="pager" aria-label={t('nav_people')}>
        <a href={href(`p/${prev.id}`)}><Icon name="left" size={18} /> {prev.name.split(' ')[0]}</a>
        <a href={href('people')}>{t('nav_people')}</a>
        <a href={href(`p/${next.id}`)}>{next.name.split(' ')[0]} <Icon name="right" size={18} /></a>
      </nav>

      {!p.filled && (
        <aside className="banner" role="note">
          <b>{isMe ? t('banner_me') : t('banner_other', { name: p.name.split(' ')[0] })}</b>
          <span>{t('banner_ex')}</span>
          {isMe && <a className="btn btn-small" href={href('me')}>{t('open_my_cabinet')}</a>}
        </aside>
      )}
      {isMe && p.filled && (
        <aside className="banner ok" role="note">
          <b>{t('this_is_you')}</b>
          <a className="btn btn-small" href={href('me')}>{t('edit')}</a>
        </aside>
      )}

      <Sheet p={p} data={{ ...p.data, avatar: p.avatar, photos: p.photos }} examples={!p.filled} onPhoto={(i) => openPhotos(photoItems, i)} />

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
        <NoteComposer toId={p.id} />
      </section>
    </section>
  );
}
