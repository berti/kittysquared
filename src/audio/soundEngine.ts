import { MusicTrackOption, SteppedVolume } from '../state/storage';

export interface SoundEvent {
  inst: 'guitar' | 'accordion' | 'flute' | 'bass' | 'bell' | 'shaker' | 'woodblock';
  beat: number;
  dur?: number;
  midi?: number;
  freq?: number;
  gain?: number;
}

export interface SoundTrackDef {
  id: MusicTrackOption;
  bpm: number;
  meter: string;
  totalBeats: number;
  events: SoundEvent[];
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;

  private musicMuted: boolean = false;
  private sfxMuted: boolean = false;
  private musicVolume: SteppedVolume = 0.75;
  private sfxVolume: SteppedVolume = 0.75;
  private musicTrackPreference: MusicTrackOption = 'auto';

  private isDuckingActive: boolean = false;
  private duckingTimeout: number | null = null;

  private musicTimer: number | null = null;
  private activeMusicNodes: ({ stop?: (when?: number) => void; disconnect: () => void })[] = [];
  private guitarCache: Record<number, AudioBuffer> = {};

  private currentTrackIndex: number = 0;
  private currentTrackId: MusicTrackOption = 'bossa';
  private playbackStartTime: number = 0;
  private isMusicPlaying: boolean = false;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();

        // Dynamics compressor to prevent clipping and give smooth punch
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.1, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.musicGainNode = this.ctx.createGain();
        this.sfxGainNode = this.ctx.createGain();

        this.updateGainLevels();

        this.musicGainNode.connect(this.compressor);
        this.sfxGainNode.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (_e) {
      this.ctx = null;
    }
    return this.ctx;
  }

  private updateGainLevels(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.musicGainNode) {
      const targetMusicGain = this.musicMuted ? 0 : this.musicVolume * 0.45;
      const finalMusicGain = this.isDuckingActive ? targetMusicGain * 0.5 : targetMusicGain;
      this.musicGainNode.gain.cancelScheduledValues(now);
      this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
      this.musicGainNode.gain.linearRampToValueAtTime(finalMusicGain, now + 0.05);
    }
    if (this.sfxGainNode) {
      const targetSfxGain = this.sfxMuted ? 0 : this.sfxVolume * 0.9;
      this.sfxGainNode.gain.cancelScheduledValues(now);
      this.sfxGainNode.gain.setValueAtTime(this.sfxGainNode.gain.value, now);
      this.sfxGainNode.gain.linearRampToValueAtTime(targetSfxGain, now + 0.05);
    }
  }

  public midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public setMuted(musicMuted: boolean, sfxMuted: boolean): void {
    this.musicMuted = musicMuted;
    this.sfxMuted = sfxMuted;
    this.updateGainLevels();
    if (musicMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public setVolume(musicVolume: SteppedVolume, sfxVolume: SteppedVolume): void {
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
    this.updateGainLevels();
  }

  public setTrackPreference(pref: MusicTrackOption): void {
    this.musicTrackPreference = pref;
    if (pref !== 'auto') {
      this.currentTrackId = pref;
    }
    if (this.isMusicPlaying && !this.musicMuted) {
      // Smoothly transition to preferred track
      this.stopMusic();
      this.startMusic();
    }
  }

  public getCurrentTrackId(): MusicTrackOption {
    return this.musicTrackPreference === 'auto' ? this.currentTrackId : this.musicTrackPreference;
  }

  public getEffectiveMusicVolume(): number {
    return this.musicMuted ? 0 : this.musicVolume;
  }

  public getEffectiveSfxVolume(): number {
    return this.sfxMuted ? 0 : this.sfxVolume;
  }

  public isDucking(): boolean {
    return this.isDuckingActive;
  }

  // --- SYNTHESIZER VOICES ---

  // 1. Acoustic Nylon Guitar (Karplus-Strong physical string simulation)
  private getGuitarBuffer(ctx: AudioContext, freq: number): AudioBuffer {
    const roundedFreq = Math.round(freq);
    if (this.guitarCache[roundedFreq]) {
      return this.guitarCache[roundedFreq];
    }

    const sampleRate = ctx.sampleRate;
    const duration = 1.4;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const period = Math.max(2, Math.round(sampleRate / freq));
    const noise = new Float32Array(period);
    for (let i = 0; i < period; i++) {
      noise[i] = (Math.random() * 2 - 1) * 0.9;
    }

    let prev = 0;
    const decay = 0.993;
    for (let i = 0; i < length; i++) {
      if (i < period) {
        data[i] = noise[i];
      } else {
        const val = (data[i - period] + prev) * 0.5 * decay;
        data[i] = val;
        prev = val;
      }
    }

    this.guitarCache[roundedFreq] = buffer;
    return buffer;
  }

  public playGuitar(freq: number, time: number, dur: number, gainLevel: number = 0.28): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const buffer = this.getGuitarBuffer(ctx, freq);
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);
      filter.frequency.exponentialRampToValueAtTime(1200, time + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(dur + 0.1, 1.3));

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      source.start(time);
      source.stop(time + Math.min(dur + 0.15, 1.35));
      this.activeMusicNodes.push(source, gain);
    } catch (_e) {}
  }

  // 2. French Musette Accordion (Dual detuned sawtooth reeds + formant filter)
  public playAccordion(freq: number, time: number, dur: number, gainLevel: number = 0.2): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      oscSub.type = 'sine';

      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(14, time); // 3.5Hz Parisian musette beating
      oscSub.frequency.setValueAtTime(freq * 0.5, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(Math.min(1800, Math.max(700, freq * 1.8)), time);
      filter.Q.setValueAtTime(1.6, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.035);
      gain.gain.setValueAtTime(gainLevel * 0.85, time + dur - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.05);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(gainLevel * 0.35, time);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      oscSub.connect(subGain);
      subGain.connect(this.musicGainNode);

      osc1.start(time);
      osc2.start(time);
      oscSub.start(time);
      osc1.stop(time + dur + 0.08);
      osc2.stop(time + dur + 0.08);
      oscSub.stop(time + dur + 0.08);

      this.activeMusicNodes.push(osc1, osc2, oscSub, gain);
    } catch (_e) {}
  }

  // 3. Breath Whistle Flute (Sine + pink breath air noise + delayed vibrato)
  public playFlute(freq: number, time: number, dur: number, gainLevel: number = 0.2): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      lfo.frequency.setValueAtTime(5.4, time);
      lfoGain.gain.setValueAtTime(0, time);
      lfoGain.gain.setValueAtTime(0, time + 0.14);
      lfoGain.gain.linearRampToValueAtTime(5.0, time + 0.38);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Breath chiff noise layer
      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
      const nData = noiseBuf.getChannelData(0);
      for (let i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1) * 0.4;
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(freq * 1.5, time);
      nFilter.Q.setValueAtTime(3.0, time);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.05, time);
      nGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
      noiseSrc.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.musicGainNode);
      noiseSrc.start(time);
      noiseSrc.stop(time + 0.08);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.04);
      gain.gain.setValueAtTime(gainLevel * 0.9, time + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.06);

      osc.connect(gain);
      gain.connect(this.musicGainNode);

      lfo.start(time);
      osc.start(time);
      lfo.stop(time + dur + 0.08);
      osc.stop(time + dur + 0.08);

      this.activeMusicNodes.push(osc, lfo, noiseSrc, gain);
    } catch (_e) {}
  }

  // 4. Upright Plucked Bass
  public playBass(freq: number, time: number, dur: number, gainLevel: number = 0.38): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, time);
      filter.frequency.exponentialRampToValueAtTime(250, time + 0.15);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(gainLevel * 0.5, time + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      osc.stop(time + dur + 0.08);

      this.activeMusicNodes.push(osc, gain);
    } catch (_e) {}
  }

  // 5. Celesta Bell
  public playBell(freq: number, time: number, dur: number, gainLevel: number = 0.18): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, time);

      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.35);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + dur + 0.4);
      osc2.stop(time + 0.2);

      this.activeMusicNodes.push(osc, osc2, gain);
    } catch (_e) {}
  }

  // 6. Brazilian Shaker
  public playShaker(time: number, gainLevel: number = 0.045): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      src.start(time);
      src.stop(time + 0.06);

      this.activeMusicNodes.push(src, gain);
    } catch (_e) {}
  }

  // 7. Woodblock / Agogo
  public playWoodblock(freq: number, time: number, gainLevel: number = 0.16): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, time + 0.035);

      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

      osc.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      osc.stop(time + 0.05);

      this.activeMusicNodes.push(osc, gain);
    } catch (_e) {}
  }

  // --- GAME SFX ---

  public playCross(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.sfxGainNode) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (_e) {}
  }

  public playCatPlaced(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.sfxGainNode) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.16);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (_e) {}
  }

  public playConflict(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.sfxGainNode) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_e) {}
  }

  public playVictory(): void {
    if (this.sfxMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.sfxGainNode) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();

      // Duck background music during victory fanfare
      this.isDuckingActive = true;
      this.updateGainLevels();

      if (this.duckingTimeout) {
        clearTimeout(this.duckingTimeout);
      }
      this.duckingTimeout = window.setTimeout(() => {
        this.isDuckingActive = false;
        this.updateGainLevels();
        this.duckingTimeout = null;
      }, 900);

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const start = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = start + i * 0.11;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.22, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGainNode!);

        osc.start(noteStart);
        osc.stop(noteStart + 0.28);
      });
    } catch (_e) {}
  }

  public startMusic(): void {
    if (this.musicMuted || this.musicTimer !== null) return;
    const ctx = this.getContext();
    if (!ctx) return;
    this.isMusicPlaying = true;
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.activeMusicNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (_e) {}
    });
    this.activeMusicNodes = [];
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
