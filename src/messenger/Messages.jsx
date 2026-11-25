import { useEffect, useState } from 'react';
import { useApp } from '../app-context';
import { go, useRoute } from '../router';
import { EmptyState } from '../components/ui';
import Inbox from './Inbox';
import Info from './Info';
import Thread from './Thread';
import { NewChatSheet } from './Sheets';
import { openDirect, useMessenger } from './store';

const useWide = () => {
  const q = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
};

/**
 * Routes:  #/chat                inbox
 *          #/chat/c12            conversation 12        #/chat/c12/m345  … opened at message 345
 *          #/chat/c12/info       about the conversation
 *          #/chat/all            the class chat (old links)   #/chat/7  direct chat with classmate 7 (old links, profiles)
 */
export default function Messages() {
  const { t, toast } = useApp();
  const [, arg, extra] = useRoute();
  const inbox = useMessenger((s) => s.inbox);
  const status = useMessenger((s) => s.status);
  const wide = useWide();
  const [newChat, setNewChat] = useState(false);

  // Old-style links are turned into conversation links.
  useEffect(() => {
    if (arg === 'all') {
      const cls = inbox.find((r) => r.kind === 'class');
      if (cls) go(`chat/c${cls.id}`);
    } else if (arg && /^\d+$/.test(arg)) {
      openDirect(Number(arg))
        .then((id) => go(`chat/c${id}`))
        .catch(() => {
          toast(t('chat_err'), 'err');
          go('chat');
        });
    }
  }, [arg, inbox.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const id = /^c\d+$/.test(arg || '') ? Number(arg.slice(1)) : null;
  const info = id && extra === 'info';
  const focus = id && /^m\d+$/.test(extra || '') ? Number(extra.slice(1)) : null;

  const thread = id ? (info ? <Info id={id} /> : <Thread key={id} id={id} focus={focus} desktop={wide} />) : null;
  const sheet = newChat && <NewChatSheet onClose={() => setNewChat(false)} />;

  if (!wide) {
    return (
      <div className={`messenger ${thread ? 'm-thread' : 'm-inbox'}`}>
        {thread || <Inbox onNew={() => setNewChat(true)} />}
        {sheet}
      </div>
    );
  }
  return (
    <div className="messenger wide">
      <div className="m-side">
        <Inbox activeId={id} onNew={() => setNewChat(true)} />
      </div>
      <div className="m-main">
        {thread || (
          <EmptyState icon="chat" title={status === 'ready' && !inbox.length ? t('msg_none') : t('msg_pick')} action={<button type="button" className="btn" onClick={() => setNewChat(true)}>{t('msg_new')}</button>} />
        )}
      </div>
      {sheet}
    </div>
  );
}
