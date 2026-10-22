import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTap, Viewport } from '../src/viewport.ts';

test('a press that barely moves is a tap; a drag is not', () => {
  assert.equal(isTap([100, 100], [100, 100]), true);
  assert.equal(isTap([100, 100], [104, 105]), true);
  assert.equal(isTap([100, 100], [108, 100]), false);
  assert.equal(isTap([100, 100], [130, 90]), false);
});

test('invert undoes transform at any zoom', () => {
  const v = new Viewport();
  v.resize(1000, 490);
  v.zoomAt(300, 200, 3);
  v.panBy(-40, 25);
  const p: [number, number] = [412.5, 133.25];
  const [x, y] = v.invert(v.transform(p));
  assert.ok(Math.abs(x - p[0]) < 1e-9 && Math.abs(y - p[1]) < 1e-9);
});

test('zoom is clamped between 1x and 14x and keeps its anchor still', () => {
  const v = new Viewport();
  v.resize(1000, 490);
  v.zoomAt(500, 245, 0.2);
  assert.equal(v.k, 1);
  const before = v.invert([500, 245]);
  v.zoomAt(500, 245, 100);
  assert.equal(v.k, 14);
  const after = v.invert([500, 245]);
  assert.ok(Math.abs(before[0] - after[0]) < 1e-9 && Math.abs(before[1] - after[1]) < 1e-9);
});
