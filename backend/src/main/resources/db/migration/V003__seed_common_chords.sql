-- Seed the chord library with common open/first-position guitar chords.
-- Idempotent: ON CONFLICT (name) skips chords that already exist, and the
-- NOT EXISTS guard skips fret positions for any chord that already has them —
-- so this safely fills an empty (cloud) DB without disturbing existing data.

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('C', 'C', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,3),(4,2),(3,0),(2,1),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'C'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('A', 'A', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,2),(2,2),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'A'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('G', 'G', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,3),(5,2),(4,0),(3,0),(2,0),(1,3)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'G'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('E', 'E', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,0),(5,2),(4,2),(3,1),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'E'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('D', 'D', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,3),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'D'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('F', 'F', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,1),(5,3),(4,3),(3,2),(2,1),(1,1)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'F'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('B', 'B', 'major') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,2),(4,4),(3,4),(2,4),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'B'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Am', 'A', 'minor') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,2),(2,1),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Am'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Em', 'E', 'minor') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,0),(5,2),(4,2),(3,0),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Em'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Dm', 'D', 'minor') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,3),(1,1)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Dm'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Bm', 'B', 'minor') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,2),(4,4),(3,4),(2,3),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Bm'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('F#m', 'F#', 'minor') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,2),(5,4),(4,4),(3,2),(2,2),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'F#m'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Gm', 'G', 'minor') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,3),(5,5),(4,5),(3,3),(2,3),(1,3)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Gm'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('G7', 'G', '7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,3),(5,2),(4,0),(3,0),(2,0),(1,1)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'G7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('C7', 'C', '7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,3),(4,2),(3,3),(2,1),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'C7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('D7', 'D', '7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,1),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'D7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('A7', 'A', '7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,0),(2,2),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'A7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('E7', 'E', '7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,0),(5,2),(4,0),(3,1),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'E7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('B7', 'B', '7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,2),(4,1),(3,2),(2,0),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'B7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Cmaj7', 'C', 'maj7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,3),(4,2),(3,0),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Cmaj7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Amaj7', 'A', 'maj7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,1),(2,2),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Amaj7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Dmaj7', 'D', 'maj7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,2),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Dmaj7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Fmaj7', 'F', 'maj7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,3),(3,2),(2,1),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Fmaj7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Gmaj7', 'G', 'maj7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,3),(5,2),(4,0),(3,0),(2,0),(1,2)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Gmaj7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Emaj7', 'E', 'maj7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,0),(5,2),(4,1),(3,1),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Emaj7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Am7', 'A', 'm7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,0),(2,1),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Am7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Em7', 'E', 'm7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (6,0),(5,2),(4,0),(3,0),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Em7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Dm7', 'D', 'm7') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,1),(1,1)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Dm7'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Dsus4', 'D', 'sus4') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,3),(1,3)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Dsus4'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Asus4', 'A', 'sus4') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,2),(2,3),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Asus4'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Dsus2', 'D', 'sus2') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (4,0),(3,2),(2,3),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Dsus2'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

INSERT INTO chord_library (name, root_note, chord_type)
VALUES ('Asus2', 'A', 'sus2') ON CONFLICT (name) DO NOTHING;
INSERT INTO chord_fret_positions (chord_id, string_number, fret_number, finger)
SELECT c.id, v.string_number, v.fret_number, 0
FROM chord_library c
JOIN (VALUES (5,0),(4,2),(3,2),(2,0),(1,0)) AS v(string_number, fret_number) ON TRUE
WHERE c.name = 'Asus2'
  AND NOT EXISTS (SELECT 1 FROM chord_fret_positions p WHERE p.chord_id = c.id);

