---
title: "m1: Generator and data"
label: wayfinder:task
status: closed
assignee: ignas
map: ../../../portfolio/tracker/map-pixel-atlas.md
blocked-by: []
---

## Question

Stand up the repo's substance: Vite + vanilla TypeScript scaffold, and the
build-time generator an employer should hit in one hop.

- `data/visited.ts` (or json): the 45 alpha-2 codes from the visited-list
  ticket, with the layover-rule comment; Kosovo stays out unless Ignas
  says otherwise.
- `generate/` — the Node/TS generator: world-atlas 110m → exterior rings,
  antimeridian split, hole & sub-5-deg² island drop, Antarctica dropped,
  closed-ring Douglas-Peucker at the "loose" (~0.55°) tolerance →
  `outlines.json` (~60KB, ISO-numeric keyed, names + centroids + visited
  flags). Rewrite the prototype's `gen2.mjs` properly (the prototype on
  the portfolio repo's `prototype/rasterization` branch is the primary
  source, not code to copy).
- `CONTEXT.md` seeded with the effort's terms: pencil ghost, chalk,
  gesture/loose, per-visit seed, readout line, micro dot.
- README already drafted; keep it honest as the code lands.

Done when `npm run generate` produces outlines.json deterministically and
the repo reads clean top-to-bottom.

## Resolution

Shipped in commit 1fb2ee7:

- Vite + vanilla TypeScript scaffold; Node 26 runs the TS generator
  natively (`erasableSyntaxOnly`), no build step for it.
- `data/visited.ts` — the canonical 45 with alpha-2 + ISO-numeric codes
  and the layover-rule comment.
- `generate/generate.ts` — clean rewrite of the prototype: exterior rings
  only, antimeridian split, hole/island/Antarctica drops, closed-ring
  Douglas–Peucker at 0.55°, rounded to 2dp; validates every visited code
  matched a Natural Earth feature (throws otherwise). Output
  `src/outlines.json`: 176 countries, 2,498 points, 47 KB — verified
  byte-identical across runs.
- `CONTEXT.md` seeded (the drawing, pencil ghost, chalk, scheme toggle,
  per-visit seed, loose simplification, micro dot, readout line,
  visited).
- `npm run typecheck` and `npm run build` both green; built JS including
  the embedded outlines is 49 KB (16.8 KB gzipped) — far under the 250 KB
  budget before the map code even exists.

m2 (the canvas sketch) is unblocked.
