import { describe, it, expect } from 'vitest';
import { CHORD_PACKS, chordFromPack } from './chordPacks';

// Open-string pitch classes by backend stringNumber (1 = high e … 6 = low E).
const OPEN_PC: Record<number, number> = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };

// Expected pitch-class set (C = 0) for every chord used across the packs.
const CHORD_TONES: Record<string, number[]> = {
  Emaj7: [4, 8, 11, 3],
  'Badd9/D#': [11, 3, 6, 1],
  'C#m7': [1, 4, 8, 11],
  Bmaj7: [11, 3, 6, 10],
  G: [7, 11, 2],
  Cadd9: [0, 4, 7, 2],
  Em7: [4, 7, 11, 2],
  D: [2, 6, 9],
  Am7: [9, 0, 4, 7],
  Dm7: [2, 5, 9, 0],
  G7: [7, 11, 2, 5],
  Cmaj7: [0, 4, 7, 11],
  Fmaj7: [5, 9, 0, 4],
  E7: [4, 8, 11, 2],
  Cm7: [0, 3, 7, 10],
  Fm9: [5, 8, 0, 3, 7],
  Dm7b5: [2, 5, 8, 0],
  'G7+': [7, 11, 3, 5],
  Cm9: [0, 3, 7, 10, 2],
  Ebm9: [3, 6, 10, 1, 5],
  Ab13: [8, 0, 3, 6, 10, 5],
  Dbmaj7: [1, 5, 8, 0],
  Am: [9, 0, 4],
  C: [0, 4, 7],
  Em: [4, 7, 11],
  B7: [11, 3, 6, 9],
  'Am(add9)': [9, 0, 4, 11],
  'D(add9)': [2, 6, 9, 4],
  'F#dim(add11)': [6, 9, 0, 11],
  'B(add11)': [11, 3, 6, 4],
  Fm7: [5, 8, 0, 3],
  'Dm7(b5)': [2, 5, 8, 0],
  'G7(#5)': [7, 11, 3, 5],
  // Jazz Guitar Chords pack
  Gmaj7: [7, 11, 2, 6],
  Dmaj7: [2, 6, 9, 1],
  Amaj7: [9, 1, 4, 8],
  'Cmaj7 (barre)': [0, 4, 7, 11],
  'Am7 (barre)': [9, 0, 4, 7],
  'Dm7 (barre)': [2, 5, 9, 0],
  C7: [0, 4, 7, 10],
  D7: [2, 6, 9, 0],
  'G7 (barre)': [7, 11, 2, 5],
  'C7 (barre)': [0, 4, 7, 10],
  // Open Key of E pack
  E: [4, 8, 11],
  'F#m11': [6, 9, 1, 4, 11],
  'Emaj7/D#': [4, 8, 11, 3],
  Aadd9: [9, 1, 4, 11],
  Badd11: [11, 3, 6, 4],
  // Smooth Flow pack
  Bm7: [11, 2, 6, 9],
  Gmaj13: [7, 11, 2, 6, 4],
  A7: [9, 1, 4, 7],
  // Geek in the Pink — (kapó 6) uses Em C Am G D B7 (above); (kapó 1) adds these:
  F: [5, 9, 0],
  Dm: [2, 5, 9],
  Bbmaj7: [10, 2, 5, 9],
};

describe('chord packs', () => {
  it('every pack has an id, label and at least one chord', () => {
    for (const p of CHORD_PACKS) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.chords.length).toBeGreaterThan(0);
    }
  });

  it('every pack chord is a 6-string shape with 3+ played strings', () => {
    for (const p of CHORD_PACKS) {
      for (const c of p.chords) {
        expect(c.shape).toHaveLength(6);
        expect(chordFromPack(c).fretPositions.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('every sounded note belongs to its chord (no wrong notes)', () => {
    for (const p of CHORD_PACKS) {
      for (const c of p.chords) {
        const tones = CHORD_TONES[c.name];
        expect(tones, `missing expected tones for ${c.name}`).toBeTruthy();
        for (const pos of chordFromPack(c).fretPositions) {
          const pc = (OPEN_PC[pos.stringNumber] + pos.fretNumber) % 12;
          expect(tones, `${c.name}: pitch class ${pc} not in chord`).toContain(pc);
        }
      }
    }
  });
});
