import { useState } from 'react';
import { useApp } from '../app-context';
import { NOTE_COLORS } from '../config';
import { href } from '../router';
import { firstName } from '../roster';
import { Flag } from './Flag';
import { Icon } from './Icons';

export function NoteCard({ note, showTo = false, index = 0 }) {
  const { meId, deleteNote, t, toast, person } = useApp();
  const from = person(note.from_id);
  const to = person(note.to_id);
  const mine = meId && (note.from_id === meId || note.to_id === meId);
  const remove = async () => {
    try {
      await deleteNote(note.id);
    } catch {
      toast(t('err_generic'), 'err');
    }
  };
  return (
    <figure className="note" style={{ '--c': NOTE_COLORS[note.color % NOTE_COLORS.length], '--r': `${((index * 53) % 5) - 2}deg` }}>
      <blockquote>{note.text}</blockquote>
      <figcaption>
        {from && (
          <a href={href(`p/${from.id}`)}>
            <Flag code={from.country} /> {firstName(from.name)}
          </a>
        )}
        {showTo && to && (
          <span className="note-to">
            {' → '}
            <a href={href(`p/${to.id}`)}>{firstName(to.name)}</a>
          </span>
        )}
      </figcaption>
      {mine && (
        <button type="button" className="note-del" onClick={remove} aria-label={t('delete')}>
          <Icon name="trash" size={16} />
        </button>
      )}
    </figure>
  );
}

/** Write a sticky note to a classmate. `toId` fixed, or `choose` to pick the recipient. */
export function NoteComposer({ toId, choose = false }) {
  const { t, me, people, addNote, toast } = useApp();
  const [text, setText] = useState('');
  const [color, setColor] = useState(0);
  const [target, setTarget] = useState(toId || '');
  const [busy, setBusy] = useState(false);

  if (!me) {
    return (
      <div className="composer locked">
        <p>{t('note_login')}</p>
        <a className="btn" href={href('me')}>
          {t('open_cabinet')}
        </a>
      </div>
    );
  }
  if (!choose && toId === me.id) {
    return <p className="composer-self">{t('note_self')}</p>;
  }

  const send = async (e) => {
    e.preventDefault();
    const to = Number(choose ? target : toId);
    if (!to || !text.trim()) return;
    setBusy(true);
    try {
      await addNote(to, text, color);
      setText('');
      toast(t('note_sent'));
    } catch {
      toast(t('err_generic'), 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="composer" onSubmit={send} style={{ '--c': NOTE_COLORS[color] }}>
      {choose && (
        <label className="composer-to">
          <span>{t('note_to')}</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} required>
            <option value="" disabled>
              {t('note_pick')}
            </option>
            {people
              .filter((p) => p.id !== me.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
      )}
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={3} placeholder={t('note_placeholder')} aria-label={t('note_placeholder')} />
      <div className="composer-row">
        <div className="swatches" role="radiogroup" aria-label={t('note_color')}>
          {NOTE_COLORS.map((c, i) => (
            <button key={c} type="button" role="radio" aria-checked={color === i} className={color === i ? 'on' : ''} style={{ background: c }} onClick={() => setColor(i)} aria-label={`${t('note_color')} ${i + 1}`} />
          ))}
        </div>
        <span className="count">{text.length}/300</span>
        <button className="btn" disabled={busy || !text.trim() || (choose && !target)}>
          {t('note_send')}
        </button>
      </div>
    </form>
  );
}
