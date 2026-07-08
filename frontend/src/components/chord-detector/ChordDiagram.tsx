const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E']; // low -> high
const NUM_FRETS = 4;
const STRING_SPACING = 22;
const FRET_SPACING = 32;
const MARGIN_LEFT = 24;
const MARGIN_TOP = 30;

interface ChordDiagramProps {
  /** 6 fret numbers, low-E first: -1 = muted, 0 = open, n = fret n. */
  frets: number[];
}

/** A standard vertical chord-chart diagram drawn from a fret array. */
export const ChordDiagram: React.FC<ChordDiagramProps> = ({ frets }) => {
  const fretted = frets.filter((f) => f > 0);
  const maxF = fretted.length ? Math.max(...fretted) : 0;
  const minF = fretted.length ? Math.min(...fretted) : 0;
  // Show frets 1..4 for open chords; otherwise slide the window to the shape.
  const baseFret = maxF > NUM_FRETS ? minF : 1;

  const width = MARGIN_LEFT + STRING_SPACING * (STRING_LABELS.length - 1) + 24;
  const height = MARGIN_TOP + FRET_SPACING * NUM_FRETS + 26;
  const boardRight = MARGIN_LEFT + STRING_SPACING * (STRING_LABELS.length - 1);

  return (
    <svg width={width} height={height} className="bg-white rounded-lg">
      {/* Fret lines (horizontal) */}
      {Array.from({ length: NUM_FRETS + 1 }, (_, k) => (
        <line
          key={`fret-${k}`}
          x1={MARGIN_LEFT}
          y1={MARGIN_TOP + k * FRET_SPACING}
          x2={boardRight}
          y2={MARGIN_TOP + k * FRET_SPACING}
          stroke="#334155"
          strokeWidth={k === 0 && baseFret === 1 ? 4 : 1.5}
        />
      ))}

      {/* Strings (vertical) */}
      {STRING_LABELS.map((label, i) => {
        const x = MARGIN_LEFT + i * STRING_SPACING;
        const f = frets[i];
        return (
          <g key={`string-${i}`}>
            <line x1={x} y1={MARGIN_TOP} x2={x} y2={MARGIN_TOP + FRET_SPACING * NUM_FRETS} stroke="#334155" strokeWidth={1.5} />
            {/* Open (o) / muted (x) marker above the nut */}
            {f === 0 && <circle cx={x} cy={MARGIN_TOP - 12} r={5} fill="none" stroke="#0f172a" strokeWidth={1.5} />}
            {f === -1 && (
              <text x={x} y={MARGIN_TOP - 8} textAnchor="middle" fontSize={14} fill="#64748b" fontWeight="bold">×</text>
            )}
            {/* Finger dot */}
            {f > 0 && (
              <circle cx={x} cy={MARGIN_TOP + (f - baseFret + 0.5) * FRET_SPACING} r={8} fill="#0f172a" />
            )}
            {/* String name */}
            <text x={x} y={height - 6} textAnchor="middle" fontSize={11} fill="#94a3b8">{label}</text>
          </g>
        );
      })}

      {/* Base-fret label for shapes not starting at the nut */}
      {baseFret > 1 && (
        <text x={MARGIN_LEFT - 10} y={MARGIN_TOP + FRET_SPACING * 0.5 + 4} textAnchor="end" fontSize={12} fill="#64748b">
          {baseFret}fr
        </text>
      )}
    </svg>
  );
};
