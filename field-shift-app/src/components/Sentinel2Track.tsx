import { useMemo } from 'react'
import { SENTINEL2_WINDOW, sentinel2Scenes, type StacResponse } from '@/lib/availability'
import { t } from '@/strings'
import { percentOf } from './AvailabilityTrack'
import stacJson from '../../artifacts/fixtures/stac-s2-2026-09-15-2026-11-14.json'

const stacResponse = stacJson as unknown as StacResponse

/** R-33: the Sentinel-2 track, drawn from the recorded STAC response; scenes under 20 percent cloud are highlighted. */
export default function Sentinel2Track() {
  const scenes = useMemo(() => sentinel2Scenes(stacResponse, SENTINEL2_WINDOW), [])
  return (
    <div className="layer-track timeline-track" data-track="sentinel2" role="img" aria-label={t('timeline.sentinel2_track')}>
      {scenes.map((scene) => (
        <span
          className="track-scene"
          data-date={scene.date}
          data-highlight={scene.highlight ? 'true' : 'false'}
          data-track-scene
          key={scene.date}
          style={{ left: `${percentOf(scene.date, SENTINEL2_WINDOW)}%` }}
        />
      ))}
    </div>
  )
}
