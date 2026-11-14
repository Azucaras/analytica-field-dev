import {
  buildSeasonBand,
  type BandEmpty,
  type BandWindow,
  type ZarcSnapshot,
} from './season-band'
import { parseFieldLocation, seasonForDate } from './timeline'

/**
 * R-31 (revision 8): the region a window source answers for. This block supplies one,
 * Brazil, and the United States source is OD-23, owned by block 7.
 */
export type RegionId = 'br'

/** The band's question: the chosen date of R-28 and the crops the field's scenarios name. */
export type WindowQuery = {
  /** The chosen date, a UTC calendar date in `YYYY-MM-DD`. */
  date: string
  crops: readonly string[]
}

/**
 * What a source answers for one field and one date: the season the windows belong to, the
 * windows to draw, and the one thing it could not read. `season` is always the derived
 * `Y/YY` label of R-29, the form the band prints; a source's own key never leaves it.
 */
export type WindowSourceResult = {
  season: string
  windows: BandWindow[]
  empty: BandEmpty[]
}

/**
 * R-31 (revision 8): the boundary between the band and the planting windows of the field's
 * region. One source answers for one region and one place: the band asks it for the
 * windows of the chosen date and draws what it answers, so the band itself holds no
 * region's vocabulary, no source's file and no normalised key.
 */
export type WindowSource = {
  readonly region: RegionId
  /** The windows to draw for the chosen date. */
  windowsFor: (query: WindowQuery) => WindowSourceResult
}

/**
 * R-31 and OD-05: the Brazil source, reading the ZARC snapshot
 * `artifacts/zarc-mt-snapshot.json` exactly as wave 3 read it. The normalisation of the
 * derived `Y/YY` label to the snapshot's `Y/YYYY` key belongs to this source, through the
 * one documented mapping (`buildSeasonBand` calls `snapshotSeasonKey`), so no other region
 * inherits it.
 */
export function brazilWindowSource(
  place: { municipality: string; uf: string },
  snapshot: ZarcSnapshot | null | undefined,
): WindowSource {
  return {
    region: 'br',
    windowsFor: ({ date, crops }) => {
      const season = seasonForDate(date)
      const band = buildSeasonBand(snapshot, { ...place, crops, season })
      return { season, windows: band.windows, empty: band.empty }
    },
  }
}

/**
 * The window source that draws this field's band, or null when the field's region has no
 * source here (R-31, OD-23). This block reads the region from the field's `location` text,
 * where a Brazilian field names its state (`Santa Carmem, Mato Grosso`); a field that names
 * no Brazilian state, such as a United States field, therefore has no source here and the
 * band shows `No planting window source for this region` instead of a window. Block 5's
 * region adapter supplies the active `regionId` in place of this reading, and block 7
 * supplies the United States source.
 */
export function windowSourceFor(
  location: string | null | undefined,
  snapshot: ZarcSnapshot | null | undefined,
): WindowSource | null {
  const place = parseFieldLocation(location)
  if (!place) return null
  return brazilWindowSource(place, snapshot)
}
