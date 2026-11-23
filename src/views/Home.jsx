import { useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { CLASS, COUNTRY_HUE, COUNTRY_ORDER, GREETINGS } from '../config';
import { SEATING } from '../roster';
import { sampleFor } from '../samples';
import { asset } from '../people';
import { href } from '../router';
import { Desk } from '../components/Desk';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';
import { NoteCard } from '../components/Notes';
import { Avatar } from '../components/Avatar';
import { Scene, Cloud, Petal, Flower, Star, Sparkle, Onigiri, Plane } from '../components/Doodles';
import { completion } from '../people';
import { firstName } from '../roster';

const DAY = 864e5;
const HERO_IDS = [3, 5, 12, 18, 19, 15, 4];

export default function Home() {
  const { t, lang, people, me, state, openPhotos, country } = useApp();
  const seats = SEATING.map((id) => people.find((p) => p.id === id));
  const taken = people.filter((p) => p.filled).length;

  const grad = new Date(`${CLASS.graduation}T09:00:00+09:00`);
  const days = Math.round((grad - Date.now()) / DAY);
  const capsule = new Date(grad);
  capsule.setFullYear(capsule.getFullYear() + CLASS.capsuleYears);
  const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' });

  const heroFaces = useMemo(() => {
    const withFace = people.filter((p) => p.avatar);
    const chosen = HERO_IDS.map((id) => withFace.find((p) => p.id === id)).filter(Boolean);
    return (chosen.length >= 3 ? chosen : withFace).slice(0, 4);
  }, [people]);

  const reel = useMemo(() => {
    const items = people.flatMap((p) => p.photos.map((ph) => ({ ...ph, personId: p.id, who: p.name.split(' ')[0] })));
    const faces = people.filter((p) => p.avatar).map((p) => ({ ...p.avatar, personId: p.id, who: p.name.split(' ')[0] }));
    const all = [...items, ...faces];
    // Shuffle with a fixed seed so the strip does not jump when data refreshes.
    return all.map((x, i) => [x, (i * 7919) % 97]).sort((a, b) => a[1] - b[1]).map((x) => x[0]).slice(0, 22);
  }, [people]);

  const photoCount = people.reduce((n, p) => n + p.photos.length, 0);
  const countryCount = new Set(people.map((p) => p.country)).size;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <Scene />
        <Cloud className="cloud c1" />
        <Cloud className="cloud c2" />
        <div className="petals" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <Petal key={i} className="petal" style={{ '--x': `${8 + i * 10.5}%`, '--d': `${9 + (i % 4) * 2.2}s`, '--s': `${-i * 1.7}s`, '--z': `${16 + (i % 3) * 6}px` }} />
          ))}
        </div>
        <div className="hero-copy">
          <p className="hero-school">
            {CLASS.school} <span lang="ja">{CLASS.schoolJa}</span>
          </p>
          <h1 id="hero-title" className="hero-title">
            <span className="hero-2j">{CLASS.name}</span>
            <span className="hero-hand">{t('hero_hand')}</span>
          </h1>
          <p className="hero-sub">{t('hero_sub', { city: lang === 'ja' ? CLASS.cityJa : CLASS.city, years: CLASS.years })}</p>
          <div className="hero-progress" role="img" aria-label={t('desks_taken', { n: taken, total: people.length })}>
            <div className="bar"><span style={{ width: `${(taken / people.length) * 100}%` }} /></div>
            <p>{t('desks_taken', { n: taken, total: people.length })}</p>
          </div>
          <div className="hero-cta">
            <a className="btn btn-sun" href={href('me')}>
              {me ? t('open_my_cabinet') : t('take_desk')} <Icon name="arrow" size={18} />
            </a>
            <a className="btn btn-white" href={href('play')}>
              <Icon name="game" size={20} /> {t('hero_play')}
            </a>
          </div>
        </div>
        <div className="hero-pola" aria-hidden="true">
          {heroFaces.map((p, i) => (
            <a key={p.id} tabIndex={-1} className={`hp hp${i}`} href={href(`p/${p.id}`)}>
              <img src={asset(p.avatar.thumb)} alt="" decoding="async" />
              <span>{p.name.split(' ')[0]}</span>
            </a>
          ))}
          <Sparkle className="spk s1" size={34} fill="var(--sun)" />
          <Sparkle className="spk s2" size={24} />
        </div>
      </section>

      {me && <ForYou />}

      {reel.length >= 6 && (
        <section className="reel-sec" aria-label={t('reel_title')}>
          <div className="section-head">
            <h2>{t('reel_title')}</h2>
            <a className="link-arrow" href={href('gallery')}>{t('see_all')} <Icon name="arrow" size={16} /></a>
          </div>
          <div className="reel">
            <ul className="reel-track">
              {[...reel, ...reel].map((it, i) => (
                <li key={i} aria-hidden={i >= reel.length ? 'true' : undefined}>
                  <button type="button" tabIndex={i >= reel.length ? -1 : 0} className="reel-shot" style={{ '--r': `${((i * 37) % 7) - 3}deg` }} onClick={() => openPhotos(reel, i % reel.length)} aria-label={`${t('open_photo')} — ${it.who}`}>
                    <img src={asset(it.thumb)} alt="" loading="lazy" decoding="async" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

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

      <div className="home-grid">
        <section className="panel counter">
          <Star className="deco" size={36} />
          <h2>{days > 0 ? t('until_grad') : t('since_grad')}</h2>
          <p className="big-number">{Math.abs(days)}</p>
          <p className="muted">{t('days')}</p>
        </section>
        <Birthdays />
        <section className="panel capsule">
          <Flower className="deco" size={44} />
          <h2>{t('capsule')}</h2>
          <p>{t('capsule_text', { date: fmt.format(capsule) })}</p>
          <a className="link-arrow" href={href('me')}>{t('capsule_cta')} <Icon name="arrow" size={16} /></a>
        </section>
        <News />
        <RandomMemory />
        <section className="panel play-teaser">
          <Onigiri className="deco" size={54} />
          <h2>{t('play_teaser')}</h2>
          <p>{t('play_teaser_text')}</p>
          <a className="btn btn-white" href={href('play')}>
            {t('play_go')} <Plane size={24} />
          </a>
        </section>
        <section className="panel book-teaser">
          <Star className="deco" size={40} fill="var(--sakura)" />
          <h2>{t('book_teaser')}</h2>
          <p>{t('book_teaser_text')}</p>
          <a className="btn btn-white" href={href('book')}>
            <Icon name="book" size={18} /> {t('book_open')}
          </a>
        </section>
        <section className="panel numbers" aria-label="numbers">
          {[
            [people.length, t('stat_people')],
            [countryCount, t('stat_countries')],
            [photoCount, t('stat_photos')],
            [state.notes.length, t('stat_notes')],
          ].map(([n, label], i) => (
            <p key={label} className={`stat s${i}`}><b>{n}</b><span>{label}</span></p>
          ))}
        </section>
      </div>

      <section className="home-wall">
        <div className="section-head">
          <h2>{t('wall_title')}</h2>
          <a className="link-arrow" href={href('wall')}>{t('see_all')} <Icon name="arrow" size={16} /></a>
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

function Birthdays() {
  const { t, people } = useApp();
  const next = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let best = null;
    for (const p of people) {
      const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(p.data.birthday || '');
      if (!m) continue;
      let d = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]));
      if (d < today) d = new Date(now.getFullYear() + 1, Number(m[1]) - 1, Number(m[2]));
      const n = Math.round((d - today) / DAY);
      if (!best || n < best.n) best = { p, n };
    }
    return best;
  }, [people]);
  return (
    <section className="panel bday">
      <span className="deco cake" aria-hidden="true">🎂</span>
      <h2>{t('bday_title')}</h2>
      {next ? (
        <a className="bday-who" href={href(`p/${next.p.id}`)}>
          <Avatar p={next.p} className="mini round big" />
          <span>{next.n === 0 ? t('bday_today', { name: next.p.name.split(' ')[0] }) : t('bday_in', { name: next.p.name.split(' ')[0], n: next.n })}</span>
        </a>
      ) : (
        <p className="muted">{t('bday_none')}</p>
      )}
    </section>
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

const rel = (lang, iso) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const steps = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.3, 'week'], [12, 'month'], [Infinity, 'year']];
  let v = diff;
  for (const [k, unit] of steps) {
    if (Math.abs(v) < k) return rtf.format(Math.round(v), unit);
    v /= k;
  }
  return '';
};

/** A short personal summary for the logged-in person. */
function ForYou() {
  const { t, me, state, unread } = useApp();
  const msgs = Object.values(unread).reduce((a, b) => a + b, 0);
  const notes = state.notes.filter((n) => n.to_id === me.id).length;
  const prog = completion({ ...me.data, avatar: me.avatar, photos: me.photos });
  return (
    <section className="foryou" aria-label={t('foryou_hi', { name: firstName(me.name) })}>
      <p className="foryou-hi"><Avatar p={me} className="mini round" /> {t('foryou_hi', { name: firstName(me.name) })}</p>
      <ul>
        <li><a href={href('chat')}><Icon name="chat" size={18} /> {msgs > 0 ? t('foryou_msgs', { n: msgs }) : t('foryou_nomsgs')}</a></li>
        <li><a href={href('wall')}><Icon name="note" size={18} /> {t('foryou_notes', { n: notes })}</a></li>
        <li><a href={href('me')}><Icon name="user" size={18} /> {prog.done >= prog.total ? t('foryou_done') : t('foryou_progress', { n: prog.done, total: prog.total })}</a></li>
      </ul>
    </section>
  );
}

/** What happened lately: updated pages and new notes. */
function News() {
  const { t, lang, people, state, person } = useApp();
  const items = useMemo(() => {
    const pages = people.filter((p) => p.filled && p.updatedAt).map((p) => ({ k: `p${p.id}`, at: p.updatedAt, p }));
    const notes = state.notes.slice(0, 20).map((n) => ({ k: `n${n.id}`, at: n.created_at, n }));
    return [...pages, ...notes].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
  }, [people, state.notes]);
  return (
    <section className="panel news">
      <h2>{t('news_title')}</h2>
      {items.length === 0 ? (
        <p className="muted">{t('news_empty')}</p>
      ) : (
        <ul className="news-list">
          {items.map((it) => {
            const who = it.p || person(it.n.from_id);
            const to = it.n ? person(it.n.to_id) : null;
            if (!who) return null;
            return (
              <li key={it.k}>
                <a href={href(it.p ? `p/${it.p.id}` : `p/${to?.id || who.id}`)}>
                  <Avatar p={who} className="mini round" />
                  <span>
                    <b>{firstName(who.name)}</b> {it.p ? t('news_page') : t('news_note', { to: to ? firstName(to.name) : '…' })}
                  </span>
                  <time>{rel(lang, it.at)}</time>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
