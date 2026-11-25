import { useState } from 'react';
import { useApp } from '../app-context';
import { auth } from '../store';
import { PageHead, RowLink, Segmented } from '../components/ui';
import { NotifySettings } from '../components/NotifySettings';
import { Icon } from '../components/Icons';

const PW_ERR = { weak_password: 'join_err_weak', same_password: 'set_pw_same', network: 'auth_err_net' };

/** Account, privacy, notifications and how the app looks. */
export default function Settings() {
  const { t, lang, setLang, theme, toggleTheme, session, isAdmin, onlineVisible, setOnlineVisible, toast, logout, installPending, openSheet } = useApp();

  const flipOnline = async (v) => {
    try {
      await setOnlineVisible(v);
    } catch {
      toast(t('err_generic'), 'err');
    }
  };

  return (
    <section className="page settings narrow">
      <PageHead title={t('nav_settings')} back="me" />

      <section className="set-group" aria-labelledby="set-acc">
        <h2 id="set-acc">{t('set_account')}</h2>
        <div className="set-card">
          <p className="set-row"><Icon name="user" size={20} /> <span>{t('acct_signed_as', { email: session?.email || '' })}</span></p>
          <PasswordForm />
        </div>
      </section>

      <section className="set-group" aria-labelledby="set-priv">
        <h2 id="set-priv">{t('set_privacy')}</h2>
        <div className="set-card">
          <label className="switch-row">
            <span>
              <b>{t('priv_online')}</b>
              <small>{t('priv_online_note')}</small>
            </span>
            <input type="checkbox" role="switch" className="switch" checked={onlineVisible} onChange={(e) => flipOnline(e.target.checked)} />
          </label>
        </div>
      </section>

      <section className="set-group" aria-labelledby="set-notif">
        <h2 id="set-notif">{t('notif_title')}</h2>
        <div className="set-card"><NotifySettings bare /></div>
      </section>

      <section className="set-group" aria-labelledby="set-app">
        <h2 id="set-app">{t('set_app')}</h2>
        <div className="set-card">
          <div className="set-line">
            <span>{t('set_lang')}</span>
            <Segmented label={t('set_lang')} value={lang} onChange={setLang} options={[{ value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }, { value: 'ja', label: '日本語' }]} />
          </div>
          <div className="set-line">
            <span>{t('set_theme')}</span>
            <Segmented
              label={t('set_theme')}
              value={theme}
              onChange={(v) => v !== theme && toggleTheme()}
              options={[{ value: 'light', label: t('theme_light'), icon: 'sun' }, { value: 'dark', label: t('theme_dark'), icon: 'moon' }]}
            />
          </div>
          {installPending && (
            <button type="button" className="btn btn-ghost" onClick={() => openSheet('install')}>
              <Icon name="download" size={18} /> {t('install_app')}
            </button>
          )}
        </div>
      </section>

      <section className="set-group">
        <div className="set-links">
          {isAdmin && <RowLink to="admin" icon="lock" title={t('admin_title')} note={t('set_admin_note')} />}
          <RowLink to="help" icon="help" title={t('help_title')} />
        </div>
      </section>

      <button type="button" className="btn btn-danger-soft set-signout" onClick={logout}>
        {t('auth_signout')}
      </button>
    </section>
  );
}

function PasswordForm() {
  const { t, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (pw.length < 8) return setErr(t('join_err_weak'));
    if (pw !== pw2) return setErr(t('join_mismatch'));
    setBusy(true);
    setErr('');
    try {
      await auth.updatePassword(pw);
      toast(t('set_pw_done'));
      setPw('');
      setPw2('');
      setOpen(false);
    } catch (x) {
      setErr(t(PW_ERR[x.message] || 'err_generic'));
    } finally {
      setBusy(false);
    }
  };
  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        <Icon name="lock" size={18} /> {t('set_pw_title')}
      </button>
    );
  }
  return (
    <form className="pw-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="pw-new">{t('reset_new')}</label>
        <input id="pw-new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} />
        <small className="field-hint">{t('join_pw_hint')}</small>
      </div>
      <div className="field">
        <label htmlFor="pw-new2">{t('join_password2')}</label>
        <input id="pw-new2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="row-actions">
        <button className="btn" disabled={busy || !pw || !pw2}>{busy ? t('auth_signing') : t('reset_save')}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{t('today_cancel')}</button>
      </div>
    </form>
  );
}
