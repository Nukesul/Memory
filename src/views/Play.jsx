import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { AWARDS, COUNTRY_ORDER } from '../config';
import { FORTUNES, LUCKY_COLORS } from '../fortunes';
import { firstName } from '../roster';
import { href } from '../router';
import { ls } from '../store';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';
import { Star } from '../components/Doodles';

const TABS = ['quiz', 'pairs', 'awards', 'omikuji'];
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export default function Play({ tab }) {
  const { t } = useApp();
  const active = TABS.includes(tab) ? tab : 'quiz';
  return (
    <section className="page play">
      <h1 className="page-title">{t('play_title')}</h1>
      <p className="page-lead">{t('play_lead')}</p>
      <div className="tabs wide" role="tablist">
        {TABS.map((k) => (
          <a key={k} role="tab" aria-selected={active === k} className={active === k ? 'on' : ''} href={href(`play/${k}`)}>
            {t(`tab_${k}`)}
          </a>
        ))}
      </div>
      {active === 'quiz' && <Quiz />}
      {active === 'pairs' && <Pairs />}
      {active === 'awards' && <Awards />}
      {active === 'omikuji' && <Omikuji />}
    </section>
  );
}

/* ───────── Who is it? ───────── */
function makeRounds(pool) {
  const picked = shuffle(pool).slice(0, 8);
  return picked.map((p, i) => {
    if (i % 2 === 0) {
      const wrong = shuffle(pool.filter((x) => x.id !== p.id && firstName(x.name) !== firstName(p.name))).slice(0, 3);
      return { kind: 'name', p, options: shuffle([p, ...wrong]).map((x) => ({ key: x.id, label: firstName(x.name), ok: x.id === p.id })) };
    }
    const wrong = shuffle(COUNTRY_ORDER.filter((c) => c !== p.country)).slice(0, 3);
    return { kind: 'country', p, options: shuffle([p.country, ...wrong]).map((c) => ({ key: c, code: c, ok: c === p.country })) };
  });
}

function Quiz() {
  const { t, people, country } = useApp();
  const pool = useMemo(() => people.filter((p) => p.avatar), [people]);
  const [rounds, setRounds] = useState(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => ls.get('memoris:quiz-best', 0));

  if (pool.length < 4) return <p className="empty">{t('quiz_few')}</p>;

  const start = () => {
    setRounds(makeRounds(pool));
    setI(0);
    setPick(null);
    setScore(0);
  };
  if (!rounds) {
    return (
      <div className="game-card center">
        <Star size={64} />
        <p>{t('quiz_intro')}</p>
        <button className="btn btn-big-inline" onClick={start}>{t('quiz_start')}</button>
      </div>
    );
  }
  const done = i >= rounds.length;
  if (done) {
    if (score > best) {
      setBest(score);
      ls.set('memoris:quiz-best', score);
    }
    return (
      <div className="game-card center">
        <p className="score-big">{score}<span>/{rounds.length}</span></p>
        <p>{t('quiz_score', { n: score, total: rounds.length })}</p>
        <p className="muted">{t('quiz_best', { n: Math.max(best, score) })}</p>
        <button className="btn" onClick={start}>{t('quiz_again')}</button>
      </div>
    );
  }
  const r = rounds[i];
  const answer = (o) => {
    if (pick) return;
    setPick(o.key);
    if (o.ok) setScore((s) => s + 1);
  };
  return (
    <div className="game-card quiz">
      <p className="quiz-round">{t('quiz_round', { n: i + 1, total: rounds.length })}</p>
      <div className="quiz-photo">
        <div className="polaroid-lg">
          <Avatar p={r.p} full />
        </div>
      </div>
      <h2 className="quiz-q">{r.kind === 'name' ? t('quiz_name') : t('quiz_country', { name: firstName(r.p.name) })}</h2>
      <div className={`options ${r.kind}`}>
        {r.options.map((o) => {
          const state = !pick ? '' : o.ok ? 'right' : pick === o.key ? 'wrong' : 'dim';
          return (
            <button key={o.key} className={`option ${state}`} onClick={() => answer(o)} disabled={!!pick && state === 'dim'}>
              {r.kind === 'name' ? o.label : (<><Flag code={o.code} /> {country(o.code)}</>)}
            </button>
          );
        })}
      </div>
      {pick && (
        <div className="quiz-result" role="status">
          <b>{r.options.find((o) => o.key === pick)?.ok ? `🎉 ${t('quiz_right')}` : t('quiz_wrong', { name: r.p.name })}</b>
          <button className="btn" onClick={() => { setI(i + 1); setPick(null); }}>{i + 1 >= rounds.length ? t('quiz_finish') : t('quiz_next')}</button>
        </div>
      )}
    </div>
  );
}

/* ───────── Match faces ───────── */
function Pairs() {
  const { t, people } = useApp();
  const pool = useMemo(() => people.filter((p) => p.avatar), [people]);
  const deal = () => shuffle(shuffle(pool).slice(0, 6).flatMap((p) => [{ p, k: `${p.id}a` }, { p, k: `${p.id}b` }]));
  const [deck, setDeck] = useState(deal);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(() => ls.get('memoris:pairs-best', 0));
  const lock = useRef(false);

  const won = deck.length > 0 && matched.length === deck.length / 2;
  useEffect(() => {
    if (won && (!best || moves < best)) {
      setBest(moves);
      ls.set('memoris:pairs-best', moves);
    }
  }, [won]); // eslint-disable-line

  if (pool.length < 6) return <p className="empty">{t('quiz_few')}</p>;

  const flip = (idx) => {
    if (lock.current || open.includes(idx) || matched.includes(deck[idx].p.id)) return;
    const next = [...open, idx];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((x) => deck[x].p.id);
      if (a === b) {
        setMatched((m) => [...m, a]);
        setOpen([]);
      } else {
        lock.current = true;
        setTimeout(() => {
          setOpen([]);
          lock.current = false;
        }, 850);
      }
    }
  };
  const again = () => {
    setDeck(deal());
    setOpen([]);
    setMatched([]);
    setMoves(0);
  };
  return (
    <div className="game-card">
      <p className="muted">{t('pairs_intro')}</p>
      <p className="pairs-stats"><b>{t('pairs_moves', { n: moves })}</b>{best > 0 && <span>{t('pairs_best', { n: best })}</span>}</p>
      <div className="pairs-grid">
        {deck.map((c, idx) => {
          const faceUp = open.includes(idx) || matched.includes(c.p.id);
          return (
            <button key={c.k} className={`flip ${faceUp ? 'up' : ''} ${matched.includes(c.p.id) ? 'done' : ''}`} onClick={() => flip(idx)} aria-label={faceUp ? c.p.name : '?'}>
              <span className="flip-in">
                <span className="face back"><Star size={34} fill="var(--sakura)" /></span>
                <span className="face front"><Avatar p={c.p} /></span>
              </span>
            </button>
          );
        })}
      </div>
      {won && (
        <div className="quiz-result" role="status">
          <b>🎉 {t('pairs_win', { n: moves })}</b>
          <button className="btn" onClick={again}>{t('pairs_again')}</button>
        </div>
      )}
      {!won && moves > 0 && <button className="link-btn" onClick={again}>{t('pairs_again')}</button>}
    </div>
  );
}

/* ───────── Class awards ───────── */
function Awards() {
  const { t, people, state, me, vote, toast } = useApp();
  const tally = (cat) => {
    const c = {};
    for (const v of state.votes) if (v.category === cat) c[v.target_id] = (c[v.target_id] || 0) + 1;
    return Object.entries(c).map(([id, n]) => ({ p: people.find((x) => x.id === Number(id)), n })).filter((x) => x.p).sort((a, b) => b.n - a.n);
  };
  const cast = async (cat, id) => {
    try {
      await vote(cat, id);
      toast(t('awards_saved'));
    } catch (e) {
      console.error(e);
      toast(t('err_generic'), 'err');
    }
  };
  return (
    <div className="awards">
      <p className="muted">{t('awards_lead')}</p>
      {!me && (
        <p className="awards-login"><a className="link-arrow" href={href('me')}>{t('awards_login')} <Icon name="arrow" size={16} /></a></p>
      )}
      <div className="award-grid">
        {AWARDS.map((a) => {
          const rows = tally(a.key);
          const mine = me && state.votes.find((v) => v.voter_id === me.id && v.category === a.key)?.target_id;
          const top = rows[0];
          return (
            <section key={a.key} className="award">
              <h2><span aria-hidden="true">{a.emoji}</span> {t(`award_${a.key}`)}</h2>
              {top ? (
                <a className="award-lead" href={href(`p/${top.p.id}`)}>
                  <Avatar p={top.p} className="mini round" />
                  <span><small>{t('awards_lead_by')}</small><b>{top.p.name}</b></span>
                  <em>{t('votes_n', { n: top.n })}</em>
                </a>
              ) : (
                <p className="muted">{t('awards_none')}</p>
              )}
              {rows.length > 1 && (
                <ol className="award-rows">
                  {rows.slice(1, 3).map((r) => (
                    <li key={r.p.id}>{firstName(r.p.name)} <em>{r.n}</em></li>
                  ))}
                </ol>
              )}
              {me && (
                <div className="voters" role="group" aria-label={t('awards_pick')}>
                  {people.filter((p) => p.id !== me.id).map((p) => (
                    <button key={p.id} className={`voter ${mine === p.id ? 'on' : ''}`} onClick={() => cast(a.key, p.id)} aria-pressed={mine === p.id} title={p.name}>
                      <Avatar p={p} className="mini round" />
                      <span>{firstName(p.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Omikuji ───────── */
function Omikuji() {
  const { t, lang, people, me } = useApp();
  const [slip, setSlip] = useState(null);
  const draw = () => {
    const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    const c = LUCKY_COLORS[Math.floor(Math.random() * LUCKY_COLORS.length)];
    const pool = people.filter((p) => p.id !== me?.id);
    setSlip({ f, c, who: pool[Math.floor(Math.random() * pool.length)], n: Math.random() });
  };
  return (
    <div className="game-card center omikuji">
      <p className="muted">{t('omi_lead')}</p>
      {slip && (
        <div className="slip" key={slip.n}>
          <p className="slip-lv" lang="ja">{slip.f.lv}</p>
          <p className="slip-name">{slip.f[lang] || slip.f.en}</p>
          <p className="slip-text">{slip.f.text[lang] || slip.f.text.en}</p>
          <dl>
            <div><dt>{t('omi_lucky')}</dt><dd><Avatar p={slip.who} className="mini round" /> {firstName(slip.who.name)}</dd></div>
            <div><dt>{t('omi_color')}</dt><dd><i className="swatch" style={{ background: slip.c.c }} /> {slip.c[lang] || slip.c.en}</dd></div>
          </dl>
          <p className="muted small">{t('omi_tie')}</p>
        </div>
      )}
      <button className="btn" onClick={draw}>{slip ? t('omi_again') : t('omi_draw')}</button>
    </div>
  );
}
