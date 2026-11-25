import { useState } from 'react';
import { useApp } from '../app-context';
import { DAILY_MAX, MOODS } from '../config';
import { shiftDay } from '../daily';
import { href } from '../router';
import { completion } from '../people';
import { Icon } from './Icons';

/** Seven dots, oldest to today. Filled = answered that day. */
export function WeekDots() {
  const { daily, meId, today, lang } = useApp();
  const mine = new Set(daily.filter((d) => d.person_id === meId).map((d) => d.day));
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  const wd = new Intl.DateTimeFormat(lang, { weekday: 'narrow', timeZone: 'UTC' });
  return (
    <ol className="week" aria-hidden="true">
      {days.map((d) => (
        <li key={d} className={`${mine.has(d) ? 'on' : ''} ${d === today ? 'now' : ''}`}>
          <span className="dot">{mine.has(d) ? '✓' : ''}</span>
          <small>{wd.format(new Date(`${d}T12:00:00Z`))}</small>
        </li>
      ))}
    </ol>
  );
}

export function StreakPill() {
  const { t, streak, myAnswer } = useApp();
  return (
    <span className={`streak-pill ${streak ? 'hot' : ''}`}>
      <Icon name="flame" size={18} /> {streak ? t('streak_n', { n: streak }) : t('streak_0')}
      {streak > 0 && !myAnswer && <b className="risk" aria-hidden="true" />}
    </span>
  );
}

/** The question card: question, mood, short answer. `compact` is the home version. */
export function DailyCard({ compact = false }) {
  const { t, lang, question, myAnswer, answerDaily, removeDaily, streak, todayAnswers, people, toast } = useApp();
  const [mood, setMood] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const q = question[lang] || question.en;
  const showForm = !myAnswer || editing;

  const start = () => {
    setMood(myAnswer?.mood || null);
    setText(myAnswer?.text || '');
    setEditing(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await answerDaily({ mood, text });
      setEditing(false);
      toast(t('today_saved'));
    } catch (err) {
      console.error(err);
      toast(t('today_err'), 'err');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try {
      await removeDaily();
      setEditing(false);
      setMood(null);
      setText('');
    } catch {
      toast(t('today_err'), 'err');
    }
  };

  return (
    <section className={`daily ${compact ? 'compact' : ''} ${myAnswer ? 'is-done' : ''}`} aria-labelledby="daily-q">
      <div className="daily-top">
        <span className="daily-tag">{t('today_q_label')}</span>
        <StreakPill />
      </div>
      <h2 id="daily-q" className="daily-q">{q}</h2>

      {showForm ? (
        <form onSubmit={submit} className="daily-form">
          <div className="moods" role="group" aria-labelledby="mood-l">
            <span id="mood-l" className="moods-l">{t('today_mood')}</span>
            {MOODS.map((m) => (
              <button key={m} type="button" className={mood === m ? 'on' : ''} aria-pressed={mood === m} onClick={() => setMood(mood === m ? null : m)}>
                {m}
              </button>
            ))}
          </div>
          <label className="visually-hidden" htmlFor="daily-text">{t('today_ph')}</label>
          <textarea id="daily-text" rows={compact ? 2 : 3} maxLength={DAILY_MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('today_ph')} />
          <div className="daily-actions">
            <button className="btn btn-sun" disabled={busy || (!mood && !text.trim())}>
              {myAnswer ? t('today_update') : t('today_send')}
            </button>
            {editing && <button type="button" className="link-btn" onClick={() => setEditing(false)}>{t('today_cancel')}</button>}
            {text.length > DAILY_MAX - 40 && <small className="count">{text.length}/{DAILY_MAX}</small>}
          </div>
        </form>
      ) : (
        <div className="daily-done">
          <p className="mine-answer">
            {myAnswer.mood && <span className="mood">{myAnswer.mood}</span>}
            {myAnswer.text && <span>{myAnswer.text}</span>}
          </p>
          <p className="muted small">{t('today_done')}</p>
          <div className="daily-actions">
            <button type="button" className="link-btn" onClick={start}>{t('today_edit')}</button>
            <button type="button" className="link-btn danger" onClick={remove}>{t('today_remove')}</button>
          </div>
        </div>
      )}

      <WeekDots />
      <p className="daily-foot">
        <span>{t('answered_n', { n: new Set(todayAnswers.map((a) => a.person_id)).size, total: people.length })}</span>
        {compact && (
          <a className="link-arrow" href={href('today')}>
            {t('today_answers')} <Icon name="arrow" size={16} />
          </a>
        )}
      </p>
      {streak > 0 && !myAnswer && <p className="risk-note">{t('streak_risk', { n: streak })}</p>}
    </section>
  );
}

/** A short list of first steps; disappears once everything is done. */
export function Checklist() {
  const { t, me, myAnswer, installPending, standalone, pushInfo, pushSupportedNow, state, meId, openSheet } = useApp();
  const prog = completion({ ...me.data, avatar: me.avatar, photos: me.photos });
  const items = [
    { k: 'profile', done: prog.done >= prog.total, to: href('me') },
    { k: 'daily', done: Boolean(myAnswer), to: href('today') },
    { k: 'note', done: state.notes.some((n) => n.from_id === meId), to: href('wall') },
    ...(installPending || !standalone ? [{ k: 'install', done: standalone || !installPending, act: () => openSheet('install'), hide: !installPending && !standalone }] : []),
    ...(pushSupportedNow ? [{ k: 'push', done: pushInfo.permission === 'granted' && pushInfo.subscribed, act: () => openSheet('push') }] : []),
  ].filter((i) => !i.hide);
  const left = items.filter((i) => !i.done);
  if (!left.length) return null;
  const done = items.length - left.length;
  return (
    <section className="checklist" aria-labelledby="check-h">
      <div className="check-head">
        <h2 id="check-h">{t('check_title')}</h2>
        <span className="check-n">{t('check_n', { n: done, total: items.length })}</span>
      </div>
      <div className="check-bar" aria-hidden="true"><span style={{ width: `${(done / items.length) * 100}%` }} /></div>
      <ul>
        {items.map((i) => {
          const body = (
            <>
              <span className={`tick ${i.done ? 'on' : ''}`} aria-hidden="true">{i.done ? '✓' : ''}</span>
              <span>{t(`check_${i.k}`)}</span>
              {!i.done && <Icon name="arrow" size={16} />}
            </>
          );
          if (i.done) return <li key={i.k} className="done">{body}</li>;
          return (
            <li key={i.k}>
              {i.to ? <a href={i.to}>{body}</a> : <button type="button" onClick={i.act}>{body}</button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Badges() {
  const { t, badges } = useApp();
  return (
    <ul className="badges">
      {badges.map((b) => (
        <li key={b.id} className={b.got ? 'got' : ''} title={t(`badge_${b.id}`)}>
          <span className="b-ico" aria-hidden="true">{b.icon}</span>
          <span className="b-name">{t(`badge_${b.id}`)}</span>
          {!b.got && <span className="visually-hidden"> (–)</span>}
        </li>
      ))}
    </ul>
  );
}
