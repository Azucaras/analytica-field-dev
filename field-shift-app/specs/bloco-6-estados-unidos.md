# Block 6: United States

Status: short spec, revision 1, 2026-11-15. The user asked for everything built so far to be repeated with US data, the same way, and then for the project to lose its machine-written tone. Decisions D-09 to D-12 below are the user's answers of 2026-11-15; STATE.md carries the approval line.

## Decisions

| Id | Question | Answer |
|---|---|---|
| D-09 | Which counties | One Corn Belt county and one southern Plains county: McLean County, Illinois (FIPS 17113) and Lubbock County, Texas (FIPS 48303). Both codes were read from the Census 2023 cartographic boundary file. |
| D-10 | US yields | USDA NASS Quick Stats. The user runs the fetch in their own shell with `NASS_API_KEY`; the key never reaches the agent or the repository. |
| D-11 | Tone cleanup | Code comments, docs and README, interface text, and the `Co-Authored-By` trailer. |
| D-12 | Order | US first, then the cleanup. |

## Sources confirmed for this block

| Fact | Source |
|---|---|
| County outlines and FIPS codes | US Census Bureau, `cb_2023_us_county_500k.zip` |
| El Nino winter: wetter southern US, less stormy north | NOAA CPC, North American Winter Features (`cpc.ncep.noaa.gov/products/analysis_monitoring/ensocycle/nawinter.shtml`). Illinois is not named there; placing it in "the northern part of the country" is a project inference and is labelled so. |
| Winter wheat Kc ini 0.4 (frozen soils) and 0.7 (non-frozen), mid 1.15 | FAO-56 Table 12 |
| Usual planting and harvest windows, Illinois and Texas | USDA NASS, Usual Planting and Harvesting Dates for U.S. Field Crops, Agricultural Handbook 628 (1997), state level |
| Bushel weights (corn and sorghum 56 lb, soybeans and wheat 60 lb) | USDA ERS, Weights, Measures and Conversion Factors for Agricultural Commodities, AH-697 |

## What changes

- **Regional calendar.** Brazil keeps the July to June crop year. The US regions use the water year, October to September, labelled by harvest year: the cold season (October to March) carries the ENSO signal, the growing season (April to September) carries the crops. With that window the crop year label and its NDJ reference season line up with Brazil's, so one ENSO table serves both.
- **Pipeline.** `fetch_regions` reads US counties from the Census file. A new `fetch_nass` writes yield, area and revenue (county yield times the state marketing-year price) in the same long format as PAM. POWER, SoilGrids, Planetary Computer and Meteomatics run for the two counties unchanged.
- **Rotations.** McLean: corn, soybean, winter wheat, winter wheat then double-crop soybean. Lubbock: upland cotton, grain sorghum, winter wheat, winter wheat then double-crop sorghum. Double-crop dates are not in the USDA handbook and are marked `suposicao`.
- **App.** Two synthetic pilot fields (06 McLean, 07 Lubbock) in the HUD, and both counties in the analysis sheet. Month ranges in labels come from each region's calendar instead of being fixed to the Brazilian season.

## Acceptance

- `uv run pytest`, the backend suite, `tsc`, `vitest` and `npm run build` pass.
- `regions.parquet` holds the five codes; `build_scoring` scores the four regions that have rotations and skips Santa Carmem.
- Without the NASS key, the US yield and income parts say the data is missing; nothing is filled in.
- In the browser, a US field opens its county in the analysis sheet with labels that name its own months.

## Out of scope

County-level planting dates, irrigation (Lubbock is partly irrigated; NASS "all production practices" is used), costs, and any US source behind a paid account.
