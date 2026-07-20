-- Site-wide settings (singleton row) — currently just the global theme

CREATE TABLE IF NOT EXISTS site_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    name VARCHAR(255) NOT NULL DEFAULT 'serika dark',
    bg VARCHAR(7) NOT NULL DEFAULT '#323437',
    fg VARCHAR(7) NOT NULL DEFAULT '#d1d0c5',
    ac VARCHAR(7) NOT NULL DEFAULT '#e2b714',
    updated_by VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT site_settings_single_row CHECK (id = 1)
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

---- create above / drop below ----

DROP TABLE IF EXISTS site_settings;
