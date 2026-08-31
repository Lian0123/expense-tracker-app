import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { runtimeBaseUrl } from './lib/assets';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
if ('serviceWorker' in navigator && import.meta.env.PROD)
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${runtimeBaseUrl()}sw.js`).then((registration) => {
      if (registration.waiting) window.dispatchEvent(new Event('daily-ledger-update-ready'));
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller)
            window.dispatchEvent(new Event('daily-ledger-update-ready'));
        });
      });
    });
  });
