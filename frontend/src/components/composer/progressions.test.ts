import { describe, it, expect } from 'vitest';
import { KEYS, chordsFor, progressionsForMode } from './progressions';
import { shapeFor } from '../chord-detector/chordShapes';

const key = (label: string) => KEYS.find((k) => k.label === label)!;

describe('chordsFor', () => {
  it('builds the Pop progression in C major', () => {
    expect(chordsFor(key('C major'), [1, 5, 6, 4])).toEqual(['C', 'G', 'Am', 'F']);
  });

  it('builds I–V–vi–IV in A major', () => {
    expect(chordsFor(key('A major'), [1, 5, 6, 4])).toEqual(['A', 'E', 'F#m', 'D']);
  });

  it('builds the Andalusian progression in A minor and E minor', () => {
    expect(chordsFor(key('A minor'), [1, 6, 3, 7])).toEqual(['Am', 'F', 'C', 'G']);
    expect(chordsFor(key('E minor'), [1, 6, 3, 7])).toEqual(['Em', 'C', 'G', 'D']);
  });

  it('minor i–iv–v', () => {
    expect(chordsFor(key('A minor'), [1, 4, 5])).toEqual(['Am', 'Dm', 'Em']);
  });
});

describe('coverage: every offered key+progression chord has a shape', () => {
  it('generates only chords present in chordShapes', () => {
    for (const k of KEYS) {
      for (const p of progressionsForMode(k.mode)) {
        for (const name of chordsFor(k, p.degrees)) {
          expect(shapeFor(name), `${k.label} · ${p.label} -> ${name}`).not.toBeNull();
        }
      }
    }
  });
});
