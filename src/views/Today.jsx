import { useMemo } from 'react';
import { useApp } from '../app-context';
import { href } from '../router';
import { firstName } from '../roster';
import { streakOf } from '../daily';
import { Avatar } from '../components/Avatar';
import { Badges, DailyCard } from '../components/Daily';

const clock = (lang, iso) => new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export default function Today() {
  const { t, lang, me, people, daily, today, todayAnswers } = useApp();

  const board = useMemo(() => {
    const by = new Map();
    for (const d of daily) by.set(d.person_id, [...(by.get(d.person_id) || []), d.day]);
    return people
      .map((p) => ({ p, n: streakOf(by.get(p.id) || [], today) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || a.p.id - b.p.id)
      .slice(0, 5);
  }, [daily, people, today]);

  const answeredIds = new Set(todayAnswers.map((a) => a.person_id));
  const waiting = people.filter((p) => !answeredIds.has(p.id));
  const byId = (id) => people.find((p) => p.id === id);

  if (!me) {
    return (
      <section className="page">
        <h1 className="page-title">{t('today_title')}</h1>
        <p className="page-lead">{t('chat_login')}</p>
        <a className="btn btn-big-link" href={href('me')}>{t('open_cabinet')}</a>
      </section>
    );
  }

  return (
    <section className="page today">
      <h1 className="page-title">{t('today_title')}</h1>
      <DailyCard />

      <div className="today-grid">
        <section className="panel" aria-labelledby="ta-h">
          <h2 id="ta-h">{t('today_answers')}</h2>
          {todayAnswers.length === 0 ? (
            <p className="muted">{t('today_none')}</p>
          ) : (
            <ul className="answers">
              {todayAnswers.map((a) => {
                const p = byId(a.person_id);
                if (!p) return null;
                return (
                  <li key={a.person_id}>
                    <a href={href(`p/${p.id}`)}><Avatar p={p} className="mini round" /></a>
                    <div>
                      <b>{firstName(p.name)}</b> {a.mood && <span className="mood">{a.mood}</span>}
                      {a.text && <p>{a.text}</p>}
                    </div>
                    <time>{clock(lang, a.created_at)}</time>
                  </li>
                );
              })}
            </ul>
          )}
          {waiting.length > 0 && todayAnswers.length > 0 && (
            <p className="waiting muted small">
              {t('today_waiting')}: {waiting.map((p) => firstName(p.name)).join(', ')}
            </p>
          )}
        </section>

        <aside className="today-side">
          <section className="panel" aria-labelledby="tb-h">
            <h2 id="tb-h">{t('today_board')}</h2>
            {board.length === 0 ? (
              <p className="muted">{t('today_board_empty')}</p>
            ) : (
              <ol className="board">
                {board.map(({ p, n }, i) => (
                  <li key={p.id} className={p.id === me.id ? 'me' : ''}>
                    <span className="rank">{i + 1}</span>
                    <Avatar p={p} className="mini round" />
                    <span className="who">{firstName(p.name)}</span>
                    <b>🔥 {n}</b>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="panel" aria-labelledby="tg-h">
            <h2 id="tg-h">{t('today_badges')}</h2>
            <Badges />
          </section>
        </aside>
      </div>
    </section>
  );
}
