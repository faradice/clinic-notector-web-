import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, MouseSensor, useSensor, useSensors, useDraggable } from '@dnd-kit/core';
import type { Chord } from '../../api/chords';
import { chordApi } from '../../api/chords';
import type { Workspace, WorkspaceCard, CardPositionUpdate } from '../../api/workspaces';
import { workspaceApi } from '../../api/workspaces';
import { ChordCard } from './ChordCard';
import { MiniChordViewer } from './MiniChordViewer';
import { chordFromName, normalizeChordName } from './chordFromName';

/** A chord in the sidebar library — a @dnd-kit draggable source. */
const LibraryChordItem: React.FC<{ chord: Chord }> = ({ chord }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${chord.id}`,
    data: { fromLibrary: true, chord },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 bg-gray-50 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="font-semibold text-gray-900">{chord.name}</div>
      <div className="text-xs text-gray-500">{chord.rootNote} {chord.chordType}</div>
      <div className="mt-2">
        <MiniChordViewer positions={chord.fretPositions} width={150} height={120} />
      </div>
    </div>
  );
};

export const ComposerCanvas: React.FC = () => {
  const [chordLibrary, setChordLibrary] = useState<Chord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [draggedChord, setDraggedChord] = useState<Chord | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cardId: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [newChordName, setNewChordName] = useState('');
  const [addChordError, setAddChordError] = useState<string | null>(null);
  const [cardScale, setCardScale] = useState(0.7); // canvas card zoom

  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    chordApi.getAll()
      .then(setChordLibrary)
      .catch((e) => console.error('Failed to load chord library:', e));
  }, []);

  useEffect(() => {
    workspaceApi.getAll()
      .then((ws) => {
        setWorkspaces(ws);
        setCurrentWorkspace((cur) => cur ?? ws[0] ?? null);
      })
      .catch((e) => console.error('Failed to load workspaces:', e));
  }, []);

  const handleCreateWorkspace = async () => {
    const name = prompt('Enter workspace name:');
    if (!name) return;
    try {
      setLoading(true);
      const newWorkspace = await workspaceApi.create({ name, cards: [] });
      setWorkspaces((prev) => [...prev, newWorkspace]);
      setCurrentWorkspace(newWorkspace);
    } catch (e) {
      console.error('Failed to create workspace:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChord = async () => {
    const input = newChordName.trim();
    if (!input) return;
    const generated = chordFromName(input);
    if (!generated) {
      setAddChordError(`No shape for "${normalizeChordName(input)}" yet — try C, Am, G7, Dsus4, Cmaj7…`);
      return;
    }
    const existing = chordLibrary.find((c) => c.name === generated.name);
    if (existing) {
      setAddChordError(`"${generated.name}" is already in the library.`);
      setNewChordName('');
      return;
    }
    try {
      setLoading(true);
      setAddChordError(null);
      const created = await chordApi.create(generated as Chord);
      setChordLibrary((prev) => [...prev, created]);
      setNewChordName('');
    } catch (e) {
      console.error('Failed to add chord:', e);
      setAddChordError('Failed to save the chord.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    // Only overlay library drags; existing cards move via their own transform.
    if (data?.fromLibrary) setDraggedChord(data.chord as Chord);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setDraggedChord(null);
    if (!currentWorkspace) return;
    const data = active.data.current as { fromLibrary?: boolean; chord?: Chord; position?: { x: number; y: number } } | undefined;

    if (data?.fromLibrary && data.chord) {
      // Drop a new chord from the library onto the canvas at the release point.
      const rect = active.rect.current.translated;
      const canvas = canvasRef.current;
      let x = 40;
      let y = 40;
      if (rect && canvas) {
        const c = canvas.getBoundingClientRect();
        x = Math.max(0, rect.left - c.left + canvas.scrollLeft);
        y = Math.max(0, rect.top - c.top + canvas.scrollTop);
      }
      try {
        const updated = await workspaceApi.addCard(currentWorkspace.id!, {
          chordId: data.chord.id!,
          positionX: Math.round(x),
          positionY: Math.round(y),
        });
        setCurrentWorkspace(updated);
      } catch (e) {
        console.error('Failed to add card:', e);
      }
      return;
    }

    if (data?.position) {
      // Move an existing card (or all selected cards) by the drag delta.
      const cardId = parseInt(active.id.toString().split('-')[1]);
      try {
        if (selectedCards.has(cardId) && selectedCards.size > 1) {
          const updates: CardPositionUpdate[] = Array.from(selectedCards).map((id) => {
            const card = currentWorkspace.cards.find((c) => c.id === id);
            return {
              cardId: id,
              positionX: Math.max(0, Math.round((card?.positionX || 0) + delta.x)),
              positionY: Math.max(0, Math.round((card?.positionY || 0) + delta.y)),
            };
          });
          setCurrentWorkspace(await workspaceApi.updateCardPositions(currentWorkspace.id!, updates));
        } else {
          setCurrentWorkspace(await workspaceApi.updateCardPosition(currentWorkspace.id!, cardId, {
            positionX: Math.max(0, Math.round(data.position.x + delta.x)),
            positionY: Math.max(0, Math.round(data.position.y + delta.y)),
          }));
        }
      } catch (e) {
        console.error('Failed to update card position:', e);
      }
    }
  };

  const handleCardClick = (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.has(cardId) ? next.delete(cardId) : next.add(cardId);
        return next;
      });
    } else {
      setSelectedCards(new Set([cardId]));
    }
  };

  const handleCanvasClick = () => {
    setSelectedCards(new Set());
    setContextMenu(null);
  };

  const handleContextMenu = (cardId: number, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, cardId });
  };

  const handleDeleteSelected = async () => {
    if (!currentWorkspace || selectedCards.size === 0) return;
    try {
      setLoading(true);
      let updated = currentWorkspace;
      for (const cardId of selectedCards) {
        updated = await workspaceApi.removeCard(currentWorkspace.id!, cardId);
      }
      setCurrentWorkspace(updated);
      setSelectedCards(new Set());
      setContextMenu(null);
    } catch (e) {
      console.error('Failed to delete cards:', e);
    } finally {
      setLoading(false);
    }
  };

  const getChordForCard = useCallback(
    (card: WorkspaceCard): Chord | undefined => chordLibrary.find((c) => c.id === card.chordId),
    [chordLibrary]
  );

  // Library sorted alphabetically by name for the sidebar.
  const sortedLibrary = useMemo(
    () => [...chordLibrary].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    [chordLibrary]
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Chord Library */}
        <div className="w-64 bg-white border-r border-gray-300 overflow-y-auto">
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-xl font-bold text-gray-900">Chord Library</h2>
            <p className="text-sm text-gray-600 mt-1">Drag chords to the canvas</p>
          </div>

          {/* Add a chord by name */}
          <div className="p-4 border-b border-gray-300 space-y-2">
            <label className="text-sm font-semibold text-gray-700">Add a chord</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChordName}
                onChange={(e) => { setNewChordName(e.target.value); setAddChordError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddChord(); }}
                placeholder="e.g. C, Am, G7"
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={handleAddChord}
                disabled={loading || !newChordName.trim()}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
              >
                Add Chord
              </button>
            </div>
            {addChordError && <p className="text-xs text-red-600">{addChordError}</p>}
          </div>

          <div className="p-4 space-y-2">
            {sortedLibrary.map((chord) => (
              <LibraryChordItem key={`library-${chord.id}`} chord={chord} />
            ))}
            {chordLibrary.length === 0 && (
              <div className="text-center text-gray-500 py-8">No chords in library</div>
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-4">
            <select
              value={currentWorkspace?.id || ''}
              onChange={(e) => setCurrentWorkspace(workspaces.find((w) => w.id === parseInt(e.target.value)) || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Workspace</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
            <button
              onClick={handleCreateWorkspace}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              New Workspace
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedCards.size === 0 || loading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              Delete Selected ({selectedCards.size})
            </button>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Zoom</label>
                <input
                  type="range"
                  min={0.4}
                  max={1.2}
                  step={0.05}
                  value={cardScale}
                  onChange={(e) => setCardScale(parseFloat(e.target.value))}
                  className="w-28 accent-blue-500"
                  title="Card size"
                />
                <span className="text-xs text-gray-500 w-9">{Math.round(cardScale * 100)}%</span>
              </div>
              <div className="text-sm text-gray-600">{currentWorkspace?.cards.length || 0} cards</div>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-auto bg-gray-100"
            onClick={handleCanvasClick}
            style={{ minHeight: '600px' }}
          >
            {currentWorkspace ? (
              currentWorkspace.cards.map((card) => {
                const chord = getChordForCard(card);
                if (!chord) return null;
                return (
                  <ChordCard
                    key={card.id}
                    id={`card-${card.id}`}
                    chord={chord}
                    position={{ x: card.positionX, y: card.positionY }}
                    isSelected={selectedCards.has(card.id!)}
                    scale={cardScale}
                    onClick={(e) => handleCardClick(card.id!, e)}
                    onContextMenu={(e) => handleContextMenu(card.id!, e)}
                  />
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select or create a workspace to begin
              </div>
            )}
          </div>
        </div>

        {/* Drag overlay for library drags */}
        <DragOverlay>
          {draggedChord && (
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3 opacity-90">
              <div className="font-bold text-gray-900 mb-2">{draggedChord.name}</div>
              <MiniChordViewer positions={draggedChord.fretPositions} />
            </div>
          )}
        </DragOverlay>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            <button
              onClick={handleDeleteSelected}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};
