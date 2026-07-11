import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { NotectorGame } from './components/notector/NotectorGame';
import { GuitarTuner } from './components/tuner/GuitarTuner';
import { ChordDetector } from './components/chord-detector/ChordDetector';
import { ComposerCanvas } from './components/composer/ComposerCanvas';

// Assert no axe violations without the custom matcher (whose types don't flow
// through tsc -b): compare a readable list of "rule: selector" to an empty array.
async function expectNoAxeViolations(container: Element) {
  const results = await axe(container, axeOpts);
  const problems = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(problems).toEqual([]);
}

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
// Composer: stub the data layer + audio so it renders its empty state purely.
vi.mock('./api/chords', async (importActual) => ({
  ...(await importActual<typeof import('./api/chords')>()),
  chordApi: {
    getAll: () => Promise.resolve([]),
    create: (c: unknown) => Promise.resolve(c),
    update: (_id: number, c: unknown) => Promise.resolve(c),
    getByName: () => Promise.resolve(null),
  },
}));
vi.mock('./api/workspaces', async (importActual) => ({
  ...(await importActual<typeof import('./api/workspaces')>()),
  workspaceApi: {
    getAll: () => Promise.resolve([]),
    create: (w: unknown) => Promise.resolve(w),
    delete: () => Promise.resolve(),
    addCard: (_id: number, c: unknown) => Promise.resolve(c),
    removeCard: () => Promise.resolve({}),
    updateCardPositions: () => Promise.resolve({}),
    updateCardPosition: () => Promise.resolve({}),
  },
}));
vi.mock('./hooks/useChordPlayer', () => ({
  useChordPlayer: () => ({ playChord: () => {}, playNote: () => {}, stopAll: () => {} }),
}));

// axe can't compute colour contrast in jsdom (no layout) — we audit that
// separately by measured ratio. Turn the rule off so it doesn't warn.
const axeOpts = { rules: { 'color-contrast': { enabled: false } } };

describe('accessibility (axe) — no violations on the main views', () => {
  it('Notector (idle screen)', async () => {
    const { container } = render(<NotectorGame />);
    await expectNoAxeViolations(container);
  });

  it('Notector (Muscle Memory — shows the bar builder)', async () => {
    const { container } = render(<NotectorGame />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'muscle' } });
    await expectNoAxeViolations(container);
  });

  it('Tuner', async () => {
    const { container } = render(<GuitarTuner />);
    await expectNoAxeViolations(container);
  });

  it('Chord Detector', async () => {
    const { container } = render(<ChordDetector />);
    await expectNoAxeViolations(container);
  });

  it('Chord Detector — self-test panel', async () => {
    const { container } = render(<ChordDetector />);
    fireEvent.click(screen.getByRole('button', { name: /sjálfspróf/i }));
    await expectNoAxeViolations(container);
  });

  it('Composer (empty state)', async () => {
    const { container } = render(<ComposerCanvas />);
    await screen.findByText('Engir hljómar í safninu'); // wait for the mount fetch to settle
    await expectNoAxeViolations(container);
  });
});
