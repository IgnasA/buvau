/**
 * What the readout line says about a point on the canvas. One answer for
 * every hand: the cursor's hover, a finger's tap, and the keyboard's
 * aim at the center of the map all ask the same question here.
 */
import { hitTest, type Point } from './geometry.ts';
import type { Scene } from './draw.ts';
import type { Viewport } from './viewport.ts';

/** The readout at rest, and over open sea. */
export const QUIET = '·';

/** Readout text for a canvas-space point (CSS px, top-left origin). */
export function readoutAt(scene: Scene, viewport: Viewport, point: Point): string {
  const index = hitTest(
    scene.countries,
    viewport.invert(point),
    scene.microDiameter / viewport.k,
    8 / viewport.k,
  );
  if (index === null) return QUIET;
  const country = scene.outlines[index]!;
  return country.visited ? `${country.name} — visited` : country.name;
}
