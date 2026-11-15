import { cleanup, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AvailabilityTrack } from './AvailabilityTrack'
import { LayerRail } from './LayerRail'
import { TimelineDock } from './TimelineDock'
import { buildLayerCatalog } from '@/lib/layer-catalog'
import { RECORDED_LAYERS_RESPONSE } from '@/lib/recorded-layers-response'
import { useMapStore } from '@/lib/map-store'

const catalog = buildLayerCatalog(RECORDED_LAYERS_RESPONSE)
const AXIS = RECORDED_LAYERS_RESPONSE.axis
const rowOf = (layerId: string) => document.querySelector(`.layer-entry[data-layer-id="${layerId}"]`) as HTMLElement | null

beforeEach(() => {
  useMapStore.setState({
    catalog,
    on: { 'smap-l3': true },
    opacity: {},
    order: catalog.map((entry) => entry.id),
    pinnedDates: {},
    compare: {},
    tileDecisions: {},
    chosenDate: '2026-11-14',
    axis: AXIS,
    composition: 'map',
    layerCatalogFailed: false,
  })
})

afterEach(() => {
  cleanup()
  useMapStore.setState({ chosenDate: null })
})

describe('AC-27: the Sentinel-2 track', () => {
  it('carries 18 scene marks and highlights the 6 scenes under 20 percent cloud', async () => {
    render(<AvailabilityTrack layerId="hls-l30" name="HLS Landsat reflectance, 30 m" kind="sentinel2" />)
    // The track's recorded STAC response is a lazy chunk, so the marks arrive after it loads.
    await waitFor(() => expect(document.querySelectorAll('[data-track-scene]')).toHaveLength(18))
    const track = screen.getByRole('img', { name: 'Sentinel-2 scenes' })
    expect(track.querySelectorAll('[data-track-scene]')).toHaveLength(18)
    expect(track.querySelectorAll('[data-track-scene][data-highlight="true"]')).toHaveLength(6)
  })

  it('sits in the expanded row of hls-l30 and hls-s30, not in the dock', async () => {
    const user = userEvent.setup()
    render(
      <>
        <LayerRail />
        <TimelineDock location="Santa Carmem, Mato Grosso" crops={['Soybean', 'Corn', 'Cotton']} />
      </>,
    )

    for (const layerId of ['hls-l30', 'hls-s30']) {
      const row = rowOf(layerId) as HTMLElement
      await user.click(within(row).getByRole('button', { name: /Layer options/ }))
      expect(within(row).getByRole('img', { name: 'Sentinel-2 scenes' })).toBeTruthy()
    }

    const dock = screen.getByRole('region', { name: 'Timeline' })
    expect(within(dock).queryByRole('img', { name: 'Sentinel-2 scenes' })).toBeNull()
  })
})

describe('AC-27 / R-34: declared-range marks', () => {
  it('leaves the smap-l3 gap day 2026-11-02 unmarked and keeps the days either side', () => {
    render(<AvailabilityTrack layerId="smap-l3" name="SMAP soil moisture" />)
    const track = screen.getByRole('img', { name: 'SMAP soil moisture availability' })
    const spans = [...track.querySelectorAll('[data-track-span]')].map((node) => ({
      start: node.getAttribute('data-start') as string,
      end: node.getAttribute('data-end') as string,
    }))
    const covers = (date: string) => spans.some((span) => span.start <= date && date <= span.end)
    expect(covers('2026-11-02')).toBe(false)
    expect(covers('2026-11-01')).toBe(true)
    expect(covers('2026-11-03')).toBe(true)
  })

  it('carries no ndvi-8day mark before its declared start 2025-02-12', () => {
    render(<AvailabilityTrack layerId="ndvi-8day" name="MODIS NDVI, 8 day" />)
    const track = screen.getByRole('img', { name: 'MODIS NDVI, 8 day availability' })
    const starts = [...track.querySelectorAll('[data-track-span]')].map((node) => node.getAttribute('data-start') as string)
    expect(starts.length).toBeGreaterThan(0)
    expect(starts.every((start) => start >= '2025-02-12')).toBe(true)
  })
})
