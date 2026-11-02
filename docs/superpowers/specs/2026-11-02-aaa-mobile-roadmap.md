# KittySquared — AAA Mobile Game Roadmap

Date: 2026-11-02

## Overview
Master roadmap of features, visual polish, and platform fixes to elevate **KittySquared** to a AAA mobile puzzle game experience. We work through these one milestone at a time (brainstorm → design spec → implementation plan → execution & verification).

## Milestones

### Milestone 1 — Level Selector & Star Rating Progression (2.1)
- Track per-level best star ratings (`1–3` stars based on mistakes: `0 mistakes = 3★`, `1 mistake = 2★`, `2 mistakes = 1★`) in [`storage.ts`](../../../src/state/storage.ts), with backward-compatible migration for already-completed levels.
- Add a **Level Selector / Map** view accessible from [`HomeScreen.tsx`](../../../src/components/HomeScreen.tsx) so players can browse all 300 levels, see their star ratings and board sizes, and replay any completed level to improve their stars/score.
- Replace the `⭐` score emoji in [`GameScreen.tsx`](../../../src/components/GameScreen.tsx) with a custom SVG score icon so stars exclusively represent level ratings.

### Milestone 2 — "Game Juice", Delayed Victory Celebration & Redesigned Modals (3.2 & 3.3)
- Custom SVG hearts with shake/crack loss animation when a mistake occurs.
- Floating `+10` score popups and score counter tick-up animation.
- Subtle row/column/region completion shimmer when a cat locks a region/line.
- Staggered cat wave jump + lightweight SVG confetti/paw particle celebration on the board for ~1.8s before the Victory modal opens.
- Ground-up visual redesign of the Victory and Defeat modals in [`GameScreen.tsx`](../../../src/components/GameScreen.tsx) (displaying earned stars, animated counters, and polished layout).

### Milestone 3 — Custom SVG Iconography & Emoji Cleanup
- Replace remaining emojis across [`GameScreen.tsx`](../../../src/components/GameScreen.tsx), [`HomeScreen.tsx`](../../../src/components/HomeScreen.tsx), [`SettingsModal.tsx`](../../../src/components/SettingsModal.tsx), [`TutorialModal.tsx`](../../../src/components/TutorialModal.tsx), and [`ConfirmDialog.tsx`](../../../src/components/ConfirmDialog.tsx) with bespoke vector icons matching the Soft Clay aesthetic.
- Remove unnecessary decorative emojis/icons (such as the paws in the accessibility settings option and the extra icons in the sound settings tab).

### Milestone 4 — 10×10 Board Sizing, Region Contiguity Borders & Drag-Start Fix (1.4 & 1.3)
- Dynamically tighten grid gap and tray padding on larger boards (9×9, 10×10) in [`Board.tsx`](../../../src/components/Board.tsx) / [`theme.css`](../../../src/styles/theme.css) so cells are larger and easier to tap on mobile screens.
- Explore and add visual region contiguity borders / grouping so adjacent regions are effortless to distinguish.
- Fix the drag-to-cross origin bug in [`Board.tsx`](../../../src/components/Board.tsx) so the cell where dragging starts receives a cross immediately when entering a neighboring cell, and make touch dragging across cells reliable via `onPointerMove` + `elementFromPoint`.

### Milestone 5 — Cat Art Overhaul & Unlockable Cat Breeds (2.3)
- Upgrade the existing black and white cat illustrations in [`CatSvg.tsx`](../../../src/components/CatSvg.tsx) for higher-craft AAA appeal.
- Add unlockable cat breeds/variants (e.g. Orange Tabby, Siamese, Calico, Tuxedo, Russian Blue) unlocked via star/level milestones.

### Milestone 6 — Daily 10×10 Hard Puzzle ("Reto Diario") & Shareable Grid (2.2)
- Deterministic daily 10×10 hard puzzle seeded by date (`YYYY-MM-DD`).
- Daily streak tracking and one-tap shareable result summary.

### Milestone 7 — Bilingual i18n (Spanish / English)
- Auto-detect device language (`navigator.language` starting with `es` vs `en`) with a manual language selector in [`SettingsModal.tsx`](../../../src/components/SettingsModal.tsx).

### Milestone 8 — Haptics, Dark Mode, Platform Polish & Smart Tools (3.1, 3.4, 4.1–4.3, 1.1, 1.2)
- Tactile haptics (`navigator.vibrate`) with settings toggle.
- Cozy Dark / Night theme ("Modo Noche").
- Background audio lifecycle (`visibilitychange`) verification and `100dvh` / safe-area viewport polish.
- Player statistics modal, Undo action button, and Contextual Smart Hint ("Pista Lógica").
