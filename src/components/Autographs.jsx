import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { api } from '../store';
import { href } from '../router';
import { firstName } from '../roster';
import { Flag } from './Flag';
import { Icon } from './Icons';
import { Ink, SignPad } from './Ink';

/** The signature wall on a profile page. */
export function Autographs({ person }) {
  const { t, me, person: lookup, toast } = useApp();
  const [list, setList] = useState(null); // null = loading, false = unavailable
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isMe = me?.id === person.id;

  const load = useCallback(async () => {
    try {
      setList(await api.loadAutographs(person.id));
    } catch (e) {
      console.error(e);
      setList(false);
    }
  }, [person.id]);
  useEffect(() => {
    setList(null);
    setOpen(false);
    load();
  }, [load]);

  const mine = Array.isArray(list) ? list.find((a) => a.from_id === me?.id) : null;

  const save = async (ink) => {
    if (!ink) {
      toast(t('auto_too_long'), 'err');
      return;
    }
    setBusy(true);
    try {
      await api.saveAutograph({ from_id: me.id, to_id: person.id, ink });
      await load();
      setOpen(false);
      toast(t('auto_saved'));
    } catch {
      toast(t('err_generic'), 'err');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try {
      await api.deleteAutograph(me.id, person.id);
      await load();
    } catch {
      toast(t('err_generic'), 'err');
    }
  };

  return (
    <section className="autographs" aria-labelledby="auto-title">
      <h2 id="auto-title">{t('auto_title')}</h2>
      {list === false && <p className="muted">{t('auto_unavailable')}</p>}
      {list === null && <p className="muted">{t('loading')}</p>}
      {Array.isArray(list) && (
        <>
          {list.length === 0 ? (
            <p className="muted">{isMe ? t('auto_empty_me') : t('auto_empty', { name: firstName(person.name) })}</p>
          ) : (
            <ul className="auto-wall">
              {list.map((a, i) => {
                const from = lookup(a.from_id);
                return (
                  <li key={a.from_id} className="auto-card" style={{ '--r': `${((i * 47) % 7) - 3}deg` }}>
                    <Ink ink={a.ink} />
                    {from && (
                      <a className="auto-by" href={href(`p/${from.id}`)}>
                        <Flag code={from.country} /> {firstName(from.name)}
                      </a>
                    )}
                    {a.from_id === me?.id && (
                      <button type="button" className="note-del" onClick={remove} aria-label={t('delete')}>
                        <Icon name="trash" size={16} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!me && (
            <p className="muted">
              {t('auto_login')} <a href={href('me')}>{t('open_cabinet')}</a>
            </p>
          )}
          {me && isMe && <p className="muted">{t('auto_self')}</p>}
          {me && !isMe && !open && (
            <button type="button" className="btn" onClick={() => setOpen(true)}>
              <Icon name="edit" size={18} /> {mine ? t('auto_redo') : t('auto_sign')}
            </button>
          )}
          {me && !isMe && open && <SignPad onSave={save} onCancel={() => setOpen(false)} busy={busy} />}
        </>
      )}
    </section>
  );
}
