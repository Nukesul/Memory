// Keeps --vvh / --vvt equal to the visible part of the screen. On phones the on-screen keyboard
// shrinks the visual viewport; the conversation screen uses these so the composer stays above it.
export function trackViewport() {
  const vv = window.visualViewport;
  const root = document.documentElement;
  const apply = () => {
    const h = vv ? vv.height : window.innerHeight;
    const top = vv ? vv.offsetTop : 0;
    root.style.setProperty('--vvh', `${Math.round(h)}px`);
    root.style.setProperty('--vvt', `${Math.round(top)}px`);
  };
  apply();
  vv?.addEventListener('resize', apply);
  vv?.addEventListener('scroll', apply);
  window.addEventListener('resize', apply);
}
