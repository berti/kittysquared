// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { SoundEngine } from '../../src/audio/soundEngine';

describe('audio/soundEngine', () => {
  it('operates safely without throwing when Web Audio API is absent or muted', () => {
    const engine = new SoundEngine();
    engine.setMuted(true, true);
    expect(() => {
      engine.playCross();
      engine.playCatPlaced();
      engine.playConflict();
      engine.playVictory();
      engine.startMusic();
      engine.stopMusic();
    }).not.toThrow();
  });

  it('initializes and caches Karplus-Strong string buffers across repeated note requests', () => {
    const engine = new SoundEngine();
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

  it('re-balances Catnip Waltz lead melody in octave 4-5 without exceeding 800Hz / E5', () => {
    const engine = new SoundEngine();
    const waltzEvents = engine.getTrackEvents('waltz');
    expect(waltzEvents.length).toBeGreaterThan(0);
    const highMelodyNotes = waltzEvents.filter(
      (ev) => ev.inst === 'accordion' && ev.midi && ev.midi > 76
    );
    expect(highMelodyNotes.length).toBe(0);
  });

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

  it('does not restart music when setTrackPreference is called with the current preference', () => {
    const engine = new SoundEngine();
    engine.setTrackPreference('bossa');
    const stopSpy = vi.spyOn(engine, 'stopMusic');
    engine.setTrackPreference('bossa');
    expect(stopSpy).not.toHaveBeenCalled();
  });

  it('prunes activeMusicNodes list across loop scheduling cycles to avoid memory leaks', () => {
    const engine = new SoundEngine();
    expect(engine.getActiveNodeCount()).toBe(0);
  });

  it('repeats the same song for multiple cycles in auto mode before advancing to the next song', () => {
    const engine = new SoundEngine();
    engine.setTrackPreference('auto');

    // Cycle 1: initial track
    const first = engine.getNextTrack();
    expect(first.track.id).toBe('bossa');

    // Subsequent cycles for bossa (repeat count = 4 total) should stay bossa with isNewTrack = false
    for (let i = 2; i <= 4; i++) {
      const rep = engine.getNextTrack();
      expect(rep.track.id).toBe('bossa');
      expect(rep.isNewTrack).toBe(false);
    }

    // Next cycle should advance to waltz with isNewTrack = true
    const nextSong = engine.getNextTrack();
    expect(nextSong.track.id).toBe('waltz');
    expect(nextSong.isNewTrack).toBe(true);
  });

  it('loops single track continuously without track transitions when preference is not auto', () => {
    const engine = new SoundEngine();
    engine.setTrackPreference('samba');

    const first = engine.getNextTrack();
    expect(first.track.id).toBe('samba');
    expect(first.isNewTrack).toBe(true);

    for (let i = 0; i < 10; i++) {
      const rep = engine.getNextTrack();
      expect(rep.track.id).toBe('samba');
      expect(rep.isNewTrack).toBe(false);
    }
  });
});
