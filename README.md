# Memoris — книга воспоминаний класса 2J

Сайт на 20 человек из 8 стран. У каждого свой кабинет: вход по стране и имени, портрет, фото, тексты, записки одноклассникам. Пока человек ничего не заполнил, на его странице показан размеченный пример.

React 19 + Vite. Хранилище: Supabase (база данных и фото, бесплатный тариф).

## Запуск на своём компьютере

```bash
npm install
npm run dev
```

Без настройки сайт работает в **демо-режиме**: всё хранится только в вашем браузере. Для проверки дизайна этого достаточно.

## Общее хранилище

Проект Supabase `memoris-2j` (Токио) уже создан, таблицы и правила из `supabase/schema.sql` применены, ключи записаны в `.env`. Для нового проекта пройдите шаги ниже.

1. Зарегистрируйтесь на [supabase.com](https://supabase.com) (карта не нужна) и нажмите **New project**. Регион лучше выбрать **Northeast Asia (Tokyo)**.
2. Откройте **SQL Editor → New query**, вставьте весь файл `supabase/schema.sql` и нажмите **Run**. Он создаёт таблицы, бакет для фото и правила доступа.
3. Откройте **Project Settings → API** и скопируйте **Project URL** и ключ **anon / publishable**.
4. Скопируйте `.env.example` в `.env` и вставьте оба значения.
5. Проверьте: `npm run dev`. Жёлтая полоса «Демо-режим» должна исчезнуть.
6. Опубликуйте: `npm run deploy` (сайт появится там же, где и раньше, на GitHub Pages).

### Чтобы база не засыпала

Бесплатные проекты Supabase приостанавливаются после недели без активности. Файл `.github/workflows/keepalive.yml` дважды в неделю делает запрос к базе. Чтобы он заработал, добавьте в репозитории на GitHub (**Settings → Secrets and variables → Actions**) два секрета: `SUPABASE_URL` и `SUPABASE_ANON_KEY` (те же значения, что в `.env`).

### Хватит ли бесплатного тарифа

Фото сжимаются в браузере до ~150 КБ, поэтому 20 человек по 8 фото занимают около 30 МБ при лимите 1 ГБ. База с текстами занимает меньше 1 МБ при лимите 500 МБ. Лимиты на ноябрь 2026, актуальные цифры смотрите на supabase.com/pricing.

## Что важно знать

- Входа по паролю нет: кабинет открывает любой, кто знает страну и имя. Для закрытого класса этого достаточно, но ссылку лучше не публиковать. Если понадобится защита, можно добавить PIN из 4 цифр.
- Записки можно писать любому однокласснику, удалять свою может только её автор на этом устройстве.

## Где что менять

| Что | Файл |
| --- | --- |
| Имена, страны, номера мест | `src/roster.js` |
| Название школы, дата выпуска | `src/config.js` |
| Примеры текстов в кабинете | `src/samples.js` |
| Тексты интерфейса (EN, RU, JA) | `src/i18n.js` |
| Цвета и оформление | `src/styles.css` |
| Готовые фото (сжатые) | `public/seed/` |

Старая версия сайта сохранена в папке `_old/`.

## Что есть на сайте

- **Кабинет**: имя и страна (можно поменять), портрет, тексты, «забавные факты» (день рождения, еда, песня, суперсила, «привет» на своём языке), до 8 фото. Всё сохраняется само.
- **Альбом**: фото с фильтрами и скачиванием, стена записок и печатная **книга выпуска** (кнопка печати, «Сохранить как PDF»).
- **Чат**: общий чат класса и личные переписки; свои сообщения можно править и удалять, на любое можно поставить реакцию. Новые сообщения подгружаются каждые несколько секунд.
- **Игры**: «Кто это?», «Найди пару», голосование за награды класса, омикудзи.
- **Главная**: фото-лента, рассадка, приветствия из 8 стран, ближайший день рождения, обратный отсчёт до выпуска (дата в `src/config.js`).

Личные сообщения скрыты только на уровне интерфейса. Вход без пароля, поэтому технически их может прочитать тот, кто знает адрес базы. Для школьного чата этого достаточно, для секретов — нет.

Таблицы `votes` и `messages` описаны в `supabase/schema.sql`.


## Autographs, time capsule, install

- **Autographs**: on a classmate's page, draw a signature with a finger. It is stored as small vector strokes in `autographs` (one per pair, signing again replaces it).
- **Time capsule** (`#/capsule`): one letter per person in `capsules`, hidden in the app until graduation + `CLASS.capsuleYears`. The list only reads who has written; texts are fetched for the author, or for everyone after the opening date. It is a class project, not a vault: RLS is open, so don't write real secrets.
- **Install**: `manifest.webmanifest`, PNG icons and `sw.js` (app shell works offline; data always comes from the network). Chrome shows an install button in the footer; iPhone uses Share → Add to Home Screen.
- Run the new tables from `supabase/schema.sql` (autographs, capsules) in the Supabase SQL editor.

## Admin and instant chat

- **Admin** (`#/admin`, only for the class admin, id in `ADMIN_ID`): needs the PIN. The PIN is stored as a bcrypt hash in `admin_secret` (anon cannot read it), checked by the `admin_*` functions, and 5 wrong tries lock it for 15 minutes. Announcements can only be written through `admin_post`. Demo mode uses PIN `123456`.
- Panel: overview with storage meters (free plan: 1 GB photos, 500 MB database), announcements, moderation of notes and class chat, page reset, JSON backup, PIN change. The backup leaves out private messages and capsule letters.
- **Instant chat**: Supabase Realtime on `messages`; the 4s/30s polling stays as a fallback.
