# Design Doc: Debug Mode Route & Testing Workflow

## Intent and Why
Provide a quick testing mechanism for KittySquared levels (e.g. jumping directly to higher levels like 60–100) to test puzzle difficulty without grinding through preceding levels, without altering player save data, and with faster cell elimination in Classic mode.

## Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - Support direct access via URL route `/debug/<mode>/<level>` (e.g., `/debug/classic/84` or `/debug/chill/50`).
  - Isolate from persistent `localStorage`: do not read existing mode progress/snapshots, and do not persist scores, snapshots, or level completions while in debug mode.
  - In Classic mode while in debug mode: automatically mark eliminated cells (same row, column, region, and 8 surrounding neighbors) with crosses when a cat is correctly placed.
  - Display a visible "Debug mode" indicator in the game header.
  - Returning to menu ("← Menú") exits debug mode, updates URL to `/`, and reloads normal state.
  - Advancing level ("Siguiente nivel") stays in debug mode and updates URL to `/debug/<mode>/<nextLevel>`.
- **Non-Goals:**
  - Level generator modifications (deferred to subsequent work).
  - General routing overhaul for other screens.
- **Anti-Goals:**
  - Never modify or overwrite actual user save data or scores in `localStorage` when in debug mode.

## Approaches Considered
1. **Lightweight Native Path Matching (Selected):**
   - Parse `window.location.pathname` upon app initialization and on `popstate` events.
   - Synchronize URL via `history.pushState` / `history.replaceState`.
   - Zero external dependencies, fast, easily testable in JSDOM / Vitest.
2. **External Router Library (Rejected):**
   - Adding `preact-iso` or `wouter-preact`. Unnecessary bundle weight and complexity for a single testing route.

## Decisions & Architecture
- **Route Parsing (`src/utils/route.ts` or inline in `src/App.tsx`):**
  - Regex match `/debug\/(classic|chill)\/(\d+)`.
  - Level is clamped to valid range `[1, 100]`.
  - If URL matches, initialize in debug mode (`isDebug: true`) with specified mode and level.
- **State Management & Isolation:**
  - `isDebug` flag tracked in `App` state and passed down or stored in `session.isDebug`.
  - When `isDebug` is true, session updates and level advancements do not call `savePersistedState`.
  - Exiting to menu sets `isDebug = false`, replaces/pushes URL to `/`, and loads saved state.
- **Auto-Cross Elimination in Classic:**
  - In `src/state/gameState.ts` (or triggered upon correct cat placement when `isDebug` is enabled):
  - When placing a correct cat in Classic mode with `isDebug: true`, use `getDirectEliminations(puzzle.size, puzzle.regions, row, col)`.
  - For any eliminated cell `(r, c)` that is currently `empty`, convert to `cross`.
- **UI Indicator:**
  - In `GameScreen`, render a clear badge e.g. `🛠️ Debug Mode` alongside the level title when `session.isDebug` is true.
