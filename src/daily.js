import { TZ } from './config';

/** One question per day for the whole class. Same question for everyone, picked by the Tokyo date. */
export const QUESTIONS = [
  { en: 'What was the funniest thing that happened in our class this year?', ru: 'Что самое смешное случилось в нашем классе в этом году?', ja: '今年、クラスで一番おもしろかったことは？' },
  { en: 'Which song takes you straight back to this school year?', ru: 'Какая песня сразу возвращает тебя в этот учебный год?', ja: 'この一年を思い出す曲はどれ？' },
  { en: 'What is your favorite lunch at Nippon Academy?', ru: 'Какой твой любимый обед в Nippon Academy?', ja: 'ニッポンアカデミーで一番好きなお昼ごはんは？' },
  { en: 'Who in 2J made your day easier lately? Say thanks.', ru: 'Кто из 2J недавно сделал твой день лучше? Скажи спасибо.', ja: '最近、2Jの誰かに助けられた？ ありがとうを伝えよう。' },
  { en: 'What do you want to do in Japan before you leave?', ru: 'Что ты хочешь успеть сделать в Японии до отъезда?', ja: '帰る前に日本でやりたいことは？' },
  { en: 'Your best memory from a school trip or event?', ru: 'Твоё лучшее воспоминание о поездке или празднике школы?', ja: '遠足や行事での一番の思い出は？' },
  { en: 'What word or phrase in Japanese do you use most?', ru: 'Какое японское слово ты говоришь чаще всего?', ja: '一番よく使う日本語の言葉は？' },
  { en: 'If our class had a theme song, what would it be?', ru: 'Какая песня стала бы гимном нашего класса?', ja: 'クラスのテーマ曲を決めるなら、何にする？' },
  { en: 'What is one thing you learned this year that is not in the textbook?', ru: 'Чему ты научился в этом году — такому, чего нет в учебнике?', ja: '今年、教科書にないことで学んだことは？' },
  { en: 'Describe our classroom in three words.', ru: 'Опиши наш класс тремя словами.', ja: '教室を3つの言葉で表すと？' },
  { en: 'What food from home do you miss the most?', ru: 'По какой еде из дома ты скучаешь сильнее всего?', ja: '母国の食べ物で一番恋しいものは？' },
  { en: 'Which teacher’s words do you still remember?', ru: 'Чьи слова учителя ты до сих пор помнишь?', ja: '先生に言われて今も覚えている言葉は？' },
  { en: 'What would you tell yourself on the first day of school?', ru: 'Что бы ты сказал себе в первый день учёбы?', ja: '入学の日の自分に、何と言いたい？' },
  { en: 'Who in the class is the best at making people laugh?', ru: 'Кто в классе лучше всех умеет смешить?', ja: 'クラスで一番、みんなを笑わせるのは誰？' },
  { en: 'What place in Maebashi do you like the most?', ru: 'Какое место в Маэбаси тебе нравится больше всего?', ja: '前橋で一番好きな場所は？' },
  { en: 'What are you proud of this month?', ru: 'Чем ты гордишься в этом месяце?', ja: '今月、自分で誇れることは？' },
  { en: 'Pick one classmate and say what you admire about them.', ru: 'Выбери одноклассника и скажи, чем ты им восхищаешься.', ja: 'クラスメイトを一人選んで、すごいと思うところを教えて。' },
  { en: 'What do you want to be doing in 5 years?', ru: 'Чем ты хочешь заниматься через 5 лет?', ja: '5年後、何をしていたい？' },
  { en: 'The most delicious thing you ate in Japan?', ru: 'Самое вкусное, что ты ел в Японии?', ja: '日本で食べた一番おいしいものは？' },
  { en: 'What is the hardest thing about studying in another country?', ru: 'Что самое трудное в учёбе в другой стране?', ja: '外国で勉強して一番むずかしいことは？' },
  { en: 'A small thing that made you smile today?', ru: 'Какая мелочь сегодня заставила тебя улыбнуться?', ja: '今日、思わず笑顔になった小さなことは？' },
  { en: 'Which place in the school do you remember best?', ru: 'Какое место в школе ты запомнишь лучше всего?', ja: '学校の中で一番思い出に残る場所は？' },
  { en: 'What would you put in the class time capsule?', ru: 'Что бы ты положил в капсулу времени класса?', ja: 'クラスのタイムカプセルに何を入れる？' },
  { en: 'Which anime, game or show is the whole class into?', ru: 'Какое аниме, игра или сериал нравится всему классу?', ja: 'クラスではやっているアニメ・ゲーム・ドラマは？' },
  { en: 'What do you do to relax after school?', ru: 'Как ты отдыхаешь после школы?', ja: '放課後はどうやってリラックスする？' },
  { en: 'What would you like your classmates to remember about you?', ru: 'Что бы ты хотел, чтобы одноклассники помнили о тебе?', ja: 'クラスメイトに覚えていてほしい自分は？' },
  { en: 'Who was the first friend you made here?', ru: 'Кто стал твоим первым другом здесь?', ja: 'ここでできた最初の友だちは？' },
  { en: 'Which season in Japan is your favorite and why?', ru: 'Какое время года в Японии твоё любимое и почему?', ja: '日本で好きな季節とその理由は？' },
  { en: 'A wish for the whole class?', ru: 'Пожелание всему классу?', ja: 'クラス全員への願いごとは？' },
  { en: 'What is one thing you want to do together before graduation?', ru: 'Что одно вы все должны сделать вместе до выпуска?', ja: '卒業までにみんなでやりたいことを一つ挙げると？' },
];

/** Calendar day in Tokyo as YYYY-MM-DD. */
export const dayKey = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

export const shiftDay = (key, n) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const questionFor = (key) => QUESTIONS[Math.floor(new Date(`${key}T00:00:00Z`).getTime() / 864e5) % QUESTIONS.length];

/** Consecutive days with an answer. Today may still be empty without breaking the streak. */
export function streakOf(days, today) {
  const set = days instanceof Set ? days : new Set(days);
  let day = set.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (set.has(day)) {
    n += 1;
    day = shiftDay(day, -1);
  }
  return n;
}

export function bestStreak(days) {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export const BADGES = [
  { id: 'streak3', icon: '🔥', test: (s) => s.best >= 3 },
  { id: 'streak7', icon: '🌟', test: (s) => s.best >= 7 },
  { id: 'streak14', icon: '💎', test: (s) => s.best >= 14 },
  { id: 'streak30', icon: '👑', test: (s) => s.best >= 30 },
  { id: 'profile', icon: '🪪', test: (s) => s.profileDone },
  { id: 'notes3', icon: '💌', test: (s) => s.notes >= 3 },
  { id: 'votes', icon: '🏆', test: (s) => s.votes >= s.awards },
];
