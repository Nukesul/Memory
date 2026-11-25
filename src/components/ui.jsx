import { href } from '../router';
import { useApp } from '../app-context';
import { Icon } from './Icons';

/** Page title with an optional back link (used on sub-pages of Memories, Settings and so on). */
export function PageHead({ title, back, lead, actions }) {
  const { t } = useApp();
  return (
    <header className="page-head">
      {back != null && (
        <a className="page-back" href={href(back)} aria-label={t('back')}>
          <Icon name="left" size={22} />
        </a>
      )}
      <div className="page-head-text">
        <h1 className="page-title">{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  );
}

/** Two to four options, one selected. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={18} />} {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'info', title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-ico" aria-hidden="true"><Icon name={icon} size={28} /></span>
      {title && <h2>{title}</h2>}
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

/** A tappable row with an icon, a title, an optional note and a chevron. */
export function RowLink({ to, onClick, icon, title, note, badge, tone }) {
  const body = (
    <>
      <span className={`row-ico ${tone || ''}`} aria-hidden="true"><Icon name={icon} size={22} /></span>
      <span className="row-text">
        <b>{title}</b>
        {note && <small>{note}</small>}
      </span>
      {badge ? <span className="row-badge">{badge}</span> : null}
      <Icon name="right" size={18} className="row-chev" />
    </>
  );
  return onClick ? (
    <button type="button" className="row-link" onClick={onClick}>{body}</button>
  ) : (
    <a className="row-link" href={href(to)}>{body}</a>
  );
}
