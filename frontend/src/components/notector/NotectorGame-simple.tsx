import { useState, useEffect, useCallback, useRef } from 'react';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useMetronome } from '../../hooks/useMetronome';

// Basic notes for highest 3 guitar strings practice
const BASIC_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

interface NoteState {
  note: string;
  status: 'pending' | 'active' | 'correct' | 'missed';
  barIndex: number;
}

export const NotectorGame: React.FC = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing'>('idle');
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [failedNotes, setFailedNotes] = useState<string[]>([]);

  const beatTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const matchedRef = useRef(false);

  const { detectedNote, isListening, matchesNote } = usePitchDetection(gameState === 'playing');
  useMetronome(bpm, gameState === 'playing');

  // Generate 4 notes (1 per bar)
  const generateNotes = useCallback(() => {
    const newNotes: NoteState[] = [];

    // Include failed notes from previous round
    const notesToUse = [...failedNotes];

    // Add random notes to make 4 total
    while (notesToUse.length < 4) {
      const randomNote = BASIC_NOTES[Math.floor(Math.random() * BASIC_NOTES.length)];
      notesToUse.push(randomNote);
    }

    // Shuffle and create note states
    const shuffled = notesToUse.sort(() => Math.random() - 0.5).slice(0, 4);
    shuffled.forEach((note, index) => {
      newNotes.push({
        note,
        status: 'pending',
        barIndex: index,
      });
    });

    return newNotes;
  }, [failedNotes]);

  const startGame = useCallback(() => {
    const newNotes = generateNotes();
    setNotes(newNotes);
    setCurrentNoteIndex(0);
    setGameState('playing');
    matchedRef.current = false;

    // Activate first note immediately
    setNotes(prev => prev.map((n, i) =>
      i === 0 ? { ...n, status: 'active' } : n
    ));

    // Schedule beat progression
    scheduleBeat(0);
  }, [generateNotes]);

  const scheduleBeat = (noteIndex: number) => {
    if (noteIndex >= 4) {
      // Round complete
      finishRound();
      return;
    }

    const beatDuration = (60 / bpm) * 1000; // Convert BPM to milliseconds

    beatTimeoutRef.current = setTimeout(() => {
      // Check if current note was matched
      if (!matchedRef.current) {
        // Missed the note
        setNotes(prev => prev.map((n, i) =>
          i === noteIndex ? { ...n, status: 'missed' } : n
        ));
        setFailedNotes(prev => [...prev, notes[noteIndex]?.note].filter(Boolean));
      }

      matchedRef.current = false;

      // Move to next note
      const nextIndex = noteIndex + 1;
      setCurrentNoteIndex(nextIndex);

      if (nextIndex < 4) {
        setNotes(prev => prev.map((n, i) =>
          i === nextIndex ? { ...n, status: 'active' } : n
        ));
        scheduleBeat(nextIndex);
      } else {
        finishRound();
      }
    }, beatDuration);
  };

  const finishRound = () => {
    setGameState('idle');
    // Keep the display showing results
    setTimeout(() => {
      // Auto-start next round after showing results
      if (confirm('Round complete! Start next round?')) {
        startGame();
      }
    }, 1000);
  };

  const stopGame = useCallback(() => {
    setGameState('idle');
    if (beatTimeoutRef.current) {
      clearTimeout(beatTimeoutRef.current);
    }
  }, []);

  // Check for note matches
  useEffect(() => {
    if (gameState !== 'playing' || !detectedNote || matchedRef.current) return;

    const currentNote = notes[currentNoteIndex];
    if (!currentNote || currentNote.status !== 'active') return;

    if (matchesNote(currentNote.note)) {
      // Correct note!
      matchedRef.current = true;
      setScore(prev => prev + 1);
      setNotes(prev => prev.map((n, i) =>
        i === currentNoteIndex ? { ...n, status: 'correct' } : n
      ));

      // Remove from failed notes if it was there
      setFailedNotes(prev => prev.filter(n => n !== currentNote.note));
    }
  }, [detectedNote, gameState, notes, currentNoteIndex, matchesNote]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (beatTimeoutRef.current) {
        clearTimeout(beatTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">BPM:</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 60)}
            min="30"
            max="180"
            disabled={gameState === 'playing'}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Score:</span>
          <span className="text-2xl font-bold text-blue-600">{score}</span>
        </div>

        {gameState === 'idle' && (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Start Practice
          </button>
        )}

        {gameState === 'playing' && (
          <button
            onClick={stopGame}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Stop
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-gray-600">
          {isListening && (
            <>
              <span className="text-2xl">🎤</span>
              <span className="font-medium">Listening...</span>
              {detectedNote && (
                <span className="text-blue-600 font-semibold">({detectedNote})</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {gameState === 'idle' && notes.length === 0 ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Notector Practice</h2>
            <p className="text-xl text-gray-600 mb-8">
              Practice notes C, D, E, F, G, A, B on the highest 3 strings
            </p>
            <p className="text-gray-500">
              4 bars • 1 whole note per bar • Set your BPM and start!
            </p>
          </div>
        ) : (
          <div className="w-full max-w-6xl">
            {/* Music Staff with 4 Bars */}
            <svg width="100%" height="400" viewBox="0 0 1200 400" className="bg-white rounded-lg border-2 border-gray-300 shadow-lg">
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((lineIndex) => (
                <line
                  key={`staff-${lineIndex}`}
                  x1={80}
                  y1={100 + lineIndex * 30}
                  x2={1120}
                  y2={100 + lineIndex * 30}
                  stroke="#000"
                  strokeWidth={2}
                />
              ))}

              {/* Treble clef */}
              <text x={90} y={160} fontSize="72" fontFamily="serif">
                🎼
              </text>

              {/* Bar lines */}
              {[0, 1, 2, 3, 4].map((barIndex) => (
                <line
                  key={`bar-${barIndex}`}
                  x1={180 + barIndex * 235}
                  y1={100}
                  x2={180 + barIndex * 235}
                  y2={220}
                  stroke="#000"
                  strokeWidth={barIndex === 4 ? 4 : 2}
                />
              ))}

              {/* Notes */}
              {notes.map((noteState, index) => {
                const x = 280 + index * 235;
                const noteY = getNoteY(noteState.note);

                let fill = '#666'; // pending
                let stroke = '#333';

                if (noteState.status === 'active') {
                  fill = '#3b82f6'; // blue
                  stroke = '#1e40af';
                } else if (noteState.status === 'correct') {
                  fill = '#22c55e'; // green
                  stroke = '#16a34a';
                } else if (noteState.status === 'missed') {
                  fill = '#ef4444'; // red
                  stroke = '#dc2626';
                }

                return (
                  <g key={index}>
                    {/* Whole note (hollow oval) */}
                    <ellipse
                      cx={x}
                      cy={noteY}
                      rx={18}
                      ry={14}
                      fill={noteState.status === 'pending' ? '#fff' : fill}
                      stroke={stroke}
                      strokeWidth={3}
                    />

                    {/* Note name below */}
                    <text
                      x={x}
                      y={noteY + 60}
                      textAnchor="middle"
                      fontSize="24"
                      fontWeight="bold"
                      fill={stroke}
                    >
                      {noteState.note.replace('4', '')}
                    </text>

                    {/* Bar number */}
                    <text
                      x={x}
                      y={80}
                      textAnchor="middle"
                      fontSize="16"
                      fill="#666"
                    >
                      Bar {index + 1}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(80, 320)">
                <text fontSize="18" fontWeight="bold" fill="#333">Legend:</text>
                <circle cx={80} cy={-3} r={10} fill="#fff" stroke="#333" strokeWidth={2} />
                <text x={100} fontSize="16" fill="#666">= Pending</text>

                <circle cx={220} cy={-3} r={10} fill="#3b82f6" stroke="#1e40af" strokeWidth={2} />
                <text x={240} fontSize="16" fill="#666">= Play Now!</text>

                <circle cx={380} cy={-3} r={10} fill="#22c55e" stroke="#16a34a" strokeWidth={2} />
                <text x={400} fontSize="16" fill="#666">= Correct</text>

                <circle cx={520} cy={-3} r={10} fill="#ef4444" stroke="#dc2626" strokeWidth={2} />
                <text x={540} fontSize="16" fill="#666">= Missed</text>
              </g>
            </svg>

            {/* Instructions */}
            {gameState === 'playing' && (
              <div className="mt-8 text-center">
                <p className="text-2xl font-semibold text-gray-700">
                  Watch for the blue note - that's your cue to play!
                </p>
                <p className="text-lg text-gray-500 mt-2">
                  Notes change every {(60 / bpm).toFixed(1)} seconds at {bpm} BPM
                </p>
              </div>
            )}

            {gameState === 'idle' && notes.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-3xl font-bold text-gray-800">
                  Round Complete! Score: {score} / 4
                </p>
                {failedNotes.length > 0 && (
                  <p className="text-lg text-gray-600 mt-2">
                    Missed notes will appear in the next round: {failedNotes.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate note Y position on staff
function getNoteY(note: string): number {
  const positions: { [key: string]: number } = {
    'B4': 100,  // Above staff
    'A4': 115,
    'G4': 130,
    'F4': 145,
    'E4': 160,  // Middle line
    'D4': 175,
    'C4': 190,
    'B3': 205,  // Below staff
    'A3': 220,
  };
  return positions[note] || 160;
}
