# Cat Art Overhaul & Unlockable Cat Breeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the cat vector art in `CatSvg.tsx` using a symmetrical `<clipPath>` Soft-Clay Classic silhouette with 8 unlockable cat breeds gated by star milestones (`0★` to `280★`), a 4×2 breed gallery in `SettingsModal.tsx`, and a one-tap `"Equipar"` unlock callout in the `GameScreen.tsx` Victory Modal.

**Architecture:** `src/types/puzzle.ts` and `src/state/storage.ts` define the 8-breed `CatVariant` union, `CAT_BREEDS` catalog, star-unlock helpers (`isCatBreedUnlocked`, `getNewlyUnlockedBreeds`), and persistence sanitization (`loadPersistedState`, `resetProgress`). `src/components/CatSvg.tsx` renders each breed using a per-instance `<clipPath>` matching the symmetrical head path, nested inner ears, 4 whiskers at all scales, colored irises with catchlights, and high-contrast `eyeStroke`/`mouthStroke` per breed. `SettingsModal.tsx` and `GameScreen.tsx` consume the catalog and helpers to present the 4×2 breed selector and post-level unlock banner.

**Tech Stack:** Preact, TypeScript, Vite, Vitest, `@testing-library/preact`.

**Spec:** `docs/superpowers/specs/2026-11-07-cat-art-and-breeds-design.md`

## Global Constraints

- Zero Unicode emojis in `src/**/*.{ts,tsx,css}`: use custom inline SVGs or the allowed `★` (`\u2605`) character so `tests/components/Icons.test.tsx` (Zero-Emoji Audit) passes.
- Preserve existing `data-cat-part="head"`, `data-cat-part="ears"`, `data-cat-part="nose"`, 4 `[data-cat-part="whisker"]` elements, `data-cat-state={state}`, `data-blink-delay={blinkDelay}`, and `className="cat-svg cat-${state}"` on `<CatSvg>`.
- All 8 breeds must use the exact `eyeStroke` and `mouthStroke` values from the spec so closed eyes (`placed`, `conflict`, `victory`) and mouths have crisp contrast (`#23140D` on `siamese`, `#FFFFFF` eyes / `#201C29` mouth on `tuxedo`, `#1E2631` on `russian`).
- Keep `totalStars?: number` optional in `SettingsModalProps` (defaulting to `0`) and `onSelectCatVariant?: (variant: CatVariant) => void` optional in `GameScreenProps` so existing component test suites remain backward-compatible.

## Review Focus

1. **Review Focus #1 — Corrupt or Locked `catVariant` in `localStorage`:** When `localStorage` contains an unknown `catVariant` (e.g. `'alien'`) or a breed whose `requiredStars` exceeds the player's earned stars (e.g. `'sakura'` with `10★`), `loadPersistedState()` must sanitize `settings.catVariant` back to `'black'`, while preserving `'orange'` when backfilled or explicit `levelStars` sum to `>= 25`.
2. **Review Focus #2 — `resetProgress` with Unlocked vs Free Breeds:** Calling `resetProgress(state)` when `catVariant` is `'siamese'` (`60★`) must reset `settings.catVariant` to `'black'` (and persist it), whereas calling `resetProgress(state)` when `catVariant` is `'white'` (`0★`) must preserve `'white'`.
3. **Review Focus #3 — Multiple `<CatSvg>` Instances `<clipPath>` ID Collision & Closed-Eye Contrast:** Rendering multiple `<CatSvg>` instances on the same board must generate distinct `<clipPath id="...">` attributes per instance, and `siamese`, `tuxedo`, and `russian` in `placed`/`conflict`/`victory` states must render their exact high-contrast `eyeStroke` (`#23140D`, `#FFFFFF`, `#1E2631`) and `mouthStroke` (`#23140D`, `#201C29`, `#1E2631`).
4. **Review Focus #4 — Clicking a Locked Breed Card in `SettingsModal`:** Clicking `select-cat-orange` when `totalStars` is `24` (`< 25`) must not invoke `onUpdateSettings`, whereas rendering with `totalStars={25}` unlocks `select-cat-orange` and invokes `onUpdateSettings` with `catVariant: 'orange'`.
5. **Review Focus #5 — Replay Victory Without Crossing a Milestone Threshold:** Winning a replay of an already-3★ level when `totalStars` is `25` (`beforeStars = 25`, `afterStars = 25`) must NOT display `victory-unlocked-breed-banner`, whereas improving a level from `1★` to `3★` to cross from `24★` to `26★` must display `victory-unlocked-breed-banner` for `Naranjito` and allow one-tap equipping.

---

### Task 1: Cat Breed Catalog, Unlock Helpers & Storage Sanitization

**Files:**
- Modify: `src/types/puzzle.ts:1-20`
- Modify: `src/state/storage.ts:1-210`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Produces in `src/types/puzzle.ts`:
  - `export type CatVariant = 'black' | 'white' | 'orange' | 'siamese' | 'calico' | 'tuxedo' | 'russian' | 'sakura';`
  - `export interface CatBreedDef { id: CatVariant; name: string; requiredStars: number; }`
- Produces in `src/state/storage.ts`:
  - `export const CAT_BREEDS: readonly CatBreedDef[]`
  - `export const VALID_CAT_VARIANTS: readonly CatVariant[]`
  - `export function getCatBreedDef(variant: CatVariant): CatBreedDef`
  - `export function isCatBreedUnlocked(variant: CatVariant, totalStars: number): boolean`
  - `export function getNewlyUnlockedBreeds(beforeStars: number, afterStars: number): CatBreedDef[]`

- [ ] **Step 1: Write the failing tests in `tests/state/storage.test.ts`**

Add tests for `CAT_BREEDS`, `isCatBreedUnlocked`, `getNewlyUnlockedBreeds`, and Review Focus #1 & #2 (`loadPersistedState` and `resetProgress` breed sanitization):

```ts
  it('defines all 8 cat breeds with ascending star milestones (0 to 280)', () => {
    expect(CAT_BREEDS.map((b) => [b.id, b.name, b.requiredStars])).toEqual([
      ['black', 'Gato Negro', 0],
      ['white', 'Gato Blanco', 0],
      ['orange', 'Naranjito', 25],
      ['siamese', 'Siamés', 60],
      ['calico', 'Calicó', 100],
      ['tuxedo', 'Esmoquin', 150],
      ['russian', 'Azul Ruso', 210],
      ['sakura', 'Sakura Mochi', 280],
    ]);
    expect(isCatBreedUnlocked('black', 0)).toBe(true);
    expect(isCatBreedUnlocked('white', 0)).toBe(true);
    expect(isCatBreedUnlocked('orange', 24)).toBe(false);
    expect(isCatBreedUnlocked('orange', 25)).toBe(true);
    expect(isCatBreedUnlocked('sakura', 279)).toBe(false);
    expect(isCatBreedUnlocked('sakura', 280)).toBe(true);
  });

  it('getNewlyUnlockedBreeds returns breeds whose milestone was crossed between beforeStars and afterStars', () => {
    expect(getNewlyUnlockedBreeds(23, 26).map((b) => b.id)).toEqual(['orange']);
    expect(getNewlyUnlockedBreeds(25, 25)).toEqual([]);
    expect(getNewlyUnlockedBreeds(58, 61).map((b) => b.id)).toEqual(['siamese']);
  });

  it('Review Focus #1: loadPersistedState preserves unlocked catVariant and falls back to "black" for unknown or locked breeds', () => {
    const stars25 = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, 3])); // 27 stars
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 10, totalScore: 900, activeSnapshot: null, levelStars: stars25 },
        settings: { catVariant: 'orange' },
      })
    );
    expect(loadPersistedState().settings.catVariant).toBe('orange');

    // Locked breed for 27 stars ('sakura' needs 280) falls back to 'black'
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 10, totalScore: 900, activeSnapshot: null, levelStars: stars25 },
        settings: { catVariant: 'sakura' },
      })
    );
    expect(loadPersistedState().settings.catVariant).toBe('black');

    // Unknown breed ID falls back to 'black'
    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({
        progress: { currentLevelId: 10, totalScore: 900, activeSnapshot: null, levelStars: stars25 },
        settings: { catVariant: 'invalid_cat' },
      })
    );
    expect(loadPersistedState().settings.catVariant).toBe('black');
  });

  it('Review Focus #2: resetProgress resets star-locked catVariant to "black" while preserving "white"', () => {
    const state = getDefaultAppState();
    state.progress.currentLevelId = 30;
    state.settings.catVariant = 'siamese';
    const afterResetLocked = resetProgress(state);
    expect(afterResetLocked.settings.catVariant).toBe('black');
    expect(loadPersistedState().settings.catVariant).toBe('black');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL (`CAT_BREEDS`, `isCatBreedUnlocked`, `getNewlyUnlockedBreeds` not exported).

- [ ] **Step 3: Implement `CatVariant`, `CatBreedDef`, `CAT_BREEDS`, unlock helpers, and storage sanitization in `src/types/puzzle.ts` and `src/state/storage.ts`**

In `src/types/puzzle.ts`, expand `CatVariant` to `'black' | 'white' | 'orange' | 'siamese' | 'calico' | 'tuxedo' | 'russian' | 'sakura'` and add `export interface CatBreedDef { id: CatVariant; name: string; requiredStars: number; }`.
In `src/state/storage.ts`, define `CAT_BREEDS`, `VALID_CAT_VARIANTS`, `getCatBreedDef`, `isCatBreedUnlocked`, and `getNewlyUnlockedBreeds`. In `loadPersistedState()`, compute `sanitizedLevelStars` first, compute `totalStars = getTotalEarnedStars({ ...mergedProgress, currentLevelId, levelStars: sanitizedLevelStars })`, and validate `catVariant` with `VALID_CAT_VARIANTS.includes(rawVariant) && isCatBreedUnlocked(rawVariant, totalStars) ? rawVariant : 'black'`. In `resetProgress(state)`, set `settings: { ...state.settings, catVariant: isCatBreedUnlocked(state.settings.catVariant, 0) ? state.settings.catVariant : 'black' }`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/puzzle.ts src/state/storage.ts tests/state/storage.test.ts
git commit -m "feat: add 8-breed catalog, star unlock helpers, and storage sanitization"
```

---

### Task 2: Soft-Clay Classic Vector Cat Overhaul & 8 Breeds (`CatSvg.tsx`)

**Files:**
- Modify: `src/components/CatSvg.tsx`
- Test: `tests/components/BoardAndCat.test.tsx`

**Interfaces:**
- Consumes from `src/types/puzzle.ts`: `CatVariant`, `CatAnimState`
- Preserves in `src/components/CatSvg.tsx`: `export function CatSvg({ variant, state }: CatSvgProps)`

- [ ] **Step 1: Write the failing tests in `tests/components/BoardAndCat.test.tsx`**

Update the variant loop in `tests/components/BoardAndCat.test.tsx` to test all 8 breeds (`'black'`, `'white'`, `'orange'`, `'siamese'`, `'calico'`, `'tuxedo'`, `'russian'`, `'sakura'`) across all 4 states (`'idle'`, `'placed'`, `'conflict'`, `'victory'`), and add a test for Review Focus #3 (unique `<clipPath>` IDs and exact closed-eye / mouth stroke contrast for `siamese`, `tuxedo`, and `russian`):

```tsx
  it('renders all 8 cat variants keeping clipped markings, ears, nose, and 4 whiskers across all 4 states', () => {
    const variants: CatVariant[] = [
      'black',
      'white',
      'orange',
      'siamese',
      'calico',
      'tuxedo',
      'russian',
      'sakura',
    ];
    for (const variant of variants) {
      for (const state of ['idle', 'placed', 'conflict', 'victory'] as const) {
        const { container } = render(<CatSvg variant={variant} state={state} />);
        expect(container.querySelector('[data-cat-part="head"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="markings"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="ears"]')).not.toBeNull();
        expect(container.querySelector('[data-cat-part="nose"]')).not.toBeNull();
        expect(container.querySelectorAll('[data-cat-part="whisker"]')).toHaveLength(4);
        expect(container.querySelector(`[data-cat-state="${state}"]`)).not.toBeNull();
      }
    }
  });

  it('Review Focus #3: generates unique clipPath IDs per instance and uses high-contrast closed-eye and mouth strokes on siamese, tuxedo, and russian', () => {
    const { container } = render(
      <div>
        <CatSvg variant="siamese" state="placed" />
        <CatSvg variant="tuxedo" state="placed" />
        <CatSvg variant="russian" state="placed" />
      </div>
    );
    const clipPaths = container.querySelectorAll('clipPath');
    expect(clipPaths).toHaveLength(3);
    const ids = Array.from(clipPaths).map((cp) => cp.getAttribute('id'));
    expect(new Set(ids).size).toBe(3);

    const svgs = container.querySelectorAll('svg.cat-svg');
    // Siamese: dark espresso (#23140D) closed eyes and mouth
    expect(svgs[0].querySelector('[data-cat-part="eye-closed"]')?.getAttribute('stroke')).toBe('#23140D');
    expect(svgs[0].querySelector('[data-cat-part="mouth"]')?.getAttribute('stroke')).toBe('#23140D');
    // Tuxedo: white (#FFFFFF) closed eyes on black hood, dark (#201C29) mouth on white muzzle
    expect(svgs[1].querySelector('[data-cat-part="eye-closed"]')?.getAttribute('stroke')).toBe('#FFFFFF');
    expect(svgs[1].querySelector('[data-cat-part="mouth"]')?.getAttribute('stroke')).toBe('#201C29');
    // Russian Blue: dark slate-charcoal (#1E2631) closed eyes and mouth
    expect(svgs[2].querySelector('[data-cat-part="eye-closed"]')?.getAttribute('stroke')).toBe('#1E2631');
    expect(svgs[2].querySelector('[data-cat-part="mouth"]')?.getAttribute('stroke')).toBe('#1E2631');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/BoardAndCat.test.tsx`
Expected: FAIL (`[data-cat-part="markings"]` and `[data-cat-part="eye-closed"]` not found).

- [ ] **Step 3: Implement the Soft-Clay Classic `<CatSvg>` with all 8 breeds in `src/components/CatSvg.tsx`**

In `src/components/CatSvg.tsx`, define:
- `HEAD_PATH = 'M 24 12.8 Q 27.5 12.8, 30.5 14.0 Q 34.2 9.2, 37.8 6.8 Q 39.6 5.6, 40.2 7.8 Q 41.4 13.5, 40.8 20.2 C 43.2 27.2, 41.2 39.2, 24 40.2 C 6.8 39.2, 4.8 27.2, 7.2 20.2 Q 6.6 13.5, 7.8 7.8 Q 8.4 5.6, 10.2 6.8 Q 13.8 9.2, 17.5 14.0 Q 20.5 12.8, 24 12.8 Z'`
- `LEFT_INNER_EAR = 'M 9.8 18.2 Q 9.5 13.5, 10.2 9.8 Q 10.5 8.8, 11.4 9.6 Q 13.8 11.6, 15.8 14.8 Q 12.6 16.4, 9.8 18.2 Z'`
- `RIGHT_INNER_EAR = 'M 38.2 18.2 Q 38.5 13.5, 37.8 9.8 Q 37.5 8.8, 36.6 9.6 Q 34.2 11.6, 32.2 14.8 Q 35.4 16.4, 38.2 18.2 Z'`
- A `BREED_THEMES: Record<CatVariant, ...>` lookup table with `baseFill`, `outline`, `innerEar`, `eyeIris`, `eyePupil`, `eyeStroke`, `nose`, `mouth`, `whisker`, `rimHighlight`, and `renderMarkings()` matching Section 2.2 and Section 3.1 of the spec.
- Generate a unique `clipId` per component instance in `useMemo`.
- Add `data-cat-part="markings"` on the `<g clipPath={...}>` group, `data-cat-part="eye-closed"` on the closed-eye `<path>` elements in `placed`, `conflict`, and `victory`, and `data-cat-part="mouth"` on the mouth `<path>` elements.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/components/BoardAndCat.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CatSvg.tsx tests/components/BoardAndCat.test.tsx
git commit -m "feat: overhaul CatSvg with Soft-Clay Classic geometry and 8 breeds"
```

---

### Task 3: Settings Breed Gallery & Star Counter (`SettingsModal.tsx`)

**Files:**
- Modify: `src/components/SettingsModal.tsx:18-35, 325-395`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes from `src/state/storage.ts`: `CAT_BREEDS`, `isCatBreedUnlocked`
- Modifies in `src/components/SettingsModal.tsx`:
  - `export interface SettingsModalProps { settings: AppSettings; totalStars?: number; onUpdateSettings: (settings: AppSettings) => void; onClose: () => void; }`

- [ ] **Step 1: Write the failing tests in `tests/components/SettingsModal.test.tsx`**

Add tests for the 8-breed gallery, star counter badge (`settings-total-stars`), and Review Focus #4 (locked vs unlocked breed selection):

```tsx
  it('Review Focus #4: Graphics tab renders 8 cat breeds, displays totalStars badge, blocks locked breeds, and selects unlocked breeds', () => {
    const onUpdateSettings = vi.fn();
    const { getByTestId, rerender } = render(
      <SettingsModal
        settings={defaultSettings}
        totalStars={24}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(getByTestId('tab-btn-graphics'));
    expect(getByTestId('settings-total-stars').textContent).toContain('24★');

    // Black and White are unlocked at 24 stars; Orange (25★) is locked
    const orangeCard = getByTestId('select-cat-orange');
    expect(orangeCard.getAttribute('data-locked')).toBe('true');
    fireEvent.click(orangeCard);
    expect(onUpdateSettings).not.toHaveBeenCalled();

    // Rerender with 60 stars -> Orange (25★) and Siamese (60★) are unlocked, Calico (100★) is locked
    rerender(
      <SettingsModal
        settings={defaultSettings}
        totalStars={60}
        onUpdateSettings={onUpdateSettings}
        onClose={vi.fn()}
      />
    );
    expect(getByTestId('select-cat-orange').getAttribute('data-locked')).toBe('false');
    expect(getByTestId('select-cat-siamese').getAttribute('data-locked')).toBe('false');
    expect(getByTestId('select-cat-calico').getAttribute('data-locked')).toBe('true');

    fireEvent.click(getByTestId('select-cat-siamese'));
    expect(onUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ catVariant: 'siamese' })
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: FAIL (`settings-total-stars` and `select-cat-orange` not found).

- [ ] **Step 3: Implement the 4×2 Breed Gallery and Star Counter in `src/components/SettingsModal.tsx`**

In `src/components/SettingsModal.tsx`:
- Add `totalStars = 0` to `SettingsModalProps`.
- In `pane-graphics`, render a header row with `"DISEÑO DE GATITO"` and a right-aligned pill `data-testid="settings-total-stars"` containing `{totalStars}★`.
- Render `CAT_BREEDS` in a `repeat(4, 1fr)` grid (`gap: '6px'`). Each item has `data-testid={`select-cat-${breed.id}`}`, `data-locked={isLocked ? 'true' : 'false'}`, `aria-disabled={isLocked}`, a `28×28px` `<CatSvg variant={breed.id} state="idle" />`, the breed name, and (when locked) a gold badge `{breed.requiredStars}★`. Clicking only calls `setVariant(breed.id)` when `!isLocked`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/SettingsModal.test.tsx tests/components/Icons.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsModal.tsx tests/components/SettingsModal.test.tsx
git commit -m "feat: upgrade Settings graphics tab with 8-breed gallery and star counter"
```

---

### Task 4: Victory Modal New Breed Unlock Callout & App Wiring (`GameScreen.tsx`, `App.tsx`)

**Files:**
- Modify: `src/components/GameScreen.tsx:32-58, 70-85, 535-700`
- Modify: `src/App.tsx:320-350`
- Test: `tests/components/GameScreen.test.tsx`
- Test: `tests/App.test.tsx`

**Interfaces:**
- Consumes from `src/state/storage.ts`: `getTotalEarnedStars`, `getNewlyUnlockedBreeds`
- Modifies in `src/components/GameScreen.tsx`:
  - `export interface GameScreenProps { ...; onSelectCatVariant?: (variant: CatVariant) => void; }`

- [ ] **Step 1: Write the failing tests in `tests/components/GameScreen.test.tsx` and `tests/App.test.tsx`**

In `tests/components/GameScreen.test.tsx`, add tests for Review Focus #5 (showing `victory-unlocked-breed-banner` when crossing a milestone threshold, one-tap equipping via `victory-equip-breed-btn`, and hiding the banner on a replay that does not cross a milestone):

```tsx
  it('Review Focus #5: displays victory-unlocked-breed-banner when level win crosses a star milestone and allows one-tap equipping', () => {
    const onSelectCatVariant = vi.fn();
    // 8 levels with 3 stars = 24 stars. Winning level 9 with 0 mistakes (+3★ -> 27★) crosses 25★ (Naranjito)
    const levelStars = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i + 1, 3 as const]));
    const progress: ModeProgress = {
      currentLevelId: 9,
      totalScore: 800,
      activeSnapshot: null,
      levelStars,
    };
    const wonSession: LevelSessionState = {
      ...createLevelSession(samplePuzzle),
      puzzle: { ...samplePuzzle, id: 9 },
      status: 'won',
      mistakes: 0,
      partialScore: 40,
      levelBonus: 60,
    };

    const { getByTestId, rerender } = render(
      <GameScreen
        puzzle={wonSession.puzzle}
        progress={progress}
        settings={defaultSettings}
        session={wonSession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
        onSelectCatVariant={onSelectCatVariant}
      />
    );

    const banner = getByTestId('victory-unlocked-breed-banner');
    expect(banner.textContent).toContain('¡Nuevo gatito desbloqueado!');
    expect(banner.textContent).toContain('Naranjito');

    const equipBtn = getByTestId('victory-equip-breed-btn');
    expect(equipBtn.textContent).toBe('Equipar');
    fireEvent.click(equipBtn);
    expect(onSelectCatVariant).toHaveBeenCalledWith('orange');

    // Once equipped, button shows ¡Equipado! and is disabled
    rerender(
      <GameScreen
        puzzle={wonSession.puzzle}
        progress={progress}
        settings={{ ...defaultSettings, catVariant: 'orange' }}
        session={wonSession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
        onSelectCatVariant={onSelectCatVariant}
      />
    );
    expect(getByTestId('victory-equip-breed-btn').textContent).toBe('¡Equipado!');
    expect((getByTestId('victory-equip-breed-btn') as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not display victory-unlocked-breed-banner on a replay that does not cross a star threshold', () => {
    // Already has 27 stars (level 9 already has 3★)
    const levelStars = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, 3 as const]));
    const progress: ModeProgress = {
      currentLevelId: 10,
      totalScore: 900,
      activeSnapshot: null,
      levelStars,
    };
    const wonReplaySession: LevelSessionState = {
      ...createLevelSession(samplePuzzle),
      puzzle: { ...samplePuzzle, id: 9 },
      status: 'won',
      mistakes: 0,
      partialScore: 40,
      levelBonus: 60,
    };

    const { queryByTestId } = render(
      <GameScreen
        puzzle={wonReplaySession.puzzle}
        progress={progress}
        settings={defaultSettings}
        session={wonReplaySession}
        onUpdateSession={vi.fn()}
        onAdvanceLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onBackToMenu={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(queryByTestId('victory-unlocked-breed-banner')).toBeNull();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/components/GameScreen.test.tsx`
Expected: FAIL (`victory-unlocked-breed-banner` not found).

- [ ] **Step 3: Implement the Victory Unlock Banner in `src/components/GameScreen.tsx` and wire `totalStars` & `onSelectCatVariant` in `src/App.tsx`**

In `src/components/GameScreen.tsx`:
- Compute `beforeStars = getTotalEarnedStars(progress)`, `prevLevelStars = progress.levelStars?.[puzzle.id] ?? 0`, `starGain = winOutcome ? Math.max(0, winOutcome.bestStars - prevLevelStars) : 0`, `afterStars = beforeStars + starGain`, and `newlyUnlockedBreeds = winOutcome ? getNewlyUnlockedBreeds(beforeStars, afterStars) : []`.
- When `newlyUnlockedBreeds.length > 0`, render the `data-testid="victory-unlocked-breed-banner"` card inside the Victory Modal (above the action buttons in both `isLastLevel` and standard level victory branches) displaying `<CatSvg variant={unlockedBreed.id} state="victory" />`, `"¡Nuevo gatito desbloqueado!"`, `unlockedBreed.name`, and `<button data-testid="victory-equip-breed-btn">` (`"Equipar"` vs `"¡Equipado!"`).
In `src/App.tsx`:
- Pass `onSelectCatVariant={(variant) => handleUpdateSettings({ ...appState.settings, catVariant: variant })}` to `<GameScreen>`.
- Compute `effectiveTotalStars` (adding the current won session's pending `starGain` when `activeScreen === 'game' && session.status === 'won'`) and pass `totalStars={effectiveTotalStars}` to `<SettingsModal>`.

- [ ] **Step 4: Run the full test suite and TypeScript typecheck**

Run: `npx tsc --noEmit && npx vitest run tests/components tests/state tests/audio tests/styles tests/App.test.tsx`
Expected: PASS (0 TypeScript errors, all tests green).

- [ ] **Step 5: Commit**

```bash
git add src/components/GameScreen.tsx src/App.tsx tests/components/GameScreen.test.tsx tests/App.test.tsx
git commit -m "feat: add Victory Modal new cat breed unlock banner and one-tap equip"
```
