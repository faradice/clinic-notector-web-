-- Bind a practice bar to a node on the note-reading path (lessonPath.ts ids: 'c-g', 'plus-e', ...).
-- Nullable on purpose: bars saved before this migration have no node, and the frontend places those
-- under the earliest lesson whose notes cover them (homeLessonId), so nothing has to be backfilled.
ALTER TABLE custom_bars ADD COLUMN lesson_id VARCHAR(64);

CREATE INDEX idx_custom_bars_lesson_id ON custom_bars(lesson_id);
