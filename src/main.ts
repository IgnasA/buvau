/**
 * Composition root: fit the world, pick the medium, seed this visit's
 * drawing, and wire the three interactions the map allows — hover/tap to
 * the readout line, zoom, pan. Page chrome (header, footer, the scheme
 * toggle's UI) lands in m4; this file already draws both media.
 */
import outlinesJson from './outlines.json';
import { fitToViewport, hitTest, type Outline } from './geometry.ts';
import { drawScene, MEDIA, type Medium, type Scene } from './draw.ts';
import { Viewport } from './viewport.ts';

const outlines = outlinesJson as Outline[];

// The per-visit seed: reload, and the world is drawn again from memory.
const seed = Math.floor(Math.random() * 2 ** 31);

const app = document.querySelector('#app')!;
app.innerHTML = `
  <div class="map-frame">
    <canvas id="map" aria-label="A hand-drawn world map of visited countries"></canvas>
    <p class="readout" aria-live="polite">·</p>
  </div>
`;
const canvas = document.querySelector<HTMLCanvasElement>('#map')!;
const readout = document.querySelector<HTMLParagraphElement>('.readout')!;
const ctx = canvas.getContext('2d')!;

const darkScheme = matchMedia('(prefers-color-scheme: dark)');
let medium: Medium = darkScheme.matches ? 'chalk' : 'pencil';
darkScheme.addEventListener('change', (e) => {
  medium = e.matches ? 'chalk' : 'pencil';
  render();
});

const viewport = new Viewport();
let scene: Scene | null = null;

function render(): void {
  const frame = canvas.parentElement!;
  const width = Math.min(1000, frame.clientWidth);
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
    medium,
    seed,
    weight,
    microDiameter: 8 * weight,
    transform: viewport.transform,
  };
  document.body.style.background = MEDIA[medium].page;
  document.body.style.color = MEDIA[medium].ink;
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
