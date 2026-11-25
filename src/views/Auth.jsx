import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { auth, CLOUD } from '../store';
import { byId, ROSTER } from '../roster';
import { go, href } from '../router';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';

const ERR = {
  creds: 'auth_err_creds',
  network: 'auth_err_net',
  invalid: 'join_err_invalid',
  email_taken: 'join_err_taken',
  already_registered: 'join_err_registered',
  weak_password: 'join_err_weak',
  bad_email: 'join_err_email',
  no_account: 'join_err_invalid',
};
const errKey = (e) => ERR[e?.message] || 'err_generic';

/** Frame shared by every signed-out screen: brand on top, one card, language switch. */
function AuthFrame({ children, wide = false }) {
  const { t, lang, setLang } = useApp();
  return (
    <div className="auth">
      <header className="auth-top">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">2J</span>
          <span className="brand-name">Memoris</span>
        </span>
        <div className="langs" role="group" aria-label="Language">
          {['en', 'ru', 'ja'].map((l) => (
            <button key={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main id="main" className={`auth-card ${wide ? 'wide' : ''}`}>{children}</main>
      <p className="auth-foot">{t('auth_foot')}</p>
    </div>
  );
}

function Field({ id, label, type = 'text', value, onChange, autoComplete, hint, ...rest }) {
  const [show, setShow] = useState(false);
  const { t } = useApp();
  const isPw = type === 'password';
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <input id={id} type={isPw && show ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} {...rest} />
        {isPw && (
          <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={t(show ? 'auth_hide_pw' : 'auth_show_pw')} aria-pressed={show}>
            <Icon name={show ? 'eye-off' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  );
}

export function Splash() {
  return (
    <div className="auth auth-splash" role="status" aria-label="Loading">
      <span className="brand-mark big" aria-hidden="true">2J</span>
    </div>
  );
}

export function SignIn() {
  const { t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [forgot, setForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      await auth.signIn(email, password);
    } catch (x) {
      setErr(t(errKey(x)));
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      <h1 className="auth-title">{t('auth_title')}</h1>
      <p className="auth-lead">{t('auth_lead')}</p>
      <form onSubmit={submit} className="auth-form" noValidate>
        <Field id="si-email" label={t('auth_email')} type="email" value={email} onChange={setEmail} autoComplete="username" inputMode="email" autoCapitalize="none" required />
        <Field id="si-pw" label={t('auth_password')} type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn auth-submit" disabled={busy || !email.trim() || !password}>
          {busy ? t('auth_signing') : t('auth_signin')}
        </button>
      </form>
      <button type="button" className="link-btn auth-forgot" aria-expanded={forgot} onClick={() => setForgot(!forgot)}>
        {t('auth_forgot')}
      </button>
      {forgot && <p className="auth-note">{t('auth_forgot_text')}</p>}
      <p className="auth-note">{t('auth_invite_hint')}</p>
      {!CLOUD && <DemoEnter />}
    </AuthFrame>
  );
}

/** Demo mode only: there is no server, so let people look around as any classmate. */
function DemoEnter() {
  const { t } = useApp();
  const [id, setId] = useState('');
  return (
    <div className="auth-demo">
      <label htmlFor="demo-as">{t('auth_demo')}</label>
      <div className="row">
        <select id="demo-as" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">—</option>
          {ROSTER.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost btn-small" disabled={!id} onClick={() => auth.enterAs(Number(id))}>
          {t('auth_demo_go')}
        </button>
      </div>
    </div>
  );
}

/** `#/join/<code>` and `#/reset/<code>`: create an account, or set a new password. */
export function InviteFlow({ kind, code }) {
  const { t, country, session, logout } = useApp();
  const [info, setInfo] = useState({ state: 'loading' });
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    auth
      .invite('info', { code })
      .then((r) => alive && setInfo(r.kind === kind ? { state: 'ok', person: byId(r.person_id) || { id: r.person_id, name: `#${r.person_id}` } } : { state: 'bad' }))
      .catch((x) => alive && setInfo({ state: x.message === 'network' ? 'net' : 'bad' }));
    return () => {
      alive = false;
    };
  }, [code, kind]);

  if (session) {
    return (
      <AuthFrame>
        <h1 className="auth-title">{t('auth_already')}</h1>
        <p className="auth-lead">{t('auth_already_text', { email: session.email })}</p>
        <a className="btn auth-submit" href={href()} onClick={() => go()}>{t('auth_open_app')}</a>
        <button type="button" className="link-btn auth-forgot" onClick={logout}>{t('auth_signout')}</button>
      </AuthFrame>
    );
  }

  if (info.state === 'loading') return <Splash />;
  if (info.state !== 'ok') {
    return (
      <AuthFrame>
        <div className="auth-icon warn" aria-hidden="true"><Icon name="lock" size={28} /></div>
        <h1 className="auth-title">{t(info.state === 'net' ? 'auth_err_net' : 'join_err_invalid')}</h1>
        <p className="auth-lead">{t('join_invalid_help')}</p>
        <a className="btn btn-ghost auth-submit" href={href()}>{t('auth_to_signin')}</a>
      </AuthFrame>
    );
  }

  const p = info.person;
  const pwOk = pw.length >= 8;
  const match = pw === pw2;
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!pwOk) return setErr(t('join_err_weak'));
    if (!match) return setErr(t('join_mismatch'));
    setBusy(true);
    setErr('');
    try {
      const r = await auth.invite(kind, { code, email, password: pw });
      await auth.signIn(r.email || email, pw);
      go();
    } catch (x) {
      setErr(t(errKey(x)));
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      <div className="invite-who">
        <span className="invite-mono" aria-hidden="true">{p.name.slice(0, 1)}</span>
        <div>
          <small>{t(kind === 'join' ? 'join_for' : 'reset_for')}</small>
          <b>{p.name}</b>
          {p.country && (
            <span className="invite-country"><Flag code={p.country} /> {country(p.country)}</span>
          )}
        </div>
      </div>
      <h1 className="auth-title">{t(kind === 'join' ? 'join_title' : 'reset_title')}</h1>
      <p className="auth-lead">{t(kind === 'join' ? 'join_lead' : 'reset_lead')}</p>
      <form onSubmit={submit} className="auth-form" noValidate>
        {kind === 'join' && (
          <Field id="j-email" label={t('auth_email')} type="email" value={email} onChange={setEmail} autoComplete="username" inputMode="email" autoCapitalize="none" hint={t('join_email_hint')} required />
        )}
        <Field id="j-pw" label={t(kind === 'join' ? 'auth_password' : 'reset_new')} type="password" value={pw} onChange={setPw} autoComplete="new-password" hint={t('join_pw_hint')} minLength={8} required />
        <Field id="j-pw2" label={t('join_password2')} type="password" value={pw2} onChange={setPw2} autoComplete="new-password" required />
        {pw2 && !match && <p className="field-warn">{t('join_mismatch')}</p>}
        {err && <p className="form-error" role="alert">{err}</p>}
        <button className="btn auth-submit" disabled={busy || (kind === 'join' && !email.trim()) || !pw || !pw2}>
          {busy ? t('auth_signing') : t(kind === 'join' ? 'join_create' : 'reset_save')}
        </button>
      </form>
      <p className="auth-note">{t(kind === 'join' ? 'join_privacy' : 'reset_note')}</p>
    </AuthFrame>
  );
}
