# Design Spec: KittySquared Tutorial Rework (Rules & Controls First)

## Intent and Context
KittySquared's current interactive tutorial dives directly into deduction strategies (such as 1-cell regions and row-contained regions) before teaching players the basic game rules, mistake penalties, and control schemes. Furthermore, the tutorial currently uses a disconnected custom grid that does not behave like the real game board: single clicks immediately place cats, mistakes and lives are not represented, and multi-cross elimination patterns are not practiced.

This redesign aligns the tutorial with player mental models:
1. **Teach fundamental rules & controls first**: Rows/columns/regions, diagonal non-touching, double-tap for cats, single-tap for crosses, mistake penalty (red cross + life loss), and clearing crosses safely.
2. **Teach deduction strategies second**: 1-cell regions, row/column region confinement (multi-cross marking), and advanced patterns.
3. **Identical board mechanics**: The tutorial board embeds the real `Board` component and `gameState` logic so tap timing, sounds, mistake flags, and interactions mirror normal gameplay.

---

## Goals, Non-Goals, and Anti-Goals

### Goals
- **Rules First Flow**: Introduce rules sequentially in Part 1 (Reglas y Controles):
  1. *Fila, Columna y Región* (Missing 1 cat; double-click to place).
  2. *Gatos no pueden tocarse* (Diagonal/adjacent prohibition rule; place non-touching cat).
  3. *Uso de cruces y descartes múltiples* (Single tap for crosses; practice marking all ruled-out cells in a line/region).
  4. *Fallos y vidas* (Prompt player to double-click an invalid cell; demonstrate red error cross and 1 of 3 hearts lost).
  5. *Quitar cruces* (Single-tap to safely remove an existing cross).
- **Strategies Flow**: Reorganize Part 2 (Estrategias de deducción):
  1. *Región de una sola casilla* (Immediate cat).
  2. *Línea contenida en una región* (Eliminate rest of row/column with multiple crosses).
  3. *Parejas de regiones y líneas* (Advanced multi-cell elimination).
  4. *Asfixia a un paso* (Neighbor lookahead).
- **Authentic Board Experience**: Use `<Board />` with real double-tap detection, `applyCellTap`, audio feedback, hearts indicator, and accessibility settings (glyphs, textures, numbers).
- **Multi-action Completion**: Steps that involve placing multiple crosses (or completing multiple cells) require placing all expected markers before the "Siguiente ▶" button unlocks.

### Non-Goals
- Changing the main game board or level generation.
- Forcing players to complete the tutorial to unlock levels (it remains optional and replayable anytime from the home screen).

### Anti-Goals
- Artificial click behaviors in the tutorial that do not match the real game board (e.g. 1-click cat placement or non-functional double-taps).
- Rigid single-path click locks that crash or lock up if the player taps outside the target.

---

## Approaches Considered

### Approach 1: Full Game State Engine Integration with Step Goals (Selected)
- Each tutorial step defines a valid mini `PuzzleDef` (size 4×4 or 5×5), initial `CellState[][]`, initial locked states, and a goal condition function or target configuration.
- `TutorialModal` maintains a `LevelSessionState` via `applyCellTap` / `applyDragCross`.
- The status bar displays step instructions and hearts for mistake visualization.
- **Why Selected**: Meets all user requirements for genuine board behavior, double-tap sensitivity, audio, and visual consistency with zero logic duplication.

### Approach 2: Standalone Mock Grid with Simulated Rules
- Keep `Board` separate and write a tutorial-only click handler to fake double clicks and mistakes.
- **Rejected**: Duplicates timing logic, sound engine calls, and introduces discrepancies with actual game controls.

---

## Step-by-Step Curriculum Design

### Part 1: Reglas y Controles (`part: 'basic'`)

#### Step 1: Regla fundamental y Doble Toque
- **Concept**: Exactly 1 cat per row, column, and color region. Double-tap to place a cat.
- **Board Setup**: 4×4 board with 3 cats already placed and locked. Exactly one empty space remains valid for the 4th cat.
- **Action**: Player double-clicks the target cell to place the 4th cat.
- **Completion**: The 4th cat is placed; status shows success.

#### Step 2: Los gatos no se pueden tocar
- **Concept**: Cats cannot be in adjacent cells in any direction (orthogonal or diagonal).
- **Board Setup**: 4×4 board with 2 cats placed. A remaining region has 2 cells, but one touches an existing cat diagonally.
- **Action**: Player double-clicks the valid cell that does not touch any cat.
- **Completion**: Target cat placed without conflicts.

#### Step 3: Cruces y descartes múltiples
- **Concept**: Use crosses (single tap) to rule out cells where a cat cannot go. When a whole line or region is ruled out, place all crosses.
- **Board Setup**: 4×4 board with a cat placed at (0, 0). The rest of row 0 must be ruled out.
- **Action**: Player single-taps all remaining empty cells in row 0: (0, 1), (0, 2), (0, 3) to place crosses.
- **Completion**: All target cells in row 0 have crosses.

#### Step 4: Fallos y vidas (Cruces rojas)
- **Concept**: Placing a cat in an impossible spot marks it with a locked red cross and costs 1 of 3 lives (hearts).
- **Board Setup**: 4×4 board with 3 hearts displayed. A clear conflict spot (e.g. sharing a row with an existing cat).
- **Action**: Tutorial explicitly prompts player: *"Haz doble toque en la casilla resaltada para ver qué ocurre cuando te equivocas."*
- **Completion**: Player double-clicks the invalid cell; red error cross appears and hearts change from ❤️❤️❤️ to 🤍❤️❤️.

#### Step 5: Quitar cruces con seguridad
- **Concept**: Crosses are notes you can safely remove if you change your mind.
- **Board Setup**: 4×4 board with an accidental cross placed on an empty valid cell.
- **Action**: Player single-taps the cross to clear it back to empty.
- **Completion**: Cell is restored to 'empty'.

---

### Part 2: Estrategias de Deducción (`part: 'advanced'`)

#### Step 6: Región de una sola casilla
- **Concept**: If a colored region has only 1 available cell, the cat must go there.
- **Board Setup**: Region with 1 cell.
- **Action**: Double-click that cell to place the cat.

#### Step 7: Región contenida en una fila (Descarte completo)
- **Concept**: If all cells of a region are confined to a single row, no other cell in that row can contain a cat.
- **Action**: Player marks all other cells in that row outside that region with crosses (multi-cross).

#### Step 8: Parejas de regiones y líneas
- **Concept**: Two regions sharing two lines saturate both lines.
- **Action**: Mark all other cells in those lines with crosses.

#### Step 9: Asfixia a un paso (Anticipación)
- **Concept**: Placing a cat in a cell that would wipe out all options for an adjacent region is impossible.
- **Action**: Place a cross on the suffocating cell.

---

## Technical Details

### Tutorial Step Data Schema (`src/data/tutorialSteps.ts`)
```typescript
export interface TutorialStep {
  id: string;
  part: 'basic' | 'advanced';
  title: string;
  explanation: string;
  puzzle: PuzzleDef;
  initialBoard: CellState[][];
  initialLockedCats?: boolean[][];
  initialErrorCrosses?: boolean[][];
  initialMistakes?: number;
  highlightCells?: { row: number; col: number }[];
  hintText: string;
  isComplete: (session: LevelSessionState, initialSession: LevelSessionState) => boolean;
}
```

### Tutorial Modal UI (`src/components/TutorialModal.tsx`)
- Embeds `<Board />` with `onCellTap` calling `applyCellTap` and `onDragCross` calling `applyDragCross`.
- Displays hearts mini-bar if `step.part === 'basic'` or when relevant to mistakes.
- Displays hint text in warning/info color, changing to green confirmation when `isComplete(session)` is true.
- "Siguiente ▶" button is enabled only when `isComplete` returns true.
- Tabs allow jumping between "1. Reglas y Controles" and "2. Estrategias".

---

## Testing Plan
- Test Step 1: verifies placing cat via double-click unlocks next button; single-click places cross and does not complete step.
- Test Step 2: verifies placing non-touching cat completes step.
- Test Step 3: verifies step requires ALL multi-cross targets to be crossed before completing.
- Test Step 4: verifies double-clicking invalid cell triggers mistake, shows red error cross, drops heart, and completes step.
- Test Step 5: verifies single-clicking cross removes it and completes step.
- Test Navigation: switching tabs, advancing through all steps, and closing tutorial modal.
