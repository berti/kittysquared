# KittySquared Game Soundtrack & Stepped Volume Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 3 charming acoustic musical tracks (Bossa Meow, Catnip Waltz with re-balanced octave, Samba de Gatinho) using Web Audio physical modeling synthesis, a continuous jukebox playlist scheduler, and stepped volume level selectors (0% to 100%) in Settings.

**Architecture:** Extend `storage.ts` with `SteppedVolume` and `MusicTrackOption`. Upgrade `soundEngine.ts` with Karplus-Strong string physical modeling, musette accordion with dual beating reeds, breath flute, upright bass, acoustic percussion, and a lookahead jukebox scheduler with victory fanfare ducking. Upgrade `SettingsModal.tsx` with segmented stepped volume selectors and a soundtrack selector. Wire centralized volume and track syncing in `App.tsx`.

**Tech Stack:** TypeScript, Preact 10, Web Audio API (`AudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`, `AudioBuffer`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-game-soundtrack-and-volume-design.md`

## Global Constraints

- Entire soundtrack synthesized live via the Web Audio API; zero external audio asset downloads or CDN dependencies.
- Stepped volume levels fixed to exact spec values: `0`, `0.25`, `0.5`, `0.75`, `1.0`.
- Catnip Waltz lead melody register shifted down by 1 octave to sit in C4-G5 register with warm formant filters, harmonizing with Bossa Meow and Samba de Gatinho.
- Jukebox inter-track pause set to 2.5 seconds of clean musical breath between songs.
- Victory fanfare ducks background music by 50% for 0.8s and smoothly restores without restarting the song.
- Backward compatibility: legacy `localStorage` data without volume/track fields must seamlessly default to `musicVolume: 0.75`, `sfxVolume: 0.75`, and `musicTrack: 'auto'`.

## Review Focus

1. **Legacy storage migration without volume/track:** Loading legacy save data missing `musicVolume`, `sfxVolume`, or `musicTrack` assigns `0.75`, `0.75`, `'auto'` without data loss. (Task 1)
2. **0% volume step synchronization with mute:** Clicking `0%` sets `muted = true`. Clicking `>0%` sets `muted = false` and sets volume. (Task 1 & Task 5)
3. **Mid-song track switching:** Switching track preference while a song is playing immediately cancels scheduled nodes of the old track and starts the new track without sound collisions. (Task 3 & Task 4)
4. **Victory fanfare ducking envelope:** Calling `playVictory()` smoothly ducks music gain to 50% and restores without abruptly halting loop playback. (Task 4)
5. **Autoplay policy resilience:** All audio playback handles `suspended` AudioContext gracefully on first touch/click without throwing unhandled exceptions. (Task 2 & Task 6)

---

### Task 1: Update Storage Schema & State Migration for Volume & Track Settings

**Files:**
- Modify: `src/state/storage.ts`
- Test: `tests/state/storage.test.ts`

**Interfaces:**
- Produces:
  - `export type SteppedVolume = 0 | 0.25 | 0.5 | 0.75 | 1.0;`
  - `export type MusicTrackOption = 'auto' | 'bossa' | 'waltz' | 'samba';`
  - `AppSettings.musicVolume: SteppedVolume;`
  - `AppSettings.sfxVolume: SteppedVolume;`
  - `AppSettings.musicTrack: MusicTrackOption;`

- [ ] **Step 1: Write failing tests for storage schema, defaults, and legacy migration**

Add tests to `tests/state/storage.test.ts`:
```typescript
it('provides default musicVolume (0.75), sfxVolume (0.75), and musicTrack ("auto") in default state', () => {
  const state = getDefaultAppState();
  expect(state.settings.musicVolume).toBe(0.75);
  expect(state.settings.sfxVolume).toBe(0.75);
  expect(state.settings.musicTrack).toBe('auto');
});

it('migrates legacy save format missing volume and track fields with robust defaults', () => {
  localStorage.setItem(
    'kittysquared_state_v1',
    JSON.stringify({
      progress: { currentLevelId: 3, totalScore: 100, activeSnapshot: null },
      settings: {
        doubleTapTimeoutMs: 500,
        catVariant: 'black',
        regionAssist: 'off',
        musicMuted: false,
        sfxMuted: false,
        tutorialSeen: true,
      },
    })
  );
  const loaded = loadPersistedState();
  expect(loaded.settings.musicVolume).toBe(0.75);
  expect(loaded.settings.sfxVolume).toBe(0.75);
  expect(loaded.settings.musicTrack).toBe('auto');
});

it('persists and reloads custom volume and track preferences', () => {
  const state = getDefaultAppState();
  state.settings.musicVolume = 0.5;
  state.settings.sfxVolume = 1.0;
  state.settings.musicTrack = 'bossa';
  savePersistedState(state);

  const loaded = loadPersistedState();
  expect(loaded.settings.musicVolume).toBe(0.5);
  expect(loaded.settings.sfxVolume).toBe(1.0);
  expect(loaded.settings.musicTrack).toBe('bossa');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: FAIL with missing properties `musicVolume`, `sfxVolume`, `musicTrack`.

- [ ] **Step 3: Implement schema extensions and migration logic in `src/state/storage.ts`**

Export `SteppedVolume` and `MusicTrackOption`. Update `AppSettings` interface. In `getDefaultAppState()`, add `musicVolume: 0.75`, `sfxVolume: 0.75`, `musicTrack: 'auto'`. In `loadPersistedState()`, sanitize loaded settings to ensure `musicVolume` (default `0.75`), `sfxVolume` (default `0.75`), and `musicTrack` (default `'auto'`) are always valid.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state/storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/storage.ts tests/state/storage.test.ts
git commit -m "feat(storage): add stepped volume and music track schema with migration"
```

---

### Task 2: Implement Synthesizer Instrument Voices in SoundEngine

**Files:**
- Modify: `src/audio/soundEngine.ts`
- Test: `tests/audio/soundEngine.test.ts`

**Interfaces:**
- Consumes: `AudioContext`, standard Web Audio nodes.
- Produces:
  - Internal synthesizer voice methods on `SoundEngine`:
    - `playGuitar(freq: number, time: number, dur: number, gain: number): void`
    - `playAccordion(freq: number, time: number, dur: number, gain: number): void`
    - `playFlute(freq: number, time: number, dur: number, gain: number): void`
    - `playBass(freq: number, time: number, dur: number, gain: number): void`
    - `playBell(freq: number, time: number, dur: number, gain: number): void`
    - `playShaker(time: number, gain: number): void`
    - `playWoodblock(freq: number, time: number, gain: number): void`

- [ ] **Step 1: Write unit tests verifying safe synthesis and buffer caching**

In `tests/audio/soundEngine.test.ts`, add:
```typescript
it('initializes and caches Karplus-Strong string buffers across repeated note requests', () => {
  const engine = new SoundEngine();
  // Safe execution test: does not throw even with mock or missing window AudioContext
  expect(() => {
    engine.startMusic();
    engine.stopMusic();
  }).not.toThrow();
});

it('exposes methods to set volume and track preferences safely', () => {
  const engine = new SoundEngine();
  expect(() => {
    engine.setVolume(0.5, 0.75);
    engine.setTrackPreference('bossa');
    engine.setTrackPreference('auto');
  }).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: FAIL with `engine.setVolume is not a function` or `engine.setTrackPreference is not a function`.

- [ ] **Step 3: Implement acoustic synthesizer voices and Karplus-Strong cache in `src/audio/soundEngine.ts`**

Implement:
- Master limiter compressor to prevent distortion: threshold -14dB, knee 10, ratio 4, attack 0.005s, release 0.1s.
- `guitarCache: Record<number, AudioBuffer>` for Karplus-Strong physical modeling notes with decay `0.993`.
- `playGuitar`: lowpass filter `3200Hz -> 1200Hz`, snappy pluck envelope.
- `playAccordion`: dual detuned sawtooth oscillators (+14 cents / 3.5Hz beat rate) + formant filter centered at 800–1800Hz + sub reed.
- `playFlute`: pure sine wave + pink breath noise transient + delayed vibrato LFO (5.4Hz after 140ms).
- `playBass`: triangle wave + lowpass pluck envelope (`650Hz -> 250Hz`).
- `playBell`: celesta bell chime with 2.76x overtone.
- `playShaker`: high-pass filtered noise (`7500Hz`, 50ms).
- `playWoodblock`: downward sweeping sine wave (`720Hz -> 470Hz`, 45ms).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/soundEngine.ts tests/audio/soundEngine.test.ts
git commit -m "feat(audio): implement physical modeling and acoustic instrument voices"
```

---

### Task 3: Implement 3 Soundtrack Scores & Jukebox Continuous Scheduler

**Files:**
- Modify: `src/audio/soundEngine.ts`
- Test: `tests/audio/soundEngine.test.ts`

**Interfaces:**
- Consumes: Synthesizer voices from Task 2.
- Produces:
  - Track definitions: `BOSSA_TRACK`, `WALTZ_TRACK`, `SAMBA_TRACK`.
  - Continuous jukebox lookahead loop scheduling with 2.5s inter-song breath.
  - `soundEngine.setTrackPreference(pref: MusicTrackOption): void`

- [ ] **Step 1: Write unit tests verifying track definitions, rotation, and track selection**

Add to `tests/audio/soundEngine.test.ts`:
```typescript
it('rotates through tracks in auto mode and loops selected track when locked', () => {
  const engine = new SoundEngine();
  engine.setTrackPreference('bossa');
  expect(engine.getCurrentTrackId()).toBe('bossa');

  engine.setTrackPreference('waltz');
  expect(engine.getCurrentTrackId()).toBe('waltz');

  engine.setTrackPreference('samba');
  expect(engine.getCurrentTrackId()).toBe('samba');

  engine.setTrackPreference('auto');
  expect(['bossa', 'waltz', 'samba']).toContain(engine.getCurrentTrackId());
});

it('re-balances Catnip Waltz lead melody in octave 4-5 without exceeding 800Hz', () => {
  const engine = new SoundEngine();
  const waltzEvents = engine.getTrackEvents('waltz');
  // Verify no lead melody notes exceed MIDI 76 (E5) or piercing high frequencies
  const highMelodyNotes = waltzEvents.filter(
    (ev) => ev.inst === 'accordion' && ev.midi && ev.midi > 76
  );
  expect(highMelodyNotes.length).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: FAIL with `engine.getCurrentTrackId is not a function`.

- [ ] **Step 3: Implement track scores and lookahead scheduler in `src/audio/soundEngine.ts`**

Implement:
- `BOSSA_TRACK`: 122 BPM, 4/4, 32 beats. Syncopated nylon guitar comping, upright bossa bass, breath whistle flute, shaker, woodblock.
- `WALTZ_TRACK`: 138 BPM, 3/4, 24 beats. Lead melody lowered by 1 octave (G4-E5), French musette accordion, guitar chucks on 2 & 3, pizzicato bass on 1, warm celesta chimes.
- `SAMBA_TRACK`: 132 BPM, 4/4, 32 beats. Fast syncopated guitar strumming, surdo bass, virtuosic flute lead, agogo woodblocks & shakers.
- Lookahead scheduler running every 25ms, scheduling notes 150ms ahead.
- Jukebox queue: advances to next song in rotation after 2.5s silence in `auto` mode; repeats current song after 2.5s silence in single-track mode.
- `getCurrentTrackId()` and `getTrackEvents(trackId)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/soundEngine.ts tests/audio/soundEngine.test.ts
git commit -m "feat(audio): implement 3 soundtrack scores and continuous jukebox scheduler"
```

---

### Task 4: Implement SoundEngine Stepped Volume, Mute Sync, Ducking & Victory Fanfare

**Files:**
- Modify: `src/audio/soundEngine.ts`
- Test: `tests/audio/soundEngine.test.ts`

**Interfaces:**
- Produces:
  - `soundEngine.setVolume(musicVolume: SteppedVolume, sfxVolume: SteppedVolume): void`
  - `soundEngine.setMuted(musicMuted: boolean, sfxMuted: boolean): void`
  - Smooth music ducking during `soundEngine.playVictory()`

- [ ] **Step 1: Write unit tests verifying volume gain nodes, mute synchronization, and ducking**

Add to `tests/audio/soundEngine.test.ts`:
```typescript
it('synchronizes volume levels with mute state correctly', () => {
  const engine = new SoundEngine();
  engine.setVolume(0.5, 0.75);
  expect(engine.getEffectiveMusicVolume()).toBe(0.5);
  expect(engine.getEffectiveSfxVolume()).toBe(0.75);

  // Muting music drops effective volume to 0 while preserving stored level
  engine.setMuted(true, false);
  expect(engine.getEffectiveMusicVolume()).toBe(0);
  expect(engine.getEffectiveSfxVolume()).toBe(0.75);

  // Unmuting music restores effective volume back to 0.5
  engine.setMuted(false, false);
  expect(engine.getEffectiveMusicVolume()).toBe(0.5);
});

it('smoothly ducks music volume when playVictory is triggered', () => {
  const engine = new SoundEngine();
  engine.setVolume(0.75, 0.75);
  engine.setMuted(false, false);
  expect(engine.isDucking()).toBe(false);

  engine.playVictory();
  expect(engine.isDucking()).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: FAIL with `engine.getEffectiveMusicVolume is not a function`.

- [ ] **Step 3: Implement separate gain stages, ducking, and mute sync in `src/audio/soundEngine.ts`**

Create `musicGainNode` and `sfxGainNode`.
- When `setVolume(musicVolume, sfxVolume)` is called, store volumes and update gain nodes:
  - If `musicMuted`, gain is 0; otherwise `musicVolume * masterScale`.
  - If `sfxMuted`, gain is 0; otherwise `sfxVolume * masterScale`.
- In `playVictory()`: smoothly ramp `musicGainNode` to 50% of current volume over 100ms, then schedule return to 100% after 800ms.
- Provide `getEffectiveMusicVolume()`, `getEffectiveSfxVolume()`, and `isDucking()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio/soundEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/soundEngine.ts tests/audio/soundEngine.test.ts
git commit -m "feat(audio): add separate gain stages, volume scaling, and victory ducking"
```

---

### Task 5: Implement Stepped Volume Selectors & Track Picker in SettingsModal UI

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Test: `tests/components/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `AppSettings` with `musicVolume`, `sfxVolume`, and `musicTrack`.
- Produces:
  - 5-step segmented selectors for Music: `[0% | 25% | 50% | 75% | 100%]`.
  - 5-step segmented selectors for SFX: `[0% | 25% | 50% | 75% | 100%]`.
  - Track selection pills: `[🔄 Auto | 🐱 Bossa Meow | 🥐 Catnip Waltz | 🎉 Samba de Gatinho]`.

- [ ] **Step 1: Write UI tests for stepped volume selectors and soundtrack picker**

Add to `tests/components/SettingsModal.test.tsx`:
```typescript
it('Sound tab: renders 5-step volume selectors for music and sfx, and soundtrack selector', () => {
  const { getByTestId } = render(
    <SettingsModal
      settings={{
        ...defaultSettings,
        musicVolume: 0.75,
        sfxVolume: 0.75,
        musicTrack: 'auto',
      }}
      onUpdateSettings={vi.fn()}
      onResetProgress={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(getByTestId('tab-btn-sound'));

  // Music volume steps
  expect(getByTestId('music-vol-step-0')).toBeDefined();
  expect(getByTestId('music-vol-step-0.25')).toBeDefined();
  expect(getByTestId('music-vol-step-0.5')).toBeDefined();
  expect(getByTestId('music-vol-step-0.75')).toBeDefined();
  expect(getByTestId('music-vol-step-1')).toBeDefined();

  // SFX volume steps
  expect(getByTestId('sfx-vol-step-0')).toBeDefined();
  expect(getByTestId('sfx-vol-step-1')).toBeDefined();

  // Track options
  expect(getByTestId('track-opt-auto')).toBeDefined();
  expect(getByTestId('track-opt-bossa')).toBeDefined();
  expect(getByTestId('track-opt-waltz')).toBeDefined();
  expect(getByTestId('track-opt-samba')).toBeDefined();
});

it('Sound tab: clicking 0% volume step automatically mutes; clicking >0% unmutes and sets volume', () => {
  const onUpdateSettings = vi.fn();
  const { getByTestId } = render(
    <SettingsModal
      settings={{
        ...defaultSettings,
        musicVolume: 0.75,
        musicMuted: false,
      }}
      onUpdateSettings={onUpdateSettings}
      onResetProgress={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(getByTestId('tab-btn-sound'));

  // Click 0% -> sets musicMuted: true
  fireEvent.click(getByTestId('music-vol-step-0'));
  expect(onUpdateSettings).toHaveBeenCalledWith(
    expect.objectContaining({ musicVolume: 0, musicMuted: true })
  );

  // Click 50% -> sets musicVolume: 0.5 and musicMuted: false
  fireEvent.click(getByTestId('music-vol-step-0.5'));
  expect(onUpdateSettings).toHaveBeenCalledWith(
    expect.objectContaining({ musicVolume: 0.5, musicMuted: false })
  );
});

it('Sound tab: selecting a specific soundtrack option updates settings', () => {
  const onUpdateSettings = vi.fn();
  const { getByTestId } = render(
    <SettingsModal
      settings={{
        ...defaultSettings,
        musicTrack: 'auto',
      }}
      onUpdateSettings={onUpdateSettings}
      onResetProgress={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(getByTestId('tab-btn-sound'));
  fireEvent.click(getByTestId('track-opt-bossa'));
  expect(onUpdateSettings).toHaveBeenCalledWith(
    expect.objectContaining({ musicTrack: 'bossa' })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: FAIL with missing test IDs `music-vol-step-0`.

- [ ] **Step 3: Implement stepped volume buttons and track selector in `src/components/SettingsModal.tsx`**

In the Sound tab:
- Add a labeled section for **VOLUMEN DE MÚSICA**:
  - 5 segmented buttons: `0%`, `25%`, `50%`, `75%`, `100%`.
  - Active button highlighted with terracotta/sage accent styling.
  - Clicking `0%` sets `musicVolume: 0, musicMuted: true`.
  - Clicking `>0%` sets `musicVolume: step, musicMuted: false`.
- Add a labeled section for **VOLUMEN DE EFECTOS**:
  - 5 segmented buttons: `0%`, `25%`, `50%`, `75%`, `100%`.
  - Clicking `0%` sets `sfxVolume: 0, sfxMuted: true`.
  - Clicking `>0%` sets `sfxVolume: step, sfxMuted: false`.
- Add a labeled section for **SELECCIÓN DE BANDA SONORA**:
  - 4 buttons: `🔄 Auto (3 temas)`, `🐱 Bossa Meow`, `🥐 Catnip Waltz`, `🎉 Samba de Gatinho`.
  - Active button highlighted.
  - Clicking updates `settings.musicTrack`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/SettingsModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsModal.tsx tests/components/SettingsModal.test.tsx
git commit -m "feat(ui): add stepped volume controls and soundtrack selector to SettingsModal"
```

---

### Task 6: Wire Centralized App State & End-to-End Verification

**Files:**
- Modify: `src/App.tsx`
- Test: `tests/App.test.tsx`

**Interfaces:**
- Connects: `AppSettings` changes in `App.tsx` to `soundEngine.setVolume()` and `soundEngine.setTrackPreference()`.

- [ ] **Step 1: Write integration tests in `tests/App.test.tsx`**

Verify that `App.tsx` passes updated settings to `soundEngine.setVolume()` and `soundEngine.setTrackPreference()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/App.test.tsx`
Expected: FAIL (or verify current behavior before change).

- [ ] **Step 3: Wire audio synchronization in `src/App.tsx`**

In `App.tsx`:
```typescript
useEffect(() => {
  soundEngine.setMuted(appState.settings.musicMuted, appState.settings.sfxMuted);
  soundEngine.setVolume(appState.settings.musicVolume ?? 0.75, appState.settings.sfxVolume ?? 0.75);
  soundEngine.setTrackPreference(appState.settings.musicTrack ?? 'auto');
}, [
  appState.settings.musicMuted,
  appState.settings.sfxMuted,
  appState.settings.musicVolume,
  appState.settings.sfxVolume,
  appState.settings.musicTrack,
]);
```

- [ ] **Step 4: Run full test suite to verify everything passes**

Run: `npm test`
Expected: All 23+ test suites pass cleanly.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx tests/App.test.tsx
git commit -m "feat(app): wire soundEngine volume and track preference synchronization"
```
