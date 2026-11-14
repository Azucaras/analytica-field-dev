---
title: "3.4 Licence, privacy and the join problem down to 30 m"
description: "Intersecting non-NASA layers with a 30 m satellite grid is often easy to compute."
checked: 2026-11-10
---

Intersecting non-NASA layers with a 30 m satellite grid is often easy to compute. The harder work is preserving what each input actually supports and what its terms allow. Alignment is not evidence of equal resolution, validation or permission to redistribute a composite map.

A join should treat each value as a typed claim with its own source, geographic support, vintage, evidence class, aggregation and transformation history. Repeated [gSSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/gridded-soil-survey-geographic-gssurgo-database) (read) cells carry map-unit keys, not separate soil measurements. A broad Brazilian polygon or a 90 m modeled attribute remains broad or modeled when sampled onto 30 m cells. Upsampling can be useful for display or spatial lookup, but it cannot create missing observations. The output should preserve the native support and label the resulting value accordingly. Map-unit summaries need an explicit component-weighted rule and relevant depth; county statistics should remain county context, not be copied into cells as field measurements.

The sources also carry different reuse terms. USDA describes much of its public information as public domain, and [CDL](https://www.nass.usda.gov/Research_and_Science/Cropland/sarsfaqs2.php) (read) permits free redistribution with an as-is warranty limitation. [Embrapa GeoInfo](https://geoinfo.dados.embrapa.br/geoserver/ows?service=WFS&version=2.0.0&request=GetCapabilities) (read) carries CC BY-NC 3.0 BR terms, while [BDsolos/Redape](https://www.bdsolos.cnptia.embrapa.br/consulta_publica.html) (read) carries CC BY-NC 4.0. Those non-commercial restrictions are a design constraint for a commercial app, including adapted layers, unless separate permission is obtained. [MapBiomas](https://brasil.mapbiomas.org/iniciativas-e-produtos/cobertura-e-uso-da-terra/cobertura-30m/cobertura/) (read) uses CC BY-SA, so adapting or redistributing a derivative can trigger share-alike obligations. [CONAB historical prices](https://portaldeinformacoes.conab.gov.br/precos-agropecuarios-serie-historica.html) (read) permit reproduction only for non-commercial purposes. The [SGB 90 m service](https://geoportal.sgb.gov.br/server/rest/services/pronasolos/solos_90m/MapServer) (read) exposes no licence field, and the checked [IBGE](https://www.ibge.gov.br/geociencias/informacoes-ambientais/pedologia/10871-pedologia.html) (read) and INPE pages did not state explicit dataset-level licences. Public visibility is not a blanket commercial reuse grant. Confirm unclear terms with the steward before embedding, exporting or selling derived layers.

[CAR geometry](https://consultapublica.car.gov.br/publico/imoveis/index) (read) adds privacy and validation risk beyond ordinary map attribution. It is self-declared property information subject to state review, not cadastral truth. No federal bulk API or blanket redistribution permission was verified, and automated access to the consultation portal was denied. Do not promise a complete national field-boundary layer or expose sensitive geometry merely because a portal allows public consultation. Use only where the purpose is justified, the provenance is visible and access and reuse conditions have been reviewed.

**Figure S3-F4. 30 m join provenance and rights matrix (documented).**

| Input | Native support | Join rule | Reuse or privacy flag |
|---|---|---|---|
| gSSURGO | Map-unit keys in 10/30 m grids | Preserve components and survey provenance | Public-domain policy, cite source |
| PronaSolos | 90 m modeled attributes | Retain model support and uncertainty | Licence not confirmed |
| MapBiomas | 30 m classified land cover | Preserve collection and class | CC BY-SA obligations |
| CAR | Self-declared property polygons | Validate, restrict sensitive geometry | Bulk rights unverified |

A practical ingest priority keeps the no-account path small and honest.

| Priority | Inputs | Rule |
|---|---|---|
| Keep, minimum public path | Farmer-selected field boundary with version and provenance; field-season crop history with explicit unknown state; field-scoped constraints with provenance and unknown states; public no-login NASA POWER context for a stated period. | These inputs support a transparent, user-correctable demo. POWER is broad context only. Missing or unconfirmed field facts remain unknown; do not claim a data-backed rotation ranking from this set. |
| Optional | HLS after local crop or cover classifier validation; SMAP, IMERG, ECOSTRESS, soil survey, and other product layers when access, temporal fit, QA, support, and licence checks pass. | Add only for a defined comparison question and retain source support and limits. Earthdata Login products remain credential-gated. |
| Drop from the minimum path | GRACE, GEDI, SRTM, MODIS, county aggregates, CAR geometry, and unverified commercial or private contract records. | Do not ingest merely to increase layer count. Reconsider only if a scoped use case, permissions, and validation justify them. |

This is the minimum input set for a public no-account path, not a claim that the set can establish field-level agronomic benefit. Keep field and season identity, farmer-entered constraints, source provenance, and unknown states as first-class records. NASA layers are optional context until their product-specific support and validation fit the decision. For privacy and reuse, store or expose a sensitive local record only when its purpose, provenance, access, and licence are reviewed.

A 30 m product can overlay original-resolution layers for navigation while avoiding false precision. The map, SQL agent, voice response and export should carry the same source, vintage, scale or native resolution, uncertainty, licence and privacy flags. For unclear or non-commercial terms, block commercial reuse pending confirmation; for share-alike data, preserve obligations through derivatives. T2 is not legal advice and does not determine permission for a particular product. It also does not establish a complete national field-boundary layer. Treat the grid as a common display target, never as a license or a source of finer evidence.
