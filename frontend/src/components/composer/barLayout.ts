/**
 * Bar-grid layout for the Composer board — fixed 4/4, four beats to a bar.
 *
 * Until now a board was a free canvas: every card carried hand-placed positionX/positionY and the
 * player derived its reading order by sorting on y (40px row tolerance) then x. That makes "two chords
 * in one bar" and "insert a chord in the middle" impossible to express — there is no structure to
 * insert into, only pixels.
 *
 * So position becomes DERIVED. The board is an ordered sequence of chords, each lasting `beats`; this
 * module turns that sequence into bar/beat coordinates and pixels. Insertion is then just splicing the
 * sequence and re-laying it out.
 *
 * A chord may run past a bar line (a 3-beat chord starting on beat 2 of the bar continues into the
 * next). That is deliberate — music does it — so the block is simply drawn across the line rather
 * than clipped or pushed.
 */

export const BEATS_PER_BAR = 4;

export type LayoutOptions = {
  /** Width of one beat in px. A whole bar is 4x this. */
  beatWidth: number;
  /** Vertical distance between rows of bars in px. */
  rowHeight: number;
  /** How many bars sit side by side before wrapping to the next row. */
  barsPerRow: number;
  /** Gap in px between two bars on the same row (where the bar line is drawn). */
  barGap: number;
  originX: number;
  originY: number;
};

export const DEFAULT_LAYOUT: LayoutOptions = {
  beatWidth: 60,
  rowHeight: 260,
  barsPerRow: 4,
  barGap: 16,
  originX: 24,
  originY: 24,
};

export type Placed<T> = {
  item: T;
  /** Index in the ordered sequence. */
  index: number;
  /** Absolute beat offset from the start of the board. */
  startBeat: number;
  beats: number;
  /** Bar the chord STARTS in (0-based). It may extend into later bars. */
  bar: number;
  /** Beat within that bar, 0..BEATS_PER_BAR-1. */
  beatInBar: number;
  x: number;
  y: number;
  /** Pixel width, proportional to the chord's beats. */
  width: number;
};

export type BarBox = {
  bar: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const barWidth = (o: LayoutOptions) => BEATS_PER_BAR * o.beatWidth;

/** Top-left pixel of a given bar. */
export function barOrigin(bar: number, o: LayoutOptions): { x: number; y: number } {
  const row = Math.floor(bar / o.barsPerRow);
  const col = bar % o.barsPerRow;
  return {
    x: o.originX + col * (barWidth(o) + o.barGap),
    y: o.originY + row * o.rowHeight,
  };
}

/**
 * Lay an ordered sequence of chords onto the bar grid.
 * `beatsOf` reads a chord's length; anything below 1 counts as 1 so a card can never be zero-width.
 */
export function layoutBars<T>(
  items: T[],
  beatsOf: (item: T) => number | undefined,
  options: Partial<LayoutOptions> = {},
): { placed: Placed<T>[]; totalBeats: number; barCount: number } {
  const o = { ...DEFAULT_LAYOUT, ...options };
  let startBeat = 0;
  const placed = items.map((item, index) => {
    const beats = Math.max(1, Math.round(beatsOf(item) ?? 1));
    const bar = Math.floor(startBeat / BEATS_PER_BAR);
    const beatInBar = startBeat % BEATS_PER_BAR;
    const origin = barOrigin(bar, o);
    const p: Placed<T> = {
      item,
      index,
      startBeat,
      beats,
      bar,
      beatInBar,
      x: origin.x + beatInBar * o.beatWidth,
      y: origin.y,
      width: beats * o.beatWidth,
    };
    startBeat += beats;
    return p;
  });
  // A board that ends mid-bar still occupies that bar, so round up — but an empty board shows one
  // empty bar rather than none, otherwise there is nothing to drop onto.
  const barCount = Math.max(1, Math.ceil(startBeat / BEATS_PER_BAR));
  return { placed, totalBeats: startBeat, barCount };
}

/** The bar rectangles to draw behind the cards. */
export function barBoxes(barCount: number, options: Partial<LayoutOptions> = {}): BarBox[] {
  const o = { ...DEFAULT_LAYOUT, ...options };
  return Array.from({ length: barCount }, (_, bar) => {
    const { x, y } = barOrigin(bar, o);
    return { bar, x, y, width: barWidth(o), height: o.rowHeight - o.barGap };
  });
}

/**
 * Which absolute beat does a point on the canvas fall on?
 * Used when a card is dropped: the drop point becomes a beat, and the beat becomes a place in the
 * sequence. Clamped to the board, so dropping past the end appends.
 */
export function beatAtPoint(
  x: number,
  y: number,
  totalBeats: number,
  options: Partial<LayoutOptions> = {},
): number {
  const o = { ...DEFAULT_LAYOUT, ...options };
  const row = Math.max(0, Math.floor((y - o.originY) / o.rowHeight));
  const col = Math.max(
    0,
    Math.min(o.barsPerRow - 1, Math.floor((x - o.originX) / (barWidth(o) + o.barGap))),
  );
  const bar = row * o.barsPerRow + col;
  const withinBar = x - barOrigin(bar, o).x;
  const beatInBar = Math.max(0, Math.min(BEATS_PER_BAR - 1, Math.floor(withinBar / o.beatWidth)));
  return Math.max(0, Math.min(totalBeats, bar * BEATS_PER_BAR + beatInBar));
}

/**
 * Where in the sequence does a dropped card belong, given the beat it landed on?
 * Returns an index in 0..placed.length. `movingIndex` (the card being dragged, if any) is excluded so
 * a card dropped onto its own slot keeps its place instead of shifting by one.
 */
export function insertIndexForBeat<T>(
  placed: Placed<T>[],
  beat: number,
  movingIndex?: number,
): number {
  let index = 0;
  for (const p of placed) {
    if (p.index === movingIndex) continue;
    // Land AFTER a chord once the drop point passes its midpoint, so dragging a little to the right
    // of a card means "put me after it" rather than "swap with it".
    if (beat >= p.startBeat + p.beats / 2) index++;
    else break;
  }
  return index;
}

/** Move an item within a sequence: the primitive behind both reordering and mid-board insertion. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return items;
  const next = [...items];
  const [taken] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, taken);
  return next;
}
