-- How long each chord lasts, in beats (default 1 = one beat). In 4/4 a full bar is 4 beats.
ALTER TABLE workspace_cards ADD COLUMN beats INTEGER NOT NULL DEFAULT 1;
