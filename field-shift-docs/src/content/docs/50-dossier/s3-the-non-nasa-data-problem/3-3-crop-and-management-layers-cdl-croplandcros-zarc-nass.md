---
title: "3.3 Crop and management layers: CDL, CroplandCROS, ZARC, NASS"
description: "Crop-history products can narrow a candidate rotation, but they do not record all operations a farm performed."
checked: 2026-11-10
---

Crop-history products can narrow a candidate rotation, but they do not record all operations a farm performed. A classified crop, an administrative planting-risk recommendation and a county statistic are different evidence types. Combining them without their year, geography and method can turn a useful screen into a false claim about an individual field.

The USDA [Cropland Data Layer (CDL)](https://www.nass.usda.gov/Research_and_Science/Cropland/sarsfaqs2.php) (read) is an annual satellite-based crop classification with full CONUS coverage from 2008. The 2008 to 2023 crop-year layers are 30 m; layers from crop year 2024 are 10 m. The 2025 layer was released on 27 February 2026. Preserve each crop year and its native resolution. Annual class errors, mixed pixels and a changed 2024 workflow complicate cross-year comparisons. Double-cropped areas may be represented by a combined class, and pixel counts do not necessarily match official acreage. A single crop class cannot establish the full management sequence, yield, or a farmer's reason for planting it.

[CroplandCROS](https://croplandcros.scinet.usda.gov/) (read) is a viewer and export front end for CDL, not an independent survey or field-boundary authority. It can help inspect an area and compare candidate crop history, but its results inherit CDL limitations. The displayed time series spans years with different native resolutions. For reproducible application analysis, use the source CDL products directly, preserve the class and year, and ask a farmer to confirm uncertain history. USDA [Crop Sequence Boundaries](https://nass.usda.gov/Research_and_Science/Crop-Sequence-Boundaries/metadata_Crop-Sequence-Boundaries-2022.htm) (read) provide algorithmically synthesized field-like polygons from CDL time series and ancillary information. These are not surveyed or legal field boundaries, and CDL classification errors also affect polygon placement and attached sequences. [Crop Frequency Layers](https://nass.usda.gov/Research_and_Science/Cropland/metadata/metadata_Crop-Frequency-Layers-2025_FGDC-STD-001-1998.htm) (read) summarize how often included crops appeared during a historical window, but frequency does not preserve order or a complete sequence.

Brazil's [ZARC](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico/portarias) (read), the Agricultural Climate Risk Zoning programme, gives crop, municipality, planting decêndio, risk class, cultivar group and soil-class recommendations through season-specific portarias. It is an administrative risk screen, not a field observation. Soil grouping differs across rules: older portarias may use three texture classes, while newer methodology uses six water-availability classes. The applicable crop, state, cultivar and season must be checked before presenting a recommendation. The source set found no machine API, so the portaria or SISZARC query remains the route for verification. ZARC does not substitute for a field soil test or prove that a farm planted on the recommended date.

**Figure S3-F3. Crop-history and recommendation distinction (documented).**

| Source | Evidence unit | Safe interpretation |
|---|---|---|
| CDL | Annual classified pixel, 30 m through 2023 and 10 m from 2024 | Candidate US crop history |
| ZARC | Municipality, crop, season, cultivar and risk class | Brazilian planting-risk recommendation |
| NASS | County and statistical aggregates | US benchmark, not farm record |

[NASS Quick Stats](https://quickstats.nass.usda.gov/api) (read) and the [Census of Agriculture](https://www.nass.usda.gov/publications/agcensus/2022/) (read) can supply US county and other statistical-geography benchmarks for crops, practices and economics. The current Census in this source set is the 2022 edition, which reports protected aggregates, not named farm records. Quick Stats combines survey estimates and Census results; some values can be modeled, withheld or unavailable. Joining a field to its county is technically simple but cannot establish that field's yield or management. Use CDL to propose US crop history, ZARC to screen Brazilian planting risk, and NASS for aggregate comparison. The countries' inputs are not interchangeable, and no source here proves a particular farm's full rotation outcome.
