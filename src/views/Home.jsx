import { useMemo, useState } from 'react';
import { ls } from '../store';
import { useApp } from '../app-context';
import { href } from '../router';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { firstName } from '../roster';
import { EmptyState } from '../components/ui';
import { FeedList } from '../feed/Feed';
import { rel } from '../time';

const DAY = 864e5;
const ONLINE_MS = 150000;

/** Home: classmates, announcements, a birthday if one is close, then the feed of posts (newest first). */
export default function Home() {
  const { t, people, me, presence } = useApp();
  const [view, setViewState] = useState(() => (ls.get('memoris:feedview', 'tiles') === 'list' ? 'list' : 'tiles'));
  const setView = (v) => {
    setViewState(v);
    ls.set('memoris:feedview', v);
  };

  // Classmates row: online people first, then whoever updated their page most recently.
  const row = useMemo(() => {
    const on = (p) => presence[p.id] && Date.now() - new Date(presence[p.id]).getTime() < ONLINE_MS;
    return people
      .filter((p) => p.id !== me?.id)
      .map((p) => ({ p, on: on(p) }))
      .sort((a, b) => Number(b.on) - Number(a.on) || new Date(b.p.updatedAt || 0) - new Date(a.p.updatedAt || 0));
  }, [people, presence, me]);

  return (
    <div className="home">
      <section className="classmates" aria-label={t('home_classmates')}>
        <ul className="classmates-row">
          {me && (
            <li>
              <a href={href('me')} className="cm">
                <span className="cm-ring self"><Avatar p={me} className="round" /></span>
                <span className="cm-name">{t('home_you')}</span>
              </a>
            </li>
          )}
          {row.map(({ p, on }) => (
            <li key={p.id}>
              <a href={href(`p/${p.id}`)} className="cm">
                <span className={`cm-ring ${p.filled ? 'filled' : ''}`}>
                  <Avatar p={p} className="round" />
                  {on && <i className="presence" title={t('chat_online')} />}
                </span>
                <span className="cm-name">{firstName(p.name)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Announcements />

      <Birthdays soon />

      <a className="feed-compose" href={href('create')}>
        <Avatar p={me} className="mini round" />
        <span>{t('feed_compose')}</span>
        <Icon name="photo" size={22} />
      </a>

      <div className="view-switch" role="group" aria-label={t('feed_view')}>
        <button type="button" className={view === 'tiles' ? 'on' : ''} aria-pressed={view === 'tiles'} onClick={() => setView('tiles')}><Icon name="tiles" size={18} /> {t('feed_view_tiles')}</button>
        <button type="button" className={view === 'list' ? 'on' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}><Icon name="rows" size={18} /> {t('feed_view_list')}</button>
      </div>

      <FeedList
        view={view}
        listKey="home"
        empty={<EmptyState icon="photo" title={t('feed_empty')} text={t('feed_empty_note')} action={<a className="btn" href={href('create')}>{t('create_post_title')}</a>} />}
      />
    </div>
  );
}

export function Birthdays({ soon = false }) {
  const { t, people } = useApp();
  const next = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let best = null;
    for (const p of people) {
      const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(p.data.birthday || '');
      if (!m) continue;
      let d = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]));
      if (d < today) d = new Date(now.getFullYear() + 1, Number(m[1]) - 1, Number(m[2]));
      const n = Math.round((d - today) / DAY);
      if (!best || n < best.n) best = { p, n };
    }
    return best;
  }, [people]);
  if (soon && (!next || next.n > 14)) return null;
  return (
    <section className="panel bday">
      <span className="deco cake" aria-hidden="true">🎂</span>
      <h2>{t('bday_title')}</h2>
      {next ? (
        <a className="bday-who" href={href(`p/${next.p.id}`)}>
          <Avatar p={next.p} className="mini round big" />
          <span>{next.n === 0 ? t('bday_today', { name: next.p.name.split(' ')[0] }) : t('bday_in', { name: next.p.name.split(' ')[0], n: next.n })}</span>
        </a>
      ) : (
        <p className="muted">{t('bday_none')}</p>
      )}
    </section>
  );
}

export { rel };

export function Announcements() {
  const { t, lang, state } = useApp();
  const list = state.announcements.slice(0, 2);
  if (!list.length) return null;
  return (
    <section className="announce" aria-label={t('announce_title')}>
      {list.map((a, i) => (
        <article key={a.id} className={`announce-card ${i ? 'old' : ''}`}>
          <span className="announce-ico" aria-hidden="true">📣</span>
          <div>
            <p>{a.text}</p>
            <time>{t('announce_from')} · {rel(lang, a.created_at)}</time>
          </div>
        </article>
      ))}
    </section>
  );
}

export function News() {
  const { t, lang, people, state, person } = useApp();
  const items = useMemo(() => {
    const pages = people.filter((p) => p.filled && p.updatedAt).map((p) => ({ k: `p${p.id}`, at: p.updatedAt, p }));
    const notes = state.notes.slice(0, 20).map((n) => ({ k: `n${n.id}`, at: n.created_at, n }));
    return [...pages, ...notes].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
  }, [people, state.notes]);
  return (
    <section className="panel news">
      <h2>{t('news_title')}</h2>
      {items.length === 0 ? (
        <p className="muted">{t('news_empty')}</p>
      ) : (
        <ul className="news-list">
          {items.map((it) => {
            const who = it.p || person(it.n.from_id);
            const to = it.n ? person(it.n.to_id) : null;
            if (!who) return null;
            return (
              <li key={it.k}>
                <a href={href(it.p ? `p/${it.p.id}` : `p/${to?.id || who.id}`)}>
                  <Avatar p={who} className="mini round" />
                  <span>
                    <b>{firstName(who.name)}</b> {it.p ? t('news_page') : t('news_note', { to: to ? firstName(to.name) : '…' })}
                  </span>
                  <time>{rel(lang, it.at)}</time>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
