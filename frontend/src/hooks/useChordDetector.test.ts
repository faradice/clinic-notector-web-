import { describe, it, expect } from 'vitest';
import { matchChord, NOTE_NAMES } from './useChordDetector';

/** Ideal chroma: 1.0 at each given pitch class, 0 elsewhere. */
function chromaOf(pitchClasses: number[]): number[] {
  const c = new Array(12).fill(0);
  for (const pc of pitchClasses) c[pc] = 1;
  return c;
}

const C = 0, E = 4, G = 7, A = 9, D = 2, Bf = 10, Ef = 3, Gs = 8;

describe('matchChord', () => {
  it('names a C major triad', () => {
    expect(matchChord(chromaOf([C, E, G]))?.name).toBe('C');
  });

  it('names an A minor triad', () => {
    expect(matchChord(chromaOf([A, C, E]))?.name).toBe('Am');
  });

  it('names a G dominant 7 (G B D F)', () => {
    // G=7, B=11, D=2, F=5
    expect(matchChord(chromaOf([7, 11, 2, 5]))?.name).toBe('G7');
  });

  it('prefers the plain triad for a pure triad (not a 7th)', () => {
    const m = matchChord(chromaOf([C, E, G]));
    expect(m?.name).toBe('C'); // not Cmaj7 / C7
    expect(m!.score).toBeCloseTo(1, 5);
  });

  it('names a D suspended-4 (D G A)', () => {
    expect(matchChord(chromaOf([D, G, A]))?.name).toBe('Dsus4');
  });

  it('returns the chord tones as note names', () => {
    const m = matchChord(chromaOf([Ef, G, Bf]))!; // Eb major: Eb G Bb
    expect(m.root).toBe(Ef);
    expect(m.notes).toEqual([NOTE_NAMES[Ef], NOTE_NAMES[G], NOTE_NAMES[Bf]]);
  });

  it('returns null for an all-zero chroma', () => {
    expect(matchChord(new Array(12).fill(0))).toBeNull();
  });

  it('handles an augmented triad', () => {
    // C aug = C E G#
    expect(matchChord(chromaOf([C, E, Gs]))?.name).toBe('Caug');
  });
});
