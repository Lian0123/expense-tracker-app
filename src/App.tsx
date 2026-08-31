import { lazy, Suspense, useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoadingScreen } from './components/LoadingScreen';
import { SceneBackdrop } from './components/SceneBackdrop';
import { getTimeScene } from './lib/scenes';
import type { Locale, TimeScene } from './types/domain';
import './styles.css';

const AppShellRoute = lazy(() => import('./AppShellRoute'));

function isApp(): boolean {
  return window.location.pathname.includes('/app');
}

function preferredLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}

export default function App() {
  const [scene, setScene] = useState<TimeScene>(getTimeScene());
  const [landingLocale, setLandingLocale] = useState<Locale>(preferredLocale());
  useEffect(() => {
    document.documentElement.lang = landingLocale === 'zh-TW' ? 'zh-Hant' : 'en';
  }, [landingLocale]);
  useEffect(() => {
    const tick = () => setScene(getTimeScene());
    const timer = window.setInterval(tick, 60_000);
    const visibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  if (!isApp()) {
    return (
      <SceneBackdrop scene={scene}>
        <LandingPage locale={landingLocale} onLocale={setLandingLocale} />
      </SceneBackdrop>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppShellRoute />
    </Suspense>
  );
}
