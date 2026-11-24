import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { api } from '../store';
import { CAPSULE_MAX, capsuleOpenDate } from '../config';
import { href } from '../router';
import { firstName } from '../roster';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';
import { Flower, Star } from '../components/Doodles';

const DAY = 864e5;

export default function Capsule() {
  const { t, lang, me, person, people, toast } = useApp();
  const openAt = useMemo(capsuleOpenDate, []);
  const opened = Date.now() >= openAt.getTime();
  const days = Math.max(0, Math.ceil((openAt.getTime() - Date.now()) / DAY));
  const years = Math.floor(days / 365.25);
  const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' });

  const [meta, setMeta] = useState(null); // null loading, false unavailable
  const [all, setAll] = useState([]);
  const [mine, setMine] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (opened) {
        const rows = await api.loadAllCapsules();
        setAll(rows);
        setMeta(rows.map(({ author_id, updated_at }) => ({ author_id, updated_at })));
      } else {
        setMeta(await api.loadCapsuleMeta());
      }
      if (me) {
        const row = await api.getCapsule(me.id);
        setMine(row);
        setText(row?.text || '');
      }
    } catch (e) {
      console.error(e);
      setMeta(false);
    }
  }, [opened, me]);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!text.trim() || !me) return;
    setBusy(true);
    try {
      await api.saveCapsule({ author_id: me.id, text: text.trim() });
      setEditing(false);
      await load();
      toast(t('cap_sealed_toast'));
    } catch {
      toast(t('err_generic'), 'err');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try {
      await api.deleteCapsule(me.id);
      setMine(null);
      setText('');
      await load();
    } catch {
      toast(t('err_generic'), 'err');
    }
  };

  const writers = Array.isArray(meta) ? new Set(meta.map((m) => m.author_id)) : new Set();

  return (
    <section className="page capsule-page">
      <header className="capsule-hero">
        <Flower className="deco" size={52} />
        <h1 className="page-title">{t('capsule')}</h1>
        <p className="lead">{opened ? t('cap_open_lead') : t('cap_lead', { date: fmt.format(openAt) })}</p>
        {!opened && (
          <p className="cap-count" aria-live="polite">
            <b>{days}</b> <span>{t('days')}</span>
            {years >= 1 && <small>· {t('cap_years', { n: years })}</small>}
          </p>
        )}
      </header>

      {meta === false && <p className="empty">{t('cap_unavailable')}</p>}

      {opened && Array.isArray(meta) && (
        <>
          {all.length === 0 && <p className="empty">{t('cap_none')}</p>}
          <ul className="letters">
            {all.map((c, i) => {
              const a = person(c.author_id);
              if (!a) return null;
              return (
                <li key={c.author_id} className="letter" style={{ '--r': `${((i * 41) % 5) - 2}deg` }}>
                  <p>{c.text}</p>
                  <a href={href(`p/${a.id}`)}>
                    <Flag code={a.country} /> {a.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!opened && Array.isArray(meta) && (
        <>
          <div className="jar" aria-label={t('cap_sealed_n', { n: writers.size, total: people.length })}>
            <Star className="deco" size={30} />
            <p className="jar-title">
              <Icon name="lock" size={18} /> {t('cap_sealed_n', { n: writers.size, total: people.length })}
            </p>
            <ul className="jar-faces">
              {people.map((p) => (
                <li key={p.id} className={writers.has(p.id) ? 'on' : ''} title={firstName(p.name)}>
                  <Avatar p={p} className="mini" />
                  {writers.has(p.id) && <span className="seal" aria-label={t('cap_written')}>✓</span>}
                </li>
              ))}
            </ul>
          </div>

          {!me && (
            <p className="muted">
              {t('cap_login')} <a href={href('me')}>{t('open_cabinet')}</a>
            </p>
          )}

          {me && (!mine || editing) && (
            <form className="composer capsule-form" onSubmit={save}>
              <label htmlFor="cap-text">{t('cap_form_label', { name: firstName(me.name) })}</label>
              <textarea id="cap-text" rows={7} maxLength={CAPSULE_MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('cap_ph')} />
              <div className="composer-row">
                <span className="count">{text.length}/{CAPSULE_MAX}</span>
                <button className="btn" disabled={busy || !text.trim()}>
                  <Icon name="lock" size={18} /> {mine ? t('cap_reseal') : t('cap_seal')}
                </button>
                {editing && (
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setText(mine?.text || ''); }}>
                    {t('cancel')}
                  </button>
                )}
              </div>
              <p className="muted small">{t('cap_privacy')}</p>
            </form>
          )}

          {me && mine && !editing && (
            <article className="letter mine">
              <h2>{t('cap_yours')}</h2>
              <p>{mine.text}</p>
              <div className="composer-row">
                <button type="button" className="btn btn-small" onClick={() => setEditing(true)}>
                  <Icon name="edit" size={16} /> {t('edit')}
                </button>
                <button type="button" className="btn btn-small btn-ghost" onClick={remove}>
                  <Icon name="trash" size={16} /> {t('delete')}
                </button>
              </div>
            </article>
          )}
        </>
      )}

      {opened && me && mine && (
        <p className="muted small">{t('cap_edit_after')}</p>
      )}
    </section>
  );
}
