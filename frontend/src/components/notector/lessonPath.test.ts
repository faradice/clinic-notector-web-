import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LESSON_ID,
  LESSON_PATH,
  barFitsLesson,
  buildRound,
  drawNote,
  groupBarsByLesson,
  homeLessonId,
  lessonById,
  lessonForBar,
} from './lessonPath';

/** Deterministic rng cycling through the given values. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('LESSON_PATH — the curated ladder', () => {
  it('starts on C and G only', () => {
    expect(LESSON_PATH[0].notes).toEqual(['C4', 'G4']);
    expect(DEFAULT_LESSON_ID).toBe(LESSON_PATH[0].id);
  });

  it('adds notes in the agreed order: C+G, E, D/F, A/B', () => {
    expect(LESSON_PATH.map((n) => n.focus)).toEqual([[], ['E4'], ['D4', 'F4'], ['A4', 'B4']]);
  });

  it('never drops a note that an earlier step taught', () => {
    for (let i = 1; i < LESSON_PATH.length; i++) {
      for (const note of LESSON_PATH[i - 1].notes) {
        expect(LESSON_PATH[i].notes).toContain(note);
      }
    }
  });

  it('introduces exactly the notes that are new at each step', () => {
    for (let i = 1; i < LESSON_PATH.length; i++) {
      const added = LESSON_PATH[i].notes.filter((n) => !LESSON_PATH[i - 1].notes.includes(n));
      expect(added.sort()).toEqual([...LESSON_PATH[i].focus].sort());
    }
  });

  it('ends with all seven naturals', () => {
    expect([...LESSON_PATH[LESSON_PATH.length - 1].notes].sort())
      .toEqual(['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4']);
  });

  it('falls back to the first lesson for an unknown id', () => {
    expect(lessonById('nope').id).toBe(LESSON_PATH[0].id);
  });
});

describe('drawNote', () => {
  it('only ever draws notes the lesson contains', () => {
    for (const node of LESSON_PATH) {
      for (let i = 0; i < 200; i++) {
        expect(node.notes).toContain(drawNote(node));
      }
    }
  });

  it('draws from the whole pool when nothing is new (first lesson)', () => {
    const first = LESSON_PATH[0];
    expect(drawNote(first, seq(0))).toBe('C4');
    expect(drawNote(first, seq(0.99))).toBe('G4');
  });

  it('prefers the new note when the roll is under the focus share', () => {
    const plusE = lessonById('plus-e'); // notes C,E,G  focus E
    expect(drawNote(plusE, seq(0.1, 0))).toBe('E4');
  });

  it('draws a known note when the roll is above the focus share', () => {
    const plusE = lessonById('plus-e');
    // First roll 0.9 (> share) picks from the known notes C,G; second roll 0 picks the first of them.
    expect(drawNote(plusE, seq(0.9, 0))).toBe('C4');
  });

  it('still reaches the new note often enough to be practised', () => {
    const plusE = lessonById('plus-e');
    let hits = 0;
    for (let i = 0; i < 2000; i++) if (drawNote(plusE) === 'E4') hits++;
    // ~50% by design; a wide band keeps this from being a flaky statistical test.
    expect(hits).toBeGreaterThan(600);
    expect(hits).toBeLessThan(1400);
  });
});

describe('barFitsLesson', () => {
  it('accepts a bar whose notes the lesson has taught', () => {
    expect(barFitsLesson(lessonById('c-g'), ['C4', 'G4', 'C4'])).toBe(true);
  });

  it('rejects a bar using a note the lesson has not reached', () => {
    expect(barFitsLesson(lessonById('c-g'), ['C4', 'E4'])).toBe(false);
    expect(barFitsLesson(lessonById('plus-d-f'), ['C4', 'A4'])).toBe(false);
  });

  it('still accepts an early bar at a later lesson', () => {
    // Notes stay known, so a C/G bar remains practisable all the way up the ladder.
    for (const node of LESSON_PATH) {
      expect(barFitsLesson(node, ['C4', 'G4'])).toBe(true);
    }
  });

  it('rejects an empty bar — there is nothing to practise', () => {
    expect(barFitsLesson(lessonById('plus-a-b'), [])).toBe(false);
  });
});

describe('placing exercises on the ladder', () => {
  it('homes a bar at the earliest lesson that can play it', () => {
    expect(homeLessonId(['C4', 'G4'])).toBe('c-g');
    expect(homeLessonId(['C4', 'E4'])).toBe('plus-e');
    expect(homeLessonId(['F4', 'C4'])).toBe('plus-d-f');
    expect(homeLessonId(['B4'])).toBe('plus-a-b');
  });

  it('has no home for a bar no lesson teaches', () => {
    expect(homeLessonId(['C#4'])).toBeNull();
    expect(homeLessonId([])).toBeNull();
  });

  it('keeps an exercise at the node it was written for', () => {
    // Playable from 'c-g' onward, but written as an "+ A og B" exercise — it stays there.
    expect(lessonForBar({ notes: ['C4', 'G4'], lessonId: 'plus-a-b' })).toBe('plus-a-b');
  });

  it('ignores a lesson id that could not actually play the bar', () => {
    // A stale or hand-set id must not park an A exercise under "C og G".
    expect(lessonForBar({ notes: ['C4', 'A4'], lessonId: 'c-g' })).toBe('plus-a-b');
    expect(lessonForBar({ notes: ['C4'], lessonId: 'nope' })).toBe('c-g');
  });

  it('groups every bar exactly once, and keeps empty lessons in the map', () => {
    const bars = [
      { notes: ['C4', 'G4'] },                             // -> c-g
      { notes: ['C4', 'G4'], lessonId: 'plus-a-b' },        // -> plus-a-b (explicit)
      { notes: ['E4'] },                                   // -> plus-e
      { notes: ['C#4'] },                                  // nowhere
    ];
    const grouped = groupBarsByLesson(bars);
    expect([...grouped.keys()]).toEqual(LESSON_PATH.map((n) => n.id));
    expect(grouped.get('c-g')).toHaveLength(1);
    expect(grouped.get('plus-e')).toHaveLength(1);
    expect(grouped.get('plus-d-f')).toHaveLength(0);
    expect(grouped.get('plus-a-b')).toHaveLength(1);
    expect([...grouped.values()].flat()).toHaveLength(3); // the sharp bar is placed nowhere, not twice
  });
});

describe('buildRound', () => {
  it('returns exactly the requested number of notes', () => {
    for (const count of [1, 4, 8, 12]) {
      expect(buildRound(lessonById('plus-d-f'), count)).toHaveLength(count);
    }
  });

  it('keeps only carried-over notes the lesson actually contains', () => {
    // A4 is not in the "+ E" lesson, so a note missed at a later lesson must not leak back in.
    const round = buildRound(lessonById('plus-e'), 4, ['A4', 'C4']);
    expect(round).not.toContain('A4');
    expect(round).toContain('C4');
  });

  it('never exceeds the count even with more carry-over than room', () => {
    const round = buildRound(lessonById('plus-a-b'), 2, ['C4', 'D4', 'E4', 'F4']);
    expect(round).toHaveLength(2);
  });

  it('only contains notes from the lesson', () => {
    const node = lessonById('c-g');
    for (let i = 0; i < 100; i++) {
      for (const n of buildRound(node, 8)) expect(node.notes).toContain(n);
    }
  });
});
