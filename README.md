# buvau

[![CI](https://github.com/IgnasA/buvau/actions/workflows/ci.yml/badge.svg)](https://github.com/IgnasA/buvau/actions/workflows/ci.yml)

*buvau* — Lithuanian: "I have been."

A world map drawn the way memory draws it: simplified, a little wrong,
redrawn on every visit. The 45 countries I've visited are inked and
hatched; the rest of the world stays faint pencil. Everything is computed
at build time from real Natural Earth geometry — the hand-drawn look is an
algorithm, and the drawing is re-seeded for every viewer.

Live at [buvau.ausiejus.lt](https://buvau.ausiejus.lt) (once shipped).
Planned on the wayfinder map in
[portfolio/tracker/map-pixel-atlas.md](../portfolio/tracker/map-pixel-atlas.md);
build tickets live in [tracker/](tracker/README.md). Terms are defined in
[CONTEXT.md](CONTEXT.md).

## Stack

TypeScript, Vite 7, `d3-geo` + `topojson-client` over `world-atlas`
geometry, `@resvg/resvg-js` for snapshots. No runtime dependencies: the
page is a static bundle.

## Setup

Requires Node 22+ (the generate scripts run `.ts` files directly with Node).

```sh
npm ci
```

## Run

```sh
npm run dev        # Vite dev server
npm run generate   # rebuild src/outlines.json from world-atlas (generate/generate.ts)
npm run snapshot   # render a PNG snapshot of the drawing (generate/snapshot.ts)
```

The list of visited countries is in [data/visited.ts](data/visited.ts).

## Test

There is no linter yet. The checks are:

```sh
npm run typecheck  # tsc --noEmit (strict)
npm run build      # vite build
npm test           # build, then check vercel.json's CSP and security headers
```

The CSP in [vercel.json](vercel.json) allows the inline `<script>` and
`<style>` in `index.html` by hash. If you edit either, `npm test` fails and
prints the new hash to paste in. See
[docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md).

## Deploy

`npm run build` emits a static site to `dist/`, deployed to Vercel with the
domain `buvau.ausiejus.lt` (provisioning is tracked in the portfolio
repo's ticket 019). Security headers are set in `vercel.json`.

## Environment variables

None. The project reads no environment variables.
