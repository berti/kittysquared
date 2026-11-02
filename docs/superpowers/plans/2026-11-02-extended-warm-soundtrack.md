# Extended Warm & Lively Soundtrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3 short 8-bar repeated loops with 6 full-length (56-bar, ~1m 20s–1m 52s), non-strident, multi-section arrangements (`marimba`, `velvet`, `sunbeam`, `bossa`, `waltz`, `samba`) using warm synthesizer voices and a streaming lookahead scheduler.

**Architecture:** Expand `MusicTrackOption` and `VALID_MUSIC_TRACKS` in `src/state/storage.ts` to support the 6 songs plus `'auto'`. Upgrade `src/audio/soundEngine.ts` with warm voices (`playMarimba`, `playRhodes`, `playKalimba`, de-stridented alto `playFlute`, mellow `playAccordion`, low-pitched `playWoodblock`, and a low-shelf warmth filter), compositional 56-bar arrangement builders (`buildExtended44Arrangement`, `buildExtendedWaltzArrangement`), and a 40ms rolling lookahead scheduler. Update `src/components/SettingsModal.tsx` to display `🔄 Auto (6 temas)` as a full-width top button above a 2×3 song selector grid.

**Tech Stack:** Preact 10, TypeScript, Web Audio API (`AudioContext`), Vitest, `@testing-library/preact`.

**Spec:** `docs/superpowers/specs/2026-11-02-extended-warm-soundtrack-design.md`

## Global Constraints

- Zero external audio assets; 100% Web Audio API synthesis.
- All lead melodies sit in a warm midrange (`G3`–`D5`); no accordion note exceeds `MIDI 76` (`E5`), and `playFlute` automatically folds frequencies `> 670Hz` down an octave.
- Each song is a 56-bar multi-section arrangement (`224` beats for 4/4 tracks, `168` beats for 3/4 `waltz`) that plays through its full cycle once in `'auto'` mode before advancing to the next song after a `2.5s` breath pause.
- Backward-compatible `localStorage` state validation: invalid or unknown `musicTrack` values fall back to `'auto'`.

## Review Focus

- Persisted `localStorage` state containing an invalid/unknown `musicTrack` string falls back cleanly to `'auto'`.
- Calling `playFlute` with a high-frequency note (`> 670Hz`) folds the oscillator frequency down an octave so it never produces piercing highs.
- Calling `setTrackPreference` with any of the 6 tracks (`'marimba' | 'velvet' | 'sunbeam' | 'bossa' | 'waltz' | 'samba'`) immediately updates `getCurrentTrackId()` without throwing when Web Audio API is unavailable in JSDOM.
- Every track in `TRACK_MAP` has at least `168` beats (56 bars) and non-empty `events` sorted by `beat`.
- Selecting any of the 6 track buttons or `Auto (6 temas)` in `SettingsModal` invokes `onUpdateSettings` with the corresponding `musicTrack` ID.

---

### Task 1: Expand `MusicTrackOption` and Storage Validation

**Files:**
- Modify: `src/state/storage.ts:18-45`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Produces:
  - `export type MusicTrackOption = 'auto' | 'marimba' | 'velvet' | 'sunbeam' | 'bossa' | 'waltz' | 'samba'`
  - `export const VALID_MUSIC_TRACKS: MusicTrackOption[] = ['auto', 'marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']`

- [x] **Step 1: Write the failing test in `tests/state/storage.test.ts`**

Add a test verifying all 6 track IDs (`marimba`, `velvet`, `sunbeam`, `bossa`, `waltz`, `samba`) persist and reload via `loadPersistedState()`, and that an invalid `musicTrack` value falls back to `'auto'`:

```typescript
  it('persists all 6 warm soundtrack IDs and falls back to "auto" for unknown track IDs', () => {
    for (const track of ['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba'] as const) {
      const state = getDefaultAppState();
      state.settings.musicTrack = track;
      savePersistedState(state);
      expect(loadPersistedState().settings.musicTrack).toBe(track);
    }

    localStorage.setItem(
      'kittysquared_state_v1',
      JSON.stringify({ settings: { musicTrack: 'removed_track_id' } })
    );
    expect(loadPersistedState().settings.musicTrack).toBe('auto');
  });
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL because `'marimba'`, `'velvet'`, and `'sunbeam'` are not in `VALID_MUSIC_TRACKS`.

- [x] **Step 3: Update `MusicTrackOption` and `VALID_MUSIC_TRACKS` in `src/state/storage.ts`**

Update `MusicTrackOption` and `VALID_MUSIC_TRACKS` in `src/state/storage.ts` to `['auto', 'marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS

---

### Task 2: Implement Warm Synthesizer Voices, 56-Bar Arrangements, and Lookahead Scheduler in `SoundEngine`

**Files:**
- Modify: `src/audio/soundEngine.ts`
- Test: `tests/audio/soundEngine.test.ts`

**Interfaces:**
- Consumes: `MusicTrackOption`, `SteppedVolume` from `src/state/storage.ts`
- Produces:
  - `export type ConcreteTrackId = Exclude<MusicTrackOption, 'auto'>`
  - `export const PLAYLIST_ORDER: ConcreteTrackId[] = ['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']`
  - `SoundEvent['inst']`: `'marimba' | 'rhodes' | 'kalimba' | 'guitar' | 'accordion' | 'flute' | 'bass' | 'bell' | 'shaker' | 'woodblock'`
  - `SoundEngine.prototype.playMarimba(freq: number, time: number, dur: number, gainLevel?: number): void`
  - `SoundEngine.prototype.playRhodes(freq: number, time: number, dur: number, gainLevel?: number): void`
  - `SoundEngine.prototype.playKalimba(freq: number, time: number, dur: number, gainLevel?: number): void`
  - `SoundEngine.prototype.getTrackDef(trackId: ConcreteTrackId): SoundTrackDef`
  - `SoundEngine.prototype.getNextTrack(): { track: SoundTrackDef; isNewTrack: boolean }`

- [x] **Step 1: Update and add failing tests in `tests/audio/soundEngine.test.ts`**

Update `tests/audio/soundEngine.test.ts` to test:
1. All 6 tracks (`marimba`, `velvet`, `sunbeam`, `bossa`, `waltz`, `samba`) have 56-bar extended arrangements (`totalBeats === 224` for 4/4 tracks, `totalBeats === 168` for 3/4 `waltz`) and >250 events.
2. No melody note in any track exceeds `MIDI 76` (`E5`), and `waltz` accordion notes stay `<= 69` (`A4`).
3. `getNextTrack()` in `'auto'` mode advances through `['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']` one full 56-bar cycle per song (`isNewTrack: true` on each transition), and when locked to a specific track (e.g., `'velvet'`), repeats that track with `isNewTrack: false` after the first cycle.
4. Calling `playMarimba`, `playRhodes`, `playKalimba`, `playFlute`, `playAccordion`, `playGuitar`, `playBass`, `playShaker`, `playWoodblock` operates safely without throwing.

```typescript
  it('builds full 56-bar arrangements (224 beats for 4/4, 168 beats for 3/4) for all 6 tracks without strident high notes', () => {
    const engine = new SoundEngine();
    const fourFourTracks = ['marimba', 'velvet', 'sunbeam', 'bossa', 'samba'] as const;
    for (const id of fourFourTracks) {
      const def = engine.getTrackDef(id);
      expect(def.totalBeats).toBe(224);
      expect(def.events.length).toBeGreaterThan(250);
      const shrillNotes = def.events.filter((ev) => ev.midi && ev.midi > 76);
      expect(shrillNotes.length).toBe(0);
    }

    const waltzDef = engine.getTrackDef('waltz');
    expect(waltzDef.totalBeats).toBe(168);
    expect(waltzDef.events.length).toBeGreaterThan(200);
    const highAccordion = waltzDef.events.filter(
      (ev) => ev.inst === 'accordion' && ev.midi && ev.midi > 72
    );
    expect(highAccordion.length).toBe(0);
  });

  it('advances across all 6 full-length songs in auto mode (1 full 56-bar cycle per song)', () => {
    const engine = new SoundEngine();
    engine.setTrackPreference('auto');

    const expectedOrder = ['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba'] as const;
    for (const expectedId of expectedOrder) {
      const next = engine.getNextTrack();
      expect(next.track.id).toBe(expectedId);
      expect(next.isNewTrack).toBe(true);
    }
  });
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: FAIL because `marimba`, `velvet`, `sunbeam`, `getTrackDef`, and the 56-bar arrangements do not exist yet.

- [x] **Step 3: Implement the warm synthesizer voices, 56-bar builders, and rolling lookahead scheduler in `src/audio/soundEngine.ts`**

In `src/audio/soundEngine.ts`:
1. Add `warmthFilter: BiquadFilterNode | null = null` (`lowshelf` at `220Hz`, `+2dB`) between `musicGainNode` and `compressor`.
2. Add `playMarimba`, `playRhodes`, `playKalimba`, and update `playFlute` (fold `freq > 670` down an octave, add sub-octave sine at `0.25`, lowpass at `1100Hz`), `playAccordion` (triangle + `0.32` sawtooth + sub-octave sine, lowpass at `Math.min(1150, freq * 2.2)`), `playGuitar` (lowpass `2200Hz -> 900Hz`), `playShaker` (bandpass `4800Hz`), and `playWoodblock` (`Math.min(560, freq)`).
3. Implement `buildExtended44Arrangement` and `buildExtendedWaltzArrangement` and define `TRACK_MAP` for `'marimba' | 'velvet' | 'sunbeam' | 'bossa' | 'waltz' | 'samba'` matching the approved compositions in `music-preview.html`.
4. Implement `getTrackDef(trackId: ConcreteTrackId): SoundTrackDef` and update `getNextTrack()` so `'auto'` mode steps through `PLAYLIST_ORDER` (`['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']`) once per full 56-bar song (`isNewTrack: true`), while a locked track repeats with `isNewTrack: false` after its first cycle.
5. Update `startMusic()` to use a 40ms rolling lookahead scheduler (`lookaheadBeats = 1.5`) that schedules only events in `[scheduledUntilBeat, currentBeat + 1.5]` and inserts a `2.5s` breath pause when `currentBeat >= activeTrack.totalBeats` before advancing to `getNextTrack()`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: PASS

---

### Task 3: Update Soundtrack Selector UI in `SettingsModal`

**Files:**
- Modify: `src/components/SettingsModal.tsx:617-654`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `MusicTrackOption` from `src/state/storage.ts`
- Produces:
  - Full-width `data-testid="track-opt-auto"` button (`🔄 Auto (6 temas)`)
  - 2×3 grid buttons with `data-testid`:
    - `track-opt-marimba` (`🪵 Marimba Michi`)
    - `track-opt-velvet` (`🎹 Velvet Paws`)
    - `track-opt-sunbeam` (`☀️ Sunbeam Stroll`)
    - `track-opt-bossa` (`🐱 Bossa Meow`)
    - `track-opt-waltz` (`🥐 Catnip Waltz`)
    - `track-opt-samba` (`🎉 Samba de Gatinho`)

- [x] **Step 1: Write the failing test in `tests/components/SettingsModal.test.tsx`**

Update the Sound tab tests in `tests/components/SettingsModal.test.tsx` to assert all 7 track selector buttons (`auto`, `marimba`, `velvet`, `sunbeam`, `bossa`, `waltz`, `samba`) render and update `musicTrack` when clicked:

```typescript
    // Track options (Auto + 6 songs)
    expect(getByTestId('track-opt-auto').textContent).toContain('Auto (6 temas)');
    expect(getByTestId('track-opt-marimba')).toBeDefined();
    expect(getByTestId('track-opt-velvet')).toBeDefined();
    expect(getByTestId('track-opt-sunbeam')).toBeDefined();
    expect(getByTestId('track-opt-bossa')).toBeDefined();
    expect(getByTestId('track-opt-waltz')).toBeDefined();
    expect(getByTestId('track-opt-samba')).toBeDefined();
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: FAIL because `track-opt-marimba`, `track-opt-velvet`, `track-opt-sunbeam`, and `Auto (6 temas)` are not rendered yet.

- [x] **Step 3: Update `SettingsModal.tsx` soundtrack selector layout**

In `src/components/SettingsModal.tsx`, render `🔄 Auto (6 temas)` (`data-testid="track-opt-auto"`) as a full-width button above a 2-column grid containing the 6 song buttons (`marimba`, `velvet`, `sunbeam`, `bossa`, `waltz`, `samba`) with compact padding (`8px 8px`) so the Sound tab fits comfortably within the modal without vertical overflow.

- [x] **Step 4: Run full test suite and build verification**

Run: `npx vitest run && npm run build`
Expected: All test suites PASS and production build succeeds with zero TypeScript errors.
