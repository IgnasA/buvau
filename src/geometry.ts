/**
 * Projection and hit-testing: the sober half of the drawing. Everything
 * here is exact; wobble.ts is where the hand comes in.
 */
import type { Position } from 'geojson';

export interface Outline {
  name: string;
  visited: boolean;
  centroid: Position;
  rings: Position[][];
}

export type Point = [number, number];
export type Bbox = [minX: number, minY: number, maxX: number, maxY: number];

export interface FittedCountry {
  rings: Point[][];
  bboxes: Bbox[];
  centroid: Point;
  /** Largest ring's bbox diagonal, px — decides micro-dot collapse. */
  diameter: number;
}

// Equal Earth (Šavrič, Patterson & Jenny 2018), the projection the
// prototype locked. Input degrees, output abstract units, y down.
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const RAD = Math.PI / 180;

export function equalEarth(lon: number, lat: number): Point {
  const theta = Math.asin(M * Math.sin(lat * RAD));
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  return [
    (lon * RAD * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))),
    -theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)),
  ];
}

/** Project every outline and scale the world to fit a width×height box. */
export function fitToViewport(
  outlines: Outline[],
  width: number,
  height: number,
): FittedCountry[] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const projected = outlines.map((o) =>
    o.rings.map((ring) =>
      ring.map(([lon, lat]) => {
        const p = equalEarth(lon!, lat!);
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
        return p;
      }),
    ),
  );
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;
  const toPx = (p: Point): Point => [
    (p[0] - minX) * scale + offsetX,
    (p[1] - minY) * scale + offsetY,
  ];

  return outlines.map((o, i) => {
    const rings = projected[i]!.map((ring) => ring.map(toPx));
    const bboxes = rings.map((ring): Bbox => {
      let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
      for (const [x, y] of ring) {
        if (x < a) a = x;
        if (x > c) c = x;
        if (y < b) b = y;
        if (y > d) d = y;
      }
      return [a, b, c, d];
    });
    const centroidP = equalEarth(o.centroid[0]!, o.centroid[1]!);
    return {
      rings,
      bboxes,
      centroid: toPx(centroidP),
      diameter: Math.max(...bboxes.map((bb) => Math.hypot(bb[2] - bb[0], bb[3] - bb[1]))),
    };
  });
}

function pointInRing(point: Point, ring: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Which country is under `point`? Micro countries (collapsed to a dot)
 * hit within `microRadius` of their centroid; drawn ones by ray-cast
 * against their undistorted rings — the wobble is smaller than a fingertip.
 */
export function hitTest(
  countries: FittedCountry[],
  point: Point,
  microDiameter: number,
  microRadius: number,
): number | null {
  const slack = 4;
  for (let i = 0; i < countries.length; i++) {
    const c = countries[i]!;
    if (c.diameter < microDiameter) {
      if (Math.hypot(point[0] - c.centroid[0], point[1] - c.centroid[1]) < microRadius) return i;
      continue;
    }
    for (let r = 0; r < c.rings.length; r++) {
      const [a, b, cx, d] = c.bboxes[r]!;
      if (point[0] < a - slack || point[0] > cx + slack || point[1] < b - slack || point[1] > d + slack) continue;
      if (pointInRing(point, c.rings[r]!)) return i;
    }
  }
  return null;
}
