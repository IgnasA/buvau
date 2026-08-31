---
title: "m1: Generator and data"
label: wayfinder:task
status: open
assignee:
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
