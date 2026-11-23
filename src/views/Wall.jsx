import { useApp } from '../app-context';
import { NoteCard, NoteComposer } from '../components/Notes';

export default function Wall() {
  const { t, state } = useApp();
  return (
    <section className="page">
      <h1 className="page-title">{t('wall_title')}</h1>
      <p className="page-lead">{t('wall_lead')}</p>
      <NoteComposer choose />
      {state.notes.length === 0 ? (
        <p className="empty">{t('wall_empty')}</p>
      ) : (
        <div className="note-wall big">
          {state.notes.map((n, i) => (
            <NoteCard key={n.id} note={n} showTo index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
