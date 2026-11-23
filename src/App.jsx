import { AppProvider, useApp } from './app-context';
import { useRoute, href } from './router';
import { Icon } from './components/Icons';
import { Avatar } from './components/Avatar';
import { Lightbox } from './components/Lightbox';
import Home from './views/Home';
import People from './views/People';
import Profile from './views/Profile';
import Gallery from './views/Gallery';
import Wall from './views/Wall';
import Me from './views/Me';

const NAV = [
  { to: '', icon: 'home', key: 'nav_home', match: ['', undefined] },
  { to: 'people', icon: 'people', key: 'nav_people', match: ['people', 'p'] },
  { to: 'gallery', icon: 'photo', key: 'nav_gallery', match: ['gallery'] },
  { to: 'wall', icon: 'note', key: 'nav_wall', match: ['wall'] },
  { to: 'me', icon: 'user', key: 'nav_me', match: ['me'] },
];

function Shell() {
  const [section, arg] = useRoute();
  const { t, lang, setLang, theme, toggleTheme, state, refresh, toasts, cloud, me } = useApp();

  let view;
  if (state.status === 'loading') {
    view = (
      <div className="loading" role="status">
        <span className="spin" /> {t('loading')}
      </div>
    );
  } else if (state.status === 'error') {
    view = (
      <div className="empty">
        <p>{t('load_error')}</p>
        <button className="btn" onClick={refresh}>{t('retry')}</button>
      </div>
    );
  } else if (section === 'people') view = <People filter={arg} />;
  else if (section === 'p') view = <Profile id={arg} />;
  else if (section === 'gallery') view = <Gallery />;
  else if (section === 'wall') view = <Wall />;
  else if (section === 'me') view = <Me />;
  else view = <Home />;

  return (
    <>
      <a
        className="skip"
        href={href()}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        {t('skip')}
      </a>
      {!cloud && <div className="demo-banner">{t('demo_banner')}</div>}

      <header className="topbar">
        <a className="brand" href={href()}>
          <span className="brand-mark" aria-hidden="true">2J</span>
          <span className="brand-name">Memoris</span>
        </a>
        <nav className="navlinks" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.to} href={href(n.to)} aria-current={n.match.includes(section) ? 'page' : undefined}>
              {t(n.key)}
            </a>
          ))}
        </nav>
        <div className="tools">
          <div className="langs" role="group" aria-label="Language">
            {['en', 'ru', 'ja'].map((l) => (
              <button key={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          </button>
          {me && (
            <a className="me-chip" href={href('me')} aria-label={me.name}>
              <Avatar p={me} className="mini" />
            </a>
          )}
        </div>
      </header>

      <main id="main" tabIndex={-1} className="wrap">
        {view}
      </main>

      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.to} href={href(n.to)} aria-current={n.match.includes(section) ? 'page' : undefined}>
            <Icon name={n.icon} />
            <span>{t(n.key)}</span>
          </a>
        ))}
      </nav>

      <Lightbox />
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast ${x.kind}`}>{x.text}</div>
        ))}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
