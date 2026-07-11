import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as axeMatchers from 'vitest-axe/matchers';
import { NotectorGame } from './components/notector/NotectorGame';
import { GuitarTuner } from './components/tuner/GuitarTuner';
import { ChordDetector } from './components/chord-detector/ChordDetector';

expect.extend(axeMatchers);

// Audio + mic hooks need a real AudioContext / microphone; stub them so the
// components render as pure DOM for the accessibility checks.
vi.mock('./hooks/useTuner', async (importActual) => ({
  ...(await importActual<typeof import('./hooks/useTuner')>()),
  useTuner: () => ({
    reading: { frequency: 0, note: null, octave: null, midi: null, cents: 0 },
    isListening: false,
  }),
}));
vi.mock('./hooks/useMetronome', () => ({ useMetronome: () => {} }));
vi.mock('./hooks/useChordDetector', async (importActual) => ({
  ...(await importActual<typeof import('./hooks/useChordDetector')>()),
  useChordDetector: () => ({
    reading: { chroma: new Array(12).fill(0), chord: null, hasSignal: false },
    isListening: false,
  }),
}));
vi.mock('./api/customBars', () => ({
  customBarApi: { getAll: () => Promise.resolve([]), create: (b: unknown) => Promise.resolve(b), delete: () => Promise.resolve() },
}));

// axe can't compute colour contrast in jsdom (no layout) — we audit that
// separately by measured ratio. Turn the rule off so it doesn't warn.
const axeOpts = { rules: { 'color-contrast': { enabled: false } } };

describe('accessibility (axe) — no violations on the main views', () => {
  it('Notector (idle screen)', async () => {
    const { container } = render(<NotectorGame />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it('Notector (Muscle Memory — shows the bar builder)', async () => {
    const { container } = render(<NotectorGame />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'muscle' } });
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it('Tuner', async () => {
    const { container } = render(<GuitarTuner />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });

  it('Chord Detector', async () => {
    const { container } = render(<ChordDetector />);
    expect(await axe(container, axeOpts)).toHaveNoViolations();
  });
});
