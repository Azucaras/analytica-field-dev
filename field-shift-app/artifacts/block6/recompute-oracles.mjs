// Recomputes the Block 6 POWER oracles (Table H, O-01 to O-05) from the recorded responses.
// Scratch tool for this card; not part of the repository.
import { readFileSync } from 'node:fs'

const FILL = -999
const window = JSON.parse(readFileSync('artifacts/block6/power-window-2026-10-01-2026-11-11.json', 'utf8'))
const normals = JSON.parse(readFileSync('artifacts/block6/power-normals-1991-2025.json', 'utf8'))

const P = window.properties.parameter
const dates = Object.keys(P.PRECTOTCORR).sort()
const valid = (v) => typeof v === 'number' && v !== FILL
const days = dates.map((d) => ({
  date: d,
  rain: P.PRECTOTCORR[d],
  tmax: P.T2M_MAX[d],
  tmin: P.T2M_MIN[d],
  frost: P.FROST_DAYS[d],
  gwet: P.GWETROOT[d],
  evland: P.EVLAND[d],
}))
const window42 = days.slice(-42)
const rainValid = window42.filter((d) => valid(d.rain)).length
let inSum = 0
let outSum = 0
let outDropped = 0
let dry = 0
let dryMax = 0
let gdd = 0
let frost = 0
let tminMin = Infinity
let gwetSum = 0
let gwetN = 0
let hot = 0
for (const d of window42) {
  if (valid(d.rain)) {
    inSum += d.rain
    if (d.rain < 1.0) { dry += 1; dryMax = Math.max(dryMax, dry) } else dry = 0
  } else dry = 0
  if (valid(d.evland)) outSum += d.evland; else outDropped += 1
  if (valid(d.tmax) && valid(d.tmin)) gdd += Math.max(0, (d.tmax + d.tmin) / 2 - 10)
  if (valid(d.frost)) frost += d.frost
  if (valid(d.tmin)) tminMin = Math.min(tminMin, d.tmin)
  if (valid(d.gwet)) { gwetSum += d.gwet; gwetN += 1 }
  if (valid(d.tmax) && d.tmax >= 35) hot += 1
}
console.log('window', window42[0].date, window42[41].date, 'days', window42.length, 'rain valid', rainValid)
console.log('rain_total (in)', inSum.toFixed(4), '-> printed', inSum.toFixed(1))
console.log('dry_spell_days', dryMax)
console.log('gdd10', gdd.toFixed(4), '-> printed', Math.round(gdd))
console.log('frost_days', frost)
console.log('tmin_min', tminMin.toFixed(4), '-> printed', tminMin.toFixed(1))
console.log('gwetroot_mean', (gwetSum / gwetN).toFixed(4), '-> printed', (gwetSum / gwetN).toFixed(2), 'n', gwetN)
console.log('out (EVLAND sum)', outSum.toFixed(4), '-> printed', outSum.toFixed(1), 'EVLAND dropped days', outDropped)
console.log('remaining', (inSum - outSum).toFixed(4), '-> printed', (inSum - outSum).toFixed(1))
console.log('hot_days (Tmax>=35)', hot)

// Normals: Oct 1 to Nov 11 in each year 1991 to 2025.
const NP = normals.properties.parameter
const byYear = {}
for (const d of Object.keys(NP.PRECTOTCORR)) {
  const md = d.slice(4, 8)
  if (md < '1001' || md > '1111') continue
  const y = d.slice(0, 4)
  byYear[y] ??= { rain: 0, rainBad: 0, hot: 0, hotBad: 0, n: 0 }
  const r = NP.PRECTOTCORR[d]
  const tx = NP.T2M_MAX[d]
  byYear[y].n += 1
  if (valid(r)) byYear[y].rain += r; else byYear[y].rainBad += 1
  if (valid(tx)) { if (tx >= 35) byYear[y].hot += 1 } else byYear[y].hotBad += 1
}
const years = Object.keys(byYear).sort()
const rains = years.map((y) => byYear[y].rain).filter((_, i) => byYear[years[i]].rainBad === 0)
const hots = years.map((y) => byYear[y].hot)
const sorted = [...rains].sort((a, b) => a - b)
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
console.log('normals years', years.length, years[0], years[years.length - 1], 'years with rain bad', years.filter((y) => byYear[y].rainBad).length)
console.log('rain median', median(rains).toFixed(4), 'min', sorted[0].toFixed(4), 'max', sorted[sorted.length - 1].toFixed(4))
const rank = rains.filter((r) => r < inSum).length
console.log('rank (earlier years strictly below current)', rank, 'percentile', Math.round((100 * rank) / years.length))
console.log('hot days median', median(hots), 'min', Math.min(...hots), 'max', Math.max(...hots))
console.log('per year rain:', years.map((y) => `${y} ${byYear[y].rain.toFixed(1)}`).join('; '))
