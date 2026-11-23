import { useState } from 'react';
import { useApp } from '../app-context';
import { AlbumTabs } from '../components/AlbumTabs';
import { NoteCard, NoteComposer } from '../components/Notes';

export default function Wall() {
  const { t, state, me } = useApp();
  const [view, setView] = useState('all');
  const list = state.notes.filter((n) => view === 'all' || (view === 'to' && me && n.to_id === me.id) || (view === 'from' && me && n.from_id === me.id));
  const views = me ? ['all', 'to', 'from'] : ['all'];
  return (
    <section className="page">
      <h1 className="page-title">{t('wall_title')}</h1>
      <p className="page-lead">{t('wall_lead')}</p>
      <AlbumTabs active="wall" />
      <NoteComposer choose />
      {views.length > 1 && (
        <div className="chips wall-filter" role="group" aria-label={t('wall_title')}>
          {views.map((k) => (
            <button key={k} type="button" className={`chip ${view === k ? 'on' : ''}`} onClick={() => setView(k)}>
              {t(`wall_${k}`)}
            </button>
          ))}
        </div>
      )}
      {list.length === 0 ? (
        <p className="empty">{view === 'all' ? t('wall_empty') : t(`wall_empty_${view}`)}</p>
      ) : (
        <div className="note-wall big">
          {list.map((n, i) => (
            <NoteCard key={n.id} note={n} showTo index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
