/** "5 minutes ago", "yesterday"… in the current language. */
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

/** Short relative time for feed rows: "now", "5 min", "3 h", "2 d", then the date. */
export const ago = (lang, iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const fmt = (n, unit) => new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'narrow' }).format(n);
  if (s < 60) return rel(lang, new Date().toISOString());
  if (s < 3600) return fmt(Math.floor(s / 60), 'minute');
  if (s < 86400) return fmt(Math.floor(s / 3600), 'hour');
  if (s < 7 * 86400) return fmt(Math.floor(s / 86400), 'day');
  const d = new Date(iso);
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }).format(d);
};
