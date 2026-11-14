---
title: Design phase
description: The decisions that constrain the build, one record each, and the small calls in a log.
---

Two decision classes live here and they are kept apart on purpose.

- **ADRs** for anything that is expensive to reverse: the demo geography, the no-account floor, the abstention gate. One file per decision, superseded rather than edited.
- **The decision log** for the small reversible calls: naming, folder layout, copy. One line each, newest first.

If a line in the log needs more than a sentence of justification, it was an ADR.

## Why records at all

The research argues against the easy version of this idea. A decision that ignores that argument needs to be visible, dated, and attached to whoever took it, or the team re-litigates it at 2 a.m. on the second day.
