# Settings Enhancements & Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement settings modal visual and UX enhancements: game-accurate board cell double-tap tester, uncarded double-tap speed section, stepped volume sliders, multi-track playlist checkboxes, 5-tab navigation bar with dedicated "Gatos" tab, and binary auto-cross selection.

**Architecture:** Evolve `AppSettings` to store `selectedTracks: ConcreteTrackId[]` and binary `autoCross: 'off' | 'all'` with robust backward-compatibility migrations; update `soundEngine` to cycle through `selectedTracks`; expand `SettingsModal` to 5 tabs with custom `CatTabIcon`, interactive cell tester, stepped range sliders, and playlist checkboxes.

**Tech Stack:** Preact, TypeScript, Web Audio API, Vitest, Testing Library.

**Spec:** [`docs/superpowers/specs/2026-11-15-settings-tweaks-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-11-15-settings-tweaks-design.md)

## Global Constraints

- Zero-Emoji Compliance: No decorative emojis or country flag unicode characters in source or test files.
- Backward Compatibility: Existing saved states with legacy `musicTrack: 'auto'`, specific track strings, or legacy `autoCross: 'row_col_surround'` must safely migrate without loss of progress or user settings.
- Bilingual i18n Parity: All new UI strings must be provided in both Spanish (`es`) and English (`en`) with 100% key parity.
- Build Verification: Clean TypeScript compilation (`npx tsc --noEmit`) and clean production build with Node 22 (`npm run build`).

## Review Focus

1. **Legacy storage migration:** Older stored state containing `musicTrack: 'auto'` or `'bossa'` properly initializes `selectedTracks` without crashes or resets.
2. **Empty playlist guard:** Unchecking all songs must be prevented or fall back safely so background music never breaks or throws errors.
3. **Double-tap cell timer cancellation:** Rapid tapping on the tester cell does not leave orphaned timers or unexpected state transitions.
4. **Volume slider accessibility & keyboard interaction:** Range inputs respond correctly to change/input events and keyboard arrows across 0%, 25%, 50%, 75%, 100%.
5. **5-Tab responsive fit:** The tab navigation bar displays cleanly across small mobile viewports (360px) without overflow or label truncations.

---

### Task 1: Storage Evolution & Audio Engine Multi-Track Playlist

**Files:**
- Modify: `src/types/puzzle.ts`
- Modify: `src/state/storage.ts`
- Modify: `src/audio/soundEngine.ts`
- Modify: `src/App.tsx`
- Test: `tests/state/storage.test.ts`
- Test: `tests/audio/soundEngine.test.ts`

**Interfaces:**
- Consumes: `ConcreteTrackId` from `src/audio/soundEngine.ts` or `src/state/storage.ts`.
- Produces:
  - `ALL_CONCRETE_TRACKS: readonly ConcreteTrackId[] = ['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']` in `src/state/storage.ts`.
  - `selectedTracks: ConcreteTrackId[]` in `AppSettings`.
  - `soundEngine.setSelectedTracks(tracks: ConcreteTrackId[]): void`.
  - `soundEngine.getSelectedTracks(): ConcreteTrackId[]`.

- [ ] **Step 1.1: Write failing storage migration tests**
  In `tests/state/storage.test.ts`, add tests verifying:
  - Default `DEFAULT_APP_SETTINGS.selectedTracks` contains all 6 tracks.
  - `loadPersistedState()` migrates legacy `musicTrack: 'auto'` to all 6 tracks.
  - `loadPersistedState()` migrates legacy `musicTrack: 'marimba'` to `['marimba']`.
  - `loadPersistedState()` migrates legacy `autoCross: 'row_col_surround'` to `'all'`.
  - `loadPersistedState()` ensures `selectedTracks` has at least 1 track if an empty array or invalid track was stored.
  - `resetProgress()` preserves `settings.selectedTracks`.

- [ ] **Step 1.2: Run storage tests to confirm failure (RED)**
  Run: `npx vitest run tests/state/storage.test.ts --configLoader runner`
  Expected: FAIL on undefined `selectedTracks`.

- [ ] **Step 1.3: Update `src/state/storage.ts` and `src/types/puzzle.ts`**
  - Export `ConcreteTrackId` and `ALL_CONCRETE_TRACKS`.
  - In `AppSettings`: replace `musicTrack: MusicTrackOption` with `selectedTracks: ConcreteTrackId[]`.
  - In `DEFAULT_APP_SETTINGS`: set `selectedTracks: [...ALL_CONCRETE_TRACKS]`.
  - In `loadPersistedState()`: migrate legacy `raw.settings.musicTrack` and `raw.settings.selectedTracks`.
  - Migrate `raw.settings.autoCross`: if `'row_col_surround'`, map to `'all'`.

- [ ] **Step 1.4: Write failing soundEngine playlist tests**
  In `tests/audio/soundEngine.test.ts`, add tests verifying:
  - `soundEngine.setSelectedTracks(['marimba', 'velvet'])` updates active track rotation.
  - `soundEngine.getNextTrack()` cycles strictly through the selected tracks.
  - Providing an empty array falls back safely to all tracks.

- [ ] **Step 1.5: Update `src/audio/soundEngine.ts` and `src/App.tsx`**
  - Add `setSelectedTracks(tracks: ConcreteTrackId[]): void` and update `getNextTrack()` to cycle through `this.selectedTracks`.
  - In `src/App.tsx`: update soundEngine sync effect from `appState.settings.musicTrack` to `appState.settings.selectedTracks`.

- [ ] **Step 1.6: Run tests to confirm passing (GREEN)**
  Run: `npx vitest run tests/state/storage.test.ts tests/audio/soundEngine.test.ts --configLoader runner`
  Expected: PASS.

- [ ] **Step 1.7: Commit**
  ```bash
  git add src/state/storage.ts src/types/puzzle.ts src/audio/soundEngine.ts src/App.tsx tests/state/storage.test.ts tests/audio/soundEngine.test.ts
  git commit -m "feat: evolve AppSettings with multi-track playlist and update soundEngine"
  ```

---

### Task 2: Tab Bar Expansion (5 Tabs) & Custom CatTabIcon

**Files:**
- Modify: `src/components/Icons.tsx`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/translations.ts`
- Modify: `src/components/SettingsModal.tsx`
- Test: `tests/components/Icons.test.tsx`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `AppSettings.catVariant`, `CAT_BREEDS`, `isCatBreedUnlocked`.
- Produces:
  - `CatTabIcon` exported from `src/components/Icons.tsx`.
  - `SettingsTab = 'controls' | 'cats' | 'graphics' | 'sound' | 'ayudas'`.
  - `settings.tabs.cats` translated in `es` ("Gatos") and `en` ("Cats").

- [ ] **Step 2.1: Write failing tests for 5-tab navigation and Cat tab**
  In `tests/components/SettingsModal.test.tsx`:
  - Assert 5 tab buttons exist: `tab-btn-controls`, `tab-btn-cats`, `tab-btn-graphics`, `tab-btn-sound`, `tab-btn-ayudas`.
  - Assert `tab-btn-cats` contains `[data-testid="icon-tab-cats"]`.
  - Assert clicking `tab-btn-cats` opens `pane-cats` with cat breed buttons and total stars counter.
  - Assert `pane-graphics` now contains only Region Assist options and live board preview (not cat breeds).
  - Assert English translation displays "Cats" on `tab-btn-cats`.

- [ ] **Step 2.2: Run tests to confirm failure (RED)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx --configLoader runner`
  Expected: FAIL on missing `tab-btn-cats`.

- [ ] **Step 2.3: Implement `CatTabIcon` in `src/components/Icons.tsx`**
  Add a Soft-Clay styled SVG cat icon with `data-testid="icon-tab-cats"`.

- [ ] **Step 2.4: Update translations in `src/i18n/`**
  - Add `cats: string` to `TranslationSchema['settings']['tabs']`.
  - In `src/i18n/translations.ts`: add `cats: 'Gatos'` to `es` and `cats: 'Cats'` to `en`.

- [ ] **Step 2.5: Implement 5-tab navigation and `pane-cats` in `src/components/SettingsModal.tsx`**
  - Update `SettingsTab` to `'controls' | 'cats' | 'graphics' | 'sound' | 'ayudas'`.
  - Render `CatTabIcon` on `tab-btn-cats`.
  - Move the cat breed gallery and star counter to `activeTab === 'cats'`.
  - Keep Region Assist and live board preview in `activeTab === 'graphics'`.

- [ ] **Step 2.6: Run tests to confirm passing (GREEN)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx tests/components/Icons.test.tsx tests/i18n/translations.test.ts --configLoader runner`
  Expected: PASS.

- [ ] **Step 2.7: Commit**
  ```bash
  git add src/components/Icons.tsx src/i18n/types.ts src/i18n/translations.ts src/components/SettingsModal.tsx tests/components/Icons.test.tsx tests/components/SettingsModal.test.tsx tests/i18n/translations.test.ts
  git commit -m "feat: expand settings modal to 5 tabs with dedicated cats tab"
  ```

---

### Task 3: Controls Tab Uncarding & Game-Accurate Cell Tap Tester

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `settings.catVariant`, `settings.doubleTapTimeoutMs`, `CatSvg`.
- Produces:
  - Game-identical interactive board cell tester in `pane-controls` with `data-testid="double-tap-cell-tester"`.

- [ ] **Step 3.1: Write failing tests for uncarded double-tap section and cell tester**
  In `tests/components/SettingsModal.test.tsx`:
  - Assert the double-tap section does not have card border/background styles (`#F8F3E8` card styling removed).
  - Assert `double-tap-cell-tester` renders a board cell element.
  - Test single tap: cell renders a translucent cross (`opacity: 0.45` or tentative class).
  - Test timeout expiration: advance fake timers by `currentTimeout` ms -> cross disappears (cell returns to empty).
  - Test double tap: tap once then tap again within `currentTimeout` ms -> cell renders `<CatSvg variant={catVariant} />`.
  - Test reset after cat placement: advance timers by 1.2s -> returns to idle.

- [ ] **Step 3.2: Run tests to confirm failure (RED)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx --configLoader runner`
  Expected: FAIL on missing `double-tap-cell-tester` behavior.

- [ ] **Step 3.3: Implement uncarded section and interactive cell tester in `src/components/SettingsModal.tsx`**
  - Remove card container styling (`background: '#F8F3E8'`, border, padding) from the double-tap speed section.
  - Implement board cell tester:
    - 52×52px container styled like a gameplay cell (background `#FFE3D8`, rounded `12px`, border `2px solid #E2D6C1`).
    - Manage states: `idle`, `single` (translucent cross), `double` (cat placed).
    - On single tap: show cross with `opacity: 0.45` and start timer for `currentTimeout` ms. If timer fires, return to `idle`.
    - On double tap: cancel single-tap timer, set state to `double` showing `<CatSvg variant={settings.catVariant} state="idle" />`, and set auto-reset timer to 1.2s.

- [ ] **Step 3.4: Run tests to confirm passing (GREEN)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx --configLoader runner`
  Expected: PASS.

- [ ] **Step 3.5: Commit**
  ```bash
  git add src/components/SettingsModal.tsx tests/components/SettingsModal.test.tsx
  git commit -m "feat: uncard double-tap section and add game-accurate cell tap tester"
  ```

---

### Task 4: Sound Tab Redesign: Stepped Sliders & Playlist Checkboxes

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/translations.ts`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `settings.selectedTracks`, `settings.musicVolume`, `settings.sfxVolume`, `ALL_CONCRETE_TRACKS`.
- Produces:
  - Stepped range sliders for music volume (`music-vol-slider`) and SFX volume (`sfx-vol-slider`).
  - Master checkbox (`track-opt-all`) and individual track checkboxes (`track-checkbox-<id>`).

- [ ] **Step 4.1: Write failing tests for stepped sliders and track checkboxes**
  In `tests/components/SettingsModal.test.tsx`:
  - Assert redundant top header `AUDIO` / `SONIDO` is not present.
  - Assert section headers `MÚSICA`, `EFECTOS (SFX)`, `BANDA SONORA` (in English: `MUSIC`, `SOUND EFFECTS (SFX)`, `SOUNDTRACK`).
  - Assert music and SFX volume range sliders exist with `min="0" max="1" step="0.25"`.
  - Assert moving the sliders calls `onUpdateSettings` with correct stepped volume values (`0`, `0.25`, `0.5`, `0.75`, `1`).
  - Assert master checkbox `track-opt-all` is checked when all 6 tracks are selected.
  - Assert toggling master checkbox unchecks all (or leaves at least 1) / checks all 6 songs.
  - Assert checking/unchecking an individual song checkbox (`track-checkbox-marimba`) toggles it in `settings.selectedTracks`.

- [ ] **Step 4.2: Run tests to confirm failure (RED)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx --configLoader runner`
  Expected: FAIL on missing sliders and checkboxes.

- [ ] **Step 4.3: Update translations in `src/i18n/`**
  - Add `allTracks: string` to `TranslationSchema['settings']['audio']`.
  - Add `allTracks: 'Todas las pistas'` to `es` and `allTracks: 'All tracks'` to `en`.

- [ ] **Step 4.4: Implement stepped sliders and playlist checkboxes in `src/components/SettingsModal.tsx`**
  - Remove the top banner.
  - Style section headers with all-caps bold text.
  - Replace button step grids with `<input type="range" min="0" max="1" step="0.25" />` and label indicators `0%`, `25%`, `50%`, `75%`, `100%`.
  - Render master checkbox: `<input type="checkbox" data-testid="track-opt-all" ... />`.
  - Render 6 track checkboxes with custom Soft-Clay styled card buttons or checkbox controls displaying track title and checked status.
  - Guard logic: if the user unchecks the last checked song, prevent unchecking or re-check to ensure at least 1 track remains selected.

- [ ] **Step 4.5: Run tests to confirm passing (GREEN)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx tests/i18n/translations.test.ts --configLoader runner`
  Expected: PASS.

- [ ] **Step 4.6: Commit**
  ```bash
  git add src/components/SettingsModal.tsx src/i18n/types.ts src/i18n/translations.ts tests/components/SettingsModal.test.tsx tests/i18n/translations.test.ts
  git commit -m "feat: implement stepped volume sliders and playlist checkboxes in Sound tab"
  ```

---

### Task 5: Binary Auto-Cross Assist & Full Suite Verification

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/translations.ts`
- Test: `tests/components/SettingsModal.test.tsx`
- Test: All suites across the codebase

**Interfaces:**
- Consumes: `settings.autoCross: 'off' | 'all'`.
- Produces:
  - 2 binary option cards in `pane-ayudas`: "No" (`select-autocross-off`) and "Sí" (`select-autocross-all`).

- [ ] **Step 5.1: Write failing tests for binary auto-cross**
  In `tests/components/SettingsModal.test.tsx`:
  - Assert only 2 auto-cross options exist: `select-autocross-off` and `select-autocross-all`.
  - Assert `select-autocross-row-col-surround` does not exist.
  - Assert clicking `select-autocross-all` calls `onUpdateSettings({ ...settings, autoCross: 'all' })`.
  - Assert helper description for "Sí" states "Cruces en fila, columna, adyacentes y toda la región de color" (in English: "Crosses in row, column, adjacent cells, and entire color region").

- [ ] **Step 5.2: Run tests to confirm failure (RED)**
  Run: `npx vitest run tests/components/SettingsModal.test.tsx --configLoader runner`
  Expected: FAIL on obsolete `select-autocross-row-col-surround`.

- [ ] **Step 5.3: Update auto-cross translations in `src/i18n/`**
  Update `autoCrossOptions` in `types.ts` and `translations.ts` to `off` and `all` with the exact spec copy.

- [ ] **Step 5.4: Implement binary auto-cross in `src/components/SettingsModal.tsx`**
  Render only 2 cards: "No" (`off`) and "Sí" (`all`).

- [ ] **Step 5.5: Run full test suite & zero-emoji audit**
  Run:
  - `npx tsc --noEmit`
  - `npx vitest run --configLoader runner`
  - `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npm run build`
  Expected: All tests pass (0 failures), type check clean (0 errors), build successful.

- [ ] **Step 5.6: Commit**
  ```bash
  git add src/components/SettingsModal.tsx src/i18n/types.ts src/i18n/translations.ts tests/components/SettingsModal.test.tsx
  git commit -m "feat: simplify auto-cross assist to binary options and verify build"
  ```
