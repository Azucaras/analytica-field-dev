---
title: "3.1 US soil survey: gSSURGO and gNATSGO at map-unit scale"
description: "USDA NRCS soil products provide a useful mapped prior, not a soil test for a particular field."
checked: 2026-11-10
---

USDA NRCS soil products provide a useful mapped prior, not a soil test for a particular field. The distinction matters when a display grid resembles satellite pixels: a 10 m or 30 m cell can be a raster encoding of a mapped soil unit rather than an independent observation at that location.

The Gridded Soil Survey Geographic Database ([gSSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/gridded-soil-survey-geographic-gssurgo-database) (read)) links map-unit keys to component, horizon and interpretation tables. NRCS surveyors delineate map units from field observations, transects, sampling and laboratory analysis. A map unit can contain several soil components and inclusions, so one key does not mean one homogeneous soil. State gSSURGO rasters are posted at 10 m, while the CONUS raster is 30 m to limit file size in the 2026 data cycle. Many neighboring cells repeat the same map-unit key. The cell count therefore is not a sample count, and the displayed spacing does not establish the precision of a field boundary or of a soil property estimate.

An app can use gSSURGO to construct an explainable soil prior for areas with detailed survey coverage. It should retain the map-unit key, survey area, component identity and proportion, selected horizon or depth, and interpretation used. If the app reduces components to one value, it needs to state the aggregation rule. A component-proportion-weighted estimate is more defensible than selecting the dominant component without disclosure, but it still summarizes a map unit rather than measuring the field. A root-zone or water-holding interpretation also depends on depth and the chosen component aggregation, so the displayed answer should expose those choices.

[gNATSGO](https://www.nrcs.usda.gov/resources/data-and-reports/gridded-national-soil-survey-geographic-database-gnatsgo) (read) offers national continuity, but its raster does not have uniform source detail. It combines detailed SSURGO where available with generalized [STATSGO2](https://www.nrcs.usda.gov/resources/data-and-reports/description-of-statsgo2-database) (read) and Raster Soil Surveys in gaps. The 30 m national grid is thus a convenient common display, not evidence that every cell has detailed survey support. The source class should travel with each value. Where the underlying source is generalized, an app should visibly lower the confidence of field-level interpretation rather than silently presenting the national layer as equivalent to detailed survey mapping.

[Web Soil Survey](https://websoilsurvey.nrcs.usda.gov/app/) (read) gives a person a way to inspect map units, interpretations and reports for an area of interest. NRCS reports coverage in more than 95% of US counties, but county coverage does not mean that every field has an onsite diagnosis. It is best used for human review of survey evidence and its depth and interpretation choices, not treated as a stable bulk ingest API or substitute for sampling.

**Figure S3-F1. US soil survey provenance stack (documented).**

| Layer | Native support | Interpretation |
|---|---|---|
| gSSURGO | 10 m state or 30 m CONUS map-unit raster | Repeated keys, survey components and proportions |
| gNATSGO | 30 m national raster, mixed source detail | Source class governs confidence |

The design rule is to show the survey evidence behind a soil claim, not the apparent fineness of its rendered grid. Neither gSSURGO nor gNATSGO guarantees an onsite profile, and repeated cells cannot be counted as independent soil observations. Decisions that depend on actual field conditions still need local review or sampling. These US products and their survey quality claims must not be projected onto Brazilian coverage.
