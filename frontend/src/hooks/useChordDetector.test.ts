import { describe, it, expect } from 'vitest';
import { matchChord, NOTE_NAMES, harmonicProductSpectrum, spectrumToChroma } from './useChordDetector';

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

describe('harmonicProductSpectrum', () => {
  it('keeps a fundamental with all its harmonics, kills a lone harmonic peak', () => {
    const mag = new Float32Array(64);
    // Fundamental at bin 5 with harmonics 10, 15, 20 (H=4).
    mag[5] = mag[10] = mag[15] = mag[20] = 1;
    // A spurious lone peak at bin 7 (no harmonics at 14/21/28).
    mag[7] = 1;
    const hps = harmonicProductSpectrum(mag, 4);
    expect(hps[5]).toBe(1);  // fundamental survives
    expect(hps[7]).toBe(0);  // lone peak collapses
    expect(hps[10]).toBe(0); // octave harmonic of 5 is not itself a fundamental here
  });
});

describe('HPS suppresses a single note\'s overtones (no fake chord)', () => {
  it('a note + its harmonics folds to one pitch class, not a triad', () => {
    // One C3-ish note at 131 Hz with harmonics 262/393/524 (octave, fifth, 2 oct).
    // Raw chroma would light C, G and E; after HPS it should be essentially just C.
    const binHz = 1;
    const spec = new Float32Array(1400);
    for (const bin of [131, 262, 393, 524]) spec[bin] = 1;
    const hps = harmonicProductSpectrum(spec, 4);
    const chroma = spectrumToChroma(hps, binHz, 70, 1300);

    const C = 0, E = 4, G = 7;
    const maxIdx = chroma.indexOf(Math.max(...chroma));
    expect(maxIdx).toBe(C);
    // fifth/third harmonics essentially gone
    expect(chroma[G]).toBeLessThan(chroma[C] * 0.05);
    expect(chroma[E]).toBeLessThan(chroma[C] * 0.05);
  });
});
