import type { Locale } from '../types/domain';
import { t } from '../lib/i18n';
import { assetUrl, assetVariant } from '../lib/assets';
interface Props {
  locale: Locale;
  onLocale: (locale: Locale) => void;
}
export function LandingPage({ locale, onLocale }: Props) {
  const isZh = locale === 'zh-TW';
  return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="brand" href={assetUrl('')}>
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
        </a>
        <div>
          <button
            className="language-toggle"
            type="button"
            aria-label={t(locale, 'switchLanguage')}
            onClick={() => onLocale(isZh ? 'en' : 'zh-TW')}
          >
            {isZh ? 'EN' : '繁中'}
          </button>
          <a
            className="button button--small button--primary"
            href={assetUrl('app/?mode=companion')}
          >
            {t(locale, 'launch')} ↗
          </a>
        </div>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">{isZh ? '給生活一點餘裕' : 'A little room for life'}</span>
          <h1>
            {isZh ? (
              <>
                讓每一筆，<em>溫柔地被看見。</em>
              </>
            ) : (
              <>
                Let every entry be <em>gently seen.</em>
              </>
            )}
          </h1>
          <p>{t(locale, 'subtitle')}</p>
          <div className="landing-actions">
            <a className="button button--primary" href={assetUrl('app/?mode=companion')}>
              {t(locale, 'launch')} <span>→</span>
            </a>
            <a className="text-button" href="#features">
              {t(locale, 'learnMore')} ↓
            </a>
          </div>
          <div className="landing-trust">
            <span>◉ {t(locale, 'private')}</span>
            <span>◒ {t(locale, 'offline')}</span>
          </div>
        </div>
        <div className="landing-visual">
          <div className="visual-moon" />
          <div className="visual-fox" aria-hidden="true">
            <picture>
              <source
                srcSet={assetVariant('assets/characters/hana-welcome.png', 'avif')}
                type="image/avif"
              />
              <source
                srcSet={assetVariant('assets/characters/hana-welcome.png', 'webp')}
                type="image/webp"
              />
              <img
                src={assetUrl('assets/characters/hana-welcome.png')}
                alt=""
                width="640"
                height="960"
                decoding="async"
                loading="lazy"
                fetchPriority="low"
              />
            </picture>
          </div>
          <div className="visual-flower flower-a">✿</div>
          <div className="visual-flower flower-b">✿</div>
          <div
            className="visual-companions"
            aria-label={isZh ? '花水木、麥麥與米米' : 'Hana, Mugi and Mimi'}
          >
            <span>✿ {isZh ? '花水木' : 'Hana'}</span>
            <b aria-hidden="true">×</b>
            <span>🐾 {isZh ? '麥麥' : 'Mugi'}</span>
            <b aria-hidden="true">×</b>
            <span>🐱 {isZh ? '米米' : 'Mimi'}</span>
          </div>
          <div className="visual-caption">{isZh ? '花水木在這裡' : 'Hana is here'}</div>
        </div>
      </section>
      <section id="features" className="feature-section">
        <div className="section-intro">
          <span className="eyebrow">{isZh ? '設計理念' : 'Designed with care'}</span>
          <h2>{isZh ? '記帳不該讓你感到壓力。' : 'Money tracking should feel lighter.'}</h2>
        </div>
        <div className="feature-grid">
          <article>
            <span>⌂</span>
            <h3>{t(locale, 'featurePrivate')}</h3>
            <p>{t(locale, 'faqDataAnswer')}</p>
          </article>
          <article>
            <span>☼</span>
            <h3>{t(locale, 'featureOffline')}</h3>
            <p>
              {isZh
                ? '沒有網路也能新增、整理與備份。'
                : 'Create, sort and back up without an internet connection.'}
            </p>
          </article>
          <article>
            <span>✿</span>
            <h3>{t(locale, 'featureMascot')}</h3>
            <p>{t(locale, 'characters')}</p>
          </article>
        </div>
      </section>
      <section className="faq-section">
        <div>
          <span className="eyebrow">{t(locale, 'faqTitle')}</span>
          <h2>{isZh ? '放心開始，答案都在這裡。' : 'Start with confidence.'}</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>{t(locale, 'faqData')}</summary>
            <p>{t(locale, 'faqDataAnswer')}</p>
          </details>
          <details>
            <summary>{t(locale, 'faqExport')}</summary>
            <p>{t(locale, 'faqExportAnswer')}</p>
          </details>
          <details>
            <summary>{t(locale, 'faqCurrency')}</summary>
            <p>{t(locale, 'faqCurrencyAnswer')}</p>
          </details>
        </div>
      </section>
      <footer>
        <span>✿ {t(locale, 'appName')}</span>
        <span>
          {t(locale, 'privacy')} · {new Date().getFullYear()}
        </span>
      </footer>
    </main>
  );
}
