---
title: "m3: Degradation and accessibility"
label: wayfinder:task
status: closed
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

## Resolution

Shipped and pushed:

- `generate/snapshot.ts` (`npm run snapshot`) renders the fixed-seed
  pencil-ghost drawing as `public/snapshot.svg` (102 KB, no-JS visitors
  only) and rasterizes `public/og.png` (152 KB, 1200×630) via resvg.
  Seed 20260831 — the day the visited list was transcribed; that one
  drawing is pinned while the live page redraws per visit. A shared
  `src/curve.ts` gives the SVG and the canvas the same Catmull-Rom hand;
  hatching becomes an SVG pattern.
- `<noscript>` serves the snapshot with alt text and the count line — a
  complete page, not an apology.
- sr-only visited-countries list (45 items) beside the canvas; canvas is
  `role="img"` with a descriptive label that also teaches the keys.
- Canvas is focusable (visible focus ring): `+`/`−` zoom at center,
  arrows pan, Escape resets — verified live alongside wheel/drag.
- Reduced motion: nothing animates by design; nothing to gate.

Caveats recorded honestly: touch verified via pointer emulation only — a
real-phone pass rides with m4's quality-bar measurement; m4 must also add
the `og:image` meta tags pointing at og.png.

m4 (page chrome and launch) is unblocked.
