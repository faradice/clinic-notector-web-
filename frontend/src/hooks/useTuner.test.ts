import { describe, it, expect } from 'vitest';
import { freqToReading, nearestGuitarString, GUITAR_STRINGS, autoCorrelate } from './useTuner';

/** Cents error of a detected frequency vs the true frequency. */
function centsError(detected: number, actual: number) {
  return Math.abs(1200 * Math.log2(detected / actual));
}

/** Build a sine-wave time-domain buffer at a given frequency. */
function sineBuffer(freq: number, sampleRate = 44100, size = 2048) {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return buf;
}

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

describe('autoCorrelate (unbiased across the guitar range)', () => {
  // Detecting a pure sine at each open-string frequency should be accurate to a
  // couple of cents at every pitch — including low E, where the old biased
  // autocorrelation read several cents sharp.
  for (const s of GUITAR_STRINGS) {
    it(`detects ${s.label} (${s.frequency.toFixed(2)} Hz) within 3 cents`, () => {
      const detected = autoCorrelate(sineBuffer(s.frequency), 44100);
      expect(detected).toBeGreaterThan(0);
      expect(centsError(detected, s.frequency)).toBeLessThan(3);
    });
  }

  it('returns -1 for silence', () => {
    expect(autoCorrelate(new Float32Array(2048), 44100)).toBe(-1);
  });
});
