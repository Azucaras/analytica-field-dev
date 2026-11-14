---
title: How to use these docs
description: Reading paths per role, and the rule that keeps a fact on one page.
---

## Reading paths

| Role | Read in this order | Why |
|---|---|---|
| New to the project | [Problem](/10-research/r1-problem/), [Findings](/10-research/r3-findings/), [Architecture](/30-build/architecture/) | You need the constraint before the design, or the design looks arbitrary |
| Building the map and agent | [Findings](/10-research/r3-findings/), [ADR 0001](/20-design/adr-0001-demonstrate-on-one-brazilian-field/), [Architecture](/30-build/architecture/), [Run and verify](/30-build/run-and-verify/) | The interaction rules and the abstention gate are the parts most likely to be built wrong |
| Working the evidence | [Evidence log](/10-research/r2-evidence-log/), [Open questions](/10-research/r4-open-questions/) | Every row states what was run, so you can repeat or attack it |
| Judge, or a reader with ten minutes | [Overview](/) and [Problem](/10-research/r1-problem/) | The scope boundary is on the problem page, stated plainly |

## The rules that keep this usable

1. One fact lives on one page. Link to it from elsewhere rather than copying it.
2. A page that states a number or a command states the date and the machine it was checked on.
3. A finding without an evidence row is an opinion and belongs in the design notes.
4. A question without an owner is a worry, not a question.

## What this site is not

It is not the dossier. The dossier is the deep, cited source and it lives in this same site under [Dossier](/50-dossier/) and as `field-shift-dossier.md`. When the two disagree, the dossier wins and the working page gets corrected.

## Checked

Written and checked 2026-11-10 on Arch Linux, 12 cores. No em dashes and no en dashes by rule.
