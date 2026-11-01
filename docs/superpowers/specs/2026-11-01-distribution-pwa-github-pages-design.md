# KittySquared Distribution, GitHub Pages CI/CD & PWA Offline Support Design

## 1. Intent & Context
KittySquared is currently a local Preact + TypeScript logic puzzle game. To share it with friends and players, we need:
1. Public hosting and automated continuous deployment.
2. Full mobile installability ("Add to Home Screen" as a standalone app on iOS and Android).
3. 100% offline gameplay so players can solve puzzles without an internet connection.

This design specifies the configuration of GitHub Pages hosting, GitHub Actions CI/CD pipeline, and full Progressive Web App (PWA) offline capabilities via `vite-plugin-pwa`.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Automated Deployment:** Deploy the game to GitHub Pages on every push to the `main` branch after linting/tests pass.
- **Full Offline Capability:** Precache all game assets (HTML, CSS, JS, puzzle definitions, audio synthesizer logic) so the game launches and plays completely offline.
- **Home Screen App Installation:** Support standard PWA installation on Android (ambient install prompt) and iOS ("Add to Home Screen" standalone window without Safari browser chrome).
- **Custom Branding & Icons:** High-quality cat-themed app icons (192×192, 512×512, maskable 512×512, and 180×180 Apple touch icon) derived from the game's cat vector illustration.
- **Automatic App Updates:** When a new version is deployed to GitHub Pages, the service worker automatically updates in the background on next launch.

### Non-Goals
- App Store / Google Play Store native wrapping (Capacitor/Cordova/Electron).
- Server-side features, user accounts, or cloud saves (local storage is preserved).
- Push notifications.

### Anti-Goals
- Broken relative paths when deployed under a subpath (e.g., `https://<username>.github.io/kittysquared/`).
- Stale caching traps where players are stuck on older builds with no way to receive bug fixes.
- Requiring an internet connection to load subsequent puzzles or play music.

---

## 3. Constraints
- **Vite & Preact Compatibility:** Must integrate cleanly with Vite 6 and `@preact/preset-vite`.
- **Hosting Environment:** GitHub Pages static hosting (no server-side routing or `.htaccess` redirects).
- **Storage & Privacy:** State remains in `localStorage`. Caching must not wipe saved puzzle progress or settings.

---

## 4. Approaches Considered

### Approach 1: `vite-plugin-pwa` (Workbox) — *Selected*
- **Description:** Integrate `vite-plugin-pwa` into `vite.config.ts`. The plugin uses Workbox to automatically compute content hashes for all generated assets and build a reliable precache manifest into a generated Service Worker. Also generates and injects the Web Manifest into the HTML.
- **Trade-offs:** Adds dev dependencies (`vite-plugin-pwa` and `workbox-window`), but eliminates manual cache management and ensures robust offline behavior and cache busting.

### Approach 2: Handwritten Service Worker & Static Manifest
- **Description:** Manually code a `sw.js` and `manifest.webmanifest` in `public/`.
- **Trade-offs:** Zero new dependencies, but fragile cache busting for Vite's hashed bundles. Offline play could easily fail if a new puzzle file or code chunk isn't manually registered. Rejected.

---

## 5. Detailed Technical Architecture

### 5.1 Vite Base Path Configuration
GitHub Pages serves repositories at `https://<username>.github.io/<repo-name>/` unless a custom domain is configured.
In `vite.config.ts`:
- Set `base: './'` (relative asset URLs).
- Relative paths allow the app to work seamlessly whether hosted at root domain (`https://game.com/`), repo subpath (`https://user.github.io/kittysquared/`), or local preview (`http://localhost:4173/`).

### 5.2 GitHub Actions CI/CD Workflow (`.github/workflows/deploy.yml`)
Workflow triggers on `push` to `main` and supports `workflow_dispatch`.
1. **Concurrency:** `group: 'pages', cancel-in-progress: false` to ensure deployments queue cleanly.
2. **Permissions:**
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```
3. **Build Job:**
   - Checkout code (`actions/checkout@v4`).
   - Setup Node.js 22 with npm cache (`actions/setup-node@v4`).
   - Run clean install (`npm ci`).
   - Run tests (`npm test`).
   - Run build (`npm run build`).
   - Upload GitHub Pages artifact (`actions/upload-pages-artifact@v3`, path `dist`).
4. **Deploy Job:**
   - Deploys using `actions/deploy-pages@v4` targeting environment `github-pages`.

### 5.3 PWA Configuration (`vite.config.ts`)
Using `VitePWA`:
- **`registerType: 'autoUpdate'`**: Automatically claims clients and reloads worker when new content is available.
- **Manifest:**
  - `name`: `KittySquared — Logic Puzzle Game`
  - `short_name`: `KittySquared`
  - `description`: `A cozy grid-based cat logic puzzle game`
  - `theme_color`: `#FBF9F5` (matches cozy parchment background)
  - `background_color`: `#FBF9F5`
  - `display`: `standalone`
  - `orientation`: `portrait`
  - `start_url`: `./`
  - `scope`: `./`
  - `icons`:
    - `icon-192.png` (192×192, `image/png`, `any`)
    - `icon-512.png` (512×512, `image/png`, `any`)
    - `icon-512-maskable.png` (512×512, `image/png`, `maskable`)
- **Workbox Precaching:**
  - `globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']` to guarantee all puzzle definitions, sounds, styles, and scripts are cached on first visit.

### 5.4 App Icons & HTML Meta Tags
- **Artwork:** Render the black and white cat illustration with cozy ears and eyes onto a styled `#FBF9F5` background badge.
- **Assets in `public/`:**
  - `favicon.svg` & `favicon.ico`
  - `icon-192.png` (192×192)
  - `icon-512.png` (512×512)
  - `icon-512-maskable.png` (512×512 with safe padding)
  - `apple-touch-icon.png` (180×180 for iOS)
- **`index.html` updates:**
  - `<link rel="apple-touch-icon" href="apple-touch-icon.png">`
  - `<meta name="theme-color" content="#FBF9F5">`
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
  - `<meta name="apple-mobile-web-app-title" content="KittySquared">`

---

## 6. Verification Plan
1. **Automated Unit Tests:** `npm test` continues to pass.
2. **Production Build Verification:** `npm run build` succeeds, generating `dist/` containing `sw.js`, `manifest.webmanifest`, `workbox-*.js`, and icon files.
3. **Local PWA & Offline Verification:**
   - Run `npm run preview`.
   - Open browser DevTools:
     - Check Application > Manifest: verify icons, name, standalone display.
     - Check Application > Service Workers: verify active registration.
     - Set DevTools Network to "Offline" and reload page: verify KittySquared loads and plays completely offline.
4. **GitHub Workflow Validation:** Verify syntax of `.github/workflows/deploy.yml`.
