import { useEffect, useState } from 'react';
import type { TimeScene } from '../types/domain';
import { sceneMeta } from '../lib/scenes';
import { assetImageSet, sceneAsset } from '../lib/assets';
interface Props {
  scene: TimeScene;
  children: React.ReactNode;
}
export function SceneBackdrop({ scene, children }: Props) {
  const [artReady, setArtReady] = useState(false);
  useEffect(() => {
    // Let the first text frame paint before decoding the full scene plate.
    // This keeps the public landing headline responsive on slower phones.
    const frame = window.setTimeout(() => setArtReady(true), 0);
    return () => window.clearTimeout(frame);
  }, []);
  return (
    <div
      className={`scene scene--${scene} ${artReady ? 'scene--art-ready' : ''}`}
      style={
        {
          '--scene-tint': sceneMeta[scene].tint,
          '--scene-image': artReady ? assetImageSet(sceneAsset[scene]) : 'none',
        } as React.CSSProperties
      }
    >
      <div className="scene__stars" aria-hidden="true" />
      <div className="scene__mountains" aria-hidden="true" />
      {children}
    </div>
  );
}
