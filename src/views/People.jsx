import { useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { COUNTRY_ORDER, COUNTRY_HUE } from '../config';
import { href } from '../router';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';

export default function People({ filter }) {
  const { t, people, country } = useApp();
  const [q, setQ] = useState('');
  const active = COUNTRY_ORDER.includes(filter) ? filter : null;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return people.filter(
      (p) => (!active || p.country === active) && (!s || p.name.toLowerCase().includes(s) || country(p.country).toLowerCase().includes(s) || (p.data.role || '').toLowerCase().includes(s)),
    );
  }, [people, q, active, country]);

  return (
    <section className="page">
      <h1 className="page-title">{t('nav_people')}</h1>
      <p className="page-lead">{t('people_lead')}</p>

      <div className="filters">
        <div className="chips" role="group" aria-label={t('countries')}>
          <a className={`chip ${!active ? 'on' : ''}`} href={href('people')} aria-current={!active}>
            {t('all')}
          </a>
          {COUNTRY_ORDER.map((c) => (
            <a key={c} className={`chip ${active === c ? 'on' : ''}`} href={href(`people/${c}`)} aria-current={active === c}>
              <Flag code={c} /> {country(c)}
            </a>
          ))}
        </div>
        <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} />
      </div>

      {list.length === 0 ? (
        <p className="empty">{t('no_match', { q })}</p>
      ) : (
        <ul className="people-grid">
          {list.map((p) => (
            <li key={p.id}>
              <a className={`pcard ${p.filled ? '' : 'unfilled'}`} href={href(`p/${p.id}`)} style={{ '--hue': COUNTRY_HUE[p.country] }}>
                <Avatar p={p} />
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
