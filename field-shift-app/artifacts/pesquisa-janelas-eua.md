# United States planting windows: what works, what does not, and what block 4 and block 7 need

Task t_99585369, data-scientist. Read only on every existing artifact, spec and source file. 42 probes recorded in `data-probe-us-windows.json`, all issued from this host on 2026-11-14. The pilot is Cass County, North Dakota, FIPS 38017; the window source is per state, so the pilot window is the North Dakota window.

## 1. Answer

A United States planting window exists, keyless, and it is good enough to draw the band.

- The working source is **NASS, North Dakota Agricultural Statistics 2025, page 20, "Usual Planting and Harvesting Dates by Crop - North Dakota: 20-Year Average"**. One PDF, no login, 15,890,054 bytes, sha256 `688b2db2039c7300538b0bfaaf02c754e615795d9fa372bd7a478cd3c22cbda6`. It gives a begin date, a most active range and an end date of planting for 15 crops, at the state and crop grain, from 20 years of historical crop progress estimates.
- Corn: April 26 to June 4. Soybeans: May 7 to June 11. Spring wheat: April 16 to June 3. **Canola: no row exists**, so the snapshot is empty for canola and section 5 says why.
- **The RMA Actuarial Data Master (candidate 1) produced no plantable window.** The bulk files sit on `ftp.rma.usda.gov` and that host does not answer this network on 443 or 21. The public Actuarial Information Browser does answer and does enumerate its own vocabulary, but the Commodity Report it submits to never rendered its `Dates` tab for Corn, North Dakota, Cass, so no date was read from it.
- **NASS Crop Progress (candidate 2) works keylessly as an observed series** and is used here as a cross check on the bulletin, not as the window itself.
- **Handbook 628 (candidate 3)** is the same table family. The 1997 edition is readable from a university mirror and is used as a second cross check. The 2010 edition's NASS URL now returns 404 and the archive copy was rate limited.
- **NDSU extension (candidate 4)** gives prose guidance with no table and no county dimension. It is a cross check on the legal dates only, and it is secondary.
- **The challenge's own resource list (candidate 5) carries no planting windows.** Its named inputs are SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE and GRACE-FO, and SRTM, and every one is a reflectance, soil moisture, rainfall, temperature, elevation or biomass product.

This is an **observed** window, not a legal one. ZARC's window is a ministerial act (a portaria). The United States window here is a 20 year average of survey based progress. It is defensible, it is citable, and it is a different kind of object. Section 9 records what that difference costs.

## 2. Probe inventory

| Group | Addresses probed | Result |
|---|---|---|
| RMA ADM and the RMA dates app | 16 | 1 works (a web service), 4 reachable but no window, 2 reachable with the data behind an unreachable host, 1 reference only, 1 empty result, 2 http errors, 5 no response |
| NASS | 14 | 7 works, 2 reachable but no window, 4 rate limited, 1 http error |
| NDSU extension | 4 | 3 reachable, prose only, 1 http error (403) |
| CDL and CSB | 6 | 2 works, 2 reachable but no window, 1 http error, 1 no response |
| Challenge page | 2 | 2 no response |

Verdict counts over the 42 recorded probes: works 10, works but no window 11, no response 8, http error 5, reachable but the next hop is blocked 2, rate limited 4, reference only 1, empty result 1.

## 3. The sources that worked

### 3.1 NASS North Dakota Agricultural Statistics 2025 (the window source)

Access path, exactly:

```
https://www.nass.usda.gov/sites/default/files/Statistics_by_State/North_Dakota/Publications/Annual_Statistical_Bulletin/2025/ND-Annual-Bulletin25.pdf
```

- HTTP 200, `application/pdf`, 15,890,054 bytes, 146 pages, sha256 `688b2db2039c7300538b0bfaaf02c754e615795d9fa372bd7a478cd3c22cbda6`.
- The table is on PDF page 22, printed page 20, headed `Usual Planting and Harvesting Dates by Crop - North Dakota: 20-Year Average`, signed `USDA, National Agricultural Statistics Service, North Dakota Field Office, August 2025`.
- The editions are enumerable from `https://www.nass.usda.gov/Statistics_by_State/North_Dakota/Publications/Annual_Statistical_Bulletin/index.php` (HTTP 200, 39,548 bytes), which lists 2025, 2024, 2023 and 2022. The 2025 edition is the one used.
- The table note states the basis: "The dates shown indicate the periods in which the crops are planted and harvested in most years based on 20 years of historical crop progress estimates."
- The meaning of begin and end comes from the introduction of the same handbook family: "Beginning dates indicate when planting or harvesting is about 5 percent complete and ending dates when operations are about 95 percent complete" (Agricultural Handbook 628, 1997 edition, read here). The 2025 bulletin does not restate the percentages; it restates only the 20 year basis. The most active range is printed without a percentage definition in this bulletin.
- Grain: **per state and per crop.** One row per crop, no practice dimension (no rainfed versus irrigated split) and no season dimension. The 20 year average is one number per column, so the source cannot say which year a date belongs to.
- Resolution: state. Cass County draws the North Dakota row. The document family gives one PDF per state's annual bulletin, so another state means another bulletin URL, the same table, the same shape.

Licence and attribution. NASS statistical publications are works of the United States Government and are not subject to copyright in the United States. The project's own licence note (dossier section 3.4) records that USDA describes much of its public information as public domain. The credit string I recommend for the app, in the shape block 5 already uses for public domain data:

```
USDA National Agricultural Statistics Service, North Dakota Agricultural Statistics 2025, page 20, public domain
```

### 3.2 NASS Crop Progress weekly releases (the observed series, cross check only)

Access path, exactly:

```
https://release.nass.usda.gov/reports/prog{issue:02d}{yy:02d}.txt
```

- Issue 17 of 2026 is `prog1726.txt`, HTTP 200, `application/octet-stream`, 51,595 bytes, released 2026-04-27.
- The publication page at `https://esmis.nal.usda.gov/concern/publications/8336h188j` (HTTP 200, 63,338 bytes) enumerates every weekly release as `.txt`, `.zip` and `.pdf` under `/sites/default/release-files/`, for example `https://esmis.nal.usda.gov/sites/default/release-files/796051/prog3626.txt` (HTTP 200, 70,888 bytes, released 2026-09-08).
- No key. The QuickStats API is a different product and is still gated: `https://quickstats.nass.usda.gov/api/api_GET/` returned **401** with a 26 byte body, which confirms the earlier card's record without reusing it.
- Grain: **per state, per crop, per week.** Each table is a "Selected States" table; North Dakota is one row. The first value column is the week just ended.
- Resolution: state, and weekly in time, which is what makes it useful as a check on a state level window.

Licence and attribution: same as 3.1, United States Government work.

### 3.3 CDL raster attribute table and Crop Sequence Boundaries (read for the join only)

- `https://pdi.scinet.usda.gov/image/rest/services/CDL_WM/ImageServer/rasterAttributeTable?f=json`, HTTP 200, 38,504 bytes, sha256 `8b5cec2ff965a2d1f7f1205111b3a0fbe3cce5ed82cb0ef6a446ae304fe0b699`, 256 rows. **This hash equals the one block 5 R-17 already records**, so the join table below is generated from the same bytes the class table is generated from.
- `https://pdi.scinet.usda.gov/hosting/rest/services/Hosted/Crop_Sequence_Boundaries_2025/FeatureServer/0/query` for the pilot box, HTTP 200, 20,664 bytes, sha256 `561d86b48f2d1be7c2a70c58ebd97dc981b5fcb85fded6e092efe3d5e2626da8`, **107 features**, which matches block 5's recorded measurement.
- These carry no window. They are here because the operator's question 4 needs the join, and because the field's own crop history comes from them.
- Licence and attribution: both are public domain, and block 5 already fixed the credit string as `Crop Sequence Boundaries (USDA NASS and ERS), public domain; CDL (USDA NASS), public domain`. The CDL FAQ adds the warranty limitation verbatim: "The CDL is provided 'as is' and the USDA NASS does not warrant results you may obtain using the Cropland Data Layer."

## 4. The sources that did not work

### 4.1 RMA Actuarial Data Master, candidate 1

This was the right first candidate and it failed on access, not on content.

| Address | Result |
|---|---|
| `https://ftp.rma.usda.gov/References/Actuarial_Data_Master/2027/` | no response. DNS gives 165.221.68.98; 443 times out after 25 s |
| `http://ftp.rma.usda.gov/References/Actuarial_Data_Master/2027/` | no response, port 21 also times out |
| `https://www.rma.usda.gov/policy-procedure/bulletins-memos/actuarial-release/actuarial-release-26-044` | 200, 87,117 bytes. Names the directory and the file set (`2027_ADM_Filing_0630.zip`, `A00200_Date_Filing.txt`) |
| `https://www.rma.usda.gov/` | 200, 79,951 bytes. The site is not blocked as a whole, only its data host |
| `https://public-rma.fpac.usda.gov/apps/mapviewer/dates` | 200, 8,489 bytes, but a shell: its script points at `https://pdgis.rm.usda.net/arcgis/rest/services/Dates/2021_Dates_Program/MapServer/0` |
| `https://pdgis.rm.usda.net/...` | no response, the host does not resolve outside the USDA network |
| `https://public-rma.fpac.usda.gov/api/` | 403, 1,233 bytes |
| `https://gis.rma.usda.gov/arcgis/rest/services?f=pjson` | no response |
| `https://aib.rma.usda.gov/` | no response |
| `https://aibpf-rma.fpac.usda.gov/apps/ActuarialInformationBrowser/CropCriteria.aspx` | 200, 18,851 bytes. The form works |
| its `GetReInsuranceValues` method | 200, 655 bytes, returns 2027 back to 2011 |
| its `LoadDropDownBasedOnSelection` method | 200, 179 bytes with every list null. The enumeration needs an ASP.NET session, so it is not reproducible by a bare request |
| `https://catalog.data.gov/api/3/action/package_search` | 404, 36 bytes. No mirror of the ADM found there |
| ArcGIS Online search for an RMA date layer | 200, 58 bytes, empty result |

What the AIB did give, and what it did not. Driving the form in a browser, the cascade enumerates: 97 commodities for reinsurance year 2027 (`Corn (0041)`, `Canola (0015)`, `Barley (0091)` and so on, verbatim with the code in parentheses), 5 insurance plans, 12 states for corn, and 53 North Dakota counties (`Cass (017)`). Submitting the criteria opens a Commodity Report whose tabs are `Types / Practices`, `Unit Structure`, `Margins and Yields`, **`Dates`**, `Rates`, `Subsidy Factors`, `Special Provisions`, `Links`. The `Dates` tab is exactly the object ZARC's portarias are, per county and per practice. It stayed empty: the report viewer rendered 0 characters on three attempts, with two different plans and with `All Grid ID's` selected. I did not get a session error I could read, and I did not pursue it further because a source that cannot render its report cannot carry the band.

Cost of the gate: none. The blocker is network reach and a viewer that would not build, not a login or a paid key. No credential was used anywhere in this card.

### 4.2 The rest

- **QuickStats** returns 401 without a key, as recorded.
- **Handbook 628, 2010 edition**: the NASS URL `https://www.nass.usda.gov/Publications/Todays_Reports/reports/fcdate10.pdf` now returns 404 with a 36 byte error body, after a first attempt that saved that error page under a `.pdf` name and produced only PDF parse errors. The Wayback availability API confirms a 200 snapshot exists at `http://web.archive.org/web/20260922102938/...`, but both body attempts returned **429** after a 45 second pause. So the 2010 text is citable by its archive URL and its content was **not** read here.
- **Handbook 628, 1997 edition**: same archive treatment (429), but the mirror `https://swat.tamu.edu/media/90113/crops-typicalplanting-harvestingdates-by-states.pdf` answers, 200, 451,925 bytes, sha256 `f5db3e2966f998d3d11dd8760f751854f19c34424dc010cf473ea02dfe87d4cb`. Read as a cross check, not as the source.
- **NDSU**: the extension pages that answered (21,168 and 21,678 and 34,768 bytes) give planting guidance in prose and restate the RMA final planting dates. `https://www.ndsu.edu/agriculture/extension/publications/basics-corn-production-north-dakota` returns **403** to a scripted request.
- **Challenge page**: `https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data` returns no response on either host, and the extraction service that did reach it returned only a third party redirect notice. The resource list is therefore quoted from the project dossier, which captured the challenge text on 2026-11-10: SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE and GRACE-FO, SRTM or other NASA elevation products, plus "local soil information, crop characteristics". None of them is a planting window, a planting date or a progress series.

## 5. The snapshot: `us-windows-cass-nd.json`

One row per crop and season, 4,194 bytes, sha256 `d1ce9645962a635a6e3c2ea11f0c5ec734d52ed281ee496c6316a87ff0888faa`.

| Crop | Source string, verbatim | Window start | Window end | Most active | CDL | Trace |
|---|---|---|---|---|---|---|
| Corn | `Corn for grain` | `04-26` (April 26) | `06-04` (June 4) | May 2 to May 28 | 1 | page 20, columns `(begin)` and `(end)` |
| Soybeans | `Soybeans` | `05-07` (May 7) | `06-11` (June 11) | May 14 to June 3 | 5 | page 20, columns `(begin)` and `(end)` |
| Spring wheat | `Wheat, spring` | `04-16` (April 16) | `06-03` (June 3) | April 24 to May 25 | 23 | page 20, columns `(begin)` and `(end)` |
| Canola | none | empty | empty | empty | 31 | no row exists |

Every value traces to one cell a reviewer can check by hand: open the PDF at page 20, find the row whose label is the `crop_source_string`, read the `(begin)` column into `window_start_text` and the `(end)` column into `window_end_text`. The JSON keeps both the printed text and the `MM-DD` form, plus the row label, the table title, the PDF page, the printed page and the sha256 of the whole PDF.

**Canola is empty and that is the honest answer.** The North Dakota table prints 15 crop rows, in this order and with these exact strings:

```
Wheat, spring / Wheat, Durum / Wheat, winter / Barley / Oats / Sunflower / Soybeans /
Flaxseed / Corn for grain / Corn for silage / Beans, dry edible / Potatoes / Sugarbeets /
Hay, alfalfa / Hay, other
```

Canola is not one of them, and the national Crop Progress release has no canola table either: `prog1726.txt` names 21 tables and canola appears once, in a list of the statistician's commodity assignments. So there is no window for canola anywhere in this path, and the snapshot says so per crop rather than borrowing one from a neighbouring crop or from an agronomy rule of thumb.

### Reproducing it

`build-us-windows-cass-nd.py` sits beside the snapshot and rebuilds it byte for byte. It hashes both inputs before parsing and refuses to run if either hash differs, so a new bulletin edition or a new CDL release fails loudly instead of silently rewriting the window.

```
python3 build-us-windows-cass-nd.py --fetch --out us-windows-cass-nd.json
```

Run from an empty directory this downloads 15,890,054 bytes of bulletin and 38,504 bytes of RAT, prints `table page 22 (printed 20)`, and writes a file whose sha256 is `d1ce9645962a635a6e3c2ea11f0c5ec734d52ed281ee496c6316a87ff0888faa`, identical to the one in `artifacts/`. Verified by running it in a clean scratch directory on 2026-11-14 and diffing against the artifact: no difference.

## 6. Cross check against observed weekly progress

Method. 78 Crop Progress weekly releases, issues 12 to 32 of 2023 to 2026, all HTTP 200, 4,892,812 bytes in total, fetched from the release server. For each year and crop, the North Dakota row of the `Corn Planted`, `Soybeans Planted` and `Spring Wheat Planted` tables, first value column only. A dash is treated as "not published" and never as a zero, because reading the next column instead moves the previous year's value into the current week (in 2024 the uncorrected parse put the 5 percent crossing on April 29 when the file published no current value that week). The date reported is the week ending, which is the release date minus one day.

First week ending at or above 5 percent, against the bulletin's begin:

| Crop | Bulletin begin | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|
| Corn | April 26 | May 21 | May 19 | April 27 | April 26 |
| Soybeans | May 7 | May 21 | May 19 | May 11 | May 3 |
| Spring wheat | April 16 | April 30 | April 28 | April 20 | April 19 |

First week ending at or above 95 percent, against the bulletin's end:

| Crop | Bulletin end | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|
| Corn | June 4 | not reached, series ends at 77 | June 9 | not reached, ends at 92 | not reached, ends at 94 |
| Soybeans | June 11 | not reached, ends at 70 | June 16 | June 22 | June 14 |
| Spring wheat | June 3 | not reached, ends at 89 | June 9 | not reached, ends at 90 | June 7 |

What this supports and what it does not.

- The begin edge is **broadly consistent**: eleven of the twelve observed crossings fall at or after the bulletin's begin. In the two normal springs (2025, 2026) they sit within one day for corn, and within three to four days either side for soybeans and spring wheat. The one exception is soybeans in 2026, which crossed 5 percent on May 3, four days before the bulletin's begin of May 7. That is what a 5 percent floor over 20 years should look like, with one year landing just outside it.
- The begin edge is **not tight in late years**: 2023 and 2024 began twelve days (soybeans, spring wheat) to twenty five days (corn) later. A 20 year average is meant to absorb that, and the band should be read as the middle of a distribution, not as a date a producer can count on.
- The end edge is **not corroborated**. In every year where the 95 percent crossing was observable, it lands three to eleven days after the bulletin's end. Three of the four corn series and two of the four spring wheat series stop before 95 percent is published, so the crossing is unknown rather than early. I report that as a failed check, not as agreement.

## 7. Crop vocabulary, grain, enumeration and the join to CDL

This section answers the operator's five questions for every source that works.

### 7.1 NASS North Dakota bulletin, the window source

1. **Vocabulary, verbatim.** 15 strings, listed in section 5 exactly as printed, including the inversion `Wheat, spring` rather than `Spring wheat`, the lowercase `Corn for grain` and `Corn for silage` split, and `Beans, dry edible` with its comma. There are no plurals to normalise and no translation is applied anywhere in the snapshot.
2. **Grain.** Per state and per crop. North Dakota only in this document, one row per crop, no practice and no season dimension.
3. **Enumerable without downloading every record?** No query interface exists. The only way to enumerate is to parse one table on page 20 of the PDF. The request is the PDF URL and the byte count is **15,890,054**; parsing it yields **15 crop rows**, 13 of which carry dates (the two hay rows print `(NA)`). A per crop subset cannot be requested; the whole document comes down.
4. **Join to the Crop Sequence Boundary sequence.** It needs a mapping table, because the source uses names and the parcels use CDL codes. Measured, with the CDL code beside each name, both read from the CDL raster attribute table whose sha256 block 5 already records:

| Window source string | CDL code | CDL name (RAT spelling) |
|---|---|---|
| `Corn for grain` | 1 | Corn |
| `Soybeans` | 5 | Soybeans |
| `Wheat, spring` | 23 | Spring Wheat |
| `Wheat, Durum` | 22 | Durum Wheat |
| `Wheat, winter` | 24 | Winter Wheat |
| `Barley` | 21 | Barley |
| `Oats` | 28 | Oats |
| `Sunflower` | 6 | Sunflower |
| `Flaxseed` | 32 | Flaxseed |
| `Beans, dry edible` | 42 | Dry Beans |
| `Sugarbeets` | 41 | Sugarbeets |
| `Hay, alfalfa` | 36 | Alfalfa |
| no window row | 31 | Canola |

   Two rows in this table need care and I flag them rather than smooth them. `Corn for grain` and `Corn for silage` both collapse onto CDL 1 `Corn`, because the CDL has no silage class, so a join on corn cannot tell the two apart. `Hay, alfalfa` joins to CDL 36 `Alfalfa`, but the CDL also carries a general hay class that this table does not name, so the alfalfa join is the only defensible one of the two hay rows.
5. **Does the best source have a vocabulary?** Yes, and it is the one above. The cost of that vocabulary is canola: CDL code 31 exists in the parcels, the window source has no canola row, so a canola field is offered by its own history and the calendar has nothing to draw for it.

### 7.2 NASS Crop Progress weekly, the observed series

1. **Vocabulary, verbatim.** The strings are statistic names, not crop names: `Corn Planted`, `Corn Emerged`, `Soybeans Planted`, `Soybeans Emerged`, `Cotton Planted`, `Sorghum Planted`, `Rice Planted`, `Rice Emerged`, `Peanuts Planted`, `Sugarbeets Planted`, `Oats Planted`, `Oats Emerged`, `Winter Wheat Headed`, `Winter Wheat Condition`, `Spring Wheat Planted`, `Spring Wheat Emerged`, `Barley Planted`, `Barley Emerged`, `Days Suitable for Fieldwork`, `Topsoil Moisture Condition`, `Subsoil Moisture Condition`. That is all 21 table titles in `prog1726.txt`, in the order they appear. The crop name is the substring before the stage; there is no bare crop list. No canola table exists.
2. **Grain.** Per state, per crop and stage, per week.
3. **Enumerable?** Yes, cheaply: one weekly file enumerates the whole vocabulary for that week. Request `https://release.nass.usda.gov/reports/prog1726.txt`, **51,595 bytes**, 21 table titles.
4. **Join.** The same mapping table as 7.1 applies, matched on the part before the stage, so `Spring Wheat Planted` reads CDL 23 through the `Wheat, spring` row. The stage suffix has no CDL meaning.
5. This source carries no window of its own, so it obliges nothing of block 7.

### 7.3 RMA, which did not produce a window

The vocabulary exists and is enumerated by the form: 97 commodities for reinsurance year 2027 with the code in parentheses, verbatim `Corn (0041)`, `Canola (0015)`, `Barley (0091)`, `Soybeans` among them, plus 53 North Dakota counties with their county codes. The grain is per county, per commodity, per insurance plan and per practice, which is finer than anything NASS publishes. But no window came out of it, so it is recorded and not used, and I record the enumeration as a DOM observation rather than as a reproducible request, because the bare web service call returns every list null without a session.

## 8. Integration note for the orchestrator

Neither spec was edited. This is what to change.

### Block 4 R-31, the season band

R-31 currently promises one source, Brazil, and prints `No planting window source for this region` for the United States. It must be given a second source with these properties:

1. **A second source entry for the region `US`.** One file, `artifacts/us-windows-cass-nd.json`, read the way the Brazil snapshot is read, with its own sha256 pinned in the test (`d1ce9645962a635a6e3c2ea11f0c5ec734d52ed281ee496c6316a87ff0888faa`), in the same style as AC-25 branch (e) pins `b53c8a7b...`.
2. **A row shape of `crop`, `window_start_md`, `window_end_md`, `crop_source_string`, `cdl_code`, and a nullable window.** The band reads the start and end as `MM-DD`, not as full dates.
3. **No season keys in the source.** R-31's normalisation from the derived `Y/YY` label to a `Y/YYYY` key must not be applied to this source: the file holds `"season_dimension": "none"` and every row says `"season": "annual"`. A region whose source has no season keys must draw the same two dates for every derived season rather than print the empty text, which is the opposite of the rule R-31 writes today for a keyless region. This is the one place where the current R-31 wording would produce the wrong behaviour if the file were plugged in unchanged.
4. **A year resolution rule.** The band draws a window across a season, so it must resolve `MM-DD` to a concrete date. For the northern plains the planting months fall in the calendar year after the season opens on 1 July, so a chosen date of 2026-11-12 (derived season `2026/27`) should draw 2027-04-26 to 2027-06-04. That rule belongs to the United States source, exactly as the `Y/YYYY` normalisation belongs to Brazil.
5. **Three distinct empty states, not one.** `No planting window source for this region` must stay for a region with no source at all. A row that exists with a null window (canola today) needs the crop level text block 7 already defines, `No planting window data for {crop}`. Collapsing the two would tell a canola field that its region has no source when the region has one and the crop does not.
6. **The band draws `window_start_md` to `window_end_md`, not the most active range.** The most active range is in the file for the calendar, not for the band.

One thing block 4 must not claim: this window is state level. Every North Dakota field draws the same band. Cass County and a field in Bowman County are indistinguishable, and the extension sources show the legal dates really do vary by county (in the NDSU summary of the RMA dates, a 2020 release and a secondary source, corn's final planting date is May 25 statewide except Cass, Ransom, Richland and Sargent, which are May 31).

### Block 7's planting calendar

1. **Row keys.** One row per crop with `crop_source_string` exactly as the source returned it, `window_start_md`, `window_end_md`, and the season resolved to a concrete year by the same rule as R-31 item 4.
2. **The crop list for a United States field** is the union of two things, as the user decided: the crops the region's window source returns for the field and the season, and the crops the field's own CDL history carries. For the pilot box that union is real and measured. The window source offers 15 crops; the 107 pilot parcels carry, across 2018 to 2025, CDL 5 `Soybeans` (333 field-years), 1 `Corn` (306), 41 `Sugarbeets` (92), 23 `Spring Wheat` (49), 61 `Fallow/Idle Cropland` (31), 36 `Alfalfa` (19), 21 `Barley` (9), 6 `Sunflower` (6), 42 `Dry Beans` (5), 121 `Developed/Open Space` (5) and 176 `Grassland/Pasture` (1).
3. **Two exclusions the union needs.** CDL 61, 121 and 176 are not crops and must not enter the form as crop options. CDL 31 `Canola` is a crop but has no window, so it is offered by history and the calendar abstains for it with the crop level text.
4. **No season key in the calendar either.** The source is a 20 year average, so the calendar shows the same window whichever season is selected. If block 7 wants a season specific calendar later, it needs a season specific source (Crop Progress by year), not a reinterpretation of this file.

## 9. Limits

1. **This is an observed window, not a legal one.** ZARC's window is a portaria and carries an administrative obligation. This one is the middle of 20 years of survey based progress. Nothing in the United States path produced a legal planting date, so if the product needs the legal object, the RMA Date table (or the Actuarial Information Browser) still has to be opened, and that is a network problem, not a licence problem.
2. **State resolution only.** Cass County cannot be distinguished from the rest of North Dakota. The county variation that does exist in the legal dates is documented in the extension source and is not expressed anywhere in this snapshot.
3. **The 20 year average hides the spread.** Section 6 shows two of four observed years beginning twelve to twenty five days after the bulletin's begin.
4. **The end of the window is the weakest number.** Three corn years and two spring wheat years never published a 95 percent value, and every observable soybean crossing was later than the bulletin's end.
5. **Two documents I cite were not opened.** The 2010 edition of Handbook 628 was rate limited (429 on two attempts), and the AIB's Dates tab never rendered. Anything attributed to the 15 to 85 percent most active definition is therefore unverified in this card, and the snapshot says so in `window_definition`.
6. **The bulletin is a 2025 publication with a 20 year basis**, so its average window cannot have moved much since 2005, but I did not measure how the 2024 edition differs.
7. **The pilot parcels' crop history** is taken from one CSB query for the pilot box, and the code counts above are field-years, not areas. No area weighting was applied.
