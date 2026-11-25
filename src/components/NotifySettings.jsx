import { useApp } from '../app-context';
import { isIOS, isStandalone } from '../push';
import { Icon } from './Icons';

const KEYS = ['dm', 'class', 'notes', 'news', 'daily'];

/** Notification switches in the cabinet. */
export function NotifySettings({ bare = false }) {
  const { t, cloud, pushInfo, pushSupportedNow, enableNotifications, disableNotifications, setPushPref, toast, installPending, openSheet } = useApp();
  const on = pushInfo.permission === 'granted' && pushInfo.subscribed;
  const blocked = pushInfo.permission === 'denied';
  const needsInstall = isIOS() && !isStandalone();

  let status = t('notif_off');
  if (!cloud) status = t('notif_demo');
  else if (!pushSupportedNow) status = needsInstall ? t('notif_ios') : t('notif_unsupported');
  else if (blocked) status = t('notif_blocked');
  else if (on) status = t('notif_on');

  const turnOn = async () => {
    const r = await enableNotifications();
    if (r === 'granted') toast(t('push_on'));
    else if (r === 'denied') toast(t('push_blocked'), 'err');
    else toast(t('push_err'), 'err');
  };

  return (
    <fieldset className={`notify ${bare ? 'bare' : ''}`}>
      <legend className={bare ? 'visually-hidden' : ''}><Icon name="bell" size={18} /> {t('notif_title')}</legend>
      <p className="muted">{status}</p>
      {pushSupportedNow && !blocked && (
        <button type="button" className={`btn btn-small ${on ? 'btn-ghost' : ''}`} onClick={on ? disableNotifications : turnOn}>
          <Icon name="bell" size={16} /> {on ? t('notif_disable') : t('notif_enable')}
        </button>
      )}
      {on && (
        <ul className="switches">
          {KEYS.map((k) => (
            <li key={k}>
              <label>
                <input type="checkbox" checked={pushInfo.prefs[k] !== false} onChange={(e) => setPushPref(k, e.target.checked)} />
                <span>{t(`notif_${k}`)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {installPending && !bare && (
        <button type="button" className="btn btn-small btn-ghost" onClick={() => openSheet('install')}>
          <Icon name="download" size={16} /> {t('install_app')}
        </button>
      )}
    </fieldset>
  );
}

/** Account and privacy: who I am signed in as, and whether classmates see when I'm online. */
export function AccountSettings() {
  const { t, session, onlineVisible, setOnlineVisible, toast, logout } = useApp();
  const flip = async (v) => {
    try {
      await setOnlineVisible(v);
    } catch {
      toast(t('err_generic'), 'err');
    }
  };
  return (
    <fieldset className="notify">
      <legend><Icon name="lock" size={18} /> {t('acct_title')}</legend>
      <p className="muted">{t('acct_signed_as', { email: session?.email || '' })}</p>
      <ul className="switches">
        <li>
          <label>
            <input type="checkbox" checked={onlineVisible} onChange={(e) => flip(e.target.checked)} />
            <span>{t('priv_online')}</span>
          </label>
        </li>
      </ul>
      <p className="muted small">{t('priv_online_note')}</p>
      <button type="button" className="btn btn-small btn-ghost" onClick={logout}>
        <Icon name="arrow" size={16} /> {t('auth_signout')}
      </button>
    </fieldset>
  );
}
