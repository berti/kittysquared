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
});
