-- Songs table
CREATE TABLE songs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    lyrics TEXT,
    bpm INTEGER DEFAULT 120,
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    font_name VARCHAR(100),
    font_size INTEGER DEFAULT 14,
    font_bold BOOLEAN DEFAULT false,
    font_italic BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Song chord positions (annotations on lyrics)
CREATE TABLE song_chord_positions (
    id BIGSERIAL PRIMARY KEY,
    song_id BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    word_number INTEGER NOT NULL,
    chord_name VARCHAR(50) NOT NULL,
    char_offset INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_song_chord_positions_song_id ON song_chord_positions(song_id);

-- Chord library (reusable chord definitions)
CREATE TABLE chord_library (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    root_note VARCHAR(10) NOT NULL,
    chord_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chord fret positions (finger positions for chords)
CREATE TABLE chord_fret_positions (
    id BIGSERIAL PRIMARY KEY,
    chord_id BIGINT NOT NULL REFERENCES chord_library(id) ON DELETE CASCADE,
    string_number INTEGER NOT NULL CHECK (string_number BETWEEN 1 AND 6),
    fret_number INTEGER NOT NULL CHECK (fret_number BETWEEN 0 AND 24),
    finger INTEGER CHECK (finger BETWEEN 0 AND 4),
    is_base BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chord_fret_positions_chord_id ON chord_fret_positions(chord_id);

-- Workspaces for composer
CREATE TABLE workspaces (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Workspace cards (chords positioned on canvas)
CREATE TABLE workspace_cards (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    chord_id BIGINT NOT NULL REFERENCES chord_library(id) ON DELETE CASCADE,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workspace_cards_workspace_id ON workspace_cards(workspace_id);

-- Game scores for Notector
CREATE TABLE game_scores (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(100),
    score INTEGER NOT NULL,
    total_notes INTEGER NOT NULL,
    correct_notes INTEGER NOT NULL,
    bpm INTEGER NOT NULL,
    repetitions INTEGER NOT NULL,
    played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_scores_played_at ON game_scores(played_at DESC);

-- Song versions (backup history)
CREATE TABLE song_versions (
    id BIGSERIAL PRIMARY KEY,
    song_id BIGINT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_song_versions_song_id ON song_versions(song_id);
CREATE INDEX idx_song_versions_created_at ON song_versions(created_at DESC);
