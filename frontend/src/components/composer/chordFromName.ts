import type { Chord, ChordFretPosition } from '../../api/chords';
import { shapeFor } from '../chord-detector/chordShapes';

// Generate a library chord straight from its name (v1: looks the name up in the
// shared chord-shape table). Later this can grow into position/inversion choice
// and the full Chord Editor.

/** Normalize user input to the shape-table's casing: "am" -> "Am", "g7" -> "G7". */
export function normalizeChordName(input: string): string {
  const t = input.trim();
  const m = t.match(/^([a-gA-G])([#b]?)(.*)$/);
  if (!m) return t;
  return m[1].toUpperCase() + m[2] + m[3].toLowerCase();
}

const TYPE_BY_SUFFIX: Record<string, string> = {
  '': 'major',
  m: 'minor',
  '7': '7',
  m7: 'm7',
  maj7: 'maj7',
  dim: 'dim',
  aug: 'aug',
  sus4: 'sus4',
  sus2: 'sus2',
};

/** Split a normalized name into root note + chord type (for display metadata). */
export function parseRootAndType(name: string): { rootNote: string; chordType: string } {
  const m = name.match(/^([A-G][#b]?)(.*)$/);
  const rootNote = m ? m[1] : name;
  const suffix = m ? m[2] : '';
  return { rootNote, chordType: TYPE_BY_SUFFIX[suffix] ?? (suffix || 'major') };
}

/**
 * Convert a shape array (index 0 = low E … 5 = high E; -1 muted, 0 open) to
 * backend fret positions. Backend strings are numbered 1 = high E … 6 = low E,
 * so stringNumber = 6 - index; muted strings are omitted.
 */
export function shapeToFretPositions(frets: number[]): ChordFretPosition[] {
  const positions: ChordFretPosition[] = [];
  for (let i = 0; i < 6; i++) {
    const fret = frets[i];
    if (fret == null || fret < 0) continue; // muted → omit
    positions.push({ stringNumber: 6 - i, fretNumber: fret, finger: 0 });
  }
  return positions;
}

/** Build a Chord (unsaved) from a chord name, or null if we have no shape for it. */
export function chordFromName(input: string): Omit<Chord, 'id'> | null {
  const name = normalizeChordName(input);
  const frets = shapeFor(name);
  if (!frets) return null;
  const { rootNote, chordType } = parseRootAndType(name);
  return { name, rootNote, chordType, fretPositions: shapeToFretPositions(frets) };
}
