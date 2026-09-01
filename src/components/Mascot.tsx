import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Locale, MascotCharacter, MascotEvent, TimeScene } from '../types/domain';
import { mascotMessage, mascotState } from '../lib/mascot';
import { sceneMeta } from '../lib/scenes';
import { assetUrl, assetVariant, mascotAssetFor } from '../lib/assets';
import { t } from '../lib/i18n';

interface Props {
  locale: Locale;
  event: MascotEvent;
  scene: TimeScene;
  compact?: boolean;
  character?: MascotCharacter;
}
export function Mascot({ locale, event, scene, compact = false, character = 'hana' }: Props) {
  const state = mascotState(event);
  const characterAsset = mascotAssetFor(character, state);
  const characterName = character === 'mugi' ? (locale === 'zh-TW' ? '麥麥' : 'Mugi') : '花水木';
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
      className={`mascot mascot--${character} mascot--${state} ${compact ? 'mascot--compact' : ''} ${engaged ? 'mascot--engaged' : ''}`}
      aria-label={locale === 'zh-TW' ? `${characterName}陪伴角色` : `${characterName} companion`}
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
            ? `${sceneMeta[scene].label}的${characterName}`
            : `${characterName} at ${sceneMeta[scene].en}`
        }
      >
        <picture key={`${character}-${state}`}>
          <source srcSet={assetVariant(characterAsset, 'avif')} type="image/avif" />
          <source srcSet={assetVariant(characterAsset, 'webp')} type="image/webp" />
          <img
            src={assetUrl(characterAsset)}
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
