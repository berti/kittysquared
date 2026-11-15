# Design Specification: Settings Enhancements & Reorganization

**Date:** 2026-11-15  
**Topic:** Settings Modal UI Tweaks, Interactive Cell Tester, Playlist Multi-Select & 5-Tab Reorganization  
**Status:** Proposed

---

## 1. Overview & Goals

This specification details a set of usability and visual refinements to the KittySquared Settings modal:
1. **Controls Tab Refinements:**
   - Remove the outer card border and background around the "Velocidad de doble toque" (Double-tap speed) section so it sits cleanly in the tab pane.
   - Replace the icon-based double-tap tester with an authentic, game-accurate interactive board cell. A single tap displays a translucent cross (`✕`); if the double-tap timer expires without a second tap, the cross disappears. A double tap places the player's equipped cat.
2. **Audio & Volume Modernization:**
   - Remove the redundant top-level "AUDIO" / "SONIDO" header in the Sound tab.
   - Elevate the subsections to prominent all-caps headers (`MÚSICA`, `EFECTOS (SFX)`, `BANDA SONORA` / `MUSIC`, `SOUND EFFECTS (SFX)`, `SOUNDTRACK`).
   - Replace the 5 discrete percentage buttons (`0%`, `25%`, `50%`, `75%`, `100%`) with stepped range sliders (`min="0" max="1" step="0.25"`).
3. **Multi-Track Soundtrack Playlist:**
   - Replace the single-selection track selector with a multi-selection playlist.
   - Provide an "All" ("Todas") master checkbox and individual checkboxes for each of the 6 soundtrack songs.
   - When multiple songs are checked, the audio engine cycles through the selected songs during gameplay.
4. **Dedicated Cat Breeds Tab:**
   - Extract the cat breed unlock gallery from the Graphics tab into its own dedicated tab (`cats` / "Gatos").
   - Expand the Settings modal navigation bar to 5 tabs: **Controles**, **Gatos**, **Gráficos** (Region Assist + Mini-board Preview), **Sonido**, and **Ayudas** (Auto-cross).
   - Add a custom Soft-Clay `CatTabIcon` matching the existing tab icons.
5. **Streamlined Auto-Cross Assist:**
   - Simplify the Auto-Cross feature from 3 options down to 2 clear options:
     - **No** (`off`): "Colocar todas las cruces de forma manual" / "Place all crosses manually"
     - **Sí** (`all`): "Fila, columna, alrededor y color" / "Row, column, surround & color" with helper text "Cruces en fila, columna, adyacentes y toda la región de color" / "Crosses in row, column, adjacent cells, and entire color region".

---

## 2. Approaches Considered

### Approach A: Native Multi-track Playlist in AppSettings & 5-Tab Architecture (Selected)
- Evolve `AppSettings` to store `selectedTracks: ConcreteTrackId[]` (defaulting to all 6 tracks) and narrow `autoCross` to `'off' | 'all'`.
- Provide robust backward compatibility in `loadPersistedState()`: legacy `'auto'` maps to all 6 tracks; a legacy single track ID maps to `[trackId]`; legacy `'row_col_surround'` auto-cross maps to `'all'`.
- Update `soundEngine` to play from `selectedTracks`.
- Expand `SettingsModal` tabs to 5 tabs with dedicated icons and clean layout.
- Render an authentic 52×52px board cell for the double-tap tester.
- **Trade-offs:** Touches `AppSettings`, `soundEngine`, and `SettingsModal`, but creates clean, modern, extensible code with zero technical debt and 100% backward compatibility.

### Approach B: Component-Only Changes with Legacy String Packing (Rejected)
- Keep `musicTrack` as a string in `AppSettings` and encode multiple selected tracks as a comma-separated string (e.g. `'marimba,velvet'`).
- Keep 4 tabs and stack cat breeds alongside region assists.
- **Trade-offs:** Adds serialization fragility, weakens TypeScript type safety, and fails to give cat breeds the dedicated focus the user requested.

---

## 3. Detailed Component & System Design

### 3.1 Data Model & Storage Evolution (`src/state/storage.ts`)

```ts
export type ConcreteTrackId =
  | 'marimba'
  | 'velvet'
  | 'sunbeam'
  | 'bossa'
  | 'waltz'
  | 'samba';

export const ALL_CONCRETE_TRACKS: readonly ConcreteTrackId[] = [
  'marimba',
  'velvet',
  'sunbeam',
  'bossa',
  'waltz',
  'samba',
];

export type AutoCrossMode = 'off' | 'all';

export interface AppSettings {
  language: Language;
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  autoCross: AutoCrossMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
  musicVolume: SteppedVolume;
  sfxVolume: SteppedVolume;
  selectedTracks: ConcreteTrackId[];
}
```

#### Storage Migration in `loadPersistedState()`:
- If `settings.selectedTracks` is an array of valid `ConcreteTrackId` with length > 0, use it.
- If legacy `settings.musicTrack` exists:
  - If `'auto'`, set `selectedTracks = [...ALL_CONCRETE_TRACKS]`.
  - If a valid track ID (e.g. `'marimba'`), set `selectedTracks = [raw.settings.musicTrack]`.
- Default: `[...ALL_CONCRETE_TRACKS]`.
- For `autoCross`: if legacy value is `'row_col_surround'` or `'all'`, set `'all'`; otherwise `'off'`.

---

### 3.2 Audio Engine Playlist Updates (`src/audio/soundEngine.ts`)

- Method `setSelectedTracks(tracks: ConcreteTrackId[]): void`:
  - Updates active playlist. If currently playing track is no longer in `tracks`, smoothly transitions to the next available track in `tracks`.
  - Guarantees fallback to `ALL_CONCRETE_TRACKS` if an empty array is provided.
- Method `getNextTrack()`:
  - Iterates through `this.selectedTracks` in playlist order (or cycles through them sequentially).

---

### 3.3 Settings Modal 5-Tab Architecture (`src/components/SettingsModal.tsx`)

#### Tabs:
1. `controls` ("Controles" / "Controls") — Icon: `ControlsTabIcon`
2. `cats` ("Gatos" / "Cats") — Icon: `CatTabIcon` (new Soft-Clay icon in `Icons.tsx`)
3. `graphics` ("Gráficos" / "Graphics") — Icon: `GraphicsTabIcon`
4. `sound` ("Sonido" / "Audio") — Icon: `SoundTabIcon`
5. `ayudas` ("Ayudas" / "Assists") — Icon: `AssistsTabIcon`

#### Tab 1: Controls ("Controles")
- **Language Selector:** Existing segmented control `[ Auto | Español | English ]` preserved at the top.
- **Double-Tap Speed Section:**
  - Outer card background and border removed.
  - Section header: `VELOCIDAD DE DOBLE TOQUE` with current timeout value (`{currentTimeout} ms ({speedCategory})`).
  - Slider: range input `250` to `900` with `25` step.
  - Ticks: `Rápido` / `Medio` / `Lento`.
  - **Interactive Board Cell Tester:**
    - Size: 52×52px, `borderRadius: 12px`, border: `2px solid #E2D6C1`, background: `#FFE3D8`.
    - Single-tap state: renders `<span style={{ opacity: 0.45 }}>✕</span>`.
    - Timer: sets timer for `currentTimeout` ms. If timer fires without a second tap, the cross disappears (`status: 'idle'`).
    - Double-tap state (within `currentTimeout` ms): renders `<CatSvg variant={settings.catVariant} state="idle" />`. Resets to idle after 1.2s.
    - Helper prompt text below cell: dynamically updates to guide the player.

#### Tab 2: Cats ("Gatos")
- Section title: `ELIGE TU GATITO` / `CHOOSE YOUR KITTEN`.
- Star counter badge (`{totalStars}★`).
- 8-breed responsive grid with unlock status, star requirements, and equip state.

#### Tab 3: Graphics ("Gráficos")
- Section title: `DIFERENCIACIÓN DE REGIONES` / `REGION DIFFERENTIATION`.
- 4 options: `Desactivado` / `Rayas` / `Iconos` / `Números 1-9`.
- Live Mini-Board Preview card (`VISTA PREVIA DEL TABLERO`).

#### Tab 4: Sound ("Sonido")
- Removed redundant top "SONIDO" / "AUDIO" banner.
- **MÚSICA** / **MUSIC**:
  - Header row: `MÚSICA` (all-caps bold) with right-aligned Mute toggle button (`Silenciada` / `Activa`).
  - Stepped slider: `<input type="range" min="0" max="1" step="0.25" value={musicVolume} ... />` with label indicators `0%`, `25%`, `50%`, `75%`, `100%`.
- **EFECTOS (SFX)** / **SOUND EFFECTS (SFX)**:
  - Header row: `EFECTOS (SFX)` with right-aligned Mute toggle button (`Silenciados` / `Activos`).
  - Stepped slider: `<input type="range" min="0" max="1" step="0.25" value={sfxVolume} ... />`.
- **BANDA SONORA** / **SOUNDTRACK**:
  - Header row: `BANDA SONORA`.
  - Master checkbox row: `[x] Todas las pistas` (`All tracks`).
  - 2-column grid of track checkboxes:
    - `[x] Marimba Michi`
    - `[x] Velvet Paws`
    - `[x] Sunbeam Stroll`
    - `[x] Bossa Meow`
    - `[x] Catnip Waltz`
    - `[x] Samba de Gatinho`
  - Logic: Toggling master checkbox checks/unchecks all. Individual uncheck unchecks master. At least 1 track remains checked at all times to prevent silent playlist.

#### Tab 5: Assists ("Ayudas")
- Section title: `COLOCAR CRUCES AUTOMÁTICAMENTE` / `AUTO-CROSS ELIMINATIONS`.
- 2 full-width cards:
  1. **No** (`off`):
     - Title: `No`
     - Desc: `Colocar todas las cruces de forma manual` / `Place all crosses manually`.
  2. **Sí** (`all`):
     - Title: `Sí (Fila, columna, alrededor y color)` / `Yes (Row, column, surround & color)`.
     - Desc: `Cruces en fila, columna, adyacentes y toda la región de color` / `Crosses in row, column, adjacent cells, and entire color region`.

---

### 3.4 Internationalization & Translations (`src/i18n/`)

- Add `settings.tabs.cats`: `"Gatos"` (ES) / `"Cats"` (EN).
- Add `settings.audio.allTracks`: `"Todas las pistas"` (ES) / `"All tracks"` (EN).
- Update `settings.assists.autoCrossOptions`:
  - `off`: `label: 'No'`, `desc: 'Colocar todas las cruces de forma manual'` / `label: 'No'`, `desc: 'Place all crosses manually'`.
  - `all`: `label: 'Sí (Fila, columna, alrededor y color)'`, `desc: 'Cruces en fila, columna, adyacentes y toda la región de color'` / `label: 'Yes (Row, column, surround & color)'`, `desc: 'Crosses in row, column, adjacent cells, and entire color region'`.

---

### 3.5 Zero-Emoji Compliance
- All new icons (e.g. `CatTabIcon`, checkbox check indicators) will be pure SVG or CSS graphics.
- Zero decorative emojis or country flag unicode characters.

---

## 4. Verification Plan

1. **Storage Unit Tests (`tests/state/storage.test.ts`):**
   - Migration of legacy `musicTrack: 'auto'` to `selectedTracks` containing all 6 tracks.
   - Migration of legacy single track to `[singleTrack]`.
   - Migration of legacy `autoCross: 'row_col_surround'` to `'all'`.
   - Persistence and reload of `selectedTracks` and binary `autoCross`.
2. **Audio Engine Tests (`tests/audio/soundEngine.test.ts`):**
   - `setSelectedTracks` correctly sets track rotation.
   - `getNextTrack` cycles only within `selectedTracks`.
3. **Settings Modal Component Tests (`tests/components/SettingsModal.test.tsx`):**
   - 5 tabs render and switch properly (`controls`, `cats`, `graphics`, `sound`, `ayudas`).
   - Double-tap speed section has no card border/background.
   - Interactive board cell tester: single tap shows translucent cross that clears upon timeout; double tap places cat SVG.
   - Stepped sliders update volume and mute states.
   - Master checkbox and individual track checkboxes toggle properly.
   - Binary auto-cross selection updates `settings.autoCross`.
   - Full bilingual localization tests (Spanish and English).
4. **CI & Regressions:**
   - `npx tsc --noEmit` passes with 0 errors.
   - Vitest suite passes 100% across all 31+ test files.
   - Zero-emoji audit passes cleanly.
