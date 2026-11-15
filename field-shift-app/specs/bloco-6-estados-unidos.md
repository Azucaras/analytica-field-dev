# Block 6: United States

Asked for on 2026-11-15: repeat everything built so far with US data, the same way, then make the project read less like a machine wrote it.

## Decisions

| Question | Answer |
|---|---|
| Which counties | One Corn Belt county and one southern Plains county: McLean County, Illinois (FIPS 17113) and Lubbock County, Texas (FIPS 48303). Both codes were read from the Census 2023 cartographic boundary file. |
| US yields | USDA NASS Quick Stats. The user runs the fetch in their own shell with `NASS_API_KEY`; the key never reaches the agent or the repository. |
| Tone cleanup | Code comments, docs and README, interface text, and the `Co-Authored-By` trailer. |
| Order | US first, then the cleanup. |

## Sources confirmed for this block

| Fact | Source |
|---|---|
| County outlines and FIPS codes | US Census Bureau, `cb_2023_us_county_500k.zip` |
| El Nino winter: wetter southern US, less stormy north | NOAA CPC, North American Winter Features (`cpc.ncep.noaa.gov/products/analysis_monitoring/ensocycle/nawinter.shtml`). Illinois is not named there. |
| Winter wheat Kc ini 0.4 (frozen soils) and 0.7 (non-frozen), mid 1.15 | FAO-56 Table 12 |
| Usual planting and harvest windows, Illinois and Texas | USDA NASS, Usual Planting and Harvesting Dates for U.S. Field Crops, Agricultural Handbook 628 (1997), state level |

## What changes

- **Regional calendar.** Brazil keeps the July to June crop year. The US regions use the water year, October to September, labelled by harvest year: the cold season (October to March) carries the ENSO signal, the growing season (April to September) carries the crops. With that window the crop year label and its NDJ reference season line up with Brazil's, so one ENSO table serves both.
- **Pipeline.** `fetch_regions` reads US counties from the Census file. A new `fetch_nass` writes yield, area and revenue in the same layout as PAM. Yields stay in the NASS unit (bushels or pounds per acre): the bushel weights could not be confirmed from the USDA handbook, and neither the percentage anomaly nor the revenue needs them. Revenue per hectare is the county yield times the state's value of production per harvested acre, divided by the state yield.
- **Rotations.** McLean: corn, soybean, winter wheat, winter wheat then double-crop soybean. Lubbock: upland cotton, grain sorghum, winter wheat, winter wheat then double-crop sorghum. Double-crop dates are not in the USDA handbook and are marked `suposicao`.
- **App.** Two synthetic pilot fields (06 McLean, 07 Lubbock) in the HUD, and both counties in the analysis sheet. Month ranges in labels come from each region's calendar instead of being fixed to the Brazilian season.

## Acceptance

- `uv run pytest`, the backend suite, `tsc`, `vitest` and `npm run build` pass.
- `regions.parquet` holds the five codes; `build_scoring` scores the four regions that have rotations and skips Santa Carmem.
- Without the NASS key, the US yield and income parts say the data is missing; nothing is filled in.
- In the browser, a US field opens its county in the analysis sheet with labels that name its own months.

## Out of scope

County-level planting dates, irrigation (Lubbock is partly irrigated; NASS "all production practices" is used), costs, and any US source behind a paid account.

## Found during the build

- The record contradicts the "drier northern winter" idea for McLean: October to March rain is 21.5 percent above
  normal in the five strong El Nino years. Its signal is left unclassified. Lubbock matches NOAA: 34.8 percent
  above normal.
- One missing NASA POWER solar day (2026-09-07) fell inside the latest US water year. The soil water model drops
  that year instead of filling the day in.
