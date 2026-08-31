import type { TimeScene } from '../types/domain';
import { sceneMeta } from '../lib/scenes';
import { assetImageSet, sceneAsset } from '../lib/assets';
interface Props {
  scene: TimeScene;
  children: React.ReactNode;
}
export function SceneBackdrop({ scene, children }: Props) {
  return (
    <div
      className={`scene scene--${scene}`}
      style={
        {
          '--scene-tint': sceneMeta[scene].tint,
          '--scene-image': assetImageSet(sceneAsset[scene]),
        } as React.CSSProperties
      }
    >
      <div className="scene__stars" aria-hidden="true" />
      <div className="scene__mountains" aria-hidden="true" />
      {children}
    </div>
  );
}
