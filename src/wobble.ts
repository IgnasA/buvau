/**
 * The hand. Deterministic per (seed, country): the same seed redraws the
 * same drawing, and a fresh seed per visit is what "redrawn from memory
 * on every visit" means.
 */
import type { Point } from './geometry.ts';

/** mulberry32 — tiny, seedable, plenty random for a shaky pen. */
export function createRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxDiagonal(points: Point[]): number {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

/**
 * Misremember a ring: three low-frequency harmonics drift the proportions
 * (the shape you'd confidently draw wrong), per-vertex jitter shakes the
 * pen. Both damped on small shapes so dense regions stay legible.
 */
export function wobble(
  points: Point[],
  drift: number,
  jitter: number,
  rng: () => number,
): Point[] {
  const damping = Math.min(1, Math.max(0.18, boxDiagonal(points) / 350));
  const driftAmp = drift * damping;
  const jitterAmp = jitter * Math.min(1, Math.max(0.4, damping * 2));

  const harmonics: Array<[number, number, number, number, number, number]> = [];
  for (let k = 1; k <= 3; k++) {
    harmonics.push([
      (driftAmp * rng()) / k, Math.PI * 2 * k, Math.PI * 2 * rng(),
      (driftAmp * rng()) / k, Math.PI * 2 * k, Math.PI * 2 * rng(),
    ]);
  }

  const n = points.length;
  return points.map(([x, y], i) => {
    const t = i / n;
    let dx = (rng() - 0.5) * 2 * jitterAmp;
    let dy = (rng() - 0.5) * 2 * jitterAmp;
    for (const [ax, fx, px, ay, fy, py] of harmonics) {
      dx += ax * Math.sin(fx * t + px);
      dy += ay * Math.sin(fy * t + py);
    }
    return [x + dx, y + dy];
  });
}
