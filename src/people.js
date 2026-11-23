import { ROSTER } from './roster';
export { firstName } from './roster';

const BASE = import.meta.env.BASE_URL || './';
export const asset = (u) => (!u ? '' : /^(https?:|data:|blob:)/.test(u) ? u : BASE + u);

const seedPhoto = (slug) => ({ full: `seed/${slug}.webp`, thumb: `seed/${slug}-t.webp`, seed: true });

// Merges the fixed roster entry with what the person saved.
export function buildPerson(base, profile) {
  const data = profile?.data || {};
  const avatar = data.avatar || (base.seed[0] ? seedPhoto(base.seed[0]) : null);
  const photos = data.photos ?? base.seed.slice(1).map(seedPhoto);
  return { ...base, data, avatar, photos, filled: !!profile?.filled, updatedAt: profile?.updated_at };
}


export function buildAll(profiles) {
  return ROSTER.map((b) => buildPerson(b, profiles[b.id]));
}

// "Filled" means the person added something of their own.
export function isFilled(data) {
  const text = ['nickname', 'role', 'dream', 'memory', 'quote', 'jpWord', 'message', 'wish'].some((k) => (data[k] || '').trim());
  const ownAvatar = data.avatar && !data.avatar.seed;
  const ownPhotos = (data.photos || []).some((p) => !p.seed);
  return Boolean(text || ownAvatar || ownPhotos);
}

export function completion(data) {
  const checks = [
    !!(data.avatar && !data.avatar.seed),
    !!(data.dream || '').trim(),
    !!(data.memory || '').trim(),
    !!(data.quote || '').trim(),
    !!(data.message || '').trim(),
    (data.photos || []).some((p) => !p.seed),
  ];
  return { done: checks.filter(Boolean).length, total: checks.length, checks };
}
