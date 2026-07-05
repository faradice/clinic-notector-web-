import { useState, useCallback, useEffect } from 'react';
import { ChordFretPosition, chordApi } from '../../api/chords';
import { useChordPlayer } from '../../hooks/useChordPlayer';

const NUM_STRINGS = 6;
const NUM_FRETS = 12;
const STRING_SPACING = 40;
const FRET_SPACING = 60;
const MARGIN_LEFT = 50;
const MARGIN_TOP = 60;

interface FretboardViewerProps {
  onChordChange?: (chordName: string, positions: ChordFretPosition[]) => void;
}

export const FretboardViewer: React.FC<FretboardViewerProps> = ({ onChordChange }) => {
  const [positions, setPositions] = useState<ChordFretPosition[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [chordName, setChordName] = useState<string>('');
  const [history, setHistory] = useState<ChordFretPosition[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const { playChord, playNote } = useChordPlayer();

  // Auto-calculate chord name when positions change
  useEffect(() => {
    const analyzeChord = async () => {
      if (positions.length === 0) {
        setChordName('');
        return;
      }

      try {
        const result = await chordApi.analyze(positions);
        setChordName(result.name);
        onChordChange?.(result.name, positions);
      } catch (error) {
        console.error('Failed to analyze chord:', error);
        setChordName('Unknown');
      }
    };

    analyzeChord();
  }, [positions, onChordChange]);

  const addToHistory = useCallback((newPositions: ChordFretPosition[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newPositions]);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleFretClick = useCallback((stringNum: number, fret: number, event: React.MouseEvent) => {
    const posKey = `${stringNum}-${fret}`;
    const existingPosIndex = positions.findIndex(
      p => p.stringNumber === stringNum && p.fretNumber === fret
    );

    if (event.detail === 2) {
      // Double-click: Add note or cycle finger
      if (existingPosIndex >= 0) {
        // Cycle finger number (1 -> 2 -> 3 -> 4 -> 1)
        const newPositions = [...positions];
        const currentFinger = newPositions[existingPosIndex].finger || 0;
        newPositions[existingPosIndex].finger = currentFinger >= 4 ? 1 : currentFinger + 1;
        setPositions(newPositions);
        addToHistory(newPositions);
      } else {
        // Add new note
        const newPos: ChordFretPosition = {
          stringNumber: stringNum,
          fretNumber: fret,
          finger: 1,
          isBase: false,
        };
        const newPositions = [...positions, newPos];
        setPositions(newPositions);
        addToHistory(newPositions);
        playNote(stringNum, fret);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl+click: Toggle selection
      setSelectedPositions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(posKey)) {
          newSet.delete(posKey);
        } else {
          newSet.add(posKey);
        }
        return newSet;
      });
    } else {
      // Single click: Select position
      if (existingPosIndex >= 0) {
        setSelectedPositions(new Set([posKey]));
      }
    }
  }, [positions, addToHistory, playNote]);

  const handleStringHeaderClick = useCallback((stringNum: number) => {
    const existingPosIndex = positions.findIndex(p => p.stringNumber === stringNum);

    if (existingPosIndex >= 0) {
      // Remove position (mute string)
      const newPositions = positions.filter(p => p.stringNumber !== stringNum);
      setPositions(newPositions);
      addToHistory(newPositions);
    } else {
      // Add open string (fret 0)
      const newPos: ChordFretPosition = {
        stringNumber: stringNum,
        fretNumber: 0,
        finger: 0,
        isBase: false,
      };
      const newPositions = [...positions, newPos];
      setPositions(newPositions);
      addToHistory(newPositions);
      playNote(stringNum, 0);
    }
  }, [positions, addToHistory, playNote]);

  const handlePlayChord = useCallback(() => {
    playChord(positions);
  }, [positions, playChord]);

  const handleClear = useCallback(() => {
    const newPositions: ChordFretPosition[] = [];
    setPositions(newPositions);
    addToHistory(newPositions);
    setSelectedPositions(new Set());
  }, [addToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPositions(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPositions(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const handleDeleteSelected = useCallback(() => {
    const newPositions = positions.filter(
      p => !selectedPositions.has(`${p.stringNumber}-${p.fretNumber}`)
    );
    setPositions(newPositions);
    addToHistory(newPositions);
    setSelectedPositions(new Set());
  }, [positions, selectedPositions, addToHistory]);

  const width = MARGIN_LEFT + FRET_SPACING * NUM_FRETS + 50;
  const height = MARGIN_TOP + STRING_SPACING * (NUM_STRINGS - 1) + 50;

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Chord Editor</h2>
        <div className="text-xl text-blue-600 font-semibold min-h-[2rem]">
          {chordName || 'Click frets to build a chord'}
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={handlePlayChord}
          disabled={positions.length === 0}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Play Chord
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Redo
        </button>
        <button
          onClick={handleDeleteSelected}
          disabled={selectedPositions.size === 0}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Delete Selected
        </button>
      </div>

      <div className="text-sm text-gray-600 text-center max-w-md">
        <p><strong>Double-click:</strong> Add/cycle finger (1-4)</p>
        <p><strong>Click string header:</strong> Toggle open/muted</p>
        <p><strong>Ctrl+click:</strong> Multi-select</p>
      </div>

      <svg width={width} height={height} className="border border-gray-300 rounded bg-amber-50">
        {/* Frets (vertical lines) */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={MARGIN_LEFT + i * FRET_SPACING}
            y1={MARGIN_TOP}
            x2={MARGIN_LEFT + i * FRET_SPACING}
            y2={MARGIN_TOP + STRING_SPACING * (NUM_STRINGS - 1)}
            stroke={i === 0 ? '#000' : '#999'}
            strokeWidth={i === 0 ? 4 : 1}
          />
        ))}

        {/* Strings (horizontal lines) */}
        {Array.from({ length: NUM_STRINGS }, (_, i) => {
          const stringNum = i + 1;
          const y = MARGIN_TOP + i * STRING_SPACING;
          const hasPosition = positions.some(p => p.stringNumber === stringNum);
          const isOpen = positions.some(p => p.stringNumber === stringNum && p.fretNumber === 0);

          return (
            <g key={`string-${i}`}>
              <line
                x1={MARGIN_LEFT}
                y1={y}
                x2={MARGIN_LEFT + FRET_SPACING * NUM_FRETS}
                y2={y}
                stroke="#666"
                strokeWidth={1 + i * 0.2}
              />
              {/* String header (open/muted indicator) */}
              <circle
                cx={MARGIN_LEFT - 20}
                cy={y}
                r={8}
                fill={isOpen ? '#4ade80' : hasPosition ? 'none' : '#ef4444'}
                stroke={hasPosition && !isOpen ? 'none' : '#333'}
                strokeWidth={2}
                className="cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => handleStringHeaderClick(stringNum)}
              />
              {!hasPosition && (
                <text
                  x={MARGIN_LEFT - 20}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#333"
                  className="pointer-events-none select-none"
                >
                  ×
                </text>
              )}
            </g>
          );
        })}

        {/* Fret markers */}
        {[3, 5, 7, 9, 12].map(fret => (
          <circle
            key={`marker-${fret}`}
            cx={MARGIN_LEFT + (fret - 0.5) * FRET_SPACING}
            cy={MARGIN_TOP + STRING_SPACING * 2.5}
            r={4}
            fill="#ccc"
          />
        ))}

        {/* Clickable fret areas */}
        {Array.from({ length: NUM_FRETS }, (_, fretIdx) =>
          Array.from({ length: NUM_STRINGS }, (_, stringIdx) => {
            const fret = fretIdx + 1;
            const stringNum = stringIdx + 1;
            const posKey = `${stringNum}-${fret}`;
            const position = positions.find(p => p.stringNumber === stringNum && p.fretNumber === fret);
            const isSelected = selectedPositions.has(posKey);

            return (
              <g key={posKey}>
                <rect
                  x={MARGIN_LEFT + fretIdx * FRET_SPACING + 2}
                  y={MARGIN_TOP + stringIdx * STRING_SPACING - STRING_SPACING / 2}
                  width={FRET_SPACING - 4}
                  height={STRING_SPACING}
                  fill="transparent"
                  className="cursor-pointer hover:fill-blue-100 hover:fill-opacity-30 transition-all"
                  onClick={(e) => handleFretClick(stringNum, fret, e)}
                />
                {position && (
                  <g>
                    <circle
                      cx={MARGIN_LEFT + (fretIdx + 0.5) * FRET_SPACING}
                      cy={MARGIN_TOP + stringIdx * STRING_SPACING}
                      r={isSelected ? 16 : 14}
                      fill={isSelected ? '#3b82f6' : '#1e40af'}
                      stroke={position.isBase ? '#f59e0b' : '#000'}
                      strokeWidth={position.isBase ? 3 : 1}
                      className="cursor-pointer"
                    />
                    <text
                      x={MARGIN_LEFT + (fretIdx + 0.5) * FRET_SPACING}
                      y={MARGIN_TOP + stringIdx * STRING_SPACING}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fill="white"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {position.finger || ''}
                    </text>
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* Fret numbers */}
        {Array.from({ length: NUM_FRETS }, (_, i) => (
          <text
            key={`fret-num-${i}`}
            x={MARGIN_LEFT + (i + 0.5) * FRET_SPACING}
            y={MARGIN_TOP - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
            className="select-none"
          >
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
};
