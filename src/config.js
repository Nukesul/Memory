export const CLASS = {
  school: 'Nippon Academy',
  schoolJa: '日本アカデミー',
  name: '2J',
  city: 'Maebashi, Gunma',
  cityJa: '群馬県前橋市',
  years: '2025–2027',
  // Used for the "days since / until graduation" counter. Change if the date is different.
  graduation: '2027-03-15',
  capsuleYears: 10,
};

/** The day the time capsule opens: graduation plus `capsuleYears`. */
export function capsuleOpenDate() {
  const d = new Date(`${CLASS.graduation}T09:00:00+09:00`);
  d.setFullYear(d.getFullYear() + CLASS.capsuleYears);
  return d;
}

export const CAPSULE_MAX = 1200;

/** The class admin (Nursultan Bekov). The admin panel also needs the PIN, which the database checks. */
export const ADMIN_ID = 2;
export const ANNOUNCE_MAX = 300;

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

// Short "fun facts" shown as stickers on the page.
export const FUN_FIELDS = [
  { key: 'birthday', type: 'date', emoji: '🎂' },
  { key: 'food', max: 40, rows: 1, emoji: '🍜' },
  { key: 'song', max: 80, rows: 1, emoji: '🎵' },
  { key: 'power', max: 80, rows: 1, emoji: '⚡' },
  { key: 'hello', max: 40, rows: 1, emoji: '👋' },
];

// "Hello" in each country's own language (shown on the home page).
export const GREETINGS = {
  KG: { word: 'Салам', say: 'salam' },
  ID: { word: 'Halo', say: 'ha-lo' },
  VN: { word: 'Xin chào', say: 'sin chow' },
  LK: { word: 'ආයුබෝවන්', say: 'ayubowan' },
  CN: { word: '你好', say: 'nǐ hǎo' },
  NP: { word: 'नमस्ते', say: 'namaste' },
  MN: { word: 'Сайн уу', say: 'sain uu' },
  MM: { word: 'မင်္ဂလာပါ', say: 'min-ga-la-ba' },
};

// Class awards: everyone can vote once per category.
export const AWARDS = [
  { key: 'funny', emoji: '😂' },
  { key: 'kind', emoji: '💛' },
  { key: 'famous', emoji: '🌟' },
  { key: 'style', emoji: '😎' },
  { key: 'dreamer', emoji: '🚀' },
  { key: 'soul', emoji: '🎉' },
  { key: 'late', emoji: '⏰' },
  { key: 'chef', emoji: '🍳' },
];

export const MAX_PHOTOS = 8;
export const NOTE_COLORS = ['#f6e27a', '#f5b5a8', '#a9d9c4', '#a9c9ee', '#d9bff0'];
