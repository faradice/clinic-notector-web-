import { useState, useEffect, useCallback, useRef } from 'react';
import { useTuner } from '../../hooks/useTuner';
import { useMetronome } from '../../hooks/useMetronome';
import { customBarApi, type CustomBar } from '../../api/customBars';

// Basic notes for highest 3 guitar strings practice
const BASIC_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const BAR_LENGTH = 4; // notes per bar shown on the staff

// Difficulty levels
type DifficultyLevel = 'muscle' | 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert';

interface LevelConfig {
  name: string;
  description: string;
  noteCount: number;
  repeatUntilPerfect: boolean;
  fixedBar?: boolean; // always replay the exact same bar (muscle-memory practice)
}

const LEVELS: Record<DifficultyLevel, LevelConfig> = {
  muscle: {
    name: 'Vöðvaminni',
    description: 'Einn taktur, endurtekinn stanslaust',
    noteCount: 4,
    repeatUntilPerfect: false,
    fixedBar: true,
  },
  beginner: {
    name: 'Byrjandi',
    description: 'Sömu 4 nótur þar til allt er rétt',
    noteCount: 4,
    repeatUntilPerfect: true,
  },
  elementary: {
    name: 'Grunnstig',
    description: '4 nótur, rangar nótur endurteknar',
    noteCount: 4,
    repeatUntilPerfect: false,
  },
  intermediate: {
    name: 'Miðstig',
    description: '8 nótur, hraðari',
    noteCount: 8,
    repeatUntilPerfect: false,
  },
  advanced: {
    name: 'Framhaldsstig',
    description: '12 nótur, allt sviðið',
    noteCount: 12,
    repeatUntilPerfect: false,
  },
  expert: {
    name: 'Meistarastig',
    description: '16 nótur, áskorun',
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
  const [gameState, setGameState] = useState<'idle' | 'playing'>('idle');
  const [level, setLevel] = useState<DifficultyLevel>('beginner');
  const [notes, setNotes] = useState<NoteState[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [bpm, setBpm] = useState(30); // tempo: one metronome click per note; lower = more time per note
  const [showNoteNames, setShowNoteNames] = useState(false); // reveal note letters (toggle mid-practice)
  const [failedNotes, setFailedNotes] = useState<string[]>([]);
  const [currentSequence, setCurrentSequence] = useState<string[]>([]); // For beginner mode
  const [isRepeatingBar, setIsRepeatingBar] = useState(false); // Beginner: is the current bar a repeat?
  // How the player answers: 'listen' = app hears the guitar via mic; 'pick' = type the note name.
  const [inputMode, setInputMode] = useState<'pick' | 'listen'>('listen');
  const [tickVolume, setTickVolume] = useState(0.7); // metronome tick volume, 0..1 (0 = muted)
  const lastTickVolumeRef = useRef(0.7); // remembers level to restore when unmuting
  // Muscle Memory custom bars (persisted in the backend)
  const [savedBars, setSavedBars] = useState<CustomBar[]>([]);
  const [barSource, setBarSource] = useState<number | 'random'>('random'); // selected bar id, or random
  const [builderNotes, setBuilderNotes] = useState<string[]>([]); // bar being composed
  const [builderName, setBuilderName] = useState('');

  const beatTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const matchedRef = useRef(false);
  // Listen mode: how many consecutive frames the same letter has been detected.
  // A plucked string holds its pitch; a stray transient (e.g. metronome bleed)
  // flits, so we only accept a note once its letter has held for a couple frames.
  const stableNoteRef = useRef<{ letter: string | null; count: number }>({ letter: null, count: 0 });
  // Refs mirror the latest state so the setTimeout-driven beat chain (which
  // closes over stale render values) always reads current data.
  const notesRef = useRef<NoteState[]>([]);
  const currentSequenceRef = useRef<string[]>([]);

  // Listen mode shares the tuner's detector (accurate, low-string capable).
  // echoCancellation on: the browser subtracts our own metronome tick from the
  // mic so it can't be mistaken for a played note.
  const { reading, isListening } = useTuner(
    gameState === 'playing' && inputMode === 'listen',
    true,
  );
  const detectedNote = reading.note ? `${reading.note}${reading.octave}` : null;
  const matchesNote = useCallback(
    (target: string) => {
      if (!reading.note) return false;
      // Octave-agnostic: any octave of the right letter counts (e.g. low E2 or
      // high E4 both match a target of 'E'). Nearest-note gives ~±50¢ slack too.
      const letter = target.replace(/[0-9]/g, '');
      return reading.note === letter;
    },
    [reading],
  );
  useMetronome(bpm, gameState === 'playing', tickVolume);

  const levelConfig = LEVELS[level];

  // Keep refs in sync with state for use inside timeout callbacks.
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  useEffect(() => {
    currentSequenceRef.current = currentSequence;
  }, [currentSequence]);

  // Load saved custom bars once.
  const loadBars = useCallback(async () => {
    try {
      setSavedBars(await customBarApi.getAll());
    } catch (e) {
      console.error('Failed to load custom bars', e);
    }
  }, []);
  useEffect(() => {
    loadBars();
  }, [loadBars]);

  // Choose which bar Muscle Memory loops: a saved bar (by id) or a fresh random one.
  const selectBarSource = useCallback((source: number | 'random') => {
    setBarSource(source);
    if (source === 'random') {
      setCurrentSequence([]); // cleared → startGame generates a random bar
    } else {
      const bar = savedBars.find(b => b.id === source);
      if (bar) setCurrentSequence(bar.notes.slice(0, BAR_LENGTH));
    }
  }, [savedBars]);

  const saveBuilderBar = useCallback(async () => {
    if (builderNotes.length === 0 || !builderName.trim()) return;
    try {
      const created = await customBarApi.create({ name: builderName.trim(), notes: builderNotes });
      setBuilderNotes([]);
      setBuilderName('');
      await loadBars();
      if (created.id != null) selectBarSource(created.id);
    } catch (e) {
      console.error('Failed to save custom bar', e);
    }
  }, [builderNotes, builderName, loadBars, selectBarSource]);

  const deleteBar = useCallback(async (id: number) => {
    try {
      await customBarApi.delete(id);
      if (barSource === id) selectBarSource('random');
      await loadBars();
    } catch (e) {
      console.error('Failed to delete custom bar', e);
    }
  }, [barSource, loadBars, selectBarSource]);

  // Generate notes based on level
  const generateNotes = useCallback((useExistingSequence = false) => {
    const newNotes: NoteState[] = [];
    let notesToUse: string[];

    if ((levelConfig.repeatUntilPerfect || levelConfig.fixedBar) && useExistingSequence && currentSequenceRef.current.length > 0) {
      // Beginner / Muscle Memory: reuse the exact same sequence, same order
      notesToUse = [...currentSequenceRef.current];
    } else {
      // Generate new sequence
      if (!levelConfig.repeatUntilPerfect && !levelConfig.fixedBar) {
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

      // Remember the sequence for modes that replay the same bar
      if (levelConfig.repeatUntilPerfect || levelConfig.fixedBar) {
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
  }, [levelConfig, failedNotes]);

  const startGame = useCallback(() => {
    // Muscle Memory: a saved bar stays fixed; "Random" re-rolls a fresh bar each start.
    const reuseExisting =
      !!levelConfig.fixedBar && barSource !== 'random' && currentSequenceRef.current.length > 0;
    const newNotes = generateNotes(reuseExisting);
    setNotes(newNotes);
    setCurrentNoteIndex(0);
    setScore(0);
    setRoundNumber(1);
    setFailedNotes([]);
    setIsRepeatingBar(false);
    setGameState('playing');
    matchedRef.current = false;

    // Activate first note immediately
    setNotes(prev => prev.map((n, i) =>
      i === 0 ? { ...n, status: 'active' } : n
    ));

    // Schedule beat progression
    scheduleBeat(0);
  }, [generateNotes, levelConfig, barSource]);

  const startNextRound = useCallback(() => {
    // Read the round's final statuses from the ref (the state closure here is stale).
    const roundNotes = notesRef.current;
    const allCorrect = roundNotes.length > 0 && roundNotes.every(n => n.status === 'correct');

    if (levelConfig.fixedBar) {
      // Muscle Memory: always replay the exact same bar, non-stop
      const newNotes = generateNotes(true);
      setNotes(newNotes);
    } else if (levelConfig.repeatUntilPerfect && !allCorrect) {
      // Beginner mode: keep the exact same bar until every note is correct
      const newNotes = generateNotes(true);
      setNotes(newNotes);
      setIsRepeatingBar(true);
    } else {
      // Perfect round (or non-beginner level): move on to a new pattern
      const newNotes = generateNotes(false);
      setNotes(newNotes);
      setFailedNotes([]); // Clear failed notes after using them
      setIsRepeatingBar(false);
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
  }, [levelConfig, generateNotes]);

  const scheduleBeat = (noteIndex: number) => {
    const displayCount = Math.min(levelConfig.noteCount, 4); // Show max 4 bars at once

    if (noteIndex >= displayCount) {
      // Round complete
      finishRound();
      return;
    }

    // One note per beat = one metronome click per note. Slower tempo → longer
    // window to play each note (anywhere within it counts).
    const beatDuration = (60 / bpm) * 1000;

    beatTimeoutRef.current = setTimeout(() => {
      // Check if current note was matched
      if (!matchedRef.current) {
        // Missed the note
        setNotes(prev => prev.map((n, i) =>
          i === noteIndex ? { ...n, status: 'missed' } : n
        ));
        setFailedNotes(prev => {
          const note = notesRef.current[noteIndex]?.note;
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
    // Continuous play: roll straight into the next round on the next beat,
    // no pause — the metronome and notes never stop.
    startNextRound();
  };

  const stopGame = useCallback(() => {
    setGameState('idle');
    if (beatTimeoutRef.current) {
      clearTimeout(beatTimeoutRef.current);
    }
  }, []);

  // Check for note matches (Listen mode). Runs every frame the reading updates so
  // we can track how long a pitch has been held — hence `reading` in the deps,
  // not the memoized `detectedNote` string (which wouldn't re-fire while stable).
  useEffect(() => {
    if (gameState !== 'playing' || inputMode !== 'listen') return;

    // Track pitch stability across frames.
    const letter = reading.note;
    const stable = stableNoteRef.current;
    if (!letter) {
      stable.letter = null;
      stable.count = 0;
      return;
    }
    if (stable.letter === letter) stable.count++;
    else { stable.letter = letter; stable.count = 1; }

    if (matchedRef.current) return;
    const currentNote = notes[currentNoteIndex];
    if (!currentNote || currentNote.status !== 'active') return;

    // Require the pitch to have held for 2+ frames before it counts — rejects
    // the metronome tick's transient, which never sustains a single letter.
    if (stable.count < 2) return;

    if (matchesNote(currentNote.note)) {
      // Correct note!
      matchedRef.current = true;
      setScore(prev => prev + 1);
      setNotes(prev => prev.map((n, i) =>
        i === currentNoteIndex ? { ...n, status: 'correct' } : n
      ));
    }
  }, [reading, gameState, inputMode, notes, currentNoteIndex, matchesNote]);

  // PICK mode: answer the active note by typing its letter name (case-insensitive).
  // Wrong letters are ignored — the beat timer still decides a miss, same as Listen mode.
  useEffect(() => {
    if (inputMode !== 'pick' || gameState !== 'playing') return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.length !== 1 || !'ABCDEFG'.includes(key)) return;
      if (matchedRef.current) return;
      const idx = notesRef.current.findIndex(n => n.status === 'active');
      if (idx === -1) return;
      const activeLetter = notesRef.current[idx].note.replace(/[0-9]/g, '').toUpperCase();
      if (key !== activeLetter) return;
      e.preventDefault();
      matchedRef.current = true;
      setScore(prev => prev + 1);
      setNotes(prev => prev.map((n, i) => (i === idx ? { ...n, status: 'correct' } : n)));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inputMode, gameState]);

  // DEV-ONLY: press "M" to force-match the active note, so the game can be
  // tested without a microphone/guitar. Stripped from production builds.
  useEffect(() => {
    if (!import.meta.env.DEV || gameState !== 'playing') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'm' && e.key !== 'M') return;
      if (matchedRef.current) return;
      const idx = notesRef.current.findIndex(n => n.status === 'active');
      if (idx === -1) return;
      e.preventDefault();
      matchedRef.current = true;
      setScore(prev => prev + 1);
      setNotes(prev => prev.map((n, i) =>
        i === idx ? { ...n, status: 'correct' } : n
      ));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (beatTimeoutRef.current) clearTimeout(beatTimeoutRef.current);
    };
  }, []);

  const displayNotes = notes.slice(0, 4); // Always show max 4 bars

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-6 flex-wrap">
        {/* Level Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Stig:</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
            disabled={gameState === 'playing'}
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

        {/* Answer mode: Pick (type) vs Listen (guitar/mic) */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Svara með:</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setInputMode('pick')}
              disabled={gameState === 'playing'}
              className={`px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                inputMode === 'pick' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⌨️ Velja
            </button>
            <button
              onClick={() => setInputMode('listen')}
              disabled={gameState === 'playing'}
              className={`px-3 py-2 text-sm font-semibold border-l border-gray-300 transition-colors disabled:opacity-60 ${
                inputMode === 'listen' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🎸 Hlusta
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700" title="Einn taktsláttur á nótu — lægra = meiri tími á nótu">
            Hraði:
          </label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 30)}
            min="15"
            max="180"
            disabled={gameState === 'playing'}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold"
          />
          <span className="text-xs text-gray-500">slög/nótur á mín</span>
        </div>

        {/* Metronome tick volume */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Taktsláttur:</label>
          <button
            type="button"
            onClick={() => {
              if (tickVolume > 0) {
                lastTickVolumeRef.current = tickVolume;
                setTickVolume(0);
              } else {
                setTickVolume(lastTickVolumeRef.current || 0.7);
              }
            }}
            title={tickVolume > 0 ? 'Þagga taktslátt' : 'Kveikja á taktslætti'}
            aria-label={tickVolume > 0 ? 'Þagga taktslátt' : 'Kveikja á taktslætti'}
            aria-pressed={tickVolume === 0}
            className="px-2 py-1.5 text-xl rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <span aria-hidden="true">{tickVolume > 0 ? '🔊' : '🔇'}</span>
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={tickVolume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setTickVolume(v);
              if (v > 0) lastTickVolumeRef.current = v;
            }}
            title="Hljóðstyrkur taktsláttar"
            aria-label="Hljóðstyrkur taktsláttar"
            className="w-24 accent-blue-500"
          />
        </div>

        {/* Show/hide note names — toggleable any time, even mid-practice */}
        <button
          type="button"
          onClick={() => setShowNoteNames((v) => !v)}
          title="Sýna eða fela heiti nótanna undir hverri nótu"
          className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            showNoteNames
              ? 'bg-blue-500 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          🔤 Nöfn: {showNoteNames ? 'Á' : 'Af'}
        </button>

        <div className="flex items-center gap-4" role="status" aria-live="polite">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Umferð:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{roundNumber}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Skor:</span>
            <span data-testid="score" className="ml-2 text-2xl font-bold text-green-600">{score}</span>
          </div>
        </div>

        {/* Muscle Memory: same bar loops forever */}
        {levelConfig.fixedBar && (gameState === 'playing') && (
          <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold border border-purple-300">
            🔁 Endurtek í lykkju
          </span>
        )}

        {/* Repeat indicator (beginner-style levels only) */}
        {levelConfig.repeatUntilPerfect && (gameState === 'playing') && (
          isRepeatingBar ? (
            <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold border border-orange-300">
              🔁 Endurtek þennan takt
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold border border-green-300">
              ✨ Nýr taktur
            </span>
          )
        )}

        {gameState === 'idle' && (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Byrja æfingu
          </button>
        )}

        {(gameState === 'playing') && (
          <button
            onClick={stopGame}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Stöðva
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 text-gray-600">
          {import.meta.env.DEV && (gameState === 'playing') && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-600 text-white text-sm font-mono font-bold border-2 border-purple-800 shadow animate-pulse">
              🐞 DEV — press
              <kbd className="px-1.5 py-0.5 bg-white/25 rounded font-bold">M</kbd>
              to match
            </span>
          )}
          {inputMode === 'pick' && (gameState === 'playing') && (
            <span className="flex items-center gap-2 font-medium">
              <span className="text-2xl">⌨️</span>
              Sláðu inn heiti nótunnar
            </span>
          )}
          {isListening && (
            <>
              <span className="text-2xl">🎤</span>
              <span className="font-medium">Hlusta...</span>
              {detectedNote && (
                <span className="text-blue-600 font-semibold">({detectedNote})</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {gameState === 'idle' && notes.length === 0 ? (
          <div className="text-center max-h-full overflow-y-auto w-full py-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nótnaþjálfun</h2>
            <p className="text-xl text-gray-600 mb-8">
              Æfðu nóturnar C, D, E, F, G, A, B á efstu 3 strengjunum
            </p>

            {level === 'muscle' ? (
              <div className="max-w-2xl mx-auto text-left space-y-5">
                {/* Which bar to loop */}
                <div className="p-4 bg-white rounded-lg border border-gray-300">
                  <div className="font-semibold text-gray-900 mb-2">Hvaða takt á að endurtaka?</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => selectBarSource('random')}
                      className={`px-3 py-2 rounded-lg border text-sm font-semibold ${barSource === 'random' ? 'bg-purple-500 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      🎲 Slembinn taktur
                    </button>
                    {savedBars.map((bar) => (
                      <span key={bar.id} className={`flex items-center rounded-lg border ${barSource === bar.id ? 'bg-purple-500 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                        <button onClick={() => selectBarSource(bar.id!)} className="px-3 py-2 text-sm font-semibold">
                          {bar.name} <span className="opacity-70">({bar.notes.map((n) => n.replace(/[0-9]/g, '')).join(' ')})</span>
                        </button>
                        <button onClick={() => deleteBar(bar.id!)} title="Eyða takti" aria-label={`Eyða takti ${bar.name}`} className="px-2 py-2 text-sm hover:text-red-500"><span aria-hidden="true">🗑</span></button>
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {barSource === 'random'
                      ? 'Nýr slembinn 4-nótna taktur er valinn þegar þú byrjar, svo endurtekinn stanslaust.'
                      : 'Þessi vistaði taktur endurtekst stanslaust svo þú getir æft hann inn í vöðvaminnið.'}
                  </p>
                </div>

                {/* Create a bar */}
                <div className="p-4 bg-white rounded-lg border border-gray-300">
                  <div className="font-semibold text-gray-900 mb-2">Búðu til takt ({BAR_LENGTH} nótur)</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {BASIC_NOTES.map((note) => (
                      <button
                        key={note}
                        onClick={() => setBuilderNotes((prev) => (prev.length < BAR_LENGTH ? [...prev, note] : prev))}
                        disabled={builderNotes.length >= BAR_LENGTH}
                        className="w-10 h-10 rounded-lg border border-gray-300 font-bold hover:bg-gray-50 disabled:opacity-40"
                      >
                        {note.replace(/[0-9]/g, '')}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">Röð:</span>
                    <span className="font-mono font-bold text-lg">
                      {builderNotes.length ? builderNotes.map((n) => n.replace(/[0-9]/g, '')).join(' · ') : '—'}
                    </span>
                    <button onClick={() => setBuilderNotes((prev) => prev.slice(0, -1))} disabled={!builderNotes.length} title="Fjarlægja síðustu" aria-label="Fjarlægja síðustu nótu" className="ml-auto px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-40"><span aria-hidden="true">⌫</span></button>
                    <button onClick={() => setBuilderNotes([])} disabled={!builderNotes.length} className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-40">Hreinsa</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={builderName}
                      onChange={(e) => setBuilderName(e.target.value)}
                      placeholder="Heiti takts"
                      maxLength={100}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                    />
                    <button
                      onClick={saveBuilderBar}
                      disabled={builderNotes.length === 0 || !builderName.trim()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40"
                    >
                      Vista takt
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-left max-w-2xl mx-auto">
                {Object.entries(LEVELS).map(([key, config]) => (
                  <div key={key} className="p-4 bg-white rounded-lg border border-gray-300">
                    <div className="font-semibold text-gray-900">{config.name}</div>
                    <div className="text-gray-600">{config.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[1500px]">
            {/* Music Staff with 4 Bars */}
            <svg width="100%" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid meet"
                 role="img"
                 aria-label={`Nótnastrengur með ${displayNotes.length} nótum til að lesa og spila. Virka nótan er merkt með ▼.`}
                 className="w-full h-auto bg-white rounded-xl border-2 border-gray-300 shadow-lg">
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((lineIndex) => (
                <line
                  key={`staff-${lineIndex}`}
                  x1={60}
                  y1={100 + lineIndex * 30}
                  x2={1160}
                  y2={100 + lineIndex * 30}
                  stroke="#000"
                  strokeWidth={2}
                />
              ))}

              {/* Treble (G) clef — a real clef glyph (no built-in staff lines),
                  sized to span the staff with the curl near the G4 line. */}
              <text
                x={68}
                y={232}
                fontSize={175}
                fontFamily="'Apple Symbols', 'Noto Music', 'Bravura', serif"
                fill="#111"
              >
                𝄞
              </text>

              {/* Bar lines */}
              {[0, 1, 2, 3, 4].map((barIndex) => (
                <line
                  key={`bar-${barIndex}`}
                  x1={160 + barIndex * 250}
                  y1={100}
                  x2={160 + barIndex * 250}
                  y2={220}
                  stroke="#000"
                  strokeWidth={barIndex === 4 ? 4 : 2}
                />
              ))}

              {/* Notes */}
              {displayNotes.map((noteState, index) => {
                const x = 285 + index * 250;
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
                    {/* Non-colour status cue (WCAG 1.4.1): a shape, not just a hue. */}
                    {noteState.status === 'active' && (
                      <text x={x} y={noteY - 24} textAnchor="middle" fontSize="26"
                            fontWeight="bold" fill="#1e40af" aria-hidden="true">▼</text>
                    )}
                    {noteState.status === 'correct' && (
                      <text x={x} y={noteY + 8} textAnchor="middle" fontSize="22"
                            fontWeight="bold" fill="#fff" aria-hidden="true">✓</text>
                    )}
                    {noteState.status === 'missed' && (
                      <text x={x} y={noteY + 8} textAnchor="middle" fontSize="22"
                            fontWeight="bold" fill="#fff" aria-hidden="true">✗</text>
                    )}
                    {showNoteNames && (
                      <text
                        x={x}
                        y={288}
                        textAnchor="middle"
                        fontSize="26"
                        fontWeight="bold"
                        fill={stroke}
                      >
                        {noteState.note.replace(/[0-9]/g, '')}
                      </text>
                    )}
                    <text
                      x={x}
                      y={64}
                      textAnchor="middle"
                      fontSize="16"
                      fill="#475569"
                    >
                      Taktur {index + 1}
                    </text>
                  </g>
                );
              })}

              {/* Legend — each state is shown by shape + colour, never colour alone. */}
              <g transform="translate(60, 338)">
                <text fontSize="18" fontWeight="bold" fill="#333">Skýring:</text>
                <circle cx={90} cy={-3} r={10} fill="#fff" stroke="#333" strokeWidth={2} />
                <text x={108} fontSize="16" fill="#666">= Bíður</text>

                <circle cx={250} cy={-3} r={10} fill="#3b82f6" stroke="#1e40af" strokeWidth={2} />
                <text x={250} y={2} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" aria-hidden="true">▼</text>
                <text x={268} fontSize="16" fill="#666">= Spilaðu núna! (▼)</text>

                <circle cx={490} cy={-3} r={10} fill="#22c55e" stroke="#16a34a" strokeWidth={2} />
                <text x={490} y={2} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" aria-hidden="true">✓</text>
                <text x={508} fontSize="16" fill="#666">= Rétt (✓)</text>

                <circle cx={640} cy={-3} r={10} fill="#ef4444" stroke="#dc2626" strokeWidth={2} />
                <text x={640} y={2} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" aria-hidden="true">✗</text>
                <text x={658} fontSize="16" fill="#666">= Missti (✗)</text>
              </g>
            </svg>

            {/* Status Messages */}
            {gameState === 'playing' && (
              <div className="mt-8 text-center">
                <p className="text-2xl font-semibold text-gray-700">
                  {levelConfig.name} — Umferð {roundNumber}
                </p>
                <p className="text-lg text-gray-500 mt-2">
                  {inputMode === 'pick'
                    ? 'Lestu virku nótuna (merkt ▼) og sláðu inn heiti hennar (C D E F G A B)'
                    : 'Fylgstu með virku nótunni (merkt ▼) — það er merkið þitt til að spila!'}
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
