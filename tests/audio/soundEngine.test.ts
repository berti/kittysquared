// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  describe('playlist multi-selection', () => {
    it('updates active playlist and returns copy from getSelectedTracks', () => {
      const engine = new SoundEngine();
      engine.setSelectedTracks(['marimba', 'bossa']);
      expect(engine.getSelectedTracks()).toEqual(['marimba', 'bossa']);
    });

    it('cycles strictly through selectedTracks across successive getNextTrack calls', () => {
      const engine = new SoundEngine();
      engine.setSelectedTracks(['sunbeam', 'waltz']);

      const first = engine.getNextTrack();
      expect(first.track.id).toBe('sunbeam');
      expect(first.isNewTrack).toBe(true);

      const second = engine.getNextTrack();
      expect(second.track.id).toBe('waltz');
      expect(second.isNewTrack).toBe(true);

      const third = engine.getNextTrack();
      expect(third.track.id).toBe('sunbeam');
      expect(third.isNewTrack).toBe(true);
    });

    it('falls back safely to all tracks when empty array is passed to setSelectedTracks', () => {
      const engine = new SoundEngine();
      engine.setSelectedTracks([]);
      expect(engine.getSelectedTracks()).toEqual(PLAYLIST_ORDER);
    });

    it('transitions to first track in new selection if current track is no longer selected', () => {
      const engine = new SoundEngine();
      engine.setSelectedTracks(['marimba']);
      expect(engine.getCurrentTrackId()).toBe('marimba');

      engine.setSelectedTracks(['bossa', 'samba']);
      expect(engine.getCurrentTrackId()).toBe('bossa');

      // If current track is still in selection, retain it
      engine.setSelectedTracks(['samba', 'bossa']);
      expect(engine.getCurrentTrackId()).toBe('bossa');
    });
  });

  describe('focus and lifecycle handling', () => {
    let originalAudioContext: any;

    beforeEach(() => {
      originalAudioContext = (window as any).AudioContext;
      const createMockParam = (initial = 0) => ({
        value: initial,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      });
      const createMockNode = () => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        stop: vi.fn(),
        start: vi.fn(),
      });

      (window as any).AudioContext = class MockAudioContext {
        currentTime = 0;
        state = 'running';
        destination = {};

        resume = vi.fn().mockImplementation(async () => {
          this.state = 'running';
        });
        suspend = vi.fn().mockImplementation(async () => {
          this.state = 'suspended';
        });

        createGain() {
          return {
            ...createMockNode(),
            gain: createMockParam(1),
          };
        }

        createBiquadFilter() {
          return {
            ...createMockNode(),
            type: 'lowshelf',
            frequency: createMockParam(220),
            gain: createMockParam(2.0),
          };
        }

        createDynamicsCompressor() {
          return {
            ...createMockNode(),
            threshold: createMockParam(-16),
            knee: createMockParam(12),
            ratio: createMockParam(4),
            attack: createMockParam(0.008),
            release: createMockParam(0.12),
          };
        }

        createOscillator() {
          return {
            ...createMockNode(),
            type: 'sine',
            frequency: createMockParam(440),
          };
        }

        createBufferSource() {
          return {
            ...createMockNode(),
            buffer: null,
            playbackRate: createMockParam(1),
          };
        }

        createBuffer() {
          return {
            getChannelData: () => new Float32Array(1024),
          };
        }
      };
    });

    afterEach(() => {
      (window as any).AudioContext = originalAudioContext;
    });

    it('tracks focus state and pauses music when app loses focus, resuming when focus is regained', () => {
      const engine = new SoundEngine();
      engine.setMuted(false, false);
      engine.startMusic();
      expect(engine.isMusicActive()).toBe(true);

      engine.setAppFocused(false);
      expect(engine.isAppFocused()).toBe(false);
      expect(engine.isMusicActive()).toBe(false);

      engine.setAppFocused(true);
      expect(engine.isAppFocused()).toBe(true);
      expect(engine.isMusicActive()).toBe(true);

      engine.stopMusic();
    });

    it('does not start playing music if startMusic is called while unfocused, but starts when focus is gained', () => {
      const engine = new SoundEngine();
      engine.setAppFocused(false);
      engine.setMuted(false, false);
      engine.startMusic();

      expect(engine.isMusicActive()).toBe(false);

      engine.setAppFocused(true);
      expect(engine.isMusicActive()).toBe(true);

      engine.stopMusic();
    });

    it('does not resume music on focus gain if music was muted by user', () => {
      const engine = new SoundEngine();
      engine.setMuted(true, false);
      expect(engine.isMusicActive()).toBe(false);

      engine.setAppFocused(false);
      engine.setAppFocused(true);
      expect(engine.isMusicActive()).toBe(false);
    });

    it('does not play SFX when app is unfocused', () => {
      const engine = new SoundEngine();
      engine.setAppFocused(false);
      expect(() => {
        engine.playCross();
        engine.playCatPlaced();
        engine.playConflict();
        engine.playVictory();
      }).not.toThrow();
    });

    it('initLifecycle responds to window blur/focus and document visibilitychange events', () => {
      const engine = new SoundEngine();
      const cleanup = engine.initLifecycle();
      engine.setMuted(false, false);
      engine.startMusic();
      expect(engine.isMusicActive()).toBe(true);

      // Window blur pauses music
      window.dispatchEvent(new Event('blur'));
      expect(engine.isAppFocused()).toBe(false);
      expect(engine.isMusicActive()).toBe(false);

      // Window focus resumes music
      window.dispatchEvent(new Event('focus'));
      expect(engine.isAppFocused()).toBe(true);
      expect(engine.isMusicActive()).toBe(true);

      // Pagehide (phone homescreen / background) pauses music
      window.dispatchEvent(new Event('pagehide'));
      expect(engine.isAppFocused()).toBe(false);
      expect(engine.isMusicActive()).toBe(false);

      // Pageshow resumes music
      window.dispatchEvent(new Event('pageshow'));
      expect(engine.isAppFocused()).toBe(true);
      expect(engine.isMusicActive()).toBe(true);

      // Visibilitychange hidden pauses music
      const originalHidden = document.hidden;
      const originalVisibilityState = document.visibilityState;
      try {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(engine.isAppFocused()).toBe(false);
        expect(engine.isMusicActive()).toBe(false);

        // Visibilitychange visible resumes music
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(engine.isAppFocused()).toBe(true);
        expect(engine.isMusicActive()).toBe(true);
      } finally {
        Object.defineProperty(document, 'hidden', { value: originalHidden, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: originalVisibilityState, configurable: true });
      }

      cleanup();
      engine.stopMusic();
    });

    it('suspends and resumes audio context and preserves track playback position across focus changes', () => {
      const engine = new SoundEngine();
      engine.setMuted(false, false);
      engine.startMusic();

      const ctx = (engine as any).getContext();
      expect(ctx).toBeTruthy();
      const suspendSpy = vi.spyOn(ctx, 'suspend');
      const resumeSpy = vi.spyOn(ctx, 'resume');

      // Let beat advance
      (engine as any).currentBeat = 12.5;

      engine.setAppFocused(false);
      expect(suspendSpy).toHaveBeenCalled();
      expect((engine as any).currentBeat).toBe(12.5);

      engine.setAppFocused(true);
      expect(resumeSpy).toHaveBeenCalled();
      // Track position is preserved at beat 12.5 rather than reset to 0
      expect((engine as any).currentBeat).toBe(12.5);

      engine.stopMusic();
    });

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
  });
});
