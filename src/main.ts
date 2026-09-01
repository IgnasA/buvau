/**
 * Composition root: fit the world, pick the medium, seed this visit's
 * drawing, and wire what the page allows — hover/tap to the readout
 * line, zoom, pan, and the scheme toggle that redraws the world in the
 * other medium.
 */
import outlinesJson from './outlines.json';
import { fitToViewport, hitTest, type Outline } from './geometry.ts';
import { drawScene, type Medium, type Scene } from './draw.ts';
import { Viewport } from './viewport.ts';

const outlines = outlinesJson as Outline[];

// The per-visit seed: reload, and the world is drawn again from memory.
const seed = Math.floor(Math.random() * 2 ** 31);

const visitedNames = outlines.filter((o) => o.visited).map((o) => o.name);
const app = document.querySelector('#app')!;
app.innerHTML = `
  <div class="map-frame">
    <canvas id="map" role="img" aria-label="A hand-drawn world map. ${visitedNames.length} visited countries are inked and hatched; the rest are faint pencil. Zoom with plus and minus, pan with arrow keys, Escape resets."></canvas>
    <p class="readout" aria-live="polite">·</p>
    <section class="sr-only" aria-label="Visited countries">
      <ul>${visitedNames.map((name) => `<li>${name}</li>`).join('')}</ul>
    </section>
  </div>
`;
const canvas = document.querySelector<HTMLCanvasElement>('#map')!;
const readout = document.querySelector<HTMLParagraphElement>('.readout')!;
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
  drawScene(ctx, scene, width, height);
}

canvas.addEventListener('pointermove', (e) => {
  if (!scene || viewport.gesturing) return;
  const rect = canvas.getBoundingClientRect();
  const point = viewport.invert([e.clientX - rect.left, e.clientY - rect.top]);
  const index = hitTest(
    scene.countries,
    point,
    scene.microDiameter / viewport.k,
    8 / viewport.k,
  );
  if (index === null) {
    readout.textContent = '·';
    return;
  }
  const country = outlines[index]!;
  readout.textContent = country.visited ? `${country.name} — visited` : country.name;
});

viewport.attach(canvas, () => {
  if (scene) drawScene(ctx, scene, canvas.clientWidth, canvas.clientHeight);
});
addEventListener('resize', render);
render();
