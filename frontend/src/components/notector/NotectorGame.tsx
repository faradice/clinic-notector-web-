import { useState, useEffect, useCallback, useRef } from 'react';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useMetronome } from '../../hooks/useMetronome';

// Basic notes for highest 3 guitar strings practice
const BASIC_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

// Difficulty levels
type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

interface LevelConfig {
  name: string;
  description: string;
  noteCount: number;
  repeatUntilPerfect: boolean;
}

const LEVELS: Record<DifficultyLevel, LevelConfig> = {
  beginner: {
    name: 'Beginner',
    description: 'Same 4 notes until all correct',
    noteCount: 4,
    repeatUntilPerfect: true,
  },
  elementary: {
    name: 'Elementary',
    description: '4 notes, failed notes retry',
    noteCount: 4,
    repeatUntilPerfect: false,
  },
  intermediate: {
    name: 'Intermediate',
    description: '8 notes, faster pace',
    noteCount: 8,
    repeatUntilPerfect: false,
  },
  advanced: {
    name: 'Advanced',
    description: '12 notes, full range',
    noteCount: 12,
    repeatUntilPerfect: false,
  },
  expert: {
    name: 'Expert',
    description: '16 notes, mastery challenge',
    noteCount: 16,
    repeatUntilPerfect: false,
  },
};

interface NoteState {
  note: string;
  status: 'pending' | 'active' | 'correct' | 'missed';
  barIndex: number;
}

export const NotectorGame: React.FC = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [level, setLevel] = useState<DifficultyLevel>('beginner');
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [bpm, setBpm] = useState(60);
  const [failedNotes, setFailedNotes] = useState<string[]>([]);
  const [currentSequence, setCurrentSequence] = useState<string[]>([]); // For beginner mode

  const beatTimeoutRef = useRef<NodeJS.Timeout>();
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const matchedRef = useRef(false);

  const { detectedNote, isListening, matchesNote } = usePitchDetection(gameState === 'playing');
  useMetronome(bpm, gameState === 'playing');

  const levelConfig = LEVELS[level];

  // Generate notes based on level
  const generateNotes = useCallback((useExistingSequence = false) => {
    const newNotes: NoteState[] = [];
    let notesToUse: string[];

    if (levelConfig.repeatUntilPerfect && useExistingSequence && currentSequence.length > 0) {
      // Beginner mode: reuse same sequence
      notesToUse = [...currentSequence];
    } else {
      // Generate new sequence
      if (!levelConfig.repeatUntilPerfect) {
        // Include failed notes from previous round
        notesToUse = [...failedNotes];
      } else {
        notesToUse = [];
      }

      // Add random notes to reach target count
      while (notesToUse.length < levelConfig.noteCount) {
        const randomNote = BASIC_NOTES[Math.floor(Math.random() * BASIC_NOTES.length)];
        notesToUse.push(randomNote);
      }

      // Shuffle
      notesToUse = notesToUse.sort(() => Math.random() - 0.5).slice(0, levelConfig.noteCount);

      // Save sequence for beginner mode
      if (levelConfig.repeatUntilPerfect) {
        setCurrentSequence(notesToUse);
      }
    }

    // Create note states (only showing first 4 in display)
    notesToUse.forEach((note, index) => {
      newNotes.push({
        note,
        status: 'pending',
        barIndex: index % 4, // Distribute across 4 bars
      });
    });

    return newNotes;
  }, [levelConfig, failedNotes, currentSequence]);

  const startGame = useCallback(() => {
    const newNotes = generateNotes(false);
    setNotes(newNotes);
    setCurrentNoteIndex(0);
    setScore(0);
    setRoundNumber(1);
    setFailedNotes([]);
    setGameState('playing');
    matchedRef.current = false;

    // Activate first note immediately
    setNotes(prev => prev.map((n, i) =>
      i === 0 ? { ...n, status: 'active' } : n
    ));

    // Schedule beat progression
    scheduleBeat(0);
  }, [generateNotes]);

  const startNextRound = useCallback(() => {
    const hasFailedNotes = notes.some(n => n.status === 'missed');

    if (levelConfig.repeatUntilPerfect && hasFailedNotes) {
      // Beginner mode: repeat same sequence
      const newNotes = generateNotes(true);
      setNotes(newNotes);
    } else {
      // Other modes: generate new sequence
      const newNotes = generateNotes(false);
      setNotes(newNotes);
      setFailedNotes([]); // Clear failed notes after using them
    }

    setCurrentNoteIndex(0);
    setRoundNumber(prev => prev + 1);
    setGameState('playing');
    matchedRef.current = false;

    // Activate first note
    setNotes(prev => prev.map((n, i) =>
      i === 0 ? { ...n, status: 'active' } : n
    ));

    // Schedule beat progression
    scheduleBeat(0);
  }, [notes, levelConfig, generateNotes]);

  const scheduleBeat = (noteIndex: number) => {
    const displayCount = Math.min(levelConfig.noteCount, 4); // Show max 4 bars at once

    if (noteIndex >= displayCount) {
      // Round complete
      finishRound();
      return;
    }

    const beatDuration = (60 / bpm) * 1000;

    beatTimeoutRef.current = setTimeout(() => {
      // Check if current note was matched
      if (!matchedRef.current) {
        // Missed the note
        setNotes(prev => prev.map((n, i) =>
          i === noteIndex ? { ...n, status: 'missed' } : n
        ));
        setFailedNotes(prev => {
          const note = notes[noteIndex]?.note;
          return note ? [...prev, note] : prev;
        });
      }

      matchedRef.current = false;

      // Move to next note
      const nextIndex = noteIndex + 1;
      setCurrentNoteIndex(nextIndex);

      if (nextIndex < displayCount) {
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
    setGameState('paused');

    // Short pause before next round (2 seconds)
    pauseTimeoutRef.current = setTimeout(() => {
      startNextRound();
    }, 2000);
  };

  const stopGame = useCallback(() => {
    setGameState('idle');
    if (beatTimeoutRef.current) {
      clearTimeout(beatTimeoutRef.current);
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
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
    }
  }, [detectedNote, gameState, notes, currentNoteIndex, matchesNote]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (beatTimeoutRef.current) clearTimeout(beatTimeoutRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  const displayNotes = notes.slice(0, 4); // Always show max 4 bars

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-6 flex-wrap">
        {/* Level Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Level:</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
            disabled={gameState === 'playing' || gameState === 'paused'}
            className="px-4 py-2 border border-gray-300 rounded-lg text-base font-semibold"
          >
            {Object.entries(LEVELS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{levelConfig.description}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">BPM:</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 60)}
            min="30"
            max="180"
            disabled={gameState === 'playing' || gameState === 'paused'}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Round:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{roundNumber}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Score:</span>
            <span className="ml-2 text-2xl font-bold text-green-600">{score}</span>
          </div>
        </div>

        {gameState === 'idle' && (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Start Practice
          </button>
        )}

        {(gameState === 'playing' || gameState === 'paused') && (
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
            <div className="space-y-3 text-left max-w-2xl mx-auto">
              {Object.entries(LEVELS).map(([key, config]) => (
                <div key={key} className="p-4 bg-white rounded-lg border border-gray-300">
                  <div className="font-semibold text-gray-900">{config.name}</div>
                  <div className="text-gray-600">{config.description}</div>
                </div>
              ))}
            </div>
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
              {displayNotes.map((noteState, index) => {
                const x = 280 + index * 235;
                const noteY = getNoteY(noteState.note);

                let fill = '#666';
                let stroke = '#333';

                if (noteState.status === 'active') {
                  fill = '#3b82f6';
                  stroke = '#1e40af';
                } else if (noteState.status === 'correct') {
                  fill = '#22c55e';
                  stroke = '#16a34a';
                } else if (noteState.status === 'missed') {
                  fill = '#ef4444';
                  stroke = '#dc2626';
                }

                // Determine if we need ledger lines
                const needsLedgerLines: number[] = [];
                if (noteY >= 250) {
                  // Below staff - add ledger lines at 250, 280, etc.
                  for (let y = 250; y <= noteY; y += 30) {
                    needsLedgerLines.push(y);
                  }
                } else if (noteY <= 85) {
                  // Above staff - add ledger lines at 85, 55, etc.
                  for (let y = 85; y >= noteY; y -= 30) {
                    needsLedgerLines.push(y);
                  }
                }

                return (
                  <g key={index}>
                    {/* Ledger lines */}
                    {needsLedgerLines.map((y) => (
                      <line
                        key={`ledger-${index}-${y}`}
                        x1={x - 25}
                        y1={y}
                        x2={x + 25}
                        y2={y}
                        stroke="#000"
                        strokeWidth={2}
                      />
                    ))}

                    <ellipse
                      cx={x}
                      cy={noteY}
                      rx={18}
                      ry={14}
                      fill={noteState.status === 'pending' ? '#fff' : fill}
                      stroke={stroke}
                      strokeWidth={3}
                    />
                    <text
                      x={x}
                      y={noteY + 60}
                      textAnchor="middle"
                      fontSize="24"
                      fontWeight="bold"
                      fill={stroke}
                    >
                      {noteState.note.replace(/[0-9]/g, '')}
                    </text>
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

            {/* Status Messages */}
            {gameState === 'playing' && (
              <div className="mt-8 text-center">
                <p className="text-2xl font-semibold text-gray-700">
                  {levelConfig.name} Level - Round {roundNumber}
                </p>
                <p className="text-lg text-gray-500 mt-2">
                  Watch for the blue note - that's your cue to play!
                </p>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="mt-8 text-center">
                <p className="text-3xl font-bold text-blue-600 animate-pulse">
                  Get Ready for Round {roundNumber + 1}...
                </p>
                <p className="text-lg text-gray-600 mt-2">
                  {notes.every(n => n.status === 'correct') ? (
                    <span className="text-green-600 font-semibold">Perfect! All notes correct! 🎉</span>
                  ) : (
                    levelConfig.repeatUntilPerfect ? (
                      <span className="text-orange-600 font-semibold">
                        Repeating same notes until all correct
                      </span>
                    ) : (
                      <span className="text-gray-600">
                        Missed notes will appear in next round
                      </span>
                    )
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate note Y position on staff
// Standard treble clef: Lines (bottom to top) = E, G, B, D, F
// Spaces (bottom to top) = F, A, C, E
function getNoteY(note: string): number {
  const positions: { [key: string]: number } = {
    // Above staff
    'A5': 70,   // space above
    'G5': 85,   // ledger line above
    'F5': 100,  // top line
    'E5': 115,  // space
    'D5': 130,  // line
    'C5': 145,  // space
    'B4': 160,  // middle line
    'A4': 175,  // space
    'G4': 190,  // line
    'F4': 205,  // space
    'E4': 220,  // bottom line
    'D4': 235,  // space below
    'C4': 250,  // ledger line below
    'B3': 265,  // space below
    'A3': 280,  // ledger line below
  };
  return positions[note] || 160;
}
