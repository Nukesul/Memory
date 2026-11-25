import { useApp } from '../app-context';
import { CLASS, COUNTRY_HUE, COUNTRY_ORDER, GREETINGS, capsuleOpenDate } from '../config';
import { SEATING } from '../roster';
import { href } from '../router';
import { Desk } from '../components/Desk';
import { Flag } from '../components/Flag';
import { RowLink } from '../components/ui';
import { RandomMemory } from './Home';

const DAY = 864e5;

/** The class archive: everything that is about 2J as a class rather than today's news. */
export default function Memories() {
  const { t, lang, people, state, streak, country } = useApp();
  const seats = SEATING.map((id) => people.find((p) => p.id === id));
  const grad = new Date(`${CLASS.graduation}T09:00:00+09:00`);
  const days = Math.round((grad - Date.now()) / DAY);
  const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' });
  const photoCount = people.reduce((n, p) => n + p.photos.length, 0);
  const countryCount = new Set(people.map((p) => p.country)).size;

  return (
    <section className="page memories">
      <header className="mem-hero">
        <p className="mem-school">{CLASS.school} · <span lang="ja">{CLASS.schoolJa}</span></p>
        <h1 className="mem-title">{t('nav_memories')}</h1>
        <p className="mem-sub">{t('hero_sub', { city: lang === 'ja' ? CLASS.cityJa : CLASS.city, years: CLASS.years })}</p>
        <p className="mem-count">
          <b>{Math.abs(days)}</b> {days > 0 ? t('mem_days_until') : t('mem_days_since')}
        </p>
      </header>

      <div className="mem-links">
        <RowLink to="gallery" icon="photo" title={t('nav_gallery')} note={t('stat_photos_n', { n: photoCount })} />
        <RowLink to="wall" icon="note" title={t('wall_title')} note={t('stat_notes_n', { n: state.notes.length })} />
        <RowLink to="book" icon="book" title={t('tab_book')} note={t('mem_book_note')} />
        <RowLink to="today" icon="flame" title={t('today_q_label')} note={streak ? t('streak_n', { n: streak }) : t('streak_0')} />
        <RowLink to="capsule" icon="capsule" title={t('capsule')} note={t('mem_capsule_note', { date: fmt.format(capsuleOpenDate()) })} />
        <RowLink to="play/awards" icon="trophy" title={t('mem_awards')} note={t('mem_awards_note')} />
        <RowLink to="play" icon="game" title={t('play_title')} note={t('mem_games_note')} />
        <RowLink to="explore" icon="pen" title={t('mem_autographs')} note={t('mem_autographs_note')} />
      </div>

      <section className="seat-sec" aria-labelledby="seat-title">
        <div className="section-head">
          <h2 id="seat-title">{t('seating')}</h2>
        </div>
        <ol className="desks" aria-label={t('seating')}>
          {seats.map((p, i) => (
            <li key={p.id}>
              <Desk p={p} index={i} />
            </li>
          ))}
        </ol>
        <p className="legend">{t('legend')}</p>
      </section>

      <section className="hello-sec" aria-labelledby="hello-title">
        <div className="section-head">
          <h2 id="hello-title">{t('hello_title')}</h2>
        </div>
        <p className="muted hello-lead">{t('hello_lead')}</p>
        <ul className="hello-grid">
          {COUNTRY_ORDER.map((c, i) => {
            const n = people.filter((p) => p.country === c).length;
            return (
              <li key={c}>
                <a className="hello" href={href(`people/${c}`)} style={{ '--n': i, '--hue': COUNTRY_HUE[c] }}>
                  <Flag code={c} />
                  <span className="hello-word">{GREETINGS[c].word}</span>
                  <small>{GREETINGS[c].say}</small>
                  <span className="hello-country">{country(c)} · {t('hello_count', { n })}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <RandomMemory />

      <section className="panel numbers" aria-label={t('mem_numbers')}>
        {[
          [people.length, t('stat_people')],
          [countryCount, t('stat_countries')],
          [photoCount, t('stat_photos')],
          [state.notes.length, t('stat_notes')],
        ].map(([n, label], i) => (
          <p key={label} className={`stat s${i}`}><b>{n}</b><span>{label}</span></p>
        ))}
      </section>
    </section>
  );
}
