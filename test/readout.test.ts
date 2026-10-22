import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitToViewport, type Outline, type Point } from '../src/geometry.ts';
import type { Scene } from '../src/draw.ts';
import { QUIET, readoutAt } from '../src/readout.ts';
import { Viewport } from '../src/viewport.ts';

const outlines: Outline[] = JSON.parse(
  readFileSync(new URL('../src/outlines.json', import.meta.url), 'utf8'),
);
const WIDTH = 1000;
const HEIGHT = 490;

function setup(): { scene: Scene; viewport: Viewport } {
  const viewport = new Viewport();
  viewport.resize(WIDTH, HEIGHT);
  const weight = WIDTH / 1100;
  const scene: Scene = {
    countries: fitToViewport(outlines, WIDTH, HEIGHT),
    outlines,
    medium: 'pencil',
    seed: 1,
    weight,
    microDiameter: 8 * weight,
    transform: viewport.transform,
  };
  return { scene, viewport };
}

/** Where a country's centroid lands on the unzoomed canvas. */
function centroidOf(scene: Scene, name: string): Point {
  const index = outlines.findIndex((o) => o.name === name);
  assert.notEqual(index, -1, `${name} is in outlines.json`);
  return scene.countries[index]!.centroid;
}

test('names a visited country with the visited mark', () => {
  const { scene, viewport } = setup();
  assert.equal(outlines.find((o) => o.name === 'Lithuania')!.visited, true, 'fixture assumption: Lithuania is visited');
  assert.equal(readoutAt(scene, viewport, centroidOf(scene, 'Lithuania')), 'Lithuania — visited');
});

test('names an unvisited country plainly', () => {
  const { scene, viewport } = setup();
  const brazil = outlines.find((o) => o.name === 'Brazil')!;
  assert.equal(brazil.visited, false, 'fixture assumption: Brazil is not on the visited list');
  assert.equal(readoutAt(scene, viewport, centroidOf(scene, 'Brazil')), 'Brazil');
});

test('open sea stays quiet', () => {
  const { scene, viewport } = setup();
  // Far western edge of the frame at the equator: open Pacific.
  assert.equal(readoutAt(scene, viewport, [WIDTH * 0.03, HEIGHT * 0.5]), QUIET);
});

test('reads through the zoom: the center names what was zoomed into', () => {
  const { scene, viewport } = setup();
  const [bx, by] = centroidOf(scene, 'Brazil');
  // Pan Brazil's centroid to the canvas center, then zoom in on the center
  // the way the + key does.
  viewport.panBy(WIDTH / 2 - bx, HEIGHT / 2 - by);
  viewport.zoomAt(WIDTH / 2, HEIGHT / 2, 4);
  assert.equal(viewport.k, 4);
  assert.equal(readoutAt(scene, viewport, [WIDTH / 2, HEIGHT / 2]), 'Brazil');
});
