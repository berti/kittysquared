import { MusicTrackOption, SteppedVolume } from '../state/storage';

export type ConcreteTrackId = Exclude<MusicTrackOption, 'auto'>;

export const PLAYLIST_ORDER: ConcreteTrackId[] = [
  'marimba',
  'velvet',
  'sunbeam',
  'bossa',
  'waltz',
  'samba',
];

export type InstrumentType =
  | 'marimba'
  | 'rhodes'
  | 'kalimba'
  | 'guitar'
  | 'accordion'
  | 'flute'
  | 'bass'
  | 'bell'
  | 'shaker'
  | 'woodblock';

export interface SoundEvent {
  inst: InstrumentType;
  beat: number;
  dur?: number;
  midi?: number;
  freq?: number;
  gain?: number;
}

export interface SoundTrackDef {
  id: ConcreteTrackId;
  bpm: number;
  meter: string;
  totalBeats: number;
  events: SoundEvent[];
}

function chord(
  inst: InstrumentType,
  beat: number,
  dur: number,
  midiArray: number[],
  gain: number
): SoundEvent[] {
  return midiArray.map((m) => ({ inst, beat, dur, midi: m, gain: gain / midiArray.length }));
}

interface ChordBarDef {
  bass: [number, number];
  walk?: [number, number, number, number];
  voicing: number[];
}

interface MelodyNoteDef {
  beat: number;
  dur: number;
  midi: number;
  inst?: InstrumentType;
  gain?: number;
}

interface Arrangement44Spec {
  grooveStyle: 'mambo' | 'walking' | 'bossa' | 'samba';
  compInst: InstrumentType;
  lead1: InstrumentType;
  lead2: InstrumentType;
  accentInst: InstrumentType;
  progA: ChordBarDef[];
  progB: ChordBarDef[];
  melA1: MelodyNoteDef[];
  melA2: MelodyNoteDef[];
  melB1: MelodyNoteDef[];
  melB2: MelodyNoteDef[];
}

/**
 * Builds a 56-bar (224-beat in 4/4) arrangement across 6 sections:
 * 1. Bars 0–3 (4 bars): Groove Intro (rhythm only)
 * 2. Bars 4–19 (16 bars): Theme A (A1 + A2 with call-and-response)
 * 3. Bars 20–27 (8 bars): Rhythm & Comping Breather (melody rests)
 * 4. Bars 28–43 (16 bars): Bridge & Instrument Handoff (Theme B1 + B2)
 * 5. Bars 44–47 (4 bars): Bass & Percussion Breakdown
 * 6. Bars 48–55 (8 bars): Theme A' Finale & Cadence
 */
function buildExtended44Arrangement(spec: Arrangement44Spec): SoundEvent[] {
  const events: SoundEvent[] = [];
  const {
    progA,
    progB,
    compInst,
    lead1,
    lead2,
    accentInst,
    grooveStyle,
    melA1,
    melA2,
    melB1,
    melB2,
  } = spec;

  function addRhythmBar(
    barIndex: number,
    chordDef: ChordBarDef,
    mode: 'intro' | 'main' | 'rhythm-breather' | 'bridge' | 'breakdown'
  ): void {
    const b = barIndex * 4;
    const [r1, r2] = chordDef.bass;
    const notes = chordDef.voicing;

    if (grooveStyle === 'walking') {
      const walk = chordDef.walk || [r1, r1 + 4, r2, r1 + 2];
      events.push({ inst: 'bass', beat: b + 0, dur: 0.85, midi: walk[0] });
      events.push({ inst: 'bass', beat: b + 1, dur: 0.85, midi: walk[1] });
      events.push({ inst: 'bass', beat: b + 2, dur: 0.85, midi: walk[2] });
      events.push({ inst: 'bass', beat: b + 3, dur: 0.85, midi: walk[3] });
    } else if (grooveStyle === 'mambo') {
      events.push({ inst: 'bass', beat: b + 0, dur: 0.7, midi: r1 });
      events.push({ inst: 'bass', beat: b + 1.5, dur: 0.5, midi: r2 });
      events.push({ inst: 'bass', beat: b + 2.0, dur: 0.7, midi: r2 });
      events.push({ inst: 'bass', beat: b + 3.5, dur: 0.5, midi: r1 });
    } else {
      events.push({ inst: 'bass', beat: b + 0, dur: 0.85, midi: r1 });
      events.push({ inst: 'bass', beat: b + 2.5, dur: 0.85, midi: r2 });
    }

    if (mode !== 'breakdown') {
      events.push(
        { inst: 'shaker', beat: b + 0 },
        { inst: 'shaker', beat: b + 1 },
        { inst: 'shaker', beat: b + 2 },
        { inst: 'shaker', beat: b + 3 }
      );
      if (barIndex % 2 === 0) events.push({ inst: 'woodblock', beat: b + 1.5, freq: 480 });
      if (grooveStyle === 'samba' && barIndex % 2 === 1) {
        events.push({ inst: 'woodblock', beat: b + 3.5, freq: 540 });
      }
    } else {
      events.push({ inst: 'shaker', beat: b + 1 }, { inst: 'shaker', beat: b + 3 });
      events.push({ inst: 'woodblock', beat: b + 2.5, freq: 490 });
    }

    if (mode !== 'breakdown') {
      if (grooveStyle === 'walking') {
        events.push(...chord(compInst, b + 0, 0.75, notes, 0.22));
        events.push(...chord(compInst, b + 2.5, 0.6, notes, 0.21));
      } else if (grooveStyle === 'samba') {
        events.push(...chord(compInst, b + 0, 0.35, notes, 0.25));
        events.push(...chord(compInst, b + 1.0, 0.35, notes, 0.24));
        events.push(...chord(compInst, b + 1.75, 0.35, notes, 0.24));
        events.push(...chord(compInst, b + 2.5, 0.35, notes, 0.25));
        events.push(...chord(compInst, b + 3.25, 0.35, notes, 0.23));
      } else {
        events.push(...chord(compInst, b + 0, 0.45, notes, 0.25));
        events.push(...chord(compInst, b + 1.5, 0.45, notes, 0.24));
        events.push(...chord(compInst, b + 2.5, 0.45, notes, 0.25));
        if (barIndex % 2 === 0) events.push(...chord(compInst, b + 3.5, 0.4, notes, 0.22));
      }

      if (mode === 'rhythm-breather' && barIndex % 2 === 1) {
        const topNote = notes[notes.length - 1];
        events.push({
          inst: accentInst,
          beat: b + 2.0,
          dur: 0.4,
          midi: Math.min(74, topNote + 5),
          gain: 0.18,
        });
        events.push({
          inst: accentInst,
          beat: b + 3.0,
          dur: 0.5,
          midi: Math.min(72, topNote + 3),
          gain: 0.18,
        });
      }
    } else if (barIndex % 2 === 0) {
      events.push({ inst: accentInst, beat: b + 3.5, dur: 0.4, midi: notes[1], gain: 0.16 });
    }
  }

  function addMelody8Bars(
    startBar: number,
    phrases: MelodyNoteDef[],
    inst: InstrumentType,
    counterInst: InstrumentType | null
  ): void {
    phrases.forEach((n) => {
      events.push({
        inst: n.inst || inst,
        beat: startBar * 4 + n.beat,
        dur: n.dur,
        midi: n.midi,
        gain: n.gain,
      });
    });
    if (counterInst) {
      const bFill1 = (startBar + 3) * 4;
      const bFill2 = (startBar + 7) * 4;
      const rootMidi = progA[3].voicing[2];
      events.push({
        inst: counterInst,
        beat: bFill1 + 3.0,
        dur: 0.4,
        midi: Math.min(72, rootMidi + 2),
        gain: 0.17,
      });
      events.push({
        inst: counterInst,
        beat: bFill1 + 3.5,
        dur: 0.4,
        midi: Math.min(74, rootMidi + 4),
        gain: 0.17,
      });
      events.push({
        inst: counterInst,
        beat: bFill2 + 3.0,
        dur: 0.8,
        midi: progA[7].voicing[2],
        gain: 0.18,
      });
    }
  }

  for (let i = 0; i < 4; i++) addRhythmBar(i, progA[i % progA.length], 'intro');
  for (let i = 0; i < 8; i++) addRhythmBar(4 + i, progA[i], 'main');
  addMelody8Bars(4, melA1, lead1, null);
  for (let i = 0; i < 8; i++) addRhythmBar(12 + i, progA[i], 'main');
  addMelody8Bars(12, melA2, lead1, accentInst);
  for (let i = 0; i < 8; i++) addRhythmBar(20 + i, progA[i], 'rhythm-breather');
  for (let i = 0; i < 8; i++) addRhythmBar(28 + i, progB[i], 'bridge');
  addMelody8Bars(28, melB1, lead2, null);
  for (let i = 0; i < 8; i++) addRhythmBar(36 + i, progB[i], 'bridge');
  addMelody8Bars(36, melB2, lead2, lead1);
  for (let i = 0; i < 4; i++) addRhythmBar(44 + i, progA[i], 'breakdown');
  for (let i = 0; i < 8; i++) addRhythmBar(48 + i, progA[i], 'main');
  addMelody8Bars(48, melA2, lead1, lead2);

  return events.sort((a, b) => a.beat - b.beat);
}

/**
 * Builds a 56-bar (168-beat in 3/4) waltz arrangement for Catnip Waltz.
 */
function buildExtendedWaltzArrangement(): SoundEvent[] {
  const events: SoundEvent[] = [];
  const progA = [
    { bass: 43, voicing: [55, 59, 62] }, // G
    { bass: 47, voicing: [54, 59, 62] }, // Bm
    { bass: 48, voicing: [55, 60, 64] }, // C
    { bass: 50, voicing: [57, 60, 62] }, // D7
    { bass: 52, voicing: [55, 59, 64] }, // Em
    { bass: 45, voicing: [57, 61, 64] }, // A7
    { bass: 45, voicing: [57, 60, 64] }, // Am7
    { bass: 50, voicing: [57, 60, 62] }, // D7
  ];
  const progB = [
    { bass: 48, voicing: [55, 60, 64] }, // C
    { bass: 50, voicing: [57, 60, 62] }, // D7
    { bass: 47, voicing: [54, 59, 62] }, // Bm
    { bass: 52, voicing: [55, 59, 64] }, // Em
    { bass: 45, voicing: [57, 60, 64] }, // Am7
    { bass: 50, voicing: [57, 60, 62] }, // D7
    { bass: 43, voicing: [55, 59, 62] }, // G
    { bass: 50, voicing: [57, 60, 62] }, // D7
  ];

  function addWaltzBar(
    barIndex: number,
    cDef: { bass: number; voicing: number[] },
    mode: 'intro' | 'main' | 'rhythm-breather' | 'bridge' | 'breakdown'
  ): void {
    const b = barIndex * 3;
    events.push({ inst: 'bass', beat: b + 0, dur: 0.9, midi: cDef.bass });
    if (mode !== 'breakdown') {
      events.push(...chord('guitar', b + 1, 0.4, cDef.voicing, 0.24));
      events.push(...chord('guitar', b + 2, 0.4, cDef.voicing, 0.22));
      if (mode === 'rhythm-breather' && barIndex % 2 === 0) {
        events.push({
          inst: 'kalimba',
          beat: b + 2,
          dur: 0.6,
          midi: Math.min(72, cDef.voicing[2] + 5),
          gain: 0.17,
        });
      }
    } else {
      events.push({ inst: 'woodblock', beat: b + 1, freq: 490 });
      if (barIndex % 2 === 1) {
        events.push({ inst: 'kalimba', beat: b + 2, dur: 0.5, midi: cDef.voicing[1], gain: 0.15 });
      }
    }
  }

  const melA1: MelodyNoteDef[] = [
    { beat: 0, dur: 1.8, midi: 59 },
    { beat: 2, dur: 0.9, midi: 62 },
    { beat: 3, dur: 1.8, midi: 64 },
    { beat: 5, dur: 0.9, midi: 62 },
    { beat: 6, dur: 0.9, midi: 60 },
    { beat: 7, dur: 0.9, midi: 62 },
    { beat: 8, dur: 0.9, midi: 64 },
    { beat: 9, dur: 2.5, midi: 66 },
    { beat: 12, dur: 1.8, midi: 67 },
    { beat: 14, dur: 0.9, midi: 64 },
    { beat: 15, dur: 1.8, midi: 62 },
    { beat: 17, dur: 0.9, midi: 59 },
    { beat: 18, dur: 0.9, midi: 57 },
    { beat: 19, dur: 0.9, midi: 59 },
    { beat: 20, dur: 0.9, midi: 60 },
    { beat: 21, dur: 1.8, midi: 62 },
    { beat: 23, dur: 0.9, midi: 59 },
  ];
  const melA2: MelodyNoteDef[] = [
    { beat: 0, dur: 1.8, midi: 62 },
    { beat: 2, dur: 0.9, midi: 67 },
    { beat: 3, dur: 1.8, midi: 66 },
    { beat: 5, dur: 0.9, midi: 62 },
    { beat: 6, dur: 0.9, midi: 64 },
    { beat: 7, dur: 0.9, midi: 62 },
    { beat: 8, dur: 0.9, midi: 60 },
    { beat: 9, dur: 2.5, midi: 59 },
    { beat: 12, dur: 0.9, midi: 64 },
    { beat: 13, dur: 0.9, midi: 66 },
    { beat: 14, dur: 0.9, midi: 67 },
    { beat: 15, dur: 1.8, midi: 69 },
    { beat: 17, dur: 0.9, midi: 64 },
    { beat: 18, dur: 0.9, midi: 62 },
    { beat: 19, dur: 0.9, midi: 60 },
    { beat: 20, dur: 0.9, midi: 59 },
    { beat: 21, dur: 1.8, midi: 57 },
    { beat: 23, dur: 0.9, midi: 55 },
  ];
  const melB: MelodyNoteDef[] = [
    { beat: 0, dur: 1.5, midi: 64 },
    { beat: 2, dur: 0.9, midi: 67 },
    { beat: 3, dur: 1.5, midi: 66 },
    { beat: 5, dur: 0.9, midi: 69 },
    { beat: 6, dur: 1.5, midi: 66 },
    { beat: 8, dur: 0.9, midi: 62 },
    { beat: 9, dur: 2.4, midi: 64 },
    { beat: 12, dur: 0.9, midi: 60 },
    { beat: 13, dur: 0.9, midi: 62 },
    { beat: 14, dur: 0.9, midi: 64 },
    { beat: 15, dur: 1.5, midi: 62 },
    { beat: 17, dur: 0.9, midi: 66 },
    { beat: 18, dur: 2.5, midi: 67 },
    { beat: 21, dur: 1.8, midi: 66 },
    { beat: 23, dur: 0.9, midi: 62 },
  ];

  for (let i = 0; i < 4; i++) addWaltzBar(i, progA[i], 'intro');
  for (let i = 0; i < 8; i++) addWaltzBar(4 + i, progA[i], 'main');
  melA1.forEach((n) =>
    events.push({ inst: 'accordion', beat: 12 + n.beat, dur: n.dur, midi: n.midi })
  );
  for (let i = 0; i < 8; i++) addWaltzBar(12 + i, progA[i], 'main');
  melA2.forEach((n) =>
    events.push({ inst: 'accordion', beat: 36 + n.beat, dur: n.dur, midi: n.midi })
  );
  for (let i = 0; i < 8; i++) addWaltzBar(20 + i, progA[i], 'rhythm-breather');
  for (let i = 0; i < 8; i++) addWaltzBar(28 + i, progB[i], 'bridge');
  melB.forEach((n) =>
    events.push({ inst: 'kalimba', beat: 84 + n.beat, dur: n.dur, midi: Math.min(74, n.midi + 5) })
  );
  for (let i = 0; i < 8; i++) addWaltzBar(36 + i, progB[i], 'bridge');
  melB.forEach((n) =>
    events.push({ inst: 'marimba', beat: 108 + n.beat, dur: n.dur, midi: n.midi })
  );
  for (let i = 0; i < 4; i++) addWaltzBar(44 + i, progA[i], 'breakdown');
  for (let i = 0; i < 8; i++) addWaltzBar(48 + i, progA[i], 'main');
  melA2.forEach((n) => {
    events.push({ inst: 'accordion', beat: 144 + n.beat, dur: n.dur, midi: n.midi });
    if (n.beat % 3 === 0) {
      events.push({
        inst: 'kalimba',
        beat: 144 + n.beat,
        dur: 0.8,
        midi: Math.min(74, n.midi + 7),
        gain: 0.14,
      });
    }
  });

  return events.sort((a, b) => a.beat - b.beat);
}

const MARIMBA_TRACK: SoundTrackDef = {
  id: 'marimba',
  bpm: 126,
  meter: '4/4',
  totalBeats: 224,
  events: buildExtended44Arrangement({
    grooveStyle: 'mambo',
    compInst: 'guitar',
    lead1: 'marimba',
    lead2: 'rhodes',
    accentInst: 'kalimba',
    progA: [
      { bass: [41, 48], voicing: [53, 57, 60, 64] },
      { bass: [50, 45], voicing: [53, 57, 60, 62] },
      { bass: [43, 50], voicing: [55, 58, 62, 65] },
      { bass: [48, 43], voicing: [55, 58, 60, 64] },
      { bass: [41, 48], voicing: [53, 57, 60, 64] },
      { bass: [45, 50], voicing: [55, 57, 61, 64] },
      { bass: [43, 50], voicing: [55, 58, 62, 65] },
      { bass: [48, 41], voicing: [55, 58, 60, 64] },
    ],
    progB: [
      { bass: [46, 53], voicing: [58, 62, 65, 69] },
      { bass: [48, 55], voicing: [55, 60, 64, 67] },
      { bass: [45, 52], voicing: [57, 60, 64, 67] },
      { bass: [50, 45], voicing: [53, 57, 60, 62] },
      { bass: [43, 50], voicing: [55, 58, 62, 65] },
      { bass: [45, 52], voicing: [57, 60, 64, 67] },
      { bass: [46, 48], voicing: [55, 58, 62, 65] },
      { bass: [48, 43], voicing: [55, 58, 60, 64] },
    ],
    melA1: [
      { beat: 0, dur: 0.45, midi: 65 },
      { beat: 0.5, dur: 0.45, midi: 69 },
      { beat: 1.0, dur: 0.7, midi: 72 },
      { beat: 2.0, dur: 0.45, midi: 69 },
      { beat: 2.5, dur: 0.7, midi: 67 },
      { beat: 4.0, dur: 0.7, midi: 62 },
      { beat: 5.0, dur: 0.45, midi: 65 },
      { beat: 5.5, dur: 0.7, midi: 69 },
      { beat: 6.5, dur: 1.0, midi: 67 },
      { beat: 8.0, dur: 0.45, midi: 67 },
      { beat: 8.5, dur: 0.45, midi: 70 },
      { beat: 9.0, dur: 0.7, midi: 74 },
      { beat: 10.0, dur: 0.45, midi: 72 },
      { beat: 10.5, dur: 0.7, midi: 70 },
      { beat: 12.0, dur: 0.7, midi: 69 },
      { beat: 13.0, dur: 0.7, midi: 67 },
      { beat: 14.0, dur: 1.2, midi: 64 },
      { beat: 16.0, dur: 0.45, midi: 65 },
      { beat: 16.5, dur: 0.45, midi: 67 },
      { beat: 17.0, dur: 0.7, midi: 69 },
      { beat: 18.0, dur: 0.7, midi: 72 },
      { beat: 19.0, dur: 0.7, midi: 74 },
      { beat: 20.0, dur: 0.7, midi: 72 },
      { beat: 21.0, dur: 0.7, midi: 69 },
      { beat: 22.0, dur: 1.2, midi: 65 },
      { beat: 24.0, dur: 0.45, midi: 67 },
      { beat: 24.5, dur: 0.45, midi: 70 },
      { beat: 25.0, dur: 0.7, midi: 69 },
      { beat: 26.0, dur: 0.7, midi: 67 },
      { beat: 27.0, dur: 0.7, midi: 64 },
      { beat: 28.0, dur: 1.5, midi: 65 },
    ],
    melA2: [
      { beat: 0, dur: 0.45, midi: 69 },
      { beat: 0.5, dur: 0.45, midi: 72 },
      { beat: 1.0, dur: 0.7, midi: 74 },
      { beat: 2.0, dur: 0.45, midi: 72 },
      { beat: 2.5, dur: 0.7, midi: 69 },
      { beat: 4.0, dur: 0.7, midi: 65 },
      { beat: 5.0, dur: 0.45, midi: 69 },
      { beat: 5.5, dur: 0.7, midi: 72 },
      { beat: 6.5, dur: 1.0, midi: 69 },
      { beat: 8.0, dur: 0.45, midi: 70 },
      { beat: 8.5, dur: 0.45, midi: 67 },
      { beat: 9.0, dur: 0.7, midi: 62 },
      { beat: 10.0, dur: 0.45, midi: 65 },
      { beat: 10.5, dur: 0.7, midi: 67 },
      { beat: 12.0, dur: 0.7, midi: 64 },
      { beat: 13.0, dur: 0.7, midi: 67 },
      { beat: 14.0, dur: 1.2, midi: 69 },
      { beat: 16.0, dur: 0.45, midi: 72 },
      { beat: 16.5, dur: 0.45, midi: 69 },
      { beat: 17.0, dur: 0.7, midi: 65 },
      { beat: 18.0, dur: 0.7, midi: 69 },
      { beat: 19.0, dur: 0.7, midi: 72 },
      { beat: 20.0, dur: 0.7, midi: 73 },
      { beat: 21.0, dur: 0.7, midi: 69 },
      { beat: 22.0, dur: 1.2, midi: 62 },
      { beat: 24.0, dur: 0.45, midi: 67 },
      { beat: 24.5, dur: 0.45, midi: 69 },
      { beat: 25.0, dur: 0.7, midi: 70 },
      { beat: 26.0, dur: 0.7, midi: 67 },
      { beat: 27.0, dur: 0.7, midi: 69 },
      { beat: 28.0, dur: 0.7, midi: 65 },
      { beat: 29.0, dur: 0.7, midi: 69 },
      { beat: 30.0, dur: 1.2, midi: 65 },
    ],
    melB1: [
      { beat: 0, dur: 1.2, midi: 62 },
      { beat: 1.5, dur: 0.8, midi: 65 },
      { beat: 2.5, dur: 1.2, midi: 69 },
      { beat: 4.0, dur: 1.2, midi: 67 },
      { beat: 5.5, dur: 0.8, midi: 64 },
      { beat: 6.5, dur: 1.2, midi: 60 },
      { beat: 8.0, dur: 1.2, midi: 64 },
      { beat: 9.5, dur: 0.8, midi: 67 },
      { beat: 10.5, dur: 1.2, midi: 72 },
      { beat: 12.0, dur: 1.5, midi: 69 },
      { beat: 14.0, dur: 1.5, midi: 65 },
      { beat: 16.0, dur: 0.8, midi: 67 },
      { beat: 17.0, dur: 0.8, midi: 70 },
      { beat: 18.0, dur: 1.5, midi: 69 },
      { beat: 20.0, dur: 0.8, midi: 64 },
      { beat: 21.0, dur: 0.8, midi: 67 },
      { beat: 22.0, dur: 1.5, midi: 69 },
      { beat: 24.0, dur: 1.0, midi: 70 },
      { beat: 25.5, dur: 1.0, midi: 67 },
      { beat: 27.0, dur: 0.8, midi: 65 },
      { beat: 28.0, dur: 2.0, midi: 64 },
    ],
    melB2: [
      { beat: 0, dur: 0.8, midi: 70 },
      { beat: 1.0, dur: 0.8, midi: 69 },
      { beat: 2.0, dur: 1.5, midi: 65 },
      { beat: 4.0, dur: 0.8, midi: 67 },
      { beat: 5.0, dur: 0.8, midi: 64 },
      { beat: 6.0, dur: 1.5, midi: 67 },
      { beat: 8.0, dur: 0.8, midi: 69 },
      { beat: 9.0, dur: 0.8, midi: 72 },
      { beat: 10.0, dur: 1.5, midi: 67 },
      { beat: 12.0, dur: 2.2, midi: 65 },
      { beat: 16.0, dur: 0.7, midi: 62 },
      { beat: 17.0, dur: 0.7, midi: 65 },
      { beat: 18.0, dur: 1.2, midi: 67 },
      { beat: 20.0, dur: 0.7, midi: 64 },
      { beat: 21.0, dur: 0.7, midi: 67 },
      { beat: 22.0, dur: 1.2, midi: 69 },
      { beat: 24.0, dur: 0.8, midi: 70 },
      { beat: 25.0, dur: 0.8, midi: 69 },
      { beat: 26.0, dur: 1.2, midi: 67 },
      { beat: 28.0, dur: 2.2, midi: 64 },
    ],
  }),
};

const VELVET_TRACK: SoundTrackDef = {
  id: 'velvet',
  bpm: 120,
  meter: '4/4',
  totalBeats: 224,
  events: buildExtended44Arrangement({
    grooveStyle: 'walking',
    compInst: 'rhodes',
    lead1: 'rhodes',
    lead2: 'marimba',
    accentInst: 'kalimba',
    progA: [
      { bass: [46, 53], walk: [46, 50, 53, 50], voicing: [58, 62, 65, 69] },
      { bass: [43, 50], walk: [43, 46, 50, 48], voicing: [55, 58, 62, 65] },
      { bass: [48, 55], walk: [48, 51, 55, 51], voicing: [55, 60, 63, 67] },
      { bass: [41, 48], walk: [41, 45, 48, 45], voicing: [53, 57, 63, 65] },
      { bass: [50, 45], walk: [50, 48, 45, 43], voicing: [53, 57, 60, 65] },
      { bass: [43, 47], walk: [43, 47, 50, 49], voicing: [55, 59, 62, 65] },
      { bass: [48, 51], walk: [48, 51, 53, 55], voicing: [55, 60, 63, 67] },
      { bass: [41, 46], walk: [41, 45, 48, 45], voicing: [53, 57, 60, 65] },
    ],
    progB: [
      { bass: [51, 46], walk: [51, 55, 58, 55], voicing: [55, 58, 63, 67] },
      { bass: [51, 48], walk: [51, 50, 48, 46], voicing: [54, 57, 60, 63] },
      { bass: [50, 45], walk: [50, 53, 57, 53], voicing: [53, 57, 60, 65] },
      { bass: [43, 50], walk: [43, 47, 50, 47], voicing: [55, 59, 62, 65] },
      { bass: [48, 55], walk: [48, 51, 55, 51], voicing: [55, 60, 63, 67] },
      { bass: [41, 48], walk: [41, 45, 48, 50], voicing: [53, 57, 60, 65] },
      { bass: [46, 53], walk: [46, 50, 53, 55], voicing: [58, 62, 65, 69] },
      { bass: [41, 48], walk: [48, 51, 41, 45], voicing: [53, 57, 60, 65] },
    ],
    melA1: [
      { beat: 0.5, dur: 0.6, midi: 65 },
      { beat: 1.5, dur: 0.6, midi: 67 },
      { beat: 2.5, dur: 1.0, midi: 70 },
      { beat: 4.5, dur: 0.6, midi: 69 },
      { beat: 5.5, dur: 0.6, midi: 67 },
      { beat: 6.5, dur: 1.0, midi: 62 },
      { beat: 8.0, dur: 0.6, midi: 63 },
      { beat: 9.0, dur: 0.6, midi: 67 },
      { beat: 10.0, dur: 0.8, midi: 72 },
      { beat: 11.0, dur: 0.6, midi: 70 },
      { beat: 12.0, dur: 1.2, midi: 69 },
      { beat: 14.0, dur: 1.2, midi: 65 },
      { beat: 16.0, dur: 0.6, midi: 70 },
      { beat: 17.0, dur: 0.6, midi: 69 },
      { beat: 18.0, dur: 1.2, midi: 65 },
      { beat: 20.0, dur: 0.8, midi: 67 },
      { beat: 21.0, dur: 0.8, midi: 65 },
      { beat: 22.0, dur: 1.2, midi: 62 },
      { beat: 24.0, dur: 0.6, midi: 63 },
      { beat: 25.0, dur: 0.6, midi: 65 },
      { beat: 26.0, dur: 0.8, midi: 67 },
      { beat: 27.0, dur: 0.6, midi: 70 },
      { beat: 28.0, dur: 2.0, midi: 69 },
    ],
    melA2: [
      { beat: 0.5, dur: 0.6, midi: 70 },
      { beat: 1.5, dur: 0.6, midi: 72 },
      { beat: 2.5, dur: 1.0, midi: 74 },
      { beat: 4.5, dur: 0.6, midi: 72 },
      { beat: 5.5, dur: 0.6, midi: 70 },
      { beat: 6.5, dur: 1.0, midi: 67 },
      { beat: 8.0, dur: 0.6, midi: 67 },
      { beat: 9.0, dur: 0.6, midi: 70 },
      { beat: 10.0, dur: 0.8, midi: 72 },
      { beat: 11.0, dur: 0.6, midi: 67 },
      { beat: 12.0, dur: 1.5, midi: 69 },
      { beat: 14.0, dur: 1.2, midi: 65 },
      { beat: 16.0, dur: 0.6, midi: 69 },
      { beat: 17.0, dur: 0.6, midi: 72 },
      { beat: 18.0, dur: 1.2, midi: 74 },
      { beat: 20.0, dur: 0.8, midi: 71 },
      { beat: 21.0, dur: 0.8, midi: 67 },
      { beat: 22.0, dur: 1.2, midi: 65 },
      { beat: 24.0, dur: 0.6, midi: 63 },
      { beat: 25.0, dur: 0.6, midi: 67 },
      { beat: 26.0, dur: 0.8, midi: 69 },
      { beat: 27.0, dur: 0.6, midi: 65 },
      { beat: 28.0, dur: 2.2, midi: 70 },
    ],
    melB1: [
      { beat: 0, dur: 0.8, midi: 67 },
      { beat: 1.0, dur: 0.8, midi: 70 },
      { beat: 2.0, dur: 1.2, midi: 74 },
      { beat: 4.0, dur: 0.8, midi: 72 },
      { beat: 5.0, dur: 0.8, midi: 70 },
      { beat: 6.0, dur: 1.2, midi: 66 },
      { beat: 8.0, dur: 0.8, midi: 65 },
      { beat: 9.0, dur: 0.8, midi: 69 },
      { beat: 10.0, dur: 1.2, midi: 72 },
      { beat: 12.0, dur: 1.5, midi: 71 },
      { beat: 14.0, dur: 1.2, midi: 67 },
      { beat: 16.0, dur: 0.7, midi: 63 },
      { beat: 17.0, dur: 0.7, midi: 67 },
      { beat: 18.0, dur: 1.2, midi: 70 },
      { beat: 20.0, dur: 0.7, midi: 69 },
      { beat: 21.0, dur: 0.7, midi: 65 },
      { beat: 22.0, dur: 1.2, midi: 69 },
      { beat: 24.0, dur: 2.0, midi: 70 },
      { beat: 28.0, dur: 1.5, midi: 69 },
    ],
    melB2: [
      { beat: 0, dur: 0.6, midi: 70 },
      { beat: 1.0, dur: 0.6, midi: 67 },
      { beat: 2.0, dur: 1.2, midi: 63 },
      { beat: 4.0, dur: 0.6, midi: 66 },
      { beat: 5.0, dur: 0.6, midi: 69 },
      { beat: 6.0, dur: 1.2, midi: 72 },
      { beat: 8.0, dur: 0.6, midi: 70 },
      { beat: 9.0, dur: 0.6, midi: 69 },
      { beat: 10.0, dur: 1.2, midi: 65 },
      { beat: 12.0, dur: 2.0, midi: 67 },
      { beat: 16.0, dur: 0.6, midi: 63 },
      { beat: 17.0, dur: 0.6, midi: 65 },
      { beat: 18.0, dur: 0.6, midi: 67 },
      { beat: 19.0, dur: 0.6, midi: 70 },
      { beat: 20.0, dur: 0.8, midi: 69 },
      { beat: 21.0, dur: 0.8, midi: 72 },
      { beat: 22.0, dur: 1.2, midi: 69 },
      { beat: 24.0, dur: 1.5, midi: 70 },
      { beat: 26.0, dur: 1.2, midi: 65 },
      { beat: 28.0, dur: 2.0, midi: 70 },
    ],
  }),
};

const SUNBEAM_TRACK: SoundTrackDef = {
  id: 'sunbeam',
  bpm: 124,
  meter: '4/4',
  totalBeats: 224,
  events: buildExtended44Arrangement({
    grooveStyle: 'bossa',
    compInst: 'guitar',
    lead1: 'kalimba',
    lead2: 'marimba',
    accentInst: 'flute',
    progA: [
      { bass: [43, 50], voicing: [55, 59, 62, 67] },
      { bass: [48, 43], voicing: [55, 60, 64, 67] },
      { bass: [45, 52], voicing: [57, 60, 64, 67] },
      { bass: [50, 45], voicing: [54, 57, 60, 62] },
      { bass: [40, 47], voicing: [55, 59, 62, 64] },
      { bass: [47, 48], voicing: [54, 59, 62, 66] },
      { bass: [45, 50], voicing: [57, 60, 64, 67] },
      { bass: [50, 43], voicing: [54, 57, 60, 62] },
    ],
    progB: [
      { bass: [48, 55], voicing: [55, 60, 64, 67] },
      { bass: [50, 45], voicing: [54, 57, 60, 66] },
      { bass: [47, 54], voicing: [54, 59, 62, 66] },
      { bass: [40, 47], voicing: [55, 59, 62, 64] },
      { bass: [48, 55], voicing: [55, 60, 64, 67] },
      { bass: [45, 52], voicing: [55, 61, 64, 67] },
      { bass: [45, 50], voicing: [57, 60, 64, 67] },
      { bass: [50, 45], voicing: [54, 57, 60, 62] },
    ],
    melA1: [
      { beat: 0, dur: 0.6, midi: 67 },
      { beat: 1.0, dur: 0.5, midi: 69 },
      { beat: 1.5, dur: 0.8, midi: 71 },
      { beat: 2.5, dur: 0.6, midi: 74 },
      { beat: 3.5, dur: 0.5, midi: 71 },
      { beat: 4.0, dur: 0.8, midi: 72 },
      { beat: 5.5, dur: 0.6, midi: 71 },
      { beat: 6.5, dur: 1.0, midi: 67 },
      { beat: 8.0, dur: 0.6, midi: 69 },
      { beat: 9.0, dur: 0.5, midi: 71 },
      { beat: 9.5, dur: 0.8, midi: 72 },
      { beat: 10.5, dur: 0.8, midi: 69 },
      { beat: 12.0, dur: 1.0, midi: 66 },
      { beat: 13.5, dur: 0.6, midi: 67 },
      { beat: 14.5, dur: 1.2, midi: 69 },
      { beat: 16.0, dur: 0.6, midi: 67 },
      { beat: 17.0, dur: 0.5, midi: 71 },
      { beat: 17.5, dur: 0.8, midi: 74 },
      { beat: 18.5, dur: 1.0, midi: 71 },
      { beat: 20.0, dur: 0.8, midi: 69 },
      { beat: 21.0, dur: 0.8, midi: 67 },
      { beat: 22.0, dur: 1.2, midi: 64 },
      { beat: 24.0, dur: 0.6, midi: 64 },
      { beat: 25.0, dur: 0.6, midi: 67 },
      { beat: 26.0, dur: 0.8, midi: 69 },
      { beat: 27.0, dur: 0.6, midi: 66 },
      { beat: 28.0, dur: 1.8, midi: 67 },
    ],
    melA2: [
      { beat: 0, dur: 0.6, midi: 71 },
      { beat: 1.0, dur: 0.5, midi: 74 },
      { beat: 1.5, dur: 0.8, midi: 72 },
      { beat: 2.5, dur: 0.6, midi: 71 },
      { beat: 3.5, dur: 0.5, midi: 69 },
      { beat: 4.0, dur: 0.8, midi: 67 },
      { beat: 5.5, dur: 0.6, midi: 64 },
      { beat: 6.5, dur: 1.0, midi: 67 },
      { beat: 8.0, dur: 0.6, midi: 69 },
      { beat: 9.0, dur: 0.5, midi: 72 },
      { beat: 9.5, dur: 0.8, midi: 71 },
      { beat: 10.5, dur: 0.8, midi: 67 },
      { beat: 12.0, dur: 1.2, midi: 69 },
      { beat: 14.0, dur: 1.2, midi: 66 },
      { beat: 16.0, dur: 0.6, midi: 64 },
      { beat: 17.0, dur: 0.5, midi: 67 },
      { beat: 17.5, dur: 0.8, midi: 71 },
      { beat: 18.5, dur: 1.0, midi: 69 },
      { beat: 20.0, dur: 0.8, midi: 66 },
      { beat: 21.0, dur: 0.8, midi: 69 },
      { beat: 22.0, dur: 1.2, midi: 71 },
      { beat: 24.0, dur: 0.6, midi: 72 },
      { beat: 25.0, dur: 0.6, midi: 71 },
      { beat: 26.0, dur: 0.8, midi: 69 },
      { beat: 27.0, dur: 0.6, midi: 66 },
      { beat: 28.0, dur: 2.0, midi: 67 },
    ],
    melB1: [
      { beat: 0, dur: 0.8, midi: 64 },
      { beat: 1.0, dur: 0.8, midi: 67 },
      { beat: 2.0, dur: 1.2, midi: 71 },
      { beat: 4.0, dur: 0.8, midi: 69 },
      { beat: 5.0, dur: 0.8, midi: 66 },
      { beat: 6.0, dur: 1.2, midi: 62 },
      { beat: 8.0, dur: 0.8, midi: 66 },
      { beat: 9.0, dur: 0.8, midi: 69 },
      { beat: 10.0, dur: 1.2, midi: 71 },
      { beat: 12.0, dur: 1.5, midi: 67 },
      { beat: 14.0, dur: 1.2, midi: 64 },
      { beat: 16.0, dur: 0.8, midi: 64 },
      { beat: 17.0, dur: 0.8, midi: 67 },
      { beat: 18.0, dur: 1.2, midi: 72 },
      { beat: 20.0, dur: 0.8, midi: 73 },
      { beat: 21.0, dur: 0.8, midi: 69 },
      { beat: 22.0, dur: 1.2, midi: 67 },
      { beat: 24.0, dur: 0.8, midi: 69 },
      { beat: 25.0, dur: 0.8, midi: 67 },
      { beat: 26.0, dur: 1.2, midi: 64 },
      { beat: 28.0, dur: 2.0, midi: 66 },
    ],
    melB2: [
      { beat: 0, dur: 0.7, midi: 72 },
      { beat: 1.0, dur: 0.7, midi: 71 },
      { beat: 2.0, dur: 1.2, midi: 67 },
      { beat: 4.0, dur: 0.7, midi: 69 },
      { beat: 5.0, dur: 0.7, midi: 66 },
      { beat: 6.0, dur: 1.2, midi: 69 },
      { beat: 8.0, dur: 0.7, midi: 71 },
      { beat: 9.0, dur: 0.7, midi: 69 },
      { beat: 10.0, dur: 1.2, midi: 66 },
      { beat: 12.0, dur: 2.0, midi: 64 },
      { beat: 16.0, dur: 0.7, midi: 67 },
      { beat: 17.0, dur: 0.7, midi: 71 },
      { beat: 18.0, dur: 1.2, midi: 72 },
      { beat: 20.0, dur: 0.7, midi: 69 },
      { beat: 21.0, dur: 0.7, midi: 67 },
      { beat: 22.0, dur: 1.2, midi: 64 },
      { beat: 24.0, dur: 0.8, midi: 69 },
      { beat: 25.0, dur: 0.8, midi: 66 },
      { beat: 26.0, dur: 1.2, midi: 62 },
      { beat: 28.0, dur: 2.0, midi: 67 },
    ],
  }),
};

const BOSSA_TRACK: SoundTrackDef = {
  id: 'bossa',
  bpm: 122,
  meter: '4/4',
  totalBeats: 224,
  events: buildExtended44Arrangement({
    grooveStyle: 'bossa',
    compInst: 'guitar',
    lead1: 'flute',
    lead2: 'marimba',
    accentInst: 'rhodes',
    progA: [
      { bass: [48, 43], voicing: [55, 60, 64, 67] },
      { bass: [50, 45], voicing: [54, 60, 64, 66] },
      { bass: [50, 45], voicing: [53, 57, 60, 65] },
      { bass: [43, 50], voicing: [53, 59, 64, 65] },
      { bass: [40, 47], voicing: [55, 59, 62, 67] },
      { bass: [45, 40], voicing: [55, 58, 61, 64] },
      { bass: [50, 45], voicing: [53, 57, 60, 65] },
      { bass: [43, 50], voicing: [53, 59, 62, 65] },
    ],
    progB: [
      { bass: [41, 48], voicing: [53, 57, 60, 64] },
      { bass: [41, 48], voicing: [53, 56, 60, 63] },
      { bass: [40, 47], voicing: [55, 59, 62, 67] },
      { bass: [45, 52], voicing: [55, 61, 64, 67] },
      { bass: [50, 45], voicing: [53, 57, 60, 65] },
      { bass: [50, 45], voicing: [54, 60, 62, 66] },
      { bass: [50, 45], voicing: [53, 57, 60, 65] },
      { bass: [43, 50], voicing: [53, 59, 62, 65] },
    ],
    melA1: [
      { beat: 0, dur: 1.2, midi: 60 },
      { beat: 1.5, dur: 0.8, midi: 64 },
      { beat: 2.5, dur: 1.2, midi: 67 },
      { beat: 4.0, dur: 1.2, midi: 66 },
      { beat: 5.5, dur: 0.8, midi: 64 },
      { beat: 6.5, dur: 1.2, midi: 62 },
      { beat: 8.0, dur: 1.2, midi: 65 },
      { beat: 9.5, dur: 0.8, midi: 64 },
      { beat: 10.5, dur: 1.2, midi: 62 },
      { beat: 12.0, dur: 2.0, midi: 59 },
      { beat: 14.5, dur: 1.2, midi: 62 },
      { beat: 16.0, dur: 1.2, midi: 64 },
      { beat: 17.5, dur: 0.8, midi: 67 },
      { beat: 18.5, dur: 1.2, midi: 71 },
      { beat: 20.0, dur: 1.2, midi: 69 },
      { beat: 21.5, dur: 0.8, midi: 67 },
      { beat: 22.5, dur: 1.2, midi: 64 },
      { beat: 24.0, dur: 1.2, midi: 65 },
      { beat: 25.5, dur: 0.8, midi: 64 },
      { beat: 26.5, dur: 1.2, midi: 62 },
      { beat: 28.0, dur: 1.2, midi: 59 },
      { beat: 29.5, dur: 0.8, midi: 62 },
      { beat: 30.5, dur: 1.2, midi: 60 },
    ],
    melA2: [
      { beat: 0, dur: 1.2, midi: 64 },
      { beat: 1.5, dur: 0.8, midi: 67 },
      { beat: 2.5, dur: 1.2, midi: 71 },
      { beat: 4.0, dur: 1.2, midi: 69 },
      { beat: 5.5, dur: 0.8, midi: 66 },
      { beat: 6.5, dur: 1.2, midi: 62 },
      { beat: 8.0, dur: 1.2, midi: 65 },
      { beat: 9.5, dur: 0.8, midi: 69 },
      { beat: 10.5, dur: 1.2, midi: 67 },
      { beat: 12.0, dur: 2.0, midi: 64 },
      { beat: 14.5, dur: 1.2, midi: 59 },
      { beat: 16.0, dur: 1.2, midi: 67 },
      { beat: 17.5, dur: 0.8, midi: 64 },
      { beat: 18.5, dur: 1.2, midi: 59 },
      { beat: 20.0, dur: 1.2, midi: 61 },
      { beat: 21.5, dur: 0.8, midi: 64 },
      { beat: 22.5, dur: 1.2, midi: 69 },
      { beat: 24.0, dur: 1.2, midi: 65 },
      { beat: 25.5, dur: 0.8, midi: 62 },
      { beat: 26.5, dur: 1.2, midi: 60 },
      { beat: 28.0, dur: 1.2, midi: 62 },
      { beat: 29.5, dur: 0.8, midi: 59 },
      { beat: 30.5, dur: 1.2, midi: 60 },
    ],
    melB1: [
      { beat: 0, dur: 0.7, midi: 65 },
      { beat: 1.0, dur: 0.7, midi: 69 },
      { beat: 2.0, dur: 1.2, midi: 72 },
      { beat: 4.0, dur: 0.7, midi: 72 },
      { beat: 5.0, dur: 0.7, midi: 68 },
      { beat: 6.0, dur: 1.2, midi: 65 },
      { beat: 8.0, dur: 0.7, midi: 64 },
      { beat: 9.0, dur: 0.7, midi: 67 },
      { beat: 10.0, dur: 1.2, midi: 71 },
      { beat: 12.0, dur: 1.5, midi: 69 },
      { beat: 14.0, dur: 1.2, midi: 64 },
      { beat: 16.0, dur: 0.7, midi: 62 },
      { beat: 17.0, dur: 0.7, midi: 65 },
      { beat: 18.0, dur: 1.2, midi: 69 },
      { beat: 20.0, dur: 0.7, midi: 66 },
      { beat: 21.0, dur: 0.7, midi: 69 },
      { beat: 22.0, dur: 1.2, midi: 72 },
      { beat: 24.0, dur: 1.0, midi: 71 },
      { beat: 25.5, dur: 1.0, midi: 67 },
      { beat: 28.0, dur: 2.0, midi: 62 },
    ],
    melB2: [
      { beat: 0, dur: 0.7, midi: 69 },
      { beat: 1.0, dur: 0.7, midi: 65 },
      { beat: 2.0, dur: 1.2, midi: 60 },
      { beat: 4.0, dur: 0.7, midi: 63 },
      { beat: 5.0, dur: 0.7, midi: 65 },
      { beat: 6.0, dur: 1.2, midi: 68 },
      { beat: 8.0, dur: 0.7, midi: 67 },
      { beat: 9.0, dur: 0.7, midi: 64 },
      { beat: 10.0, dur: 1.2, midi: 59 },
      { beat: 12.0, dur: 2.0, midi: 61 },
      { beat: 16.0, dur: 0.7, midi: 65 },
      { beat: 17.0, dur: 0.7, midi: 69 },
      { beat: 18.0, dur: 1.2, midi: 72 },
      { beat: 20.0, dur: 0.7, midi: 71 },
      { beat: 21.0, dur: 0.7, midi: 69 },
      { beat: 22.0, dur: 1.2, midi: 66 },
      { beat: 24.0, dur: 0.8, midi: 67 },
      { beat: 25.0, dur: 0.8, midi: 65 },
      { beat: 26.0, dur: 1.2, midi: 62 },
      { beat: 28.0, dur: 2.0, midi: 60 },
    ],
  }),
};

const WALTZ_TRACK: SoundTrackDef = {
  id: 'waltz',
  bpm: 126,
  meter: '3/4',
  totalBeats: 168,
  events: buildExtendedWaltzArrangement(),
};

const SAMBA_TRACK: SoundTrackDef = {
  id: 'samba',
  bpm: 130,
  meter: '4/4',
  totalBeats: 224,
  events: buildExtended44Arrangement({
    grooveStyle: 'samba',
    compInst: 'guitar',
    lead1: 'marimba',
    lead2: 'flute',
    accentInst: 'kalimba',
    progA: [
      { bass: [50, 45], voicing: [54, 57, 62, 66] },
      { bass: [47, 54], voicing: [54, 59, 62, 66] },
      { bass: [40, 47], voicing: [55, 59, 64, 67] },
      { bass: [45, 40], voicing: [55, 61, 64, 69] },
      { bass: [50, 45], voicing: [54, 57, 62, 66] },
      { bass: [47, 54], voicing: [54, 59, 63, 66] },
      { bass: [40, 45], voicing: [55, 59, 64, 67] },
      { bass: [45, 50], voicing: [55, 61, 64, 69] },
    ],
    progB: [
      { bass: [43, 50], voicing: [55, 59, 62, 67] },
      { bass: [43, 50], voicing: [55, 58, 62, 65] },
      { bass: [50, 45], voicing: [54, 57, 62, 66] },
      { bass: [47, 54], voicing: [54, 59, 63, 66] },
      { bass: [40, 47], voicing: [55, 59, 64, 67] },
      { bass: [45, 52], voicing: [55, 61, 64, 69] },
      { bass: [50, 45], voicing: [54, 57, 62, 66] },
      { bass: [45, 50], voicing: [55, 61, 64, 69] },
    ],
    melA1: [
      { beat: 0, dur: 0.7, midi: 62 },
      { beat: 1.0, dur: 0.6, midi: 64 },
      { beat: 1.75, dur: 0.6, midi: 66 },
      { beat: 2.5, dur: 1.2, midi: 69 },
      { beat: 4.0, dur: 0.6, midi: 66 },
      { beat: 4.75, dur: 0.6, midi: 64 },
      { beat: 5.5, dur: 0.8, midi: 62 },
      { beat: 6.5, dur: 1.2, midi: 59 },
      { beat: 8.0, dur: 0.6, midi: 64 },
      { beat: 8.75, dur: 0.6, midi: 66 },
      { beat: 9.5, dur: 0.8, midi: 67 },
      { beat: 10.5, dur: 1.2, midi: 71 },
      { beat: 12.0, dur: 0.7, midi: 69 },
      { beat: 13.0, dur: 0.7, midi: 67 },
      { beat: 14.0, dur: 1.5, midi: 66 },
      { beat: 16.0, dur: 0.7, midi: 69 },
      { beat: 17.0, dur: 0.7, midi: 71 },
      { beat: 18.0, dur: 1.5, midi: 74 },
      { beat: 20.0, dur: 0.7, midi: 71 },
      { beat: 21.0, dur: 0.7, midi: 69 },
      { beat: 22.0, dur: 1.5, midi: 66 },
      { beat: 24.0, dur: 0.7, midi: 67 },
      { beat: 25.0, dur: 0.7, midi: 66 },
      { beat: 26.0, dur: 1.5, midi: 64 },
      { beat: 28.0, dur: 0.6, midi: 62 },
      { beat: 29.0, dur: 0.6, midi: 64 },
      { beat: 30.0, dur: 1.6, midi: 62 },
    ],
    melA2: [
      { beat: 0, dur: 0.7, midi: 66 },
      { beat: 1.0, dur: 0.6, midi: 69 },
      { beat: 1.75, dur: 0.6, midi: 71 },
      { beat: 2.5, dur: 1.2, midi: 74 },
      { beat: 4.0, dur: 0.6, midi: 71 },
      { beat: 4.75, dur: 0.6, midi: 69 },
      { beat: 5.5, dur: 0.8, midi: 66 },
      { beat: 6.5, dur: 1.2, midi: 62 },
      { beat: 8.0, dur: 0.6, midi: 67 },
      { beat: 8.75, dur: 0.6, midi: 69 },
      { beat: 9.5, dur: 0.8, midi: 71 },
      { beat: 10.5, dur: 1.2, midi: 67 },
      { beat: 12.0, dur: 0.7, midi: 69 },
      { beat: 13.0, dur: 0.7, midi: 64 },
      { beat: 14.0, dur: 1.5, midi: 66 },
      { beat: 16.0, dur: 0.7, midi: 66 },
      { beat: 17.0, dur: 0.7, midi: 69 },
      { beat: 18.0, dur: 1.5, midi: 71 },
      { beat: 20.0, dur: 0.7, midi: 71 },
      { beat: 21.0, dur: 0.7, midi: 66 },
      { beat: 22.0, dur: 1.5, midi: 63 },
      { beat: 24.0, dur: 0.7, midi: 64 },
      { beat: 25.0, dur: 0.7, midi: 67 },
      { beat: 26.0, dur: 1.5, midi: 69 },
      { beat: 28.0, dur: 0.6, midi: 66 },
      { beat: 29.0, dur: 0.6, midi: 64 },
      { beat: 30.0, dur: 1.6, midi: 62 },
    ],
    melB1: [
      { beat: 0, dur: 1.2, midi: 67 },
      { beat: 1.5, dur: 0.8, midi: 71 },
      { beat: 2.5, dur: 1.2, midi: 69 },
      { beat: 4.0, dur: 1.2, midi: 67 },
      { beat: 5.5, dur: 0.8, midi: 65 },
      { beat: 6.5, dur: 1.2, midi: 62 },
      { beat: 8.0, dur: 1.2, midi: 66 },
      { beat: 9.5, dur: 0.8, midi: 69 },
      { beat: 10.5, dur: 1.2, midi: 66 },
      { beat: 12.0, dur: 1.5, midi: 63 },
      { beat: 14.0, dur: 1.2, midi: 59 },
      { beat: 16.0, dur: 1.0, midi: 64 },
      { beat: 17.5, dur: 0.8, midi: 67 },
      { beat: 18.5, dur: 1.2, midi: 71 },
      { beat: 20.0, dur: 1.0, midi: 69 },
      { beat: 21.5, dur: 0.8, midi: 67 },
      { beat: 22.5, dur: 1.2, midi: 64 },
      { beat: 24.0, dur: 2.0, midi: 62 },
      { beat: 28.0, dur: 1.5, midi: 64 },
    ],
    melB2: [
      { beat: 0, dur: 1.0, midi: 71 },
      { beat: 1.5, dur: 0.8, midi: 69 },
      { beat: 2.5, dur: 1.2, midi: 67 },
      { beat: 4.0, dur: 1.0, midi: 70 },
      { beat: 5.5, dur: 0.8, midi: 67 },
      { beat: 6.5, dur: 1.2, midi: 64 },
      { beat: 8.0, dur: 1.0, midi: 66 },
      { beat: 9.5, dur: 0.8, midi: 69 },
      { beat: 10.5, dur: 1.2, midi: 74 },
      { beat: 12.0, dur: 2.0, midi: 71 },
      { beat: 16.0, dur: 1.0, midi: 67 },
      { beat: 17.5, dur: 0.8, midi: 66 },
      { beat: 18.5, dur: 1.2, midi: 64 },
      { beat: 20.0, dur: 1.0, midi: 69 },
      { beat: 21.5, dur: 0.8, midi: 67 },
      { beat: 22.5, dur: 1.2, midi: 64 },
      { beat: 24.0, dur: 1.5, midi: 66 },
      { beat: 26.0, dur: 1.2, midi: 62 },
      { beat: 28.0, dur: 2.0, midi: 62 },
    ],
  }),
};

const TRACK_MAP: Record<ConcreteTrackId, SoundTrackDef> = {
  marimba: MARIMBA_TRACK,
  velvet: VELVET_TRACK,
  sunbeam: SUNBEAM_TRACK,
  bossa: BOSSA_TRACK,
  waltz: WALTZ_TRACK,
  samba: SAMBA_TRACK,
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
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
  private currentTrackId: ConcreteTrackId = 'marimba';
  private isMusicPlaying: boolean = false;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();

        this.warmthFilter = this.ctx.createBiquadFilter();
        this.warmthFilter.type = 'lowshelf';
        this.warmthFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
        this.warmthFilter.gain.setValueAtTime(2.0, this.ctx.currentTime);

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.008, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.12, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.musicGainNode = this.ctx.createGain();
        this.sfxGainNode = this.ctx.createGain();

        this.updateGainLevels();

        this.musicGainNode.connect(this.warmthFilter);
        this.warmthFilter.connect(this.compressor);
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
      this.stopMusic();
      this.startMusic();
    }
  }

  public getActiveNodeCount(): number {
    return this.activeMusicNodes.length;
  }

  public getCurrentTrackId(): ConcreteTrackId {
    return this.musicTrackPreference === 'auto' ? this.currentTrackId : this.musicTrackPreference;
  }

  public getTrackDef(trackId: ConcreteTrackId): SoundTrackDef {
    return TRACK_MAP[trackId];
  }

  public getTrackEvents(trackId: MusicTrackOption): SoundEvent[] {
    if (trackId === 'auto') {
      return TRACK_MAP.marimba.events;
    }
    return TRACK_MAP[trackId]?.events || [];
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

  // --- WARM SYNTHESIZER VOICES ---

  // 1. Wooden Marimba (Round sine + fast-decaying rosewood mallet transient)
  public playMarimba(freq: number, time: number, dur: number, gainLevel: number = 0.25): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const harmonicGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 4, time);
      harmonicGain.gain.setValueAtTime(gainLevel * 0.13, time);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(gainLevel * 0.25, time + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(dur + 0.08, 0.55));

      osc1.connect(gain);
      osc2.connect(harmonicGain);
      harmonicGain.connect(gain);
      gain.connect(this.musicGainNode);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + Math.min(dur + 0.1, 0.6));
      osc2.stop(time + 0.06);
      this.activeMusicNodes.push(osc1, osc2, gain);
    } catch (_e) {}
  }

  // 2. Cozy Rhodes Electric Piano (Warm sine/triangle chorus + soft low-passed tine)
  public playRhodes(freq: number, time: number, dur: number, gainLevel: number = 0.21): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const tineOsc = ctx.createOscillator();
      const tineGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(4, time);

      tineOsc.type = 'sine';
      tineOsc.frequency.setValueAtTime(freq * 3, time);
      tineGain.gain.setValueAtTime(gainLevel * 0.07, time);
      tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1350, time);
      filter.frequency.exponentialRampToValueAtTime(520, time + dur);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(gainLevel * 0.45, time + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.12);

      osc1.connect(filter);
      osc2.connect(filter);
      tineOsc.connect(tineGain);
      tineGain.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc1.start(time);
      osc2.start(time);
      tineOsc.start(time);
      osc1.stop(time + dur + 0.15);
      osc2.stop(time + dur + 0.15);
      tineOsc.stop(time + 0.1);
      this.activeMusicNodes.push(osc1, osc2, tineOsc, gain);
    } catch (_e) {}
  }

  // 3. Warm Kalimba / Thumb Piano
  public playKalimba(freq: number, time: number, dur: number, gainLevel: number = 0.23): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.92, time);
      overtoneGain.gain.setValueAtTime(gainLevel * 0.08, time);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(dur + 0.15, 0.75));

      osc.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      overtone.start(time);
      osc.stop(time + Math.min(dur + 0.18, 0.8));
      overtone.stop(time + 0.06);
      this.activeMusicNodes.push(osc, overtone, gain);
    } catch (_e) {}
  }

  // 4. Acoustic Nylon Guitar (Karplus-Strong physical string simulation)
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
    const decay = 0.992;
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

  public playGuitar(freq: number, time: number, dur: number, gainLevel: number = 0.24): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const buffer = this.getGuitarBuffer(ctx, freq);
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.frequency.exponentialRampToValueAtTime(900, time + 0.28);

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

  // 5. Warm Musette Accordion (Triangle + soft low-passed reed + sub-octave)
  public playAccordion(freq: number, time: number, dur: number, gainLevel: number = 0.17): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      oscSub.type = 'sine';

      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq, time);
      osc2.detune.setValueAtTime(10, time);
      oscSub.frequency.setValueAtTime(freq * 0.5, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(1150, freq * 2.2), time);
      filter.Q.setValueAtTime(0.7, time);

      const reed2Gain = ctx.createGain();
      reed2Gain.gain.setValueAtTime(0.32, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.045);
      gain.gain.setValueAtTime(gainLevel * 0.85, time + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.06);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(gainLevel * 0.4, time);
      subGain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.06);

      osc1.connect(filter);
      osc2.connect(reed2Gain);
      reed2Gain.connect(filter);
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

  // 6. Mellow Alto Flute (Warm low-register breath flute, auto-folds > 670Hz)
  public playFlute(freq: number, time: number, dur: number, gainLevel: number = 0.16): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const safeFreq = freq > 670 ? freq * 0.5 : freq;
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(safeFreq, time);
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(safeFreq * 0.5, time);
      subGain.gain.setValueAtTime(0.25, time);

      lfo.frequency.setValueAtTime(4.8, time);
      lfoGain.gain.setValueAtTime(0, time);
      lfoGain.gain.setValueAtTime(0, time + 0.15);
      lfoGain.gain.linearRampToValueAtTime(3.0, time + 0.35);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.045);
      gain.gain.setValueAtTime(gainLevel * 0.85, time + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.06);

      osc.connect(filter);
      subOsc.connect(subGain);
      subGain.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      lfo.start(time);
      osc.start(time);
      subOsc.start(time);
      lfo.stop(time + dur + 0.08);
      osc.stop(time + dur + 0.08);
      subOsc.stop(time + dur + 0.08);

      this.activeMusicNodes.push(osc, subOsc, lfo, gain);
    } catch (_e) {}
  }

  // 7. Upright Plucked Bass
  public playBass(freq: number, time: number, dur: number, gainLevel: number = 0.34): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(240, time + 0.15);

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

  // 8. Celesta Bell (mapped to warm Kalimba chime)
  public playBell(freq: number, time: number, dur: number, gainLevel: number = 0.18): void {
    this.playKalimba(freq, time, dur, gainLevel);
  }

  // 9. Soft Brush Shaker
  public playShaker(time: number, gainLevel: number = 0.028): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4800, time);
      filter.Q.setValueAtTime(1.2, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      src.start(time);
      src.stop(time + 0.055);

      this.activeMusicNodes.push(src, gain);
    } catch (_e) {}
  }

  // 10. Hollow Woodblock (Warm low-mid pitch)
  public playWoodblock(freq: number, time: number, gainLevel: number = 0.09): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const warmFreq = Math.min(560, freq);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(warmFreq, time);
      osc.frequency.exponentialRampToValueAtTime(warmFreq * 0.68, time + 0.035);

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

      const notes = [523.25, 659.25, 783.99, 1046.5];
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

  private triggerEvent(ev: SoundEvent, noteTime: number, beatDur: number): void {
    const noteDur = (ev.dur || 0.4) * beatDur;
    const freq = ev.midi ? this.midiToFreq(ev.midi) : ev.freq || 440;

    switch (ev.inst) {
      case 'marimba':
        this.playMarimba(freq, noteTime, noteDur, ev.gain || 0.25);
        break;
      case 'rhodes':
        this.playRhodes(freq, noteTime, noteDur, ev.gain || 0.21);
        break;
      case 'kalimba':
        this.playKalimba(freq, noteTime, noteDur, ev.gain || 0.23);
        break;
      case 'guitar':
        this.playGuitar(freq, noteTime, noteDur, ev.gain || 0.24);
        break;
      case 'accordion':
        this.playAccordion(freq, noteTime, noteDur, ev.gain || 0.17);
        break;
      case 'flute':
        this.playFlute(freq, noteTime, noteDur, ev.gain || 0.16);
        break;
      case 'bass':
        this.playBass(freq, noteTime, noteDur, ev.gain || 0.34);
        break;
      case 'bell':
        this.playBell(freq, noteTime, noteDur, ev.gain || 0.18);
        break;
      case 'shaker':
        this.playShaker(noteTime, ev.gain || 0.028);
        break;
      case 'woodblock':
        this.playWoodblock(ev.freq || 500, noteTime, ev.gain || 0.09);
        break;
    }
  }

  public getNextTrack(): { track: SoundTrackDef; isNewTrack: boolean } {
    if (this.musicTrackPreference !== 'auto') {
      this.currentTrackId = this.musicTrackPreference;
      const isNew = this.currentRepeatCount === 0;
      this.currentRepeatCount++;
      return { track: TRACK_MAP[this.musicTrackPreference], isNewTrack: isNew };
    }

    const trackId = PLAYLIST_ORDER[this.currentTrackIndex % PLAYLIST_ORDER.length];
    this.currentTrackId = trackId;
    this.currentTrackIndex++;
    this.currentRepeatCount = 1;
    return { track: TRACK_MAP[trackId], isNewTrack: true };
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
    let currentBeat = 0;
    let scheduledUntilBeat = 0;
    let lastTickTime = ctx.currentTime;
    let pauseUntilTime = 0;
    const lookaheadBeats = 1.5;

    const tick = (): void => {
      if (!this.isMusicPlaying || this.musicMuted) return;
      const now = ctx.currentTime;

      if (now < pauseUntilTime) {
        lastTickTime = now;
        return;
      }

      const beatDur = 60 / activeTrack.bpm;
      const dt = Math.max(0, now - lastTickTime);
      lastTickTime = now;

      currentBeat += dt / beatDur;

      if (currentBeat >= activeTrack.totalBeats) {
        this.activeMusicNodes = [];
        const nextInfo = this.getNextTrack();
        activeTrack = nextInfo.track;
        currentBeat = 0;
        scheduledUntilBeat = 0;
        if (nextInfo.isNewTrack) {
          pauseUntilTime = now + 2.5;
          return;
        }
      }

      const targetBeat = Math.min(currentBeat + lookaheadBeats, activeTrack.totalBeats);
      const windowStart = scheduledUntilBeat;
      const windowEnd = targetBeat;

      for (let i = 0; i < activeTrack.events.length; i++) {
        const ev = activeTrack.events[i];
        if (ev.beat >= windowStart && ev.beat < windowEnd) {
          const offsetSec = (ev.beat - currentBeat) * beatDur;
          this.triggerEvent(ev, Math.max(now + 0.01, now + offsetSec), beatDur);
        }
      }

      scheduledUntilBeat = windowEnd;

      if (this.activeMusicNodes.length > 400) {
        this.activeMusicNodes.splice(0, 200);
      }
    };

    tick();
    this.musicTimer = window.setInterval(tick, 40);
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
