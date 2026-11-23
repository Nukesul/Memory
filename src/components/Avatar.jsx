import { COUNTRY_HUE } from '../config';
import { asset } from '../people';

const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Portrait (4:5). Falls back to initials on a country-coloured background. */
export function Avatar({ p, full = false, className = '' }) {
  const src = p.avatar ? asset(full ? p.avatar.full : p.avatar.thumb) : null;
  return (
    <span className={`avatar ${className}`} style={{ '--hue': COUNTRY_HUE[p.country] }}>
      {src ? <img src={src} alt="" loading={full ? 'eager' : 'lazy'} decoding="async" style={p.avatarY == null ? undefined : { objectPosition: `50% ${p.avatarY}%` }} /> : <span className="avatar-initials">{initials(p.name)}</span>}
    </span>
  );
}
