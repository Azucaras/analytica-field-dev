---
title: Agent context
description: How an agent should work in this repository, and what each file is for.
---

## Files

| File | Carries | Read by |
|---|---|---|
| `/llms.txt` | Page index for the whole site | Agents that honour the spec |
| `/llms-full.txt` | Corpus in one file | Agents that fetch the full variant |
| `AGENTS.md` at the repo root | Local rules: commands, layout, editing rules | Coding agents |
| `/field-shift-dossier.md` | The cited deep source | Anyone needing the evidence |

`AGENTS.md` wins for procedure. When it and a page disagree, fix the page.

## Schema contract

Three tables, select only.

| Table | Key fields | Rule |
|---|---|---|
| `field` | `field_id`, `boundary_version`, `geom` | Boundary rows are immutable, a revision adds a version |
| `observation` | `field_id`, `indicator`, `period_start`, `period_end`, `value`, `support_m`, `qa`, `basis` | `basis` is observed, retrieved, modelled or entered |
| `constraint` | `field_id`, `kind`, `value`, `source`, `unknown` | `unknown` is true when the farmer has not answered |

## Query rules

Resolve a field only when the name is unique. Ask on multiple matches. Require a season set, an indicator and an aggregation. Apply `PROVISIONAL_ABSTENTION_GATE` before returning a ranking. Return the resolved parameters and the schema version with the answer.

Reject writes, DDL, arbitrary functions, unrecognised identifiers, uncontrolled cross joins, and anything that aggregates across fields without saying so.

## Voice

`FIELD_VOICE_TEST_01` gates voice entirely. Voice initiates, an on-screen confirmation writes. Low confidence, an out-of-grammar phrase or an ambiguous field name means no execution.

## What an agent must not claim

Rotation caused yield, profit or soil carbon. A 9 km posting is field conditions. A model state was measured.
