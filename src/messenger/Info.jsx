import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { go, href } from '../router';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icons';
import { Segmented } from '../components/ui';
import { mapi } from './api';
import { ChatImage, ConvAvatar, convName, isOnline, otherOf, previewText, shortWhen } from './parts';
import { AddMembersSheet } from './Sheets';
import { addMembers, getState, leave, openConv, removeMember, renameGroup, setConvFlag, setRole, useMessenger, want } from './store';

/** About a conversation: people, shared photos, pinned messages, mute, leave. */
export default function Info({ id }) {
  const { t, lang, people, me, presence, toast, openPhotos } = useApp();
  const row = useMessenger((s) => s.inbox.find((r) => r.id === id));
  const c = useMessenger((s) => s.convs[id]);
  const [tab, setTab] = useState('people');
  const [media, setMedia] = useState(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    openConv(id);
  }, [id]);
  useEffect(() => {
    if (tab !== 'media' || media) return;
    mapi.media(id).then((rows) => {
      setMedia(rows);
      want(rows.flatMap((m) => m.attachments.map((a) => a.thumb || a.path)));
    }).catch(() => setMedia([]));
  }, [tab, id, media]);

  if (!row) {
    return (
      <section className="page narrow">
        <p className="muted">{t('msg_conv_missing')}</p>
      </section>
    );
  }
  const name = convName(row, people, me?.id, t);
  const admin = ['owner', 'admin'].includes(row.my_role);
  const owner = row.my_role === 'owner';
  const members = (c?.members || []).slice().sort((a, b) => ['owner', 'admin', 'member'].indexOf(a.role) - ['owner', 'admin', 'member'].indexOf(b.role));
  const guard = (fn) => async (...a) => {
    try {
      await fn(...a);
    } catch {
      toast(t('chat_err'), 'err');
    }
  };
  const photos = (media || []).flatMap((m) => m.attachments.filter((a) => a.type === 'image').map((a) => ({ ...a, from_id: m.from_id })));
  const other = otherOf(row, me?.id);

  return (
    <section className="page narrow conv-info">
      <a className="page-back inline" href={href(`chat/c${id}`)}>
        <Icon name="left" size={20} /> {t('back')}
      </a>
      <header className="ci-head">
        <ConvAvatar row={row} size={88} />
        {renaming ? (
          <form
            className="ci-rename"
            onSubmit={guard(async (e) => {
              e.preventDefault();
              await renameGroup(id, title);
              setRenaming(false);
            })}
          >
            <input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} aria-label={t('msg_group_name')} autoFocus />
            <button className="btn btn-small" disabled={!title.trim()}>{t('save')}</button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setRenaming(false)}>{t('cancel')}</button>
          </form>
        ) : (
          <h1 className="ci-name">
            {name}
            {row.kind === 'group' && admin && (
              <button type="button" className="icon-btn" onClick={() => { setTitle(row.title || ''); setRenaming(true); }} aria-label={t('msg_rename')}>
                <Icon name="edit" size={18} />
              </button>
            )}
          </h1>
        )}
        <p className="muted">{row.kind === 'direct' ? (isOnline(presence[other]) ? t('chat_online') : '') : t('msg_members_n', { n: row.members.length })}</p>
      </header>

      <div className="ci-actions">
        <button type="button" className="btn btn-ghost" onClick={guard(() => setConvFlag(id, 'muted', !row.muted))}>
          <Icon name={row.muted ? 'bell' : 'bell-off'} size={18} /> {t(row.muted ? 'msg_unmute' : 'msg_mute')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={guard(() => setConvFlag(id, 'pinned', !row.pinned))}>
          <Icon name="pin" size={18} /> {t(row.pinned ? 'msg_unpin_chat' : 'msg_pin_chat')}
        </button>
        {row.kind === 'direct' && other && (
          <a className="btn btn-ghost" href={href(`p/${other}`)}><Icon name="user" size={18} /> {t('nav_profile')}</a>
        )}
      </div>

      <Segmented
        label={name}
        value={tab}
        onChange={setTab}
        options={[
          ...(row.kind !== 'direct' ? [{ value: 'people', label: t('msg_people') }] : []),
          { value: 'media', label: t('msg_media') },
          { value: 'pinned', label: t('msg_pinned') },
        ]}
      />

      {tab === 'people' && row.kind !== 'direct' && (
        <>
          {row.kind === 'group' && admin && (
            <button type="button" className="btn btn-ghost ci-add" onClick={() => setAdding(true)}>
              <Icon name="plus" size={18} /> {t('msg_add_members')}
            </button>
          )}
          <ul className="ci-members">
            {members.map((m) => {
              const p = people.find((x) => x.id === m.person_id);
              if (!p) return null;
              return (
                <li key={m.person_id}>
                  <a href={href(`p/${p.id}`)} className="has-presence">
                    <Avatar p={p} className="mini round" />
                    {isOnline(presence[p.id]) && <i className="presence" />}
                  </a>
                  <span className="ci-m-name">
                    <b>{p.name}{p.id === me?.id ? ` (${t('chat_you')})` : ''}</b>
                    {m.role !== 'member' && <small>{t(`msg_role_${m.role}`)}</small>}
                  </span>
                  {row.kind === 'group' && p.id !== me?.id && (
                    <span className="ci-m-actions">
                      {owner && m.role !== 'owner' && (
                        <button type="button" className="btn btn-small btn-ghost" onClick={guard(() => setRole(id, p.id, m.role === 'admin' ? 'member' : 'admin'))}>
                          {t(m.role === 'admin' ? 'msg_unadmin' : 'msg_make_admin')}
                        </button>
                      )}
                      {(owner || (admin && m.role === 'member')) && (
                        <button type="button" className="btn btn-small btn-ghost danger" onClick={guard(() => removeMember(id, p.id))}>{t('msg_remove')}</button>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'media' &&
        (media === null ? (
          <div className="loading" role="status"><span className="spin" /></div>
        ) : photos.length ? (
          <div className="photo-grid three chat-grid">
            {photos.map((a, i) => (
              <ChatImage
                key={a.path}
                att={{ ...a, w: 1, h: 1 }}
                onOpen={() => {
                  const s = getState().urls;
                  want(photos.map((x) => x.path));
                  openPhotos(photos.map((x) => ({ full: s[x.path] || s[x.thumb], thumb: s[x.thumb], w: x.w, h: x.h, personId: x.from_id })), i);
                }}
              />
            ))}
          </div>
        ) : (
          <p className="muted ci-empty">{t('msg_no_media')}</p>
        ))}

      {tab === 'pinned' &&
        (c?.pinned?.length ? (
          <ul className="ci-pinned">
            {c.pinned.map((m) => (
              <li key={m.id}>
                <a href={href(`chat/c${id}/m${m.id}`)}>
                  <Icon name="pin" size={16} />
                  <span>{previewText(m, t)}</span>
                  <time>{shortWhen(lang, m.created_at)}</time>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted ci-empty">{t('msg_no_pinned')}</p>
        ))}

      {row.kind === 'group' && (
        <div className="ci-leave">
          {confirmLeave ? (
            <>
              <p>{t('msg_leave_q')}</p>
              <div className="row-actions">
                <button type="button" className="btn btn-danger" onClick={guard(async () => { await leave(id); go('chat'); })}>{t('msg_leave')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmLeave(false)}>{t('cancel')}</button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-danger-soft" onClick={() => setConfirmLeave(true)}>{t('msg_leave')}</button>
          )}
        </div>
      )}

      {adding && (
        <AddMembersSheet
          exclude={row.members}
          onClose={() => setAdding(false)}
          onAdd={guard(async (ids) => {
            setAdding(false);
            await addMembers(id, ids);
          })}
        />
      )}
    </section>
  );
}
