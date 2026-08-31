import { useCallback, useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { CompanionView } from './components/CompanionView';
import { LandingPage } from './components/LandingPage';
import { LedgerView } from './components/LedgerView';
import { SceneBackdrop } from './components/SceneBackdrop';
import { useLedger } from './hooks/useLedger';
import { getTimeScene } from './lib/scenes';
import { t } from './lib/i18n';
import type { Locale, MascotEvent, TimeScene } from './types/domain';
import './styles.css';

function isApp(): boolean {
  return window.location.pathname.includes('/app');
}
function preferredLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}
export default function App() {
  const ledger = useLedger();
  const [mode, setMode] = useState<'ledger' | 'companion'>(() =>
    new URLSearchParams(window.location.search).get('mode') === 'ledger' ? 'ledger' : 'companion',
  );
  const [scene, setScene] = useState<TimeScene>(getTimeScene());
  const [event, setEvent] = useState<MascotEvent>('welcome');
  const [landingLocale, setLandingLocale] = useState<Locale>(preferredLocale());
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    const ready = () => setUpdateReady(true);
    window.addEventListener('daily-ledger-update-ready', ready);
    return () => window.removeEventListener('daily-ledger-update-ready', ready);
  }, []);
  useEffect(() => {
    const tick = () =>
      setScene(
        ledger.settings.sceneOverride === 'auto' ? getTimeScene() : ledger.settings.sceneOverride,
      );
    tick();
    const timer = window.setInterval(tick, 60_000);
    const visibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [ledger.settings.sceneOverride]);
  const onEvent = useCallback((next: MascotEvent) => {
    setEvent(next);
    window.setTimeout(() => setEvent('idle'), 5200);
  }, []);
  if (!isApp())
    return (
      <SceneBackdrop scene={scene}>
        <LandingPage locale={landingLocale} onLocale={setLandingLocale} />
      </SceneBackdrop>
    );
  if (ledger.loading)
    return (
      <div className="loading-screen">
        <span className="loading-mark">✿</span>
        <p>Preparing your little ledger…</p>
      </div>
    );
  const locale = ledger.settings.locale;
  const saveSettings = (settings: typeof ledger.settings) => {
    void ledger.updateSettings(settings);
  };
  return (
    <SceneBackdrop scene={scene}>
      {updateReady && (
        <div className="update-notice" role="status">
          <span>{locale === 'zh-TW' ? '新版本已準備好。' : 'A new version is ready.'}</span>
          <button
            type="button"
            onClick={() => {
              void navigator.serviceWorker.getRegistration().then((registration) => {
                navigator.serviceWorker.addEventListener(
                  'controllerchange',
                  () => window.location.reload(),
                  { once: true },
                );
                registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
              });
            }}
          >
            {locale === 'zh-TW' ? '重新載入' : 'Reload'}
          </button>
        </div>
      )}
      <AppShell
        locale={locale}
        mode={mode}
        scene={scene}
        event={event}
        settings={ledger.settings}
        onMode={setMode}
        onSettings={saveSettings}
      >
        {ledger.error && (
          <div className="storage-alert" role="alert">
            <span>
              ⚠{' '}
              {locale === 'zh-TW'
                ? '本機儲存目前無法使用；請檢查瀏覽器權限，原有資料未被覆寫。'
                : 'Local storage is unavailable. Check browser permissions; existing data was not overwritten.'}
            </span>
            <button type="button" onClick={() => window.location.reload()}>
              {t(locale, 'reload')}
            </button>
          </div>
        )}
        {mode === 'companion' ? (
          <CompanionView
            locale={locale}
            currency={ledger.settings.currency}
            transactions={ledger.transactions}
            categories={ledger.categories}
            settings={ledger.settings}
            onSave={async (item) => {
              await ledger.save(item);
            }}
            onEvent={onEvent}
          />
        ) : (
          <LedgerView
            locale={locale}
            currency={ledger.settings.currency}
            transactions={ledger.transactions}
            categories={ledger.categories}
            settings={ledger.settings}
            onSave={async (item) => {
              await ledger.save(item);
            }}
            onRemove={async (id) => {
              await ledger.remove(id);
              onEvent('warning');
            }}
            onReplace={async (snapshot) => {
              await ledger.replace(snapshot);
            }}
            onCategorySave={async (category) => {
              await ledger.saveCategory(category);
            }}
            onCategoryDelete={async (id) => {
              await ledger.removeCategory(id);
            }}
            onEvent={onEvent}
          />
        )}
      </AppShell>
    </SceneBackdrop>
  );
}
