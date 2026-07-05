import { useState, useEffect, useCallback } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Chord } from '../../api/chords';
import { chordApi } from '../../api/chords';
import type { Workspace, WorkspaceCard, CardPositionUpdate } from '../../api/workspaces';
import { workspaceApi } from '../../api/workspaces';
import { ChordCard } from './ChordCard';
import { MiniChordViewer } from './MiniChordViewer';

export const ComposerCanvas: React.FC = () => {
  const [chordLibrary, setChordLibrary] = useState<Chord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [draggedChord, setDraggedChord] = useState<Chord | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cardId: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load chord library
  useEffect(() => {
    const loadChords = async () => {
      try {
        const chords = await chordApi.getAll();
        setChordLibrary(chords);
      } catch (error) {
        console.error('Failed to load chord library:', error);
      }
    };
    loadChords();
  }, []);

  // Load workspaces
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const workspaces = await workspaceApi.getAll();
        setWorkspaces(workspaces);
        if (workspaces.length > 0 && !currentWorkspace) {
          setCurrentWorkspace(workspaces[0]);
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      }
    };
    loadWorkspaces();
  }, [currentWorkspace]);

  const handleCreateWorkspace = async () => {
    const name = prompt('Enter workspace name:');
    if (!name) return;

    try {
      setLoading(true);
      const newWorkspace = await workspaceApi.create({ name, cards: [] });
      setWorkspaces([...workspaces, newWorkspace]);
      setCurrentWorkspace(newWorkspace);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setDraggedChord(null);

    if (!currentWorkspace) return;

    const data = active.data.current as any;

    if (data?.fromLibrary) {
      // Adding new chord from library
      const chord = data.chord as Chord;
      const position = {
        x: Math.max(0, delta.x + 50),
        y: Math.max(0, delta.y + 50),
      };

      try {
        const updated = await workspaceApi.addCard(currentWorkspace.id!, {
          chordId: chord.id!,
          positionX: position.x,
          positionY: position.y,
        });
        setCurrentWorkspace(updated);
      } catch (error) {
        console.error('Failed to add card:', error);
      }
    } else if (data?.position) {
      // Moving existing card
      const cardId = parseInt(active.id.toString().split('-')[1]);
      const newPosition = {
        x: Math.max(0, data.position.x + delta.x),
        y: Math.max(0, data.position.y + delta.y),
      };

      try {
        if (selectedCards.has(cardId) && selectedCards.size > 1) {
          // Move all selected cards together
          const updates: CardPositionUpdate[] = Array.from(selectedCards).map(id => {
            const card = currentWorkspace.cards.find(c => c.id === id);
            return {
              cardId: id,
              positionX: Math.max(0, (card?.positionX || 0) + delta.x),
              positionY: Math.max(0, (card?.positionY || 0) + delta.y),
            };
          });
          const updated = await workspaceApi.updateCardPositions(currentWorkspace.id!, updates);
          setCurrentWorkspace(updated);
        } else {
          // Move single card
          const updated = await workspaceApi.updateCardPosition(currentWorkspace.id!, cardId, {
            positionX: newPosition.x,
            positionY: newPosition.y,
          });
          setCurrentWorkspace(updated);
        }
      } catch (error) {
        console.error('Failed to update card position:', error);
      }
    }
  };

  const handleCardClick = (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      setSelectedCards(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cardId)) {
          newSet.delete(cardId);
        } else {
          newSet.add(cardId);
        }
        return newSet;
      });
    } else {
      // Single selection
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
    } catch (error) {
      console.error('Failed to delete cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChordForCard = useCallback((card: WorkspaceCard): Chord | undefined => {
    return chordLibrary.find(c => c.id === card.chordId);
  }, [chordLibrary]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Chord Library */}
      <div className="w-64 bg-white border-r border-gray-300 overflow-y-auto">
        <div className="p-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-900">Chord Library</h2>
          <p className="text-sm text-gray-600 mt-1">Drag chords to canvas</p>
        </div>

        <div className="p-4 space-y-2">
          {chordLibrary.map(chord => (
            <div
              key={`library-${chord.id}`}
              draggable
              onDragStart={(e) => {
                setDraggedChord(chord);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="p-3 bg-gray-50 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all"
            >
              <div className="font-semibold text-gray-900">{chord.name}</div>
              <div className="text-xs text-gray-500">{chord.rootNote} {chord.chordType}</div>
              <div className="mt-2">
                <MiniChordViewer positions={chord.fretPositions} width={150} height={120} />
              </div>
            </div>
          ))}

          {chordLibrary.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No chords in library
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-4">
          <select
            value={currentWorkspace?.id || ''}
            onChange={(e) => {
              const ws = workspaces.find(w => w.id === parseInt(e.target.value));
              setCurrentWorkspace(ws || null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select Workspace</option>
            {workspaces.map(ws => (
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

          <div className="ml-auto text-sm text-gray-600">
            {currentWorkspace?.cards.length || 0} cards
          </div>
        </div>

        {/* Canvas */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className="flex-1 relative overflow-auto bg-gray-100"
            onClick={handleCanvasClick}
            style={{ minHeight: '600px' }}
          >
            {currentWorkspace ? (
              currentWorkspace.cards.map(card => {
                const chord = getChordForCard(card);
                if (!chord) return null;

                return (
                  <ChordCard
                    key={card.id}
                    id={`card-${card.id}`}
                    chord={chord}
                    position={{ x: card.positionX, y: card.positionY }}
                    isSelected={selectedCards.has(card.id!)}
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

          <DragOverlay>
            {draggedChord && (
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3 opacity-90">
                <div className="font-bold text-gray-900 mb-2">{draggedChord.name}</div>
                <MiniChordViewer positions={draggedChord.fretPositions} />
              </div>
            )}
          </DragOverlay>
        </DndContext>

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
    </div>
  );
};
