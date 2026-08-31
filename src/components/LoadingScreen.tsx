import type { Locale } from '../types/domain';
import { t } from '../lib/i18n';

interface Props {
  locale?: Locale;
}

export function LoadingScreen({ locale }: Props) {
  const resolvedLocale =
    locale ??
    (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
      ? 'zh-TW'
      : 'en');
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-card">
        <span className="loading-mark" aria-hidden="true">
          ✿
        </span>
        <div className="loading-copy">
          <strong>{t(resolvedLocale, 'loading')}</strong>
          <p>{t(resolvedLocale, 'loadingHint')}</p>
          <span className="loading-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}
