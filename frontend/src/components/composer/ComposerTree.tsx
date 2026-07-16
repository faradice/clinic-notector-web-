import { useState } from 'react';
import { CHORD_PACKS } from './chordPacks';
import type { Workspace } from '../../api/workspaces';

// A pack whose label is "Group — Child" (em-dash) is nested under a "Group" node;
// everything else is a flat leaf. Order follows CHORD_PACKS.
type PackNode =
  | { kind: 'pack'; id: string; label: string }
  | { kind: 'group'; label: string; children: { id: string; label: string }[] };

function buildPackTree(): PackNode[] {
  const nodes: PackNode[] = [];
  const groupAt = new Map<string, number>();
  for (const p of CHORD_PACKS) {
    const sep = p.label.indexOf(' — ');
    if (sep >= 0) {
      const group = p.label.slice(0, sep);
      const child = p.label.slice(sep + 3);
      if (!groupAt.has(group)) {
        groupAt.set(group, nodes.length);
        nodes.push({ kind: 'group', label: group, children: [] });
      }
      (nodes[groupAt.get(group)!] as { kind: 'group'; children: { id: string; label: string }[] }).children.push({ id: p.id, label: child });
    } else {
      nodes.push({ kind: 'pack', id: p.id, label: p.label });
    }
  }
  return nodes;
}

const PACK_TREE = buildPackTree();

const ROW = 'flex w-full items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-gray-100 disabled:opacity-50';
const CARET = 'inline-block w-3 shrink-0 text-gray-400';
const BULLET = 'inline-block w-3 shrink-0 text-center text-gray-300';
const CHILDREN = 'ml-3 border-l border-gray-200 pl-1';

interface Props {
  workspaces: Workspace[];
  currentWorkspaceId: number | null | undefined;
  loading: boolean;
  onPickPack: (packId: string) => void;
  onPickWorkspace: (ws: Workspace) => void;
}

export const ComposerTree: React.FC<Props> = ({
  workspaces,
  currentWorkspaceId,
  loading,
  onPickPack,
  onPickWorkspace,
}) => {
  const [open, setOpen] = useState<Record<string, boolean>>({ packs: true, workspaces: false });
  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const caret = (k: boolean) => (k ? '▾' : '▸');

  return (
    <ul role="tree" className="select-none text-sm text-gray-700">
      {/* Ready-made packs */}
      <li role="treeitem" aria-expanded={open.packs}>
        <button type="button" onClick={() => toggle('packs')} className={`${ROW} font-semibold`}>
          <span className={CARET} aria-hidden="true">{caret(open.packs)}</span>
          Tilbúnir pakkar
        </button>
        {open.packs && (
          <ul role="group" className={CHILDREN}>
            {PACK_TREE.map((node) =>
              node.kind === 'pack' ? (
                <li role="treeitem" key={node.id}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onPickPack(node.id)}
                    className={ROW}
                    title={`Búa til borð: ${node.label}`}
                  >
                    <span className={BULLET} aria-hidden="true">•</span> {node.label}
                  </button>
                </li>
              ) : (
                <li role="treeitem" aria-expanded={!!open['g:' + node.label]} key={node.label}>
                  <button type="button" onClick={() => toggle('g:' + node.label)} className={ROW}>
                    <span className={CARET} aria-hidden="true">{caret(!!open['g:' + node.label])}</span>
                    {node.label}
                  </button>
                  {open['g:' + node.label] && (
                    <ul role="group" className={CHILDREN}>
                      {node.children.map((c) => (
                        <li role="treeitem" key={c.id}>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => onPickPack(c.id)}
                            className={ROW}
                            title={`Búa til borð: ${node.label} — ${c.label}`}
                          >
                            <span className={BULLET} aria-hidden="true">•</span> {c.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ),
            )}
          </ul>
        )}
      </li>

      {/* Saved workspaces */}
      <li role="treeitem" aria-expanded={open.workspaces}>
        <button type="button" onClick={() => toggle('workspaces')} className={`${ROW} font-semibold`}>
          <span className={CARET} aria-hidden="true">{caret(open.workspaces)}</span>
          Mín vinnusvæði
        </button>
        {open.workspaces && (
          <ul role="group" className={CHILDREN}>
            {workspaces.length === 0 && (
              <li className="px-2 py-1 text-xs italic text-gray-400">Engin vinnusvæði enn</li>
            )}
            {workspaces.map((ws) => (
              <li role="treeitem" aria-selected={ws.id === currentWorkspaceId} key={ws.id}>
                <button
                  type="button"
                  onClick={() => onPickWorkspace(ws)}
                  className={`${ROW} ${ws.id === currentWorkspaceId ? 'bg-emerald-50 font-semibold text-emerald-700' : ''}`}
                  title={`Opna: ${ws.name}`}
                >
                  <span className={BULLET} aria-hidden="true">•</span> {ws.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </li>
    </ul>
  );
};
