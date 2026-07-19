import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Chord } from '../../api/chords';
import { MiniChordViewer } from './MiniChordViewer';
import { useChordPlayer } from '../../hooks/useChordPlayer';

interface ChordCardProps {
  id: string;
  chord: Chord;
  position: { x: number; y: number };
  isSelected?: boolean;
  isPlaying?: boolean;
  scale?: number;
  beats?: number;
  onBeatsChange?: (beats: number) => void;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ChordCard: React.FC<ChordCardProps> = ({
  id,
  chord,
  position,
  isSelected = false,
  isPlaying = false,
  scale = 1,
  beats = 1,
  onBeatsChange,
  onClick,
  onContextMenu,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { chord, position },
  });

  const { playChord } = useChordPlayer();

  const dragTransform = CSS.Transform.toString(transform);
  const style = {
    position: 'absolute' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    // Compose the drag translate (if any) with the view zoom; anchor top-left so
    // scaling keeps the card at its stored position.
    transform: dragTransform ? `${dragTransform} scale(${scale})` : `scale(${scale})`,
    transformOrigin: 'top left' as const,
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
        ${isPlaying
          ? 'border-green-500 ring-4 ring-green-300 shadow-green-400/50'
          : isSelected
            ? 'border-blue-500 ring-2 ring-blue-300'
            : 'border-gray-300'}
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
            className="p-2 hover:bg-green-100 rounded-full transition-colors"
            title="Spila hljóm"
            aria-label={`Spila hljóminn ${chord.name}`}
          >
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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

        {/* Duration in beats — the mark you set/change per chord. */}
        <div
          className="flex items-center justify-center gap-1.5 border-t border-gray-100 pt-2"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          title="Lengd hljóms í slögum (4 = heill taktur)"
        >
          <button
            type="button"
            onClick={() => onBeatsChange?.(Math.max(1, beats - 1))}
            disabled={beats <= 1}
            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Fækka slögum"
          >
            −
          </button>
          <span className="min-w-[3.5rem] text-center text-sm tabular-nums text-gray-700">
            {beats} <span className="text-gray-400">slög</span>
          </span>
          <button
            type="button"
            onClick={() => onBeatsChange?.(Math.min(16, beats + 1))}
            disabled={beats >= 16}
            className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Fjölga slögum"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
