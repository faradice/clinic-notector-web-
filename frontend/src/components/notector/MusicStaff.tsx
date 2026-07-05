interface MusicStaffProps {
  targetNote: string;
  detectedNote: string | null;
  width?: number;
  height?: number;
}

const NOTE_POSITIONS: { [key: string]: number } = {
  'C3': 10, 'D3': 9, 'E3': 8, 'F3': 7, 'G3': 6, 'A3': 5, 'B3': 4,
  'C4': 3, 'D4': 2, 'E4': 1, 'F4': 0, 'G4': -1, 'A4': -2, 'B4': -3,
  'C5': -4, 'D5': -5, 'E5': -6,
};

export const MusicStaff: React.FC<MusicStaffProps> = ({
  targetNote,
  detectedNote,
  width = 400,
  height = 200,
}) => {
  const lineSpacing = 15;
  const staffTop = height / 2 - lineSpacing * 2;

  const getNoteY = (note: string): number => {
    const position = NOTE_POSITIONS[note] || 0;
    return staffTop + position * (lineSpacing / 2);
  };

  return (
    <svg width={width} height={height} className="bg-white rounded-lg border border-gray-300">
      {/* Staff lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`staff-${i}`}
          x1={50}
          y1={staffTop + i * lineSpacing}
          x2={width - 50}
          y2={staffTop + i * lineSpacing}
          stroke="#000"
          strokeWidth={1}
        />
      ))}

      {/* Treble clef symbol (simplified) */}
      <text
        x={60}
        y={staffTop + lineSpacing * 2 + 5}
        fontSize="48"
        fontFamily="serif"
        fill="#000"
      >
        🎼
      </text>

      {/* Target note */}
      <g transform={`translate(${width / 2 - 50}, 0)`}>
        <circle
          cx={0}
          cy={getNoteY(targetNote)}
          r={12}
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth={2}
        />
        <text
          x={0}
          y={getNoteY(targetNote) + 5}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="white"
          className="select-none"
        >
          {targetNote}
        </text>
        <text
          x={0}
          y={getNoteY(targetNote) - 25}
          textAnchor="middle"
          fontSize="12"
          fill="#666"
          className="select-none"
        >
          Target
        </text>
      </g>

      {/* Detected note */}
      {detectedNote && (
        <g transform={`translate(${width / 2 + 50}, 0)`}>
          <circle
            cx={0}
            cy={getNoteY(detectedNote)}
            r={12}
            fill={detectedNote === targetNote ? '#22c55e' : '#ef4444'}
            stroke={detectedNote === targetNote ? '#16a34a' : '#dc2626'}
            strokeWidth={2}
          />
          <text
            x={0}
            y={getNoteY(detectedNote) + 5}
            textAnchor="middle"
            fontSize="14"}
            fontWeight="bold"
            fill="white"
            className="select-none"
          >
            {detectedNote}
          </text>
          <text
            x={0}
            y={getNoteY(detectedNote) - 25}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
            className="select-none"
          >
            You
          </text>
        </g>
      )}

      {/* Legend */}
      <text x={width - 150} y={30} fontSize="12" fill="#666" className="select-none">
        Match: Green ✓
      </text>
      <text x={width - 150} y={50} fontSize="12" fill="#666" className="select-none">
        Wrong: Red ✗
      </text>
    </svg>
  );
};
