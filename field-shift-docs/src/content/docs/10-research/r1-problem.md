---
title: Problem statement
description: Who decides rotations, how many, what the tool must not claim, and the scope boundary.
---

## The problem

A farmer choosing next season's crop sequence has to weigh water, soil condition, cash rent, credit and market timing, and the evidence for each arrives from different places at different resolutions. Nobody hands over a comparison. The decision gets made on habit plus an agronomist's judgement, and a bad season is charged to the field rather than to the missing comparison.

## Who has it

Two audiences, both reachable with named counts.

| Audience | Size that can be pointed at | Source |
|---|---|---|
| Brazilian growers with subsidised rural insurance | 3.2 million hectares across just over 60,000 policies (2025 cohort) | Globo Rural, June 2026 (documented) |
| US growers in a cash-rent or crop-share arrangement | 21 distinct decision drivers logged, rent averaging 161 USD per acre nationally in 2025 | USDA NASS Land Values, farmdoc (documented) |

Those counts bound hectares and policies, not unique people. They exclude uninsured and self-insured growers and they are not an adoption forecast.

## Evidence that the problem is real

| Claim | Evidence | Source | Checked |
|---|---|---|---|
| Timing, not crop choice, is the binding constraint in the Cerrado | Maize sown 19 January yielded 2.33 Mg per ha more than the same maize sown 27 February in one Mato Grosso trial | Embrapa and UFMT, Santa Carmem (documented) | 2026-11-10 |
| Rotation change needs a landlord, not just a plan | A central Illinois cash-rent example projects a negative 15 USD per acre farmer return against a positive 18 USD per acre under crop share | farmdoc, January 2026 (documented) | 2026-11-10 |
| A cover crop can lose the finance window | ZARC observance has been a condition of rural operating credit since 1 July 2025 | CMN Resolution 5.235 vote (documented) | 2026-11-10 |
| Satellites cannot settle the question alone | SMAP posts 9 km from a 36 km footprint and reads the top 5 cm | NSIDC SPL3SMP_E user guide (documented) | 2026-11-10 |

## In scope

One synthetic field in Santa Carmem, Mato Grosso, crop year 2025/26, three rotation rows including the current sequence, with POWER climate context, public catalogue metadata and farmer-entered crop history.

The United States is a documented extension, not part of the demo.

## Out of scope

- A crop classifier. Crop history is entered by the farmer and marked as entered.
- Any claim that rotation caused yield, profit or soil carbon.
- Agronomic validation. The comparison is a worked example and says so on every row.

## Definition of done

A judge opens the map, picks the field, sees three sequences side by side with evidence, gaps and risks on each, follows one evidence cell back to its source and date, and can name which inputs the tool could not see.
