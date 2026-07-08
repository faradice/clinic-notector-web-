-- Custom practice bars for Notector (saved note sequences to loop for muscle memory)
CREATE TABLE custom_bars (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    notes VARCHAR(500) NOT NULL, -- comma-separated note list, e.g. "C4,E4,G4,D4"
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_bars_created_at ON custom_bars(created_at DESC);
