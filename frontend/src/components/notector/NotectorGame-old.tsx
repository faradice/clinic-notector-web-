import { useState, useEffect, useCallback, useRef } from 'react';
import { MusicStaff } from './MusicStaff';
import { usePitchDetection } from '../../hooks/usePitchDetection';
import { useMetronome } from '../../hooks/useMetronome';
import type { GameScore } from '../../api/game';
import { gameApi } from '../../api/game';

const AVAILABLE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export const NotectorGame: React.FC = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [repetitions, setRepetitions] = useState(1);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [topScores, setTopScores] = useState<GameScore[]>([]);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);

  const matchTimeoutRef = useRef<NodeJS.Timeout>();

  const { detectedNote, detectedFrequency, isListening, matchesNote } = usePitchDetection(
    gameState === 'playing'
  );

  useMetronome(bpm, metronomeEnabled && gameState === 'playing');

  useEffect(() => {
    loadTopScores();
  }, []);

  const loadTopScores = async () => {
    try {
      const scores = await gameApi.getTopScores();
      setTopScores(scores);
    } catch (error) {
      console.error('Failed to load scores:', error);
    }
  };

  const generateSequence = useCallback(() => {
    const newSequence: string[] = [];
    for (let i = 0; i < 16; i++) {
      const randomNote = AVAILABLE_NOTES[Math.floor(Math.random() * AVAILABLE_NOTES.length)];
      newSequence.push(randomNote);
    }
    return newSequence;
  }, []);

  const startGame = useCallback(() => {
    const newSequence = generateSequence();
    setSequence(newSequence);
    setCurrentIndex(0);
    setScore(0);
    setAttempts(0);
    setCurrentRepetition(0);
    setGameState('playing');
  }, [generateSequence]);

  const stopGame = useCallback(() => {
    setGameState('idle');
    if (matchTimeoutRef.current) {
      clearTimeout(matchTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || !detectedNote) return;

    const currentNote = sequence[currentIndex];
    if (matchesNote(currentNote)) {
      // Correct note detected
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current);
      }

      matchTimeoutRef.current = setTimeout(() => {
        setScore((prev) => prev + 1);
        setAttempts((prev) => prev + 1);

        if (currentIndex + 1 < sequence.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Sequence complete
          if (currentRepetition + 1 < repetitions) {
            setCurrentRepetition((prev) => prev + 1);
            setCurrentIndex(0);
          } else {
            completeGame();
          }
        }
      }, 500); // Require holding note for 500ms
    }
  }, [detectedNote, gameState, sequence, currentIndex, matchesNote, currentRepetition, repetitions]);

  const completeGame = async () => {
    setGameState('completed');

    const totalNotes = sequence.length * repetitions;
    const gameScore: GameScore = {
      playerName: playerName || 'Anonymous',
      score: score,
      totalNotes: totalNotes,
      correctNotes: score,
      bpm: bpm,
      repetitions: repetitions,
    };

    try {
      await gameApi.saveScore(gameScore);
      await loadTopScores();
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  };

  const currentNote = sequence[currentIndex] || 'C4';
  const totalNotes = sequence.length * repetitions;
  const progress = attempts > 0 ? Math.round((attempts / totalNotes) * 100) : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-4 flex-wrap">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your Name"
            disabled={gameState === 'playing'}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">BPM:</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value) || 60)}
              min="10"
              max="120"
              disabled={gameState === 'playing'}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Repeat:</label>
            <input
              type="number"
              value={repetitions}
              onChange={(e) => setRepetitions(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              disabled={gameState === 'playing'}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={metronomeEnabled}
              onChange={(e) => setMetronomeEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Metronome</span>
          </label>

          {gameState === 'idle' && (
            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Start Game
            </button>
          )}

          {gameState === 'playing' && (
            <button
              onClick={stopGame}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Stop
            </button>
          )}

          {gameState === 'completed' && (
            <button
              onClick={startGame}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Play Again
            </button>
          )}

          <div className="ml-auto text-sm text-gray-600">
            {isListening && '🎤 Listening...'}
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {gameState === 'idle' && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notector Ear Training</h2>
              <p className="text-lg text-gray-600 mb-8">
                Sing or play the notes shown on the staff to train your ear!
              </p>
              <p className="text-gray-500">
                16 random notes • Adjustable BPM • Practice repetitions
              </p>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-8 w-full max-w-2xl">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {score} / {totalNotes}
                </div>
                <div className="text-gray-600">
                  Round {currentRepetition + 1} of {repetitions} • Note {currentIndex + 1} of {sequence.length}
                </div>
              </div>

              <div className="flex justify-center">
                <MusicStaff targetNote={currentNote} detectedNote={detectedNote} width={500} height={250} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {detectedFrequency > 0 && (
                <div className="text-center text-sm text-gray-600">
                  Detected: {detectedFrequency.toFixed(1)} Hz
                </div>
              )}
            </div>
          )}

          {gameState === 'completed' && (
            <div className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-green-600">Completed! 🎉</h2>
              <div className="text-2xl text-gray-900">
                Score: {score} / {totalNotes} ({Math.round((score / totalNotes) * 100)}%)
              </div>
              <div className="text-gray-600">
                BPM: {bpm} • Repetitions: {repetitions}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Sidebar */}
      <div className="w-80 bg-white border-l border-gray-300 overflow-y-auto">
        <div className="p-4 border-b border-gray-300">
          <h3 className="text-xl font-bold text-gray-900">Top Scores</h3>
        </div>
        <div className="p-4">
          {topScores.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No scores yet</div>
          ) : (
            <div className="space-y-2">
              {topScores.map((score, index) => (
                <div
                  key={score.id}
                  className={`p-3 rounded-lg border ${
                    index === 0
                      ? 'bg-yellow-50 border-yellow-300'
                      : index === 1
                      ? 'bg-gray-100 border-gray-300'
                      : index === 2
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                      <span className="font-semibold text-gray-900">
                        {score.playerName || 'Anonymous'}
                      </span>
                    </div>
                    <span className="font-bold text-blue-600">{score.score}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {score.correctNotes}/{score.totalNotes} • {score.bpm} BPM • {score.repetitions}x
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
