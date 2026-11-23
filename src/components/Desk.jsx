import { useApp } from '../app-context';
import { COUNTRY_HUE } from '../config';
import { href } from '../router';
import { firstName } from '../roster';
import { Avatar } from './Avatar';
import { Flag } from './Flag';

/** One desk on the classroom board: a paper name card taped to the board. */
export function Desk({ p, index }) {
  const { t, country } = useApp();
  return (
    <a
      className={`desk ${p.filled ? 'taken' : 'vacant'}`}
      href={href(`p/${p.id}`)}
      style={{ '--i': index, '--r': `${((p.id * 47) % 7) / 2 - 1.5}deg`, '--hue': COUNTRY_HUE[p.country] }}
      aria-label={`${p.name}, ${country(p.country)}${p.filled ? '' : ', ' + t('desk_empty')}`}
    >
      <span className="tape" aria-hidden="true" />
      <Avatar p={p} />
      {p.filled && <span className="hanko" aria-hidden="true">済</span>}
      <span className="desk-meta">
        <Flag code={p.country} />
        <span className="desk-name">{firstName(p.name)}</span>
      </span>
    </a>
  );
}
