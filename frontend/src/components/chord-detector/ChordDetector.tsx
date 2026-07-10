import { useState, useEffect } from 'react';
import { useChordDetector, NOTE_NAMES } from '../../hooks/useChordDetector';
import { ChordDiagram } from './ChordDiagram';
import { shapeFor } from './chordShapes';
import { chordFromName } from '../composer/chordFromName';
import { chordApi, type Chord } from '../../api/chords';

export const ChordDetector: React.FC = () => {
  const [active, setActive] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const { reading, isListening } = useChordDetector(active);

  // Show the current chord, or hold the last detected one when the sound stops.
  const chord = reading.chord;
  const isLive = reading.hasSignal;
  const chordTones = new Set(chord ? chord.intervals.map((iv) => (chord.root + iv) % 12) : []);
  const confident = chord != null && chord.score >= 0.6;
  const shape = confident ? shapeFor(chord!.name) : null;

  // Clear the add-status whenever the detected chord changes.
  useEffect(() => setAddStatus(null), [chord?.name]);

  // Add the detected chord to the Composer's chord library (needs a known shape).
  const handleAddToLibrary = async () => {
    if (!chord) return;
    const gen = chordFromName(chord.name);
    if (!gen) { setAddStatus('Ekkert grip til að vista fyrir þennan hljóm'); return; }
    try {
      const existing = await chordApi.getByName(chord.name).catch(() => null);
      if (existing) { setAddStatus(`„${chord.name}“ er þegar í safninu`); return; }
      await chordApi.create(gen as Chord);
      setAddStatus(`Bætti ${chord.name} í safnið ✓`);
    } catch (e) {
      console.error('Failed to add chord to library', e);
      setAddStatus('Tókst ekki að bæta við');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-slate-100 p-6">
      <h2 className="text-2xl font-bold mt-2 mb-1">Hljómagreinir</h2>
      <p className="text-slate-400 mb-6 text-sm">Sláðu hljóm og haltu honum · á tilraunastigi</p>

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
              ? 'Spilaðu hljóm…'
              : !isLive
                ? '⏸ síðast greint'
                : confident
                  ? ''
                  : '(óviss)'}
        </div>
      </div>

      {/* Fretboard diagram for the detected chord (a standard shape) */}
      <div className="h-52 mb-4 flex flex-col items-center justify-center">
        {shape ? (
          <>
            <ChordDiagram frets={shape} />
            <span className="mt-1 text-xs text-slate-500">algengt grip fyrir {chord!.name}</span>
            <button
              onClick={handleAddToLibrary}
              className="mt-2 px-3 py-1.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold"
            >
              ＋ Bæta {chord!.name} í safnið
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-600">
            {confident ? 'ekkert grip til fyrir þennan hljóm' : ''}
          </span>
        )}
      </div>
      <div className="h-5 mb-3 text-sm text-slate-400">{addStatus}</div>

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
        {active ? '■ Stöðva' : '🎤 Byrja að hlusta'}
      </button>

      <p className="text-slate-500 text-xs mt-6 max-w-md text-center">
        Frumgerð: þekkir heiti hljómsins út frá nótunum sem heyrast (dúr, moll, sus, dim, aug, 7-undir).
        Virkar best á skýrt slegnum hljómi sem er haldið — það getur ekki lesið nákvæmt gripið þitt.
      </p>
    </div>
  );
};
