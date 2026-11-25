import { useState } from 'react';
import { useApp } from '../app-context';
import { go } from '../router';
import { Icon } from '../components/Icons';
import { Segmented } from '../components/ui';
import People from './People';
import Gallery from './Gallery';

/** Find classmates and browse every photo. One search box for both. */
export default function Explore({ tab, country }) {
  const { t } = useApp();
  const [q, setQ] = useState('');
  const view = tab === 'photos' ? 'photos' : 'people';
  return (
    <section className="page explore">
      <h1 className="page-title">{t('nav_explore')}</h1>
      <div className="search-box">
        <Icon name="search" size={20} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(view === 'people' ? 'explore_ph_people' : 'explore_ph_photos')} aria-label={t('search')} enterKeyHint="search" />
        {q && (
          <button type="button" className="search-clear" onClick={() => setQ('')} aria-label={t('clear')}>
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      <Segmented
        label={t('nav_explore')}
        value={view}
        onChange={(v) => go(v === 'photos' ? 'explore/photos' : 'explore')}
        options={[
          { value: 'people', label: t('explore_people'), icon: 'people' },
          { value: 'photos', label: t('explore_photos'), icon: 'grid' },
        ]}
      />
      {view === 'people' ? <People embedded query={q} filter={country} /> : <Gallery embedded query={q} />}
    </section>
  );
}
