import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Locale, MascotEvent, TimeScene } from '../types/domain';
import { mascotMessage, mascotState } from '../lib/mascot';
import { sceneMeta } from '../lib/scenes';
import { assetUrl, assetVariant, mascotAsset } from '../lib/assets';
import { t } from '../lib/i18n';

interface Props {
  locale: Locale;
  event: MascotEvent;
  scene: TimeScene;
  compact?: boolean;
}
export function Mascot({ locale, event, scene, compact = false }: Props) {
  const state = mascotState(event);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const engaged = hovered || pinned;
  function onKeyDown(keyEvent: KeyboardEvent<HTMLElement>) {
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      keyEvent.preventDefault();
      setPinned((value) => !value);
    }
  }
  return (
    <div
      className={`mascot mascot--${state} ${compact ? 'mascot--compact' : ''} ${engaged ? 'mascot--engaged' : ''}`}
      aria-label={locale === 'zh-TW' ? '花水木陪伴角色' : 'Hana companion'}
      role="button"
      tabIndex={0}
      aria-pressed={pinned}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={onKeyDown}
      onClick={() => setPinned((value) => !value)}
    >
      <div className="mascot__halo" aria-hidden="true" />
      <div
        className="mascot__art"
        role="img"
        aria-label={
          locale === 'zh-TW'
            ? `${sceneMeta[scene].label}的花水木`
            : `Hana at ${sceneMeta[scene].en}`
        }
      >
        <picture key={state}>
          <source
            srcSet={assetVariant(mascotAsset[state] ?? mascotAsset.idle, 'avif')}
            type="image/avif"
          />
          <source
            srcSet={assetVariant(mascotAsset[state] ?? mascotAsset.idle, 'webp')}
            type="image/webp"
          />
          <img
            src={assetUrl(mascotAsset[state] ?? mascotAsset.idle)}
            alt=""
            decoding="async"
            onError={(eventObject) => {
              eventObject.currentTarget.style.display = 'none';
            }}
          />
        </picture>
      </div>
      {!compact && (
        <div className="mascot__bubble">
          <span className="mascot__scene">
            {locale === 'zh-TW' ? sceneMeta[scene].label : sceneMeta[scene].en}
          </span>
          <p>{engaged ? t(locale, 'mascotTouch') : mascotMessage(locale, event)}</p>
        </div>
      )}
    </div>
  );
}
