import { describe, it, expect } from 'vitest';
import { generateVoicing } from './chordGenerator';

// Open-string pitch class by shape index [lowE, A, D, G, B, e].
const OPEN_PC = [4, 9, 2, 7, 11, 4];
const ROOT_PC: Record<string, number> = {
  A: 9, 'A#': 10, B: 11, C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8,
};
// Interval sets (semitones from root) for each type on "The Ultimate Chords Chart".
const INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7], m: [0, 3, 7], '6': [0, 4, 7, 9], '7': [0, 4, 7, 10],
  '9': [0, 4, 7, 10, 2], m6: [0, 3, 7, 9], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  dim: [0, 3, 6, 9], '+': [0, 4, 8], sus: [0, 5, 7],
};

const ROOTS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const TYPES = Object.keys(INTERVALS);

describe('movable chord generator', () => {
  it('produces a note-correct voicing for all 12 roots × 11 types (132 chords)', () => {
    for (const root of ROOTS) {
      for (const type of TYPES) {
        const name = root + type;
        const shape = generateVoicing(name);
        expect(shape, `no voicing for ${name}`).not.toBeNull();
        const played = shape!.filter((f) => f >= 0);
        expect(played.length, `${name} has too few strings`).toBeGreaterThanOrEqual(3);

        const tones = new Set(INTERVALS[type].map((iv) => (ROOT_PC[root] + iv) % 12));
        shape!.forEach((fret, i) => {
          if (fret < 0) return;
          expect(fret, `${name} fret out of range`).toBeLessThanOrEqual(15);
          const pc = (OPEN_PC[i] + fret) % 12;
          expect(tones.has(pc), `${name}: pitch class ${pc} not in chord`).toBe(true);
        });
      }
    }
  });

  it('covers common enharmonic and extended names', () => {
    for (const name of ['F#m7', 'Bbmaj7', 'C9', 'Ebdim', 'G#m6', 'Dsus2']) {
      expect(generateVoicing(name), name).not.toBeNull();
    }
  });
});
