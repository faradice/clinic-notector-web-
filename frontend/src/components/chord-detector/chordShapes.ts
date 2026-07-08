// Standard open/common guitar chord shapes for the detector's diagram.
// Each entry is 6 fret numbers, low-E string first (index 0) to high-E (index 5).
//   -1 = muted (x), 0 = open (o), n = press fret n.
// Self-contained on purpose (the backend chord library only had a handful of
// unrelated entries), so the Chord Detector stays isolated.

export const CHORD_SHAPES: Record<string, number[]> = {
  // Major
  C: [-1, 3, 2, 0, 1, 0],
  A: [-1, 0, 2, 2, 2, 0],
  G: [3, 2, 0, 0, 0, 3],
  E: [0, 2, 2, 1, 0, 0],
  D: [-1, -1, 0, 2, 3, 2],
  F: [1, 3, 3, 2, 1, 1],
  B: [-1, 2, 4, 4, 4, 2],

  // Minor
  Am: [-1, 0, 2, 2, 1, 0],
  Em: [0, 2, 2, 0, 0, 0],
  Dm: [-1, -1, 0, 2, 3, 1],
  Bm: [-1, 2, 4, 4, 3, 2],
  'F#m': [2, 4, 4, 2, 2, 2],
  Gm: [3, 5, 5, 3, 3, 3],

  // Dominant 7
  G7: [3, 2, 0, 0, 0, 1],
  C7: [-1, 3, 2, 3, 1, 0],
  D7: [-1, -1, 0, 2, 1, 2],
  A7: [-1, 0, 2, 0, 2, 0],
  E7: [0, 2, 0, 1, 0, 0],
  B7: [-1, 2, 1, 2, 0, 2],

  // Major 7
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  Amaj7: [-1, 0, 2, 1, 2, 0],
  Dmaj7: [-1, -1, 0, 2, 2, 2],
  Fmaj7: [-1, -1, 3, 2, 1, 0],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  Emaj7: [0, 2, 1, 1, 0, 0],

  // Minor 7
  Am7: [-1, 0, 2, 0, 1, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  Dm7: [-1, -1, 0, 2, 1, 1],

  // Sus
  Dsus4: [-1, -1, 0, 2, 3, 3],
  Asus4: [-1, 0, 2, 2, 3, 0],
  Dsus2: [-1, -1, 0, 2, 3, 0],
  Asus2: [-1, 0, 2, 2, 0, 0],
};

export function shapeFor(chordName: string): number[] | null {
  return CHORD_SHAPES[chordName] ?? null;
}
