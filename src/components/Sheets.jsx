import { useState } from 'react';
import { useApp } from '../app-context';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icons';
import { isIOS } from '../push';

/** Shows the "install" or "notifications" sheet when the app asks for one. */
export function SheetHost() {
  const { sheet, closeSheet } = useApp();
  if (sheet === 'install') return <InstallSheet onClose={closeSheet} />;
  if (sheet === 'push') return <PushSheet onClose={closeSheet} />;
  if (sheet === 'create') return <CreateSheet onClose={closeSheet} />;
  return null;
}

/** The + button: every option here works today. */
function CreateSheet({ onClose }) {
  const { t, myAnswer } = useApp();
  const items = [
    { to: 'me/edit/photos', icon: 'photo', title: t('create_photo'), note: t('create_photo_sub') },
    { to: 'wall', icon: 'note', title: t('create_note'), note: t('create_note_sub') },
    { to: 'today', icon: 'flame', title: t('create_daily'), note: myAnswer ? t('today_card_done') : t('create_daily_sub') },
    { to: 'capsule', icon: 'capsule', title: t('create_capsule'), note: t('create_capsule_sub') },
    { to: 'explore', icon: 'pen', title: t('mem_autographs'), note: t('mem_autographs_note') },
  ];
  return (
    <BottomSheet onClose={onClose} labelId="create-title">
      <div className="sheet-body create-sheet">
        <h2 id="create-title">{t('create_title')}</h2>
        <ul className="create-list">
          {items.map((it) => (
            <li key={it.to}>
              <a href={`#/${it.to}`} onClick={onClose}>
                <span className="row-ico" aria-hidden="true"><Icon name={it.icon} size={22} /></span>
                <span className="row-text"><b>{it.title}</b><small>{it.note}</small></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </BottomSheet>
  );
}

function InstallSheet({ onClose }) {
  const { t, install, canInstall } = useApp();
  const ios = isIOS();
  return (
    <BottomSheet onClose={onClose} labelId="sheet-title">
      <div className="sheet-body">
        <img className="sheet-icon" src="./icon-192.png" alt="" width="72" height="72" />
        <h2 id="sheet-title">{t('sheet_install_title')}</h2>
        <p className="sheet-lead">{t('sheet_install_lead')}</p>
        <ul className="sheet-list">
          <li><Icon name="home" size={20} /> {t('sheet_install_b1')}</li>
          <li><Icon name="bell" size={20} /> {t('sheet_install_b2')}</li>
          <li><Icon name="flame" size={20} /> {t('sheet_install_b3')}</li>
        </ul>
        {canInstall ? (
          <button className="btn btn-big" onClick={async () => { await install(); onClose(); }}>
            <Icon name="download" size={20} /> {t('sheet_install_btn')}
          </button>
        ) : ios ? (
          <ol className="ios-steps">
            <li><span>1</span> {t('sheet_ios_1')} <Icon name="share" size={20} /></li>
            <li><span>2</span> {t('sheet_ios_2')}</li>
            <li><span>3</span> {t('sheet_ios_3')}</li>
          </ol>
        ) : (
          <p className="muted">{t('sheet_install_menu')}</p>
        )}
        <button className="btn btn-ghost" onClick={onClose}>{t('sheet_later')}</button>
      </div>
    </BottomSheet>
  );
}

function PushSheet({ onClose }) {
  const { t, enableNotifications, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const r = await enableNotifications();
    setBusy(false);
    if (r === 'granted') toast(t('push_on'));
    else if (r === 'denied') toast(t('push_blocked'), 'err');
    else if (r === 'error') toast(t('push_err'), 'err');
    onClose();
  };
  return (
    <BottomSheet onClose={onClose} labelId="sheet-title">
      <div className="sheet-body">
        <span className="sheet-bell" aria-hidden="true"><Icon name="bell" size={40} /></span>
        <h2 id="sheet-title">{t('sheet_push_title')}</h2>
        <p className="sheet-lead">{t('sheet_push_lead')}</p>
        <ul className="sheet-list">
          <li><Icon name="chat" size={20} /> {t('sheet_push_b1')}</li>
          <li><Icon name="note" size={20} /> {t('sheet_push_b2')}</li>
          <li><Icon name="flame" size={20} /> {t('sheet_push_b3')}</li>
        </ul>
        <button className="btn btn-big" onClick={go} disabled={busy}>
          <Icon name="bell" size={20} /> {t('sheet_push_btn')}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>{t('sheet_later')}</button>
        <p className="muted small">{t('sheet_push_note')}</p>
      </div>
    </BottomSheet>
  );
}
