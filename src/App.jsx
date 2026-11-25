import { useEffect } from 'react';
import { AppProvider, useApp } from './app-context';
import { useRoute, href } from './router';
import { Icon } from './components/Icons';
import { Avatar } from './components/Avatar';
import { Lightbox } from './components/Lightbox';
import Home from './views/Home';
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
import Today from './views/Today';
import Explore from './views/Explore';
import Memories from './views/Memories';
import Settings from './views/Settings';
import { SheetHost } from './components/Sheets';
import NotFound from './views/NotFound';
import { InviteFlow, SignIn, Splash } from './views/Auth';

const ROUTE_TITLE = {
  explore: 'nav_explore', people: 'nav_explore', p: 'nav_explore', gallery: 'nav_gallery', wall: 'wall_title', book: 'tab_book',
  chat: 'nav_messages', play: 'play_title', me: 'nav_profile', help: 'help_title', capsule: 'capsule', admin: 'admin_title',
  today: 'today_title', memories: 'nav_memories', settings: 'nav_settings',
};
const MEMORY_ROUTES = ['memories', 'gallery', 'wall', 'book', 'capsule', 'today', 'play', 'help'];

/** Which main tab a route belongs to. */
function tabFor(section, arg, meId) {
  if (!section || section === 'home') return 'home';
  if (section === 'explore' || section === 'people') return 'explore';
  if (section === 'p') return Number(arg) === meId ? 'me' : 'explore';
  if (section === 'chat') return 'chat';
  if (['me', 'settings', 'admin'].includes(section)) return 'me';
  if (MEMORY_ROUTES.includes(section)) return 'memories';
  return null;
}

function NavItem({ to, icon, label, active, badge, children }) {
  return (
    <a className="nav-item" href={href(to)} aria-current={active ? 'page' : undefined}>
      <span className="nav-ico">
        {children || <Icon name={icon} size={24} />}
        {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
      </span>
      <span className="nav-label">{label}</span>
    </a>
  );
}

function Shell() {
  const [section, arg] = useRoute();
  const { t, state, refresh, toasts, cloud, me, meId, unread, installPending, pushPending, openSheet } = useApp();
  useEffect(() => {
    document.documentElement.style.setProperty('--banner', cloud ? '0px' : '34px');
  }, [cloud]);
  useEffect(() => {
    const key = ROUTE_TITLE[section];
    document.title = `${key ? t(key) + ' · ' : ''}Memoris · 2J`;
  }, [section, t]);
  const unreadTotal = Object.values(unread).reduce((a, b) => a + b, 0);
  const tab = tabFor(section, arg, meId);
  const inThread = section === 'chat' && Boolean(arg);

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
  } else if (section === 'explore') view = <Explore tab={arg} />;
  else if (section === 'people') view = <Explore tab="people" country={arg} />;
  else if (section === 'p') view = <Profile id={arg} />;
  else if (section === 'gallery') view = <Gallery />;
  else if (section === 'wall') view = <Wall />;
  else if (section === 'me') view = <Me mode={arg} />;
  else if (section === 'settings') view = <Settings />;
  else if (section === 'memories') view = <Memories />;
  else if (section === 'chat') view = <Chat room={arg} />;
  else if (section === 'play') view = <Play tab={arg} />;
  else if (section === 'book') view = <Book />;
  else if (section === 'help') view = <Help />;
  else if (section === 'capsule') view = <Capsule />;
  else if (section === 'admin') view = <Admin />;
  else if (section === 'today') view = <Today />;
  else if (section && section !== 'home') view = <NotFound />;
  else view = <Home />;

  const create = (
    <button type="button" className="nav-item nav-create" onClick={() => openSheet('create')} aria-label={t('nav_create')}>
      <span className="nav-ico"><Icon name="plus" size={26} /></span>
      <span className="nav-label">{t('nav_create')}</span>
    </button>
  );
  const meAvatar = me ? <Avatar p={me} className="nav-avatar" /> : null;

  return (
    <div className={`app ${inThread ? 'in-thread' : ''}`}>
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

      {/* Phone: slim top bar. Desktop: it is replaced by the side bar. */}
      <header className="app-top">
        <a className="wordmark" href={href()} aria-label="Memoris">
          <span className="brand-mark" aria-hidden="true">2J</span>
          <span className="wordmark-text">Memoris</span>
        </a>
        <div className="app-top-tools">
          {me && (pushPending || installPending) && (
            <button
              className="icon-btn app-chip"
              onClick={() => openSheet(pushPending ? 'push' : 'install')}
              aria-label={t(pushPending ? 'sheet_push_title' : 'sheet_install_title')}
            >
              <Icon name={pushPending ? 'bell' : 'download'} size={22} />
              <span className="pulse" aria-hidden="true" />
            </button>
          )}
          <a className="icon-btn" href={href('memories')} aria-label={t('nav_memories')} aria-current={tab === 'memories' ? 'page' : undefined}>
            <Icon name="memories" size={23} />
          </a>
        </div>
      </header>

      <nav className="app-side" aria-label={t('nav_main')}>
        <a className="wordmark" href={href()} aria-label="Memoris">
          <span className="brand-mark" aria-hidden="true">2J</span>
          <span className="wordmark-text">Memoris</span>
        </a>
        <NavItem to="" icon="home" label={t('nav_home')} active={tab === 'home'} />
        <NavItem to="explore" icon="search" label={t('nav_explore')} active={tab === 'explore'} />
        {create}
        <NavItem to="chat" icon="chat" label={t('nav_messages')} active={tab === 'chat'} badge={unreadTotal} />
        <NavItem to="memories" icon="memories" label={t('nav_memories')} active={tab === 'memories'} />
        <NavItem to="me" label={t('nav_profile')} active={tab === 'me'}>{meAvatar}</NavItem>
        <div className="side-foot">
          <NavItem to="settings" icon="settings" label={t('nav_settings')} active={section === 'settings'} />
          {installPending && (
            <button type="button" className="nav-item" onClick={() => openSheet('install')}>
              <span className="nav-ico"><Icon name="download" size={24} /></span>
              <span className="nav-label">{t('install_app')}</span>
            </button>
          )}
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="app-main">
        {view}
      </main>

      <nav className="app-nav" aria-label={t('nav_main')}>
        <NavItem to="" icon="home" label={t('nav_home')} active={tab === 'home'} />
        <NavItem to="explore" icon="search" label={t('nav_explore')} active={tab === 'explore'} />
        {create}
        <NavItem to="chat" icon="chat" label={t('nav_messages')} active={tab === 'chat'} badge={unreadTotal} />
        <NavItem to="me" label={t('nav_profile')} active={tab === 'me'}>{meAvatar}</NavItem>
      </nav>

      <Lightbox />
      <SheetHost />
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast ${x.kind}`}>{x.text}</div>
        ))}
      </div>
    </div>
  );
}

/** Nothing of the class is shown until the database knows who you are. */
function Gate() {
  const [section, arg] = useRoute();
  const { session, me, meId, state, t, logout } = useApp();
  if (session === undefined) return <Splash />;
  if ((section === 'join' || section === 'reset') && arg) return <InviteFlow kind={section} code={arg} />;
  if (!session) return <SignIn />;
  // Signed in, but not one of the 20 people this site knows (should not happen).
  if (state.status === 'ready' && meId && !me) {
    return (
      <div className="auth">
        <main className="auth-card">
          <p className="auth-lead">{t('auth_unknown')}</p>
          <button className="btn auth-submit" onClick={logout}>{t('auth_signout')}</button>
        </main>
      </div>
    );
  }
  return <Shell />;
}

export default function App() {
  return (
    <AppProvider>
      <Gate />
    </AppProvider>
  );
}
