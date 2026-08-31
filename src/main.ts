// m1 placeholder: the drawing itself lands in m2 (see tracker/tickets).
import outlines from './outlines.json';

const visitedCount = outlines.filter((o) => o.visited).length;
document.querySelector('#app')!.textContent =
  `buvau — ${visitedCount} of ${outlines.length} countries. The drawing arrives in m2.`;
