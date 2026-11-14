---
title: ADR 0001, demonstrate on one Brazilian field
status: accepted
date: 2026-11-10
deciders: Research lead, build lead
---

## Context

The research covers two countries and the build envelope is large, but a comparison needs a field, a jurisdiction, a season and a crop history before it can calculate anything. Covering both countries shallowly leaves every row unsupported. The Cerrado also carries the strongest single piece of evidence in the pack: a 2.33 Mg per ha yield difference between two January and February maize planting dates in one Mato Grosso trial.

## Decision

The demo runs one synthetic field at Santa Carmem, Mato Grosso, crop year 2025/26, from 1 July 2025 to 30 June 2026, under Brazilian and Mato Grosso jurisdiction. The United States is a documented extension and appears in no comparison row.

## Consequences

Easy: every row gets a real calendar, a real credit regime and a real second-crop limit. The abstention rule has something concrete to check.

Hard: the tool reads as Brazil-only to a judge, and the US research earns no demo presence. Anyone who wants a US field must add jurisdiction, insurance and rent fields before the first row.

Revisit if the resource drop on 2026-11-13 adds a Brazilian dataset that changes the sensor mix, or if a team member owns US field knowledge and can carry those three extra fields.

## Alternatives considered

- **One field per country.** Doubles the input surface and halves the evidence depth on each. Lost on depth.
- **A US Corn Belt field.** Cleaner rent and insurance data, but loses the timing evidence and the safrinha mechanism that make the Cerrado case sharp. Lost on evidence.
