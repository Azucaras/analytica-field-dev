---
title: Doc map
description: Every page, the question it answers, its owner and when it changes.
---

| Page | Question it answers | Owner | When it changes |
|---|---|---|---|
| [Problem](/10-research/r1-problem/) | Who has the problem, how many, and what is out of scope | Research lead | Only on a scope decision, recorded as an ADR |
| [Evidence log](/10-research/r2-evidence-log/) | What was actually run, with result and confidence | Whoever runs a check | Append only |
| [Findings](/10-research/r3-findings/) | What the evidence supports, and what would overturn it | Research lead | At the end of a research block |
| [Open questions](/10-research/r4-open-questions/) | What is still unresolved and who owns it | Named owner per row | When an owner answers or is replaced |
| [ADR 0001](/20-design/adr-0001-demonstrate-on-one-brazilian-field/) | Why the demo sits on one field in Mato Grosso | Whole team | Superseded, never edited |
| [ADR 0002](/20-design/adr-0002-public-path-is-the-demo-floor/) | Why the no-account path is the floor | Whole team | Superseded, never edited |
| [Decision log](/20-design/decision-log/) | Small reversible calls and their reason | Whoever decides | Immediately, newest first |
| [Design notes](/20-design/design-notes/) | Reasoning that has no evidence row yet | Any author | Freely |
| [Architecture](/30-build/architecture/) | Parts, ownership and the boundaries that matter | Build lead | When a boundary moves |
| [Setup](/30-build/setup/) | How a clean clone runs | Build lead | When a dependency moves |
| [Run and verify](/30-build/run-and-verify/) | What a pass and a failure look like | Build lead | When a check is added or dropped |
| [Glossary](/40-reference/glossary/) | What a term means here | Any author | On first ambiguous use |
| [Agent context](/40-reference/agent-context/) | How an agent should work in this repo | Build lead | When the machine layer changes |

## Where the dossier sits

Every dossier subsection is a page under [Dossier](/50-dossier/), one per subsection in report order, with [all 150 sources](/50-dossier/99-sources/) listed once. The dossier is also a single file, [field-shift-dossier.md](/), with its [provenance record](/field-shift-provenance.md). It is the source for every number here.
