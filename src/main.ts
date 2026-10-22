/**
 * Composition root: fit the world, pick the medium, seed this visit's
 * drawing, and wire what the page allows — hover, tap and keyboard aim
 * to the readout line, zoom, pan, and the scheme toggle that redraws the
 * world in the other medium.
 */
import outlinesJson from './outlines.json';
import { fitToViewport, type Outline, type Point } from './geometry.ts';
import { drawAim, drawScene, type Medium, type Scene } from './draw.ts';
import { QUIET, readoutAt } from './readout.ts';
import { Viewport } from './viewport.ts';

const outlines = outlinesJson as Outline[];

// The per-visit seed: reload, and the world is drawn again from memory.
const seed = Math.floor(Math.random() * 2 ** 31);

const visitedNames = outlines.filter((o) => o.visited).map((o) => o.name);
// Built with DOM calls, not an innerHTML template: country names are data
// and go in as text, never parsed as markup.
const frameEl = document.createElement('div');
frameEl.className = 'map-frame';
const canvas = document.createElement('canvas');
canvas.id = 'map';
canvas.setAttribute('role', 'img');
canvas.setAttribute(
  'aria-label',
  `A hand-drawn world map. ${visitedNames.length} visited countries are inked and hatched; the rest are faint pencil. Zoom with plus and minus, pan with arrow keys, Escape resets; the country under the center mark is named below the map.`,
);
const readout = document.createElement('p');
readout.className = 'readout';
readout.setAttribute('aria-live', 'polite');
readout.textContent = QUIET;
const visitedList = document.createElement('section');
visitedList.className = 'sr-only';
visitedList.setAttribute('aria-label', 'Visited countries');
const list = document.createElement('ul');
for (const name of visitedNames) {
  const item = document.createElement('li');
  item.textContent = name;
  list.append(item);
}
visitedList.append(list);
frameEl.append(canvas, readout, visitedList);
document.querySelector('#app')!.append(frameEl);
const ctx = canvas.getContext('2d')!;

// ---- scheme: pencil on paper / chalk on board -----------------------------
// The <head> script applied any remembered choice before paint; CSS owns
// the page colors. This code only keeps the canvas medium and the toggle
// label in step with the same state.
const darkScheme = matchMedia('(prefers-color-scheme: dark)');
const toggle = document.querySelector<HTMLButtonElement>('#scheme-toggle')!;

function currentMedium(): Medium {
  const pinned = document.documentElement.dataset['scheme'];
  if (pinned === 'pencil' || pinned === 'chalk') return pinned;
  return darkScheme.matches ? 'chalk' : 'pencil';
}

function syncToggleLabel(): void {
  const other = currentMedium() === 'pencil' ? 'chalk' : 'pencil';
  toggle.textContent = `◐ ${other}`;
  toggle.setAttribute('aria-label', `Redraw the map in ${other}`);
}

toggle.hidden = false;
toggle.addEventListener('click', () => {
  const next = currentMedium() === 'pencil' ? 'chalk' : 'pencil';
  document.documentElement.dataset['scheme'] = next;
  try {
    localStorage.setItem('buvau-scheme', next);
  } catch {
    // private mode: the choice just doesn't stick
  }
  syncToggleLabel();
  render();
});
darkScheme.addEventListener('change', () => {
  syncToggleLabel();
  render();
});
syncToggleLabel();

// ---- drawing --------------------------------------------------------------
const viewport = new Viewport();
let scene: Scene | null = null;
// True while the keyboard is steering: the center mark shows and the
// readout names whatever sits under it. Any pointer or blur hands back.
let aiming = false;

function center(): Point {
  return [canvas.clientWidth / 2, canvas.clientHeight / 2];
}

function paint(): void {
  if (!scene) return;
  drawScene(ctx, scene, canvas.clientWidth, canvas.clientHeight);
  if (aiming) {
    drawAim(ctx, scene.medium, center());
    readout.textContent = readoutAt(scene, viewport, center());
  }
}

function render(): void {
  const frame = canvas.parentElement!;
  const width = Math.min(1000, frame.clientWidth - 32);
  const aspect = 0.49; // Equal Earth's frame, Antarctica already gone
  const height = Math.round(width * aspect);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  viewport.resize(width, height);
  const weight = width / 1100;
  scene = {
    countries: fitToViewport(outlines, width, height),
    outlines,
    medium: currentMedium(),
    seed,
    weight,
    microDiameter: 8 * weight,
    transform: viewport.transform,
  };
  paint();
}

function stopAiming(): void {
  if (!aiming) return;
  aiming = false;
  paint();
}

canvas.addEventListener('pointermove', (e) => {
  stopAiming();
  if (!scene || viewport.gesturing) return;
  const rect = canvas.getBoundingClientRect();
  readout.textContent = readoutAt(scene, viewport, [e.clientX - rect.left, e.clientY - rect.top]);
});
canvas.addEventListener('pointerdown', stopAiming);
canvas.addEventListener('blur', stopAiming);
// Tabbing onto the map starts the aim at once; a mouse click focusing it
// does not (no :focus-visible).
canvas.addEventListener('focus', () => {
  if (!canvas.matches(':focus-visible')) return;
  aiming = true;
  paint();
});

viewport.attach(canvas, {
  change: paint,
  tap: (point) => {
    if (scene) readout.textContent = readoutAt(scene, viewport, point);
  },
  key: () => {
    aiming = true;
  },
});
addEventListener('resize', render);
render();
