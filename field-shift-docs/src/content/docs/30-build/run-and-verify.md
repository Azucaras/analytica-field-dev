---
title: Run and verify
description: Each check, what a pass looks like, what a failure looks like, and what to relax first.
---

Site checks first, then the data checks the app depends on. Every command names its runtime.

## Site

| Check | Pass | Failure | Command |
|---|---|---|---|
| Build | Exit 0, `dist/` written | Broken link, missing title, undefined component | `npm run build` |
| Index served | 200 | 404 means the plugin is unregistered or `site` is unset | `curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/llms.txt` |
| Mirror type | `text/markdown` | `application/octet-stream`, which an agent reads as a download | `curl -sI http://localhost:4321/architecture.md \| grep -i content-type` |
| Table fit | No sideways scroll | `scrollWidth` above `clientWidth` on a table | Measure in the console, not by eye |

## Data

| Check | Pass | Failure | Command |
|---|---|---|---|
| POWER answers | 200 with values | Non 200, or all fill values | `curl -sSG https://power.larc.nasa.gov/api/temporal/daily/point --data-urlencode parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN --data-urlencode community=AG --data-urlencode latitude=-11.97 --data-urlencode longitude=-55.28 --data-urlencode start=20250101 --data-urlencode end=20250131 --data-urlencode format=JSON` |
| CMR scoped query | 200 with granules in the box | 200 with global granules, meaning the bounding box is missing | Same call with `bounding_box` and `sort_key=-start_date` on the granules endpoint |
| JSON shape | Expected keys present and a non zero count | Empty feed, or a value with fill codes | `jq '.feed.entry \| length'` on the response file |

## Failure path, in the order to relax

1. Check the HTTP status and the query string, not the code.
2. Drop to the no-account path: POWER and CMR only, fixture for anything else.
3. Shrink the date range, then the bounding box.
4. Reduce to one layer and one indicator family.
5. Fall back to the static fixture, labelled as fixture with its build date.

Never relax the quality mask, the field and season join, or the abstention gate to make a result appear.
