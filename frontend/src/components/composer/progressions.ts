// Common chord progressions by key. Kept to the keys whose diatonic chords all
// exist in the shared chordShapes table (see chordFromName), so every generated
// chord is real and draggable. Expandable later with more keys/shapes.

export type Mode = 'major' | 'minor';

export interface KeyOption {
  label: string;
  root: number; // pitch class 0..11 (C=0)
  mode: Mode;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const KEYS: KeyOption[] = [
  { label: 'C dúr', root: 0, mode: 'major' },
  { label: 'G dúr', root: 7, mode: 'major' },
  { label: 'D dúr', root: 2, mode: 'major' },
  { label: 'A dúr', root: 9, mode: 'major' },
  { label: 'A moll', root: 9, mode: 'minor' },
  { label: 'E moll', root: 4, mode: 'minor' },
];

export interface Progression {
  label: string;
  degrees: number[]; // scale degrees 1..7
  modes: Mode[];     // which key modes it's offered for
}

export const PROGRESSIONS: Progression[] = [
  { label: 'Popp (I–V–vi–IV)', degrees: [1, 5, 6, 4], modes: ['major'] },
  { label: 'Klassísk (I–IV–V)', degrees: [1, 4, 5], modes: ['major'] },
  { label: '50s (I–vi–IV–V)', degrees: [1, 6, 4, 5], modes: ['major'] },
  { label: 'Djass (ii–V–I)', degrees: [2, 5, 1], modes: ['major'] },
  { label: 'Andalúsísk (i–VI–III–VII)', degrees: [1, 6, 3, 7], modes: ['minor'] },
  { label: 'Moll (i–iv–v)', degrees: [1, 4, 5], modes: ['minor'] },
  { label: 'Moll-popp (i–VI–VII)', degrees: [1, 6, 7], modes: ['minor'] },
];

// Diatonic triad quality per scale degree.
const MAJOR = { offsets: [0, 2, 4, 5, 7, 9, 11], quals: ['', 'm', 'm', '', '', 'm', 'dim'] };
const MINOR = { offsets: [0, 2, 3, 5, 7, 8, 10], quals: ['m', 'dim', '', 'm', 'm', '', ''] };

/** The chord names for a progression in a given key (e.g. C + [1,5,6,4] -> C,G,Am,F). */
export function chordsFor(key: KeyOption, degrees: number[]): string[] {
  const t = key.mode === 'major' ? MAJOR : MINOR;
  return degrees.map((d) => {
    const i = (((d - 1) % 7) + 7) % 7;
    const pc = (key.root + t.offsets[i]) % 12;
    return NOTE_NAMES[pc] + t.quals[i];
  });
}

export function progressionsForMode(mode: Mode): Progression[] {
  return PROGRESSIONS.filter((p) => p.modes.includes(mode));
}
