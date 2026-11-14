---
title: Evidence log
description: Append-only record of what was run, with result and confidence.
---

Append only. Never rewrite a row to fit a later conclusion; add a correcting row instead. Confidence: `measured` is a number this machine produced, `documented` is a source that says it, `recalled` is memory, and `inferred` is our reasoning over either.

| Id | Question | What was run, exactly | Result | Confidence | Source |
|---|---|---|---|---|---|
| E-01 | Does the CMR catalogue return SMAP granules publicly | `curl` on the CMR granules endpoint with `collection_concept_id=C2938664763-NSIDC_CPRD`, page size 5 | HTTP 200, 4160 hits, newest granule 2026-11-09 | measured | cmr.earthdata.nasa.gov |
| E-02 | Does POWER answer without a key | `curl` on the POWER daily point API, 42.03 by -93.63, 2025-05-01 to 2025-09-30 | HTTP 200, 153 days, 622 mm season total | measured | power.larc.nasa.gov |
| E-03 | Do the site starter snippets run as printed | Ran seven snippets from the companion site in a scratch venv, six Python and one Node | 7 of 7 ran, 0 failed | measured | Companion site starters |
| E-04 | Does a synthetic raster reproject under rasterio 1.4.4 | `calculate_default_transform` plus `reproject` on a 2 by 2 grid | 2 by 2 transformed to 4 by 4, finite values, GDAL 3.10.3 | measured | Local venv |
| E-05 | What resolution and support does SMAP carry | Read product guide and ATBD | 9 km posting from a 36 km footprint, top 5 cm, 9 km cells not independent | documented | NSIDC user guide |
| E-06 | How current is ECOSTRESS | CMR granule query for ECO_L3T_JET | Newest granule 2026-10-28, at least 13 days behind | measured | cmr.earthdata.nasa.gov |
| E-07 | Does the GPM Final product still deliver | Read the transition notices and query the product | V07 Final record ended 2025-09-30, V08 Final projected autumn 2026 | documented | NASA GPM news |
| E-08 | Is there a Brazilian soil survey at US quality | Read the PronaSolos summary and T2 source pack | Less than 5 percent of Brazil mapped at 1:100,000 or finer in 2022, no SSURGO equivalent | documented | gov.br PronaSolos |
| E-09 | Does the Atlas site carry a scoring or submission flow | Crawled 22 public URLs logged-out | 22 pages, no scoreboard, six ranked dataset cards, a live CMR widget | measured | spacedata.swapniltamse.com |
| E-10 | Do cited links survive | `curl` on six replacement URLs after the verification pass | 6 of 6 HTTP 200 | measured | See the dossier provenance |
| E-11 | Do the crops the challenge names have a rotation literature | Paper search on Semantic Scholar, OpenAlex and Crossref | Returns results, no key needed, no access wall | measured | Api endpoints |
