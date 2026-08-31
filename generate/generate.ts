/**
 * The generator: Natural Earth 1:110m country geometry in, hand-drawable
 * outlines out. Run `npm run generate`; it writes src/outlines.json.
 *
 * The output is deliberately crude — that's the point. A drawing "from
 * memory" is aggressively simplified real geography: exterior borders
 * only, no holes, no islands you wouldn't bother sketching, no
 * Antarctica, and every ring boiled down with Douglas–Peucker until Italy
 * is a dozen-point boot. The browser adds the wobble; this file decides
 * what's left to wobble.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3-geo';
import type { FeatureCollection, Geometry, Position } from 'geojson';
import type { Topology } from 'topojson-specification';
import { visited } from '../data/visited.ts';

/** Douglas–Peucker tolerance, in degrees. ~0.55° keeps countries
 * recognizable but clearly sketched (the "loose" level the prototype
 * settled on). */
const TOLERANCE = 0.55;
/** Rings smaller than this (planar deg², latitude-corrected) are islands
 * nobody draws from memory — dropped, unless they're a country's largest. */
const MIN_RING_AREA = 5;
/** At most this many rings per country: an archipelago is a few blobs. */
const MAX_RINGS = 5;

interface Outline {
  name: string;
  visited: boolean;
  /** [lon, lat] — where the country collapses to a dot when tiny. */
  centroid: Position;
  /** Exterior rings, simplified; [lon, lat] pairs, 2 decimals. */
  rings: Position[][];
}

// ---- geometry helpers -----------------------------------------------------

function perpendicularDistance(p: Position, a: Position, b: Position): number {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p[0]! - a[0]!, p[1]! - a[1]!);
  const t = ((p[0]! - a[0]!) * dx + (p[1]! - a[1]!) * dy) / lengthSq;
  return Math.hypot(p[0]! - (a[0]! + t * dx), p[1]! - (a[1]! + t * dy));
}

function douglasPeucker(points: Position[], tolerance: number): Position[] {
  if (points.length < 3) return points;
  let maxDistance = 0;
  let index = 0;
  const last = points.length - 1;
  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i]!, points[0]!, points[last]!);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }
  if (maxDistance <= tolerance) return [points[0]!, points[last]!];
  return [
    ...douglasPeucker(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...douglasPeucker(points.slice(index), tolerance),
  ];
}

/** A closed ring needs two anchors or DP collapses it; anchor at index 0
 * and the halfway point, simplify each arc, and guarantee ≥3 points. */
function simplifyRing(ring: Position[], tolerance: number): Position[] {
  const half = Math.floor(ring.length / 2);
  const out = [
    ...douglasPeucker(ring.slice(0, half + 1), tolerance).slice(0, -1),
    ...douglasPeucker(ring.slice(half), tolerance).slice(0, -1),
  ];
  if (out.length >= 3) return out;
  const step = Math.ceil(ring.length / 3);
  return ring.filter((_, i) => i % step === 0).slice(0, 3);
}

/** Planar shoelace area in deg², scaled by cos(mean latitude) so a polar
 * sliver doesn't masquerade as a continent. Good enough to rank rings. */
function ringArea(ring: Position[]): number {
  const meanLat = ring.reduce((sum, p) => sum + p[1]!, 0) / ring.length;
  const latCorrection = Math.cos((meanLat * Math.PI) / 180);
  let twiceArea = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    twiceArea += ring[i]![0]! * ring[i + 1]![1]! - ring[i + 1]![0]! * ring[i]![1]!;
  }
  return Math.abs(twiceArea / 2) * latCorrection;
}

/** A ring that wraps the antimeridian (Chukotka, the Aleutians) would
 * draw as a full-width streak; cut it where the longitude jumps and let
 * each side close on itself. */
function splitAtAntimeridian(ring: Position[]): Position[][] {
  const parts: Position[][] = [[]];
  for (let i = 0; i < ring.length; i++) {
    if (i > 0 && Math.abs(ring[i]![0]! - ring[i - 1]![0]!) > 180) parts.push([]);
    parts[parts.length - 1]!.push(ring[i]!);
  }
  const wrapsCleanly =
    parts.length > 1 && Math.abs(ring[0]![0]! - ring[ring.length - 1]![0]!) <= 180;
  if (wrapsCleanly) {
    const tail = parts.pop()!;
    parts[0] = tail.concat(parts[0]!);
  }
  return parts.filter((part) => part.length >= 3);
}

// ---- the pipeline ---------------------------------------------------------

const require = createRequire(import.meta.url);
const topologyPath = require.resolve('world-atlas/countries-110m.json');
const topology = JSON.parse(readFileSync(topologyPath, 'utf8')) as Topology;
const countries = feature(
  topology,
  topology.objects['countries']!,
) as unknown as FeatureCollection<Geometry, { name: string }>;

const visitedByNumeric = new Map(visited.map((c) => [c.numeric, c]));
const matched = new Set<number>();

const outlines: Outline[] = countries.features
  .filter((f) => f.properties.name !== 'Antarctica')
  .map((f) => {
    const numericId = Number(f.id);
    const isVisited = visitedByNumeric.has(numericId);
    if (isVisited) matched.add(numericId);

    const polygons =
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates as Position[][]]
        : f.geometry.type === 'MultiPolygon'
          ? (f.geometry.coordinates as Position[][][])
          : [];

    const exteriorRings = polygons
      .map((polygon) => polygon[0]!) // memory has no holes
      .flatMap(splitAtAntimeridian);
    const areas = exteriorRings.map(ringArea);
    const largest = Math.max(...areas);
    const rings = exteriorRings
      .map((ring, i) => ({ ring, area: areas[i]! }))
      .filter(({ area }) => area === largest || area > MIN_RING_AREA)
      .sort((a, b) => b.area - a.area)
      .slice(0, MAX_RINGS)
      .map(({ ring }) =>
        simplifyRing(ring, TOLERANCE).map(
          (p): Position => [Math.round(p[0]! * 100) / 100, Math.round(p[1]! * 100) / 100],
        ),
      );

    const centroid = geoCentroid(f).map((x) => Math.round(x * 100) / 100) as Position;
    return { name: f.properties.name, visited: isVisited, centroid, rings };
  });

const missing = visited.filter((c) => !matched.has(c.numeric));
if (missing.length > 0) {
  throw new Error(
    `visited countries not found in Natural Earth: ${missing.map((c) => c.code).join(', ')}`,
  );
}

const json = JSON.stringify(outlines);
writeFileSync(new URL('../src/outlines.json', import.meta.url), json);

const totalPoints = outlines.reduce(
  (sum, o) => sum + o.rings.reduce((s, r) => s + r.length, 0),
  0,
);
console.log(
  `outlines.json: ${outlines.length} countries (${matched.size} visited), ` +
    `${totalPoints} points, ${(json.length / 1024).toFixed(0)} KB`,
);
