# KittySquared Game Soundtrack & Stepped Volume Controls Design

## 1. Intent & Context
The placeholder soundtrack in KittySquared consisted of a single 6-note pentatonic sine wave loop playing every 1.5 seconds. It was repetitive, lacked charm, and caused audio fatigue during extended puzzle solving.

The goal of this project is to replace the placeholder audio with a rich, charming, multi-track acoustic soundtrack tailored to KittySquared's cozy, playful aesthetic, along with player controls for stepped volume levels and playlist preferences.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Charming Acoustic Sound:** Implement 3 distinct, high-quality synthesized musical tracks:
  1. **"Bossa Meow"** (Upbeat, sunny Brazilian Bossa Nova, 122 BPM, 4/4)
  2. **"Catnip Waltz"** (Whimsical French Musette Waltz, 138 BPM, 3/4)
  3. **"Samba de Gatinho"** (Joyful, infectious Brazilian Samba & Choro, 132 BPM, 4/4)
- **Balanced Frequency Spectrum:** Lower and re-balance the register and filter envelopes of "Catnip Waltz" so it harmonizes evenly with the warm tonal range of "Bossa Meow" and "Samba de Gatinho" rather than sounding high-pitched or piercing.
- **Continuous Seamless Jukebox:** Play the songs in a continuous sequence with a gentle 2–3 second quiet breath between songs, preventing repetition fatigue and ensuring music flows naturally across level completions.
- **Non-destructive Level Transitions:** Victory fanfare chimes smoothly duck background music rather than abruptly stopping or jarringly resetting the song.
- **Stepped Volume Controls:** Add stepped volume level selectors (0% / 25% / 50% / 75% / 100%) for both Music and Sound Effects in the Settings modal, preserving mute state synchronization.
- **Song Selector in Settings:** Allow players to choose between `Auto-Shuffle / Playlist` or lock into their favorite specific song (`Bossa Meow`, `Catnip Waltz`, `Samba de Gatinho`).
- **Zero Asset Dependencies:** Entire audio synthesized in real time via the Web Audio API (zero external mp3/wav files to download, instantaneous load, zero network footprint).

### Non-Goals
- External audio asset loading via CDN or disk (maintains web/offline portability).
- Interactive midi file imports or custom player song uploads.
- Per-puzzle dynamic tempo matching.

### Anti-Goals
- Harsh 8-bit chip buzz or flat sine-wave beeps.
- Abrupt audio cuts when solving puzzles quickly.
- Unresponsive sliders on mobile touchscreens (stepped segmented tap buttons preferred).

---

## 3. Constraints
- **Framework & Audio Stack:** Preact 10, TypeScript, Web Audio API (`AudioContext`).
- **Autoplay Policies:** `AudioContext` must initialize or resume on first user interaction (first tap or click), never throwing browser autoplay warnings.
- **Performance:** Synthesizer node allocations must be cleaned up gracefully; Karplus-Strong string buffers must be generated on demand and cached.
- **Backward Compatibility:** Existing `localStorage` state without `musicVolume`, `sfxVolume`, or `musicTrack` must migrate cleanly with robust defaults.

---

## 4. Approaches Considered

### Approach A: Continuous Seamless Jukebox with Stepped Controls (Selected)
- **Description:** Songs play sequentially in a loop (or shuffle) with a 2-second musical pause between tracks. Solving a puzzle ducks music by ~50% for 0.8s during the victory fanfare and resumes seamlessly. Sound settings provide 5-step volume selectors (0%, 25%, 50%, 75%, 100%) and a track selection dropdown/segmented pill.
- **Tradeoffs:** High musical continuity, zero fatigue, natural flow across fast and slow puzzles. Chosen by user.

### Approach B: Level-Bound Rotation
- **Description:** Each level is hardcoded to a track (e.g. Level 1 = Bossa, Level 2 = Waltz, Level 3 = Samba).
- **Tradeoffs:** Songs restart frequently when blitzing easy levels and loop excessively when stuck on hard levels. Rejected.

---

## 5. Detailed Architecture & Design Decisions

### 5.1 Music Engine (`src/audio/soundEngine.ts`)

#### Synthesizer Voices
1. **Acoustic Nylon Guitar Voice:**
   - Implemented using Karplus-Strong physical string modeling.
   - Generates an `AudioBuffer` with decaying noise feedback (`0.993` decay factor).
   - Filtered through a gentle low-pass filter (`3200Hz -> 1200Hz`) to emulate warm nylon strings.
   - Buffers cached by MIDI note number (instantaneous re-use).
2. **French Musette Accordion Voice:**
   - Dual detuned sawtooth oscillators (+14 cents / ~3.5Hz beat rate) + sub-octave sine reinforcement.
   - Bandpass formant filter centered at 800Hz–1800Hz with moderate resonance for authentic Parisian reed resonance.
   - Catnip Waltz register lowered by 1 octave for the lead melody, and formant frequency clamped to prevent piercing highs.
3. **Whistle / Breath Flute Voice:**
   - Pure sine wave fundamental + bandpass-filtered breath noise transient.
   - LFO vibrato (5.4 Hz) delayed by 140ms with smooth ramp-in.
4. **Upright Plucked Bass Voice:**
   - Triangle wave with snappy low-pass filter envelope (`650Hz -> 250Hz`) and warm exponential decay.
5. **Latin / Acoustic Percussion Voices:**
   - Shaker: High-pass filtered noise burst (`7500Hz`, 50ms).
   - Woodblock / Agogo: Pitched sine with rapid downward pitch sweep (e.g. 720Hz -> 470Hz).

#### Track Definitions (8-bar & 16-bar structured loops)
- **Track 1: "Bossa Meow" (122 BPM, 4/4 in C Major):**
  - Nylon guitar syncopated bossa comping (beats 1, 2&, 3&, 4&).
  - Upright bass on beats 1 and 3&.
  - Flute lead melody with breath vibrato.
  - Shaker and subtle woodblock accent.
- **Track 2: "Catnip Waltz" (138 BPM, 3/4 in G Major):**
  - Tonal register shifted down: lead melody centered in Octave 4/5 (C4-G5) instead of piercing high register.
  - Oom-pah-pah rhythm: Upright bass on beat 1; acoustic guitar chords on beats 2 & 3.
  - Accordion musette melody with warm lower formant.
  - Sparkling celesta accents on cadences.
- **Track 3: "Samba de Gatinho" (132 BPM, 4/4 in D Major):**
  - Fast syncopated nylon guitar strumming.
  - Bouncy surdo bass groove.
  - Joyful flute lead with rapid syncopations.
  - Shaker and alternating agogo woodblocks.

#### Jukebox Scheduler
- Lookahead clock running on an interval (25ms lookahead scheduling 150ms ahead) using `AudioContext.currentTime`.
- When a song finishes all bars, schedules a 2.5-second silence before automatically starting the next song in rotation.
- If the player selected a specific song in Settings, loops that song with the 2.5-second breath. If set to `auto`, cycles through all 3 songs.

### 5.2 Settings & Storage Schema (`src/state/storage.ts`)

Extend `AppSettings`:
```typescript
export type SteppedVolume = 0 | 0.25 | 0.5 | 0.75 | 1.0;
export type MusicTrackOption = 'auto' | 'bossa' | 'waltz' | 'samba';

export interface AppSettings {
  controlScheme: ControlScheme;
  doubleTapTimeoutMs: number;
  catVariant: CatVariant;
  regionAssist: RegionAssistMode;
  musicMuted: boolean;
  sfxMuted: boolean;
  tutorialSeen: boolean;
  musicVolume: SteppedVolume; // default 0.75
  sfxVolume: SteppedVolume;   // default 0.75
  musicTrack: MusicTrackOption; // default 'auto'
}
```

- Migration logic in `storage.ts`: If existing saved settings lack `musicVolume` or `sfxVolume`, assign `0.75`. If `musicMuted: true`, volume remains stored as `0.75` but soundEngine mutes master music gain, so unmuting restores the player's preferred volume level.

### 5.3 Settings UI (`src/components/SettingsModal.tsx`)

In the `AUDIO Y MÚSICA` tab:
1. **Music Volume Stepper:**
   - 5-step segmented buttons: `[0% | 25% | 50% | 75% | 100%]`.
   - Selecting 0% auto-sets `musicMuted = true`. Selecting > 0% auto-unmutes `musicMuted = false` and updates `musicVolume`.
2. **SFX Volume Stepper:**
   - 5-step segmented buttons: `[0% | 25% | 50% | 75% | 100%]`.
   - Selecting 0% sets `sfxMuted = true`. Selecting > 0% auto-unmutes and plays a light preview click sound at that volume.
3. **Soundtrack Selector:**
   - Segmented buttons or pill options:
     - `🔄 Auto (All 3 Songs)`
     - `🐱 Bossa Meow`
     - `🥐 Catnip Waltz`
     - `🎉 Samba de Gatinho`
   - Changes apply immediately: changing track switches the currently playing song with a smooth 0.3s crossfade.

---

## 6. What's Left to the Builder
- Precise node gain leveling to ensure music sits pleasantly at -12dB relative to game SFX so cat placement and conflict sounds remain punchy and clear.
- Unit and integration tests verifying storage migration, audio engine mute/unmute/volume methods, and SettingsModal UI interactions.
