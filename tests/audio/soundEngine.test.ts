// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { PLAYLIST_ORDER, SoundEngine } from '../../src/audio/soundEngine';

describe('audio/soundEngine', () => {
  it('operates safely without throwing when Web Audio API is absent or muted', () => {
    const engine = new SoundEngine();
    engine.setMuted(true, true);
    expect(() => {
      engine.playCross();
      engine.playCatPlaced();
      engine.playConflict();
      engine.playVictory();
      engine.playMarimba(330, 0, 0.4);
      engine.playRhodes(330, 0, 0.6);
      engine.playKalimba(392, 0, 0.5);
      engine.playFlute(880, 0, 0.6); // tests high frequency folding
      engine.playAccordion(330, 0, 0.5);
      engine.playGuitar(330, 0, 0.5);
      engine.playBass(110, 0, 0.5);
      engine.playShaker(0);
      engine.playWoodblock(500, 0);
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

  it('exposes methods to set volume and track preferences safely across all 6 tracks', () => {
    const engine = new SoundEngine();
    expect(() => {
      engine.setVolume(0.5, 0.75);
      for (const id of PLAYLIST_ORDER) {
        engine.setTrackPreference(id);
        expect(engine.getCurrentTrackId()).toBe(id);
      }
      engine.setTrackPreference('auto');
      expect(PLAYLIST_ORDER).toContain(engine.getCurrentTrackId());
    }).not.toThrow();
  });

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

  it('synchronizes volume levels with mute state correctly', () => {
    const engine = new SoundEngine();
    engine.setVolume(0.5, 0.75);
    expect(engine.getEffectiveMusicVolume()).toBe(0.5);
    expect(engine.getEffectiveSfxVolume()).toBe(0.75);

    engine.setMuted(true, false);
    expect(engine.getEffectiveMusicVolume()).toBe(0);
    expect(engine.getEffectiveSfxVolume()).toBe(0.75);

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

  it('loops single track continuously without track transitions when preference is not auto', () => {
    const engine = new SoundEngine();
    engine.setTrackPreference('velvet');

    const first = engine.getNextTrack();
    expect(first.track.id).toBe('velvet');
    expect(first.isNewTrack).toBe(true);

    for (let i = 0; i < 5; i++) {
      const rep = engine.getNextTrack();
      expect(rep.track.id).toBe('velvet');
      expect(rep.isNewTrack).toBe(false);
    }
  });
});
