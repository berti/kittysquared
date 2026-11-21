# Extended Song Arrangements & Resolved Outro Design

## Intent & Why
The six procedural background songs in [soundEngine.ts](file:///home/berti/code/kittysquared/src/audio/soundEngine.ts) are catchy, but at 56 bars (~1m45s in 4/4 and ~1m20s in 3/4) they finish too quickly and end abruptly on an unresolved turnaround bar (`progA[7]`) with full percussion and comping cutting off on the final beat. We want to extend them by ~1.7×–2× by repeating core song sections, finish each song with a gentle wind-down and tonic cadence, and always pause briefly between song plays.

## Goals & Non-Goals
- **Goals:**
  - Expand the five 4/4 tracks (`marimba`, `velvet`, `sunbeam`, `bossa`, `samba`) from 56 bars (224 beats) to **96 bars (384 beats)** (~3m00s–3m12s).
  - Expand the 3/4 track (`waltz`, "Catnip Waltz") from 56 bars (168 beats) to **112 bars (336 beats)** (~2m40s) so its real-time duration matches the 4/4 tracks.
  - Replace the abrupt final turnaround bar with an **8-bar wind-down and resolved tonic outro** where the rhythm thins out, harmony resolves to the tonic (`progA[0]`), percussion drops out, and a final tonic chord + root bass + warm lead/bell note sustains and decays naturally over the final 2 bars.
  - Always apply the 2.5-second inter-song pause (`pauseUntilTime = now + 2.5`) whenever any track finishes, even when repeating a single selected track.
- **Non-Goals / Anti-Goals:**
  - Do not change the core melodies (`melA1`, `melA2`, `melB1`, `melB2`), chord progressions (`progA`, `progB`), tempos, or instrument synthesis voices.
  - Do not introduce shrill high-register notes (`midi > 76`, or `midi > 72` for accordion).

## Constraints
- All changes are self-contained in [soundEngine.ts](file:///home/berti/code/kittysquared/src/audio/soundEngine.ts) and verified in [soundEngine.test.ts](file:///home/berti/code/kittysquared/tests/audio/soundEngine.test.ts).
- Must maintain Web Audio node cleanup and existing playlist/volume/lifecycle behavior.

## Approaches Considered
1. **Approach 1 (Selected): 96-Bar 4/4 & 112-Bar 3/4 Full Reprise + 8-Bar Wind-Down/Tonic Outro (~1.7×–2× length)**
   - Repeats both Theme A (`A1 + A2`) and Bridge B (`B1 + B2`) after the breakdown with counter-melody interplay, followed by `A2` and an 8-bar wind-down/tonic outro (plus an extra 16-bar pass on the 3/4 Waltz). Gives the best musical flow and natural resolution.
2. **Approach 2: 108-Bar Full Body Double-Cycle + 4-Bar Outro**
   - Repeats the 8-bar melody-less breather a second time; discarded to keep melodic momentum in the second half.
3. **Approach 3: 84-Bar Compact Expansion + 4-Bar Outro**
   - Shorter (1.5×); discarded because the 3/4 Waltz remains relatively brief.

## Detailed Arrangement Specification

### 1. Five 4/4 Tracks (`buildExtended44Arrangement`, 96 bars = 384 beats)
- **Bars 0–3 (4 bars):** Groove Intro (`progA[0..3]`, `'intro'`)
- **Bars 4–11 (8 bars):** Theme A1 (`progA`, `melA1` on `lead1`)
- **Bars 12–19 (8 bars):** Theme A2 (`progA`, `melA2` on `lead1`, counter-fills on `accentInst`)
- **Bars 20–27 (8 bars):** Rhythm & Comping Breather (`progA`, `'rhythm-breather'`)
- **Bars 28–35 (8 bars):** Bridge B1 (`progB`, `melB1` on `lead2`)
- **Bars 36–43 (8 bars):** Bridge B2 (`progB`, `melB2` on `lead2`, counter-fills on `lead1`)
- **Bars 44–47 (4 bars):** Bass & Percussion Breakdown (`progA[0..3]`, `'breakdown'`)
- **Bars 48–55 (8 bars):** Theme A1 Reprise (`progA`, `melA1` on `lead1`, counter-fills on `lead2`)
- **Bars 56–63 (8 bars):** Theme A2 Reprise (`progA`, `melA2` on `lead1`, counter-fills on `accentInst`)
- **Bars 64–71 (8 bars):** Bridge B1 Reprise (`progB`, `melB1` on `lead2`, counter-fills on `accentInst`)
- **Bars 72–79 (8 bars):** Bridge B2 Reprise (`progB`, `melB2` on `lead2`, counter-fills on `lead1`)
- **Bars 80–87 (8 bars):** Final Chorus A2 (`progA`, `melA2` on `lead1`, counter-fills on `lead2`)
- **Bars 88–91 (4 bars):** Wind-Down Tag (`progA[0..3]`, `'outro-tag'` — softer half-time comping and light shaker, echoing a gentle 2-note motif from `melA1` on `lead2`/`accentInst`)
- **Bars 92–95 (4 bars):** Resolved Tonic Cadence (`'outro-cadence'` — bars 92–93 step through `progA[6]` → `progA[7]` with thinning percussion, and bar 94 resolves onto the tonic chord `progA[0]` with root bass, a warm sustained tonic comp chord, and the tonic melody note on `lead1` + `accentInst` ringing out and decaying through bar 95).

### 2. 3/4 Catnip Waltz (`buildExtendedWaltzArrangement`, 112 bars = 336 beats)
- **Bars 0–47 (48 bars):** Intro (4) → Theme A1 + A2 (16) → Breather (8) → Bridge B1 + B2 (16) → Breakdown (4)
- **Bars 48–63 (16 bars):** Theme A1 + A2 Reprise (accordion lead with kalimba/marimba waltz counter-chimes)
- **Bars 64–79 (16 bars):** Bridge B1 + B2 Reprise (kalimba and marimba trading with accordion harmony)
- **Bars 80–95 (16 bars):** Final Theme A1 + A2 Chorus (accordion + kalimba octave/fifth shimmer)
- **Bars 96–103 (8 bars):** Gentle Waltz Tag (`progA`, lighter guitar pluck on beat 1 & 2, soft kalimba response)
- **Bars 104–111 (8 bars):** Resolved Tonic Waltz Cadence (bars 104–107 cadence via `Am7 → D7 → G → D7`, bars 108–110 settle on tonic `G` major with bass root, gentle guitar arpeggio/chord, and warm accordion + kalimba tonic note sustaining and fading out with bar 111 resting into the pause).

### 3. Playback Transition (`SoundEngine.runMusicTick`)
- When `this.currentBeat >= this.activeTrack.totalBeats`, always set `this.pauseUntilTime = now + 2.5` (regardless of whether `nextInfo.isNewTrack` is true or false) so single-track loops and multi-track transitions both enjoy the natural pause after the resolved outro.
