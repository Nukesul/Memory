import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app-context';
import { href } from '../router';
import { firstName } from '../roster';
import { Icon } from '../components/Icons';
import { EmptyState } from '../components/ui';
import { ConvAvatar, convName, previewText, shortWhen } from './parts';
import { search, useMessenger } from './store';

const FILTERS = ['all', 'unread', 'direct', 'group'];

export default function Inbox({ activeId, onNew }) {
  const { t, lang, people, me } = useApp();
  const inbox = useMessenger((s) => s.inbox);
  const status = useMessenger((s) => s.status);
  const outbox = useMessenger((s) => s.outbox);
  const drafts = useMessenger((s) => s.drafts);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null); // message search results
  const [searching, setSearching] = useState(false);

  // Message search waits until typing stops for a moment.
  useEffect(() => {
    const v = q.trim();
    if (v.length < 2) {
      setFound(null);
      return undefined;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        setFound(await search(v));
      } catch {
        setFound([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return inbox.filter((r) => {
      if (filter === 'unread' && !r.unread) return false;
      if (filter === 'direct' && r.kind !== 'direct') return false;
      if (filter === 'group' && r.kind === 'direct') return false;
      if (ql) return convName(r, people, me?.id, t).toLowerCase().includes(ql);
      return true;
    });
  }, [inbox, filter, q, people, me, t]);
  const failed = new Set(outbox.filter((o) => o.status === 'failed').map((o) => o.conversation_id));
  const byConv = Object.fromEntries(inbox.map((r) => [r.id, r]));

  return (
    <section className="inbox" aria-labelledby="inbox-h">
      <header className="inbox-head">
        <h1 id="inbox-h" className="page-title">{t('nav_messages')}</h1>
        <button type="button" className="icon-btn accent" onClick={onNew} aria-label={t('msg_new')} title={t('msg_new')}>
          <Icon name="pen" size={22} />
        </button>
      </header>
      <div className="search-box">
        <Icon name="search" size={20} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('msg_search_ph')} aria-label={t('msg_search_ph')} enterKeyHint="search" />
        {q && (
          <button type="button" className="search-clear" onClick={() => setQ('')} aria-label={t('clear')}>
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      {!q && (
        <div className="chips inbox-filters" role="tablist" aria-label={t('msg_filter')}>
          {FILTERS.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {t(`msg_f_${f}`)}
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && !inbox.length ? (
        <ul className="conv-list" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="conv-skel"><span /><span /></li>
          ))}
        </ul>
      ) : status === 'error' && !inbox.length ? (
        <EmptyState icon="info" title={t('msg_load_err')} />
      ) : (
        <ul className="conv-list">
          {rows.map((r) => {
            const last = r.last;
            const draft = drafts[r.id];
            const mine = last && last.from_id === me?.id;
            const who = last && r.kind !== 'direct' && !mine && last.kind !== 'system' ? `${firstName(people.find((p) => p.id === last.from_id)?.name || '')}: ` : '';
            return (
              <li key={r.id}>
                <a className={`conv-row ${activeId === r.id ? 'on' : ''} ${r.unread ? 'unread' : ''}`} href={href(`chat/c${r.id}`)} aria-current={activeId === r.id ? 'page' : undefined}>
                  <ConvAvatar row={r} />
                  <span className="conv-main">
                    <span className="conv-top">
                      <b className="conv-name">{convName(r, people, me?.id, t)}</b>
                      {r.muted && <Icon name="bell-off" size={14} className="conv-flag" />}
                      {r.pinned && <Icon name="pin" size={14} className="conv-flag" />}
                      <time>{last ? shortWhen(lang, last.created_at) : ''}</time>
                    </span>
                    <span className="conv-bottom">
                      <span className="conv-preview">
                        {failed.has(r.id) ? (
                          <em className="conv-failed">{t('msg_not_sent')}</em>
                        ) : draft ? (
                          <><em className="conv-draft">{t('msg_draft')}:</em> {draft}</>
                        ) : last ? (
                          <>{mine && last.kind !== 'system' ? `${t('chat_you')}: ` : who}{previewText(last, t)}</>
                        ) : (
                          <span className="muted">{t('msg_no_messages')}</span>
                        )}
                      </span>
                      {r.unread > 0 && <span className={`conv-badge ${r.muted ? 'muted' : ''}`}>{r.unread > 99 ? '99+' : r.unread}</span>}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
          {!rows.length && !q && <li className="conv-empty muted">{t(filter === 'unread' ? 'msg_none_unread' : 'msg_none')}</li>}
        </ul>
      )}

      {found && (
        <section className="msg-found" aria-labelledby="found-h" aria-busy={searching}>
          <h2 id="found-h">{t('msg_found', { n: found.length })}</h2>
          <ul className="conv-list">
            {found.map((m) => {
              const r = byConv[m.conversation_id];
              if (!r) return null;
              return (
                <li key={m.id}>
                  <a className="conv-row" href={href(`chat/c${r.id}/m${m.id}`)}>
                    <ConvAvatar row={r} size={44} />
                    <span className="conv-main">
                      <span className="conv-top">
                        <b className="conv-name">{convName(r, people, me?.id, t)}</b>
                        <time>{shortWhen(lang, m.created_at)}</time>
                      </span>
                      <span className="conv-preview">{firstName(people.find((p) => p.id === m.from_id)?.name || '')}: {m.text}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}
