import type { ChordFretPosition } from '../../api/chords';

const NUM_STRINGS = 6;
const NUM_FRETS = 5;
const STRING_SPACING = 20;
const FRET_SPACING = 30;
const MARGIN_LEFT = 20;
const MARGIN_TOP = 25;

interface MiniChordViewerProps {
  positions: ChordFretPosition[];
  width?: number;
  height?: number;
}

export const MiniChordViewer: React.FC<MiniChordViewerProps> = ({
  positions,
  width = 180,
  height = 140,
}) => {
  // Base-fret window: if the chord uses frets above the 5th, slide the window up
  // so high voicings (e.g. x76 80 x) render, with a "6fr" style marker.
  const fretted = positions.filter((p) => p.fretNumber > 0).map((p) => p.fretNumber);
  const maxFret = fretted.length ? Math.max(...fretted) : 0;
  const minFret = fretted.length ? Math.min(...fretted) : 1;
  const baseFret = maxFret > NUM_FRETS ? minFret : 1;

  // Fixed content coordinate space so the whole fretboard (+ "Nfr" marker) always
  // fits — the width/height props just scale it, nothing gets clipped on the right.
  const viewW = MARGIN_LEFT + FRET_SPACING * NUM_FRETS + 34;
  const viewH = MARGIN_TOP + STRING_SPACING * (NUM_STRINGS - 1) + 16;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
      className="bg-white rounded"
    >
      {/* Frets (vertical lines) */}
      {Array.from({ length: NUM_FRETS + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={MARGIN_LEFT + i * FRET_SPACING}
          y1={MARGIN_TOP}
          x2={MARGIN_LEFT + i * FRET_SPACING}
          y2={MARGIN_TOP + STRING_SPACING * (NUM_STRINGS - 1)}
          stroke={i === 0 && baseFret === 1 ? '#000' : '#999'}
          strokeWidth={i === 0 && baseFret === 1 ? 3 : 1}
        />
      ))}

      {/* Base-fret marker for voicings up the neck */}
      {baseFret > 1 && (
        <text
          x={MARGIN_LEFT + FRET_SPACING * NUM_FRETS + 4}
          y={MARGIN_TOP + 6}
          fontSize="10"
          fill="#333"
          className="select-none"
        >
          {baseFret}fr
        </text>
      )}

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
              strokeWidth={0.5 + i * 0.15}
            />
            {/* String header */}
            <circle
              cx={MARGIN_LEFT - 10}
              cy={y}
              r={4}
              fill={isOpen ? '#4ade80' : hasPosition ? 'none' : '#ef4444'}
              stroke={hasPosition && !isOpen ? 'none' : '#333'}
              strokeWidth={1}
            />
            {!hasPosition && (
              <text
                x={MARGIN_LEFT - 10}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#333"
                className="select-none"
              >
                ×
              </text>
            )}
          </g>
        );
      })}

      {/* Notes */}
      {positions.map((position, idx) => {
        if (position.fretNumber === 0) return null; // Open strings shown in header

        const stringIdx = position.stringNumber - 1;
        const fretIdx = position.fretNumber - baseFret;

        // Only show notes inside the current fret window
        if (fretIdx < 0 || fretIdx >= NUM_FRETS) return null;

        return (
          <g key={`${position.stringNumber}-${position.fretNumber}-${idx}`}>
            <circle
              cx={MARGIN_LEFT + (fretIdx + 0.5) * FRET_SPACING}
              cy={MARGIN_TOP + stringIdx * STRING_SPACING}
              r={7}
              fill="#1e40af"
              stroke={position.isBase ? '#f59e0b' : '#000'}
              strokeWidth={position.isBase ? 2 : 0.5}
            />
            {position.finger && position.finger > 0 && (
              <text
                x={MARGIN_LEFT + (fretIdx + 0.5) * FRET_SPACING}
                y={MARGIN_TOP + stringIdx * STRING_SPACING}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
                className="select-none"
              >
                {position.finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
