# Verifier brief (V1)

You verify a finished report against its evidence. You do not rewrite it.

## Targets

Assembly: `/run/media/carloshnp/D/Programming/analytica-field-dev/outputs/field-shift.md`
Subsection sources for tracing: `/run/media/carloshnp/D/Programming/analytica-field-dev/outputs/sections/subsections/`
Evidence packs: `/run/media/carloshnp/D/Programming/analytica-field-dev/research/` (T1 in `nasa-data/`, T2 in `sources/`, T3 in `farmers-us/`, T4 in `farmers-br/`, T5 in `pressures/`, T6 in `site-prior-art/`, challenge text in `challenge/`)

Output: `/run/media/carloshnp/D/Programming/analytica-field-dev/outputs/.drafts/verification.md`

## What to check, in this order

1. Every number, price, date, resolution, cadence and latency in the report traces to a pack row or a cited URL. List each failure with the report line, the claimed value, and what the pack actually says.
2. Every URL in the body resolves to the source it claims to be. Flag a link that points at a different product, a dead page, or a wrong host.
3. Every basis label (`measured`, `computed`, `documented`, `recalled`) matches how the number was obtained. A number quoted from a product page labelled `measured` is a finding.
4. Recompute every aggregate: word counts, driver counts, source counts, any percentage the report states. Pool from the files rather than trusting a per-section figure.
5. Check the executed-versus-planned split in S9 against what the packs record as actually run. A component described as working that only the plan proposed is a FATAL.
6. Check the prose contract mechanically: em and en dash counts by file, one idea per sentence, no process notes, terms explained at first use.
7. Check that no claim of a 2026 weight, quota or rule appears where the packs say unconfirmed.

## Severity

FATAL: a wrong number, a fabricated claim, a component described as working that is not, a link to the wrong source, a missing basis label on a load-bearing figure.
MAJOR: an aggregate that does not recompute, a stale value from an earlier draft, a term used before explanation, an unconfirmed item stated as settled.
MINOR: style, ordering, awkward phrasing.

## Output format

A table: `id | severity | report location | finding | evidence | suggested fix`. Then a short `## Counts` block with totals per severity, and `## What verified clean` naming the sections that passed and the checks you ran against them.

Be specific enough that a fixer can act without reading the whole report. State the check you ran for each finding, and if a check was impossible, say so rather than passing the item.
