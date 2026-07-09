import { useState } from 'react';
import { useChordDetector, NOTE_NAMES } from '../../hooks/useChordDetector';
import { ChordDiagram } from './ChordDiagram';
import { shapeFor } from './chordShapes';

export const ChordDetector: React.FC = () => {
  const [active, setActive] = useState(false);
  const { reading, isListening } = useChordDetector(active);

  // Show the current chord, or hold the last detected one when the sound stops.
  const chord = reading.chord;
  const isLive = reading.hasSignal;
  const chordTones = new Set(chord ? chord.intervals.map((iv) => (chord.root + iv) % 12) : []);
  const confident = chord != null && chord.score >= 0.6;
  const shape = confident ? shapeFor(chord!.name) : null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-slate-100 p-6">
      <h2 className="text-2xl font-bold mt-2 mb-1">Chord Detector</h2>
      <p className="text-slate-400 mb-6 text-sm">Strum a chord and hold it · experimental</p>

      {/* Detected chord */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="font-bold leading-none transition-opacity"
          style={{
            fontSize: 88,
            color: !chord ? '#64748b' : confident ? '#22c55e' : '#f59e0b',
            opacity: chord && !isLive ? 0.6 : 1, // dim when it's a held (frozen) reading
          }}
        >
          {chord ? chord.name : '–'}
        </div>
        <div className="h-6 mt-2 text-lg text-slate-300 font-mono">
          {chord ? chord.notes.join(' · ') : ''}
        </div>
        <div className="h-5 mt-1 text-sm text-slate-500">
          {!isListening
            ? ''
            : !chord
              ? 'Play a chord…'
              : !isLive
                ? '⏸ last detected'
                : confident
                  ? ''
                  : '(unsure)'}
        </div>
      </div>

      {/* Fretboard diagram for the detected chord (a standard shape) */}
      <div className="h-52 mb-4 flex flex-col items-center justify-center">
        {shape ? (
          <>
            <ChordDiagram frets={shape} />
            <span className="mt-1 text-xs text-slate-500">a common shape for {chord!.name}</span>
          </>
        ) : (
          <span className="text-xs text-slate-600">
            {confident ? 'no stock diagram for this chord' : ''}
          </span>
        )}
      </div>

      {/* Chroma bars — energy per pitch class, chord tones highlighted */}
      <div className="flex items-end gap-2 h-40 mb-8">
        {NOTE_NAMES.map((name, i) => {
          const h = Math.round(reading.chroma[i] * 140);
          const isTone = chordTones.has(i);
          return (
            <div key={name} className="flex flex-col items-center justify-end w-8">
              <div
                className={`w-5 rounded-t transition-all ${isTone ? 'bg-green-500' : 'bg-slate-600'}`}
                style={{ height: `${Math.max(2, h)}px` }}
              />
              <span className={`mt-1 text-xs ${isTone ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setActive((a) => !a)}
        className={`px-8 py-3 rounded-lg text-lg font-semibold transition-colors ${
          active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {active ? '■ Stop' : '🎤 Start listening'}
      </button>

      <p className="text-slate-500 text-xs mt-6 max-w-md text-center">
        MVP: recognizes the chord name from the notes it hears (major, minor, sus, dim, aug, 7ths).
        Works best on a clearly strummed, sustained chord — it can't tell your exact fingering.
      </p>
    </div>
  );
};
