/**
 * The pen's path: closed Catmull-Rom converted to cubic beziers. Shared
 * by the live canvas renderer and the build-time SVG snapshot so both
 * draw with the same hand.
 */
import type { Point } from './geometry.ts';

export interface BezierSegment {
  c1: Point;
  c2: Point;
  to: Point;
}

/** Control points for a closed smooth curve through `points`. */
export function closedCurve(points: Point[], tension: number): BezierSegment[] {
  const n = points.length;
  const segments: BezierSegment[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    segments.push({
      c1: [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension],
      c2: [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension],
      to: p2,
    });
  }
  return segments;
}

/** The same curve as an SVG path `d` string. */
export function closedCurvePathD(points: Point[], tension: number): string {
  if (points.length < 3) return '';
  const r = (v: number) => Math.round(v * 10) / 10;
  const start = points[0]!;
  const parts = [`M${r(start[0])} ${r(start[1])}`];
  for (const { c1, c2, to } of closedCurve(points, tension)) {
    parts.push(`C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(to[0])} ${r(to[1])}`);
  }
  parts.push('Z');
  return parts.join('');
}
