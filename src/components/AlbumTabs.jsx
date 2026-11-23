import { useApp } from '../app-context';
import { href } from '../router';

const TABS = [
  ['gallery', 'tab_photos'],
  ['wall', 'tab_notes'],
  ['book', 'tab_book'],
];

/** Photos, notes and the printable book live in one section. */
export function AlbumTabs({ active }) {
  const { t } = useApp();
  return (
    <div className="tabs wide album-tabs" role="tablist">
      {TABS.map(([to, key]) => (
        <a key={to} role="tab" aria-selected={active === to} className={active === to ? 'on' : ''} href={href(to)}>
          {t(key)}
        </a>
      ))}
    </div>
  );
}
