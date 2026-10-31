# Design Document: Settings Menu Overhaul & Game Screen Streamlining

**Date:** 2026-10-31  
**Status:** In Review  
**Author:** Berti & Antigravity  

---

## 1. Intent & The Why

The existing settings modal has grown overcrowded as features (such as control schemes, cat skins, accessibility assist modes, audio toggles, and mode resets) were added to a single long vertical view. At the same time, the game screen contains bottom recovery buttons (*Deshacer* / *Limpiar cruces*) that take up valuable space and distract from the puzzle flow, while lacking a fast, dedicated way to cleanly restart a stalled puzzle level.

This project overhauls the Settings experience into a clean, responsive tabbed interface with enhanced interactive testing tools, while streamlining the in-game screen to be cleaner and more direct.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Reorganize `SettingsModal` into four clear tabs: **Controles (🎮)**, **Gráficos (🎨)**, **Sonido (🔊)**, and **Reiniciar (🔄)**.
- Ensure tab navigation is fully responsive: icon-only on compact mobile screens, icon + text label on wider displays.
- Introduce customizable double-tap speed (range 250ms–900ms, default 500ms) with an interactive tap tester directly inside the Controls tab.
- Provide a live mini-board preview (3×3) in the Graphics tab to display the combined look of the cat design and region accessibility styling.
- Make the Reset tab context-aware: when opened during gameplay, only display the reset button for the currently active game mode (`chill` or `classic`); when opened from the main menu, display both.
- Replace all browser `window.confirm()` prompts with an in-app `ConfirmDialog` adhering to the soft-clay design system.
- Add an in-game `↺` (Restart level) button to the top bar of `GameScreen` backed by the custom confirmation dialog.
- Clean up `GameScreen`: remove `[↩ Deshacer]` and `[🧹 Limpiar cruces]` from the bottom area, and ensure the status bar displays Cats, Lives, and Score without mode name clutter.

### Non-Goals
- Changing puzzle solving engine rules or generator algorithms.
- Adding new game modes or audio tracks beyond the existing SoundEngine capabilities.
- Complex multi-step tutorials for settings.

### Anti-Goals
- Disrupting saved user progress during the settings migration: existing localStorage states missing `doubleTapTimeoutMs` must seamlessly default to 500ms without data loss.
- Introducing browser popups (`window.alert`, `window.confirm`) anywhere in the new flow.

---

## 3. Constraints

- **Preact 10.x & TypeScript**: Standard component conventions with hooks (`useState`, `useMemo`, `useCallback`).
- **Responsive Layout**: Modals and game boards must feel natural on mobile devices (e.g. 360px–420px viewport width) as well as desktop screens.
- **Visual Design Integrity**: Use the established soft-clay palette (`#FFFBF2` cream background, `#EFE6D5` tray beige, `#E2D6C1` clay border, `#3D3135` text, `#F3722C` warm orange accent, `#EF4444` danger red).

---

## 4. Approaches Considered

### Approach 1: Modular Tabs with Reusable `ConfirmDialog` (Selected)
- Decompose `SettingsModal` into clean subcomponents (`ControlsTab`, `GraphicsTab`, `SoundTab`, `ResetTab`).
- Build a generic, accessible `ConfirmDialog` used for both level restarts and mode resets.
- Store `doubleTapTimeoutMs` in `AppSettings` with backward-compatible fallback in `storage.ts`.
- **Reason for Selection:** Provides maximum clarity, maintainability, and clean test coverage for individual tab features (like the speed tester and preview board) while eliminating code duplication for dialogs.

### Approach 2: Monolithic `SettingsModal` with Inline Dialogs
- Implement all tabs, preview board, tester, and dialog states inside a single file.
- **Trade-off:** File grows beyond 500 lines, blending unrelated concerns and complicating isolated unit testing.

### Approach 3: Preset-Only Double-Tap (Fixed Enum)
- Restrict double-tap speeds to 3 rigid presets (`fast` 300ms, `normal` 500ms, `slow` 800ms) without a continuous slider.
- **Trade-off:** Less flexibility for players with specific motor accessibility preferences.

---

## 5. Detailed Component & System Design

### 5.1 Storage & Types (`src/state/storage.ts`, `src/types/puzzle.ts`)
- Extend `AppSettings`:
  ```ts
  export interface AppSettings {
    controlScheme: ControlScheme;
    doubleTapTimeoutMs: number; // default: 500, range: 250-900
    catVariant: CatVariant;
    regionAssist: RegionAssistMode;
    musicMuted: boolean;
    sfxMuted: boolean;
    tutorialSeen: boolean;
  }
  ```
- Migration: in `loadPersistedState()`, if `settings.doubleTapTimeoutMs` is undefined or not a valid number, assign `500`.

### 5.2 Board Integration (`src/components/Board.tsx`)
- Accept optional or required `doubleTapTimeoutMs?: number` (defaulting to 500ms).
- Replace hardcoded `DOUBLE_TAP_TIMEOUT_MS = 1000` with the user-configured value.

### 5.3 Reusable In-App Confirmation Modal (`src/components/ConfirmDialog.tsx`)
- Props:
  - `isOpen: boolean`
  - `title: string`
  - `description: string`
  - `icon?: string` (e.g. '↺' or '⚠️')
  - `confirmText?: string` (e.g. "Sí, reiniciar")
  - `cancelText?: string` (e.g. "Cancelar")
  - `isDestructive?: boolean` (colors confirm button orange or red)
  - `onConfirm: () => void`
  - `onCancel: () => void`
- Uses backdrop overlay, rounded clay card, focus/escape handling, and testable IDs.

### 5.4 Settings Modal Architecture (`src/components/SettingsModal.tsx`)
- Props:
  - `settings: AppSettings`
  - `activeMode?: GameMode | null` (current mode if opened in-game, or null if from Home)
  - `onUpdateSettings: (settings: AppSettings) => void`
  - `onResetMode: (mode: GameMode) => void`
  - `onClose: () => void`
- Responsive Tab Navigation:
  - Tabs: `controls` | `graphics` | `sound` | `reset`.
  - Icon-only on narrow widths (via CSS `@media (max-width: 400px)` or flex gap).
  - Each tab button includes `aria-label` and `aria-selected`.
- **ControlsTab**:
  - Control scheme toggle: "Botón doble" vs "1 toque ✕ / 2 toques 🐱".
  - If "double-tap" is active:
    - Speed slider (range 250–900, step 25) with label displaying current ms and bracket (*Rápido* ≤350ms, *Normal* 351–650ms, *Lento* ≥651ms).
    - Interactive Tap Tester: A tactile box where the user can double-click/tap to test their interval. Displays 🐱 / 🤍 on success with interval feedback, or ✕ and helper text if single tap.
- **GraphicsTab**:
  - Cat variant selector: Black Cat vs White Cat.
  - Visual assist selector: Off, Textures, Glyphs, Numbers.
  - Mini-Board Preview: Compact 3×3 grid showing 3 regions with active assist pattern and sample cats.
- **SoundTab**:
  - Background music toggle and SFX toggle.
- **ResetTab**:
  - Contextual display:
    - If `activeMode === 'chill'`, only show "Reiniciar Chill Out".
    - If `activeMode === 'classic'`, only show "Reiniciar Classic".
    - If `!activeMode` (Home screen), show both.
  - Clicking either reset opens `ConfirmDialog` with mode-specific messaging.

### 5.5 Game Screen Modifications (`src/components/GameScreen.tsx`)
- **Top Bar**:
  - Add `↺` restart button between Level title and Settings `⚙️`.
  - Clicking `↺` opens `ConfirmDialog` ("¿Reiniciar este nivel?").
  - On confirm, invokes existing `onRetryLevel()`.
- **Status Bar**:
  - In Classic mode: displays Cats (`🐱 0 / 5`), Lives (`❤️❤️❤️`), and Score (`⭐ 120 (+10)`).
  - In Chill mode: displays only Cats (`🐱 0 / 5`).
  - Completely remove the mode name label from this bar.
- **Bottom Bar**:
  - Remove `handleUndo` and `handleClear` action buttons (`[↩ Deshacer]` and `[🧹 Limpiar cruces]`).
  - Keep the tool switcher (`[✕ Cruz] [🐱 Gato]`) when `controlScheme === 'toggle'`, or helper label when in `double-tap` mode.

---

## 6. What's Left to the Builder

- Exact CSS media queries and flexbox alignment values for modal responsiveness across screen aspect ratios.
- Animation keyframe timing for tab transitions and tester feedback pulses.
- Granular unit test assertions for tab switching and double-tap slider edge cases.
