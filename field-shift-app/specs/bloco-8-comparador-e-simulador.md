# Spec: Block 8, rotation comparator and rain and temperature simulator

Status: frozen on 2026-11-15 as revision 1. Not approved. The user has not approved this block and has not asked for it to be built, so the card stops at the frozen spec and requests review. No criterion below has been run: this is a document. Every AC is `not verified` until the build card that measures it reports a pass with its named artifact.

This block has two parts. The rotation comparator ranks the rotation scenarios of one field on four criteria with integer weights. The rain and temperature simulator applies two scenario controls to block 6's recorded climate series and prints the measured and simulated numbers side by side, with every simulated number marked. Neither part forecasts, calibrates or validates anything. Both print arithmetic on recorded or declared values.

## Inherits

Each inherited digest below was reproduced on 2026-11-15 with the recipe that the inherited block itself records. The inputs are the revisions frozen in the tree, not the revisions named on the card (see the first two items).

- Block 6 revision 2, `field-shift-app/specs/bloco-6-numeros-por-poligono.md`, commit `58673a8`, 642 lines, raw sha256 `83f855ad47bf1d748973296f224bf88d2e76ce7e4f75810f904ac14c0c3897b4`, freeze digest `0d10c71fbe74519f3a801dcdc9eb475a8a53b1fbbfd23c52d8263880fbb7088e`. Reproduced with block 6's own recipe, which has no `g` flag. This block reads the `numbers.rain_percentile` row, the climate series, `water_balance.out` and block 6 R-51.
- Block 7 revision 9, `field-shift-app/specs/bloco-7-decisao-e-produtor.md`, commit `077e53e`, raw sha256 `b75651fd14e75bcfdea14cdd3b40f4da33ccda4de2f95c723efb66320b57e27b`, freeze digest `0f1eb9b29822d83b2030a0c500916123c3a72e98c0c46d80bab856a71467ea22`. Reproduced with block 7's `g` recipe. The card asked for revision 2 and its comment asked for revision 3 (digest `a37ad419b2fbcfc68bcd5f45f191f3d9bba2c11ff8f80e2768681d63d7a7d35a`). Both are superseded, so the revision inherited here is 9. This block consumes the key `fs.producer.v1` that block 7 R-52 defines and the history rows of its Table C. It declares no history.
- Block 4 revision 9, `field-shift-app/specs/bloco-4-camadas-e-timeline.md`, raw sha256 `e36cf5553f8aff866789e6e025c44a21c4a44cab99a725a1aeb4b32385c075a5`, freeze digest `c9d8671d0ee00acf5c4feac3a4dce9ec93397e227a601ff637aee45e7ce542db`. Reproduced with block 4's own recipe, which has no `g` flag. The card named revision 8 (digest `f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e`), which revision 9 supersedes. The season is `seasonForDate`, block 4 R-29, implemented in `src/lib/timeline.ts`.
- Block 1 R-07, cited for the term `valid-area coverage` only.
- The region rule is block 6 R-51, the authority. Block 5 is cited only through block 6 R-51. Block 5 was not re-read against its revision 6 (commit `6e4b16c`), so no block 5 requirement number is cited here.

## Naming and numbering

This file takes the name the card gave. `field-shift-app/specs/bloco-8-agente-e-voz.md` is frozen at revision 1 and already holds the block 8 slot (block 7 M-17). Two files cannot both be block 8. This file does not edit that file and does not renumber itself. The orchestrator decides (AM-03, OD-02). Every "block 8" in this file means this file.

## Defects from block 7 review comment 119 that this revision removes

| Review item | Defect as found | Where it is fixed |
|---|---|---|
| 1 | The printed claim that a water weight change cannot change the order was false | R-22, R-23, AC-22, AC-23, O-06 |
| 2 | `income` was declared and also derived | R-03, Table B, R-05, AC-03, AC-05 |
| 3 | A derived score carried a source and resolution that did not match its row | R-04, R-05, R-19, AC-04, AC-19 |
| 4 | `residue` and `nitrogen` had no derivation and no declaration rule | R-06, R-25, R-28, CO-B8-01, AC-06 |
| 5 | `hot_days` was called comparative and forced to `unchanged` | R-31, Table E, AC-31, AM-04 |
| 6 | A zero denominator had no defined value | R-13, AC-13, O-08 |
| 7 | `EVLAND` was left unchanged while rain changed, with no failing check | R-32, R-33, AC-32, AC-33 |
| 9 | The word `coverage` had three meanings | Table A, R-01, AC-01 |
| 10 | Table E named `wb_in`, `wb_out`, `wb_remaining` as payload keys | Table E uses block 6's metric ids and payload keys `in`, `out`, `remaining` |
| 12 | The abstention and the formula line conflicted | R-16, R-18, AC-16, AC-18 |

Revision 1 also made claims that this review found unsupported. They are listed in M-07 with their correction.

## Problem

Block 7 holds the producer's field record and his declared history. The comparator and the simulator were written against that record but depend on data the repository does not yet hold. Of the four comparator criteria, one (`water`) is a field level index derived from block 6's POWER series (basis `modelled`), and two (`residue`, `nitrogen`) have no derivation anywhere in the repository (M-01). The fixture's three Brazilian fields share one climate cell, so the one block 6 criterion cannot separate their scenarios. A comparator built on this data abstains by design until the producer declares scores. This block therefore states exactly when it abstains, what each number is, and which of its claims are arithmetic that holds.

The simulator answers a narrower question: what the recorded daily series would print under a stated rain decline and a stated temperature shift. It is a scenario, not a forecast, and it changes only the terms the two controls name.

## Users and scope

- Users: the producer who wants to see how his declared values and the measured water term rank his rotation scenarios, and the reviewer who checks that every printed number says where it came from and whether it is measured, declared, computed or simulated.
- In scope: the four criteria, their weights, their producers, the weighted total, the formula line, the vocabulary of Table A, the ranks, the abstentions, the declared economics that `income` needs, the two simulator controls, the transformation, the recomputed and unchanged metrics, the simulated water balance, the heading and the marks.
- Out of scope, with the reason: the placement, layout, widths beyond the three of block 7 R-03 and keyboard contract of both parts (CO-B8-05); the field record and the declared history (block 7); the climate series, aggregates and normals (block 6); a residue product or a soil nitrogen product (none exists, M-01; CO-B8-01 and CO-B8-02); a crop water demand model (block 6 OD-02; CO-B8-10); the lease term (block 7 CO-B7-04); any calibration, validation or forecast of a simulated number (never in scope, R-38); any write to the fixture file (R-27); any server storage (block 7 R-56).

## Requirements

Requirements cite the data contracts in Tables A to F. Each requirement is numbered and each has at least one AC.

### Vocabulary, producers and scenarios

- R-01 (ubiquitous): Every use of coverage in this block SHALL be one of the three terms of Table A, named with its qualifier. The bare word `coverage` SHALL NOT appear in a requirement, a criterion, a label or a printed string of this block, except as the name of the fixture key of Table A.
- R-02 (ubiquitous): The comparator SHALL rank the scenarios of one field on exactly four criteria, in the fixed order of Table B: `water`, `income`, `residue`, `nitrogen`. No fifth criterion and no per field criterion set SHALL exist.
- R-03 (ubiquitous): Every score SHALL have exactly one producer, as Table B names it. `water` and `income` are derived only. `residue` and `nitrogen` are declared only. A declaration of `water` or `income` SHALL be refused at entry with the text of Table D, and a derived score SHALL NOT carry the basis `entered`. No criterion SHALL have a derived score and a declared score at the same time.
- R-04 (ubiquitous): The `water` score of a field SHALL be the value of block 6's metric `numbers.rain_percentile` for the chosen date, an integer from 0 to 100. Its score row SHALL copy `basis`, `source`, `as_of` and `resolution` verbatim from block 6's provenance row for that metric, and from no other row. The score is one number for the field and is the same in every scenario of that field.
- R-05 (ubiquitous): The `income` score of a scenario SHALL be `income = round_half_up(100 * min(break_even over the defined set) / break_even_s)`, an integer from 0 to 100, where `break_even_s = cost_per_ha_s / prices[last crop of s]` for scenario s in the season S of R-07, and the defined set is every scenario of the field with a positive declared cost and a positive declared price for its last crop in season S. A scenario outside the defined set has no `income` score (R-25). The score row SHALL carry basis `modelled`, `as_of` equal to the date of the economics record of that scenario (R-24), `edited_at` equal to that record's instant, `resolution` `null`, and a `source` that names the derivation and the two declared inputs.
- R-06 (ubiquitous): The `residue` and `nitrogen` scores SHALL be integers from 0 to 100 that the producer declares per scenario and season. Their basis SHALL be `entered`, their `source` the string `producer declaration`, their `as_of` the date of the declaration and their `edited_at` its instant. Neither criterion has a derivation (M-01), so no residue or nitrogen score SHALL be computed, estimated, defaulted or copied from another criterion. Without a declaration the criterion is absent from the scenario and R-15 names it.
- R-07 (ubiquitous): The season S of the comparator SHALL be the value of block 4's `seasonForDate` for the chosen date (block 4 R-29), for every region. A declaration SHALL score a season only when the season key it carries equals S. The `water` score is not season bound: it reads the window that block 6 R-16 ends on the chosen date. The comparator does not read the season dimension of a window source, so block 4 R-31's seasonless source does not change the comparator (CO-B8-07).
- R-08 (ubiquitous): The scenarios of a field SHALL be the scenarios its fixture entry carries. A registered field carries no scenario, so its comparator is in the state of R-16 with zero scenarios, and its rotation surface shows the empty state that block 5 R-26 defines (block 7 review item 8a). The comparator SHALL NOT generate scenarios from a producer's history (CO-B8-06).

### Storage and consumers

- R-09 (ubiquitous): Block 8 SHALL store its records only under the key `fs.producer.v1` of block 7 R-52, inside each field entry, as the three objects of Table C named `weights`, `scores` and `economics`, with `schema_version` 1 at the top of the key. It SHALL NOT write any other storage key. The objects are added to block 7's key by AM-01.
- R-10 (ubiquitous): Every stored key of Table C SHALL name one consumer in this block, its unit, its storage path and one criterion that fails when the consumer is removed. A stored key without a consumer SHALL NOT be added. This is the consumer bar of block 7, applied to this block's keys.
- R-11 (ubiquitous): Each field SHALL carry four integer weights, one per criterion of Table B, each from 0 to 100 in steps of 5, default 25, stored under `weights` (Table C). A weight SHALL change only by its own control or by its own arrow key step. A weight SHALL NOT be derived from a score, a basis or a fixture value. Zero is a legal weight and removes its criterion from the eligible set.

### The total, its denominators and its ordering

- R-12 (ubiquitous): For a scenario, the eligible set SHALL be every criterion whose weight is above zero. The scored set SHALL be the eligible criteria that carry a score row for that scenario. The criteria coverage of a scenario SHALL be `round_half_up(100 * W_scored / W_eligible)`, an integer, where W is the sum of the weights of the set, when `W_eligible` is above zero, and `null` when every weight is zero. A scenario SHALL be rankable when `100 * W_scored >= 80 * W_eligible`, an exact integer comparison, so that rounding never moves a scenario across the threshold of 80.
- R-13 (ubiquitous): The zero denominators SHALL be defined as follows and SHALL NOT be computed as a division by zero. (a) When every weight is zero, the ranking card SHALL print `Every weight is zero`, and no criteria coverage, total, formula value, rank or rankable flag SHALL print for any scenario. (b) When `W_eligible` is above zero and `W_scored` is zero, the criteria coverage SHALL print 0, the scenario SHALL NOT be rankable, its total SHALL print `not defined`, and its formula line SHALL print the numerator 0 and the denominator 0 with the words `no scored criterion carries weight`. (c) A declared cost or price of zero or below SHALL be refused at entry with the text of Table D. A stored cost or price of zero or below SHALL be read as absent, and R-25 applies.
- R-14 (ubiquitous): The total of a scenario SHALL be `total = sum over the scored set of (w_c * n_c) / sum over the scored set of w_c`, where `n_c` is the score of criterion c for that scenario. It SHALL be held as an exact fraction for ordering and rank, and printed rounded half up to one decimal. Because every score is an integer from 0 to 100, the total stays on the same 0 to 100 scale and no rescaling exists. A score outside 0 to 100 SHALL be refused at entry with the text of Table D and SHALL NOT be clamped.
- R-15 (state-driven): While a scenario is not rankable, its four cells SHALL print with their basis and date, or with the abstention text of Table D for each absent cell. Its total SHALL print `not ranked`, no rank SHALL print for it, and the card SHALL name every eligible criterion without a score for that scenario. Each such name SHALL also produce a gap row (R-28).
- R-16 (state-driven): While fewer than two scenarios are rankable, the ranking card SHALL print the text `Fewer than two scenarios are scored on enough criteria to rank`, and no scenario SHALL print a rank. A single rankable scenario SHALL NOT print its total as a ranking number in this state. In this state the value slot of every formula line of R-18 SHALL print `not ranked`, and the scenario cards SHALL stay visible with their scores. This rule wins over R-18 where the two meet.
- R-17 (ubiquitous): Rankable scenarios SHALL be ordered by descending exact total. Two scenarios with exactly equal totals SHALL share the lowest of their rank numbers, SHALL carry the mark `tie`, and SHALL be ordered by their index in the scenario list the fixture returns, ascending. Non rankable scenarios SHALL print after every rankable one, in list order, with no rank. The rank of a scenario is `1 + the number of rankable scenarios with a strictly greater exact total`. Two totals may print the same one decimal value with different ranks; in that case no `tie` mark prints.
- R-18 (ubiquitous): The formula line SHALL print, for every scenario, `total = (w1 * n1 + w2 * n2 + ...) / (w1 + w2 + ...) = value`, over the scored set, with the numbers substituted. The value is the rounded total when R-16 does not apply and the scenario is rankable, `not ranked` for a scenario that is not rankable or in the state of R-16, and `not defined` in the case of R-13 (b).

### Provenance and the stated property

- R-19 (ubiquitous): A score row SHALL carry exactly seven keys: `criterion`, `value`, `basis`, `source`, `as_of`, `resolution` and `edited_at`. A stored declaration carries those seven keys plus the two keys of its place in Table C, `season` and `scenario_id`. `resolution` is block 6's row resolution for `water` and `null` for `income`, `residue` and `nitrogen`. A criterion with no row SHALL print the abstention text of Table D, never a zero and never a default.
- R-20 (ubiquitous): No weight, score, declaration or simulator control SHALL set, clear or override the `basis`, `value`, `as_of`, `resolution` or `source` of any evidence row or provenance row the card displays (block 7 R-59 and block 1 R-15). No label SHALL be derived by matching a pattern in a criterion id, a scenario name or a source string.
- R-21 (ubiquitous): A change to a weight, a score or a declaration SHALL change the printed total of each scenario whose scored set it changes, and SHALL reorder the scenarios that the exact order of R-17 reorders. It SHALL NOT change any field that R-20 protects.
- R-22 (ubiquitous): This block prints no statement that a weight cannot change the order. The property it relies on is proved here. Let X and Y be two scenarios of one field whose scored sets are equal, and let the water weight take two values w and w' that are both above zero, with every other weight unchanged. Let W be the sum of the weights of the other scored criteria, which is the same for X and Y because the scored sets are equal. Let R_X be the sum of `w_c * n_c` over the other scored criteria for X, and R_Y likewise. The water score s is the same for X and Y (R-04). Then `total_X(w) - total_Y(w) = ((w * s + R_X) - (w * s + R_Y)) / (w + W) = (R_X - R_Y) / (w + W)`. The denominator is positive, so the sign of the difference does not depend on w. The exact order of X and Y is therefore the same at w and at w'. The property does not hold when the scored sets differ, and O-06 shows a change of the water weight alone that reorders two scenarios in that case. The property also does not hold at a water weight of zero, because the water criterion then leaves the scored set.
- R-23 (ubiquitous): Once per field, the ranking card SHALL print the statement `The water score is one number for this field, the same in every scenario of this field.` The card SHALL NOT print any other statement about the order.
- R-24 (ubiquitous): The declared economics SHALL be `cost_per_ha`, declared per scenario and season, and `prices`, declared per crop of that scenario and season, in the units of the field's region (R-26): Brazilian reais per hectare and Brazilian reais per 60 kilogram sack in Brazil, United States dollars per acre and United States dollars per bushel in the United States. Each record SHALL carry basis `entered` and the instant of its edit, and SHALL be stored under `economics` (Table C). Their consumer is the `income` derivation of R-05 and the printed `break_even`, which is `cost_per_ha / price` in sacks per hectare in Brazil and in bushels per acre in the United States. The criterion of AC-24 fails when either consumer is removed.
- R-25 (state-driven): While a scenario has no declared cost, or its last crop has no declared price, in season S, its `break_even` SHALL be `null`, its `income` score SHALL be absent, and the card SHALL print the abstention text of Table D that names the missing declaration. No zero, default, national average or fixture value SHALL stand in.
- R-26 (ubiquitous): The region of a field SHALL be block 6 R-51's region: the prefix `csb:` selects the United States, the prefix `trazo:` selects Brazil, a fixture id takes the region of its fixture entry, and an id with no prefix and no fixture entry resolves in the United States. The units of R-24 and of Table B SHALL be those of the resolved region only. No requirement of this block treats Brazil as the default.
- R-27 (ubiquitous): The comparator SHALL NOT write the fixture file `backend/fixtures/field-scenarios.json` and SHALL NOT contact a server. A fixture field's declarations are stored under its fixture id in `fs.producer.v1`, which block 7 Table C allows, and never change the fixture (block 7 R-60).
- R-28 (ubiquitous): Each abstention of R-15, R-16 and R-25 SHALL produce one gap row in the register of its surface (block 7 R-58), naming the field, the scenario or the declaration, the criterion, the condition measured and the date. A gap row SHALL appear only while its condition holds.

### The simulator

- R-29 (ubiquitous): The simulator SHALL offer exactly two controls. `Rain change` is an integer percentage of decline from 0 to 30 in steps of 5, default 0. `Temperature change` is a number of degrees Celsius from 0 to 3 in steps of 0.5, default 0 (the range is inherited from block 7 revision 1 and is carried as CO-B8-04). `Reset` returns both controls to their defaults. The controls are session state and SHALL NOT be stored under any key.
- R-30 (ubiquitous): The transformation SHALL act on block 6's climate series exactly as the payload returns it. For each valid `PRECTOTCORR` day, `rain' = rain * (1 - decline / 100)`. For each valid `T2M_MAX` day and each valid `T2M_MIN` day, `tmax' = tmax + delta` and `tmin' = tmin + delta`. The fill value `-999` SHALL be removed before any arithmetic (block 6 R-17). An invalid day SHALL stay invalid and SHALL NOT be filled. The simulator SHALL NOT contain an aggregate formula of its own. Each recomputed number SHALL be the block 6 function named in Table E applied to the transformed series (AM-06).
- R-31 (ubiquitous): The recomputed numbers SHALL be `rain_total`, `dry_spell_days`, `gdd10`, `tmin_min`, `hot_days` and `wb_in`, and `wb_remaining` SHALL be simulated under R-33. Each one SHALL print the mark `simulated`. `hot_days` is the count of window days whose transformed `T2M_MAX` is at or above 35 C, the rule that block 6 Table A gives for `hot_days`.
- R-32 (ubiquitous): The metrics `frost_days`, `gwetroot_mean`, `rain_median`, `rain_min`, `rain_max`, `rain_rank`, `rain_percentile`, `hot_days_median` and `wb_out` SHALL print the measured value with the mark `unchanged` and the reason of Table E, and no simulated value. The daily series of `EVLAND`, `GWETROOT` and `FROST_DAYS` SHALL enter the simulated series byte for byte as the payload returns them. Their daily values are uncontrolled terms, and no control of this block may change them silently.
- R-33 (ubiquitous): The simulated water balance SHALL be `in` = the simulated `rain_total` (`wb_in`), `out` = the measured sum of `EVLAND` over the window, unchanged, and `remaining` = simulated `in` minus measured `out`. The card SHALL print the statement `Out is held at its measured value while rain changes. The remaining is scenario arithmetic with that term fixed. It is not a crop water balance, and it is not a bound on one, because the direction of its error depends on how the evaporation term would respond to drier weather, and no model in this repository says how.` When block 6's `out` is absent, all three balance numbers SHALL abstain (block 6 R-23).
- R-34 (ubiquitous): The card heading SHALL read `Scenario, not a forecast` at every width at which the surface renders, and in every state, including the abstention of R-36. Every simulated number SHALL carry the mark `simulated`. Beside each block of simulated numbers the card SHALL print the source of the input series, the `as_of` of that series (block 6 `climate.as_of`), the transformation as text (for example `rain -20 percent, temperature +1.0 C`), and the instant of the computation. A simulated number SHALL NOT be presented as measured.
- R-35 (ubiquitous): No simulated number SHALL enter a comparator score, total, rank, criteria coverage, rankability or stored declaration. Every total, rank and order of the comparator SHALL be the same at every simulator setting. The simulator SHALL NOT write the block 6 payload.
- R-36 (state-driven): While block 6's climate section is `abstained` or `unavailable`, the simulator SHALL print no simulated number, SHALL print the reason block 6 returned, and SHALL NOT substitute a fixture series, a normals year or a neighbouring field. A simulated number SHALL exist only where its measured number exists: where block 6 abstains an aggregate (block 6 R-19), the simulated figure abstains too.
- R-37 (ubiquitous): The simulator SHALL make only the following claims about its numbers, and each SHALL be checked on the recorded series. (a) The simulated `rain_total` equals the measured one times `(1 - decline / 100)`, within rounding. (b) The simulated `dry_spell_days` is at least the measured one for every decline of 0 or more. (c) The simulated `gdd10` minus the measured one lies in the closed interval from 0 to `n * delta`, where n is the number of window days with valid `T2M_MAX` and `T2M_MIN`. (d) The simulated `tmin_min` equals the measured one plus `delta`. (e) The simulated `hot_days` lies in the closed interval from the measured `hot_days` to the number of days with a valid `T2M_MAX`, for every `delta` of 0 or more. These are checks on arithmetic. They are not evidence about the weather.
- R-38 (ubiquitous): Neither part of this block calibrates, validates, predicts or forecasts. The controls are scenario inputs that the user chooses. No requirement, label, example, test or printed string SHALL describe a simulated number as an expected, predicted or validated outcome, and the only forecast wording SHALL be the heading of R-34 and negated uses such as `not a forecast`.
- R-39 (ubiquitous): Every number this block prints SHALL be one of the four kinds of block 7 R-57, with its provenance: a block 6 metric, with its row; a declared value, with the `entered` basis and its edit date; a value computed from declared values, with the basis `modelled` and its declared inputs beside it; or a simulated value, with the mark `simulated`, the series source and the transformation. A number of none of these kinds fails this requirement.

## Data contracts

### Table A: vocabulary

| Term | Meaning in this block | Owner | Threshold | Where it appears |
|---|---|---|---|---|
| criteria coverage | the share of the eligible weight that a scenario has scored, R-12 | this block | rankable at or above 80 on the exact comparison of R-12 | the ranking card, R-12, R-15 |
| valid-area coverage | the share of a polygon's area with valid data | block 1 R-07 | 80 percent of valid area, block 1 R-07 | block 1 only; this block does not compute it |
| valid-day share | the share of window days with a non fill value for the parameters an aggregate needs | block 6 R-19 | 80 percent of window days, block 6 R-19 | block 6 only; this block reads its abstentions |
| fixture key `coverage` | the field level value 86, 91 or 62 that the fixture carries | block 7 O-07 | none | the fixture only; the comparator never reads it |

The two thresholds of 80 are the same number from different rules and do not share a definition. R-01 bars the bare word.

### Table B: criteria and provenance

| Criterion id | Label key | Unit | Producer | Basis of the row | Source of the row | as_of of the row | edited_at of the row | Derivation |
|---|---|---|---|---|---|---|---|---|
| `water` | `decision.criterion.water` | integer 0 to 100 | derived only | `modelled` (copied from block 6) | copied from block 6 row `numbers.rain_percentile` | copied from that row | the instant the block 6 row was fetched | block 6 `round(100 * rank / 35)`; field level, shared by every scenario (R-04) |
| `income` | `decision.criterion.income` | integer 0 to 100 | derived only | `modelled` | the derivation and the two declared inputs with their dates | the date of the economics record (R-24) | the instant of that record | `round_half_up(100 * min(break_even) / break_even_s)` (R-05) |
| `residue` | `decision.criterion.residue` | integer 0 to 100 | declared only | `entered` | `producer declaration` | the declaration date | the declaration instant | none; no derivation exists (M-01) |
| `nitrogen` | `decision.criterion.nitrogen` | integer 0 to 100 | declared only | `entered` | `producer declaration` | the declaration date | the declaration instant | none; no derivation exists (M-01) |

The four ids and the word `integer` are data values and are not translated. The ZARC crop names of block 7 Table G are printed as the source's own strings.

### Table C: stored objects in `fs.producer.v1`

Block 8 adds three objects to each field entry of block 7's key. Block 7's `history` array is unchanged.

| Object | Shape | Consumer in this block | Criterion that fails when the consumer is removed |
|---|---|---|---|
| `weights` | `{water, income, residue, nitrogen}`, integers 0 to 100 in steps of 5, default 25 | the eligible set and criteria coverage (R-12) and the total (R-14) | AC-11 and AC-21 |
| `scores` | array of `{season, scenario_id, criterion, value, basis, source, as_of, resolution, edited_at}` for `residue` and `nitrogen` only | the scored set and the total (R-06, R-14) | AC-06 and AC-14 |
| `economics` | object keyed by season, then by `scenario_id`, each `{cost_per_ha, prices: {crop: price}, basis, edited_at}` | the `income` score and the printed `break_even` (R-05, R-24) | AC-05 and AC-24 |

Example of the shape, with illustrative values that are not data:

```json
{"schema_version": 1,
 "fields": {"<field id>": {
   "weights": {"water": 25, "income": 25, "residue": 25, "nitrogen": 25},
   "scores": [{"season": "2026/27", "scenario_id": "soy-cotton", "criterion": "nitrogen",
               "value": 90, "basis": "entered", "source": "producer declaration",
               "as_of": "2026-11-14", "resolution": null, "edited_at": "2026-11-14T20:12:00Z"}],
   "economics": {"2026/27": {"soy-cotton": {"cost_per_ha": 4200, "prices": {"Cotton": 1.85},
                                             "basis": "entered", "edited_at": "2026-11-14T20:14:00Z"}}}}}}
```

The stored `scores` row carries `season` and `scenario_id` as its key. The printed row of R-19 carries exactly seven keys.

### Table D: formula steps and exact strings

| Step | Rule | Printed |
|---|---|---|
| eligible set | every criterion with weight above zero | the four weights and their sum |
| scored set | eligible criteria with a score row for the scenario | the four cells, each with its basis and date |
| criteria coverage | `round_half_up(100 * W_scored / W_eligible)`, or `null` if every weight is zero | `criteria coverage = 100 * 25 / 100 = 25 percent (threshold 80)` |
| rankable | `100 * W_scored >= 80 * W_eligible` | `ranked` or `not ranked` |
| total | exact `sum(w * n) / sum(w)` over the scored set, shown rounded half up to one decimal | `total = (100 * 20) / 100 = 20.0` |
| order | descending exact total, equal exact totals share the lowest rank with mark `tie`, then list index | the rank number or `tie` |
| zero scored weight (R-13 b) | `W_scored = 0` | `total = (0) / (0) = not defined`, the words `no scored criterion carries weight` |
| all weights zero (R-13 a) | `W_eligible = 0` | `Every weight is zero` |

The exact strings below are the only texts of their kind. Each is quoted from this file, and the AC of the requirement it serves compares it character for character.

| Case | Exact string |
|---|---|
| score outside 0 to 100 (R-14) | `The score must be a whole number from 0 to 100.` |
| weight outside 0 to 100 or off the step of 5 (R-11) | `The weight must be a whole number from 0 to 100 in steps of 5.` |
| cost or price zero or below (R-13 c) | `The cost and the price must be greater than zero.` |
| declaration of a derived criterion (R-03) | `This criterion is derived from other values and cannot be declared.` |
| fewer than two rankable (R-16) | `Fewer than two scenarios are scored on enough criteria to rank` |
| a criterion with no score (R-15) | `Cannot rank: no score for {criterion} in {scenario}.` |
| a missing economics declaration (R-25) | `No declared {cost_per_ha} or {price for crop} for {scenario} in {season}.` |
| a missing score declaration (R-06, R-19) | `No declared {criterion} for {scenario} in {season}.` |
| the water statement (R-23) | `The water score is one number for this field, the same in every scenario of this field.` |
| the balance statement (R-33) | the text of R-33, in full |
| the simulator heading (R-34) | `Scenario, not a forecast` |

### Table E: the simulator, per metric

| Metric | Treatment | Rule under the transformation | Printed with |
|---|---|---|---|
| `rain_total` | recomputed | block 6 sum of the transformed rain over valid days, one decimal | `simulated` |
| `dry_spell_days` | recomputed | block 6 R-18 longest run of transformed rain below 1.0 mm | `simulated` |
| `gdd10` | recomputed | block 6 R-18 on the transformed `T2M_MAX` and `T2M_MIN` | `simulated` |
| `tmin_min` | recomputed | block 6 R-18 minimum of the transformed `T2M_MIN` | `simulated` |
| `hot_days` | recomputed | count of window days with transformed `T2M_MAX` at or above 35 C (block 6 Table A rule; AM-04) | `simulated` |
| `wb_in` | recomputed | equal to the simulated `rain_total` | `simulated` |
| `wb_remaining` | recomputed | simulated `wb_in` minus measured `wb_out` (R-33) | `simulated` and the statement of R-33 |
| `wb_out` | unchanged | measured `EVLAND` sum over the window; no control changes an evaporation term | `unchanged`: the measured flux is a surface evaporation term and no crop demand exists (block 6 R-24, OD-02, CO-B8-10) |
| `frost_days` | unchanged | block 6 R-18 sums POWER's `FROST_DAYS` flag, which the daily `T2M_MIN` does not derive; holds at every `delta` | `unchanged`: the POWER flag is not recomputed from the transformed temperature |
| `gwetroot_mean` | unchanged | no declared transformation links root wetness to rain or temperature | `unchanged`: no link is declared |
| `rain_median`, `rain_min`, `rain_max` | unchanged | historical comparison over 1991 to 2025, not a series under the transformation | `unchanged`: historical, not transformed |
| `rain_rank`, `rain_percentile` | unchanged | comparison of the window with the historical years; `rain_percentile` is the `water` score (R-04, R-35) | `unchanged`: comparative with history |
| `hot_days_median` | unchanged | comparison over 1991 to 2025 | `unchanged`: historical, not transformed |

The daily series of `EVLAND`, `GWETROOT` and `FROST_DAYS` enter the simulated series byte for byte (R-32). The fixture of block 7 O-06 is not a source for any simulated number.

### Table F: oracles

| Id | Case | Values and their source |
|---|---|---|
| O-01 | measured window, field `mt-santa-carmem-01`, chosen date 2026-11-12, window 2026-10-01 to 2026-11-11, 42 days | rain 171.93 mm, dry spell 7 days, GDD10 836.46, frost days 0, `tmin_min` 21.77 C, rank 7 of 35, percentile 20; block 6 M-01 and Table H |
| O-02 | rain decline of 20 percent on O-01 | simulated `rain_total` 171.93 * 0.8 = 137.544, printed 137.5 mm |
| O-03 | fixture field `mt-santa-carmem-01`, default weights, only `water` scored (20) | criteria coverage 25, not rankable, three abstention cells naming `income`, `residue`, `nitrogen`; totals `not ranked` |
| O-04 | illustrative declared economics, not data: season 2026/27, price 60 BRL per sack for each last crop, costs 6000, 8100 and 9660 BRL per hectare for S2, S1 and S3 | break even 100, 135 and 161 sacks per hectare; `income` 100, round(74.07) = 74 and round(62.11) = 62 |
| O-05 | reorder check, with the O-04 scenarios: S1 `Current sequence`, S2 `Soybean → Corn cover`, S3 `Soybean → Cotton` | income only (weights income 100, others 0): S2 100.0, S1 74.0, S3 62.0. Nitrogen only (weights nitrogen 100, others 0) with declared nitrogen 30, 40 and 90 for S1, S2, S3: S3 90.0, S2 40.0, S1 30.0 |
| O-06 | counterexample, not data: weights water 30, income 80, residue 20, nitrogen 0; water score 20 in both scenarios; A scores income 24 and residue 27; B scores income 25 only | at water 30: A = 3060/130 = 23.5, B = 2600/110 = 23.6, B first. At water 100 (others unchanged): A = 4460/200 = 22.3, B = 4000/180 = 22.2, A first. The scored sets differ, so R-22 does not apply |
| O-07 | ties and a near tie: weights water 100, income 100, residue 1, nitrogen 0; scores water 20 and income 20 in both; residue 20 in X and 22 in Y | X = 4020/201 = 20.0 exactly, Y = 4022/201 = 20.00995. Both print 20.0. Y ranks 1, X ranks 2, no `tie` mark |
| O-08 | zero cases: all weights 0; and weights water 0, others 25, nothing scored | all weights zero prints `Every weight is zero`; the second case prints criteria coverage 0 and `not defined` |
| O-09 | formula with numbers: weights 50, 30, 20, 0; scores 80, 90, 70 | `(50 * 80 + 30 * 90 + 20 * 70) / (50 + 30 + 20) = 8100 / 100 = 81.0` |

O-04 and O-06 are arithmetic examples. They are not values from the fixture and not measurements. O-05 carries the scenario names of the fixture for `mt-santa-carmem-01` (Table G of block 7 for the crop order). Cotton's price unit is open (CO-B8-03).

## Acceptance criteria

Each AC names the requirements it covers, its method, its artifact and its falsifier. An AC is `not verified` until its artifact exists and reports the stated result.

- AC-01 (covers R-01; method: text scan of every string and requirement of this file and of the build's printed strings; artifact: `AC-01-vocabulary.txt` with each hit, its line and its Table A term): Every occurrence of `coverage` is one of the Table A forms or the fixture key. False if: a bare `coverage` appears in a requirement, criterion, label or printed string.
- AC-02 (covers R-02; method: tests of the comparator's criteria list; artifact: `AC-02-criteria.txt` with the four ids in their order): The list is exactly `water`, `income`, `residue`, `nitrogen`. False if: a fifth criterion appears, the order differs, or a per field criterion set is read.
- AC-03 (covers R-03; method: tests of entry and of the score store; artifact: `AC-03-producer.txt` with the refusal and the stored record): A declaration of `water` or `income` is refused with the Table D text, and no derived criterion is stored with the basis `entered`. False if: a declaration of either is stored, or a derived score prints `entered`.
- AC-04 (covers R-04; method: tests over the recorded payload of O-01 with the fixture field's three scenarios; artifact: `AC-04-water.txt` with the score row and the block 6 row side by side): The `water` score is 20 and its `basis`, `source`, `as_of` and `resolution` equal those of block 6's `rain_percentile` row, not of any other row, and the value is the same in all three scenarios. False if any of the four fields differs from the metric's own row, or the value differs between scenarios of one field.
- AC-05 (covers R-05; method: tests with the illustrative declarations of O-04; artifact: `AC-05-income.txt` with the break even values, the income scores, the basis, `as_of`, `edited_at` and `source` of each): The income scores are 100, 74 and 62, the basis is `modelled`, `as_of` is the date of the economics record, and `source` names the derivation and both inputs. False if an income score differs from O-04, the basis is `entered`, `as_of` comes from another metric's row, or `source` omits an input.
- AC-06 (covers R-06; method: tests with a declared residue of 27 and a declared nitrogen of 30, and a scan of the code for any residue or nitrogen calculation; artifact: `AC-06-declared.txt` with the stored rows and the scan output): The declared rows carry `entered`, `producer declaration`, the declaration date and instant; no residue or nitrogen value appears without a declaration; the scan finds no derivation. False if a value appears without a declaration, a derived value carries a non declaration basis, or the scan finds a residue or nitrogen calculation.
- AC-07 (covers R-07; method: tests with the pinned dates; artifact: `AC-07-season.txt` with the chosen date, `seasonForDate` output and the season key of each declaration): The season is `2014/15` for 2015-04-01, `2024/25` for 2025-06-30 and `2025/26` for 2025-07-01 (the pins of block 4 AC-24), and a declaration keyed `2025/26` does not score `2026/27`. False if a season differs from block 4's pin or a declaration of another season scores S.
- AC-08 (covers R-08; method: tests with one fixture field and one registered field; artifact: `AC-08-scenarios.txt` with the scenario count of each): The fixture field yields its three scenarios and the registered field yields zero and the state of R-16. False if the registered field gains a scenario, or a fixture scenario is dropped.
- AC-09 (covers R-09; method: test that records every storage key written by a session of each action; artifact: `AC-09-storage.txt` with the keys before and after): Only `fs.fields.v1` and `fs.producer.v1` are written, and `fs.producer.v1` carries the three objects of Table C. False if any other key is written.
- AC-10 (covers R-10; method: text scan of Table C and tests that remove each consumer in turn; artifact: `AC-10-consumers.txt` with each key, its consumer and the AC that fails): Every key of Table C has a consumer and a failing criterion. False if a key has no consumer, or removing a consumer leaves the criterion passing.
- AC-11 (covers R-11; method: tests of the weight control; artifact: `AC-11-weights.txt` with the four ids, defaults, steps and stored values): Weights default to 25, accept 0 and 100, move in steps of 5, and are stored per field. A value of 3 or 105 is refused with the Table D text. False if a default differs, a step differs, 3 is accepted, or a weight is shared between fields.
- AC-12 (covers R-12; method: tests on a recorded case set; artifact: `AC-12-coverage.txt` with each case's weights, scored weights, coverage and rankable flag): With four equal weights and three scored, the criteria coverage is 75 and the scenario is not rankable. With weights 40, 40, 10 and 10 and the two heavy criteria scored, the criteria coverage is 80 and the scenario is rankable. False if a criteria coverage differs or a case lands on the wrong side of 80.
- AC-13 (covers R-13; method: tests of the zero cases of O-08 and of entry; artifact: `AC-13-zero.txt` with each case's printed cells): The all-zero case prints `Every weight is zero` and no criteria coverage, total or rank. The zero scored weight case prints criteria coverage 0 and `not defined`, with no division performed. A cost or price of 0 is refused with the Table D text, and a stored 0 gives a `null` break even. False if any output contains `NaN`, `Infinity`, a number where R-13 requires none, or a refusal string that differs.
- AC-14 (covers R-14; method: tests of the O-09 formula and of the entry range; artifact: `AC-14-total.txt` with the numerator, denominator and printed total of each case): The total is 81.0 for O-09, the denominator is the sum of the scored weights, and a score of 101 or -1 is refused with the Table D text and not clamped. False if a total differs at one decimal, a denominator is not the scored sum, or a score is clamped.
- AC-15 (covers R-15; method: tests on the fixture at default weights; artifact: `AC-15-abstain.txt` with the four cells, the totals and the names printed): The `water` cell prints 20 with `modelled` and its date, the other three print the Table D abstention naming `income`, `residue` and `nitrogen`, every total prints `not ranked`, and no rank prints. False if an absent cell prints 0 or any number, a total or rank prints, or a name is missing.
- AC-16 (covers R-16; method: tests with one scenario scored on all four criteria and the other two unscored; artifact: `AC-16-single.txt` with the notice text and the formula lines): The notice prints exactly as Table D gives it, no rank prints, the value slot of each formula line reads `not ranked`, and all three cards stay visible. False if the notice differs, a rank or total prints in a value slot, or a card unmounts.
- AC-17 (covers R-17; method: tests on recorded cases; artifact: `AC-17-ties.txt` with the exact totals and the printed rank sequence of each case): Equal totals 20, 20 and 20 print ranks 1, 1 and 1 with `tie` in list order. Equal totals 80, 80 and 60 print ranks 1, 1 and 3. O-07 prints Y first with rank 1 and X with rank 2, both showing 20.0, and no `tie`. False if a rank sequence differs, a tie mark is missing or extra, or a tie is broken by anything other than list order.
- AC-18 (covers R-18; method: tests of the formula line for O-09, for the abstention and for O-03; artifact: `AC-18-formula.txt` with each printed line): The O-09 line reads exactly as Table F gives it and its value equals the total of AC-14. In the abstention state each line ends `= not ranked`. False if a substituted number is missing, a value disagrees with the total at one decimal, or a denominator is not the scored sum.
- AC-19 (covers R-19; method: tests of the stored and printed score rows; artifact: `AC-19-rows.txt` with each row's keys and values): A printed row has exactly seven keys. `resolution` for `water` equals block 6's row, and it is `null` for `income`, `residue` and `nitrogen`. A criterion with no row prints the abstention and no number. False if a key count differs, a key is missing, or a `resolution` differs from R-19.
- AC-20 (covers R-20; method: activation sweep of every weight, declaration and simulator control on both surfaces; artifact: `AC-20-relabel.txt` with every displayed provenance field before and after the sweep): None of the protected fields changes. False if any `basis`, `value`, `as_of`, `resolution` or `source` of an evidence or provenance row changes.
- AC-21 (covers R-21; method: tests with the O-05 scenarios; artifact: `AC-21-reorder.txt` with each total and order before and after the weight change): Moving the weight from income to nitrogen reorders S2, S1, S3 into S3, S2, S1 on every run, and the totals of the changed criteria change. False if the order does not reproduce on a repeated run, or a protected field changes.
- AC-22 (covers R-22; method: tests with a sweep of the water weight over 5, 10, ..., 100 for two scenarios with equal scored sets, and the O-06 case; artifact: `AC-22-water-property.txt` with the sweep table and the O-06 totals): For equal scored sets the exact order of X and Y is the same at every swept water weight, and the O-06 case reproduces its flip. False if the order of two equal-scored-set scenarios reverses at any swept water weight, or the O-06 case does not reproduce.
- AC-23 (covers R-23; method: text scan of the ranking card at each width and of the strings of this file; artifact: `AC-23-statement.txt` with the count of the water statement per field and the scan for any order claim): The water statement prints once per field, and no string contains `cannot change the order` or any other claim about order. False if the statement is missing or repeated, or an order claim prints.
- AC-24 (covers R-24; method: tests that change a declared cost and a declared price on the O-04 scenarios; artifact: `AC-24-consumer.txt` with the break even, income and total before and after each change): A change to the cost changes the printed `break_even`, the `income` score and the total. A change to the price does the same. The printed units match the region (R-26). False if a declared change leaves its consumer unchanged, or a unit is wrong for the region.
- AC-25 (covers R-25; method: tests with a missing cost, a missing price for the last crop, and a stored zero; artifact: `AC-25-missing.txt` with the printed text of each case): The break even and income are `null` and the Table D text names the missing item. False if a zero, default or other value prints in their place.
- AC-26 (covers R-26; method: tests with one id of each form and the fixture ids; artifact: `AC-26-region.txt` with the resolved region and the units printed for each): `csb:` resolves to United States units (USD per acre, USD per bushel), `trazo:` to Brazil units (BRL per hectare, BRL per 60 kg sack), an unprefixed id with no fixture entry to the United States, and a fixture id to the region of its entry. False if an unprefixed id resolves to Brazil, or units of another region print.
- AC-27 (covers R-27; method: SHA-256 of the fixture file before and after a session of each action, and the network record of the session; artifact: `AC-27-fixture.txt` with both hashes and the list of requests): The hashes are equal and no request goes to a server. False if the fixture hash changes, or a request is made to a server by a comparator action.
- AC-28 (covers R-28; method: tests of each abstention state and of the gap register; artifact: `AC-28-gaps.txt` with each abstention and its gap row): Each abstention of R-15, R-16 and R-25 has one gap row with its field, scenario or declaration, criterion, condition and date, and no gap row exists without its condition. False if an abstention has no gap row, or a gap row has no live condition.
- AC-29 (covers R-29; method: tests of the two controls; artifact: `AC-29-controls.txt` with the values offered, the defaults and the state after Reset): Rain offers 0, 5, ..., 30 (7 values) and temperature offers 0, 0.5, ..., 3.0 (7 values), both default to 0, and Reset returns both to 0. No other control appears and no key is written. False if a range, step or default differs, an eighth control appears, Reset leaves a value, or a key is written.
- AC-30 (covers R-30; method: tests on a recorded 42 day series with a -999 day, at 20 percent decline and 1 C shift, plus a code scan for aggregate formulas outside block 6's functions; artifact: `AC-30-transform.txt` with the transformed days, the fill day and the scan output): Each valid rain day equals its measured value times 0.8, the fill day contributes nothing, each temperature day shifts by 1.0, and the scan finds no aggregate formula in the simulator. False if a transformed day differs, a fill value enters a sum, or the simulator contains an aggregate formula.
- AC-31 (covers R-31; method: tests on O-01 at 0, 20 percent and 1 C; artifact: `AC-31-recompute.txt` with each recomputed value, its bound and its mark): `rain_total` at 20 percent prints 137.5. `tmin_min` at 1 C prints 22.8 (21.77 + 1 = 22.77). `gdd10` at 1 C lies between 836.46 and 878.46. `dry_spell_days` at 20 percent is at least 7. `hot_days` is the count of R-31. Every recomputed value carries `simulated`. False if a value falls outside its bound, a recomputed metric prints `unchanged`, or a mark is missing.
- AC-32 (covers R-32; method: tests at 0, 20 percent and +3 C, comparing each uncontrolled term with the payload, plus a seeded mutation test in which a harness changes one `EVLAND` day by 1 percent and the criterion must fail; artifact: `AC-32-unchanged.txt` with the comparison and the mutation result): Each uncontrolled term prints its measured value with `unchanged` and its reason, and its daily series is identical to the payload. The criterion fails on the seeded mutation. False if an uncontrolled term differs at any setting, a reason is missing, a series element changes, or the criterion passes the seeded mutation.
- AC-33 (covers R-33; method: tests on O-01 at 20 percent, and with block 6's `out` removed; artifact: `AC-33-balance.txt` with the three numbers, the statement and the abstention case): `in` equals the simulated `rain_total`, `out` equals the measured sum at every setting, `remaining` equals `in` minus `out`, the statement of R-33 prints beside the numbers, and with `out` absent all three abstain. False if `out` changes with a control, a number prints without its mark, the statement is missing or differs, the text contains `upper bound`, or a missing `out` yields a number.
- AC-34 (covers R-34; method: text scan and computer use of the built surface at 1440x900, 780x900 and 360x640, in the measured and abstention states; artifact: `AC-34-heading.txt` with the heading, the marks and the provenance line at each width and state): The heading reads `Scenario, not a forecast` everywhere it renders. Every simulated number has the mark, and each block has the four provenance parts. False if the heading is missing at a width or state, a simulated number has no mark, or a provenance part is missing.
- AC-35 (covers R-35; method: tests that record every comparator total, rank and order at 0 and at 20 percent decline with a 1 C shift, and the hash of the payload before and after the simulator is used; artifact: `AC-35-isolation.txt` with the two records and both hashes): The comparator output is identical at both settings and the payload hash is unchanged. False if any total, rank or order differs, or the payload hash changes.
- AC-36 (covers R-36; method: tests with a climate section `abstained`, a section `unavailable`, and a payload with `EVLAND` missing; artifact: `AC-36-sim-abstain.txt` with the states, the reasons and the rendered text): No simulated number prints, the reason prints, and no fixture series appears. False if a simulated number prints under either state, the reason is missing, or a fixture value appears.
- AC-37 (covers R-37; method: tests of claims (a) to (e) on the recorded series at declines of 0, 5, ..., 30 and deltas of 0, 0.5, ..., 3.0; artifact: `AC-37-properties.txt` with each check's value and its bound): Every check holds, and the dry spell count does not fall as the decline rises. False if any check fails at any setting.
- AC-38 (covers R-38; method: text scan of the build's strings, the requirements and the examples of this file for `calibrat`, `validat`, `predict`, `expected outcome`, `forecast` and `will yield`; artifact: `AC-38-no-claims.txt` with each hit and its location): The only hits are the heading of R-34 and negated uses such as `not a forecast`. False if any other hit appears.
- AC-39 (covers R-39; method: test that lists every printed number of the surface with its kind and its provenance; artifact: `AC-39-kinds.txt` with the list): Every printed number has one of the four kinds and its provenance. False if any printed number has no kind or no provenance.
- AC-40 (covers no requirement; method: text checks of this file itself; artifact: `AC-40-document.txt` with the counts of R, AC, AM, CO, OD and M, the dash count and the freeze digest check): There are 39 R, 40 AC, 7 AM, 15 CO, 2 OD and 9 M, every R has an AC, every AC names its method, artifact and falsifier, and the dash count is 0. False if a count differs, an R has no AC, or an AC lacks one of its three fields.

Traceability check: R-01 to R-39 each have exactly one AC with the same number (AC-01 to AC-39). AC-40 covers the document.

## Amendments

Each row names the block, the clause, the change and the owner. A row is an edit the owner must make before the block it touches is measured again. No row edits another block's file in this revision.

| Id | Block | Clause | Change | Owner |
|---|---|---|---|---|
| AM-01 | 7 (rev 9) | R-52 and Table C, the two stored keys | Each field entry of `fs.producer.v1` gains the three objects `weights`, `scores` and `economics` of this block's Table C. The key count stays two, `schema_version` stays 1, and block 7 R-54 applies to the new objects. | orchestrator, then block 7 owner |
| AM-02 | 7 (rev 9) | Out of scope paragraph, the consumer bar paragraph and CO-B7-11, CO-B7-12, CO-B7-13 | Each pointer that says `block 8` is read as this file. The consumer bar names this block as the consumer of the three objects. Block 7 R-56 export and reset cover them without change. | orchestrator |
| AM-03 | 7 (rev 9) M-17 and the block 8 slot in the tree | Numbering | The tree holds two block 8 specs (this file and `bloco-8-agente-e-voz.md`). The orchestrator renames one of them. This file does not decide which. | orchestrator (OD-02) |
| AM-04 | 6 (rev 2) | Table A `hot_days`, R-18 and the payload example | Table A defines `hot_days` as a window count at or above 35 C, but R-18 names six aggregates without it and the worked payload places `hot_days` under `normals`. Block 6 names where `hot_days` lives and exports its window count as a pure function. | block 6 owner |
| AM-05 | 6 (rev 2) | R-17, Table E `climate.series`, and the worked payload source URL | The URL example requests `PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,FROST_DAYS,GWETROOT` and omits `EVLAND`, while R-17 says sixteen parameters and R-22 and R-23 read `EVLAND` daily. Block 6 states that `climate.series` carries the daily values of `EVLAND`, `GWETROOT`, `FROST_DAYS`, `T2M_MAX` and `T2M_MIN`, and corrects the URL example. Without this the uncontrolled-term check of R-32 cannot run. | block 6 owner |
| AM-06 | 6 (rev 2) | R-18, and the paths named at line 375 of block 6 | Block 6 names `src/lib/aggregates.ts` and `src/lib/water-balance.ts`. Neither file exists in the tree at this freeze (M-03). Block 6 must export, as pure functions, the aggregates that R-30 and Table E call. Until it does, AC-30 and AC-31 are `not verified`. | block 6 implementation card |
| AM-07 | 1 (rev 3) | R-03 and AC-03, AC-04 (exactly three scenario cards) | The ranking card and the weight controls are not scenario cards. A gate note states that they add no scenario card, so a fixture field keeps its three. Placement is CO-B8-05. | block 1 owner (gate note) |

Blocks with no amendment, and why:

| Block | Result | Reason |
|---|---|---|
| 1 | AM-07 only | R-07 is cited for the term `valid-area coverage` and is not changed |
| 2 | none | No control of this block is placed on the HUD (CO-B8-05) |
| 3 | none | No control of this block is placed on the strip or its right edge column (block 7 R-03 rule) |
| 4 | none | `seasonForDate` is read only; block 4 R-29 and its AC-24 cover it |
| 5 | none | The region rule is read through block 6 R-51, and no block 5 text is changed |

## Carry-over annex

Items the user has not decided. None is decided by this file. Each has a default in the requirements, a consequence if the user moves it, and a pointer.

- CO-B8-01 (residue and nitrogen definitions): `residue` and `nitrogen` are declared indices from 0 to 100 with no defined scale, no rubric and no product in this repository (M-01). Default: declared only (R-06), abstaining until declared. Decision needed: a written rubric for each producer declaration, or removal of the two criteria. Consequence if moved: R-02 and Table B change, and the comparator's four-criterion scope is no longer true.
- CO-B8-02 (residue from cover crop and tillage): block 7 dropped `tillage` (CO-B7-14) and `cover_crop` (CO-B7-15) for lack of a consumer. A cover crop is the natural declared input of a residue derivation. Default: none; no residue derivation exists (R-06). Decision needed: whether residue is derived from a declared cover crop, and a new block 7 key if so.
- CO-B8-03 (price units per crop): the sack of 60 kilograms and the United States bushel fit soybeans and corn. Cotton in Brazil and sugar beets and spring wheat in the fixture's United States fields are not quoted in those units. Default: R-24 keeps the units of block 7 revision 1 for every crop, as the card asked, and AC-24 checks the units of the region only. Decision needed: the unit of each crop's price.
- CO-B8-04 (temperature range): the range 0 to 3 C in steps of 0.5 is inherited from block 7 revision 1 R-22. The card gives only the name `Temperature change`. Default: the inherited range (R-29). Decision needed: confirm or change the range.
- CO-B8-05 (placement, layout, widths and keyboard): this block states no layout. The comparator and the simulator need a place on the decision surface that block 7 owns, and its widths and keyboard contract. Default: the three widths of block 7 R-03 are the widths of R-34. Decision needed: placement and the widths the surface supports.
- CO-B8-06 (registered fields as scenarios): a registered field has no scenario (R-08), so its comparator abstains. Decision needed: whether a producer's declared history can generate scenarios, and if so, how a scenario is named and keyed.
- CO-B8-07 (season convention for the United States): `seasonForDate` cuts the season on 1 July, which is the Brazilian crop year. It applies to the United States fixture fields unchanged (R-07). Decision needed: whether a United States crop year is defined, and whether the cut holds for the crops in the fixture.
- CO-B8-08 (where cost and price live): the card's comment asked this block to declare `cost_per_ha` and `product_price` under `fs.producer.v1` until the orchestrator rules otherwise. This file takes that default (R-09, R-24). The other outcome is a block 7 amendment that brings both fields back and this block consumes them. Decision needed: the orchestrator's ruling (OD-01). Consequence if moved: R-09, R-24, Table C and AM-01 change, and AM-01 moves to block 7 as a new key.
- CO-B8-09 (scenario or field economics): each scenario has its own cost (R-24), which the fixture's scenario structure suggests. A single field cost would change R-05 and Table C. Decision needed: confirm per scenario.
- CO-B8-10 (crop water demand): the balance's `out` term is a surface evaporation flux, not a crop demand (block 6 R-24, OD-02, CO-B6-07). `remaining` (R-33) depends on that term. Decision needed: whether to bring a crop water demand model into a later block.
- CO-B8-11 (frost days under temperature): `frost_days` is POWER's flag and is unchanged at every setting (Table E). A count from the transformed `T2M_MIN` at or below 0 C would be a new aggregate that block 6 does not define. Decision needed: whether to define it.
- CO-B8-12 (`hot_days` location): AM-04 asks block 6 to place it. Decision needed: block 6's owner decides where `hot_days` lives.
- CO-B8-13 (fixture key `coverage`): the fixture key holds a valid-area value under a bare name. Renaming it is a change to the fixture, which block 7 R-60 bars for this block. Decision needed: whether to rename it in a later fixture change.
- CO-B8-14 (scenario sets of the United States fixture fields): the CSB fixture carries its own scenarios (`Current sequence`, `Spring Wheat → Sugarbeets`, `Spring Wheat → Sugarbeets → Soybeans → Corn`). R-08 ranks what the fixture carries. Decision needed: confirm these are the scenarios the comparator ranks for those fields.
- CO-B8-15 (weights per season): weights are per field and not per season (R-11), while scores and economics are per season (R-07). Decision needed: confirm weights do not change by season.

## Open decisions

- OD-01 (location of cost and price, CO-B8-08): default applied in this file. The orchestrator confirms or rules otherwise before the block is built. If the ruling moves the fields to block 7, this file's R-09, R-24, Table C and AM-01 change.
- OD-02 (numbering, AM-03): the orchestrator renumbers one of the two block 8 files. This file keeps the name the card gave until that ruling.

## Findings

- M-01 (no residue or nitrogen product, no derivation): the search of the repository at commit `077e53e` was `grep -rIil -E "residue|nitrogen|cover_crop|palha|nitrog|N_total|soil_n\b"` over the tree, excluding `node_modules`, `.git` and `specs`. Two files matched and both are false positives: `artifacts/zarc-mt-snapshot.md` (the variable `n_total` in a counting script) and `artifacts/gibs-identifiers-2026-11-14.txt` (the layer names `Nitrogen_Dioxide`). No residue, cover fraction or soil nitrogen product exists, which confirms block 7 M-08. Source of the finding: that search, reproduced on this revision.
- M-02 (inherited revisions): the card named block 7 revision 2 and its comment named revision 3. Block 7 is at revision 9 (digest `0f1eb9b29822d83b2030a0c500916123c3a72e98c0c46d80bab856a71467ea22`). Block 4 is at revision 9, not the revision 8 the card named. Both superseded inputs were treated as superseded. The three inherited digests were reproduced with their own recipes (see the Inherits section).
- M-03 (missing pure functions): block 6 line 375 names `src/lib/aggregates.ts`, `src/lib/water-balance.ts`, `src/lib/numbers.ts` and `src/lib/numbers-api.ts`. `src/lib` in this tree holds `timeline.ts`, `window-source.ts`, `season-band.ts` and no file of those names. The simulator's R-30 depends on AM-06 and cannot be measured until block 6 lands them.
- M-04 (payload example omits EVLAND): block 6's worked source URL requests six parameters and omits `EVLAND`, against R-17's sixteen and against the water balance that reads `EVLAND` (AM-05).
- M-05 (`hot_days` placement): block 6 Table A defines `hot_days` in the climate section as a window count at or above 35 C, and the worked payload places `hot_days` (28) and `hot_days_median` (17) under `normals`. The two places disagree (AM-04). This file uses the Table A rule.
- M-06 (United States fixture fields carry scenarios): the CSB fixture entries carry their own scenarios and crops, so the comparator's scenario set includes United States fields (R-08, CO-B8-14). Block 7 described the fixture as three Brazilian fields. This is a difference of scope, and the spec follows the fixture.
- M-07 (revision 1 claims corrected): the revision 1 text in `48cbdd3` made claims that this revision replaces. (a) Its R-21 said a water weight alone cannot change the order. That is false when the scored sets differ (O-06), so R-22 proves the narrow property and states the condition. (b) Its R-16 and R-21 conflicted over the formula value in the abstention state; R-16 now wins. (c) Its R-17 ordered by totals rounded to one decimal, with ties broken by array order. That can reverse two scenarios whose exact totals differ, when rounding makes them equal. R-17 now orders by the exact total. (d) Its R-25 called the simulated `remaining` an upper bound. The direction of its error depends on the evaporation term, which nothing in the repository models, so R-33 states that it is not a bound. (e) Its R-24 called `hot_days` comparative and `frost_days` unchanged only above zero. `hot_days` is recomputed (R-31), and `frost_days` is unchanged at every setting because the reason does not depend on the sign of the change. (f) Its third worked example used declared `income` values, which R-03 now forbids. O-04 and O-05 derive them from costs and prices instead.
- M-08 (the break even unit): `cost_per_ha / price` gives sacks per hectare in Brazil (BRL per hectare over BRL per sack) and bushels per acre in the United States (USD per acre over USD per bushel). The unit of the ratio follows from the units of the two declared inputs, so it is printed with its name and not converted.
- M-09 (the water term is not simulated): `rain_percentile` is a rank against the 1991 to 2025 years (block 6 R-20). The simulator leaves it unchanged, so the comparator never reads a simulated value (R-35). A simulated rain change therefore never moves the `water` score, which is a fact of the design and is not a finding against it.

## Not claimed

This block does not claim that the rain or temperature controls match any weather, climate projection, crop response, yield or farm outcome. It does not claim that the weights are right, that the four criteria capture a farm decision, or that a ranking from them is better than the producer's own judgement. The simulated numbers are arithmetic on a recorded series with declared controls. The comparator's scores are either one measured percentile with its own provenance or producer declarations. No requirement, label or test of this block says otherwise.

## Exit criteria

The block is frozen when this file reproduces its digest (below) and the document checks of AC-40 pass. The block is measured when every AC from AC-01 to AC-39 reports its artifact. Until then every AC is `not verified`. A failing AC blocks the block. The amendments AM-01 to AM-07 must land on their owners' files before the ACs that depend on them are measured, and AC-30, AC-31 and AC-32 depend on AM-05 and AM-06.

## Freeze record

| Field | Value |
|---|---|
| Revision | 1 |
| Approval | Not yet approved. The card stops at the frozen spec and requests review. The user approves in chat. |
| Inherits | block 6 revision 2 (`0d10c71fbe74519f3a801dcdc9eb475a8a53b1fbbfd23c52d8263880fbb7088e`), block 7 revision 9 (`0f1eb9b29822d83b2030a0c500916123c3a72e98c0c46d80bab856a71467ea22`), block 4 revision 9 (`c9d8671d0ee00acf5c4feac3a4dce9ec93397e227a601ff637aee45e7ce542db`), block 1 R-07 by term |
| Requirements | 39 active, R-01 to R-39; none retired |
| Criteria | 40 active, AC-01 to AC-40; AC-40 covers the document |
| Amendments | 7, AM-01 to AM-07 (block 7: AM-01, AM-02, AM-03; block 6: AM-04, AM-05, AM-06; block 1: AM-07) |
| Open decisions | 2, OD-01 and OD-02, each with a default |
| Carry-over | 15, CO-B8-01 to CO-B8-15 |
| Findings | 9, M-01 to M-09 |
| sha256 | `2141a804fd582f0480d45d050f949347590f40b2e369afdc953f3f954e2d8e8c` |

The raw sha256 of the frozen bytes is reported on the card, because a file cannot record its own raw digest. Reproduce the freeze digest with, from `field-shift-app/`:

```sh
sed 's/`[0-9a-f]\{64\}`/`PENDING`/g' specs/bloco-8-comparador-e-simulador.md | sha256sum
```

The result SHALL equal the value in the sha256 row above. The substitution carries the `g` flag because this file quotes digests in backticks on several lines (the Inherits paragraphs, the freeze record and the amendments). A first match only recipe would leave the later digests on those lines unnormalised. The sha256 row holds `PENDING` before hashing and is not counted.
