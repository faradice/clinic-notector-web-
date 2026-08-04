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
