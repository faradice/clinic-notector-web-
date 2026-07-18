// Movable-shape chord generator. Most guitar chords are one barre shape slid up
// the neck: an "E-form" (root on the low-E string) or an "A-form" (root on the A
// string). We keep one template per chord type and shift it so the root lands on
// the right fret — 12 roots × ~11 types all come out of a handful of templates,
// always with the correct notes. Used as the fallback in chordFromName when the
// curated open-chord table has no entry.

// Pitch class of each root spelling (C = 0).
const ROOT_PC: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

// Fret offsets from the barre (root) fret, string order [lowE, A, D, G, B, e].
// Each is a standard open shape (E, Em, E7 …) written as offsets so it transposes.
const E_FORMS: Record<string, number[]> = {
  major: [0, 2, 2, 1, 0, 0],
  m: [0, 2, 2, 0, 0, 0],
  '6': [0, 2, 2, 1, 2, 0],
  '7': [0, 2, 0, 1, 0, 0],
  '9': [0, 2, 0, 1, 0, 2],
  m6: [0, 2, 2, 0, 2, 0],
  m7: [0, 2, 0, 0, 0, 0],
  maj7: [0, 2, 1, 1, 0, 0],
  aug: [0, 3, 2, 1, 1, 0],
  sus4: [0, 2, 2, 2, 0, 0],
};

// A-form templates, string order [A, D, G, B, e] (low-E muted). Standard A shapes.
const A_FORMS: Record<string, number[]> = {
  major: [0, 2, 2, 2, 0],
  m: [0, 2, 2, 1, 0],
  '6': [0, 2, 2, 2, 2],
  '7': [0, 2, 0, 2, 0],
  '9': [0, 2, 4, 2, 3],
  m6: [0, 2, 2, 1, 2],
  m7: [0, 2, 0, 1, 0],
  maj7: [0, 2, 1, 2, 0],
  aug: [0, 3, 2, 2, 1],
  sus4: [0, 2, 2, 3, 0],
  sus2: [0, 2, 2, 0, 0],
};

// Map a chord-name suffix to a template key.
const SUFFIX: Record<string, string> = {
  '': 'major', m: 'm', '6': '6', '7': '7', '9': '9', m6: 'm6', m7: 'm7',
  maj7: 'maj7', dim: 'dim7', dim7: 'dim7', aug: 'aug', '+': 'aug',
  sus: 'sus4', sus4: 'sus4', sus2: 'sus2',
};

/**
 * Generate a movable voicing for a chord name (e.g. "F#m7", "Bbmaj7", "C9"), or
 * null if we can't parse it. Returns a shape array [lowE … e] (-1 = muted, 0 =
 * open, n = fret n) — same convention as the shape table.
 */
export function generateVoicing(name: string): number[] | null {
  const m = name.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  const pc = ROOT_PC[m[1]];
  const type = SUFFIX[m[2]];
  if (pc == null || !type) return null;

  // dim7 is symmetric (stacked minor thirds) — one A-string grip covers it; bump
  // up a diminished cycle (3 frets) when the shape would fall below the nut.
  if (type === 'dim7') {
    let r = (pc - 9 + 12) % 12;
    if (r < 1) r += 3;
    return [-1, r, r + 1, r - 1, r + 1, -1];
  }

  const r6 = (pc - 4 + 12) % 12; // root fret on the low-E string (E-form)
  const r5 = (pc - 9 + 12) % 12; // root fret on the A string (A-form)
  const eForm = E_FORMS[type];
  const aForm = A_FORMS[type];

  // Prefer whichever form sits lower on the neck (this also yields open chords).
  if (eForm && (!aForm || r6 <= r5)) return eForm.map((o) => r6 + o);
  if (aForm) return [-1, ...aForm.map((o) => r5 + o)];
  return null;
}
