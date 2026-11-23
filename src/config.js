export const CLASS = {
  school: 'Nippon Academy',
  schoolJa: '日本アカデミー',
  name: '2J',
  city: 'Maebashi, Gunma',
  cityJa: '群馬県前橋市',
  years: '2025–2027',
  // Used for the "days since / until graduation" counter. Change if the date is different.
  graduation: '2026-09-20',
  capsuleYears: 10,
};

export const COUNTRIES = {
  KG: { en: 'Kyrgyzstan', ru: 'Кыргызстан', ja: 'キルギス' },
  ID: { en: 'Indonesia', ru: 'Индонезия', ja: 'インドネシア' },
  VN: { en: 'Vietnam', ru: 'Вьетнам', ja: 'ベトナム' },
  LK: { en: 'Sri Lanka', ru: 'Шри-Ланка', ja: 'スリランカ' },
  CN: { en: 'China', ru: 'Китай', ja: '中国' },
  NP: { en: 'Nepal', ru: 'Непал', ja: 'ネパール' },
  MN: { en: 'Mongolia', ru: 'Монголия', ja: 'モンゴル' },
  MM: { en: 'Myanmar', ru: 'Мьянма', ja: 'ミャンマー' },
};
export const COUNTRY_ORDER = ['KG', 'ID', 'VN', 'LK', 'CN', 'NP', 'MN', 'MM'];

// Each country gets a hue; used for desk tabs, initials avatars and sticky accents.
export const COUNTRY_HUE = { KG: 8, ID: 28, VN: 52, LK: 96, CN: 160, NP: 200, MN: 232, MM: 290 };

// Editable fields (order = order in the cabinet form).
export const FIELDS = [
  { key: 'nickname', max: 30, rows: 1 },
  { key: 'role', max: 40, rows: 1 },
  { key: 'dream', max: 220, rows: 3 },
  { key: 'memory', max: 400, rows: 4 },
  { key: 'quote', max: 160, rows: 2 },
  { key: 'jpWord', max: 24, rows: 1 },
  { key: 'jpMeaning', max: 120, rows: 2 },
  { key: 'message', max: 400, rows: 4 },
  { key: 'wish', max: 300, rows: 3 },
  { key: 'contact', max: 60, rows: 1 },
];

export const MAX_PHOTOS = 8;
export const NOTE_COLORS = ['#f6e27a', '#f5b5a8', '#a9d9c4', '#a9c9ee', '#d9bff0'];
