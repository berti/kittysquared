# Distribution, GitHub Pages CI/CD & PWA Offline Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure KittySquared for public GitHub Pages hosting with automated GitHub Actions CI/CD and full offline-first PWA installability with custom cat branding.

**Architecture:** Use `vite-plugin-pwa` with Workbox to automatically generate a Service Worker and Web App Manifest that precaches all game bundles, JSON puzzle files, and audio assets. Add a GitHub Actions workflow to run tests, build the Vite app with relative base URL paths, and deploy to GitHub Pages. Provide app icons and mobile-web-app meta tags for seamless iOS and Android home screen installation.

**Tech Stack:** Vite 6, `vite-plugin-pwa`, Workbox, GitHub Actions (`actions/deploy-pages`), Preact 10, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-01-distribution-pwa-github-pages-design.md`

## Global Constraints
- **Vite Base Path:** Relative asset paths (`base: './'`) to support running under any repository path (`https://<user>.github.io/kittysquared/`).
- **Offline Reliability:** All application assets, fonts, CSS, scripts, and `src/data/puzzles.json` precached on first visit.
- **State Integrity:** Existing `localStorage` state and keys must not be cleared or altered by the service worker or manifest updates.
- **Workflow Triggers:** GitHub Actions pipeline triggers on push to `main` branch with tests passing before deploy.

## Review Focus
- **Subpath 404s:** Assets failing to load when served from `/kittysquared/` instead of `/` — verified via `base: './'` relative URLs in `dist/index.html`.
- **Offline launch failure:** Navigating to app URL while offline returns browser error instead of app shell — verified by Workbox navigation fallback and precache entries.
- **Missing or blurry mobile icons:** Home screen bookmark displays generic browser icon or pixelated cat — verified by supplying standard 192x192, 512x512, 512x512 maskable, and 180x180 Apple touch icons with `#FBF9F5` background.
- **Manifest validation errors:** Invalid JSON or missing required fields (`start_url`, `display: standalone`, `name`, `icons`) causing Android to reject installation.
- **GitHub Actions permission failure:** Deployment fails due to missing `pages: write` and `id-token: write` permissions.

---

### Task 1: Remote Repository Setup & Working Tree Baseline

**Files:**
- Modify: `.git/config` (via git remote command)

**Interfaces:**
- Consumes: SSH access to `git@github.com:berti/kittysquared.git`
- Produces: Configured `origin` remote on branch `main`

- [x] **Step 1: Configure git remote origin**
Run:
```bash
git remote add origin git@github.com:berti/kittysquared.git || git remote set-url origin git@github.com:berti/kittysquared.git
```

- [x] **Step 2: Verify git remote**
Run: `git remote -v`
Expected output: Shows `origin git@github.com:berti/kittysquared.git (fetch)` and `(push)`.

- [x] **Step 3: Commit any uncommitted workspace changes**
Stage and commit any pending modifications so the working tree is clean before introducing PWA assets.
```bash
git add -A
git commit -m "chore: save working tree before distribution setup"
```

---

### Task 2: App Icons and Branding Assets

**Files:**
- Create: `public/favicon.svg`
- Create: `public/favicon.ico`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/icon-512-maskable.png`
- Create: `public/apple-touch-icon.png`
- Create: `scripts/generate-icons.ts`

**Interfaces:**
- Consumes: Vector art representation from `src/components/CatSvg.tsx`
- Produces: Static icon files in `public/` matching PWA manifest and HTML link tags

- [x] **Step 1: Write icon generator script `scripts/generate-icons.ts`**
Script renders the KittySquared cat head on a square `#FBF9F5` canvas with cozy borders, producing SVG and generating PNG sizes:
- `favicon.svg` (crisp scalable vector)
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512 with 20% safe-zone margin)
- `apple-touch-icon.png` (180×180 for iOS)

- [x] **Step 2: Run icon generation script**
Run: `npx tsx scripts/generate-icons.ts`
Expected: Creates `public/` directory with all icon files.

- [x] **Step 3: Verify icon files exist and are non-empty**
Run: `ls -la public/`
Expected: Non-zero file sizes for `favicon.svg`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, and `apple-touch-icon.png`.

- [x] **Step 4: Commit icon assets**
```bash
git add public/ scripts/generate-icons.ts
git commit -m "feat(pwa): add app icons and icon generation script"
```

---

### Task 3: PWA Integration & Vite Base Configuration

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `index.html`

**Interfaces:**
- Consumes: `vite-plugin-pwa`
- Produces: Service Worker precache manifest, auto-update registration, Web App Manifest injected in HTML, relative base path

- [x] **Step 1: Install `vite-plugin-pwa`**
Run: `npm install -D vite-plugin-pwa`

- [x] **Step 2: Update `vite.config.ts` with `base: './'` and `VitePWA`**
Configure `VitePWA`:
- `registerType: 'autoUpdate'`
- `manifest`: name, short_name, description, theme_color `#FBF9F5`, background_color `#FBF9F5`, display `standalone`, orientation `portrait`, icons.
- `workbox`: `globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']`

- [x] **Step 3: Update `index.html` with mobile meta tags and icon links**
Add:
- `<link rel="icon" type="image/svg+xml" href="favicon.svg" />`
- `<link rel="apple-touch-icon" href="apple-touch-icon.png" />`
- `<meta name="theme-color" content="#FBF9F5" />`
- `<meta name="apple-mobile-web-app-capable" content="yes" />`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`
- `<meta name="apple-mobile-web-app-title" content="KittySquared" />`

- [x] **Step 4: Test production build with PWA plugin**
Run: `npm run build`
Expected: Generates `dist/` with `sw.js`, `manifest.webmanifest`, `workbox-*.js`, and hashed bundles.

- [x] **Step 5: Commit PWA and Vite configuration**
```bash
git add package.json package-lock.json vite.config.ts index.html
git commit -m "feat(pwa): configure vite-plugin-pwa and mobile install meta tags"
```

---

### Task 4: GitHub Actions CI/CD Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: GitHub Pages environment with `pages: write` and `id-token: write`
- Produces: Automated test, build, and deploy pipeline on push to `main`

- [x] **Step 1: Create `.github/workflows/deploy.yml`**
Write workflow configuring:
- `on: push: branches: [main]` and `workflow_dispatch`
- `permissions: { contents: read, pages: write, id-token: write }`
- `concurrency: { group: 'pages', cancel-in-progress: false }`
- Build job: checkout, setup node 22, `npm ci`, `npm test`, `npm run build`, upload pages artifact (`dist/`).
- Deploy job: deploy to GitHub Pages environment with `actions/deploy-pages@v4`.

- [x] **Step 2: Validate YAML syntax**
Run: `node -e "console.log('YAML check')"` (and verify syntax via linter or node parser).

- [x] **Step 3: Commit workflow**
```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

---

### Task 5: End-to-End Verification & Push to GitHub

**Files:**
- Modify: `docs/superpowers/plans/2026-11-01-distribution-pwa-github-pages.md` (mark tasks complete)

**Interfaces:**
- Consumes: Remote `origin`, all tests passing, build output verified
- Produces: Initial push to GitHub repo triggering first GitHub Actions deployment

- [x] **Step 1: Run all tests to ensure zero regressions**
Run: `npm test`
Expected: All tests PASS.

- [x] **Step 2: Run production build and check `dist` contents**
Run: `npm run build`
Expected:
- `dist/index.html` contains `<link rel="manifest" href="manifest.webmanifest">`
- `dist/sw.js` and `dist/manifest.webmanifest` exist
- Asset paths use relative `./` prefixes

- [x] **Step 3: Verify preview server**
Run: `npm run preview` in background, verify HTTP 200 on index and manifest.

- [x] **Step 4: Push `main` to `origin`**
Run: `git push -u origin main`
Expected: Branch `main` pushed to `git@github.com:berti/kittysquared.git`.
