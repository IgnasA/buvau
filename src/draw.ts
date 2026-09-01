/**
 * The two media. Pencil ghost: faint pencil world, visited countries
 * inked and hand-hatched, on paper. Chalk: the same drawing double-drawn
 * in chalk on a board. One function draws a whole scene in either.
 */
import type { Bbox, FittedCountry, Point } from './geometry.ts';
import { closedCurve } from './curve.ts';
import { createRng, wobble } from './wobble.ts';
import type { Outline } from './geometry.ts';

export type Medium = 'pencil' | 'chalk';

export const MEDIA: Record<Medium, { page: string; ink: string; faint: string }> = {
  pencil: { page: '#fbfaf6', ink: '#26323a', faint: '#b9b4a8' },
  chalk: { page: '#191b1f', ink: '#e9e5d7', faint: '#e9e5d7' },
};

export interface Scene {
  countries: FittedCountry[];
  outlines: Outline[];
  medium: Medium;
  /** The per-visit seed; same seed, same drawing. */
  seed: number;
  /** Stroke-weight scale: 1 at ~1100px wide. Zoom does NOT change it. */
  weight: number;
  /** Below this bbox diagonal (px) a country collapses to a micro dot. */
  microDiameter: number;
  /** Viewport transform applied to fitted (unzoomed) pixel space. */
  transform: (p: Point) => Point;
}

/** Closed Catmull-Rom through the wobbled points — the pen never lifts. */
function ringPath(ctx: CanvasRenderingContext2D, points: Point[], tension: number): void {
  ctx.beginPath();
  if (points.length < 3) {
    if (points.length > 0) ctx.arc(points[0]![0], points[0]![1], 2, 0, Math.PI * 2);
    return;
  }
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const { c1, c2, to } of closedCurve(points, tension)) {
    ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], to[0], to[1]);
  }
  ctx.closePath();
}

/** Diagonal hand-hatching across a bbox; caller clips to the ring first. */
function hatch(ctx: CanvasRenderingContext2D, bbox: Bbox, spacing: number, rng: () => number): void {
  const [minX, minY, maxX, maxY] = bbox;
  const span = maxX - minX + (maxY - minY);
  ctx.beginPath();
  for (let offset = -span; offset < span; offset += spacing) {
    ctx.moveTo(minX + offset + (rng() - 0.5) * 2, maxY + (rng() - 0.5) * 2);
    ctx.lineTo(minX + offset + (maxY - minY) + (rng() - 0.5) * 2, minY + (rng() - 0.5) * 2);
  }
  ctx.stroke();
}

function transformBbox(bbox: Bbox, transform: (p: Point) => Point): Bbox {
  const [a, b] = transform([bbox[0], bbox[1]]);
  const [c, d] = transform([bbox[2], bbox[3]]);
  return [a, b, c, d];
}

function drawPencilCountry(
  ctx: CanvasRenderingContext2D,
  rings: Point[][],
  bboxes: Bbox[],
  visited: boolean,
  index: number,
  scene: Scene,
): void {
  const w = scene.weight;
  const { ink, faint } = MEDIA.pencil;
  const rng = createRng(scene.seed + index * 7919);
  for (let r = 0; r < rings.length; r++) {
    const drawn = wobble(rings[r]!, 2.5 * w, (visited ? 1 : 1.6) * w, rng);
    if (visited) {
      ctx.save();
      ringPath(ctx, drawn, 0.6);
      ctx.clip();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.9 * w;
      ctx.globalAlpha = 0.75;
      hatch(ctx, bboxes[r]!, 6.5 * w, createRng(scene.seed + index * 977 + r));
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.7 * w;
      ringPath(ctx, drawn, 0.6);
      ctx.stroke();
    } else {
      ctx.strokeStyle = faint;
      ctx.lineWidth = 1 * w;
      ctx.globalAlpha = 0.6;
      ringPath(ctx, drawn, 0.6);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function drawChalkCountry(
  ctx: CanvasRenderingContext2D,
  rings: Point[][],
  visited: boolean,
  index: number,
  scene: Scene,
): void {
  const w = scene.weight;
  const { ink } = MEDIA.chalk;
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r]!;
    if (visited) {
      ctx.fillStyle = 'rgba(233, 229, 215, 0.22)';
      ringPath(ctx, wobble(ring, 3 * w, 1.5 * w, createRng(scene.seed + index * 131 + r)), 0.6);
      ctx.fill();
    }
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = ink;
      ctx.globalAlpha = visited ? 0.85 : 0.16;
      ctx.lineWidth = 1.1 * w;
      ringPath(
        ctx,
        wobble(ring, 2.5 * w, 1.9 * w, createRng(scene.seed + index * 4451 + r * 17 + pass)),
        0.6,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawMicroDot(
  ctx: CanvasRenderingContext2D,
  centroid: Point,
  visited: boolean,
  scene: Scene,
): void {
  const w = scene.weight;
  const { ink, faint } = MEDIA[scene.medium];
  if (scene.medium === 'pencil') {
    if (visited) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.4 * w;
      ctx.beginPath();
      ctx.arc(centroid[0], centroid[1], 3.4 * w, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(centroid[0], centroid[1], 1.3 * w, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = faint;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(centroid[0], centroid[1], 1.2 * w, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = ink;
    ctx.globalAlpha = visited ? 0.95 : 0.18;
    ctx.beginPath();
    ctx.arc(centroid[0], centroid[1], (visited ? 3 : 1.4) * w, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/** Draw the whole world once, in the scene's medium, through its transform. */
export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const margin = 40;
  scene.countries.forEach((country, i) => {
    const rings = country.rings.map((ring) => ring.map(scene.transform));
    const bboxes = country.bboxes.map((bb) => transformBbox(bb, scene.transform));
    const offCanvas = bboxes.every(
      ([a, b, c, d]) => c < -margin || a > width + margin || d < -margin || b > height + margin,
    );
    if (offCanvas) return;
    const visited = scene.outlines[i]!.visited;
    const zoomedDiameter = Math.max(...bboxes.map(([a, b, c, d]) => Math.hypot(c - a, d - b)));
    if (zoomedDiameter < scene.microDiameter) {
      drawMicroDot(ctx, scene.transform(country.centroid), visited, scene);
    } else if (scene.medium === 'pencil') {
      drawPencilCountry(ctx, rings, bboxes, visited, i, scene);
    } else {
      drawChalkCountry(ctx, rings, visited, i, scene);
    }
  });
}
