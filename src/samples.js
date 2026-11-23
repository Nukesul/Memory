// Example answers. They are shown (clearly marked as examples) until a person writes their own.
const SETS = [
  {
    en: {
      nickname: 'Sunny', role: 'Class DJ',
      dream: 'Open a tiny ramen shop in my hometown and name one bowl after our class.',
      memory: 'The night we missed the last train in Takasaki and sang karaoke on the platform until the station guard laughed.',
      quote: 'Slow rain still fills the lake.',
      jpWord: '縁 (en)', jpMeaning: 'The invisible thread that brings people together.',
      message: 'Thank you for every lunch, every bad joke and every time you explained the grammar twice. I will miss our room.',
      wish: 'I hope we are all still sending each other photos of food.',
      contact: '@yourname',
    },
    ru: {
      nickname: 'Солнышко', role: 'Диджей класса',
      dream: 'Открыть маленькую рамэн-лавку в родном городе и назвать одну порцию в честь нашего класса.',
      memory: 'Ночь, когда мы опоздали на последнюю электричку в Такасаки и пели караоке прямо на платформе.',
      quote: 'Тихий дождь тоже наполняет озеро.',
      jpWord: '縁 (эн)', jpMeaning: 'Невидимая нить, которая сводит людей вместе.',
      message: 'Спасибо за каждый обед, каждую глупую шутку и каждое объяснение грамматики по два раза. Буду скучать по нашему классу.',
      wish: 'Надеюсь, мы всё ещё шлём друг другу фото еды.',
      contact: '@yourname',
    },
    ja: {
      nickname: 'サニー', role: 'クラスのDJ',
      dream: '地元に小さなラーメン屋を開いて、クラスの名前をつけた一杯を作ること。',
      memory: '高崎で終電を逃して、ホームでみんなでカラオケをした夜。',
      quote: '静かな雨も湖を満たす。',
      jpWord: '縁', jpMeaning: '人と人をつなぐ見えない糸。',
      message: '毎日のお昼ごはん、くだらない冗談、文法を二回説明してくれたこと、全部ありがとう。この教室が恋しくなります。',
      wish: '10年後もみんなで食べ物の写真を送り合っていますように。',
      contact: '@yourname',
    },
  },
  {
    en: {
      nickname: 'Pocket', role: 'Keeper of the snacks',
      dream: 'Become an interpreter and walk into a room where two languages finally understand each other.',
      memory: 'Cooking for twenty people in a dorm kitchen built for four, and nobody leaving until the pot was empty.',
      quote: 'A journey begins with one step.',
      jpWord: '一期一会 (ichigo ichie)', jpMeaning: 'Treasure this moment, it will never happen again.',
      message: 'You are the reason Japan felt like home. Come and visit me, I will cook for you.',
      wish: 'I want to open this and laugh at how serious we were about the N3 exam.',
      contact: '@yourname',
    },
    ru: {
      nickname: 'Карманчик', role: 'Хранитель снеков',
      dream: 'Стать переводчиком и войти в комнату, где два языка наконец поняли друг друга.',
      memory: 'Готовка на двадцать человек на кухне общежития, рассчитанной на четверых, и никто не ушёл, пока кастрюля не опустела.',
      quote: 'Путь начинается с одного шага.',
      jpWord: '一期一会 (итидзё итиэ)', jpMeaning: 'Цени этот миг, он больше не повторится.',
      message: 'Вы — причина, по которой Япония стала домом. Приезжайте в гости, я вас накормлю.',
      wish: 'Хочу открыть это и посмеяться, как серьёзно мы готовились к экзамену N3.',
      contact: '@yourname',
    },
    ja: {
      nickname: 'ポケット', role: 'おやつ係',
      dream: '通訳になって、二つの言葉がやっと通じ合う瞬間に立ち会うこと。',
      memory: '4人用の寮のキッチンで20人分の料理を作って、鍋が空になるまで誰も帰らなかった日。',
      quote: '千里の道も一歩から。',
      jpWord: '一期一会', jpMeaning: 'この瞬間を大切にしよう。二度と同じ時は来ないから。',
      message: 'みんなのおかげで日本が第二の家になりました。遊びに来てね、ごはんを作るよ。',
      wish: 'N3の勉強に必死だった私たちを、笑いながら思い出したいです。',
      contact: '@yourname',
    },
  },
  {
    en: {
      nickname: 'Compass', role: 'Official photographer',
      dream: 'Make a documentary about people who moved far from home and made a new one.',
      memory: 'Sunrise at Mt. Akagi, nobody talking, everyone holding a hot can of coffee from the vending machine.',
      quote: 'Where there is a will, there is a way.',
      jpWord: '木漏れ日 (komorebi)', jpMeaning: 'Sunlight filtering through the leaves.',
      message: 'Keep your camera roll full and your phone battery empty. See you on the next adventure.',
      wish: 'May we still meet on the first snow, wherever we are.',
      contact: '@yourname',
    },
    ru: {
      nickname: 'Компас', role: 'Главный фотограф',
      dream: 'Снять документальный фильм о людях, которые уехали далеко от дома и построили новый.',
      memory: 'Рассвет на горе Акаги: никто не говорит, у всех в руках горячий кофе из автомата.',
      quote: 'Где есть желание, там найдётся путь.',
      jpWord: '木漏れ日 (комореби)', jpMeaning: 'Солнечный свет, пробивающийся сквозь листья.',
      message: 'Пусть в галерее всегда не хватает места, а у телефона — заряда. До новых приключений.',
      wish: 'Пусть мы встретим первый снег вместе, где бы мы ни были.',
      contact: '@yourname',
    },
    ja: {
      nickname: 'コンパス', role: '公式カメラマン',
      dream: '故郷を遠く離れて、新しい居場所をつくった人たちのドキュメンタリーを撮ること。',
      memory: '赤城山の日の出。誰も話さず、みんな自動販売機の温かい缶コーヒーを握っていた。',
      quote: '意志あるところに道は開ける。',
      jpWord: '木漏れ日', jpMeaning: '木の葉の間からこぼれる日の光。',
      message: 'カメラロールはいっぱいに、スマホの充電は空っぽに。また次の冒険で会おう。',
      wish: 'どこにいても、初雪の日にまた会えますように。',
      contact: '@yourname',
    },
  },
];

// Short fun facts for the examples.
const FUN = [
  {
    en: { birthday: '2008-03-14', food: 'Ramen with extra egg', song: 'Any song with a good bass line', power: 'Falling asleep on any train', hello: 'Salam!' },
    ru: { birthday: '2008-03-14', food: 'Рамэн с дополнительным яйцом', song: 'Любая песня с хорошим басом', power: 'Засыпать в любой электричке', hello: 'Салам!' },
    ja: { birthday: '2008-03-14', food: '味玉ラーメン', song: 'ベースがかっこいい曲なら何でも', power: 'どの電車でも寝られる', hello: 'やあ！' },
  },
  {
    en: { birthday: '2008-08-02', food: 'Mom’s dumplings', song: 'Our class karaoke song', power: 'Finding the best snack in any shop', hello: 'Xin chào!' },
    ru: { birthday: '2008-08-02', food: 'Мамины пельмени', song: 'Наша классная песня для караоке', power: 'Находить лучший снек в любом магазине', hello: 'Привет!' },
    ja: { birthday: '2008-08-02', food: 'お母さんの餃子', song: 'クラスのカラオケ定番曲', power: 'どの店でも一番おいしいお菓子を見つける', hello: 'こんにちは！' },
  },
  {
    en: { birthday: '2007-12-21', food: 'Mango with chili salt', song: 'Lo-fi beats for night study', power: 'Never getting lost', hello: 'Namaste!' },
    ru: { birthday: '2007-12-21', food: 'Манго с солью и чили', song: 'Lo-fi для ночной учёбы', power: 'Никогда не теряться', hello: 'Намасте!' },
    ja: { birthday: '2007-12-21', food: 'チリソルトのマンゴー', song: '夜の勉強用ローファイ', power: '絶対に迷わない', hello: 'ナマステ！' },
  },
];

export function sampleFor(id, lang) {
  const k = id % SETS.length;
  const set = SETS[k];
  const fun = FUN[k];
  return { ...(set[lang] || set.en), ...(fun[lang] || fun.en) };
}
