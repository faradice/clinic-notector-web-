import type { Song, SongChordPosition } from '../../api/songs';

interface LyricsDisplayProps {
  song: Song;
  fontSize?: number;
  fontFamily?: string;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  song,
  fontSize = 18,
  fontFamily = 'monospace',
}) => {
  if (!song.lyrics) {
    return (
      <div className="text-gray-500 text-center py-8">
        No lyrics available
      </div>
    );
  }

  const lines = song.lyrics.split('\n');

  return (
    <div
      className="lyrics-container p-8"
      style={{
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        color: song.textColor || '#000000',
        backgroundColor: song.backgroundColor || '#FFFFFF',
        lineHeight: '2.5',
        minHeight: '600px',
      }}
    >
      {lines.map((line, lineIndex) => (
        <LyricsLine
          key={lineIndex}
          line={line}
          lineNumber={lineIndex}
          chordPositions={song.chordPositions || []}
          fontSize={fontSize}
        />
      ))}
    </div>
  );
};

interface LyricsLineProps {
  line: string;
  lineNumber: number;
  chordPositions: SongChordPosition[];
  fontSize: number;
}

const LyricsLine: React.FC<LyricsLineProps> = ({
  line,
  lineNumber,
  chordPositions,
  fontSize,
}) => {
  // Get chords for this line
  const lineChords = chordPositions.filter(
    (cp) => cp.lineNumber === lineNumber
  );

  if (lineChords.length === 0) {
    // No chords on this line
    return <div className="lyrics-line relative mb-2">{line || '\u00A0'}</div>;
  }

  // Split line into words
  const words = line.split(/\s+/);

  return (
    <div className="lyrics-line relative mb-8">
      {/* Chord layer (absolute positioning) */}
      <div className="absolute top-0 left-0 w-full" style={{ transform: 'translateY(-1.5em)' }}>
        {words.map((word, wordIndex) => {
          const wordChords = lineChords.filter(
            (cp) => cp.wordNumber === wordIndex
          );

          if (wordChords.length === 0) return null;

          // Calculate approximate word position
          const precedingText = words.slice(0, wordIndex).join(' ');
          const charOffset = precedingText.length + (wordIndex > 0 ? 1 : 0);

          return wordChords.map((chord, chordIdx) => {
            // Calculate horizontal position based on char offset within word
            const totalOffset = charOffset + (chord.charOffset || 0);
            const leftPosition = `${totalOffset * 0.6}em`; // Approximation for monospace

            return (
              <span
                key={`${lineNumber}-${wordIndex}-${chordIdx}`}
                className="absolute font-bold text-blue-600 whitespace-nowrap"
                style={{
                  left: leftPosition,
                  fontSize: `${fontSize * 0.9}px`,
                }}
              >
                {chord.chordName}
              </span>
            );
          });
        })}
      </div>

      {/* Lyrics text */}
      <div className="relative">{line || '\u00A0'}</div>
    </div>
  );
};
