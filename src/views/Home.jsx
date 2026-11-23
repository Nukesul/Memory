import { useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { CLASS, COUNTRY_ORDER } from '../config';
import { SEATING } from '../roster';
import { sampleFor } from '../samples';
import { href } from '../router';
import { Desk } from '../components/Desk';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';
import { NoteCard } from '../components/Notes';
import { Avatar } from '../components/Avatar';

const DAY = 864e5;

export default function Home() {
  const { t, lang, people, me, state, country } = useApp();
  const seats = SEATING.map((id) => people.find((p) => p.id === id));
  const taken = people.filter((p) => p.filled).length;

  const grad = new Date(`${CLASS.graduation}T09:00:00+09:00`);
  const days = Math.round((grad - Date.now()) / DAY);
  const capsule = new Date(grad);
  capsule.setFullYear(capsule.getFullYear() + CLASS.capsuleYears);
  const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <section className="board" aria-labelledby="board-title">
        <div className="board-top">
          <p className="board-school">
            {CLASS.school} <span lang="ja">{CLASS.schoolJa}</span>
          </p>
          <h1 id="board-title" className="board-title">
            <span className="board-2j">{CLASS.name}</span>
            <span className="board-hand">{t('hero_hand')}</span>
          </h1>
          <p className="board-sub">
            {t('hero_sub', { city: lang === 'ja' ? CLASS.cityJa : CLASS.city, years: CLASS.years })}
          </p>
          <div className="board-progress" role="img" aria-label={t('desks_taken', { n: taken, total: people.length })}>
            <div className="bar">
              <span style={{ width: `${(taken / people.length) * 100}%` }} />
            </div>
            <p>{t('desks_taken', { n: taken, total: people.length })}</p>
          </div>
          <a className="btn btn-chalk" href={href('me')}>
            {me ? t('open_my_cabinet') : t('take_desk')}
            <Icon name="arrow" size={18} />
          </a>
        </div>

        <ol className="desks" aria-label={t('seating')}>
          {seats.map((p, i) => (
            <li key={p.id}>
              <Desk p={p} index={i} />
            </li>
          ))}
        </ol>
        <p className="board-legend">{t('legend')}</p>
      </section>

      <section className="strip" aria-label={t('countries')}>
        {COUNTRY_ORDER.map((c) => {
          const n = people.filter((p) => p.country === c).length;
          return (
            <a key={c} className="country-chip" href={href(`people/${c}`)}>
              <Flag code={c} />
              <span>{country(c)}</span>
              <b>{n}</b>
            </a>
          );
        })}
      </section>

      <div className="home-grid">
        <section className="panel counter">
          <h2>{days > 0 ? t('until_grad') : t('since_grad')}</h2>
          <p className="big-number">{Math.abs(days)}</p>
          <p className="muted">{t('days')}</p>
        </section>
        <section className="panel capsule">
          <h2>{t('capsule')}</h2>
          <p>{t('capsule_text', { date: fmt.format(capsule) })}</p>
          <a className="link-arrow" href={href('me')}>
            {t('capsule_cta')} <Icon name="arrow" size={16} />
          </a>
        </section>
        <RandomMemory />
      </div>

      <section className="home-wall">
        <div className="section-head">
          <h2>{t('wall_title')}</h2>
          <a className="link-arrow" href={href('wall')}>
            {t('see_all')} <Icon name="arrow" size={16} />
          </a>
        </div>
        {state.notes.length ? (
          <div className="note-row">
            {state.notes.slice(0, 4).map((n, i) => (
              <NoteCard key={n.id} note={n} showTo index={i} />
            ))}
          </div>
        ) : (
          <p className="muted">{t('wall_empty')}</p>
        )}
      </section>
    </>
  );
}

function RandomMemory() {
  const { t, lang, people } = useApp();
  const pool = useMemo(() => people.filter((p) => p.filled && (p.data.memory || p.data.quote)), [people]);
  const [pick, setPick] = useState(null);
  const roll = () => {
    if (!pool.length) return setPick({ ex: true });
    const next = pool[Math.floor(Math.random() * pool.length)];
    setPick({ p: next, key: next.data.memory ? 'memory' : 'quote' });
  };
  const ex = pick?.ex ? { text: sampleFor(1, lang).memory } : null;
  return (
    <section className="panel memory-roll">
      <h2>{t('random_title')}</h2>
      {pick ? (
        <figure className="roll-card" key={pick.p?.id || 'ex'}>
          <blockquote>{pick.p ? pick.p.data[pick.key] : ex.text}</blockquote>
          <figcaption>
            {pick.p ? (
              <a href={href(`p/${pick.p.id}`)}>
                <Avatar p={pick.p} className="mini" /> {pick.p.name}
              </a>
            ) : (
              <span className="ex-tag">{t('example')}</span>
            )}
          </figcaption>
        </figure>
      ) : (
        <p className="muted">{t('random_hint')}</p>
      )}
      <button className="btn btn-ghost" onClick={roll}>
        <Icon name="shuffle" size={18} /> {pick ? t('random_again') : t('random_btn')}
      </button>
    </section>
  );
}
