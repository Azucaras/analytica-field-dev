import { useEffect, useState } from 'react'
import { type LayerMetadata } from '@/lib/layer-catalog'
import { useMapStore } from '@/lib/map-store'
import { t, translationKeyFor } from '@/strings'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const PRESETS = [
  { composition: 'map' as const, key: 'layers.map' },
  { composition: 'satellite' as const, key: 'layers.satellite' },
  { composition: 'satellite-with-labels' as const, key: 'layers.satellite_with_labels' },
]

type TilePosition = { z: number; x: number; y: number }
type LayerRailProps = { tile?: TilePosition | null }

export function LayerRail({ tile = null }: LayerRailProps) {
  const composition = useMapStore((state) => state.composition)
  const setComposition = useMapStore((state) => state.setComposition)
  const [layers, setLayers] = useState<LayerMetadata[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const query = new URLSearchParams(tile ? { z: String(tile.z), x: String(tile.x), y: String(tile.y) } : {})
    fetch(`${API_BASE}/layers${query.size ? `?${query.toString()}` : ''}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json() as unknown
        if (!Array.isArray(payload)) throw new Error('Invalid layer metadata response')
        return payload as LayerMetadata[]
      })
      .then(setLayers)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        // Keep a successful previous response visible during a transient failure.
      })
    return () => controller.abort()
  }, [tile])

  return (
    <nav className="layer-rail" aria-label={t('layers.navigation')}>
      <div className="layer-presets" aria-label={t('layers.presets')}>
        {PRESETS.map(({ composition: preset, key }) => (
          <button
            aria-pressed={composition === preset}
            key={preset}
            onClick={() => setComposition(preset)}
            type="button"
          >
            {t(key)}
          </button>
        ))}
      </div>
      <ul className="layer-entries">
        {layers.map((layer) => (
          <li className="layer-entry" key={layer.id}>
            <span className="layer-entry-name">{t(translationKeyFor(layer.label) ?? layer.label)}</span>
            <span className="layer-entry-metadata">
              <span>{t(`evidence.basis_${layer.basis}`)}</span>
              <span>{t('layers.resolution_km', { resolution: layer.resolution.replace(/\s*km$/, '') })}</span>
              <time dateTime={layer.as_of}>{layer.as_of}</time>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
