/**
 * The curated note-reading path — the "learn one note at a time" ladder.
 *
 * Why this exists: the game used to draw every note from one fixed pool of all seven naturals
 * (BASIC_NOTES, C4–B4), and the difficulty levels only changed HOW MANY notes a round had, whether the
 * bar repeated, and the tempo. Nothing ever narrowed WHICH notes appeared, so "Byrjandi" opened with all
 * seven at once. Learning to read music starts far smaller than that.
 *
 * Order chosen with Ragnar: **C+G first** (the two landmarks on the staff), then E, then D and F to fill
 * the gaps, then A and B. Each step keeps everything learned so far and adds one or two new notes.
 *
 * Each node carries both the available pool AND which notes are new at that step, so a round can weight
 * the new note. Without that weighting a step is just a bigger pool and the new note drowns in it.
 */

export type LessonNode = {
  id: string;
  /** Icelandic, shown in the UI. */
  name: string;
  description: string;
  /** Every note available at this step, including everything carried over. */
  notes: string[];
  /** The notes introduced BY this step. Empty for the first node (everything is new there). */
  focus: string[];
};

export const LESSON_PATH: LessonNode[] = [
  {
    id: 'c-g',
    name: 'C og G',
    description: 'Kennileitin tvö á stafnum',
    notes: ['C4', 'G4'],
    focus: [],
  },
  {
    id: 'plus-e',
    name: '+ E',
    description: 'E á milli C og G',
    notes: ['C4', 'E4', 'G4'],
    focus: ['E4'],
  },
  {
    id: 'plus-d-f',
    name: '+ D og F',
    description: 'Fyllir upp í bilin',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4'],
    focus: ['D4', 'F4'],
  },
  {
    id: 'plus-a-b',
    name: '+ A og B',
    description: 'Allar sjö nóturnar',
    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    focus: ['A4', 'B4'],
  },
];

export const DEFAULT_LESSON_ID = LESSON_PATH[0].id;

export function lessonById(id: string): LessonNode {
  return LESSON_PATH.find((n) => n.id === id) ?? LESSON_PATH[0];
}

/** How often a round should land on a newly introduced note, when the step has any. */
export const FOCUS_SHARE = 0.5;

type Rng = () => number;

const pick = <T,>(xs: T[], rng: Rng): T => xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))];

/**
 * Draw one note from a lesson node, favouring the notes that are new at this step.
 * Falls back to the whole pool when the step introduces nothing (the first node) or when it introduces
 * everything (nothing to contrast against).
 */
export function drawNote(node: LessonNode, rng: Rng = Math.random): string {
  const known = node.notes.filter((n) => !node.focus.includes(n));
  if (node.focus.length === 0 || known.length === 0) return pick(node.notes, rng);
  return rng() < FOCUS_SHARE ? pick(node.focus, rng) : pick(known, rng);
}

/**
 * Can this bar be practised at this lesson? True when every note in it is one the lesson has taught.
 *
 * This is what lets saved bars hang under a lesson in the tree without storing a lesson id on them: a
 * bar of C and G notes belongs under "C og G" and under every later lesson too, because those notes are
 * still known. A bar containing A cannot appear under "C og G" — the student has not met A yet.
 */
export function barFitsLesson(node: LessonNode, barNotes: string[]): boolean {
  return barNotes.length > 0 && barNotes.every((n) => node.notes.includes(n));
}

/**
 * The earliest lesson at which a bar becomes playable — its natural home on the ladder.
 * Null when no lesson covers it (e.g. a bar with a sharp, or an empty bar).
 */
export function homeLessonId(barNotes: string[]): string | null {
  return LESSON_PATH.find((n) => barFitsLesson(n, barNotes))?.id ?? null;
}

export type PlaceableBar = { notes: string[]; lessonId?: string | null };

/**
 * Which node an exercise hangs under in the tree.
 *
 * An explicit `lessonId` wins — that is the node it was written for, so a C/G bar deliberately made as
 * an "+ A og B" exercise stays there. Without one (every bar saved before the path existed) we fall back
 * to `homeLessonId`, the earliest lesson that can play it.
 *
 * An explicit id is ignored if the bar's notes are not all taught by then; otherwise a stale or hand-set
 * id could park an A-natural exercise under "C og G", which is exactly what the ladder is there to prevent.
 */
export function lessonForBar(bar: PlaceableBar): string | null {
  if (bar.lessonId) {
    const node = LESSON_PATH.find((n) => n.id === bar.lessonId);
    if (node && barFitsLesson(node, bar.notes)) return node.id;
  }
  return homeLessonId(bar.notes);
}

/**
 * Group exercises by the node they hang under. Every lesson gets an entry (possibly empty) and every bar
 * appears at most once — bars no lesson can place are left out.
 */
export function groupBarsByLesson<T extends PlaceableBar>(bars: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>(LESSON_PATH.map((n) => [n.id, []]));
  for (const bar of bars) {
    const id = lessonForBar(bar);
    if (id) map.get(id)!.push(bar);
  }
  return map;
}

/**
 * Build a round of `count` notes for a lesson.
 *
 * `carryOver` are notes missed in the previous round that should come back; they are kept only if the
 * current lesson still contains them, so switching lesson mid-practice cannot smuggle in a note the
 * student has not met yet.
 */
export function buildRound(
  node: LessonNode,
  count: number,
  carryOver: string[] = [],
  rng: Rng = Math.random,
): string[] {
  const notes = carryOver.filter((n) => node.notes.includes(n)).slice(0, count);
  while (notes.length < count) notes.push(drawNote(node, rng));
  // Shuffle so carried-over notes are not always first (Fisher-Yates; the old code used
  // sort(() => Math.random() - 0.5), which is not a uniform shuffle).
  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [notes[i], notes[j]] = [notes[j], notes[i]];
  }
  return notes;
}
