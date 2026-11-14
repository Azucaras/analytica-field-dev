---
title: "2.5 GRACE, SRTM, GEDI and POWER: trend, terrain, biomass and climate envelope"
description: "A map that aligns GRACE, SRTM, GEDI, and POWER layers does not make them equivalent measurements."
checked: 2026-11-10
---

A map that aligns GRACE, SRTM, GEDI, and POWER layers does not make them equivalent measurements. The [GRACE and GRACE Follow On mascon handbook (read, handbook dated 2021-05-10)](https://earthdata.nasa.gov/s3fs-public/2025-12/GRACE-FO_L3_Handbook_JPL.pdf) explains that satellite ranging senses gravity changes used to infer broad mass change. Native 3 degree equal area mascons span roughly 300 to 330 km (documented), while the 0.5 degree cells are oversampled posting (documented). Monthly anomalies combine soil water, snow, surface water, groundwater, and ice relative to the 2004.0 to 2009.999 mean (documented), not absolute storage. Leakage and groundwater separation assumptions limit attribution. GRACE can inform a multi year basin or aquifer trend, but cannot show whether a farm or municipality gained water because of a rotation.

SRTM contributes a different kind of context: elevation derived from a single C band radar mission in February 2000 (documented). The [SRTM user guide (read, revised 2015-10)](https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf) gives about 30 m posting (documented). Radar phase reflects a scattering phase center, which can lie within a forest canopy rather than at bare ground. SRTM can help screen slope, terrain, and potential drainage pathways. It has no repeat record, so it cannot describe erosion, terracing, drainage changes, or land leveling after 2000. A static elevation layer is a terrain covariate, not current field condition.

GEDI samples canopy and ground structure with lidar along tracks. The [GEDI L4B guide (read, revision 2023-10-29)](https://data.ornldaac.earthdata.nasa.gov/public/gedi/GEDI_L4B_Gridded_Biomass_V2_1/comp/GEDI_L4B_Gridded_Biomass_V2_1.pdf) describes its 1 km aboveground biomass grid as modeled from sparse lidar sampling (documented), not wall to wall observation. The record spans 2019-04-18 to 2023-03-16 (documented). Track gaps can leave cells inadequately sampled, and the forest trained biomass model does not transfer automatically to annual crops. GEDI can flag historical forest or clearing context, not annual crop biomass or soil carbon change.

NASA POWER supplies broad daily climate context, not a direct instrument observation at a farm. The [POWER daily API documentation (read, checked 2026-11-10)](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) describes daily gridded values based on model and reanalysis meteorology and satellite related solar inputs. The daily API uses a grid of about 0.5 degree (documented); documentation conflicts about hydrology dimensions, giving 0.5 by 0.5 degree in one place and one half by five eighths degree in another (documented). Do not silently resolve that discrepancy. POWER can help characterize a broad climate envelope, growing degree days, frost free period, and long term water deficit context. It cannot supply a farm's observed rainfall, soil water, or complete water balance for a specific day.

SMAP L4 root-zone moisture is a model state, not an observation. The [SMAP L4 guide (read, 2025-04)](https://nsidc.org/sites/default/files/documents/user-guide/multi_spl4smau-v008-userguide.pdf) defines a 0 to 100 cm average on a 9 km grid (documented). A Catchment land model uses assimilated brightness temperatures and precipitation forcing; SMAP does not sense root zone moisture. During SMAP outages, L4 continues as model only output. ECOSTRESS LST, by contrast, is retrieved radiometric surface temperature, while its JET ET and ESI are modeled products. Label these outputs by evidence type, not just by grid.

**Figure S2-F5. Evidence and scale ladder (documented).**

| Layer | Support and evidence type |
|---|---|
| GRACE | Native mascon about 300 to 330 km (documented), monthly total mass anomaly |
| POWER | About 0.5 degree daily context grid (documented), model and reanalysis |
| GEDI L4B | 1 km (documented), modeled biomass from sampled lidar |
| SRTM | About 30 m posting (documented), static 2000 radar derived elevation |
| SMAP L4 | 9 km posting, modeled 0 to 100 cm state, not a root zone observation (documented) |

**Decision it can inform.** Use GRACE only as large basin or aquifer trend context; SRTM for terrain screening; GEDI for historical forest safeguards; POWER for broad climate feasibility; and SMAP L4, if shown, as an explicitly modeled root zone state. Choose each only for its scale and evidence type.

**Decision it only illustrates.** These layers cannot establish a field's root zone water, current drainage, annual crop biomass, soil carbon gain, yield, or rotation caused basin change. Pixel alignment cannot harmonize physical support, dates, or uncertainty. Pair the layers with local measurements and management records before making farm level recommendations.
