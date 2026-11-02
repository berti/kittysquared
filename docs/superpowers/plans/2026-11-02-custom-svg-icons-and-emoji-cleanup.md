# Milestone 3: Custom Soft-Clay SVG Iconography & Emoji Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every platform-dependent system emoji across `src/` with a cohesive custom Soft-Clay SVG icon set (`src/components/Icons.tsx`), declutter the Accessibility (`Gráficos`) and Sound (`Sonido`) settings tabs, and enforce a zero-emoji test audit across `src/`.

**Architecture:**
- Create `src/components/Icons.tsx` containing reusable Soft-Clay SVG icons (`GearIcon`, `RestartIcon`, `MiniCatIcon`, `WarningIcon`, `ControlsTabIcon`, `GraphicsTabIcon`, `SoundTabIcon`, `AssistsTabIcon`, `TapFingerIcon`, `HeartSvg`, and `RegionGlyphIcon` + `REGION_GLYPH_IDS`).
- Update `Board.tsx`, `SettingsModal.tsx`, `GameScreen.tsx`, `TutorialModal.tsx`, `ConfirmDialog.tsx`, `HomeScreen.tsx`, `PostGameModal.tsx`, and `src/styles/theme.css` to render these SVG components and clean text labels.
- Add `tests/components/Icons.test.tsx` (including an automated zero-emoji source code scan across `src/`) and update existing component tests.

**Tech Stack:** Preact, TypeScript, CSS3, Vitest, `@testing-library/preact`.

---

### Task 1: Shared Soft-Clay SVG Icon Library (`src/components/Icons.tsx`) & Unit Test

**Files:**
- Create: `src/components/Icons.tsx`
- Create: `tests/components/Icons.test.tsx`

- [ ] **Step 1: Write the failing test in `tests/components/Icons.test.tsx`**
  Test rendering of `GearIcon`, `RestartIcon`, `MiniCatIcon`, `WarningIcon`, `ControlsTabIcon`, `GraphicsTabIcon`, `SoundTabIcon`, `AssistsTabIcon`, `TapFingerIcon`, `HeartSvg` (full, empty, and `isJustLost`), and all 10 `RegionGlyphIcon` variants (`0..9` matching `REGION_GLYPH_IDS`).

- [ ] **Step 2: Run `npx vitest run tests/components/Icons.test.tsx` to verify it fails**

- [ ] **Step 3: Implement `src/components/Icons.tsx`**
  Export all 11 Soft-Clay SVG components and `REGION_GLYPH_IDS = ['paw', 'fish', 'yarn', 'bell', 'star', 'moon', 'mouse', 'crown', 'heart', 'milk'] as const`.

- [ ] **Step 4: Run `npx vitest run tests/components/Icons.test.tsx` to verify it passes**

---

### Task 2: Board Region Assist Mini-SVG Markers (`Board.tsx` & `theme.css`)

**Files:**
- Modify: `src/components/Board.tsx`
- Modify: `src/styles/theme.css`
- Modify: `tests/components/BoardTheme.test.tsx`
- Modify: `tests/components/BoardAndCat.test.tsx`

- [ ] **Step 1: Update `tests/components/BoardTheme.test.tsx` and `tests/components/BoardAndCat.test.tsx` for SVG region glyph badges**
  Assert `REGION_GLYPHS` has 10 IDs (`REGION_GLYPHS[0] === 'paw'`, `REGION_GLYPHS[1] === 'fish'`, `REGION_GLYPHS[9] === 'milk'`) and that `.region-glyph-badge` has `data-glyph="paw"` / `"fish"` / `"milk"` and contains `<svg data-region-glyph="...">`.

- [ ] **Step 2: Run `npx vitest run tests/components/BoardTheme.test.tsx tests/components/BoardAndCat.test.tsx` to verify failure**

- [ ] **Step 3: Update `src/components/Board.tsx` and `src/styles/theme.css`**
  Export `REGION_GLYPHS = [...REGION_GLYPH_IDS]` and re-export `RegionGlyphIcon`. Render `<span className="region-glyph-badge" data-glyph={REGION_GLYPHS[regId]}><RegionGlyphIcon regionId={regId} /></span>`. Update `.region-glyph-badge` in `src/styles/theme.css` to center the inline SVG cleanly.

- [ ] **Step 4: Run `npx vitest run tests/components/BoardTheme.test.tsx tests/components/BoardAndCat.test.tsx` to verify pass**

---

### Task 3: SettingsModal SVG Icons & Emoji Decluttering (`SettingsModal.tsx`)

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `tests/components/SettingsModal.test.tsx`

- [ ] **Step 1: Update `tests/components/SettingsModal.test.tsx`**
  Assert that:
  - Tab buttons render SVG icons (`icon-tab-controls`, `icon-tab-graphics`, `icon-tab-sound`, `icon-tab-ayudas`).
  - `double-tap-tester` renders `icon-tap-prompt` when idle and `.cat-svg` when double-tapped, without `🐾` or `🐱`.
  - Graphics tab shows `Iconos` instead of `Gatitos 🐾`, and `mini-board-preview` in `glyphs` mode renders `.region-glyph-badge[data-glyph="paw"]`, `data-glyph="fish"`, `data-glyph="yarn"`.
  - Sound tab headers and track labels are clean text without decorative emojis (`Volumen de Música`, `Volumen de Efectos`, `Banda Sonora`, `Auto (6 temas)`, `Marimba Michi`, `Velvet Paws`, `Sunbeam Stroll`, `Bossa Meow`, `Catnip Waltz`, `Samba de Gatinho`).

- [ ] **Step 2: Run `npx vitest run tests/components/SettingsModal.test.tsx` to verify failure**

- [ ] **Step 3: Update `src/components/SettingsModal.tsx`**
  Replace header/tab emojis with `GearIcon`, `ControlsTabIcon`, `GraphicsTabIcon`, `SoundTabIcon`, `AssistsTabIcon`; update `double-tap-tester` to render `<CatSvg />` and `<TapFingerIcon />`; update `Gatitos 🐾` to `Iconos` and render `<RegionGlyphIcon />` in `mini-board-preview`; remove decorative emojis from the Sound tab.

- [ ] **Step 4: Run `npx vitest run tests/components/SettingsModal.test.tsx` to verify pass**

---

### Task 4: TutorialModal, ConfirmDialog, HomeScreen, PostGameModal & GameScreen SVG Icons + Zero-Emoji Audit

**Files:**
- Modify: `src/components/TutorialModal.tsx`
- Modify: `src/components/ConfirmDialog.tsx`
- Modify: `src/components/HomeScreen.tsx`
- Modify: `src/components/PostGameModal.tsx`
- Modify: `src/components/GameScreen.tsx`
- Modify: `tests/components/TutorialModal.test.tsx`
- Modify: `tests/components/ConfirmDialog.test.tsx`
- Modify: `tests/components/GameScreen.test.tsx`
- Modify: `tests/App.test.tsx`
- Modify: `tests/components/Icons.test.tsx`

- [ ] **Step 1: Update tests in `TutorialModal.test.tsx`, `ConfirmDialog.test.tsx`, `GameScreen.test.tsx`, `App.test.tsx`, and add Zero-Emoji Audit to `Icons.test.tsx`**
  - `TutorialModal.test.tsx`: assert `tutorial-heart-0..2` have `data-state="full"` initially and `tutorial-heart-2` becomes `data-state="empty"` after mistake.
  - `ConfirmDialog.test.tsx`: test default `<WarningIcon />` (`icon-warning`) as well as custom `<RestartIcon />` (`icon-restart`).
  - `GameScreen.test.tsx` & `App.test.tsx`: update gesture hint pill regex to `/1 toque: ✕ Cruz • 2 toques:/i` and verify `icon-mini-cat`, `icon-restart`, and `icon-gear` are rendered.
  - `Icons.test.tsx`: add automated scan over all `.ts`, `.tsx`, `.css` files in `src/` asserting zero pictographic emoji characters remain.

- [ ] **Step 2: Run `npx vitest run tests/components/TutorialModal.test.tsx tests/components/ConfirmDialog.test.tsx tests/components/GameScreen.test.tsx tests/App.test.tsx tests/components/Icons.test.tsx` to verify failure**

- [ ] **Step 3: Implement updates in `TutorialModal.tsx`, `ConfirmDialog.tsx`, `HomeScreen.tsx`, `PostGameModal.tsx`, and `GameScreen.tsx`**

- [ ] **Step 4: Run full test suite (`npx tsc --noEmit && npx vitest run tests/components tests/state tests/audio tests/styles tests/App.test.tsx`) to verify everything passes**
