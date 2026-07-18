import type { Chord } from '../../api/chords';
import { parseRootAndType, shapeToFretPositions } from './chordFromName';

// Ready-made chord packs: curated, nice-sounding chord sets (and known-song chords)
// that drop onto a new board with one click. Each chord carries its OWN voicing
// (shape array: low-E first … high-E, -1 = muted, 0 = open, n = fret n), so packs
// can use rich voicings up the neck, independent of the generic open-chord table.
//
// Generating a pack also adds any of its chords that are missing to the chord
// library. Grow this list over time — more moods and more songs.

export interface PackChord {
  name: string;
  shape: number[];
}

export interface ChordPack {
  id: string;
  label: string;
  chords: PackChord[];
}

export const CHORD_PACKS: ChordPack[] = [
  {
    id: 'peaceful',
    label: 'Peaceful chords',
    chords: [
      { name: 'Emaj7', shape: [-1, 7, 6, 8, 0, -1] },
      { name: 'Badd9/D#', shape: [-1, 6, 4, 6, 0, -1] },
      { name: 'C#m7', shape: [-1, 4, 2, 1, 0, -1] },
      { name: 'Bmaj7', shape: [-1, 2, 1, 3, 0, -1] },
    ],
  },
  {
    id: 'beautiful-loop',
    label: 'Beautiful loop (G · Cadd9 · Em7 · D)',
    chords: [
      { name: 'G', shape: [3, 2, 0, 0, 3, 3] },
      { name: 'Cadd9', shape: [-1, 3, 2, 0, 3, 3] },
      { name: 'Em7', shape: [0, 2, 2, 0, 3, 3] },
      { name: 'D', shape: [-1, -1, 0, 2, 3, 2] },
    ],
  },
  {
    id: 'fly-me-to-the-moon',
    label: 'Fly Me To The Moon',
    chords: [
      { name: 'Am7', shape: [5, -1, 5, 5, 5, -1] },
      { name: 'Dm7', shape: [-1, 5, 7, 5, 6, 5] },
      { name: 'G7', shape: [3, -1, 3, 4, 3, -1] },
      { name: 'Cmaj7', shape: [-1, 3, 5, 4, 5, -1] },
      { name: 'Fmaj7', shape: [-1, 8, 10, 9, 10, -1] },
      { name: 'E7', shape: [-1, 7, 9, 7, 9, 7] },
    ],
  },
  {
    id: 'blue-bossa',
    label: 'Blue Bossa',
    chords: [
      { name: 'Cm7', shape: [8, -1, 8, 8, 8, -1] },
      { name: 'Fm9', shape: [-1, 8, 6, 8, 8, 8] },
      { name: 'Dm7b5', shape: [-1, 5, 6, 5, 6, -1] },
      { name: 'G7+', shape: [3, -1, 3, 4, 4, -1] },
      { name: 'Cm9', shape: [-1, 3, 1, 3, 3, 3] },
      { name: 'Ebm9', shape: [-1, 6, 4, 6, 6, 6] },
      { name: 'Ab13', shape: [4, -1, 4, 5, 6, -1] },
      { name: 'Dbmaj7', shape: [-1, 4, 6, 5, 6, -1] },
    ],
  },
  {
    id: 'myos-verse',
    label: 'Make Your Own Song — Verse',
    chords: [
      { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
      { name: 'Am', shape: [-1, 0, 2, 2, 1, 0] },
      { name: 'C', shape: [-1, 3, 2, 0, 1, 0] },
      { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
    ],
  },
  {
    id: 'myos-chorus',
    label: 'Make Your Own Song — Chorus',
    chords: [
      { name: 'Em', shape: [0, 2, 2, 0, 0, 0] },
      { name: 'D', shape: [-1, -1, 0, 2, 3, 2] },
      { name: 'C', shape: [-1, 3, 2, 0, 1, 0] },
      { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
    ],
  },
  {
    id: 'myos-bridge',
    label: 'Make Your Own Song — Bridge',
    chords: [
      { name: 'C', shape: [-1, 3, 2, 0, 1, 0] },
      { name: 'Em', shape: [0, 2, 2, 0, 0, 0] },
      { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
      { name: 'B7', shape: [-1, 2, 1, 2, 0, 2] },
    ],
  },
  {
    id: 'classic-chords',
    label: 'Classic Chords',
    chords: [
      { name: 'Em', shape: [0, 2, 2, 0, 0, 0] },
      { name: 'Am(add9)', shape: [-1, 0, 2, 5, 0, 0] },
      { name: 'D(add9)', shape: [-1, 5, 4, 2, 3, 0] },
      { name: 'G', shape: [3, 2, 0, 0, 0, 3] },
      { name: 'C', shape: [-1, 3, 2, 0, 1, 0] },
      { name: 'F#dim(add11)', shape: [-1, 0, 4, 5, 0, -1] },
      { name: 'B(add11)', shape: [-1, 2, 1, -1, 5, 2] },
      { name: 'Em', shape: [0, 2, 2, 0, 0, 0] },
    ],
  },
  {
    id: 'blue-bossa-simple',
    label: 'Blue Bossa (einfalt)',
    chords: [
      { name: 'Cm9', shape: [-1, 3, 1, 3, 3, -1] },
      { name: 'Fm7', shape: [1, -1, 1, 1, 1, -1] },
      { name: 'Dm7(b5)', shape: [-1, 5, 6, 5, 6, -1] },
      { name: 'G7(#5)', shape: [3, -1, 3, 4, 4, -1] },
    ],
  },
  {
    id: 'jazz-guitar',
    label: 'Jazz Guitar Chords',
    chords: [
      { name: 'Cmaj7', shape: [-1, 3, 2, 0, 0, 0] },
      { name: 'Gmaj7', shape: [3, 2, 0, 0, 0, 2] },
      { name: 'Dmaj7', shape: [-1, -1, 0, 2, 2, 2] },
      { name: 'Amaj7', shape: [-1, 0, 2, 1, 2, 0] },
      { name: 'Cmaj7 (barre)', shape: [-1, 3, 5, 4, 5, 3] },
      { name: 'Dm7', shape: [-1, -1, 0, 2, 1, 1] },
      { name: 'Am7', shape: [-1, 0, 2, 0, 1, 0] },
      { name: 'Em7', shape: [0, 2, 2, 0, 3, 0] },
      { name: 'Am7 (barre)', shape: [5, 7, 5, 5, 5, 5] },
      { name: 'Dm7 (barre)', shape: [-1, 5, 7, 5, 6, 5] },
      { name: 'C7', shape: [-1, 3, 2, 3, 1, 0] },
      { name: 'G7', shape: [3, 2, 0, 0, 0, 1] },
      { name: 'D7', shape: [-1, -1, 0, 2, 1, 2] },
      { name: 'G7 (barre)', shape: [3, 5, 3, 4, 3, 3] },
      { name: 'C7 (barre)', shape: [-1, 3, 5, 3, 5, 3] },
    ],
  },
  {
    id: 'open-key-of-e',
    label: 'Open Key of E',
    // One movable shape (low-E muted, B + high-e ringing open) slid up the neck.
    chords: [
      { name: 'E', shape: [0, 2, 2, 1, 0, 0] },
      { name: 'F#m11', shape: [-1, 4, 4, 2, 0, 0] },
      { name: 'Emaj7/D#', shape: [-1, 6, 6, 4, 0, 0] },
      { name: 'Aadd9', shape: [-1, 7, 7, 6, 0, 0] },
      { name: 'Badd11', shape: [-1, 9, 9, 8, 0, 0] },
      { name: 'C#m7', shape: [-1, 11, 11, 9, 0, 0] },
    ],
  },
  {
    id: 'smooth-flow',
    label: 'Smooth Flow',
    chords: [
      { name: 'Bm7', shape: [-1, 2, 4, 2, 3, 2] },
      { name: 'Gmaj13', shape: [3, -1, 4, 4, 3, 0] },
      { name: 'Em7', shape: [0, 2, 2, 0, 3, 0] },
      { name: 'A7', shape: [-1, 0, 2, 0, 2, 0] },
    ],
  },
  {
    id: 'geek-in-the-pink',
    label: 'Geek in the Pink',
    // Jason Mraz — verse/chorus loop (Bbm7 F# D#m C# G#) + pre-chorus (Bmaj7, F).
    // Sounding chords (no capo); with capo 1 these are the Am7 F Dm C G shapes.
    chords: [
      { name: 'Bbm7', shape: [6, -1, 6, 6, 6, -1] },
      { name: 'F#', shape: [2, 4, 4, 3, 2, 2] },
      { name: 'D#m', shape: [6, 6, 8, 8, 7, 6] },
      { name: 'C#', shape: [4, 4, 6, 6, 6, 4] },
      { name: 'G#', shape: [4, 6, 6, 5, 4, 4] },
      { name: 'Bmaj7', shape: [2, 2, 4, 3, 4, 2] },
      { name: 'F', shape: [1, 3, 3, 2, 1, 1] },
    ],
  },
];

/** Build an (unsaved) library chord from a pack chord, keeping its exact voicing. */
export function chordFromPack(pc: PackChord): Omit<Chord, 'id'> {
  const { rootNote, chordType } = parseRootAndType(pc.name);
  return {
    name: pc.name,
    rootNote,
    chordType,
    fretPositions: shapeToFretPositions(pc.shape),
  };
}
