# Milestone 3: Custom Soft-Clay SVG Iconography & Emoji Cleanup — Design Spec

**Date:** 2026-11-02  
**Status:** Reviewed & Ready for Sign-Off  
**Roadmap Reference:** [`docs/superpowers/specs/2026-11-02-aaa-mobile-roadmap.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-02-aaa-mobile-roadmap.md) (Milestone 3)

---

## 1. Goal & Scope

Replace all platform-dependent system emojis across the application (`🐾`, `🐟`, `🧶`, `🔔`, `⭐`, `🌙`, `🐭`, `👑`, `💖`, `🥛`, `⚙️`, `↺`, `🐱`, `⚠️`, `🎮`, `🎨`, `🔊`, `💡`, `🤍`, `❤️`, `👆`, `🎵`, `🎼`, `🔄`, `🪵`, `🎹`, `☀️`, `🥐`, `🎉`) with a cohesive, bespoke **Soft-Clay vector SVG icon set** (`src/components/Icons.tsx`) and clean typography labels in the Settings modal.

### Non-Goals
- Typographic text/arrow symbols `✕` (`\u2715`), `★` (`\u2605`), `▶` (`\u25B6`), `←` (`\u2190`), and `↻` (`\u21BB`, used in `Reintentar Nivel ↻`) remain as text symbols.
- The Defeat Modal's custom 3-heart broken arch in `GameScreen.tsx` (from Milestone 2) remains untouched.
- Milestones 4–8 (10×10 board sizing/drag fix, cat breeds, daily challenge, bilingual i18n, haptics/dark mode) are out of scope for this milestone.

---

## 2. Shared Soft-Clay SVG Icon Library (`src/components/Icons.tsx`)

Create a new shared module `src/components/Icons.tsx` exporting reusable, accessible (`aria-hidden="true"` by default) Preact SVG components styled in the Soft-Clay palette (`#4A3B32` outlines, `#FFD166` gold, `#FF7E67` coral, `#A8E6CF` mint, `#FFB5A7` blush, `#FFFDF9` cream):

1. **`GearIcon({ size = 22 })`** — Soft-Clay gold/cream cogwheel (`data-testid="icon-gear"`).
2. **`RestartIcon({ size = 22 })`** — Soft-Clay circular arrow with coral arrowhead (`data-testid="icon-restart"`).
3. **`MiniCatIcon({ size = 20 })`** — Blush kitty head silhouette with ears, eyes, and coral nose (`data-testid="icon-mini-cat"`).
4. **`WarningIcon({ size = 22 })`** — Rounded amber warning triangle with dark brown exclamation mark (`data-testid="icon-warning"`).
5. **`ControlsTabIcon({ size = 20 })`** — Mint gamepad silhouette (`data-testid="icon-tab-controls"`).
6. **`GraphicsTabIcon({ size = 20 })`** — Soft-Clay artist palette (`data-testid="icon-tab-graphics"`).
7. **`SoundTabIcon({ size = 20 })`** — Gold speaker with coral sound waves (`data-testid="icon-tab-sound"`).
8. **`AssistsTabIcon({ size = 20 })`** — Warm yellow lightbulb (`data-testid="icon-tab-ayudas"`).
9. **`TapFingerIcon({ size = 28 })`** — Soft-Clay pointer hand/tap ripple icon for the idle state of the double-tap tester (`data-testid="icon-tap-prompt"`).
10. **`HeartSvg({ isLost, isJustLost = false, size = 22, testId })`** — Extracted from `GameScreen.tsx` so both `GameScreen.tsx` and `TutorialModal.tsx` render identical whole (`fill="#EF4444"`, `stroke="#B91C1C"`) and cracked (`fill="#D8CBB8"`, `stroke="#BDAE98"`) two-half vector hearts with `data-testid={testId}`, `data-state={isLost ? 'empty' : 'full'}`, and `className={isJustLost ? 'heart-losing' : undefined}` matching `src/styles/theme.css`.
11. **`RegionGlyphIcon({ regionId, size = 13 })`** & **`REGION_GLYPH_IDS`** — 10 crisp monochrome/duotone vector silhouettes for regions `0..9`:
    - `0`: `'paw'` (Paw print)
    - `1`: `'fish'` (Fish)
    - `2`: `'yarn'` (Yarn ball)
    - `3`: `'bell'` (Collar bell)
    - `4`: `'star'` (Star)
    - `5`: `'moon'` (Crescent moon)
    - `6`: `'mouse'` (Toy mouse)
    - `7`: `'crown'` (Crown)
    - `8`: `'heart'` (Heart)
    - `9`: `'milk'` (Milk drop / bottle)
    - Each `<RegionGlyphIcon regionId={regId} />` renders an `<svg data-region-glyph={REGION_GLYPH_IDS[regId]} width={size} height={size} ...>` inside `.region-glyph-badge`.
    - Export `REGION_GLYPHS = REGION_GLYPH_IDS` (`['paw', 'fish', 'yarn', 'bell', 'star', 'moon', 'mouse', 'crown', 'heart', 'milk']`) from `Board.tsx` (and re-export `RegionGlyphIcon`) so existing imports remain clean and deterministic.

---

## 3. Component-by-Component Updates

### 3.1 `src/components/Board.tsx` & `src/styles/theme.css`
- Replace the emoji string array `REGION_GLYPHS` with the 10 semantic glyph IDs `['paw', 'fish', 'yarn', 'bell', 'star', 'moon', 'mouse', 'crown', 'heart', 'milk']` and render `<span className="region-glyph-badge" data-glyph={REGION_GLYPHS[regId]}><RegionGlyphIcon regionId={regId} /></span>`.
- Update `.region-glyph-badge` in `src/styles/theme.css` so the SVG icon centers cleanly in the top-left badge corner (`display: inline-flex; align-items: center; justify-content: center; pointer-events: none;`).

### 3.2 `src/components/SettingsModal.tsx`
- **Header (`Ajustes`):** Replace `⚙️ Ajustes` with `<GearIcon size={22} /> <span>Ajustes</span>` inside a flex heading (`display: 'inline-flex', alignItems: 'center', gap: '8px'`).
- **Tab Bar (`controls`, `graphics`, `sound`, `ayudas`):** Replace emoji strings (`🎮`, `🎨`, `🔊`, `💡`) with `<ControlsTabIcon />`, `<GraphicsTabIcon />`, `<SoundTabIcon />`, and `<AssistsTabIcon />`.
- **Controls Tab (`double-tap-tester`):**
  - Style the icon wrapper inside `double-tap-tester` with `display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '34px'`.
  - When `testerFeedback.status === 'double'`, render `<div style={{ width: '34px', height: '34px' }}><CatSvg variant={settings.catVariant} /></div>` instead of `'🤍'` / `'🐱'`, and change the feedback text from `` `¡Doble toque detectado! 🐾 (${testerFeedback.interval}ms)` `` to `` `¡Doble toque detectado! (${testerFeedback.interval}ms)` ``.
  - When `testerFeedback.status === 'idle'`, render `<TapFingerIcon size={28} />` instead of `'👆'`.
  - When `testerFeedback.status === 'single'`, keep the crisp `'✕'` mark.
- **Graphics Tab (`AYUDA VISUAL DE REGIONES` & `mini-board-preview`):**
  - Change `{ id: 'glyphs', label: 'Gatitos 🐾' }` to `{ id: 'glyphs', label: 'Iconos' }`.
  - In `mini-board-preview`, when `settings.regionAssist === 'glyphs'`, render `<span className="region-glyph-badge" data-glyph={REGION_GLYPHS[cell.reg]}><RegionGlyphIcon regionId={cell.reg} size={11} /></span>` instead of `{REGION_GLYPHS[cell.reg]}`.
- **Sound Tab (`pane-sound`):**
  - Remove decorative emojis from section headers and soundtrack buttons:
    - `🎵 Volumen de Música` → `Volumen de Música`
    - `🔊 Volumen de Efectos` → `Volumen de Efectos`
    - `🎼 Banda Sonora` → `Banda Sonora`
    - `🔄 Auto (6 temas)` → `Auto (6 temas)`
    - `🪵 Marimba Michi` → `Marimba Michi`
    - `🎹 Velvet Paws` → `Velvet Paws`
    - `☀️ Sunbeam Stroll` → `Sunbeam Stroll`
    - `🐱 Bossa Meow` → `Bossa Meow`
    - `🥐 Catnip Waltz` → `Catnip Waltz`
    - `🎉 Samba de Gatinho` → `Samba de Gatinho`

### 3.3 `src/components/GameScreen.tsx`
- **Top Bar Buttons:**
  - `restart-level-btn`: Replace `↺` text with `<RestartIcon size={20} />`.
  - `open-settings-btn`: Replace `⚙️` text with `<GearIcon size={20} />`.
- **Status Bar Cat Counter:**
  - Replace `<span style={{ fontSize: '20px', lineHeight: 1 }}>🐱</span>` with `<MiniCatIcon size={20} />`.
- **Status Bar Hearts:**
  - Import and use shared `HeartSvg` from `./Icons`.
- **Bottom Gesture Hint Pill:**
  - Keep text nodes directly inside the pill `<div>` with `display: 'inline-flex', alignItems: 'center', gap: '5px'`:
    `1 toque: ✕ Cruz • 2 toques: <MiniCatIcon size={15} /> Gato`
    so `getByText(/1 toque: ✕ Cruz • 2 toques:/i)` and `getByText(/Gato/i)` match the pill element cleanly without any system emoji.
- **Restart `ConfirmDialog`:**
  - Pass `icon={<RestartIcon size={28} />}` instead of `icon="↺"`.

### 3.4 `src/components/TutorialModal.tsx`
- Replace the legacy emoji hearts (`i < session.mistakes ? '🤍' : '❤️'` and `hearts.join(' ')`) with 3 shared `<HeartSvg key={i} isLost={isLost} size={20} testId={`tutorial-heart-${i}`} />` components inside the lives pill (`const remainingLives = Math.max(0, 3 - session.mistakes); const isLost = i >= remainingLives;`).

### 3.5 `src/components/ConfirmDialog.tsx`, `src/components/HomeScreen.tsx`, & `src/components/PostGameModal.tsx`
- Update `ConfirmDialogProps.icon` in `src/components/ConfirmDialog.tsx` from `icon?: string` to `icon?: ComponentChildren` (defaulting to `<WarningIcon size={28} />`).
- In `src/components/HomeScreen.tsx`, pass `icon={<WarningIcon size={28} />}` to `ConfirmDialog`.
- In `src/components/PostGameModal.tsx`, replace `<span style={{ fontSize: '18px' }}>⚠️</span>` on the reset button with `<WarningIcon size={18} />`, and pass `icon={<WarningIcon size={28} />}` to `ConfirmDialog`.

---

## 4. Verification & Testing Plan

1. **Zero-Emoji Audit:** Verify via automated test (`tests/components/Icons.test.tsx`) that no pictographic Unicode emoji characters (`\u{1F300}-\u{1FAFF}`, `\u{2600}-\u{27BF}`, `\u2B50`, `\u21BA`, excluding allowed typographic glyphs `\u2715` `✕` and `\u2605` `★`) remain anywhere in `src/`.
2. **Unit & Component Tests:**
   - `tests/components/BoardTheme.test.tsx` & `tests/components/BoardAndCat.test.tsx`: Verify `.region-glyph-badge` renders `<RegionGlyphIcon />` with `data-glyph="paw"`, `"fish"`, ..., `"milk"` for regions `0..9`.
   - `tests/components/SettingsModal.test.tsx`: Verify clean labels (`Iconos`, `Volumen de Música`, `Marimba Michi`, etc.), SVG tab icons, SVG double-tap tester feedback, and mini-board preview SVG glyph badges (`data-glyph="paw"`, `"fish"`, `"yarn"`).
   - `tests/components/TutorialModal.test.tsx`: Verify Step 4 renders 3 `<HeartSvg />` icons (`tutorial-heart-0..2`) with `data-state="full"` initially, and updates `tutorial-heart-2` to `data-state="empty"` after an invalid double-tap.
   - `tests/components/ConfirmDialog.test.tsx`, `tests/components/GameScreen.test.tsx`, `tests/App.test.tsx`: Update assertions for SVG icons and gesture hint pill text.
