import { useCallback } from 'react';
import * as Tone from 'tone';
import type { ChordFretPosition } from '../api/chords';

// Standard guitar tuning (low E to high E)
const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

// A SINGLE synth shared by the whole app. Every ChordCard and the progression
// player route through this one instance, so releaseAll() from any caller cuts
// *all* ringing notes. With a per-hook synth, clicking chord A then chord B left
// A's own synth ringing its half-note out — B's releaseAll couldn't reach it —
// and the two overlapping voices scrambled. One shared synth makes each new
// strum silence whatever came before, regardless of which card triggered it.
let sharedSynth: Tone.PolySynth | null = null;

function getSynth(): Tone.PolySynth {
  if (!sharedSynth) {
    sharedSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();
  }
  return sharedSynth;
}

export const useChordPlayer = () => {
  const playChord = useCallback(async (positions: ChordFretPosition[]) => {
    await Tone.start();
    const synth = getSynth();

    const notes = positionsToNotes(positions);
    if (notes.length === 0) return;

    // Release any still-ringing chord first, then attack a hair later — otherwise
    // overlapping (esp. shared) notes pile up and scramble on quick changes.
    const now = Tone.now();
    synth.releaseAll(now);
    synth.triggerAttackRelease(notes, '2n', now + 0.02);
  }, []);

  const playNote = useCallback(async (stringNumber: number, fret: number) => {
    await Tone.start();
    const synth = getSynth();
    const note = calculateNote(stringNumber, fret);
    synth.triggerAttackRelease([note], '8n');
  }, []);

  /** Cut any currently-ringing notes immediately. */
  const stopAll = useCallback(() => {
    sharedSynth?.releaseAll();
  }, []);

  return { playChord, playNote, stopAll };
};

function positionsToNotes(positions: ChordFretPosition[]): string[] {
  const notes: string[] = [];
  for (let string = 1; string <= 6; string++) {
    const position = positions.find((p) => p.stringNumber === string);
    if (position && position.fretNumber >= 0) {
      notes.push(calculateNote(string, position.fretNumber));
    }
  }
  return notes;
}

function calculateNote(stringNumber: number, fret: number): string {
  // Strings are numbered 1-6 (high E to low E)
  // Array is indexed 0-5 (low E to high E), so reverse
  const stringIndex = 6 - stringNumber;
  const openNote = STANDARD_TUNING[stringIndex];

  if (fret === 0) {
    return openNote;
  }

  // Validate note format (e.g. "E2", "G#3")
  if (!openNote.match(/([A-G]#?)(\d+)/)) return openNote;

  // Calculate new note
  return Tone.Frequency(openNote).transpose(fret).toNote();
}
