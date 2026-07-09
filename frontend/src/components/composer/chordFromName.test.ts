import { describe, it, expect } from 'vitest';
import { normalizeChordName, parseRootAndType, shapeToFretPositions, chordFromName } from './chordFromName';

describe('normalizeChordName', () => {
  it('fixes casing to match the shape table', () => {
    expect(normalizeChordName('am')).toBe('Am');
    expect(normalizeChordName('c')).toBe('C');
    expect(normalizeChordName('g7')).toBe('G7');
    expect(normalizeChordName('f#m')).toBe('F#m');
    expect(normalizeChordName('cMAJ7')).toBe('Cmaj7');
    expect(normalizeChordName('  D  ')).toBe('D');
  });
});

describe('parseRootAndType', () => {
  it('splits root and type', () => {
    expect(parseRootAndType('C')).toEqual({ rootNote: 'C', chordType: 'major' });
    expect(parseRootAndType('Am')).toEqual({ rootNote: 'A', chordType: 'minor' });
    expect(parseRootAndType('G7')).toEqual({ rootNote: 'G', chordType: '7' });
    expect(parseRootAndType('F#m')).toEqual({ rootNote: 'F#', chordType: 'minor' });
    expect(parseRootAndType('Cmaj7')).toEqual({ rootNote: 'C', chordType: 'maj7' });
  });
});

describe('shapeToFretPositions', () => {
  it('maps low-E-first shape to backend string numbers (1=high E), omitting mutes', () => {
    // C major: [-1(lowE mute), 3(A), 2(D), 0(G open), 1(B), 0(high E open)]
    const positions = shapeToFretPositions([-1, 3, 2, 0, 1, 0]);
    expect(positions).toEqual([
      { stringNumber: 5, fretNumber: 3, finger: 0 }, // A string, 3rd fret = C
      { stringNumber: 4, fretNumber: 2, finger: 0 }, // D string, 2nd fret = E
      { stringNumber: 3, fretNumber: 0, finger: 0 }, // G open
      { stringNumber: 2, fretNumber: 1, finger: 0 }, // B string, 1st fret = C
      { stringNumber: 1, fretNumber: 0, finger: 0 }, // high E open
    ]);
  });
});

describe('chordFromName', () => {
  it('builds a full chord from a known name (case-insensitive)', () => {
    const c = chordFromName('am')!;
    expect(c.name).toBe('Am');
    expect(c.rootNote).toBe('A');
    expect(c.chordType).toBe('minor');
    expect(c.fretPositions.length).toBeGreaterThan(0);
  });

  it('returns null for an unknown chord', () => {
    expect(chordFromName('C13#11')).toBeNull();
    expect(chordFromName('zzz')).toBeNull();
  });
});
