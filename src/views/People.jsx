import { useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { COUNTRY_ORDER, COUNTRY_HUE } from '../config';
import { href } from '../router';
import { SEATING } from '../roster';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';

export default function People({ filter, embedded = false, query = '' }) {
  const { t, people, country, presence } = useApp();
  const [ownQ, setQ] = useState('');
  const q = embedded ? query : ownQ;
  const [sort, setSort] = useState('seat');
  const active = COUNTRY_ORDER.includes(filter) ? filter : null;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const found = people.filter(
      (p) =>
        (!active || p.country === active) &&
        (!s || p.name.toLowerCase().includes(s) || country(p.country).toLowerCase().includes(s) || (p.data.role || '').toLowerCase().includes(s) || (p.data.nickname || '').toLowerCase().includes(s)),
    );
    if (sort === 'az') return [...found].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'filled') return [...found].sort((a, b) => Number(b.filled) - Number(a.filled) || SEATING.indexOf(a.id) - SEATING.indexOf(b.id));
    return [...found].sort((a, b) => SEATING.indexOf(a.id) - SEATING.indexOf(b.id));
  }, [people, q, active, country, sort]);

  return (
    <section className={embedded ? 'people-embed' : 'page'}>
      {!embedded && <h1 className="page-title">{t('nav_people')}</h1>}
      {!embedded && <p className="page-lead">{t('people_lead')}</p>}

      <div className="filters">
        <div className="chips" role="group" aria-label={t('countries')}>
          <a className={`chip ${!active ? 'on' : ''}`} href={href(embedded ? 'explore/people' : 'people')} aria-current={!active}>
            {t('all')}
          </a>
          {COUNTRY_ORDER.map((c) => (
            <a key={c} className={`chip ${active === c ? 'on' : ''}`} href={href(`people/${c}`)} aria-current={active === c}>
              <Flag code={c} /> {country(c)}
            </a>
          ))}
        </div>
        <div className="filter-row">
          {!embedded && <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} />}
          <label className="select-wrap">
            <span className="visually-hidden">{t('sort')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="seat">{t('sort_seat')}</option>
              <option value="az">{t('sort_az')}</option>
              <option value="filled">{t('sort_filled')}</option>
            </select>
          </label>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="empty">{t('no_match', { q })}</p>
      ) : (
        <ul className="people-grid">
          {list.map((p) => (
            <li key={p.id}>
              <a className={`pcard ${p.filled ? '' : 'unfilled'}`} href={href(`p/${p.id}`)} style={{ '--hue': COUNTRY_HUE[p.country] }}>
                <span className="has-presence">
                  <Avatar p={p} />
                  {presence[p.id] && Date.now() - new Date(presence[p.id]).getTime() < 150000 && <i className="presence" />}
                </span>
                <span className="pcard-info">
                  <b>{p.name}</b>
                  <span className="pcard-sub">
                    <Flag code={p.country} /> {p.data.role || (p.filled ? country(p.country) : t('not_yet'))}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
