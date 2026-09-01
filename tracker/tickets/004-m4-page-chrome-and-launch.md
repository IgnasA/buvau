---
title: "m4: Page chrome and launch"
label: wayfinder:task
status: closed
assignee: ignas
map: ../../../portfolio/tracker/map-pixel-atlas.md
blocked-by: [3]
---

## Question

The Editorial composition and the bar:

- Newsreader header block (name, the intro sentence carrying the count
  and "redrawn on every visit"), wide map, serif italic readout line,
  mono footer: source · ausiejus.lt.
- **Scheme toggle**: quiet control flipping the whole page between
  pencil-on-paper and chalk-on-board; defaults to system scheme,
  override persisted, no flash on load.
- Quality bar (inherited from the portfolio, both schemes): AA contrast,
  LCP < 1.5s, CLS 0 (per-visit seed provably costless here), ≤250KB
  first load, Lighthouse ≥95.
- Launch: live at buvau.ausiejus.lt (needs portfolio ticket 019 done),
  favicon/meta/canonical, OG image from m3.

Done when the bar is measured and met in both schemes and the URL is
live. The portfolio-side exhibit block is the portfolio tracker's ticket
023 and follows this.

## Resolution

Shipped, deployed, measured. **https://buvau.ausiejus.lt is live in its
final form.**

- **Editorial chrome**: Newsreader header (name + the intro sentence
  carrying the count and "redrawn on every visit"), wide map, serif
  italic readout, mono footer (source · ausiejus.lt).
- **Scheme toggle** (◐): pins pencil or chalk, defaults to system,
  choice persisted in localStorage, applied pre-paint (no flash) —
  verified across reloads.
- **Fonts**: first Lighthouse run caught the render-blocking Google
  Fonts stylesheet (LCP 3.6s); switched to self-hosted latin woff2
  subsets (22+24 KB) with `font-display: optional` + preload — no
  render block, no late swap, CLS stays 0 by construction.
- **Meta**: canonical, description, OG (og.png from m3), twitter card,
  SVG favicon.
- **The bar, measured on the live URL** (Lighthouse 13.4.1, mobile):
  **100 / 100 / 100 / 100**, FCP 1.3s, **LCP 1.4s** (< 1.5s), **CLS 0**,
  total transfer **69 KiB** (≤ 250 KB). AA contrast verified by
  computation for both schemes (ink 12.6:1 / 13.7:1, secondary 5.6:1 /
  6.9:1) and by the accessibility audit.
- Mobile layout verified at 375px (no horizontal overflow, pinch-ready
  canvas); the one open cosmetic: a pass on Ignas's real phone.

The buvau tracker is done — the map's last ticket is the portfolio-side
exhibit block.
