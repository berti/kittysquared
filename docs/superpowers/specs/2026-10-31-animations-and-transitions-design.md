# Design: Screen Transitions & Modal Animations

## 1. Intent & The Why
To make KittySquared feel more dynamic, flashy, and polished, this feature adds directional screen transitions between screens/levels and snappy fly-in modal animations. These animations give immediate visual feedback, enhance the arcade feel, and protect user interaction state by preventing accidental taps during transitions.

## 2. Goals, Non-Goals, and Anti-Goals
* **Goals:**
  * Directional edge-to-edge (100vw) horizontal wipe between Home and Game screens.
  * Level-to-level transitions using the same forward wipe.
  * Direct wipe-over on level advance: when advancing from the Victory dialog, the dialog stays in place and the wipe curtain sweeps directly over it without closing or animating away first.
  * Snappy fly-in animation from top (`translateY(-100%) -> translateY(0)`) with progressive backdrop darkening for all dialogs (`SettingsModal`, `TutorialModal`, `ConfirmDialog`, victory/defeat overlays).
  * Strict input blocking during all transition and modal entrance phases.
  * Preserve all existing gameplay mechanics, audio effects, and 61 passing unit tests.
* **Non-Goals:**
  * Complex 3D page curls or heavy particle physics engines.
  * Reworking the underlying puzzle engine, solver, or storage format.
* **Anti-Goals:**
  * Introducing animation lag, frame drops, or blocking interactions for longer than necessary (max 300ms total).
  * Breaking automated tests in Vitest/JSDOM due to lingering timers or transitions.

## 3. Constraints
* Must run smoothly in mobile browsers, mobile webviews, and wide desktop viewports.
* Must not depend on external heavy animation libraries (pure CSS transforms/transitions managed via Preact state).
* Vitest / JSDOM test suite must pass without regressions; transitions should be easily bypassable or immediate in test environments if needed.

## 4. Approaches Considered
1. **Centralized Transition Coordinator & Shared CSS Animation (Selected):**
   * A root `ScreenTransitionOverlay` at `App.tsx` handles forward/backward wipes. A single coordination function executes Phase 1 (150ms cover), runs the state update at midpoint (100% covered), and executes Phase 2 (150ms uncover).
   * Dialog animations use standardized CSS classes in `theme.css` (`.modal-backdrop`, `.modal-flyin`) for snappy entrance and backdrop darkening.
   * *Tradeoff:* Extremely clean architecture, single source of truth, eliminates DOM flicker, and maintains complete testability. Selected by user.
2. **Parallel Screen Slide (CSS Transition Group):**
   * Keep both outgoing and incoming screens mounted simultaneously, sliding them side by side.
   * *Tradeoff:* Deviates from the solid-color wipe requirement, complicates audio triggers and Preact lifecycles, and increases DOM footprint.
3. **View Transitions API:**
   * Browser-native `startViewTransition()`.
   * *Tradeoff:* Inconsistent support across browsers, clumsy input blocking across React/Preact lifecycle renders, and difficult to test in JSDOM.

## 5. Visual & Interaction Specifications (Decided by User)
* **Screen Transition Wipe:**
  * **Color:** Energetic Coral (`#FF9770`).
  * **Scope:** Edge-to-edge (100vw, `position: fixed`, `inset: 0`, `z-index: 2000`).
  * **Timing:** 300ms total (150ms cover in + 150ms uncover out) with `cubic-bezier(0.4, 0, 0.2, 1)`.
  * **Directions:**
    * *Forward* (Home ➔ Game, Level ➔ Next Level, Retry Level): Starts at `translateX(100%)`, covers to `translateX(0%)`, exits to `translateX(-100%)`.
    * *Backward* (Game ➔ Home): Starts at `translateX(-100%)`, covers to `translateX(0%)`, exits to `translateX(100%)`.
  * **Level Advance Behavior:** When clicking "Siguiente Nivel ▶" from the Victory dialog, the dialog does *not* close or fly away. The coral curtain sweeps over both dialog and backdrop. At midpoint, the dialog is dismissed and next level state is loaded silently. The curtain exits to reveal the new level.
  * **Input Shield:** While `isTransitioning` is true, an invisible shield with `pointer-events: all` blocks any clicks or taps across the entire app.
* **Dialog Transitions:**
  * **Scope:** All modal dialogs (`SettingsModal`, `TutorialModal`, `ConfirmDialog`, and game end overlays).
  * **Fly-in:** Enters from top (`translateY(-100%)` to `translateY(0%)`) using `cubic-bezier(0.16, 1, 0.3, 1)` over 300ms.
  * **Backdrop:** Fades from `opacity: 0` / transparent to `rgba(61, 49, 53, 0.65)` over 300ms.
  * **Input Locking:** Backdrop clicks are disabled during the 300ms entrance.
  * **Exit:** Clean fade/slide out on manual close (200ms ease-in), except during level advance where the screen wipe covers it.

## 6. What's Left to the Builder
* Adding keyframes and CSS utility classes in `src/styles/theme.css`.
* Creating `src/components/ScreenTransitionOverlay.tsx` and integrating transition state in `src/App.tsx`.
* Updating `GameScreen.tsx` to route level advance, level retry, and back-to-menu through the transition coordinator.
* Applying fly-in animation classes to `SettingsModal.tsx`, `TutorialModal.tsx`, and `ConfirmDialog.tsx`.
* Adding unit tests in `tests/` covering the transition states and input locking.
