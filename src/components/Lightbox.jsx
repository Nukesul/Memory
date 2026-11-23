import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { asset } from '../people';
import { byId } from '../roster';
import { href } from '../router';
import { Icon } from './Icons';

export function Lightbox() {
  const { box, closePhotos, t } = useApp();
  const [i, setI] = useState(0);
  const touch = useRef(null);
  const closeBtn = useRef(null);

  useEffect(() => {
    if (box) setI(box.index);
  }, [box]);

  const n = box?.items.length || 0;
  const step = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (!box) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closePhotos();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [box, n]); // eslint-disable-line

  if (!box) return null;
  const it = box.items[i];
  const owner = it.personId ? byId(it.personId) : null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t('photos')}
      onClick={(e) => e.target === e.currentTarget && closePhotos()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <button ref={closeBtn} className="lb-btn lb-close" onClick={closePhotos} aria-label={t('close')}>
        <Icon name="close" />
      </button>
      {n > 1 && (
        <>
          <button className="lb-btn lb-prev" onClick={() => step(-1)} aria-label={t('prev')}>
            <Icon name="left" />
          </button>
          <button className="lb-btn lb-next" onClick={() => step(1)} aria-label={t('next')}>
            <Icon name="right" />
          </button>
        </>
      )}
      <figure>
        <img key={it.full} src={asset(it.full)} alt={it.cap || ''} />
        <figcaption>
          {it.cap && <span>{it.cap}</span>}
          {owner && (
            <a href={href(`p/${owner.id}`)} onClick={closePhotos}>
              {owner.name}
            </a>
          )}
          <span className="lb-count">
            {i + 1} / {n}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
