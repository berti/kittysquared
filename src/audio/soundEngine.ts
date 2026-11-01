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

function chord(
  inst: SoundEvent['inst'],
  beat: number,
  dur: number,
  midiArray: number[],
  gain: number
): SoundEvent[] {
  return midiArray.map((m) => ({ inst, beat, dur, midi: m, gain: gain / midiArray.length }));
}

const BOSSA_TRACK: SoundTrackDef = {
  id: 'bossa',
  bpm: 122,
  meter: '4/4',
  totalBeats: 32,
  events: [
    // Bar 1: Cmaj7
    { inst: 'bass', beat: 0, dur: 0.8, midi: 48 }, // C3
    { inst: 'bass', beat: 2.5, dur: 0.8, midi: 43 }, // G2
    ...chord('guitar', 0, 0.45, [60, 64, 67, 71], 0.32),
    ...chord('guitar', 1.5, 0.45, [60, 64, 67, 71], 0.32),
    ...chord('guitar', 2.5, 0.45, [60, 64, 67, 71], 0.32),
    ...chord('guitar', 3.5, 0.45, [60, 64, 67, 71], 0.32),
    { inst: 'flute', beat: 0, dur: 1.2, midi: 72 }, // C5
    { inst: 'flute', beat: 1.5, dur: 0.8, midi: 76 }, // E5
    { inst: 'flute', beat: 2.5, dur: 1.2, midi: 79 }, // G5
    { inst: 'shaker', beat: 0 },
    { inst: 'shaker', beat: 1 },
    { inst: 'shaker', beat: 2 },
    { inst: 'shaker', beat: 3 },
    { inst: 'woodblock', beat: 2, freq: 850, gain: 0.08 },

    // Bar 2: D9
    { inst: 'bass', beat: 4.0, dur: 0.8, midi: 50 }, // D3
    { inst: 'bass', beat: 6.5, dur: 0.8, midi: 45 }, // A2
    ...chord('guitar', 4.0, 0.45, [60, 64, 66, 69], 0.32),
    ...chord('guitar', 5.5, 0.45, [60, 64, 66, 69], 0.32),
    ...chord('guitar', 6.5, 0.45, [60, 64, 66, 69], 0.32),
    { inst: 'flute', beat: 4.0, dur: 1.2, midi: 78 }, // F#5
    { inst: 'flute', beat: 5.5, dur: 0.8, midi: 76 }, // E5
    { inst: 'flute', beat: 6.5, dur: 1.2, midi: 74 }, // D5
    { inst: 'shaker', beat: 4 },
    { inst: 'shaker', beat: 5 },
    { inst: 'shaker', beat: 6 },
    { inst: 'shaker', beat: 7 },

    // Bar 3: Dm7
    { inst: 'bass', beat: 8.0, dur: 0.8, midi: 50 }, // D3
    { inst: 'bass', beat: 10.5, dur: 0.8, midi: 45 }, // A2
    ...chord('guitar', 8.0, 0.45, [60, 65, 69, 72], 0.32),
    ...chord('guitar', 9.5, 0.45, [60, 65, 69, 72], 0.32),
    ...chord('guitar', 10.5, 0.45, [60, 65, 69, 72], 0.32),
    { inst: 'flute', beat: 8.0, dur: 1.2, midi: 77 }, // F5
    { inst: 'flute', beat: 9.5, dur: 0.8, midi: 76 }, // E5
    { inst: 'flute', beat: 10.5, dur: 1.2, midi: 74 }, // D5
    { inst: 'shaker', beat: 8 },
    { inst: 'shaker', beat: 9 },
    { inst: 'shaker', beat: 10 },
    { inst: 'shaker', beat: 11 },
    { inst: 'woodblock', beat: 10, freq: 850, gain: 0.08 },

    // Bar 4: G13
    { inst: 'bass', beat: 12.0, dur: 0.8, midi: 43 }, // G2
    { inst: 'bass', beat: 14.5, dur: 0.8, midi: 50 }, // D3
    ...chord('guitar', 12.0, 0.45, [59, 64, 65, 69], 0.32),
    ...chord('guitar', 13.5, 0.45, [59, 64, 65, 69], 0.32),
    ...chord('guitar', 14.5, 0.45, [59, 64, 65, 69], 0.32),
    { inst: 'flute', beat: 12.0, dur: 2.2, midi: 71 }, // B4
    { inst: 'flute', beat: 14.5, dur: 1.2, midi: 74 }, // D5
    { inst: 'shaker', beat: 12 },
    { inst: 'shaker', beat: 13 },
    { inst: 'shaker', beat: 14 },
    { inst: 'shaker', beat: 15 },

    // Bar 5: Em7
    { inst: 'bass', beat: 16.0, dur: 0.8, midi: 40 }, // E2
    { inst: 'bass', beat: 18.5, dur: 0.8, midi: 47 }, // B2
    ...chord('guitar', 16.0, 0.45, [59, 62, 67, 71], 0.32),
    ...chord('guitar', 17.5, 0.45, [59, 62, 67, 71], 0.32),
    ...chord('guitar', 18.5, 0.45, [59, 62, 67, 71], 0.32),
    { inst: 'flute', beat: 16.0, dur: 1.2, midi: 76 }, // E5
    { inst: 'flute', beat: 17.5, dur: 0.8, midi: 79 }, // G5
    { inst: 'flute', beat: 18.5, dur: 1.2, midi: 83 }, // B5
    { inst: 'shaker', beat: 16 },
    { inst: 'shaker', beat: 17 },
    { inst: 'shaker', beat: 18 },
    { inst: 'shaker', beat: 19 },
    { inst: 'woodblock', beat: 18, freq: 850, gain: 0.08 },

    // Bar 6: A7(b9)
    { inst: 'bass', beat: 20.0, dur: 0.8, midi: 45 }, // A2
    { inst: 'bass', beat: 22.5, dur: 0.8, midi: 40 }, // E2
    ...chord('guitar', 20.0, 0.45, [58, 61, 64, 67], 0.32),
    ...chord('guitar', 21.5, 0.45, [58, 61, 64, 67], 0.32),
    ...chord('guitar', 22.5, 0.45, [58, 61, 64, 67], 0.32),
    { inst: 'flute', beat: 20.0, dur: 1.2, midi: 81 }, // A5
    { inst: 'flute', beat: 21.5, dur: 0.8, midi: 79 }, // G5
    { inst: 'flute', beat: 22.5, dur: 1.2, midi: 76 }, // E5
    { inst: 'shaker', beat: 20 },
    { inst: 'shaker', beat: 21 },
    { inst: 'shaker', beat: 22 },
    { inst: 'shaker', beat: 23 },

    // Bar 7: Dm7
    { inst: 'bass', beat: 24.0, dur: 0.8, midi: 50 }, // D3
    { inst: 'bass', beat: 26.5, dur: 0.8, midi: 45 }, // A2
    ...chord('guitar', 24.0, 0.45, [60, 65, 69, 72], 0.32),
    ...chord('guitar', 25.5, 0.45, [60, 65, 69, 72], 0.32),
    ...chord('guitar', 26.5, 0.45, [60, 65, 69, 72], 0.32),
    { inst: 'flute', beat: 24.0, dur: 1.2, midi: 77 }, // F5
    { inst: 'flute', beat: 25.5, dur: 0.8, midi: 76 }, // E5
    { inst: 'flute', beat: 26.5, dur: 1.2, midi: 74 }, // D5
    { inst: 'shaker', beat: 24 },
    { inst: 'shaker', beat: 25 },
    { inst: 'shaker', beat: 26 },
    { inst: 'shaker', beat: 27 },

    // Bar 8: G7alt -> turnaround
    { inst: 'bass', beat: 28.0, dur: 0.8, midi: 43 }, // G2
    { inst: 'bass', beat: 30.5, dur: 0.8, midi: 50 }, // D3
    ...chord('guitar', 28.0, 0.45, [59, 63, 65, 69], 0.32),
    ...chord('guitar', 29.5, 0.45, [59, 62, 65, 67], 0.32),
    ...chord('guitar', 30.5, 0.45, [59, 62, 65, 67], 0.32),
    { inst: 'flute', beat: 28.0, dur: 1.2, midi: 71 }, // B4
    { inst: 'flute', beat: 29.5, dur: 0.8, midi: 74 }, // D5
    { inst: 'flute', beat: 30.5, dur: 1.2, midi: 72 }, // C5
    { inst: 'shaker', beat: 28 },
    { inst: 'shaker', beat: 29 },
    { inst: 'shaker', beat: 30 },
    { inst: 'shaker', beat: 31 },
  ],
};

// Catnip Waltz: Lowered octave/register for lead accordion melody (G4-E5),
// eliminating piercing high frequencies and harmonizing with Bossa & Samba.
const WALTZ_TRACK: SoundTrackDef = {
  id: 'waltz',
  bpm: 138,
  meter: '3/4',
  totalBeats: 24,
  events: [
    // Bar 1: G Major
    { inst: 'bass', beat: 0, dur: 0.9, midi: 43 }, // G2
    ...chord('guitar', 1, 0.4, [55, 59, 62], 0.28), // G3, B3, D4
    ...chord('guitar', 2, 0.4, [55, 59, 62], 0.28),
    { inst: 'accordion', beat: 0, dur: 1.8, midi: 59 }, // B3 (warm, lowered)
    { inst: 'accordion', beat: 2, dur: 0.9, midi: 62 }, // D4
    { inst: 'bell', beat: 0, dur: 1.0, midi: 67 }, // G4 chime

    // Bar 2: Bm
    { inst: 'bass', beat: 3, dur: 0.9, midi: 47 }, // B2
    ...chord('guitar', 4, 0.4, [54, 59, 62], 0.28), // F#3, B3, D4
    ...chord('guitar', 5, 0.4, [54, 59, 62], 0.28),
    { inst: 'accordion', beat: 3, dur: 1.8, midi: 64 }, // E4
    { inst: 'accordion', beat: 5, dur: 0.9, midi: 62 }, // D4

    // Bar 3: C Major
    { inst: 'bass', beat: 6, dur: 0.9, midi: 48 }, // C3
    ...chord('guitar', 7, 0.4, [55, 60, 64], 0.28), // G3, C4, E4
    ...chord('guitar', 8, 0.4, [55, 60, 64], 0.28),
    { inst: 'accordion', beat: 6, dur: 0.9, midi: 60 }, // C4
    { inst: 'accordion', beat: 7, dur: 0.9, midi: 62 }, // D4
    { inst: 'accordion', beat: 8, dur: 0.9, midi: 64 }, // E4

    // Bar 4: D7
    { inst: 'bass', beat: 9, dur: 0.9, midi: 50 }, // D3
    ...chord('guitar', 10, 0.4, [57, 60, 62], 0.28), // A3, C4, D4
    ...chord('guitar', 11, 0.4, [57, 60, 62], 0.28),
    { inst: 'accordion', beat: 9, dur: 2.6, midi: 66 }, // F#4
    { inst: 'bell', beat: 9, dur: 1.2, midi: 69 }, // A4

    // Bar 5: Em
    { inst: 'bass', beat: 12, dur: 0.9, midi: 52 }, // E3
    ...chord('guitar', 13, 0.4, [55, 59, 64], 0.28), // G3, B3, E4
    ...chord('guitar', 14, 0.4, [55, 59, 64], 0.28),
    { inst: 'accordion', beat: 12, dur: 1.8, midi: 67 }, // G4
    { inst: 'accordion', beat: 14, dur: 0.9, midi: 64 }, // E4

    // Bar 6: A7
    { inst: 'bass', beat: 15, dur: 0.9, midi: 45 }, // A2
    ...chord('guitar', 16, 0.4, [57, 61, 64], 0.28), // A3, C#4, E4
    ...chord('guitar', 17, 0.4, [57, 61, 64], 0.28),
    { inst: 'accordion', beat: 15, dur: 1.8, midi: 62 }, // D4
    { inst: 'accordion', beat: 17, dur: 0.9, midi: 59 }, // B3

    // Bar 7: Am7
    { inst: 'bass', beat: 18, dur: 0.9, midi: 45 }, // A2
    ...chord('guitar', 19, 0.4, [57, 60, 64], 0.28), // A3, C4, E4
    ...chord('guitar', 20, 0.4, [57, 60, 64], 0.28),
    { inst: 'accordion', beat: 18, dur: 0.9, midi: 57 }, // A3
    { inst: 'accordion', beat: 19, dur: 0.9, midi: 59 }, // B3
    { inst: 'accordion', beat: 20, dur: 0.9, midi: 60 }, // C4

    // Bar 8: D7 -> G resolution
    { inst: 'bass', beat: 21, dur: 0.9, midi: 50 }, // D3
    ...chord('guitar', 22, 0.4, [57, 60, 62], 0.28),
    ...chord('guitar', 23, 0.4, [55, 59, 62], 0.28),
    { inst: 'accordion', beat: 21, dur: 1.8, midi: 62 }, // D4
    { inst: 'accordion', beat: 23, dur: 0.9, midi: 55 }, // G3
    { inst: 'bell', beat: 23, dur: 1.0, midi: 67 }, // G4
  ],
};

const SAMBA_TRACK: SoundTrackDef = {
  id: 'samba',
  bpm: 132,
  meter: '4/4',
  totalBeats: 32,
  events: [
    // Bar 1: D Major (Beats 0-4)
    { inst: 'bass', beat: 0, dur: 0.7, midi: 50 }, // D3
    { inst: 'bass', beat: 2.5, dur: 0.7, midi: 45 }, // A2
    ...chord('guitar', 0, 0.35, [62, 66, 69, 74], 0.32),
    ...chord('guitar', 1.0, 0.35, [62, 66, 69, 74], 0.32),
    ...chord('guitar', 1.75, 0.35, [62, 66, 69, 74], 0.32),
    ...chord('guitar', 2.5, 0.35, [62, 66, 69, 74], 0.32),
    ...chord('guitar', 3.25, 0.35, [62, 66, 69, 74], 0.32),
    { inst: 'flute', beat: 0, dur: 0.7, midi: 74 }, // D5
    { inst: 'flute', beat: 1.0, dur: 0.6, midi: 76 }, // E5
    { inst: 'flute', beat: 1.75, dur: 0.6, midi: 78 }, // F#5
    { inst: 'flute', beat: 2.5, dur: 1.2, midi: 81 }, // A5
    { inst: 'shaker', beat: 0 },
    { inst: 'shaker', beat: 0.5 },
    { inst: 'shaker', beat: 1 },
    { inst: 'shaker', beat: 1.5 },
    { inst: 'shaker', beat: 2 },
    { inst: 'shaker', beat: 2.5 },
    { inst: 'shaker', beat: 3 },
    { inst: 'shaker', beat: 3.5 },
    { inst: 'woodblock', beat: 1.5, freq: 720 },
    { inst: 'woodblock', beat: 3.5, freq: 880 },

    // Bar 2: Bm7 (Beats 4-8)
    { inst: 'bass', beat: 4.0, dur: 0.7, midi: 47 }, // B2
    { inst: 'bass', beat: 6.5, dur: 0.7, midi: 54 }, // F#3
    ...chord('guitar', 4.0, 0.35, [59, 62, 66, 69], 0.32),
    ...chord('guitar', 5.0, 0.35, [59, 62, 66, 69], 0.32),
    ...chord('guitar', 5.75, 0.35, [59, 62, 66, 69], 0.32),
    ...chord('guitar', 6.5, 0.35, [59, 62, 66, 69], 0.32),
    { inst: 'flute', beat: 4.0, dur: 0.6, midi: 78 }, // F#5
    { inst: 'flute', beat: 4.75, dur: 0.6, midi: 76 }, // E5
    { inst: 'flute', beat: 5.5, dur: 0.8, midi: 74 }, // D5
    { inst: 'flute', beat: 6.5, dur: 1.2, midi: 71 }, // B4
    { inst: 'shaker', beat: 4 },
    { inst: 'shaker', beat: 4.5 },
    { inst: 'shaker', beat: 5 },
    { inst: 'shaker', beat: 5.5 },
    { inst: 'shaker', beat: 6 },
    { inst: 'shaker', beat: 6.5 },
    { inst: 'shaker', beat: 7 },
    { inst: 'shaker', beat: 7.5 },
    { inst: 'woodblock', beat: 5.5, freq: 720 },
    { inst: 'woodblock', beat: 7.5, freq: 880 },

    // Bar 3: Em7 (Beats 8-12)
    { inst: 'bass', beat: 8.0, dur: 0.7, midi: 40 }, // E2
    { inst: 'bass', beat: 10.5, dur: 0.7, midi: 47 }, // B2
    ...chord('guitar', 8.0, 0.35, [62, 64, 67, 71], 0.32),
    ...chord('guitar', 9.0, 0.35, [62, 64, 67, 71], 0.32),
    ...chord('guitar', 9.75, 0.35, [62, 64, 67, 71], 0.32),
    ...chord('guitar', 10.5, 0.35, [62, 64, 67, 71], 0.32),
    { inst: 'flute', beat: 8.0, dur: 0.6, midi: 76 }, // E5
    { inst: 'flute', beat: 8.75, dur: 0.6, midi: 78 }, // F#5
    { inst: 'flute', beat: 9.5, dur: 0.8, midi: 79 }, // G5
    { inst: 'flute', beat: 10.5, dur: 1.2, midi: 83 }, // B5
    { inst: 'shaker', beat: 8 },
    { inst: 'shaker', beat: 8.5 },
    { inst: 'shaker', beat: 9 },
    { inst: 'shaker', beat: 9.5 },
    { inst: 'shaker', beat: 10 },
    { inst: 'shaker', beat: 10.5 },
    { inst: 'shaker', beat: 11 },
    { inst: 'shaker', beat: 11.5 },
    { inst: 'woodblock', beat: 9.5, freq: 720 },
    { inst: 'woodblock', beat: 11.5, freq: 880 },

    // Bar 4: A7 (Beats 12-16)
    { inst: 'bass', beat: 12.0, dur: 0.7, midi: 45 }, // A2
    { inst: 'bass', beat: 14.5, dur: 0.7, midi: 40 }, // E2
    ...chord('guitar', 12.0, 0.35, [61, 64, 67, 73], 0.32),
    ...chord('guitar', 13.0, 0.35, [61, 64, 67, 73], 0.32),
    ...chord('guitar', 13.75, 0.35, [61, 64, 67, 73], 0.32),
    ...chord('guitar', 14.5, 0.35, [61, 64, 67, 73], 0.32),
    { inst: 'flute', beat: 12.0, dur: 0.7, midi: 81 }, // A5
    { inst: 'flute', beat: 13.0, dur: 0.7, midi: 79 }, // G5
    { inst: 'flute', beat: 14.0, dur: 1.5, midi: 78 }, // F#5
    { inst: 'shaker', beat: 12 },
    { inst: 'shaker', beat: 13 },
    { inst: 'shaker', beat: 14 },
    { inst: 'shaker', beat: 15 },

    // Bar 5: D Major (Beats 16-20)
    { inst: 'bass', beat: 16.0, dur: 0.7, midi: 50 }, // D3
    { inst: 'bass', beat: 18.5, dur: 0.7, midi: 45 }, // A2
    ...chord('guitar', 16.0, 0.35, [62, 66, 69, 74], 0.32),
    ...chord('guitar', 17.0, 0.35, [62, 66, 69, 74], 0.32),
    ...chord('guitar', 18.5, 0.35, [62, 66, 69, 74], 0.32),
    { inst: 'flute', beat: 16.0, dur: 0.7, midi: 81 }, // A5
    { inst: 'flute', beat: 17.0, dur: 0.7, midi: 83 }, // B5
    { inst: 'flute', beat: 18.0, dur: 1.5, midi: 86 }, // D6
    { inst: 'shaker', beat: 16 },
    { inst: 'shaker', beat: 17 },
    { inst: 'shaker', beat: 18 },
    { inst: 'shaker', beat: 19 },

    // Bar 6: B7 (Beats 20-24)
    { inst: 'bass', beat: 20.0, dur: 0.7, midi: 47 }, // B2
    { inst: 'bass', beat: 22.5, dur: 0.7, midi: 54 }, // F#3
    ...chord('guitar', 20.0, 0.35, [59, 63, 66, 69], 0.32),
    ...chord('guitar', 21.0, 0.35, [59, 63, 66, 69], 0.32),
    ...chord('guitar', 22.5, 0.35, [59, 63, 66, 69], 0.32),
    { inst: 'flute', beat: 20.0, dur: 0.7, midi: 83 }, // B5
    { inst: 'flute', beat: 21.0, dur: 0.7, midi: 81 }, // A5
    { inst: 'flute', beat: 22.0, dur: 1.5, midi: 78 }, // F#5
    { inst: 'shaker', beat: 20 },
    { inst: 'shaker', beat: 21 },
    { inst: 'shaker', beat: 22 },
    { inst: 'shaker', beat: 23 },

    // Bar 7: Em7 (Beats 24-28)
    { inst: 'bass', beat: 24.0, dur: 0.7, midi: 40 }, // E2
    { inst: 'bass', beat: 26.5, dur: 0.7, midi: 45 }, // A2
    ...chord('guitar', 24.0, 0.35, [62, 64, 67, 71], 0.32),
    ...chord('guitar', 25.0, 0.35, [62, 64, 67, 71], 0.32),
    ...chord('guitar', 26.5, 0.35, [62, 64, 67, 71], 0.32),
    { inst: 'flute', beat: 24.0, dur: 0.7, midi: 79 }, // G5
    { inst: 'flute', beat: 25.0, dur: 0.7, midi: 78 }, // F#5
    { inst: 'flute', beat: 26.0, dur: 1.5, midi: 76 }, // E5
    { inst: 'shaker', beat: 24 },
    { inst: 'shaker', beat: 25 },
    { inst: 'shaker', beat: 26 },
    { inst: 'shaker', beat: 27 },

    // Bar 8: A7 -> D turnaround (Beats 28-32)
    { inst: 'bass', beat: 28.0, dur: 0.7, midi: 45 }, // A2
    { inst: 'bass', beat: 30.5, dur: 0.7, midi: 50 }, // D3
    ...chord('guitar', 28.0, 0.35, [61, 64, 67, 73], 0.32),
    ...chord('guitar', 29.5, 0.35, [62, 66, 69, 74], 0.32),
    { inst: 'flute', beat: 28.0, dur: 0.6, midi: 74 }, // D5
    { inst: 'flute', beat: 29.0, dur: 0.6, midi: 76 }, // E5
    { inst: 'flute', beat: 30.0, dur: 1.8, midi: 74 }, // D5
    { inst: 'shaker', beat: 28 },
    { inst: 'shaker', beat: 29 },
    { inst: 'shaker', beat: 30 },
    { inst: 'shaker', beat: 31 },
    { inst: 'woodblock', beat: 30.5, freq: 880 },
  ],
};

const TRACK_MAP: Record<'bossa' | 'waltz' | 'samba', SoundTrackDef> = {
  bossa: BOSSA_TRACK,
  waltz: WALTZ_TRACK,
  samba: SAMBA_TRACK,
};

const TRACK_REPEATS: Record<'bossa' | 'waltz' | 'samba', number> = {
  bossa: 4, // 4 * 15.7s = ~63s
  waltz: 6, // 6 * 10.4s = ~62s
  samba: 4, // 4 * 14.5s = ~58s
};

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
  private currentRepeatCount: number = 0;
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
    if (this.musicTrackPreference === pref) return;
    this.musicTrackPreference = pref;
    this.currentRepeatCount = 0;
    if (pref !== 'auto') {
      this.currentTrackId = pref;
    }
    if (this.isMusicPlaying && !this.musicMuted) {
      // Smoothly transition to preferred track
      this.stopMusic();
      this.startMusic();
    }
  }

  public getActiveNodeCount(): number {
    return this.activeMusicNodes.length;
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

      this.activeMusicNodes.push(osc1, osc2, oscSub, gain, subGain);
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

      this.activeMusicNodes.push(osc, lfo, noiseSrc, gain, nGain);
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
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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

    const ctx = this.getContext();
    if (!ctx || !this.sfxGainNode) return;

    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

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

  public getTrackEvents(trackId: MusicTrackOption): SoundEvent[] {
    if (trackId === 'auto') {
      return TRACK_MAP.bossa.events;
    }
    return TRACK_MAP[trackId]?.events || [];
  }

  private scheduleTrackEvents(ctx: AudioContext, track: SoundTrackDef, cycleStartTime: number): void {
    const beatDur = 60 / track.bpm;
    track.events.forEach((ev) => {
      const noteTime = cycleStartTime + ev.beat * beatDur;
      const noteDur = (ev.dur || 0.4) * beatDur;
      const freq = ev.midi ? this.midiToFreq(ev.midi) : ev.freq || 440;

      switch (ev.inst) {
        case 'guitar':
          this.playGuitar(freq, noteTime, noteDur, ev.gain || 0.28);
          break;
        case 'accordion':
          this.playAccordion(freq, noteTime, noteDur, ev.gain || 0.2);
          break;
        case 'flute':
          this.playFlute(freq, noteTime, noteDur, ev.gain || 0.18);
          break;
        case 'bass':
          this.playBass(freq, noteTime, noteDur, ev.gain || 0.35);
          break;
        case 'bell':
          this.playBell(freq, noteTime, noteDur, ev.gain || 0.18);
          break;
        case 'shaker':
          this.playShaker(noteTime, ev.gain || 0.04);
          break;
        case 'woodblock':
          this.playWoodblock(ev.freq || 720, noteTime, ev.gain || 0.16);
          break;
      }
    });
  }

  public getNextTrack(): { track: SoundTrackDef; isNewTrack: boolean } {
    const trackList: ('bossa' | 'waltz' | 'samba')[] = ['bossa', 'waltz', 'samba'];

    if (this.musicTrackPreference !== 'auto') {
      this.currentTrackId = this.musicTrackPreference;
      const isNew = this.currentRepeatCount === 0;
      this.currentRepeatCount++;
      return { track: TRACK_MAP[this.musicTrackPreference], isNewTrack: isNew };
    }

    const currentTrackId = trackList[this.currentTrackIndex % trackList.length];
    const targetRepeats = TRACK_REPEATS[currentTrackId] || 4;

    if (this.currentRepeatCount === 0) {
      // First cycle of initial track
      this.currentRepeatCount = 1;
      this.currentTrackId = currentTrackId;
      return { track: TRACK_MAP[currentTrackId], isNewTrack: true };
    }

    if (this.currentRepeatCount < targetRepeats) {
      // Repeat the same track seamlessly
      this.currentRepeatCount++;
      return { track: TRACK_MAP[currentTrackId], isNewTrack: false };
    }

    // Finished target repeats, advance to next track in playlist
    this.currentTrackIndex++;
    this.currentRepeatCount = 1;
    const nextTrackId = trackList[this.currentTrackIndex % trackList.length];
    this.currentTrackId = nextTrackId;
    return { track: TRACK_MAP[nextTrackId], isNewTrack: true };
  }

  public startMusic(): void {
    if (this.musicMuted || this.musicTimer !== null) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (_e) {}

    this.isMusicPlaying = true;
    const first = this.getNextTrack();
    let activeTrack = first.track;
    let nextCycleTime = ctx.currentTime + 0.05;
    let beatDur = 60 / activeTrack.bpm;
    let loopDur = activeTrack.totalBeats * beatDur;

    this.scheduleTrackEvents(ctx, activeTrack, nextCycleTime);
    let cycleEndTime = nextCycleTime + loopDur;

    this.musicTimer = window.setInterval(() => {
      if (!this.isMusicPlaying || this.musicMuted) return;
      const now = ctx.currentTime;
      // When approaching the end of current cycle, schedule next cycle
      if (now + 0.5 > cycleEndTime) {
        this.activeMusicNodes = []; // Prune expired nodes from prior cycles to avoid memory leaks
        const nextInfo = this.getNextTrack();
        activeTrack = nextInfo.track;
        beatDur = 60 / activeTrack.bpm;
        loopDur = activeTrack.totalBeats * beatDur;
        // If switching between different songs, insert a 2.5s musical breath;
        // if seamlessly repeating the same song, loop without any gap (0s)
        const pause = nextInfo.isNewTrack ? 2.5 : 0;
        nextCycleTime = Math.max(now + 0.05, cycleEndTime + pause);
        this.scheduleTrackEvents(ctx, activeTrack, nextCycleTime);
        cycleEndTime = nextCycleTime + loopDur;
      }
    }, 25);
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentRepeatCount = 0;
    this.activeMusicNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
      } catch (_e) {}
      try {
        node.disconnect();
      } catch (_e) {}
    });
    this.activeMusicNodes = [];
    this.isMusicPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
