# Security review — buvau

Date: 2026-10-22 · Scope: the whole repository at `claude/night-security`
(built on `claude/night-maintenance`), including all git history.

## The app in one paragraph

buvau is a **static, single-page website**: a hand-drawn-style world map
that marks the 45 countries the author has visited. All geometry is computed
at build time (`generate/generate.ts`, from the `world-atlas` package) and
committed as `src/outlines.json`. Vite bundles it into `dist/`, and Vercel
serves it at `buvau.ausiejus.lt`. There is **no backend, no API routes, no
server actions, no database, no authentication, no user accounts, no forms,
no file uploads, no cookies, no third-party scripts or network calls at
runtime, and no environment variables**. The only browser storage is one
`localStorage` key (`buvau-scheme`) holding the light/dark preference. All
npm packages are dev dependencies; nothing ships to the browser except the
app's own bundle and self-hosted fonts.

So most of the usual checklist doesn't apply. The attack surface is: what the
browser runs (XSS, framing, headers), what's in the repo and its history
(secrets), and the build toolchain (dependencies).

## Summary

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | Medium | No security headers or CSP on the deployed site | **Fixed** (8477f4d) |
| 2 | Low | Country names written into the page via `innerHTML` | **Fixed** (6e19554) |
| 3 | Low | `.env` and `.vercel/` not git-ignored | **Fixed** (92d31b3) |
| 4 | Low | No automated dependency or security checks (no CI) | Recommendation |
| 5 | Info | The visited-countries list is published personal data | Accepted by design |
| 6 | Info | Vite dev server safe only while bound to localhost | Recommendation |

What was checked and came back clean:

- **Secrets in the repo and its history:** none. All 12 commits on every
  branch were searched for keys, tokens, private keys, JWTs and `.env`
  contents. The one file that has since been deleted,
  `scripts/provision-wizard.sh` (added in f102f96, removed in 961c0ff), is
  an interactive Vercel setup guide. It *prompts* for values and writes
  them to `.env` or GitHub secrets at runtime, but it contains no values
  itself. Nothing needs rotating.
- **Dependencies:** `npm audit` reports 0 vulnerabilities after tonight's
  maintenance PR. All 110 lockfile entries resolve from
  `registry.npmjs.org` with integrity hashes. There are no runtime
  dependencies.
- **Injection, SSRF, open redirects, CSRF:** there is no server, no URL
  handling, no fetch, no redirects and no state-changing requests, so
  none of these can happen.
- **Client storage:** the `localStorage` value is checked against an
  allowlist (`'pencil' | 'chalk'`) before use, both in the inline head
  script and in `src/main.ts`. A tampered value is ignored.
- **Build scripts** (`generate/*.ts`) read fixed paths from
  `node_modules` and write fixed paths. They take no outside input.
  `snapshot.ts` builds SVG by string concatenation, but every
  interpolated value is a number or a hard-coded colour; country names
  never reach the SVG.
- **Supabase / Firebase / RLS:** not used. The repo has no database
  client, config or schema.
- **Logs and responses:** no logging at runtime. The build scripts log
  only counts and sizes.
- **External links:** two footer links (GitHub and ausiejus.lt) open in
  the same tab, so there is no `target="_blank"` reverse-tabnabbing risk.

---

## 1. No security headers or CSP on the deployed site — Medium

- **Location:** deploy configuration. There was no `vercel.json`, so the
  site was served with Vercel's defaults, which add HSTS but no CSP, no
  `X-Frame-Options`/`frame-ancestors`, no `nosniff`, no
  `Referrer-Policy` and no `Permissions-Policy`.
- **Impact:** any page could frame the site (clickjacking is low-value
  here because there's nothing to click into, but framing also enables
  spoofing on the author's personal domain). With no CSP there is no
  second line of defence if markup injection ever became possible
  (see #2). It's also a visible hygiene gap on a public portfolio site,
  for example a poor securityheaders.com grade.
- **Fix (applied):** added `vercel.json` with:
  - `Content-Security-Policy: default-src 'none'; script-src 'self'
    'sha256-…'; style-src 'self' 'sha256-…'; img-src 'self'; font-src
    'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none';
    form-action 'none'; frame-ancestors 'none'; object-src 'none';
    upgrade-insecure-requests`. The inline pre-paint script and the
    inline `<style>` are allowed **by hash**, so no `'unsafe-inline'` is
    needed. Styles that `main.ts`/`viewport.ts` set through the CSSOM
    (`el.style.x = …`) are not covered by `style-src` and keep working.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
    `Referrer-Policy: strict-origin-when-cross-origin`,
    `Permissions-Policy` (camera, microphone, geolocation, payment and USB
    off), `Cross-Origin-Opener-Policy: same-origin`, and
    `Strict-Transport-Security: max-age=63072000; includeSubDomains`.
  - `test/headers.test.ts` (`npm test`) builds the site and checks that
    every inline script and style in `dist/index.html` has its hash in
    the CSP, that there are no inline handlers or `style=` attributes,
    and that the CSP has no unsafe sources. **If you edit the inline
    `<script>` or `<style>` in `index.html`, the test fails and prints
    the new hash to paste into `vercel.json`.**
  - Verified in headless Chromium: the built page, served with these
    headers, renders in both schemes with zero console errors or CSP
    violations, and the no-JS fallback image still loads.
- **Remaining risk:** the headers take effect on the next Vercel
  deploy. After it goes out, check the live response headers once
  (`curl -sI https://buvau.ausiejus.lt`). HSTS `preload` was left out on
  purpose; adding it is a decision for the whole `ausiejus.lt` domain.
- **Confidence:** high that this is a gap, and high that the fix works
  (tested locally under the real header set). Vercel applying
  `vercel.json` headers to a Vite static output is documented behaviour,
  but it was not checked on a live deploy.

## 2. Country names written into the page via `innerHTML` — Low

- **Location:** `src/main.ts` (before 6e19554). An `innerHTML` template
  interpolated `${name}` for every visited country into `<li>` elements.
- **Impact:** the names come from the committed, build-time
  `outlines.json` (Natural Earth via `world-atlas`), so nothing is
  exploitable today. The pattern is still fragile: one name already has
  a markup-significant character (`Côte d'Ivoire`), and if the data ever
  came from a less trusted source (a travel-app export, a URL
  parameter, a future API), a name like `<img src=x onerror=…>` would
  run as script.
- **Fix (applied):** the map frame is now built with `createElement`, and
  names are set through `textContent`. The resulting DOM is identical
  (verified in the browser: 45 list items, same attributes). The CSP from
  #1 now backs this up as well.
- **Confidence:** high.

## 3. `.env` and `.vercel/` not git-ignored — Low

- **Location:** `.gitignore` (it listed only `node_modules/` and
  `dist/`).
- **Impact:** the provisioning wizard that used to be in the repo writes
  secrets to `.env`, and `vercel link` writes project and org IDs to
  `.vercel/`. A careless `git add .` would have committed them to a
  **public** repository.
- **Fix (applied):** `.gitignore` now ignores `.env`, `.env.*` (except
  `.env.example`) and `.vercel/`.
- **Confidence:** high.

## 4. No automated dependency or security checks — Low (recommendation)

- **Location:** the repo has no `.github/workflows/` and no Dependabot or
  Renovate config.
- **Impact:** a new advisory in Vite or another dev dependency only gets
  noticed when someone runs `npm audit` by hand. The risk is limited to
  the build machine and Vercel's builder, because nothing ships to the
  browser, but the build toolchain is a real supply-chain surface.
- **Recommended fix (not applied: it adds CI to a repo that has none, and
  the task rules say not to touch CI):**
  - Add `.github/dependabot.yml` for `npm`, with a weekly schedule and
    dev-dependency updates grouped into one PR.
  - Add a small workflow that runs `npm ci && npm run typecheck && npm
    test && npm audit --audit-level=high` on pull requests.
  - Optionally turn on GitHub secret scanning and push protection (free
    for public repos).
- **Confidence:** high.

## 5. The visited-countries list is published personal data — Info

- **Location:** `data/visited.ts`, `src/outlines.json`,
  `public/snapshot.svg`, `public/og.png`, and the rendered page.
- **Impact:** the site deliberately publishes, under the author's name,
  which countries they have visited. Some combinations (for example
  Israel *and* Palestine, Russia, Belarus) can draw questions at some
  borders, and the data is permanently in a public git history. This is
  the point of the project, so it's noted here only so that it is a
  conscious choice.
- **Fix:** none. If it ever matters, history rewriting would be needed,
  and the data has almost certainly been mirrored already.
- **Confidence:** n/a (a judgement call).

## 6. Vite dev server is safe only while bound to localhost — Info

- **Location:** the `npm run dev` script (`vite`, default host).
- **Impact:** Vite binds to `localhost` by default, which is safe. Running
  `vite --host` on an untrusted network would expose the dev server
  (and past Vite `server.fs` bypass advisories) to the LAN. The
  installed version (7.3.7) has no open advisories.
- **Fix:** keep the default, and don't add `--host` or `server.host:
  true` to committed config.
- **Confidence:** high.

---

## How to re-check

```sh
npm ci
npm run typecheck
npm test          # builds, then checks the CSP hashes and the header set
npm audit
```
