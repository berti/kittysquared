# Colorblind Accessibility & Region Assist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a configurable "Region Assist" accessibility setting (`off` | `textures` | `glyphs` | `numbers`) in KittySquared to enable color-blind and visually impaired players to distinguish puzzle regions without relying solely on color.

**Architecture:** Extend the settings state schema and persistence layer with `regionAssist`. Wire the setting from `App` down through `GameScreen` into `Board`, rendering lightweight pure CSS repeating pattern overlays for `textures`, mascot badges for `glyphs`, and corner digits for `numbers`. Provide an intuitive selector in `SettingsModal`.

**Tech Stack:** TypeScript, Preact, CSS Custom Properties & Gradients, Vitest, `@testing-library/preact`.

**Spec:** [`docs/superpowers/specs/2026-10-30-colorblind-accessibility-design.md`](file:///home/berti/code/kittysquared/docs/superpowers/specs/2026-10-30-colorblind-accessibility-design.md)

## Global Constraints

- **Platform:** Static web app in modern browsers; touch and desktop.
- **Backwards Compatibility:** Existing persisted state in `localStorage` without `regionAssist` must safely default to `'off'`.
- **Interaction Integrity:** Pattern overlays and badges must have `pointer-events: none` and must not disrupt drag-to-cross or cell tap/double-tap.
- **Aesthetic Quality:** Patterns must use subtle opacity (~22%) so cats, crosses, and error markers remain distinct and crisp.

## Review Focus

1. **Missing or Corrupted `regionAssist` in `localStorage`:** Old saves without `regionAssist` or with invalid strings must default to `'off'` without crashing. (Pinned to Task 1)
2. **Badge & Pattern Click-Through:** Tapping or dragging across cells with active patterns, glyphs, or numbers must trigger `onCellTap` and `onDragCross` identically to `off`. (Pinned to Task 3)
3. **Numbering Range:** Number badges must display `1` through `N` (1-indexed), mapped via `(regId % 9) + 1` so that region 0 displays as `1`. (Pinned to Task 3)
4. **Cat & Cross Visibility Overlays:** Elements inside the cell must maintain proper z-indexing (`.pattern-overlay` behind cats/crosses; badges in corner). (Pinned to Task 3)
5. **Settings Modal Selection & Persistence:** Toggling region assist options immediately updates the board and persists to `localStorage`. (Pinned to Task 4)

---

### Task 1: Type Definitions & Settings Persistence

**Files:**
- Modify: `src/types/puzzle.ts:1-23`
- Modify: `src/state/storage.ts:18-80`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Produces: `export type RegionAssistMode = 'off' | 'textures' | 'glyphs' | 'numbers';`
- Produces: `AppSettings.regionAssist: RegionAssistMode`
- Produces: `getDefaultAppState().settings.regionAssist === 'off'`

- [ ] **Step 1: Write the failing tests in `tests/state/storage.test.ts`**

```ts
it('initializes and persists regionAssist setting with default "off"', () => {
  const state = getDefaultAppState();
  expect(state.settings.regionAssist).toBe('off');

  state.settings.regionAssist = 'textures';
  savePersistedState(state);

  const loaded = loadPersistedState();
  expect(loaded.settings.regionAssist).toBe('textures');
});

it('Review Focus #1: loadPersistedState defaults regionAssist to "off" if missing in older save files', () => {
  localStorage.setItem(
    'kittysquared_state_v1',
    JSON.stringify({
      chill: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
      classic: { currentLevelId: 1, totalScore: 0, activeSnapshot: null },
      settings: {
        controlScheme: 'toggle',
        catVariant: 'black',
        musicMuted: false,
        sfxMuted: false,
        tutorialSeen: true,
      },
    })
  );
  const loaded = loadPersistedState();
  expect(loaded.settings.regionAssist).toBe('off');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/storage.test.ts`  
Expected: FAIL with compilation/property missing error on `regionAssist`.

- [ ] **Step 3: Implement `RegionAssistMode` in `src/types/puzzle.ts` and `src/state/storage.ts`**

In `src/types/puzzle.ts`:
```ts
export type RegionAssistMode = 'off' | 'textures' | 'glyphs' | 'numbers';
```

In `src/state/storage.ts`:
Add `regionAssist: RegionAssistMode;` to `AppSettings`.
In `getDefaultAppState()`:
```ts
settings: {
  controlScheme: 'toggle',
  catVariant: 'black',
  regionAssist: 'off',
  musicMuted: false,
  sfxMuted: false,
  tutorialSeen: false,
}
```
In `loadPersistedState()`:
Ensure `regionAssist: parsed.settings?.regionAssist || 'off'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/storage.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/puzzle.ts src/state/storage.ts tests/state/storage.test.ts
git commit -m "feat(settings): add RegionAssistMode to AppSettings and storage persistence"
```

---

### Task 2: CSS Pattern Overlays and Accessibility Badges

**Files:**
- Modify: `src/styles/theme.css`
- Test: `tests/styles/theme.test.ts` (or CSS syntax verification)

**Interfaces:**
- Consumes: None
- Produces: CSS classes `.region-pattern`, `.pat-0` through `.pat-8`, `.region-glyph-badge`, `.region-number-badge`

- [ ] **Step 1: Write verification test in `tests/styles/theme.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('theme.css accessibility styles', () => {
  it('defines pattern overlay classes and badge classes with pointer-events: none', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/theme.css'), 'utf-8');
    expect(css).toContain('.region-pattern');
    expect(css).toContain('.pat-1');
    expect(css).toContain('.pat-8');
    expect(css).toContain('.region-glyph-badge');
    expect(css).toContain('.region-number-badge');
    expect(css).toContain('pointer-events: none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/styles/theme.test.ts`  
Expected: FAIL because CSS classes are not yet present.

- [ ] **Step 3: Implement pattern and badge styles in `src/styles/theme.css`**

Add CSS custom properties and classes:
```css
:root {
  --pattern-opacity: 0.22;
  --pattern-color: #3D3135;
}

.region-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--pattern-opacity);
  background-repeat: repeat;
  mix-blend-mode: multiply;
  z-index: 1;
}

.pat-0 { background-image: none; }
.pat-1 {
  background-image: repeating-linear-gradient(45deg, var(--pattern-color), var(--pattern-color) 2px, transparent 2px, transparent 8px);
}
.pat-2 {
  background-image: radial-gradient(var(--pattern-color) 2px, transparent 2.2px);
  background-size: 8px 8px;
}
.pat-3 {
  background-image: repeating-linear-gradient(0deg, var(--pattern-color), var(--pattern-color) 2px, transparent 2px, transparent 8px);
}
.pat-4 {
  background-image: 
    repeating-linear-gradient(0deg, var(--pattern-color), var(--pattern-color) 1.5px, transparent 1.5px, transparent 8px),
    repeating-linear-gradient(90deg, var(--pattern-color), var(--pattern-color) 1.5px, transparent 1.5px, transparent 8px);
}
.pat-5 {
  background-image: repeating-linear-gradient(-45deg, var(--pattern-color), var(--pattern-color) 2.5px, transparent 2.5px, transparent 8px);
}
.pat-6 {
  background-image: repeating-linear-gradient(90deg, var(--pattern-color), var(--pattern-color) 2px, transparent 2px, transparent 8px);
}
.pat-7 {
  background-image: 
    linear-gradient(45deg, var(--pattern-color) 25%, transparent 25%), 
    linear-gradient(-45deg, var(--pattern-color) 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, var(--pattern-color) 75%), 
    linear-gradient(-45deg, transparent 75%, var(--pattern-color) 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}
.pat-8 {
  background-image: repeating-radial-gradient(circle at 0 0, transparent 0, transparent 4px, var(--pattern-color) 4px, var(--pattern-color) 6px);
  background-size: 10px 10px;
}

.region-glyph-badge {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 11px;
  line-height: 1;
  opacity: 0.85;
  filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.7));
  z-index: 2;
  pointer-events: none;
  user-select: none;
}

.region-number-badge {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 11px;
  font-weight: 850;
  font-family: system-ui, sans-serif;
  color: rgba(61, 49, 53, 0.82);
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.9);
  line-height: 1;
  z-index: 2;
  pointer-events: none;
  user-select: none;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/styles/theme.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css tests/styles/theme.test.ts
git commit -m "feat(styles): add CSS pattern overlays and accessibility badge styles"
```

---

### Task 3: Board Rendering with Region Assist Support

**Files:**
- Modify: `src/components/Board.tsx:5-170`
- Modify: `src/components/GameScreen.tsx:185-195`
- Test: `tests/components/BoardAndCat.test.tsx`

**Interfaces:**
- Consumes: `RegionAssistMode` from `src/types/puzzle.ts`
- Consumes: `CSS classes` from `src/styles/theme.css`
- Produces: `BoardProps.regionAssist?: RegionAssistMode`
- Produces: `REGION_GLYPHS` constant `['🐾', '🐟', '🧶', '🔔', '⭐', '🌙', '🐭', '👑', '💖']`

- [ ] **Step 1: Write failing tests in `tests/components/BoardAndCat.test.tsx`**

```tsx
it('renders region assist indicators (textures, glyphs, numbers) when enabled', () => {
  const regions = [
    [0, 1],
    [2, 3],
  ];
  const board: CellState[][] = [
    ['empty', 'empty'],
    ['empty', 'empty'],
  ];
  const locked = [
    [false, false],
    [false, false],
  ];

  // Test textures
  const { container: texContainer, unmount: unmountTex } = render(
    <Board
      size={2}
      regions={regions}
      board={board}
      lockedCats={locked}
      conflictingKeys={new Set()}
      lastPlacedCat={null}
      lastErrorCell={null}
      isVictory={false}
      catVariant="black"
      regionAssist="textures"
      onCellTap={() => {}}
      onDragCross={() => {}}
    />
  );
  expect(texContainer.querySelector('.pat-1')).not.toBeNull();
  unmountTex();

  // Test glyphs
  const { container: glyContainer, unmount: unmountGly } = render(
    <Board
      size={2}
      regions={regions}
      board={board}
      lockedCats={locked}
      conflictingKeys={new Set()}
      lastPlacedCat={null}
      lastErrorCell={null}
      isVictory={false}
      catVariant="black"
      regionAssist="glyphs"
      onCellTap={() => {}}
      onDragCross={() => {}}
    />
  );
  const glyphs = glyContainer.querySelectorAll('.region-glyph-badge');
  expect(glyphs).toHaveLength(4);
  expect(glyphs[0].textContent).toBe('🐾'); // Reg 0
  expect(glyphs[1].textContent).toBe('🐟'); // Reg 1
  unmountGly();

  // Test numbers (Review Focus #3: 1-indexed)
  const { container: numContainer } = render(
    <Board
      size={2}
      regions={regions}
      board={board}
      lockedCats={locked}
      conflictingKeys={new Set()}
      lastPlacedCat={null}
      lastErrorCell={null}
      isVictory={false}
      catVariant="black"
      regionAssist="numbers"
      onCellTap={() => {}}
      onDragCross={() => {}}
    />
  );
  const nums = numContainer.querySelectorAll('.region-number-badge');
  expect(nums).toHaveLength(4);
  expect(nums[0].textContent).toBe('1'); // Reg 0 -> 1
  expect(nums[1].textContent).toBe('2'); // Reg 1 -> 2
});

it('Review Focus #2: cell tap and drag work normally even with region assist badges active', () => {
  const onCellTap = vi.fn();
  const regions = [[0]];
  const board: CellState[][] = [['empty']];
  const locked = [[false]];

  const { getByTestId } = render(
    <Board
      size={1}
      regions={regions}
      board={board}
      lockedCats={locked}
      conflictingKeys={new Set()}
      lastPlacedCat={null}
      lastErrorCell={null}
      isVictory={false}
      catVariant="black"
      regionAssist="glyphs"
      onCellTap={onCellTap}
      onDragCross={() => {}}
    />
  );

  fireEvent.click(getByTestId('cell-0-0'));
  expect(onCellTap).toHaveBeenCalledWith(0, 0, expect.anything());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/BoardAndCat.test.tsx`  
Expected: FAIL because `regionAssist` prop is not yet supported.

- [ ] **Step 3: Implement `regionAssist` in `src/components/Board.tsx` and pass it in `GameScreen.tsx`**

In `src/components/Board.tsx`:
```tsx
export const REGION_GLYPHS = ['🐾', '🐟', '🧶', '🔔', '⭐', '🌙', '🐭', '👑', '💖'];

export interface BoardProps {
  // ... existing props
  regionAssist?: RegionAssistMode;
}
```
Inside the cell render loop:
```tsx
{regionAssist === 'textures' && (
  <div className={`region-pattern pat-${regId % 9}`} />
)}
{regionAssist === 'glyphs' && (
  <span className="region-glyph-badge">{REGION_GLYPHS[regId % 9]}</span>
)}
{regionAssist === 'numbers' && (
  <span className="region-number-badge">{(regId % 9) + 1}</span>
)}
```
In `src/components/GameScreen.tsx`:
Pass `regionAssist={settings.regionAssist}` to `<Board ... />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/BoardAndCat.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Board.tsx src/components/GameScreen.tsx tests/components/BoardAndCat.test.tsx
git commit -m "feat(board): render pattern overlays, mascot glyphs, and number badges"
```

---

### Task 4: Settings Modal Selector & App Integration

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `tests/App.test.tsx`
- Modify: `src/components/TutorialModal.tsx` (optional: pass regionAssist if desired)

**Interfaces:**
- Consumes: `RegionAssistMode` from `src/types/puzzle.ts`
- Consumes: `AppSettings` with `regionAssist`
- Produces: UI selector in `SettingsModal` allowing user to switch `regionAssist` mode.

- [ ] **Step 1: Write integration test in `tests/App.test.tsx`**

```tsx
it('Review Focus #5: allows changing Region Assist in Settings and applies it to the active game board', () => {
  const { getByTestId, querySelector } = render(<App />);

  // Open settings
  fireEvent.click(getByTestId('open-settings-btn'));

  // Select Glyphs
  fireEvent.click(getByTestId('select-region-assist-glyphs'));
  fireEvent.click(getByTestId('close-settings-btn'));

  // Start game and verify glyph badges are present on the board
  fireEvent.click(getByTestId('start-chill-btn'));
  const cell = document.querySelector('[data-testid="cell-0-0"]');
  expect(cell?.querySelector('.region-glyph-badge')).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/App.test.tsx`  
Expected: FAIL because `select-region-assist-glyphs` does not exist.

- [ ] **Step 3: Implement Region Assist selector in `src/components/SettingsModal.tsx`**

Add section:
```tsx
{/* Region Assist (Accessibility) */}
<div>
  <div style={{ fontSize: '13px', fontWeight: 800, color: '#7A686E', marginBottom: '8px' }}>
    AYUDA VISUAL DE REGIONES (ACCESIBILIDAD)
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
    {[
      { id: 'off', label: 'Desactivado', desc: 'Colores puros' },
      { id: 'textures', label: 'Texturas', desc: 'Rayas y tramas' },
      { id: 'glyphs', label: 'Gatitos 🐾', desc: 'Iconos en esquina' },
      { id: 'numbers', label: 'Números 1-9', desc: 'Dígitos en esquina' },
    ].map((item) => {
      const active = (settings.regionAssist || 'off') === item.id;
      return (
        <button
          key={item.id}
          data-testid={`select-region-assist-${item.id}`}
          onClick={() => onUpdateSettings({ ...settings, regionAssist: item.id as RegionAssistMode })}
          style={{
            padding: '9px 8px',
            borderRadius: '12px',
            border: active ? '3px solid #6366F1' : '2px solid #E2D6C1',
            background: active ? '#FFF' : '#EFE6D5',
            color: '#3D3135',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 800 }}>{item.label}</span>
          <span style={{ fontSize: '10.5px', color: '#7A686E', fontWeight: 600 }}>{item.desc}</span>
        </button>
      );
    })}
  </div>
</div>
```

- [ ] **Step 4: Run all tests to verify everything passes**

Run: `npm test`  
Expected: All test suites PASS (12 passed, 0 failed).

- [ ] **Step 5: Verify production build**

Run: `npm run build`  
Expected: Build succeeds cleanly with no TypeScript or asset errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/SettingsModal.tsx tests/App.test.tsx
git commit -m "feat(settings): add Region Assist accessibility UI and integration tests"
```

---

### Task 5: Full Verification & Demo Showcase Update

**Files:**
- Modify: `colorblind-solutions.html` (add link or note indicating options are integrated into game settings)
- Test: Full Vitest suite & build

- [ ] **Step 1: Run complete test suite**

Run: `npm test`  
Expected: All tests pass.

- [ ] **Step 2: Run linter/build checks**

Run: `npm run build`  
Expected: Clean build in `dist/`.

- [ ] **Step 3: Commit final integration**

```bash
git commit --allow-empty -m "chore: complete colorblind accessibility settings integration"
```
