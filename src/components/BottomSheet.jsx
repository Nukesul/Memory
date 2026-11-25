import { useEffect, useRef, useState } from 'react';

/** A sheet that slides up from the bottom. Swipe it down, tap outside, or press Esc to close. */
export function BottomSheet({ onClose, labelId, children }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const [dy, setDy] = useState(0);
  const dyRef = useRef(0); // the latest drag distance, readable before React re-renders
  const move2 = (v) => {
    dyRef.current = v;
    setDy(v);
  };
  const [leaving, setLeaving] = useState(false);

  const close = () => {
    setLeaving(true);
    move2(window.innerHeight);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const key = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, []); // eslint-disable-line

  const down = (e) => {
    drag.current = { y: e.clientY, t: Date.now() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (drag.current) move2(Math.max(0, e.clientY - drag.current.y));
  };
  const up = () => {
    if (!drag.current) return;
    const dist = dyRef.current;
    const speed = dist / Math.max(1, Date.now() - drag.current.t);
    drag.current = null;
    if (dist > 110 || speed > 0.6) close();
    else move2(0);
  };

  return (
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={ref}
        className={`sheet ${leaving ? 'leaving' : ''} ${drag.current ? 'dragging' : ''}`}
        style={{ transform: dy ? `translateY(${dy}px)` : undefined }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
      >
        <div className="sheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-hidden="true">
          <span />
        </div>
        {children}
      </div>
    </div>
  );
}
