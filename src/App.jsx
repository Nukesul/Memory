import { useEffect } from 'react';
import { AppProvider, useApp } from './app-context';
import { CLASS } from './config';
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
import Chat from './views/Chat';
import Play from './views/Play';
import Book from './views/Book';
import Help from './views/Help';
import Capsule from './views/Capsule';
import Admin from './views/Admin';
import NotFound from './views/NotFound';

const NAV = [
  { to: '', icon: 'home', key: 'nav_home', match: ['', undefined] },
  { to: 'people', icon: 'people', key: 'nav_people', match: ['people', 'p'] },
  { to: 'gallery', icon: 'photo', key: 'nav_album', match: ['gallery', 'wall', 'book'] },
  { to: 'chat', icon: 'chat', key: 'nav_chat', match: ['chat'], badge: true },
  { to: 'play', icon: 'game', key: 'nav_play', match: ['play'] },
  { to: 'me', icon: 'user', key: 'nav_me', match: ['me', 'capsule', 'admin'] },
];

function Shell() {
  const [section, arg] = useRoute();
  const { t, lang, setLang, theme, toggleTheme, state, refresh, toasts, cloud, me, unread, canInstall, install } = useApp();
  useEffect(() => {
    document.documentElement.style.setProperty('--banner', cloud ? '0px' : '56px');
  }, [cloud]);
  useEffect(() => {
    const key = { people: 'nav_people', p: 'nav_people', gallery: 'nav_gallery', wall: 'wall_title', book: 'tab_book', chat: 'nav_chat', play: 'play_title', me: 'nav_me', help: 'help_title', capsule: 'capsule', admin: 'admin_title' }[section];
    document.title = `${key ? t(key) + ' · ' : ''}Class 2J · Memoris`;
  }, [section, t]);
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);

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
  else if (section === 'chat') view = <Chat room={arg} />;
  else if (section === 'play') view = <Play tab={arg} />;
  else if (section === 'book') view = <Book />;
  else if (section === 'help') view = <Help />;
  else if (section === 'capsule') view = <Capsule />;
  else if (section === 'admin') view = <Admin />;
  else if (section && section !== 'home') view = <NotFound />;
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
              {n.badge && unreadTotal > 0 && <span className="badge">{unreadTotal}</span>}
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

      <footer className="site-foot">
        <p>
          <b>{CLASS.name}</b> · {CLASS.school} · {lang === 'ja' ? CLASS.cityJa : CLASS.city}
        </p>
        <p>
          <a href={href('help')}>{t('help_title')}</a> · <a href={href('book')}>{t('tab_book')}</a> · <a href={href('play')}>{t('nav_play')}</a>
        </p>
        {canInstall && (
          <p>
            <button type="button" className="btn btn-small" onClick={install}>
              <Icon name="download" size={16} /> {t('install_app')}
            </button>
          </p>
        )}
      </footer>

      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.to} href={href(n.to)} aria-current={n.match.includes(section) ? 'page' : undefined}>
            <Icon name={n.icon} />
            {n.badge && unreadTotal > 0 && <span className="badge dot">{unreadTotal}</span>}
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
