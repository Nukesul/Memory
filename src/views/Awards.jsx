import { useApp } from '../app-context';
import { AWARDS } from '../config';
import { firstName } from '../roster';
import { href } from '../router';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { PageHead } from '../components/ui';

/** Class awards: one vote per category, results visible to everyone. */
export default function Awards() {
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
    <section className="page narrow awards">
      <PageHead title={t('mem_awards')} back="memories" lead={t('awards_lead')} />
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
    </section>
  );
}
