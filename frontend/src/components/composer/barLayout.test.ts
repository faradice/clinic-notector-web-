import { describe, it, expect } from 'vitest';
import {
  BEATS_PER_BAR,
  DEFAULT_LAYOUT,
  barBoxes,
  barOrigin,
  beatAtPoint,
  insertIndexForBeat,
  layoutBars,
  moveItem,
} from './barLayout';

type C = { name: string; beats?: number };
const chords = (...specs: [string, number?][]): C[] =>
  specs.map(([name, beats]) => ({ name, beats }));
const lay = (items: C[]) => layoutBars(items, (c) => c.beats);

describe('layoutBars — fixed 4/4', () => {
  it('puts four one-beat chords in a single bar', () => {
    const { placed, barCount, totalBeats } = lay(chords(['C'], ['F'], ['G'], ['Am']));
    expect(barCount).toBe(1);
    expect(totalBeats).toBe(4);
    expect(placed.map((p) => p.bar)).toEqual([0, 0, 0, 0]);
    expect(placed.map((p) => p.beatInBar)).toEqual([0, 1, 2, 3]);
  });

  it('starts a new bar on the fifth beat', () => {
    const { placed, barCount } = lay(chords(['C'], ['F'], ['G'], ['Am'], ['D']));
    expect(barCount).toBe(2);
    expect(placed[4].bar).toBe(1);
    expect(placed[4].beatInBar).toBe(0);
  });

  it('gives a four-beat chord the whole bar', () => {
    const { placed, barCount } = lay(chords(['C', 4], ['G', 4]));
    expect(barCount).toBe(2);
    expect(placed[0].width).toBe(BEATS_PER_BAR * DEFAULT_LAYOUT.beatWidth);
    expect(placed[1].bar).toBe(1);
    expect(placed[1].beatInBar).toBe(0);
  });

  it('lets a chord run across a bar line rather than clipping it', () => {
    // 2 beats, then a 3-beat chord starting on beat 2 -> it ends inside bar 1.
    const { placed } = lay(chords(['C', 2], ['G', 3]));
    expect(placed[1].bar).toBe(0);
    expect(placed[1].beatInBar).toBe(2);
    expect(placed[1].startBeat + placed[1].beats).toBe(5); // past the end of bar 0
    expect(placed[1].width).toBe(3 * DEFAULT_LAYOUT.beatWidth);
  });

  it('treats a missing or silly beat count as one beat', () => {
    const { placed, totalBeats } = lay([{ name: 'C' }, { name: 'G', beats: 0 }, { name: 'D', beats: -3 }]);
    expect(placed.map((p) => p.beats)).toEqual([1, 1, 1]);
    expect(totalBeats).toBe(3);
  });

  it('wraps to a new row after barsPerRow bars', () => {
    const perRow = DEFAULT_LAYOUT.barsPerRow;
    const items = chords(...Array.from({ length: perRow + 1 }, () => ['C', 4] as [string, number]));
    const { placed } = layoutBars(items, (c) => c.beats);
    expect(placed[0].y).toBe(DEFAULT_LAYOUT.originY);
    expect(placed[perRow].y).toBe(DEFAULT_LAYOUT.originY + DEFAULT_LAYOUT.rowHeight);
    expect(placed[perRow].x).toBe(DEFAULT_LAYOUT.originX); // back to the left edge
  });

  it('shows one empty bar for an empty board so there is somewhere to drop', () => {
    const { placed, barCount } = lay([]);
    expect(placed).toEqual([]);
    expect(barCount).toBe(1);
    expect(barBoxes(barCount)).toHaveLength(1);
  });
});

describe('beatAtPoint', () => {
  it('round-trips the start of each bar', () => {
    for (const bar of [0, 1, 3, 4, 7]) {
      const { x, y } = barOrigin(bar, DEFAULT_LAYOUT);
      expect(beatAtPoint(x + 1, y + 1, 100)).toBe(bar * BEATS_PER_BAR);
    }
  });

  it('resolves beats within a bar', () => {
    const { x, y } = barOrigin(0, DEFAULT_LAYOUT);
    const b = DEFAULT_LAYOUT.beatWidth;
    expect(beatAtPoint(x + b * 0.5, y, 100)).toBe(0);
    expect(beatAtPoint(x + b * 1.5, y, 100)).toBe(1);
    expect(beatAtPoint(x + b * 3.5, y, 100)).toBe(3);
  });

  it('clamps to the board instead of inventing beats past the end', () => {
    expect(beatAtPoint(-500, -500, 8)).toBe(0);
    expect(beatAtPoint(99999, 99999, 8)).toBe(8);
  });
});

describe('insertIndexForBeat', () => {
  const { placed } = lay(chords(['C'], ['F'], ['G'], ['Am']));

  it('drops before the first chord', () => {
    expect(insertIndexForBeat(placed, 0)).toBe(0);
  });

  it('lands after a chord once past its midpoint', () => {
    expect(insertIndexForBeat(placed, 1)).toBe(1);
    expect(insertIndexForBeat(placed, 2)).toBe(2);
  });

  it('appends at the end', () => {
    expect(insertIndexForBeat(placed, 4)).toBe(4);
  });

  it('keeps a card in place when dropped on its own slot', () => {
    // Card at index 1 dropped back on beat 1: excluded from the count, so it returns to index 1.
    expect(insertIndexForBeat(placed, 1, 1)).toBe(1);
  });
});

describe('moveItem', () => {
  const seq = ['a', 'b', 'c', 'd'];

  it('moves a card into the middle', () => {
    expect(moveItem(seq, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('moves a card later', () => {
    expect(moveItem(seq, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('leaves the sequence alone for a no-op or an out-of-range index', () => {
    expect(moveItem(seq, 2, 2)).toBe(seq);
    expect(moveItem(seq, 9, 0)).toBe(seq);
  });
});
