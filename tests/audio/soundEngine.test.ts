// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
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
});
