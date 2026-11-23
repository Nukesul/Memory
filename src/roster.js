// The 20 people in the class. `seed` = names of ready-made photos in /public/seed.
const R = (id, name, country, seed = []) => ({ id, name, country, seed });

export const ROSTER = [
  R(1, 'Asyl Mamatova', 'KG'),
  R(2, 'Nursultan Bekov', 'KG'),
  R(3, 'Madara Sulaimanova', 'KG', ['mada1', 'mada']),
  R(4, 'Baiel Dzhaksybekov', 'KG', ['baiel', 'baiel1']),
  R(5, 'Anjery Putri', 'ID', ['anjeri1', 'anjeri']),
  R(6, 'Nabira Salsabila', 'ID', ['nabi']),
  R(7, 'Chacha Maharani', 'ID', ['chacha']),
  R(8, 'Hieu Nguyen', 'VN'),
  R(9, 'Aun Tran', 'VN', ['aun']),
  R(10, 'Otchini Perera', 'LK', ['ochi']),
  R(11, 'Rukumaru Silva', 'LK', ['ruku']),
  R(12, 'Ko Mingzhi', 'CN', ['ko', 'ko1']),
  R(13, 'Sharuri Tamang', 'ID'),
  R(14, 'Sukura Shrestha', 'NP'),
  R(15, 'Unda Gantulga', 'MN', ['unda', 'unda1']),
  R(16, 'Azjargal Batbold', 'MN'),
  R(17, 'Beruguti Namsrai', 'MN'),
  R(18, 'Otogo Chimeddorj', 'MN', ['otogo1', 'otogo']),
  R(19, 'Yadana Kyaw', 'MM', ['yada', 'yada2']),
  R(20, 'Suman', 'NP', ['suman', 'suman1']),
];

// Seat order on the classroom board: grouped by country.
export const SEATING = [1, 2, 3, 4, 5, 6, 7, 13, 8, 9, 10, 11, 12, 14, 20, 15, 16, 17, 18, 19];

export const byId = (id) => ROSTER.find((p) => p.id === Number(id));

const norm = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

// Finds classmates of one country whose name matches what was typed.
// Works with the current (possibly edited) name and with the original one,
// and with the current or the original country.
export function matchNames(country, typed, people = ROSTER) {
  const q = norm(typed);
  if (q.length < 2) return [];
  const words = q.split(' ');
  const pool = people.filter((p) => p.country === country || (p.baseCountry || p.country) === country);
  const names = (p) => [p.name, p.baseName || p.name].map(norm);
  const exact = pool.filter((p) => names(p).includes(q));
  if (exact.length) return exact;
  return pool.filter((p) => names(p).some((n) => words.every((w) => n.split(' ').some((part) => part.startsWith(w)))));
}
export const firstName = (name) => name.split(' ')[0];
