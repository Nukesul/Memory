import { useApp } from '../app-context';
import { byId, SEATING } from '../roster';
import { href } from '../router';
import { Sheet } from '../components/Sheet';
import { NoteCard, NoteComposer } from '../components/Notes';
import { Icon } from '../components/Icons';
import { Autographs } from '../components/Autographs';

function relTime(lang, iso) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const steps = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.3, 'week'], [12, 'month'], [Infinity, 'year']];
  let v = diff;
  for (const [k, unit] of steps) {
    if (Math.abs(v) < k) return rtf.format(Math.round(v), unit);
    v /= k;
  }
  return '';
}

export default function Profile({ id }) {
  const { t, lang, people, state, me, openPhotos, toast } = useApp();
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
  const idx = SEATING.indexOf(p.id);
  const prev = people.find((x) => x.id === SEATING[(idx - 1 + SEATING.length) % SEATING.length]);
  const next = people.find((x) => x.id === SEATING[(idx + 1) % SEATING.length]);
  const notes = state.notes.filter((n) => n.to_id === p.id);
  const isMe = me?.id === p.id;
  const photoItems = p.photos.map((ph) => ({ ...ph, personId: p.id }));
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
  const ago = p.updatedAt && p.filled ? relTime(lang, p.updatedAt) : '';

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

      <div className="profile-actions">
        {me && !isMe && (
          <a className="btn btn-small" href={href(`chat/${p.id}`)}>
            <Icon name="chat" size={16} /> {t('write_message')}
          </a>
        )}
        {!isMe && (
          <a className="btn btn-small btn-white" href="#note-form" onClick={(e) => { e.preventDefault(); document.getElementById('note-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
            <Icon name="note" size={16} /> {t('write_note')}
          </a>
        )}
        <button type="button" className="btn btn-small btn-ghost" onClick={share}>
          <Icon name="link" size={16} /> {t('share')}
        </button>
        {ago && <span className="muted updated">{t('updated_ago', { when: ago })}</span>}
      </div>

      <Sheet p={p} data={{ ...p.data, avatar: p.avatar, photos: p.photos }} examples={!p.filled} onPhoto={(i) => openPhotos(photoItems, i)} />

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
        <div id="note-form">
          <NoteComposer toId={p.id} />
        </div>
      </section>
    </section>
  );
}
