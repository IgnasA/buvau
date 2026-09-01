/**
 * The fallback is the baseline: render one fixed-seed pencil-ghost
 * drawing as SVG (served to no-JS visitors) and rasterize it to the
 * OG/social image. Run `npm run snapshot` after `npm run generate`.
 *
 * The seed is the date the visited list was transcribed — this one
 * drawing is pinned forever, while the live page redraws per visit.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { fitToViewport, type Outline } from '../src/geometry.ts';
import { closedCurvePathD } from '../src/curve.ts';
import { createRng, wobble } from '../src/wobble.ts';
import { MEDIA } from '../src/draw.ts';

const SNAPSHOT_SEED = 20260831;
const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 30;

const outlines = JSON.parse(
  readFileSync(new URL('../src/outlines.json', import.meta.url), 'utf8'),
) as Outline[];

const { page, ink, faint } = MEDIA.pencil;
const weight = (WIDTH - MARGIN * 2) / 1100;
const microDiameter = 8 * weight;
const countries = fitToViewport(outlines, WIDTH - MARGIN * 2, HEIGHT - MARGIN * 2);

const shapes: string[] = [];
countries.forEach((country, i) => {
  const outline = outlines[i]!;
  const rng = createRng(SNAPSHOT_SEED + i * 7919);
  if (country.diameter < microDiameter) {
    const [cx, cy] = country.centroid;
    shapes.push(
      outline.visited
        ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(3.4 * weight).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="${(1.4 * weight).toFixed(2)}"/>` +
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.3 * weight).toFixed(1)}" fill="${ink}"/>`
        : `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.2 * weight).toFixed(1)}" fill="${faint}" opacity="0.5"/>`,
    );
    return;
  }
  for (const ring of country.rings) {
    const d = closedCurvePathD(wobble(ring, 2.5 * weight, (outline.visited ? 1 : 1.6) * weight, rng), 0.6);
    shapes.push(
      outline.visited
        ? `<path d="${d}" fill="url(#hatch)" stroke="${ink}" stroke-width="${(1.7 * weight).toFixed(2)}" stroke-linejoin="round"/>`
        : `<path d="${d}" fill="none" stroke="${faint}" stroke-width="${weight.toFixed(2)}" opacity="0.6" stroke-linejoin="round"/>`,
    );
  }
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="A hand-drawn world map; 45 visited countries are inked and hatched, the rest are faint pencil.">
<defs>
<pattern id="hatch" patternUnits="userSpaceOnUse" width="${(6.5 * weight).toFixed(1)}" height="${(6.5 * weight).toFixed(1)}" patternTransform="rotate(45)">
<line x1="0" y1="0" x2="0" y2="${(6.5 * weight).toFixed(1)}" stroke="${ink}" stroke-width="${(0.9 * weight).toFixed(2)}" opacity="0.75"/>
</pattern>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="${page}"/>
<g transform="translate(${MARGIN} ${MARGIN})">
${shapes.join('\n')}
</g>
</svg>`;

mkdirSync(new URL('../public', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/snapshot.svg', import.meta.url), svg);
const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
writeFileSync(new URL('../public/og.png', import.meta.url), png);
console.log(
  `snapshot.svg ${(svg.length / 1024).toFixed(0)} KB, og.png ${(png.length / 1024).toFixed(0)} KB ` +
    `(seed ${SNAPSHOT_SEED}, ${countries.length} countries)`,
);
