import { useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { COUNTRY_ORDER } from '../config';
import { asset } from '../people';
import { href } from '../router';
import { AlbumTabs } from '../components/AlbumTabs';
import { Flag } from '../components/Flag';
import { Icon } from '../components/Icons';

export default function Gallery() {
  const { t, people, openPhotos, me, country } = useApp();
  const [code, setCode] = useState('');
  const [who, setWho] = useState('');

  const all = useMemo(
    () => people.flatMap((p) => p.photos.map((ph) => ({ ...ph, personId: p.id, who: p.name.split(' ')[0], country: p.country }))),
    [people],
  );
  const items = all.filter((x) => (!code || x.country === code) && (!who || x.personId === Number(who)));
  const owners = people.filter((p) => p.photos.length && (!code || p.country === code));

  return (
    <section className="page">
      <h1 className="page-title">{t('nav_gallery')}</h1>
      <p className="page-lead">{t('gallery_lead')}</p>
      <AlbumTabs active="gallery" />

      <div className="filters">
        <div className="chips" role="group" aria-label={t('countries')}>
          <button type="button" className={`chip ${!code ? 'on' : ''}`} onClick={() => { setCode(''); setWho(''); }}>{t('all')}</button>
          {COUNTRY_ORDER.map((c) => (
            <button key={c} type="button" className={`chip ${code === c ? 'on' : ''}`} onClick={() => { setCode(c); setWho(''); }}>
              <Flag code={c} /> {country(c)}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <label className="select-wrap">
            <span className="visually-hidden">{t('gallery_who')}</span>
            <select value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">{t('gallery_who_all')}</option>
              {owners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <span className="muted count-note">{t('gallery_count', { n: items.length })}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <Icon name="photo" size={36} />
          <p>{all.length ? t('gallery_none_filter') : t('gallery_empty')}</p>
          <a className="btn" href={href('me')}>{me ? t('open_my_cabinet') : t('take_desk')}</a>
        </div>
      ) : (
        <div className="masonry">
          {items.map((it, i) => (
            <button key={it.full + i} type="button" className="shot" onClick={() => openPhotos(items, i)} aria-label={`${t('open_photo')} — ${it.who}`}>
              <img src={asset(it.thumb)} alt={it.cap || ''} loading="lazy" decoding="async" width={it.w ? 440 : undefined} height={it.w ? Math.round((440 * it.h) / it.w) : undefined} />
              <span>{it.who}{it.cap ? ` · ${it.cap}` : ''}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
