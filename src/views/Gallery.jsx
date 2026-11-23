import { useMemo } from 'react';
import { useApp } from '../app-context';
import { asset } from '../people';
import { href } from '../router';
import { Icon } from '../components/Icons';

export default function Gallery() {
  const { t, people, openPhotos, me } = useApp();
  const items = useMemo(
    () => people.flatMap((p) => p.photos.map((ph) => ({ ...ph, personId: p.id, who: p.name.split(' ')[0] }))),
    [people],
  );
  return (
    <section className="page">
      <h1 className="page-title">{t('nav_gallery')}</h1>
      <p className="page-lead">{t('gallery_lead')}</p>
      {items.length === 0 ? (
        <div className="empty">
          <Icon name="photo" size={36} />
          <p>{t('gallery_empty')}</p>
          <a className="btn" href={href('me')}>{me ? t('open_my_cabinet') : t('take_desk')}</a>
        </div>
      ) : (
        <div className="masonry">
          {items.map((it, i) => (
            <button key={it.full + i} type="button" className="shot" onClick={() => openPhotos(items, i)} aria-label={`${t('open_photo')} — ${it.who}`}>
              <img src={asset(it.thumb)} alt={it.cap || ''} loading="lazy" decoding="async" width={it.w ? 440 : undefined} height={it.w ? Math.round((440 * it.h) / it.w) : undefined} />
              <span>{it.who}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
