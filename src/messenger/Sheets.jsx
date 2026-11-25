import { useState } from 'react';
import { useApp } from '../app-context';
import { go } from '../router';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icons';
import { ConvAvatar, EMOJI, PersonPicker, convName, previewText } from './parts';
import { createGroup, forward, openDirect, pin, react, remove, useMessenger } from './store';

/** Long press on a message: reactions on top, then the actions that apply to it. */
export function MessageMenu({ m, row, onClose, onReply, onEdit, onForward }) {
  const { t, me, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const mine = m.from_id === me?.id;
  const admin = ['owner', 'admin'].includes(row?.my_role);
  const canPin = row?.kind === 'direct' || admin;
  const act = (fn) => async () => {
    onClose();
    try {
      await fn();
    } catch {
      toast(t('chat_err'), 'err');
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.text);
      toast(t('msg_copied'));
    } catch {
      toast(t('err_generic'), 'err');
    }
    onClose();
  };
  return (
    <BottomSheet onClose={onClose} labelId="mm-title">
      <div className="sheet-body msg-menu">
        <h2 id="mm-title" className="visually-hidden">{t('msg_actions')}</h2>
        <p className="mm-preview">{previewText(m, t)}</p>
        <div className="mm-emoji" role="group" aria-label={t('chat_react')}>
          {EMOJI.map((e) => (
            <button key={e} type="button" className={(m.reactions?.[e] || []).includes(me?.id) ? 'on' : ''} onClick={act(() => react(m, e))} aria-label={e}>{e}</button>
          ))}
        </div>
        {confirm ? (
          <div className="mm-confirm">
            <p>{t('msg_delete_q')}</p>
            <div className="row-actions">
              <button type="button" className="btn btn-danger" onClick={act(() => remove(m))}>{t('delete')}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>{t('cancel')}</button>
            </div>
          </div>
        ) : (
          <ul className="mm-list">
            <li><button type="button" onClick={() => { onClose(); onReply(m); }}><Icon name="reply" size={20} /> {t('chat_reply')}</button></li>
            {m.text && <li><button type="button" onClick={copy}><Icon name="copy" size={20} /> {t('msg_copy')}</button></li>}
            <li><button type="button" onClick={() => { onClose(); onForward(m); }}><Icon name="forward" size={20} /> {t('msg_forward')}</button></li>
            {canPin && (
              <li><button type="button" onClick={act(() => pin(m, !m.pinned_at))}><Icon name="pin" size={20} /> {t(m.pinned_at ? 'msg_unpin' : 'msg_pin')}</button></li>
            )}
            {mine && m.kind === 'text' && (
              <li><button type="button" onClick={() => { onClose(); onEdit(m); }}><Icon name="edit" size={20} /> {t('edit')}</button></li>
            )}
            {(mine || admin) && (
              <li><button type="button" className="danger" onClick={() => setConfirm(true)}><Icon name="trash" size={20} /> {t('delete')}</button></li>
            )}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}

export function ForwardSheet({ m, onClose }) {
  const { t, people, me, toast } = useApp();
  const inbox = useMessenger((s) => s.inbox);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const toggle = (id) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const submit = async () => {
    if (busy || !picked.length) return;
    setBusy(true);
    try {
      await forward(m, picked);
      toast(t('msg_forwarded_ok', { n: picked.length }));
      onClose();
    } catch {
      toast(t('chat_err'), 'err');
      setBusy(false);
    }
  };
  return (
    <BottomSheet onClose={onClose} labelId="fw-title">
      <div className="sheet-body pick-sheet">
        <h2 id="fw-title">{t('msg_forward_to')}</h2>
        <ul className="pick-list">
          {inbox.map((r) => {
            const on = picked.includes(r.id);
            return (
              <li key={r.id}>
                <button type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => toggle(r.id)}>
                  <ConvAvatar row={r} size={36} />
                  <span className="pick-name">{convName(r, people, me?.id, t)}</span>
                  <span className={`pick-check ${on ? 'on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-big" disabled={!picked.length || busy} onClick={submit}>
          {busy ? t('auth_signing') : t('msg_send_n', { n: picked.length })}
        </button>
      </div>
    </BottomSheet>
  );
}

/** New conversation: one person opens a direct chat, two or more make a group. */
export function NewChatSheet({ onClose }) {
  const { t, me, toast } = useApp();
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (id) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const group = picked.length > 1;
  const submit = async () => {
    if (busy || !picked.length || (group && !title.trim())) return;
    setBusy(true);
    try {
      const id = group ? await createGroup(title.trim(), picked) : await openDirect(picked[0]);
      onClose();
      go(`chat/c${id}`);
    } catch {
      toast(t('chat_err'), 'err');
      setBusy(false);
    }
  };
  return (
    <BottomSheet onClose={onClose} labelId="nc-title">
      <div className="sheet-body pick-sheet">
        <h2 id="nc-title">{t('msg_new')}</h2>
        <div className="search-box">
          <Icon name="search" size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('explore_ph_people')} aria-label={t('explore_ph_people')} />
        </div>
        {group && (
          <div className="field">
            <label htmlFor="g-title">{t('msg_group_name')}</label>
            <input id="g-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder={t('msg_group_ph')} />
          </div>
        )}
        <PersonPicker selected={picked} onToggle={toggle} exclude={[me?.id]} query={q} />
        <button type="button" className="btn btn-big" disabled={!picked.length || busy || (group && !title.trim())} onClick={submit}>
          {group ? t('msg_create_group', { n: picked.length + 1 }) : t('write_message')}
        </button>
      </div>
    </BottomSheet>
  );
}

export function AddMembersSheet({ exclude, onAdd, onClose }) {
  const { t } = useApp();
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState('');
  const toggle = (id) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  return (
    <BottomSheet onClose={onClose} labelId="am-title">
      <div className="sheet-body pick-sheet">
        <h2 id="am-title">{t('msg_add_members')}</h2>
        <div className="search-box">
          <Icon name="search" size={20} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('explore_ph_people')} aria-label={t('explore_ph_people')} />
        </div>
        <PersonPicker selected={picked} onToggle={toggle} exclude={exclude} query={q} />
        <button type="button" className="btn btn-big" disabled={!picked.length} onClick={() => onAdd(picked)}>
          {t('msg_add_n', { n: picked.length })}
        </button>
      </div>
    </BottomSheet>
  );
}
