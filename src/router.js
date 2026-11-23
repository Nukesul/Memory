import { useEffect, useState } from 'react';

const read = () => location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);

export function useRoute() {
  const [parts, setParts] = useState(read);
  useEffect(() => {
    let last = read()[0];
    const onChange = () => {
      const next = read();
      setParts(next);
      if (next[0] !== last || next[0] === 'p') window.scrollTo(0, 0);
      last = next[0];
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parts;
}

export const href = (path = '') => `#/${path}`;
export const go = (path = '') => {
  location.hash = `#/${path}`;
};
