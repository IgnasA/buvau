/**
 * The CSP in vercel.json allows the page's inline <script> and <style> by
 * hash. Edit either block in index.html and the hash goes stale, the
 * browser refuses it, and the live page breaks silently. This test reads
 * the built page (run `npm run build` first; `npm test` does) and fails
 * with the hash to paste in.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

interface VercelConfig {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
}

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const config = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
) as VercelConfig;

const siteHeaders = new Map(
  config.headers.find((rule) => rule.source === '/(.*)')!.headers.map((h) => [h.key, h.value]),
);
const csp = siteHeaders.get('Content-Security-Policy') ?? '';

function directive(name: string): string[] {
  const found = csp
    .split(';')
    .map((d) => d.trim().split(/\s+/))
    .find(([key]) => key === name);
  return found ? found.slice(1) : [];
}

function sha256(source: string): string {
  return `'sha256-${createHash('sha256').update(source).digest('base64')}'`;
}

test('every inline <script> in the built page is allowed by hash', () => {
  // Inline = a <script> with no src attribute.
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(inline.length > 0, 'expected the pre-paint scheme script');
  for (const [, body] of inline) {
    assert.ok(directive('script-src').includes(sha256(body!)), `add ${sha256(body!)} to script-src`);
  }
});

test('every inline <style> in the built page is allowed by hash', () => {
  for (const [, body] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    assert.ok(directive('style-src').includes(sha256(body!)), `add ${sha256(body!)} to style-src`);
  }
});

test('the built page has no inline event handlers or style attributes', () => {
  // Hash-based CSP does not cover these; they would be blocked.
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /\sstyle\s*=/i);
});

test('the CSP never falls back to unsafe sources', () => {
  assert.doesNotMatch(csp, /'unsafe-inline'|'unsafe-eval'|\*/);
  assert.deepEqual(directive('default-src'), ["'none'"]);
  assert.deepEqual(directive('frame-ancestors'), ["'none'"]);
  assert.deepEqual(directive('object-src'), ["'none'"]);
});

test('baseline hardening headers are set for every path', () => {
  assert.equal(siteHeaders.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(siteHeaders.get('X-Frame-Options'), 'DENY');
  assert.ok(siteHeaders.get('Referrer-Policy'));
  assert.match(siteHeaders.get('Strict-Transport-Security') ?? '', /max-age=\d{7,}/);
});
