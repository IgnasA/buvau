---
title: "m2: The canvas sketch"
label: wayfinder:task
status: open
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
