import { useEffect, useMemo, useRef, useState } from 'react';
import type { CustomBar } from '../../api/customBars';
import { LESSON_PATH, groupBarsByLesson } from './lessonPath';

/**
 * The note-reading path as a tree: each lesson is a node you can select, and your saved exercises hang
 * underneath the node they belong to.
 *
 * Placement is `lessonForBar`: the node the exercise was written for, or — for bars saved before the path
 * existed — the earliest lesson that can play it. Each exercise therefore appears exactly once, which is
 * what makes the tree an outline of the work rather than a list repeated at every level. (Playability is
 * a separate matter: an exercise homed at an earlier node is still practisable later, since those notes
 * stay known.)
 *
 * Keyboard behaviour and ARIA follow ComposerTree: roving tabindex, ↑/↓/Home/End to move, →/← to
 * expand/collapse or step to the parent, Enter/Space activating the focused <button> natively. Wrapper
 * <li>s that are not treeitems carry role="none" (axe's listitem rule).
 */

type Props = {
  lessonId: string;
  onSelectLesson: (id: string) => void;
  bars: CustomBar[];
  /** Practise a saved bar (the game switches to Muscle Memory and loops it). */
  onSelectBar: (id: number) => void;
  /** Write a new exercise under this lesson (opens the bar builder bound to it). */
  onAddExercise: (lessonId: string) => void;
  onDeleteBar: (id: number) => void;
  selectedBarId: number | 'random';
  /** Locked while a round is running, so practice cannot change under the player. */
  disabled?: boolean;
};

const ROW =
  'w-full text-left px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent';
const CHILDREN = 'ml-4 border-l border-gray-200 pl-2';
const letters = (notes: string[]) => notes.map((n) => n.replace(/[0-9]/g, '')).join(' ');

export const NotectorTree: React.FC<Props> = ({
  lessonId,
  onSelectLesson,
  bars,
  onSelectBar,
  onAddExercise,
  onDeleteBar,
  selectedBarId,
  disabled = false,
}) => {
  // The lesson being practised starts expanded so its exercises are visible without hunting.
  const [open, setOpen] = useState<Record<string, boolean>>({ path: true, [lessonId]: true });
  // ...and every later switch of lesson expands the new one too — the useState initialiser above only
  // runs on mount, so without this you had to click ▸ after changing step. Collapsing it by hand still
  // works; it just reopens the next time the selection lands on it.
  useEffect(() => {
    setOpen((o) => (o[lessonId] ? o : { ...o, path: true, [lessonId]: true }));
  }, [lessonId]);
  const [active, setActive] = useState('path');
  const rowRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const reg = (k: string) => (el: HTMLButtonElement | null) => {
    rowRefs.current.set(k, el);
  };
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const barsFor = useMemo(() => groupBarsByLesson(bars), [bars]);

  // Flattened list of visible rows — the keyboard model works on this, not on the DOM tree.
  const rows = useMemo(() => {
    const out: { key: string; level: number; role: 'branch' | 'leaf'; expanded?: boolean }[] = [
      { key: 'path', level: 0, role: 'branch', expanded: open.path },
    ];
    if (open.path) {
      for (const node of LESSON_PATH) {
        out.push({ key: node.id, level: 1, role: 'branch', expanded: !!open[node.id] });
        if (open[node.id]) {
          for (const bar of barsFor.get(node.id) ?? []) {
            out.push({ key: `${node.id}:bar:${bar.id}`, level: 2, role: 'leaf' });
          }
          out.push({ key: `${node.id}:new`, level: 2, role: 'leaf' }); // "ný æfing" row
        }
      }
    }
    return out;
  }, [open, barsFor]);

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
          else focusRow(idx + 1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (row.role === 'branch' && row.expanded) {
          toggle(row.key);
        } else {
          for (let i = idx - 1; i >= 0; i--) {
            if (rows[i].level < row.level) { focusRow(i); break; }
          }
        }
        break;
    }
  };

  const rove = (k: string) => ({
    tabIndex: activeKey === k ? 0 : -1,
    onFocus: () => setActive(k),
    ref: reg(k),
  });

  return (
    <ul
      role="tree"
      aria-label="Nótnaleið"
      className="select-none text-sm text-gray-700"
      onKeyDown={handleKeyDown}
    >
      <li role="treeitem" aria-expanded={open.path}>
        <button type="button" {...rove('path')} onClick={() => toggle('path')} className={`${ROW} font-semibold`}>
          {open.path ? '▾' : '▸'} Tilbúin leið
        </button>
        {open.path && (
          <ul role="group" className={CHILDREN}>
            {LESSON_PATH.map((node) => {
              const nodeBars = barsFor.get(node.id) ?? [];
              const isCurrent = node.id === lessonId;
              return (
                <li role="treeitem" aria-expanded={!!open[node.id]} aria-selected={isCurrent} key={node.id}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggle(node.id)}
                      aria-label={`${open[node.id] ? 'Loka' : 'Opna'} ${node.name}`}
                      className="px-1 text-gray-400 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {open[node.id] ? '▾' : '▸'}
                    </button>
                    <button
                      type="button"
                      {...rove(node.id)}
                      onClick={() => onSelectLesson(node.id)}
                      disabled={disabled}
                      className={`${ROW} ${isCurrent ? 'bg-emerald-50 font-semibold text-emerald-800' : ''}`}
                    >
                      {node.name}
                      <span className="ml-2 text-xs text-gray-500">{letters(node.notes)}</span>
                      {node.focus.length > 0 && (
                        <span className="ml-2 text-xs text-emerald-700">ný: {letters(node.focus)}</span>
                      )}
                    </button>
                  </div>
                  {open[node.id] && (
                    <ul role="group" className={CHILDREN}>
                      {nodeBars.length === 0 && (
                        <li role="none" className="px-2 py-1 text-xs italic text-gray-400">
                          Engin æfing hér enn
                        </li>
                      )}
                      {nodeBars.map((bar) => (
                        <li role="treeitem" aria-selected={bar.id === selectedBarId} key={bar.id}>
                          <div className="flex items-center">
                            <button
                              type="button"
                              {...rove(`${node.id}:bar:${bar.id}`)}
                              onClick={() => bar.id != null && onSelectBar(bar.id)}
                              disabled={disabled}
                              className={`${ROW} ${bar.id === selectedBarId ? 'bg-purple-50 font-semibold text-purple-800' : ''}`}
                            >
                              🎵 {bar.name}
                              <span className="ml-2 text-xs text-gray-500">{letters(bar.notes)}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => bar.id != null && onDeleteBar(bar.id)}
                              disabled={disabled}
                              aria-label={`Eyða æfingu ${bar.name}`}
                              tabIndex={-1}
                              className="px-2 py-1 text-gray-400 hover:text-red-500 disabled:opacity-40"
                            >
                              <span aria-hidden="true">🗑</span>
                            </button>
                          </div>
                        </li>
                      ))}
                      <li role="treeitem" key="new">
                        <button
                          type="button"
                          {...rove(`${node.id}:new`)}
                          onClick={() => onAddExercise(node.id)}
                          disabled={disabled}
                          className={`${ROW} text-blue-700`}
                        >
                          ＋ Ný æfing undir {node.name}
                        </button>
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
  );
};
