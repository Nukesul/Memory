import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { firstName } from '../roster';
import { Icon } from '../components/Icons';
import { previewText } from './parts';
import { edit as editMessage, getState, send, setDraft } from './store';

const MAX_FILES = 10;
const MAX_VOICE = 120; // seconds
const coarse = () => window.matchMedia?.('(pointer: coarse)').matches;

function pickMime() {
  const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus'];
  return opts.find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';
}

/** Voice notes: tap the mic, talk, tap send. Up to two minutes. */
function useRecorder(onDone, onError) {
  const [rec, setRec] = useState(null); // { started, secs }
  const ref = useRef(null);
  const stopAll = () => {
    const r = ref.current;
    if (!r) return;
    clearInterval(r.timer);
    r.stream.getTracks().forEach((tr) => tr.stop());
    ref.current = null;
    setRec(null);
  };
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return onError('voice_unsupported');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const started = Date.now();
      const r = { mr, stream, chunks, started, cancel: false };
      mr.onstop = () => {
        const dur = Math.round((Date.now() - started) / 100) / 10;
        const type = (mr.mimeType || mime || 'audio/webm').split(';')[0];
        if (!r.cancel && dur >= 0.8) onDone({ blob: new Blob(chunks, { type }), mime: type, dur });
        stopAll();
      };
      r.timer = setInterval(() => {
        const secs = Math.floor((Date.now() - started) / 1000);
        setRec({ started, secs });
        if (secs >= MAX_VOICE) mr.state === 'recording' && mr.stop();
      }, 250);
      ref.current = r;
      mr.start(250);
      setRec({ started, secs: 0 });
    } catch {
      onError('voice_denied');
    }
    return undefined;
  };
  const finish = () => ref.current?.mr.state === 'recording' && ref.current.mr.stop();
  const cancel = () => {
    if (!ref.current) return;
    ref.current.cancel = true;
    ref.current.mr.state === 'recording' ? ref.current.mr.stop() : stopAll();
  };
  useEffect(() => () => cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return { rec, start, finish, cancel };
}

export default function Composer({ convId, replyTo, editing, onCancelReply, onCancelEdit, onSent, onTyping, disabled }) {
  const { t, toast, people, me } = useApp();
  const [text, setText] = useState(() => getState().drafts[convId] || '');
  const [files, setFiles] = useState([]);
  const box = useRef(null);
  const fileInput = useRef(null);
  const lastTyping = useRef(0);

  useEffect(() => {
    setText(editing ? editing.text : getState().drafts[convId] || '');
    setFiles([]);
  }, [convId, editing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editing || replyTo) box.current?.focus();
  }, [editing, replyTo]);
  // Grow with the text, up to about six lines.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [text]);
  // Save the draft a moment after typing stops.
  useEffect(() => {
    if (editing) return undefined;
    const id = setTimeout(() => setDraft(convId, text.trim() ? text : ''), 400);
    return () => clearTimeout(id);
  }, [text, convId, editing]);

  const recorder = useRecorder(
    (voice) => {
      send(convId, { voice: { ...voice, url: URL.createObjectURL(voice.blob) }, replyTo: replyTo?.id || null }).catch(() => toast(t('msg_not_sent'), 'err'));
      onSent();
    },
    (code) => toast(t(code === 'voice_denied' ? 'msg_voice_denied' : 'msg_voice_unsupported'), 'err'),
  );

  const submit = async (e) => {
    e?.preventDefault();
    if (disabled) return;
    const v = text.trim();
    if (editing) {
      if (!v) return;
      try {
        await editMessage(editing, v);
        onCancelEdit();
      } catch {
        toast(t('chat_err'), 'err');
      }
      return;
    }
    if (!v && !files.length) return;
    const payload = { text: v, files, replyTo: replyTo?.id || null };
    setText('');
    setFiles([]);
    setDraft(convId, '');
    onSent();
    try {
      await send(convId, payload);
    } catch {
      /* the bubble shows "Not sent · Retry" */
    }
  };
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !coarse()) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      if (editing) onCancelEdit();
      else if (replyTo) onCancelReply();
    }
  };
  const onInput = (v) => {
    setText(v);
    if (v && Date.now() - lastTyping.current > 2500) {
      lastTyping.current = Date.now();
      onTyping();
    }
  };
  const pick = (list) => {
    const imgs = [...list].filter((f) => f.type.startsWith('image/'));
    if (imgs.length < list.length) toast(t('msg_only_photos'), 'err');
    setFiles((cur) => {
      const next = [...cur, ...imgs].slice(0, MAX_FILES);
      if (cur.length + imgs.length > MAX_FILES) toast(t('msg_max_photos', { n: MAX_FILES }), 'err');
      return next;
    });
  };
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const replyName = replyTo ? (replyTo.from_id === me?.id ? t('chat_you') : firstName(people.find((p) => p.id === replyTo.from_id)?.name || '?')) : '';
  const canSend = editing ? text.trim() : text.trim() || files.length;

  if (recorder.rec) {
    return (
      <div className="composer rec">
        <button type="button" className="icon-btn" onClick={recorder.cancel} aria-label={t('msg_voice_cancel')}>
          <Icon name="trash" size={22} />
        </button>
        <span className="rec-dot" aria-hidden="true" />
        <span className="rec-time" role="timer">{Math.floor(recorder.rec.secs / 60)}:{String(recorder.rec.secs % 60).padStart(2, '0')}</span>
        <span className="rec-hint">{t('msg_recording')}</span>
        <button type="button" className="send-btn" onClick={recorder.finish} aria-label={t('chat_send')}>
          <Icon name="send" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="composer-wrap">
      {(replyTo || editing) && (
        <div className="compose-bar">
          <Icon name={editing ? 'edit' : 'reply'} size={18} />
          <span>
            <b>{editing ? t('msg_editing') : t('chat_replying', { name: replyName })}</b>
            <small>{previewText(editing || replyTo, t)}</small>
          </span>
          <button type="button" className="icon-btn" onClick={editing ? onCancelEdit : onCancelReply} aria-label={t('cancel')}>
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <ul className="compose-files">
          {previews.map((u, i) => (
            <li key={u}>
              <img src={u} alt="" />
              <button type="button" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))} aria-label={t('remove_photo')}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="composer" onSubmit={submit}>
        {!editing && (
          <>
            <button type="button" className="icon-btn" onClick={() => fileInput.current?.click()} aria-label={t('msg_attach')} disabled={disabled}>
              <Icon name="photo" size={22} />
            </button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
          </>
        )}
        <label className="visually-hidden" htmlFor={`compose-${convId}`}>{t('chat_ph')}</label>
        <textarea
          id={`compose-${convId}`}
          ref={box}
          rows={1}
          value={text}
          maxLength={2000}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKey}
          onPaste={(e) => e.clipboardData.files?.length && !editing && (e.preventDefault(), pick(e.clipboardData.files))}
          placeholder={t('chat_ph')}
          enterKeyHint={coarse() ? 'enter' : 'send'}
          disabled={disabled}
        />
        {canSend || editing ? (
          <button type="submit" className="send-btn" disabled={!canSend || disabled} aria-label={editing ? t('save') : t('chat_send')}>
            <Icon name={editing ? 'check' : 'send'} size={20} />
          </button>
        ) : (
          <button type="button" className="send-btn mic" onClick={recorder.start} aria-label={t('msg_voice')} disabled={disabled}>
            <Icon name="mic" size={20} />
          </button>
        )}
      </form>
    </div>
  );
}
