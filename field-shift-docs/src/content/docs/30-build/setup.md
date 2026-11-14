---
title: Setup
description: Clean clone to running site, with the versions that were checked.
---

## Prerequisites

| Requirement | Checked version | Note |
|---|---|---|
| Node | 26.12.0 | Even numbered release, 22.23.4 or newer |
| npm | 12.2.1 | Ships with Node |
| Disk | about 400 MB including `node_modules` | Static output is small, the toolchain is not |

Checked 2026-11-10 on Arch Linux, 12 cores.

## Install and run

```sh
cd field-shift-docs
npm install
npm run dev
```

Dev server on http://localhost:4321. The dev server does not serve the `.md` mirrors; use `npm run preview` for those.

## Build

```sh
npm run build
```

Writes `dist/`, the per-page `.md` mirrors, the `llms.txt` Pages section and the link tags. It fails on a broken internal link, a missing `title` and an undefined MDX component.

## Where things live

`src/content/docs/` holds every page, one folder per phase. `astro.config.mjs` holds the title, sidebar and plugin. `src/styles/custom.css` holds the table density rules. `dist/` and the `llms*.txt` files are build output.

## Before any deploy

Change `site`, `title` and the social link in `astro.config.mjs`, or every absolute link in `llms.txt` points at the wrong origin.
