# Milestone 5 — Cat Art Overhaul & Unlockable Cat Breeds Design Spec

Date: 2026-11-07

## 1. Overview & Goals

Milestone 5 upgrades the feline illustrations in **KittySquared** from basic 2-variant flat shapes to a high-craft **Soft-Clay Classic** vector system with 8 distinct cat breeds unlocked through star progression:

1. **Vector Art Overhaul (`CatSvg.tsx`):** Re-engineered symmetrical head and ear geometry using SVG `<clipPath>` masking so breed markings, ear points, stripes, and Soft-Clay 3D highlights/shadows never bleed outside the head contour. Includes colored irises with pupils and dual catchlights, plus 4 crisp whiskers visible at all board scales (down to 32px on 10×10 grids).
2. **8-Breed Unlockable Roster (`puzzle.ts`, `storage.ts`):** Expands `CatVariant` to 8 breeds gated by total earned stars (`0★` to `280★`).
3. **Settings Breed Gallery (`SettingsModal.tsx`):** Upgrades the `Gráficos` tab selector into a compact 4×2 breed gallery displaying the player's current star count, live SVG previews, active selection states, and star requirement badges for locked breeds.
4. **Victory Modal Unlock Banner (`GameScreen.tsx`, `App.tsx`):** Detects when a level completion crosses one or more breed star thresholds and displays a celebratory `"¡Nuevo gatito desbloqueado!"` card in the Victory Modal with a one-tap `"Equipar"` button.

---

## 2. Breed Roster & Data Model

### 2.1 Types (`src/types/puzzle.ts`)

```ts
export type CatVariant =
  | 'black'
  | 'white'
  | 'orange'
  | 'siamese'
  | 'calico'
  | 'tuxedo'
  | 'russian'
  | 'sakura';

export interface CatBreedDef {
  id: CatVariant;
  name: string;
  requiredStars: number;
}
```

### 2.2 Breed Catalog & Star Milestones (`src/state/storage.ts`)

With 300 levels (`900★` maximum), the 8 breeds unlock across a smooth progression curve:

| ID (`CatVariant`) | Display Name (`name`) | Required Stars (`requiredStars`) | Visual Summary |
| :--- | :--- | :---: | :--- |
| `'black'` | `Gato Negro` | `0` | Velvet obsidian coat (`#231F2B`), glowing amber eyes (`#FBBF24`), white closed-eye & mouth strokes (`#FFFFFF`), pink inner ears/nose, white whiskers. |
| `'white'` | `Gato Blanco` | `0` | Marshmallow cream coat (`#FFFDF9`), sky-blue eyes (`#38BDF8`), dark cocoa closed-eye & mouth strokes (`#352A2E`), petal-pink inner ears. |
| `'orange'` | `Naranjito` | `25` | Warm tangerine (`#FB923C`), cinnamon forehead `"M"` & cheek stripes (`#C2410C`), cream muzzle (`#FFFBEB`), emerald eyes (`#10B981`), dark espresso closed-eye & mouth strokes (`#3B2314`). |
| `'siamese'` | `Siamés` | `60` | Toasted almond cream (`#F5EFE6`), chocolate ears (`#4A2F21`) & warm toasted-cocoa seal mask (`#9A6F55` / `#7D563F`), ice-blue eyes (`#38BDF8`), dark espresso closed-eye & mouth strokes (`#23140D`) for crisp contrast across both mask and cream fur. |
| `'calico'` | `Calicó` | `100` | Milk-white base (`#FFFDF9`), clipped ginger (`#EA580C`) and dark slate (`#332B3B`) ear/temple patches kept cleanly above the eye line, amber-honey eyes (`#F59E0B`), dark closed-eye & mouth strokes (`#2D2327`). |
| `'tuxedo'` | `Esmoquin` | `150` | Jet-black hood (`#201C29`), symmetrical white inverted-V blaze (`M 24 21.5 ...`) & white lower cheeks/chin (`#FFFDF9`), jade green eyes (`#22C55E`), crisp white closed-eye strokes (`#FFFFFF`) on the black hood and dark mouth stroke (`#201C29`) on the white muzzle. |
| `'russian'` | `Azul Ruso` | `210` | Plush slate-blue coat (`#64748B`), pewter muzzle (`#94A3B8`) & dark slate forehead chevrons (`#1E2631`), mauve inner ears (`#F4ACB7`), lime-emerald eyes (`#34D399`), dark slate-charcoal closed-eye & mouth strokes (`#1E2631`). |
| `'sakura'` | `Sakura Mochi` | `280` | Cherry-blossom pink (`#FDA4AF`), cream mochi cheeks & forehead blossom mark (`#FFF1F2`), berry outline & closed-eye/mouth strokes (`#6B1D2F`), violet eyes (`#A855F7`). |

### 2.3 Progression Helpers & Persistence Sanitization (`src/state/storage.ts`)

- `export const CAT_BREEDS: readonly CatBreedDef[]` and `export const VALID_CAT_VARIANTS: readonly CatVariant[]`.
- `export function getCatBreedDef(variant: CatVariant): CatBreedDef`: returns the breed definition (falling back to `'black'` if unknown).
- `export function isCatBreedUnlocked(variant: CatVariant, totalStars: number): boolean`: returns `totalStars >= getCatBreedDef(variant).requiredStars`.
- `export function getNewlyUnlockedBreeds(beforeStars: number, afterStars: number): CatBreedDef[]`: returns all breeds where `breed.requiredStars > beforeStars && breed.requiredStars <= afterStars`.
- **`loadPersistedState()` Sanitization:**
  - Computes `sanitizedProgress` first (including `levelStars`), then `totalStars = getTotalEarnedStars(sanitizedProgress)`.
  - Validates `cleanRawSettings.catVariant`: if it is in `VALID_CAT_VARIANTS` and `isCatBreedUnlocked(cleanRawSettings.catVariant, totalStars)` is true, preserves it; otherwise falls back to `'black'`.
- **`resetProgress(state)` Sanitization:**
  - Resets `progress.levelStars` to `{}` (`0★`).
  - If `state.settings.catVariant` requires `> 0` stars (`!isCatBreedUnlocked(state.settings.catVariant, 0)`), resets `settings.catVariant` to `'black'`. Free breeds (`'black'` and `'white'`) are preserved across progress resets.

---

## 3. Vector Art Architecture (`src/components/CatSvg.tsx`)

### 3.1 Master Soft-Clay Classic Silhouette & `<clipPath>` Masking

Each `<CatSvg variant={variant} state={state} />` renders a `viewBox="0 0 48 48"` SVG with:

1. **Unique Clip Path ID:** Uses a per-instance unique ID (`clip-cat-${instanceId}`) so `<clipPath>` definitions never collide when multiple cats are rendered simultaneously on the board.
2. **Symmetrical Head Path (`HEAD_PATH`):**
   - `M 24 12.8 Q 27.5 12.8, 30.5 14.0 Q 34.2 9.2, 37.8 6.8 Q 39.6 5.6, 40.2 7.8 Q 41.4 13.5, 40.8 20.2 C 43.2 27.2, 41.2 39.2, 24 40.2 C 6.8 39.2, 4.8 27.2, 7.2 20.2 Q 6.6 13.5, 7.8 7.8 Q 8.4 5.6, 10.2 6.8 Q 13.8 9.2, 17.5 14.0 Q 20.5 12.8, 24 12.8 Z`
   - Rendered first as the base fill (`data-cat-part="head"`).
3. **Clipped Markings & Soft-Clay 3D Shading (`<g clipPath="url(#...)" data-cat-part="markings">`):**
   - Renders breed-specific coat markings (forehead stripes, cheek stripes, seal mask, tricolor spots, tuxedo blaze, blossom mark) strictly clipped to `HEAD_PATH`.
   - Renders a top specular Soft-Clay highlight (`M 8 10 Q 24 15 40 10`) and a subtle bottom chin shadow (`M 8 38 Q 24 43 40 38`).
4. **Nested Curved Inner Ears (`<g data-cat-part="ears">`):**
   - Left inner ear: `M 9.8 18.2 Q 9.5 13.5, 10.2 9.8 Q 10.5 8.8, 11.4 9.6 Q 13.8 11.6, 15.8 14.8 Q 12.6 16.4, 9.8 18.2 Z`
   - Right inner ear: `M 38.2 18.2 Q 38.5 13.5, 37.8 9.8 Q 37.5 8.8, 36.6 9.6 Q 34.2 11.6, 32.2 14.8 Q 35.4 16.4, 38.2 18.2 Z`
5. **Master Outline Stroke:**
   - Draws `HEAD_PATH` with `fill="none"`, `stroke={palette.outline}`, `strokeWidth="2.5"`, `strokeLinejoin="round"` on top of the base fill, markings, and inner ears so every edge is sealed cleanly.
6. **4 Whiskers (`data-cat-part="whisker"`):**
   - Always rendered at all scales (`strokeWidth="1.85"`, `strokeLinecap="round"`):
     - Left top: `x1="2.2" y1="26.8" x2="9.2" y2="27.7"`
     - Left bottom: `x1="2.8" y1="30.8" x2="9.2" y2="30.2"`
     - Right top: `x1="45.8" y1="26.8" x2="38.8" y2="27.7"`
     - Right bottom: `x1="45.2" y1="30.8" x2="38.8" y2="30.2"`
7. **Nose (`data-cat-part="nose"`) & 4 Expression States (`data-cat-state={state}`):**
   - `idle`: `.cat-eyes-blink` group with colored iris circle (`r="4.5"`), pupil ellipse (`rx="2.6" ry="3.5"`), primary (`r="1.45"`) and secondary (`r="0.7"`) white catchlights, plus `ω` mouth.
   - `placed`: Happy curved arch eyes + smiling `ω` mouth.
   - `conflict`: Startled `> <` eyes + wavy distressed mouth.
   - `victory`: Rosy blush cheek ellipses (`#FF7597`) + joyful arch eyes + open happy mouth.

---

## 4. Settings Breed Gallery (`src/components/SettingsModal.tsx`)

### 4.1 Props & Header

- Add optional `totalStars?: number` to `SettingsModalProps` (defaults to `0`).
- In the `Gráficos` tab (`data-testid="pane-graphics"`), the `"DISEÑO DE GATITO"` section header displays a right-aligned star counter badge (`data-testid="settings-total-stars"`) showing a gold star SVG and `{totalStars}★`.

### 4.2 4×2 Breed Grid

- Replaces the 2-card flex row with a 4-column × 2-row grid (`display: 'grid'`, `gridTemplateColumns: 'repeat(4, 1fr)'`, `gap: '6px'`).
- Each breed renders a button/card with `data-testid="select-cat-${breed.id}"`, `data-locked={isLocked ? 'true' : 'false'}`, and `aria-disabled={isLocked}`:
  - **Unlocked (`totalStars >= breed.requiredStars`):**
    - Clicking calls `setVariant(breed.id)`.
    - Shows a `28×28px` `<CatSvg variant={breed.id} state="idle" />` and the breed's short label (`Negro`, `Blanco`, `Naranjito`, `Siamés`, `Calicó`, `Esmoquin`, `Azul Ruso`, `Sakura` or full name styled at `11px` font-weight `800`).
    - Active selection uses `background: '#FFF'`, `borderColor: '#6366F1'`, `boxShadow: '0 0 0 1px #6366F1'`.
  - **Locked (`totalStars < breed.requiredStars`):**
    - Clicking does not call `onUpdateSettings`.
    - Styled with `background: '#E8DFCE'`, `borderColor: '#D6C9B1'`, `opacity: 0.72`, `cursor: 'not-allowed'`.
    - Displays the `26×26px` `<CatSvg variant={breed.id} state="idle" />` preview, the breed name, and a gold pill badge (`{breed.requiredStars}★`) indicating the unlock threshold.

---

## 5. Victory Modal Unlock Callout (`src/components/GameScreen.tsx` & `src/App.tsx`)

### 5.1 Detecting Newly Unlocked Breeds

In `GameScreen.tsx`, when `session.status === 'won'` and `winOutcome` is present:
- `beforeStars = getTotalEarnedStars(progress)`
- `prevLevelStars = progress.levelStars?.[puzzle.id] ?? 0`
- `starGain = Math.max(0, winOutcome.bestStars - prevLevelStars)`
- `afterStars = beforeStars + starGain`
- `newlyUnlockedBreeds = getNewlyUnlockedBreeds(beforeStars, afterStars)`

### 5.2 Unlock Banner UI & One-Tap Equip

- Add optional `onSelectCatVariant?: (variant: CatVariant) => void` to `GameScreenProps`.
- When `newlyUnlockedBreeds.length > 0`, render a celebratory callout card (`data-testid="victory-unlocked-breed-banner"`) inside the Victory Modal above the action buttons (in both standard level victory and final level victory):
  - Displays the newly unlocked breed's `<CatSvg variant={breed.id} state="victory" />` (`40×40px`), title `"¡Nuevo gatito desbloqueado!"`, and breed name (`breed.name`).
  - Includes a one-tap action button (`data-testid="victory-equip-breed-btn"`):
    - When `settings.catVariant !== breed.id`: displays `"Equipar"` and clicking invokes `onSelectCatVariant?.(breed.id)`.
    - When `settings.catVariant === breed.id`: displays `"¡Equipado!"` and is disabled (`disabled={true}`).
- In `App.tsx`:
  - Pass `onSelectCatVariant={(variant) => handleUpdateSettings({ ...appState.settings, catVariant: variant })}` to `GameScreen`.
  - Compute `effectiveTotalStars` (adding the current won session's pending `starGain` if `activeScreen === 'game' && session.status === 'won'`) and pass `totalStars={effectiveTotalStars}` to `SettingsModal` so opening Settings from the Victory screen reflects the newly earned stars immediately.

---

## 6. Testing & Verification Plan

1. **`tests/components/BoardAndCat.test.tsx`:**
   - Verify all 8 `CatVariant` breeds render `[data-cat-part="head"]`, `[data-cat-part="ears"]`, `[data-cat-part="nose"]`, `[data-cat-part="markings"]`, and 4 `[data-cat-part="whisker"]` elements across all 4 `CatAnimState` states (`idle`, `placed`, `conflict`, `victory`), with unique `<clipPath>` IDs per instance.
2. **`tests/state/storage.test.ts`:**
   - Verify `CAT_BREEDS`, `isCatBreedUnlocked`, and `getNewlyUnlockedBreeds` across star boundaries (`0`, `24->25`, `59->60`, `279->280`).
   - Verify `loadPersistedState` preserves unlocked cat variants and falls back to `'black'` if a persisted variant is unknown or locked for the player's star count.
   - Verify `resetProgress` preserves `'black'` / `'white'` (`0★`) and resets locked breeds (`> 0★`) back to `'black'`.
3. **`tests/components/SettingsModal.test.tsx`:**
   - Verify all 8 breed cards render in the `Gráficos` tab along with `settings-total-stars`.
   - Verify locked breeds (`totalStars < requiredStars`) are marked `data-locked="true"` and do not trigger `onUpdateSettings` when clicked, whereas unlocked breeds trigger `onUpdateSettings` with the chosen `catVariant`.
4. **`tests/components/GameScreen.test.tsx` & `tests/App.test.tsx`:**
   - Verify that winning a level that crosses a star threshold (e.g. `24★ -> 27★` unlocking `Naranjito` at `25★`) displays `victory-unlocked-breed-banner` and clicking `victory-equip-breed-btn` updates `catVariant` to `'orange'`.
   - Verify that winning a level without crossing a threshold does not render `victory-unlocked-breed-banner`.
   - Verify the Zero-Emoji Audit test in `tests/components/Icons.test.tsx` continues to pass with zero Unicode emojis in `src/`.
