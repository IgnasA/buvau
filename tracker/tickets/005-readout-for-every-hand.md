---
title: "Readout for every hand: tap and keyboard"
label: wayfinder:task
status: in-review
assignee: ignas
map: ../../../portfolio/tracker/map-pixel-atlas.md
blocked-by: [4]
---

## Question

The readout line names "whatever country is under the cursor or finger",
but only the mouse could ask it: a tap on a phone left it at `·` (a tap
fires no hover `pointermove`), and keyboard zoom/pan never named
anything. Make the readout reachable by touch and keyboard without adding
chrome.

## Resolution

- `src/readout.ts` — one `readoutAt(scene, viewport, point)` shared by
  hover, tap and keyboard.
- `src/viewport.ts` — tells a tap (press + lift, < 8px travel, one
  finger) from a drag or pinch and reports it; reports keyboard moves.
- `src/draw.ts` — `drawAim`: a small ring at the center while the
  keyboard steers; the readout names what's under it. Any pointer or blur
  hands back to the mouse.
- `npm test` (node:test) added: readout and viewport units.
