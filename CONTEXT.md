# CONTEXT

Glossary for buvau. Terms only — no implementation detail.

## The drawing

The map itself: the world rendered as if sketched from memory. It is
computed from real geography, and the tension between "looks hand-drawn"
and "is generated" is the project's point.

## Pencil ghost

The light medium: unvisited countries as faint pencil outlines, visited
countries inked and hand-hatched, on paper.

## Chalk

The dark medium: the same drawing on a chalkboard — shaky double-drawn
chalk lines, visited countries smudged in.

## Scheme toggle

The one control that flips the whole page between pencil ghost and chalk.
Defaults to the system color scheme; the viewer's choice overrides it.

## Per-visit seed

Every page load draws the world slightly differently: the wobble is
seeded fresh per visit. "Redrawn from memory on every visit" is the
page's own caption for this.

## Loose simplification

The level of geometric crudeness the drawing uses: aggressive enough that
shapes read as gestures, gentle enough that countries stay recognizable.
(The rejected coarser level was called "gesture".)

## Micro dot

The mark a country too small to draw collapses into. Zooming in grows a
micro dot back into the country's real shape.

## Readout line

The single fixed line of text that names whatever country is under the
cursor or finger — or, when the keyboard is steering, under the aim mark.
There is no tooltip.

## Aim mark

The small ring with four ticks at the map's center while the keyboard is
steering it. It is the keyboard's cursor, not part of the drawing: it
appears when the map is reached by Tab or moved by a key, and goes away
at the first pointer or when focus leaves.

## Visited

On the drawing's terms: a country my travel app's "been" list contained
when the data file was made. The list is canonical; layovers are not
re-litigated.
