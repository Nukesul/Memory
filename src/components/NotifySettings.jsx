import { useApp } from '../app-context';
import { isIOS, isStandalone } from '../push';
import { Icon } from './Icons';

const KEYS = ['dm', 'class', 'notes', 'news', 'daily'];

/** Notification switches in the cabinet. */
export function NotifySettings() {
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
    <fieldset className="notify">
      <legend><Icon name="bell" size={18} /> {t('notif_title')}</legend>
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
      {installPending && (
        <button type="button" className="btn btn-small btn-ghost" onClick={() => openSheet('install')}>
          <Icon name="download" size={16} /> {t('install_app')}
        </button>
      )}
    </fieldset>
  );
}
