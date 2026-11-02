# Auto-Cross Assist & Settings Reorganization Design

## Intent & Why
In KittySquared, manually placing crosses on empty cells after locking in a cat becomes tedious on larger boards (e.g. 7x7 to 10x10). It requires no puzzle-solving skill once the cat is placed, introduces opportunities for accidental double-taps or missed cells, and slows down gameplay.

This feature introduces an auto-cross assist setting that automatically marks invalid lines and/or regions with crosses upon placing a cat, animated with an outward wave from the cat's position (completing under 500 ms). To accommodate the new assist controls cleanly, the settings dialog will gain an "Ayudas" tab, and the destructive "Reiniciar" progress option will move to the bottom of the main menu.

## Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - Add an "Ayudas" tab to the settings modal with the setting "Colocar cruces automáticamente" and 3 options:
    - *No* (default)
    - *Fila, columna y alrededor*
    - *Fila, columna, alrededor y color*
  - Automatically fill affected empty cells with crosses when a correct cat is placed.
  - Animate the newly placed crosses as a radial wave propagating outward from the cat in under 500 ms.
  - Move the "Reiniciar progreso" action out of the settings dialog to the bottom of the home screen with full button width, lower text contrast, and the same confirmation modal.
- **Non-Goals:**
  - Auto-crossing on incorrect cat placement (mistake logic with single error cross remains unchanged).
  - Overwriting existing crosses or modifying non-empty cells.
- **Anti-Goals:**
  - Asynchronous timer chains that block player input or introduce state race conditions during quick moves or victory conditions.
  - Breaking responsive layouts on mobile devices.

## Constraints
- Must persist settings in `localStorage` across reloads without data migration corruption.
- Settings modal should remain 4 tabs (`Controles`, `Gráficos`, `Sonido`, `Ayudas`) to fit standard card widths seamlessly.
- Wave animation must finish quickly (under 500 ms) so the board is immediately readable.

## Approaches Considered
- **Approach A (Selected): State Batching with CSS-Staggered Wave**
  - Crosses are computed and added to the board state in a single synchronous step inside `applyCellTap`.
  - CSS keyframe animation with `animation-delay` based on distance $\max(|r - r_{cat}|, |c - c_{cat}|)$ is applied to auto-placed crosses.
  - *Why selected*: Completely deterministic, zero timer race conditions, zero async bugs if a user taps rapidly or wins the level, and smooth 60fps GPU animation.
- **Approach B: Asynchronous Sequential Dispatch via JavaScript Timers**
  - Crosses are added ring-by-ring across 450 ms using `setTimeout`.
  - *Rejected*: Introduces complex lifecycle management, cancellation on unmount/restart, and potential desyncs with victory checks or subsequent taps.

## Detailed Design & Implementation

### 1. Settings & Persistence (`src/state/storage.ts`, `src/types/puzzle.ts`)
- Define auto-cross assist type:
  ```typescript
  export type AutoCrossMode = 'off' | 'row_col_surround' | 'all';
  ```
- Add `autoCross: AutoCrossMode` to `AppSettings` with default `'off'`.
- Validate and migrate in `loadPersistedState`.

### 2. Auto-Cross Logic (`src/state/gameState.ts`)
- In `applyCellTap`:
  - When a correct cat is placed at `(row, col)`:
    - If `autoCross !== 'off'`, calculate affected cells:
      - Always: same row, same column, adjacent 8 neighbors (surround).
      - If `autoCross === 'all'`: also cells with identical region `regions[r][c] === regions[row][col]`.
    - Only convert cells currently `'empty'` to `'cross'`. Do not touch locked cats, error crosses, or existing crosses.
    - Track `lastAutoCrossCells?: { row: number; col: number; dist: number }[]` in session state or derive wave timing in `Board.tsx` from `lastPlacedCat`.

### 3. Wave Animation (`src/styles/theme.css`, `src/components/Board.tsx`)
- In `Board.tsx`:
  - When a cell receives an auto-cross from the latest placement, compute distance $d = \max(|r - row|, |c - col|)$ from `lastPlacedCat`.
  - Apply animation `crossWavePop` with `animation-delay: ${d * 35}ms`.
  - `theme.css`: Keyframes scale/fade the cross in 160ms with a slight overshoot bounce. For a 10x10 board, max distance is 9 rings $\times 35\text{ms} = 315\text{ms} + 160\text{ms} = 475\text{ms} \le 500\text{ms}$.

### 4. Settings Modal Tab Switch (`src/components/SettingsModal.tsx`)
- Remove `reset` tab.
- Add `ayudas` tab (`💡 Ayudas`).
- Render "COLOCAR CRUCES AUTOMÁTICAMENTE" with 3 selectable options:
  - *No*
  - *Fila, columna y alrededor*
  - *Fila, columna, alrededor y color*
- Remove `onResetProgress` prop from `SettingsModal` if no longer needed there.

### 5. Main Menu Reset Button (`src/components/HomeScreen.tsx`)
- Add a subdued, full-width button at the bottom of the container:
  - Background: transparent or light neutral (`#EFE6D5`), border matching theme.
  - Text color: `#A8999E` or `#9B8B90` (subdued, less contrast).
  - Clicking opens the existing `ConfirmDialog`.
- Hook up `onResetProgress`.

## What's Left to the Builder
- Precise styling tokens for the subdued reset button.
- Comprehensive unit tests covering settings tab interaction, auto-cross behavior in all 3 modes, and home screen reset integration.
