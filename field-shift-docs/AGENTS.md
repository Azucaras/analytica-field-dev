# AGENTS.md

Repository for the Field Shift entry to the NASA Space Apps 2026 challenge, and for the documentation site that carries its research. This file is written for an AI coding agent that opens the repository. It states local rules, not project knowledge. Project knowledge lives in `src/content/docs/`.

## What this project is

A rotation decision support tool for farmers in Brazil, scoped to synthetic fields at Santa Carmem, Mato Grosso, which carry the rotation scenarios, plus two synthetic pilot fields in Tupancireta (RS) and Luis Eduardo Magalhaes (BA) that carry municipal ENSO evidence only (ADR 0001, revision of 2026-11-14). Interactive map, evidence cards, an agent over a read-only schema, voice gated by a noise test. The demo runs on a credential-free path; authenticated NASA products sit behind it.

## Commands

```sh
npm install          # install dependencies
npm run dev          # dev server on http://localhost:4321
npm run build        # static build into dist/, fails on broken internal links
npm run preview      # serve the built site, which is where the .md mirrors live
```

The scaffolder that created this repository also documents a background dev-server mode: `astro dev --background`, with `astro dev stop`, `astro dev status` and `astro dev logs` to manage it. Use it when a long-running server would block the session.

## Hard rules

1. English prose, no em dashes and no en dashes. Portuguese crop terms go in brackets on first use.
2. Never describe a satellite posting as field conditions, and never let a model state pass as a measurement.
3. The agent reads. Nothing persists without an on-screen confirmation.
4. `PROVISIONAL_ABSTENTION_GATE` is provisional. Do not quote it as a validated threshold.
5. The dossier at `public/field-shift-dossier.md` is the source of truth for every number. When a page and the dossier disagree, the page is wrong.

## Layout

- `src/content/docs/` holds every page. One folder per phase: `00-start-here`, `10-research`, `20-design`, `30-build`, `40-reference`.
- `src/styles/custom.css` holds the table density rules. Wide tables are the usual layout failure here.
- `astro.config.mjs` holds the site title, the sidebar groups, the custom stylesheet and the machine-layer plugin.
- `dist/`, `node_modules/` and the generated `llms*.txt` files are build output. Never edit them by hand.

## Editing rules

1. Read the page before editing it. These pages carry the only record of why a decision was taken.
2. One fact lives on one page. Link to it from elsewhere instead of copying it, because a copied fact drifts.
3. A page that states a number or a command states the date and the machine it was checked on.
4. A new page needs a `title` in frontmatter. The sidebar autogenerates from the folder tree, so no navigation file needs editing.
5. Do not hand-write `llms.txt`. The plugin generates it from page content at build time. `scripts/md-mirrors.mjs` runs after the Astro build and writes the per-page `.md` mirrors, the `rel="alternate"` and `rel="describedby"` tags, and the Pages section of `llms.txt`.
6. Keep tables to six columns or fewer. Beyond that the table scrolls sideways on a laptop and stops being readable.

## Where things are documented

`00-start-here` explains the reading paths and the doc map. `10-research` holds the problem, the evidence log, findings and open questions. `20-design` holds the ADRs and the decision log. `30-build` holds architecture, setup and the verification checks. `40-reference` holds the glossary and the agent context page.