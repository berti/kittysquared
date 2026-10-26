export class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicMuted: boolean = false;
  private sfxMuted: boolean = false;
  private musicTimer: number | null = null;
  private musicNoteIndex: number = 0;

  // Soft pentatonic ambient scale (C4, D4, E4, G4, A4, C5)
  private musicNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    } catch (_e) {
      this.ctx = null;
    }
    return this.ctx;
  }

  public setMuted(musicMuted: boolean, sfxMuted: boolean): void {
    this.musicMuted = musicMuted;
    this.sfxMuted = sfxMuted;
    if (musicMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public playCross(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (_e) {
      // Ignore audio synthesis errors
    }
  }

  public playCatPlaced(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.16);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (_e) {
      // Ignore
    }
  }

  public playConflict(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.22);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_e) {
      // Ignore
    }
  }

  public playVictory(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const start = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = start + i * 0.11;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.28);
      });
    } catch (_e) {
      // Ignore
    }
  }

  public startMusic(): void {
    if (this.musicMuted || this.musicTimer !== null) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const playNextNote = () => {
      if (this.musicMuted) return;
      try {
        if (ctx.state === 'suspended') ctx.resume();
        const freq = this.musicNotes[this.musicNoteIndex % this.musicNotes.length];
        this.musicNoteIndex++;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      } catch (_e) {
        // Ignore
      }
    };

    // Play gently every 1.5 seconds
    this.musicTimer = window.setInterval(playNextNote, 1500);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
