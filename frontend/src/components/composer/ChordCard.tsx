import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Chord } from '../../api/chords';
import { MiniChordViewer } from './MiniChordViewer';
import { useChordPlayer } from '../../hooks/useChordPlayer';

interface ChordCardProps {
  id: string;
  chord: Chord;
  position: { x: number; y: number };
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ChordCard: React.FC<ChordCardProps> = ({
  id,
  chord,
  position,
  isSelected = false,
  onClick,
  onContextMenu,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { chord, position },
  });

  const { playChord } = useChordPlayer();

  const style = {
    position: 'absolute' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
  };

  const handlePlayChord = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChord(chord.fretPositions);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg shadow-lg border-2 transition-all cursor-move
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}
        ${isDragging ? 'opacity-50 scale-105' : 'hover:shadow-xl'}
      `}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...listeners}
      {...attributes}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{chord.name}</h3>
          <button
            onClick={handlePlayChord}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Play chord"
          >
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        <MiniChordViewer positions={chord.fretPositions} />

        <div className="text-xs text-gray-500 text-center">
          {chord.rootNote} {chord.chordType}
        </div>
      </div>
    </div>
  );
};
