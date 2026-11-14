---
title: Build phase
description: Architecture, setup, and the checks that tell a pass from a failure.
---

Read [Architecture](/30-build/architecture/) before touching code. The boundaries matter more than the file layout, and two of them exist because of specific ways this kind of tool lies to a farmer.

## Build order

Ranked, and cut from the end when capacity is short.

| Rank | Item | Drop cost |
|---|---|---|
| 1 | Field and season setup with entered crop history | Loses the challenge's three-row comparison |
| 2 | POWER context layer and its source dates | Loses the evidence column |
| 3 | Three-row comparison with the five fields per row | Loses the deliverable |
| 4 | Evidence panel with provenance and the abstention gate | Loses validity |
| 5 | Farmer constraint form with unknown states | Loses the deference clause |
| 6 | Text-to-SQL over the allowlisted schema | Loses the agent |
| 7 | Voice, conditional on the noise test | Nothing in the challenge text |
