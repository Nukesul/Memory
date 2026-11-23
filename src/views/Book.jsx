import { useApp } from '../app-context';
import { CLASS } from '../config';
import { SEATING } from '../roster';
import { asset } from '../people';
import { AlbumTabs } from '../components/AlbumTabs';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';
import { Sheet } from '../components/Sheet';
import { NoteCard } from '../components/Notes';
import { Flower, Star } from '../components/Doodles';

/** The whole class as a printable book: cover, one page per person, notes. */
export default function Book() {
  const { t, lang, people, state } = useApp();
  const ordered = SEATING.map((id) => people.find((p) => p.id === id));
  const filled = ordered.filter((p) => p.filled);
  const faces = ordered.filter((p) => p.avatar);
  return (
    <section className="page book">
      <h1 className="page-title">{t('tab_book')}</h1>
      <p className="page-lead">{t('book_lead')}</p>
      <AlbumTabs active="book" />
      <div className="book-toolbar">
        <button className="btn" onClick={() => window.print()}>
          <Icon name="print" size={18} /> {t('book_print')}
        </button>
        <p className="muted">{t('book_tip')}</p>
      </div>

      <article className="book-page cover">
        <Flower className="cv-flower f1" size={70} />
        <Star className="cv-star" size={54} />
        <p className="cover-school">{CLASS.school} · <span lang="ja">{CLASS.schoolJa}</span></p>
        <h2 className="cover-title">{CLASS.name}</h2>
        <p className="cover-hand">{t('hero_hand')}</p>
        <ul className="cover-faces" aria-hidden="true">
          {faces.slice(0, 12).map((p, i) => (
            <li key={p.id} style={{ '--r': `${((i * 37) % 9) - 4}deg` }}>
              <img src={asset(p.avatar.thumb)} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
        <p className="cover-sub">{lang === 'ja' ? CLASS.cityJa : CLASS.city} · {CLASS.years}</p>
      </article>

      <article className="book-page contents">
        <h2>{t('book_contents')}</h2>
        <ol className="toc">
          {ordered.map((p) => (
            <li key={p.id}>
              <Avatar p={p} className="mini round" />
              <Flag code={p.country} />
              <span>{p.name}</span>
              <span className="dots" aria-hidden="true" />
              <em>{p.filled ? '' : t('toc_empty')}</em>
            </li>
          ))}
        </ol>
        <p className="muted">{t('book_filled', { n: filled.length, total: people.length })}</p>
      </article>

      {ordered.map((p) => {
        const notes = state.notes.filter((n) => n.to_id === p.id).slice(0, 4);
        return (
          <article key={p.id} className="book-page person">
            <Sheet p={p} data={{ ...p.data, avatar: p.avatar, photos: p.photos }} examples={false} />
            {notes.length > 0 && (
              <div className="book-notes">
                {notes.map((n, i) => (
                  <NoteCard key={n.id} note={n} index={i} />
                ))}
              </div>
            )}
          </article>
        );
      })}

      <article className="book-page book-back">
        <Star size={60} />
        <h2>{t('book_end')}</h2>
        <p>{t('book_end_text')}</p>
      </article>
    </section>
  );
}
