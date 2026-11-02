# Extended Warm & Lively Soundtrack Design

## 1. Intent & Why
Expand the KittySquared soundtrack from 3 short 15-second loops into 6 full-length (~1m 20s to 1m 52s), non-strident, lively acoustic arrangements. By keeping melodies in a warm midrange (`G3`–`D5`), introducing rounded wooden/acoustic voices (Marimba, Rhodes EP, Kalimba), and structuring each song across 56 bars with rhythm breathers, instrument handoffs, and bass breakdowns, the soundtrack stays engaging and ear-friendly during long puzzle sessions.

## 2. Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - Add 3 new warm, upbeat tracks (`marimba`: *Marimba Michi*, `velvet`: *Velvet Paws*, `sunbeam`: *Sunbeam Stroll*) and upgrade the 3 existing tracks (`bossa`: *Bossa Meow*, `waltz`: *Catnip Waltz*, `samba`: *Samba de Gatinho*) with warm registers and 56-bar multi-section arrangements.
  - Add warm synthesizer voices (`playMarimba`, `playRhodes`, `playKalimba`) and de-strident existing voices (`playFlute` auto-folded below 670Hz with sub-harmonic warmth, `playAccordion` using triangle + low-passed reed, `playWoodblock` capped at 560Hz, and global low-shelf warmth filter).
  - Replace full-cycle node allocation with a rolling lookahead scheduler (~1.5 beats ahead every 40ms) that transitions smoothly between 56-bar songs with a 2.5s breath pause.
  - Update Settings (`SettingsModal.tsx` and `storage.ts`) to support all 6 tracks + `auto` in a compact layout (full-width `Auto (6 temas)` button above a 2×3 song grid).
- **Non-Goals:** External audio files or per-section manual seeking inside the in-game settings modal.
- **Anti-Goals:** Piercing high-frequency notes (>700Hz sustained leads), harsh dual-sawtooth buzz, or short 15-second repetitive loops.

## 3. Constraints
- Zero external audio assets; 100% Web Audio API synthesis.
- Backward-compatible `localStorage` state validation (`VALID_MUSIC_TRACKS` expanded; unknown values fallback to `'auto'`).
- Existing SoundEngine public API (`startMusic`, `stopMusic`, `setMuted`, `setVolume`, `setTrackPreference`, `playCross`, `playCatPlaced`, `playConflict`, `playVictory`, etc.) and unit/UI tests must remain compatible.

## 4. Approaches Considered
- **Approach A (Selected): Compositional Builder + Streaming Lookahead Scheduler**
  - Uses `buildExtended44Arrangement` and `buildExtendedWaltzArrangement` to construct the 56-bar event timelines for the 6 tracks, and schedules Web Audio nodes in a rolling 1.5-beat lookahead window every 40ms.
  - *Why chosen:* Keeps `soundEngine.ts` compact, avoids allocating 1,500+ Web Audio nodes at once on mobile devices, and allows instant track switching.
- **Approach B: Static Pre-Expanded Arrays + Full-Cycle Scheduling**
  - Hardcode ~3,000 lines of raw event arrays and schedule all 110 seconds at once. Rejected due to code bloat and simultaneous node allocation overhead.

## 5. Architecture & Decisions
1. **Storage (`src/state/storage.ts`):**
   - `MusicTrackOption = 'auto' | 'marimba' | 'velvet' | 'sunbeam' | 'bossa' | 'waltz' | 'samba'`
   - `VALID_MUSIC_TRACKS = ['auto', 'marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']`
2. **Audio Engine (`src/audio/soundEngine.ts`):**
   - Add `warmthFilter` (`lowshelf` at 220Hz) in the master music chain.
   - Implement `playMarimba`, `playRhodes`, `playKalimba`, and updated warm `playFlute`, `playAccordion`, `playGuitar`, `playBass`, `playShaker`, `playWoodblock`.
   - Build 56-bar arrangements (`224` beats for 4/4 tracks, `168` beats for 3/4 `waltz`) with 6 sections: Groove Intro (4 bars) → Theme A (16 bars) → Rhythm Breather (8 bars) → Bridge & Solo Handoff (16 bars) → Bass Breakdown (4 bars) → Theme A' Reprise (8 bars).
   - Rolling lookahead scheduler ticks every 40ms, advancing `currentBeat` and scheduling events falling within `[scheduledUntilBeat, currentBeat + 1.5]`. At the end of a track's `totalBeats`, waits a 2.5s musical breath before starting the next track in `['marimba', 'velvet', 'sunbeam', 'bossa', 'waltz', 'samba']` (or repeating the selected track).
3. **Settings UI (`src/components/SettingsModal.tsx`):**
   - Render `🔄 Auto (6 temas)` as a full-width button at the top of the `Banda Sonora` section, followed by a 2-column × 3-row grid for the 6 individual songs (`🪵 Marimba Michi`, `🎹 Velvet Paws`, `☀️ Sunbeam Stroll`, `🐱 Bossa Meow`, `🥐 Catnip Waltz`, `🎉 Samba de Gatinho`).

## 6. Left to the Builder
- Updating existing tests in `tests/` (`soundEngine.test.ts`, `storage.test.ts`, `SettingsModal.test.tsx`) to cover the 6 tracks, new instrument voices, and lookahead scheduling.
