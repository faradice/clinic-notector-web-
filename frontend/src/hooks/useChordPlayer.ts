import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import type { ChordFretPosition } from '../api/chords';

// Standard guitar tuning (low E to high E)
const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export const useChordPlayer = () => {
  const synthRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    // Initialize PolySynth with a clean guitar-like sound
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
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

    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const playChord = useCallback(async (positions: ChordFretPosition[]) => {
    if (!synthRef.current) return;

    // Ensure audio context is started
    await Tone.start();

    // Convert fret positions to notes
    const notes: string[] = [];

    for (let string = 1; string <= 6; string++) {
      const position = positions.find(p => p.stringNumber === string);

      if (position && position.fretNumber >= 0) {
        const note = calculateNote(string, position.fretNumber);
        notes.push(note);
      }
    }

    if (notes.length > 0) {
      // Play all notes simultaneously
      synthRef.current.triggerAttackRelease(notes, '2n');
    }
  }, []);

  const playNote = useCallback(async (stringNumber: number, fret: number) => {
    if (!synthRef.current) return;

    await Tone.start();

    const note = calculateNote(stringNumber, fret);
    synthRef.current.triggerAttackRelease([note], '8n');
  }, []);

  return { playChord, playNote };
};

function calculateNote(stringNumber: number, fret: number): string {
  // Strings are numbered 1-6 (high E to low E)
  // Array is indexed 0-5 (low E to high E), so reverse
  const stringIndex = 6 - stringNumber;
  const openNote = STANDARD_TUNING[stringIndex];

  if (fret === 0) {
    return openNote;
  }

  // Parse note and octave
  const match = openNote.match(/([A-G]#?)(\d+)/);
  if (!match) return openNote;

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);

  // Calculate new note
  return Tone.Frequency(openNote).transpose(fret).toNote();
}
