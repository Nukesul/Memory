import { useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { sampleFor } from '../samples';
import { asset } from '../people';
import { href } from '../router';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { firstName } from '../roster';
import { Checklist, DailyCard } from '../components/Daily';

const DAY = 864e5;
const ONLINE_MS = 150000;

/** Home: what is new in the class, in one short column. Everything else lives in Memories. */
export default function Home() {
  const { t, people, me, presence, openPhotos } = useApp();

  // Classmates row: online people first, then whoever updated their page most recently.
  const row = useMemo(() => {
    const on = (p) => presence[p.id] && Date.now() - new Date(presence[p.id]).getTime() < ONLINE_MS;
    return people
      .filter((p) => p.id !== me?.id)
      .map((p) => ({ p, on: on(p) }))
      .sort((a, b) => Number(b.on) - Number(a.on) || new Date(b.p.updatedAt || 0) - new Date(a.p.updatedAt || 0));
  }, [people, presence, me]);

  // Newest photos first: pages updated most recently, last photo first.
  const photos = useMemo(() => {
    const byRecent = [...people].filter((p) => p.photos.length).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return byRecent.flatMap((p) => [...p.photos].reverse().map((ph) => ({ ...ph, personId: p.id, who: firstName(p.name) }))).slice(0, 9);
  }, [people]);

  return (
    <div className="home">
      <section className="classmates" aria-label={t('home_classmates')}>
        <ul className="classmates-row">
          {me && (
            <li>
              <a href={href('me')} className="cm">
                <span className="cm-ring self"><Avatar p={me} className="round" /></span>
                <span className="cm-name">{t('home_you')}</span>
              </a>
            </li>
          )}
          {row.map(({ p, on }) => (
            <li key={p.id}>
              <a href={href(`p/${p.id}`)} className="cm">
                <span className={`cm-ring ${p.filled ? 'filled' : ''}`}>
                  <Avatar p={p} className="round" />
                  {on && <i className="presence" title={t('chat_online')} />}
                </span>
                <span className="cm-name">{firstName(p.name)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Announcements />
      {me && <DailyCard compact />}
      {me && <Checklist />}

      <section className="home-sec" aria-labelledby="new-photos">
        <div className="sec-head">
          <h2 id="new-photos">{t('home_photos')}</h2>
          <a className="sec-link" href={href('explore/photos')}>{t('see_all')}</a>
        </div>
        {photos.length ? (
          <div className="photo-grid three">
            {photos.map((it, i) => (
              <button key={it.full + i} type="button" className="shot" onClick={() => openPhotos(photos, i)} aria-label={`${t('open_photo')} — ${it.who}`}>
                <img src={asset(it.thumb)} alt={it.cap || ''} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">{t('gallery_empty')}</p>
        )}
      </section>

      <News />
      <Birthdays soon />
    </div>
  );
}

export function Birthdays({ soon = false }) {
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
  if (soon && (!next || next.n > 14)) return null;
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

export function RandomMemory() {
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

export const rel = (lang, iso) => {
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

export function Announcements() {
  const { t, lang, state } = useApp();
  const list = state.announcements.slice(0, 2);
  if (!list.length) return null;
  return (
    <section className="announce" aria-label={t('announce_title')}>
      {list.map((a, i) => (
        <article key={a.id} className={`announce-card ${i ? 'old' : ''}`}>
          <span className="announce-ico" aria-hidden="true">📣</span>
          <div>
            <p>{a.text}</p>
            <time>{t('announce_from')} · {rel(lang, a.created_at)}</time>
          </div>
        </article>
      ))}
    </section>
  );
}

export function News() {
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
