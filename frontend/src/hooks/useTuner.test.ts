import { describe, it, expect } from 'vitest';
import { freqToReading, nearestGuitarString, GUITAR_STRINGS } from './useTuner';

describe('freqToReading', () => {
  it('maps A4 = 440 Hz exactly', () => {
    const r = freqToReading(440);
    expect(r.note).toBe('A');
    expect(r.octave).toBe(4);
    expect(r.cents).toBe(0);
  });

  it('maps each open guitar string to the right note/octave, ~0 cents', () => {
    for (const s of GUITAR_STRINGS) {
      const r = freqToReading(s.frequency);
      expect(r.note).toBe(s.note);
      expect(r.octave).toBe(s.octave);
      expect(Math.abs(r.cents)).toBeLessThanOrEqual(1);
    }
  });

  it('reports positive cents when sharp, negative when flat', () => {
    expect(freqToReading(445).cents).toBeGreaterThan(0); // A4 a touch sharp
    expect(freqToReading(435).cents).toBeLessThan(0);    // A4 a touch flat
  });

  it('returns empty for no signal', () => {
    const r = freqToReading(0);
    expect(r.note).toBeNull();
    expect(r.frequency).toBe(0);
  });
});

describe('nearestGuitarString', () => {
  it('distinguishes low E2 from high E4', () => {
    expect(nearestGuitarString(freqToReading(82.41))?.label).toBe('E2');
    expect(nearestGuitarString(freqToReading(329.63))?.label).toBe('E4');
  });

  it('snaps a slightly-off pitch to the closest string', () => {
    expect(nearestGuitarString(freqToReading(112))?.label).toBe('A2'); // ~A2 (110)
    expect(nearestGuitarString(freqToReading(150))?.label).toBe('D3'); // ~D3 (146.8)
  });
});
