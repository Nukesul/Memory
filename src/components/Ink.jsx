import { useEffect, useRef, useState } from 'react';
import { useApp } from '../app-context';
import { Icon } from './Icons';

export const INK_W = 400;
export const INK_H = 200;
export const INK_COLORS = ['#1c1a3a', '#3b5bdb', '#e63b2e', '#12805c', '#8a6bff'];
const MAX_JSON = 8500;
const SAFE_PATH = /^[ML\d\s.-]+$/;

/** Draws saved strokes. Only well-formed paths are rendered. */
export function Ink({ ink, className = '' }) {
  const paths = Array.isArray(ink?.p) ? ink.p.filter((d) => typeof d === 'string' && SAFE_PATH.test(d)) : [];
  const color = /^#[0-9a-f]{6}$/i.test(ink?.c || '') ? ink.c : INK_COLORS[0];
  return (
    <svg className={`ink ${className}`} viewBox={`0 0 ${INK_W} ${INK_H}`} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

const toPath = (pts) => {
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}L${pts[0][0]} ${pts[0][1]}`;
  return `M${pts[0][0]} ${pts[0][1]}` + pts.slice(1).map((p) => `L${p[0]} ${p[1]}`).join('');
};

/** Thin out points until the whole signature fits the size limit. */
export function packInk(strokes, color) {
  for (const gap of [0, 2, 4, 6, 9, 14]) {
    const p = strokes.map((s) => {
      const out = [s[0]];
      for (let i = 1; i < s.length; i++) {
        const [x, y] = s[i];
        const [lx, ly] = out[out.length - 1];
        if (Math.hypot(x - lx, y - ly) >= gap || i === s.length - 1) out.push(s[i]);
      }
      return toPath(out);
    });
    const ink = { c: color, p };
    if (JSON.stringify(ink).length <= MAX_JSON) return ink;
  }
  return null;
}

/** A small canvas to sign with a finger or a mouse. Calls onSave(ink). */
export function SignPad({ onSave, onCancel, busy }) {
  const { t } = useApp();
  const ref = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [color, setColor] = useState(INK_COLORS[0]);
  const cur = useRef(null);

  const draw = (list, c) => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.2 * (cv.width / INK_W);
    ctx.strokeStyle = c;
    const k = cv.width / INK_W;
    for (const s of list) {
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
      if (s.length === 1) ctx.lineTo(s[0][0] * k + 0.1, s[0][1] * k);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const cv = ref.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = INK_W * dpr;
    cv.height = INK_H * dpr;
  }, []);
  useEffect(() => draw(strokes, color), [strokes, color]); // eslint-disable-line

  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * INK_W), Math.round(((e.clientY - r.top) / r.height) * INK_H)];
  };
  const down = (e) => {
    e.preventDefault();
    ref.current.setPointerCapture?.(e.pointerId);
    cur.current = [pos(e)];
    setStrokes((s) => [...s, cur.current]);
  };
  const move = (e) => {
    if (!cur.current) return;
    const p = pos(e);
    const last = cur.current[cur.current.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
    cur.current.push(p);
    draw([...strokes.slice(0, -1), cur.current], color);
  };
  const up = () => {
    if (!cur.current) return;
    const done = cur.current;
    cur.current = null;
    setStrokes((s) => [...s.slice(0, -1), done]);
  };

  const save = () => {
    const ink = packInk(strokes, color);
    onSave(ink);
  };

  return (
    <div className="signpad">
      <div className="signpad-paper">
        <canvas
          ref={ref}
          className="signpad-canvas"
          aria-label={t('auto_canvas')}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        {strokes.length === 0 && <span className="signpad-hint" aria-hidden="true">{t('auto_hint')}</span>}
        <span className="signpad-line" aria-hidden="true" />
      </div>
      <div className="signpad-tools">
        <div className="swatches" role="group" aria-label={t('auto_color')}>
          {INK_COLORS.map((c) => (
            <button key={c} type="button" className={`swatch ${c === color ? 'on' : ''}`} style={{ '--c': c }} aria-label={c} aria-pressed={c === color} onClick={() => setColor(c)} />
          ))}
        </div>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
          {t('auto_undo')}
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setStrokes([])} disabled={!strokes.length}>
          {t('auto_clear')}
        </button>
      </div>
      <div className="signpad-actions">
        <button type="button" className="btn" onClick={save} disabled={!strokes.length || busy}>
          <Icon name="check" size={18} /> {t('auto_save')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('cancel')}</button>
      </div>
    </div>
  );
}
