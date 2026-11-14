/**
 * R-31 and OD-21: the season band reads the ZARC snapshot at the field's municipality.
 * The file holds 93 rows over soil and cycle codes, and the field record carries no soil
 * or cycle, so the band draws the envelope of `window_risk_20` per crop and season
 * (earliest start, latest end), which is OD-22.
 */

export type ZarcWindow = { start_date: string; end_date: string }

export type ZarcRow = {
  crop: string
  season: string
  uf: string
  municipality: string
  management?: string
  window_risk_20: ZarcWindow | null
}

export type ZarcSnapshot = { rows: ZarcRow[] }

export type FieldCrop = 'Soybean' | 'Corn' | 'Cotton'

/** R-31, crop mapping table: Corn draws both maize windows, each under its own name. */
export const CROP_SNAPSHOT_NAMES: Record<FieldCrop, readonly string[]> = {
  Soybean: ['Soja'],
  Corn: ['Milho 1ª Safra', 'Milho 2ª Safra'],
  Cotton: ['Algodão Herbáceo'],
}

export const FIELD_CROPS: readonly FieldCrop[] = ['Soybean', 'Corn', 'Cotton']

export function isFieldCrop(value: string): value is FieldCrop {
  return value === 'Soybean' || value === 'Corn' || value === 'Cotton'
}

export type BandWindow = {
  fieldCrop: FieldCrop
  /** The snapshot's own crop name, the label the window is drawn with. */
  snapshotCrop: string
  start: string
  end: string
}

export type BandEmpty =
  | { kind: 'municipality' }
  | { kind: 'crop'; crop: FieldCrop }
  | { kind: 'season' }

export type SeasonBand = { windows: BandWindow[]; empty: BandEmpty[] }

export type BandQuery = {
  municipality: string
  uf: string
  crops: readonly string[]
  /** The derived label of R-29, in the `Y/YY` form. */
  season: string
}

/**
 * The envelope of one crop and one season: the earliest `window_risk_20.start_date` and
 * the latest `window_risk_20.end_date` over the Sequeiro rows (OD-22). Null when no row
 * carries a window.
 */
function envelope(rows: readonly ZarcRow[]): { start: string; end: string } | null {
  let start: string | null = null
  let end: string | null = null
  for (const row of rows) {
    const window = row.window_risk_20
    if (!window?.start_date || !window?.end_date) continue
    if (start === null || window.start_date < start) start = window.start_date
    if (end === null || window.end_date > end) end = window.end_date
  }
  return start !== null && end !== null ? { start, end } : null
}

function snapshotSeason(season: string): string {
  const [yearText, shortYearText] = season.split('/')
  const year = Number(yearText)
  let end = Math.floor(year / 100) * 100 + Number(shortYearText)
  while (end <= year) end += 100
  return `${year}/${end}`
}

/**
 * R-31: draws the windows the snapshot holds for the field's municipality and crops, for
 * the derived season only, and names the one thing it could not read. The empty cases are
 * distinct on purpose: the municipality, the crop and the season are three different
 * facts and the band never claims a window the snapshot does not hold.
 */
export function buildSeasonBand(snapshot: ZarcSnapshot | null | undefined, query: BandQuery): SeasonBand {
  if (!snapshot || !Array.isArray(snapshot.rows)) {
    return { windows: [], empty: [{ kind: 'municipality' }] }
  }

  const municipalityRows = snapshot.rows.filter((row) => (
    row.municipality === query.municipality
    && row.uf === query.uf
    && (row.management === undefined || row.management === 'Sequeiro')
  ))
  if (municipalityRows.length === 0) {
    return { windows: [], empty: [{ kind: 'municipality' }] }
  }

  const seasonKey = snapshotSeason(query.season)
  if (!municipalityRows.some((row) => row.season === seasonKey)) {
    return { windows: [], empty: [{ kind: 'season' }] }
  }

  const windows: BandWindow[] = []
  const empty: BandEmpty[] = []
  const crops = query.crops.filter(isFieldCrop).filter((crop, index, list) => list.indexOf(crop) === index)

  for (const fieldCrop of crops) {
    let drawn = false
    for (const snapshotCrop of CROP_SNAPSHOT_NAMES[fieldCrop]) {
      const rows = municipalityRows.filter((row) => row.crop === snapshotCrop && row.season === seasonKey)
      const window = envelope(rows)
      if (window === null) continue
      drawn = true
      windows.push({ fieldCrop, snapshotCrop, start: window.start, end: window.end })
    }
    if (!drawn) empty.push({ kind: 'crop', crop: fieldCrop })
  }

  return { windows, empty }
}
