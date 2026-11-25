import { CLOUD, api, ls } from './store';
import { VAPID_PUBLIC } from './config';

export const DEFAULT_PREFS = { dm: true, class: true, notes: true, news: true, daily: true };

export const isStandalone = () =>
  Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Push needs the real database (subscriptions are stored there) and a browser that supports it. */
export const pushSupported = () => CLOUD && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const pushPermission = () => ('Notification' in window ? Notification.permission : 'unsupported');

export const getPrefs = () => ({ ...DEFAULT_PREFS, ...ls.get('memoris:pushprefs', {}) });

const toKey = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) return reg;
  // Registered on page load in production; wait briefly for it.
  return Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('no-sw')), 6000))]);
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? await reg.pushManager.getSubscription() : null;
  } catch {
    return null;
  }
}

async function store(sub, personId, lang) {
  const j = sub.toJSON();
  await api.savePushSub({ p_person: personId, p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_lang: lang, p_prefs: getPrefs() });
}

/** Asks the browser for permission (must run from a tap), subscribes and saves the subscription. */
export async function enablePush(personId, lang) {
  if (!pushSupported()) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm;
  const reg = await registration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC) });
    } catch (e) {
      if (e?.name !== 'InvalidStateError') throw e;
      (await reg.pushManager.getSubscription())?.unsubscribe();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC) });
    }
  }
  await store(sub, personId, lang);
  return 'granted';
}

/** Keeps the server in step: another person logged in on this device, or the language changed. */
export async function syncPush(personId, lang) {
  if (!pushSupported() || pushPermission() !== 'granted') return;
  const sub = await currentSubscription();
  if (sub) await store(sub, personId, lang).catch(() => {});
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await api.removePushSub(endpoint).catch(() => {});
}

export async function savePrefs(prefs, lang) {
  ls.set('memoris:pushprefs', prefs);
  const sub = await currentSubscription();
  if (sub) await api.updatePushPrefs({ p_endpoint: sub.endpoint, p_lang: lang, p_prefs: prefs }).catch(() => {});
}
