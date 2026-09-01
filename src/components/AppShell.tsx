import { useEffect, useState } from 'react';
import type {
  Locale,
  MascotCharacter,
  MascotEvent,
  MascotPosition,
  TimeScene,
  UserSettingsV1,
} from '../types/domain';
import { t } from '../lib/i18n';
import { sceneMeta } from '../lib/scenes';
import { Mascot } from './Mascot';
import { assetUrl, assetVariant } from '../lib/assets';

interface Props {
  locale: Locale;
  mode: 'ledger' | 'companion';
  scene: TimeScene;
  event: MascotEvent;
  settings: UserSettingsV1;
  onMode: (mode: 'ledger' | 'companion') => void;
  onSettings: (settings: UserSettingsV1) => void;
  children: React.ReactNode;
}
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export function AppShell({
  locale,
  mode,
  scene,
  event,
  settings,
  onMode,
  onSettings,
  children,
}: Props) {
  const [mobileMascotOpen, setMobileMascotOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant' : 'en';
  }, [locale]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    const refresh = () => setClock(new Date());
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }
  const setMode = (next: 'ledger' | 'companion') => {
    onMode(next);
    window.history.replaceState({}, '', `${window.location.pathname}?mode=${next}`);
  };
  const mobilePosition = settings.mascotPosition ?? 'bottom-right';
  const mascotCharacter = settings.mascotCharacter ?? 'hana';
  const characterLabels: Record<MascotCharacter, string> = {
    hana: locale === 'zh-TW' ? '花水木' : 'Hana',
    mugi: locale === 'zh-TW' ? '麥麥柯基' : 'Mugi corgi',
    mimi: locale === 'zh-TW' ? '米米三花貓' : 'Mimi calico cat',
  };
  const positionLabels: Record<MascotPosition, string> = {
    'top-left': t(locale, 'cornerTopLeft'),
    'top-right': t(locale, 'cornerTopRight'),
    'bottom-left': t(locale, 'cornerBottomLeft'),
    'bottom-right': t(locale, 'cornerBottomRight'),
  };
  const dateLabel = new Intl.DateTimeFormat(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(clock);
  const timeLabel = clock.toLocaleTimeString(locale === 'zh-TW' ? 'zh-TW' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return (
    <div className={`app-frame ${settings.reducedMotion ? 'reduce-motion' : ''}`}>
      <a className="skip-link" href="#main-content">
        {t(locale, 'jump')}
      </a>
      <aside className="app-sidebar">
        <div className="brand">
          <span className="brand-mark">
            <picture>
              <source
                srcSet={assetVariant('assets/brand/hana-app-icon-192.png', 'avif')}
                type="image/avif"
              />
              <source
                srcSet={assetVariant('assets/brand/hana-app-icon-192.png', 'webp')}
                type="image/webp"
              />
              <img src={assetUrl('assets/brand/hana-app-icon-192.png')} alt="" />
            </picture>
          </span>
          <span>{t(locale, 'appName')}</span>
          <small>DAILY LEDGER</small>
        </div>
        <nav aria-label={t(locale, 'desktopNav')}>
          <button
            className={mode === 'companion' ? 'nav-item is-active' : 'nav-item'}
            onClick={() => setMode('companion')}
          >
            <span>⌂</span>
            {t(locale, 'menuCompanion')}
          </button>
          <button
            className={mode === 'ledger' ? 'nav-item is-active' : 'nav-item'}
            onClick={() => setMode('ledger')}
          >
            <span>▤</span>
            {t(locale, 'menuLedger')}
          </button>
          <a className="nav-item" href={assetUrl('')}>
            <span>↩</span>
            {t(locale, 'menuHome')}
          </a>
        </nav>
        <div className="sidebar-foot">
          <span className="local-badge">● {t(locale, 'savedLocally')}</span>
          <button
            className="settings-trigger"
            type="button"
            aria-label={t(locale, 'switchLanguage')}
            onClick={() => onSettings({ ...settings, locale: locale === 'zh-TW' ? 'en' : 'zh-TW' })}
          >
            文 / EN
          </button>
          {installPrompt && (
            <button className="settings-trigger" onClick={() => void installApp()}>
              ＋ {t(locale, 'install')}
            </button>
          )}
        </div>
      </aside>
      <main className="app-main" id="main-content">
        <header className="app-topbar">
          <div className="topbar-scene">
            <span className="scene-dot" style={{ background: sceneMeta[scene].tint }} />
            {locale === 'zh-TW' ? sceneMeta[scene].label : sceneMeta[scene].en}
          </div>
          <div className="topbar-actions">
            <label className="character-control" htmlFor="character-select">
              <span>{t(locale, 'character')}</span>
              <select
                className="character-select"
                id="character-select"
                value={mascotCharacter}
                aria-label={t(locale, 'character')}
                onChange={(event) =>
                  onSettings({
                    ...settings,
                    mascotCharacter: event.target.value as MascotCharacter,
                  })
                }
              >
                <option value="hana">{characterLabels.hana}</option>
                <option value="mugi">{characterLabels.mugi}</option>
                <option value="mimi">{characterLabels.mimi}</option>
              </select>
            </label>
            <select
              className="scene-select"
              value={settings.sceneOverride}
              aria-label={t(locale, 'scene')}
              onChange={(event) =>
                onSettings({
                  ...settings,
                  sceneOverride: event.target.value as UserSettingsV1['sceneOverride'],
                })
              }
            >
              <option value="auto">{t(locale, 'automatic')}</option>
              <option value="morning">{locale === 'zh-TW' ? '清晨' : 'Morning'}</option>
              <option value="noon">{locale === 'zh-TW' ? '中午' : 'Noon'}</option>
              <option value="dusk">{locale === 'zh-TW' ? '傍晚' : 'Dusk'}</option>
              <option value="evening">{locale === 'zh-TW' ? '晚上' : 'Evening'}</option>
              <option value="deep-night">{locale === 'zh-TW' ? '深夜' : 'Deep night'}</option>
            </select>
            <label className="motion-toggle" htmlFor="reduce-motion">
              <input
                id="reduce-motion"
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(event) =>
                  onSettings({ ...settings, reducedMotion: event.target.checked })
                }
              />{' '}
              <span>{t(locale, 'reducedMotion')}</span>
            </label>
            {installPrompt && (
              <button className="install-trigger" type="button" onClick={() => void installApp()}>
                ＋ {t(locale, 'install')}
              </button>
            )}
            <button
              className="topbar-language"
              type="button"
              aria-label={t(locale, 'switchLanguage')}
              onClick={() =>
                onSettings({ ...settings, locale: locale === 'zh-TW' ? 'en' : 'zh-TW' })
              }
            >
              {locale === 'zh-TW' ? 'EN' : '繁中'}
            </button>
            <button
              className="avatar-button"
              type="button"
              onClick={() => onSettings({ ...settings, reducedMotion: !settings.reducedMotion })}
              aria-label={t(locale, 'reducedMotion')}
            >
              ✿
            </button>
          </div>
        </header>
        <div className="mobile-timebar" aria-label={t(locale, 'localTime')}>
          <span className="mobile-timebar__date">{dateLabel}</span>
          <time
            className="mobile-timebar__clock"
            dateTime={`${clock.getFullYear()}-${String(clock.getMonth() + 1).padStart(2, '0')}-${String(clock.getDate()).padStart(2, '0')}T${timeLabel}`}
          >
            {timeLabel}
          </time>
          <span className="mobile-timebar__scene">
            {locale === 'zh-TW' ? sceneMeta[scene].label : sceneMeta[scene].en}
          </span>
          <span className="mobile-timebar__greeting">
            {locale === 'zh-TW' ? sceneMeta[scene].greeting : sceneMeta[scene].enGreeting}
          </span>
        </div>
        <div className="app-content">{children}</div>
      </main>
      <div className="app-companion">
        <Mascot locale={locale} event={event} scene={scene} character={mascotCharacter} />
      </div>
      <div className={`mobile-mascot-preview mobile-mascot-preview--${mobilePosition}`}>
        <Mascot locale={locale} event={event} scene={scene} compact character={mascotCharacter} />
        <button
          className="mobile-mascot-toggle"
          aria-expanded={mobileMascotOpen}
          aria-label={mobileMascotOpen ? t(locale, 'mobileMascotClose') : t(locale, 'mobileMascot')}
          onClick={() => setMobileMascotOpen((value) => !value)}
        >
          ◌
        </button>
      </div>
      {mobileMascotOpen && (
        <div
          className={`mobile-mascot-dialog mobile-mascot-dialog--${mobilePosition}`}
          role="dialog"
          aria-label={t(locale, 'companion')}
        >
          <Mascot locale={locale} event={event} scene={scene} character={mascotCharacter} />
          <label className="mascot-character-picker" htmlFor="mobile-character-select">
            <span>{t(locale, 'character')}</span>
            <select
              value={mascotCharacter}
              id="mobile-character-select"
              aria-label={t(locale, 'character')}
              onChange={(event) =>
                onSettings({
                  ...settings,
                  mascotCharacter: event.target.value as MascotCharacter,
                })
              }
            >
              <option value="hana">{characterLabels.hana}</option>
              <option value="mugi">{characterLabels.mugi}</option>
              <option value="mimi">{characterLabels.mimi}</option>
            </select>
          </label>
          <fieldset className="mascot-position-picker">
            <legend>{t(locale, 'moveMascot')}</legend>
            <div className="mascot-position-picker__grid">
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as MascotPosition[]).map(
                (position) => (
                  <button
                    className={`mascot-position-button ${mobilePosition === position ? 'is-active' : ''}`}
                    key={position}
                    type="button"
                    aria-label={positionLabels[position]}
                    aria-pressed={mobilePosition === position}
                    onClick={() => onSettings({ ...settings, mascotPosition: position })}
                  >
                    <span aria-hidden="true">
                      {position === 'top-left'
                        ? '↖'
                        : position === 'top-right'
                          ? '↗'
                          : position === 'bottom-left'
                            ? '↙'
                            : '↘'}
                    </span>
                    {positionLabels[position]}
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <button className="button button--quiet" onClick={() => setMobileMascotOpen(false)}>
            {t(locale, 'close')}
          </button>
        </div>
      )}
      <nav className="bottom-nav" aria-label={t(locale, 'menu')}>
        <button
          className={mode === 'companion' ? 'is-active' : ''}
          onClick={() => setMode('companion')}
        >
          ⌂<span>{t(locale, 'menuCompanion')}</span>
        </button>
        <button className={mode === 'ledger' ? 'is-active' : ''} onClick={() => setMode('ledger')}>
          ▤<span>{t(locale, 'menuLedger')}</span>
        </button>
      </nav>
    </div>
  );
}
