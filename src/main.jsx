import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/onest';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/caveat';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline app shell. Production only, so the dev server never serves stale files.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
