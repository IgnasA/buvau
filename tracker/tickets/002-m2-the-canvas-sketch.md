---
title: "m2: The canvas sketch"
label: wayfinder:task
status: closed
assignee: ignas
map: ../../../portfolio/tracker/map-pixel-atlas.md
blocked-by: [1]
---

## Question

The drawing itself, production-grade: canvas pencil-ghost renderer per the
locked recipe (Equal Earth, size-damped 3-harmonic drift + jitter,
Catmull-Rom, hand-hatch fills for visited, faint pencil for the rest,
dot-that-grows for small countries), **per-visit seed**, zoom/pan
(wheel + pinch + drag, clamped, double-click reset), hover/tap feeding the
fixed readout line.

The chalk treatment ships here too (same drawing, board palette) behind
the scheme toggle's plumbing — the toggle's UI lands with m4, but the
renderer must already draw both media.

Deploy note: once portfolio ticket 019 (provisioning) is done, this
milestone's end state is visible at buvau.ausiejus.lt.

Done when the sketch bench's feel is reproduced in typed, clean code with
no bench chrome.

## Resolution

Shipped in commit f102f96, pushed to origin:

- `src/geometry.ts` — Equal Earth projection, viewport fitting, ray-cast
  hit-testing against the undistorted rings (the wobble is smaller than a
  fingertip).
- `src/wobble.ts` — seeded mulberry32 + the misremembering: 3-harmonic
  low-frequency drift and per-vertex jitter, damped by shape size.
- `src/draw.ts` — both media as one `drawScene`: pencil ghost (faint
  world, inked + hand-hatched visited) and chalk (double-drawn lines,
  smudged fills); micro dots below ~8px that grow back into real shapes
  under zoom; off-canvas countries skipped.
- `src/viewport.ts` — zoom/pan owner: wheel, pinch, drag, double-click
  reset, clamped 1–14×; stroke weight deliberately not zoom-scaled.
- `src/main.ts` — composition: per-visit seed (`Math.random` once),
  medium follows `prefers-color-scheme` live (toggle UI is m4's),
  hover/tap → readout line, hover quiet during gestures.

Verified in the browser: chalk under dark scheme, pencil under light,
full-size fit (a flex-sizing bug found and fixed), hover names countries
correctly at rest and under zoom, double-click resets. Typecheck + build
green; bundle 56.5 KB (20.3 KB gzipped).

m3 (degradation and accessibility) is unblocked.
