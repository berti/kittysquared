# Extended Song Arrangements & Resolved Outro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the six procedural background songs to 96 bars in 4/4 (384 beats) and 112 bars in 3/4 (336 beats) with full theme/bridge reprises, a gentle 8-bar wind-down and tonic resolution outro, and a mandatory 2.5-second pause after every song completion.

**Architecture:** `buildExtended44Arrangement` and `buildExtendedWaltzArrangement` in `src/audio/soundEngine.ts` are expanded to schedule full Theme A and Bridge B reprises after the breakdown, followed by a 4-bar/8-bar wind-down tag and a 4-bar/8-bar resolved tonic cadence that thins out percussion and settles on `progA[0]`. `SoundEngine.runMusicTick` is updated to apply the 2.5-second inter-song pause unconditionally whenever `currentBeat >= activeTrack.totalBeats`.

**Tech Stack:** TypeScript, Web Audio API, Vitest

**Spec:** `docs/superpowers/specs/2026-11-21-extended-song-arrangements-design.md`

## Global Constraints

- Five 4/4 tracks (`marimba`, `velvet`, `sunbeam`, `bossa`, `samba`) must have `totalBeats: 384` (96 bars).
- The 3/4 track (`waltz`) must have `totalBeats: 336` (112 bars).
- No event in any track may have `midi > 76`, and no `'accordion'` event in `'waltz'` may have `midi > 72`.
- Do not modify existing `progA`, `progB`, `melA1`, `melA2`, `melB1`, `melB2` note arrays, tempos, or instrument synthesis methods.
- Always apply `this.pauseUntilTime = now + 2.5` when a track finishes (`this.currentBeat >= this.activeTrack.totalBeats`), even when looping a single track.

## Review Focus

1. **All event beats strictly within `[0, totalBeats)`:** Every scheduled event across all 6 tracks must satisfy `0 <= ev.beat < def.totalBeats` so no outro note is skipped by the `ev.beat < windowEnd` scheduler check.
2. **Percussion-free decay in the final bar:** The final bar of every track (beats `[380, 384)` in 4/4, beats `[333, 336)` in 3/4) must have zero `'shaker'` or `'woodblock'` events so the resolved chord rings out cleanly into the pause.
3. **Tonic bass resolution on final bass event:** The last `'bass'` event of every track must resolve to the tonic root of `progA[0]` (`progA[0].bass[0]` for 4/4 tracks: 41, 46, 43, 48, 50; `progA[0].bass` for waltz: 43) rather than the dominant turnaround of `progA[7]`.
4. **Register ceiling preserved across reprises and outros:** Every event across all 6 extended arrangements must stay at or below `midi <= 76` (`midi <= 72` for `'accordion'`).
5. **Unconditional 2.5s pause on single-track repeat:** When a single track is selected (`setTrackPreference('velvet')`) and `currentBeat` reaches `totalBeats`, `runMusicTick()` must set `pauseUntilTime` to `now + 2.5` and reset `currentBeat` to `0`.

---

### Task 1: Expand 4/4 and 3/4 Song Arrangements with Reprises and Resolved Tonic Outros

**Files:**
- Modify: `src/audio/soundEngine.ts:80-405` (`buildExtended44Arrangement`, `buildExtendedWaltzArrangement`, and `totalBeats` on `MARIMBA_TRACK`, `VELVET_TRACK`, `SUNBEAM_TRACK`, `BOSSA_TRACK`, `WALTZ_TRACK`, `SAMBA_TRACK`)
- Test: `tests/audio/soundEngine.test.ts:49-68`

**Interfaces:**
- Consumes: `Arrangement44Spec`, `ChordBarDef`, `MelodyNoteDef`, `SoundEvent`, `SoundTrackDef` in `src/audio/soundEngine.ts`
- Produces:
  - `buildExtended44Arrangement(spec: Arrangement44Spec): SoundEvent[]` returning a 96-bar (384-beat) arrangement
  - `buildExtendedWaltzArrangement(): SoundEvent[]` returning a 112-bar (336-beat) arrangement
  - `SoundTrackDef.totalBeats = 384` for `'marimba' | 'velvet' | 'sunbeam' | 'bossa' | 'samba'` and `336` for `'waltz'`

- [ ] **Step 1: Update and add failing arrangement & outro tests in `tests/audio/soundEngine.test.ts`**

Replace the 56-bar test at `tests/audio/soundEngine.test.ts:49-67` with assertions for the 96-bar (384-beat) 4/4 arrangements, 112-bar (336-beat) 3/4 waltz arrangement, register limits, tonic bass resolution, and percussion-free final decay bar:

```ts
  it('builds extended 96-bar (384-beat 4/4) and 112-bar (336-beat 3/4) arrangements with resolved tonic outros and no shrill notes', () => {
    const engine = new SoundEngine();
    const expectedTonicBass: Record<string, number> = {
      marimba: 41,
      velvet: 46,
      sunbeam: 43,
      bossa: 48,
      samba: 50,
    };
    const fourFourTracks = ['marimba', 'velvet', 'sunbeam', 'bossa', 'samba'] as const;
    for (const id of fourFourTracks) {
      const def = engine.getTrackDef(id);
      expect(def.totalBeats).toBe(384);
      expect(def.events.length).toBeGreaterThan(450);

      // Review Focus #1 & #4: all beats within [0, 384) and no shrill notes > 76
      for (const ev of def.events) {
        expect(ev.beat).toBeGreaterThanOrEqual(0);
        expect(ev.beat).toBeLessThan(384);
      }
      const shrillNotes = def.events.filter((ev) => ev.midi && ev.midi > 76);
      expect(shrillNotes.length).toBe(0);

      // Review Focus #2: final bar [380, 384) has no shaker or woodblock hits
      const finalBarPerc = def.events.filter(
        (ev) => ev.beat >= 380 && (ev.inst === 'shaker' || ev.inst === 'woodblock')
      );
      expect(finalBarPerc.length).toBe(0);

      // Review Focus #3: last bass note resolves to tonic root of progA[0]
      const bassEvents = def.events.filter((ev) => ev.inst === 'bass');
      expect(bassEvents[bassEvents.length - 1].midi).toBe(expectedTonicBass[id]);
    }

    const waltzDef = engine.getTrackDef('waltz');
    expect(waltzDef.totalBeats).toBe(336);
    expect(waltzDef.events.length).toBeGreaterThan(400);
    for (const ev of waltzDef.events) {
      expect(ev.beat).toBeGreaterThanOrEqual(0);
      expect(ev.beat).toBeLessThan(336);
    }
    const highAccordion = waltzDef.events.filter(
      (ev) => ev.inst === 'accordion' && ev.midi && ev.midi > 72
    );
    expect(highAccordion.length).toBe(0);

    const waltzFinalBarPerc = waltzDef.events.filter(
      (ev) => ev.beat >= 333 && (ev.inst === 'shaker' || ev.inst === 'woodblock')
    );
    expect(waltzFinalBarPerc.length).toBe(0);

    const waltzBass = waltzDef.events.filter((ev) => ev.inst === 'bass');
    expect(waltzBass[waltzBass.length - 1].midi).toBe(43);
  });
```

- [ ] **Step 2: Run Vitest on `tests/audio/soundEngine.test.ts` to verify RED failure**

Run: `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npx vitest run tests/audio/soundEngine.test.ts --configLoader runner`
Expected: FAIL with `expected 224 to be 384`

- [ ] **Step 3: Implement the 96-bar 4/4 arrangement and 112-bar 3/4 waltz arrangement in `src/audio/soundEngine.ts`**

In `src/audio/soundEngine.ts`:
1. In `buildExtended44Arrangement(spec)`:
   - Support `'outro-tag'` in `addRhythmBar` (half-time bass on beat 0 and 2.5, soft shaker on beats 0 and 2 only, no woodblock, gentle comping chords at `0.18` gain on beats 0 and 2.5).
   - Keep bars 0–47 as-is.
   - Schedule bars 48–55: Theme A1 reprise (`progA`, `'main'`, `addMelody8Bars(48, melA1, lead1, lead2)`).
   - Schedule bars 56–63: Theme A2 reprise (`progA`, `'main'`, `addMelody8Bars(56, melA2, lead1, accentInst)`).
   - Schedule bars 64–71: Bridge B1 reprise (`progB`, `'bridge'`, `addMelody8Bars(64, melB1, lead2, accentInst)`).
   - Schedule bars 72–79: Bridge B2 reprise (`progB`, `'bridge'`, `addMelody8Bars(72, melB2, lead2, lead1)`).
   - Schedule bars 80–87: Final Chorus A2 (`progA`, `'main'`, `addMelody8Bars(80, melA2, lead1, lead2)`).
   - Schedule bars 88–91: 4-bar Wind-Down Tag (`progA[0..3]`, `'outro-tag'`) with a gentle echo of the first 4 melody notes of `melA1` on `lead2` (at `0.17` gain) in bars 88–89 and `accentInst` (at `0.16` gain) in bars 90–91.
   - Schedule bars 92–95: 4-bar Resolved Tonic Cadence:
     - Bar 92 (`b = 368`, `progA[6]`): bass on beat 0 and 2.5, soft shaker on 0 and 2, comp chord on beat 0 (`dur: 1.2, gain: 0.2`) and 2.5 (`dur: 1.0, gain: 0.18`), lead1 pre-cadence note `progA[6].voicing[2]` at `b + 0` (`dur: 1.8, gain: 0.19`).
     - Bar 93 (`b = 372`, `progA[7]`): bass on beat 0 (`progA[7].bass[0]`, `dur: 1.2`) and beat 2 (`progA[7].bass[1]`, `dur: 1.2`), soft shaker on beat 0 only, comp chord on beat 0 (`dur: 1.4, gain: 0.19`) and beat 2 (`dur: 1.4, gain: 0.18`), lead1 cadence note `progA[7].voicing[2]` at `b + 2.0` (`dur: 1.6, gain: 0.18`).
     - Bar 94 (`b = 376`, `progA[0]` tonic resolution): tonic bass `progA[0].bass[0]` at `b + 0` (`dur: 1.8, gain: 0.32`) and final tonic bass at `b + 2.5` (`dur: 3.0, gain: 0.28`), sustained tonic comp chords at `b + 0` (`dur: 2.0, gain: 0.20`) and `b + 2.5` (`dur: 3.2, gain: 0.18`), tonic melody note `progA[0].voicing[2]` on `lead1` at `b + 0` (`dur: 3.5, gain: 0.20`), and warm tonic chime `Math.min(74, progA[0].voicing[3] || progA[0].voicing[2])` on `accentInst` at `b + 2.5` (`dur: 3.0, gain: 0.16`).
     - Bar 95 (`b = 380–384`): open decay bar (no new percussion or bass hits so the bar 94 tonic resolution rings out cleanly).
2. In `buildExtendedWaltzArrangement()`:
   - Keep bars 0–47 as-is.
   - Bars 48–55 (beat 144): `progA` `'main'`, `melA1` on `'accordion'` + `'kalimba'` fifth/third chime on beat 0 of every 2nd bar (`Math.min(72, n.midi + 7)`, `gain: 0.14`).
   - Bars 56–63 (beat 168): `progA` `'main'`, `melA2` on `'accordion'` + `'marimba'` counter-note on beat 0 of every bar (`n.midi`, `gain: 0.15`).
   - Bars 64–71 (beat 192): `progB` `'bridge'`, `melB` on `'kalimba'` (`Math.min(74, n.midi + 5)`) with soft `'accordion'` harmony (`n.midi`, `gain: 0.13`) on downbeats (`n.beat % 3 === 0`).
   - Bars 72–79 (beat 216): `progB` `'bridge'`, `melB` on `'marimba'` (`n.midi`) with `'kalimba'` echo on beat 2 of odd bars.
   - Bars 80–87 (beat 240): `progA` `'main'`, `melA1` on `'accordion'`.
   - Bars 88–95 (beat 264): `progA` `'main'`, `melA2` on `'accordion'` with `'kalimba'` shimmer on downbeats (`n.beat % 3 === 0`, `Math.min(74, n.midi + 7)`, `gain: 0.14`).
   - Bars 96–103 (beats 288–311): 8-bar Gentle Waltz Tag (`progA`, bass on beat 0, single gentle guitar chord on beat 1 at `gain: 0.19`, and soft `'kalimba'` motif on bars 96, 98, 100, 102).
   - Bars 104–111 (beats 312–335): 8-bar Resolved Tonic Waltz Cadence:
     - Bars 104–107 (beats 312–323): step through `progA[4..7]` (`Em → A7 → Am7 → D7`) with bass on beat 0, soft guitar chord on beat 1 (`gain: 0.18`), and gentle `'accordion'` cadence notes (`64 → 61 → 60 → 57`, `dur: 2.2, gain: 0.15`).
     - Bars 108–110 (beats 324–332): resolve to tonic `G` (`progA[0]`, `bass: 43, voicing: [55, 59, 62]`):
       - Bar 108 (`b = 324`): bass `43` (`dur: 2.5, gain: 0.30`), guitar chord `[55, 59, 62]` at `b + 1` (`dur: 1.5, gain: 0.19`), accordion tonic `59` (`dur: 2.6, gain: 0.16`).
       - Bar 109 (`b = 327`): bass `43` (`dur: 2.8, gain: 0.26`), guitar chord `[55, 59, 62]` at `b + 0` (`dur: 2.5, gain: 0.17`), accordion tonic root `55` (`dur: 3.5, gain: 0.15`), kalimba tonic chime `67` at `b + 1` (`dur: 2.5, gain: 0.15`).
       - Bar 110 (`b = 330`): final warm kalimba tonic `67` at `b + 0` (`dur: 2.5, gain: 0.12`).
       - Bar 111 (`b = 333–336`): open decay bar (no events).
3. Update `totalBeats` to `384` on `MARIMBA_TRACK`, `VELVET_TRACK`, `SUNBEAM_TRACK`, `BOSSA_TRACK`, `SAMBA_TRACK`, and `totalBeats: 336` on `WALTZ_TRACK`.

- [ ] **Step 4: Run Vitest on `tests/audio/soundEngine.test.ts` to verify GREEN pass**

Run: `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npx vitest run tests/audio/soundEngine.test.ts --configLoader runner`
Expected: PASS

---

### Task 2: Always Pause Between Song Plays (Single-Track & Multi-Track)

**Files:**
- Modify: `src/audio/soundEngine.ts:1954-1965` (`SoundEngine.runMusicTick`)
- Test: `tests/audio/soundEngine.test.ts:118-132`

**Interfaces:**
- Consumes: `SoundEngine.runMusicTick()`, `SoundEngine.getNextTrack()` in `src/audio/soundEngine.ts`
- Produces: Unconditional 2.5-second pause (`this.pauseUntilTime = now + 2.5`) at the end of every song playback cycle (`this.currentBeat >= this.activeTrack.totalBeats`).

- [ ] **Step 1: Add failing test in `tests/audio/soundEngine.test.ts` verifying 2.5s pause at track end for both single-track repeat and multi-track playlist**

Add a test in `tests/audio/soundEngine.test.ts` inside `describe('focus and lifecycle handling', ...)` (where `MockAudioContext` is active):

```ts
    it('Review Focus #5: always pauses for 2.5 seconds at the end of a song even when repeating a single selected track', () => {
      const engine = new SoundEngine();
      engine.setMuted(false, false);
      engine.setTrackPreference('velvet');
      engine.startMusic();

      const ctx = (engine as any).getContext();
      const trackDef = engine.getTrackDef('velvet');

      // Advance clock to reach the end of the track (384 beats at 120 BPM = 192s)
      (engine as any).currentBeat = trackDef.totalBeats - 0.5;
      (engine as any).lastTickTime = ctx.currentTime;
      ctx.currentTime += 1.0; // advances by 2 beats -> crosses totalBeats

      (engine as any).runMusicTick();

      expect((engine as any).currentBeat).toBe(0);
      expect((engine as any).pauseUntilTime).toBeCloseTo(ctx.currentTime + 2.5, 5);

      engine.stopMusic();
    });
```

- [ ] **Step 2: Run Vitest on `tests/audio/soundEngine.test.ts` to verify RED failure**

Run: `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npx vitest run tests/audio/soundEngine.test.ts --configLoader runner`
Expected: FAIL (`expected 0 to be close to 3.5`) because `nextInfo.isNewTrack` is `false` on single-track repeat.

- [ ] **Step 3: Update `runMusicTick()` in `src/audio/soundEngine.ts` to always pause for 2.5s on track completion**

In `src/audio/soundEngine.ts`, update the track-end block in `runMusicTick()`:

```ts
    if (this.currentBeat >= this.activeTrack.totalBeats) {
      this.activeMusicNodes = [];
      const nextInfo = this.getNextTrack();
      this.activeTrack = nextInfo.track;
      this.currentBeat = 0;
      this.scheduledUntilBeat = 0;
      this.pauseUntilTime = now + 2.5;
      return;
    }
```

- [ ] **Step 4: Run Vitest on `tests/audio/soundEngine.test.ts` and full test suite to verify GREEN pass**

Run: `export PATH="/home/berti/.config/nvm/versions/node/v22.22.0/bin:$PATH" && npx vitest run tests/audio/soundEngine.test.ts --configLoader runner`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add docs/superpowers/specs/2026-11-21-extended-song-arrangements-design.md docs/superpowers/plans/2026-11-21-extended-song-arrangements.md src/audio/soundEngine.ts tests/audio/soundEngine.test.ts
git commit -m "feat(audio): extend song arrangements with reprises, resolved tonic outros, and inter-play pause"
```
