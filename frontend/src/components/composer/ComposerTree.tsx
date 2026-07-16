import { useMemo, useRef, useState } from 'react';
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

const ROW = 'flex w-full items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50';
const CARET = 'inline-block w-3 shrink-0 text-gray-400';
const BULLET = 'inline-block w-3 shrink-0 text-center text-gray-300';
const CHILDREN = 'ml-3 border-l border-gray-200 pl-1';

// A visible row in reading order — the model the arrow keys navigate.
type Row = { key: string; level: number; role: 'branch' | 'leaf'; expanded?: boolean };

interface Props {
  workspaces: Workspace[];
  currentWorkspaceId: number | null | undefined;
  loading: boolean;
  onPickPack: (packId: string) => void;
  onPickWorkspace: (ws: Workspace) => void;
  /** Library grouped by root note; each chord carries its name (for filtering). */
  libraryGroups: { root: string; chords: { id: number; name: string; node: React.ReactNode }[] }[];
}

export const ComposerTree: React.FC<Props> = ({
  workspaces,
  currentWorkspaceId,
  loading,
  onPickPack,
  onPickWorkspace,
  libraryGroups,
}) => {
  const [open, setOpen] = useState<Record<string, boolean>>({ packs: true, workspaces: false, library: true });
  const [active, setActive] = useState('packs');
  const [query, setQuery] = useState('');
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const q = query.trim().toLowerCase();
  // While filtering, force the library and any matching group open so results show.
  const libOpen = q ? true : open.library;
  const groupOpen = (gkey: string) => (q ? true : !!open[gkey]);

  // Filter chords by name; drop empty groups and recompute counts.
  const filteredGroups = useMemo(
    () =>
      libraryGroups
        .map((g) => {
          const chords = q ? g.chords.filter((c) => c.name.toLowerCase().includes(q)) : g.chords;
          return { root: g.root, count: chords.length, items: chords.map((c) => c.node) };
        })
        .filter((g) => g.count > 0),
    [libraryGroups, q],
  );

  const toggle = (key: string) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const caret = (k: boolean) => (k ? '▾' : '▸');
  const reg = (k: string) => (el: HTMLButtonElement | null) => {
    if (el) rowRefs.current.set(k, el);
    else rowRefs.current.delete(k);
  };

  // Flatten the currently-visible rows, in reading order, for keyboard nav.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [{ key: 'packs', level: 0, role: 'branch', expanded: open.packs }];
    if (open.packs) {
      for (const node of PACK_TREE) {
        if (node.kind === 'pack') {
          out.push({ key: 'leaf:' + node.id, level: 1, role: 'leaf' });
        } else {
          const gkey = 'g:' + node.label;
          out.push({ key: gkey, level: 1, role: 'branch', expanded: !!open[gkey] });
          if (open[gkey]) node.children.forEach((c) => out.push({ key: 'leaf:' + c.id, level: 2, role: 'leaf' }));
        }
      }
    }
    out.push({ key: 'workspaces', level: 0, role: 'branch', expanded: open.workspaces });
    if (open.workspaces) workspaces.forEach((ws) => out.push({ key: 'ws:' + ws.id, level: 1, role: 'leaf' }));
    out.push({ key: 'library', level: 0, role: 'branch', expanded: libOpen });
    if (libOpen) {
      // Each root-note group is a keyboard branch; its cards are draggable, not leaves.
      filteredGroups.forEach((g) => out.push({ key: 'root:' + g.root, level: 1, role: 'branch', expanded: groupOpen('root:' + g.root) }));
    }
    return out;
  }, [open, workspaces, filteredGroups, libOpen, q]);

  // Keep the roving focus on a row that still exists (e.g. after a collapse).
  const activeKey = rows.some((r) => r.key === active) ? active : rows[0]?.key ?? '';

  const focusRow = (idx: number) => {
    const t = rows[Math.max(0, Math.min(rows.length - 1, idx))];
    if (!t) return;
    setActive(t.key);
    rowRefs.current.get(t.key)?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = rows.findIndex((r) => r.key === activeKey);
    if (idx < 0) return;
    const row = rows[idx];
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); focusRow(idx + 1); break;
      case 'ArrowUp': e.preventDefault(); focusRow(idx - 1); break;
      case 'Home': e.preventDefault(); focusRow(0); break;
      case 'End': e.preventDefault(); focusRow(rows.length - 1); break;
      case 'ArrowRight':
        e.preventDefault();
        if (row.role === 'branch') {
          if (!row.expanded) toggle(row.key);
          else focusRow(idx + 1); // first child is the next visible row
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (row.role === 'branch' && row.expanded) {
          toggle(row.key); // collapse
        } else {
          // move to parent: nearest earlier row at a shallower level
          for (let i = idx - 1; i >= 0; i--) {
            if (rows[i].level < row.level) { focusRow(i); break; }
          }
        }
        break;
      // Enter/Space activate natively via the focused <button>.
    }
  };

  const rove = (k: string) => ({
    tabIndex: activeKey === k ? 0 : -1,
    onFocus: () => setActive(k),
    ref: reg(k),
  });

  return (
    <div className="space-y-2">
      {/* Filter the chord library */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sía hljóma…"
          aria-label="Sía hljóma"
          className="w-full rounded border border-gray-300 py-1.5 pl-7 pr-7 text-sm"
        />
        <span aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Hreinsa síu"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded px-1 text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      <ul role="tree" aria-label="Pakkar og vinnusvæði" className="select-none text-sm text-gray-700" onKeyDown={handleKeyDown}>
        {/* Ready-made packs */}
      <li role="treeitem" aria-expanded={open.packs}>
        <button type="button" {...rove('packs')} onClick={() => toggle('packs')} className={`${ROW} font-semibold`}>
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
                    {...rove('leaf:' + node.id)}
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
                  <button type="button" {...rove('g:' + node.label)} onClick={() => toggle('g:' + node.label)} className={ROW}>
                    <span className={CARET} aria-hidden="true">{caret(!!open['g:' + node.label])}</span>
                    {node.label}
                  </button>
                  {open['g:' + node.label] && (
                    <ul role="group" className={CHILDREN}>
                      {node.children.map((c) => (
                        <li role="treeitem" key={c.id}>
                          <button
                            type="button"
                            {...rove('leaf:' + c.id)}
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
        <button type="button" {...rove('workspaces')} onClick={() => toggle('workspaces')} className={`${ROW} font-semibold`}>
          <span className={CARET} aria-hidden="true">{caret(open.workspaces)}</span>
          Mín vinnusvæði
        </button>
        {open.workspaces && (
          <ul role="group" className={CHILDREN}>
            {workspaces.length === 0 && (
              <li role="none" className="px-2 py-1 text-xs italic text-gray-400">Engin vinnusvæði enn</li>
            )}
            {workspaces.map((ws) => (
              <li role="treeitem" aria-selected={ws.id === currentWorkspaceId} key={ws.id}>
                <button
                  type="button"
                  {...rove('ws:' + ws.id)}
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

      {/* Chord library — the draggable source cards, grouped by root note */}
      <li role="treeitem" aria-expanded={libOpen}>
        <button type="button" {...rove('library')} onClick={() => toggle('library')} className={`${ROW} font-semibold`}>
          <span className={CARET} aria-hidden="true">{caret(libOpen)}</span>
          Hljómar
        </button>
        {libOpen && (
          <ul role="group" className={CHILDREN}>
            {filteredGroups.length === 0 && (
              <li role="none" className="px-2 py-2 text-xs italic text-gray-400">
                {q ? `Enginn hljómur passar við „${query.trim()}“` : 'Engir hljómar í safninu'}
              </li>
            )}
            {filteredGroups.map((g) => {
              const gkey = 'root:' + g.root;
              const gopen = groupOpen(gkey);
              return (
                <li role="treeitem" aria-expanded={gopen} key={g.root}>
                  <button type="button" {...rove(gkey)} onClick={() => toggle(gkey)} className={ROW}>
                    <span className={CARET} aria-hidden="true">{caret(gopen)}</span>
                    {g.root}
                    <span className="ml-1 text-xs font-normal text-gray-400">({g.count})</span>
                  </button>
                  {gopen && (
                    <ul role="group" className={CHILDREN}>
                      <li role="none">
                        <div className="space-y-2 py-2 pr-1">{g.items}</div>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </li>
      </ul>
    </div>
  );
};
