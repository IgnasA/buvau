---
title: "m3: Degradation and accessibility"
label: wayfinder:task
status: open
assignee: ignas
map: ../../../portfolio/tracker/map-pixel-atlas.md
blocked-by: [2]
---

## Question

The fallback is the baseline:

- Build-time **fixed-seed SVG snapshot** of the pencil-ghost map: served
  in `<noscript>` with the count line, and exported as the OG/social
  image.
- sr-only, keyboard-reachable list of the 45 visited countries; canvas
  carries proper aria labelling.
- Keyboard: `+`/`−` zoom, arrow-key pan; focus states visible.
- Touch polish: pinch/drag/tap verified on a real phone; no page-scroll
  fights.
- `prefers-reduced-motion` honored by anything that moves (nothing
  ambient exists by design; keep it that way or gate it).

Done when the page with JS disabled is complete and beautiful, and a
screen-reader pass reads name, translation, count, and the country list.
