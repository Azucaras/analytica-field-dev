# Hackathon App Docs

A documentation site that carries the research phase and the build phase of a hackathon app in one place, readable on a page by the team and as plain text by AI agents.

Built with Astro 7.4.9 and Starlight, with `starlight-llms-txt` 0.12.0 generating the machine layer.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
```

## Build it

```sh
npm run build    # writes dist/
npm run preview  # serves dist/ on http://localhost:4321
```

The build writes `dist/llms.txt`, `dist/llms-full.txt` and `dist/llms-small.txt` from the page content. Never edit those by hand.

## What is inside

| Folder | Holds |
|---|---|
| `00-start-here` | Reading paths per role, and the doc map |
| `10-research` | Problem statement, evidence log, findings, open questions |
| `20-design` | Architecture Decision Records and the decision log |
| `30-build` | Architecture, setup, run and verify |
| `40-reference` | Glossary and the agent context page |

`AGENTS.md` at the root is the entry point for a coding agent.

## Before the first deploy

Set `site` in `astro.config.mjs` to the deployed URL and replace the GitHub link in the `social` array. The build uses `site` to write absolute links into `llms.txt`.

## Deploy to a free host

The build is a static folder, so any static host works. Pick one on day one, because the base path has to match `site`.

```sh
# Vercel
npx vercel login
npx vercel deploy --prod

# GitHub Pages: push, then set the repository Pages source to GitHub Actions
# Netlify
npx netlify-cli deploy --prod --dir=dist
```

The failure path, in the order to relax settings, is on the verify page: `src/content/docs/30-build/run-and-verify.md`.
