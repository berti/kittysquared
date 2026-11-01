# Mobile UI Readability and Layout Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve mobile phone readability and touch usability by removing visual clutter, enlarging fonts and status indicators, and simplifying navigation button layouts across Home, Settings, and Game screens.

**Architecture:** Update component-level inline styles and JSX structure in `HomeScreen.tsx`, `SettingsModal.tsx`, and `GameScreen.tsx` using project color tokens, preserving component interfaces and updating unit/component tests in `tests/components/`.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, Testing Library (`@testing-library/preact`)

**Spec:** `docs/superpowers/specs/2026-11-01-mobile-ui-readability-design.md`

## Global Constraints
- No emojis on Home navigation buttons.
- Play button must be a single coral background (`#FF9770`) button with level and points right-aligned, eliminating the nested button.
- Subtitle *"300 puzzles de lógica felina"* must be removed from Home.
- "Tutorial" and "Ajustes" buttons must be 100% full width and stacked vertically under "Jugar".
- Settings text sizes must increase by at least +2pt across all modal sections and tabs.
- Double-tap speed section in Settings must remove "XXXms" under the slider and the "Área de prueba" title.
- Region visual assist in Settings must remove button micro-descriptions and the preview footer caption.
- Game screen text sizes must increase by at least +2pt; status bar icons/emojis enlarged (20px) and font size increased to 16.5px+.
- All 90 existing tests across 21 test files must continue to pass.

## Review Focus
- Home screen layout on small viewports (width ~360px): buttons do not overflow and level/points text remains legible on the coral button.
- Double tap tester in Settings: maintains full interactive click/double-tap testing functionality without the "Área de prueba" header.
- Region visual assist in Settings: 2x2 grid buttons remain visually distinct when selected (active indigo border and white card) despite removing description subtexts.
- Game status bar: cats count, lives hearts, and points remain centered and balanced across mobile widths without text wrapping.
- Keyboard and screen reader accessibility (`aria-label`, `role="tab"`, `data-testid`) remain intact on all buttons and interactive controls.

---

### Task 1: Home Screen Layout and Button Simplification

**Files:**
- Modify: `src/components/HomeScreen.tsx:33-120`
- Test: `tests/components/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `HomeScreenProps { progress: ModeProgress; catVariant: CatVariant; onPlay: () => void; onOpenTutorial: () => void; onOpenSettings: () => void; }`
- Produces: Simplified Home UI with single coral "Jugar" button and stacked "Tutorial" / "Ajustes" buttons.

- [ ] **Step 1: Update failing tests in `tests/components/HomeScreen.test.tsx`**

Update assertions in `tests/components/HomeScreen.test.tsx` to assert:
- `screen.queryByText(/300 puzzles de lógica felina/i)` is `null`.
- Single "Jugar" button displays "Jugar" and right-aligned "Nivel X / 300 • Y pts" without emojis.
- "Tutorial" button text is "Tutorial" (without 📖 emoji).
- "Ajustes" button text is "Ajustes" (without ⚙️ emoji).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/HomeScreen.test.tsx`
Expected: FAIL with missing text or emoji mismatch.

- [ ] **Step 3: Implement Home Screen changes in `src/components/HomeScreen.tsx`**

- Remove the `<p>` element containing `"300 puzzles de lógica felina"`.
- Replace the nested play button card with a single coral container:
  - Background: `#FF9770`, border: `2px solid #E07A5F`, box-shadow: `0 4px 0 #D9724C`, border-radius: `16px`, padding: `18px 20px`.
  - Flex layout: `display: 'flex'`, `justifyContent: 'space-between'`, `alignItems: 'center'`, `color: '#FFF'`.
  - Left: `<div style={{ fontSize: '20px', fontWeight: 900 }}>Jugar</div>`.
  - Right: `<div style={{ fontSize: '14.5px', fontWeight: 700, color: '#FFFBF2', opacity: 0.95 }}>Nivel {progress.currentLevelId} / 300 • {progress.totalScore} pts</div>`.
- Change bottom buttons container to `display: 'flex'`, `flexDirection: 'column'`, `gap: '12px'`, `width: '100%'`.
- Update "Tutorial" and "Ajustes" buttons: width `100%`, padding `14px`, font-size `15.5px`, text labels without emojis ("Tutorial", "Ajustes").

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/HomeScreen.test.tsx`
Expected: PASS

---

### Task 2: Settings Modal Typography and Clutter Reduction

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `SettingsModalProps`
- Produces: Enhanced legibility modal with cleaner controls and region assist panes.

- [ ] **Step 1: Update tests in `tests/components/SettingsModal.test.tsx`**

- Update assertions to check that:
  - Speed slider labels are "Rápido", "Medio", "Lento" without "XXXms".
  - "ÁREA DE PRUEBA" title is absent (`queryByText('ÁREA DE PRUEBA')` is `null`).
  - Region assist buttons have titles ("Desactivado", "Rayas", "Gatitos 🐾", "Números 1-9") without micro-descriptions ("Colores puros", "Tramas rayadas", etc.).
  - "Muestra cómo lucen los gatos y las ayudas de región juntos" is absent.
  - Interactive tester `data-testid="double-tap-tester"` still works properly.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: FAIL due to assertions on removed copy.

- [ ] **Step 3: Implement Settings Modal changes in `src/components/SettingsModal.tsx`**

- Bump typography across modal:
  - Header title: `21px`. Tab button labels: `13.5px`. Section labels: `13.5px` (font-weight `900`).
- Controls Tab:
  - Change slider labels to `<span>Rápido</span> <span>Medio</span> <span>Lento</span>` with font-size `13px`.
  - Remove `<div style={{ fontSize: '11px', fontWeight: 800, ... }}>ÁREA DE PRUEBA</div>`.
  - Enlarge tester status text to `13.5px`.
- Graphics Tab:
  - Cat variant labels increased to `13.5px`.
  - Region assist buttons: remove `<span style={{ fontSize: '9.5px' }}>{item.desc}</span>`, center title text with font-size `14px`, font-weight `800`.
  - Remove caption `<span style={{ fontSize: '10px' ... }}>Muestra cómo lucen los gatos y las ayudas de región juntos</span>`.
- Sound & Reset Tabs:
  - Increase button text sizes to `15px`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: PASS

---

### Task 3: Game Screen Readability and Status Bar Enlargement

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Test: `tests/components/GameScreen.test.tsx`

**Interfaces:**
- Consumes: `GameScreenProps`
- Produces: Game screen with larger touch targets, larger status bar (cats, lives, score), and more readable controls hint.

- [ ] **Step 1: Write/update test assertions in `tests/components/GameScreen.test.tsx`**

Verify that:
- Menu button, restart button, settings button, and level heading render correctly.
- Status bar displays placed cats count, hearts/lives, and score with larger font and icons.
- Control hint renders cleanly.

- [ ] **Step 2: Run test to verify current state**

Run: `npx vitest run tests/components/GameScreen.test.tsx`
Expected: PASS or identifies any mismatched assertions.

- [ ] **Step 3: Implement Game Screen readability enhancements in `src/components/GameScreen.tsx`**

- Top Bar:
  - "← Menú" button: font-size `15px`, padding `7px 14px`, box-shadow `0 2px 0 #E2D6C1`.
  - "Nivel {puzzle.id}": font-size `19px`, font-weight `900`.
  - Restart ("↺") and Settings ("⚙️") buttons: font-size `16px`, padding `7px 11px`.
- Status Bar:
  - Padding `10px 16px`, border `2px solid #E2D6C1`, border-radius `16px`.
  - Font-size `16.5px`, font-weight `900`.
  - Cat icon emoji `20px` with 5px gap to text.
  - Hearts emoji font-size `19px`, letter-spacing `2px`.
  - Star emoji font-size `19px`.
- Controls Hint:
  - Font-size increased from `12.5px` to `14.5px`, font-weight `700`.
- Victory and Defeat Modals:
  - Increase headings from `22px` to `24px`.
  - Increase body text from `14px` to `15.5px`.
  - Increase action button font from `15px` to `16.5px` with `padding: '14px'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/GameScreen.test.tsx`
Expected: PASS

---

### Task 4: Full Suite Verification & Build

**Files:**
- Test: All tests in `tests/`
- Build: `npm run build`

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: All 21 test files (90+ tests) pass with 0 failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Vite build succeeds with 0 errors.

- [ ] **Step 3: Verification with visual companion / clean up preview file**

Verify the visual companion server reflects the final implementation and remove temporary scratch file `mockup-preview.html`.
