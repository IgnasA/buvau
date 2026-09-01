/**
 * Zoom and pan: wheel, pinch, drag, double-click reset. Owns the
 * transform; the drawing and hit-testing borrow it. Stroke weight is
 * deliberately not scaled by zoom — leaning into a drawing, not scaling
 * an image.
 */
import type { Point } from './geometry.ts';

const MAX_ZOOM = 14;

export class Viewport {
  k = 1;
  private tx = 0;
  private ty = 0;
  private width = 0;
  private height = 0;
  private pointers = new Map<number, Point>();

  /** True mid-drag/pinch; hover stays quiet while the hand is moving. */
  get gesturing(): boolean {
    return this.pointers.size > 0;
  }

  transform = (p: Point): Point => [p[0] * this.k + this.tx, p[1] * this.k + this.ty];

  /** Canvas-space point → fitted (unzoomed) space, for hit-testing. */
  invert = (p: Point): Point => [(p[0] - this.tx) / this.k, (p[1] - this.ty) / this.k];

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.clamp();
  }

  reset(): void {
    this.k = 1;
    this.tx = 0;
    this.ty = 0;
  }

  zoomAt(cx: number, cy: number, factor: number): void {
    const next = Math.min(MAX_ZOOM, Math.max(1, this.k * factor));
    const real = next / this.k;
    this.tx = cx - (cx - this.tx) * real;
    this.ty = cy - (cy - this.ty) * real;
    this.k = next;
    this.clamp();
  }

  panBy(dx: number, dy: number): void {
    this.tx += dx;
    this.ty += dy;
    this.clamp();
  }

  private clamp(): void {
    this.tx = Math.min(this.width * 0.6, Math.max(-this.width * (this.k - 0.4), this.tx));
    this.ty = Math.min(this.height * 0.6, Math.max(-this.height * (this.k - 0.4), this.ty));
  }

  /** Wire wheel/pointer/double-click on the canvas; onChange = redraw. */
  attach(canvas: HTMLCanvasElement, onChange: () => void): void {
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        this.zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0022));
        onChange();
      },
      { passive: false },
    );

    const pointers = this.pointers;
    let pinchStart: { distance: number; k: number } | null = null;

    canvas.addEventListener('pointerdown', (e) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // pointer already gone (fast tap) — the map just doesn't pan
      }
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()] as [Point, Point];
        pinchStart = { distance: Math.hypot(a[0] - b[0], a[1] - b[1]), k: this.k };
      }
    });
    const release = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinchStart = null;
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    canvas.addEventListener('pointermove', (e) => {
      const previous = pointers.get(e.pointerId);
      if (!previous) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1) {
        this.panBy(e.clientX - previous[0], e.clientY - previous[1]);
        onChange();
      } else if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()] as [Point, Point];
        const rect = canvas.getBoundingClientRect();
        const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const cx = (a[0] + b[0]) / 2 - rect.left;
        const cy = (a[1] + b[1]) / 2 - rect.top;
        const target = Math.min(MAX_ZOOM, Math.max(1, (pinchStart.k * distance) / pinchStart.distance));
        this.zoomAt(cx, cy, target / this.k);
        onChange();
      }
    });

    canvas.addEventListener('dblclick', () => {
      this.reset();
      onChange();
    });

    // Keyboard: the canvas is focusable; + / − zoom at center, arrows
    // pan, Escape backs all the way out.
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', (e) => {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const pan = 48;
      switch (e.key) {
        case '+':
        case '=':
          this.zoomAt(cx, cy, 1.3);
          break;
        case '-':
        case '_':
          this.zoomAt(cx, cy, 1 / 1.3);
          break;
        case 'ArrowLeft':
          this.panBy(pan, 0);
          break;
        case 'ArrowRight':
          this.panBy(-pan, 0);
          break;
        case 'ArrowUp':
          this.panBy(0, pan);
          break;
        case 'ArrowDown':
          this.panBy(0, -pan);
          break;
        case 'Escape':
          this.reset();
          break;
        default:
          return;
      }
      e.preventDefault();
      onChange();
    });
  }
}
