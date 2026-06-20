CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_token_blacklist_expires_at ON token_blacklist (expires_at);

-- Update schema version
INSERT INTO schema_version (version, description, script)
VALUES (5, 'Create token blacklist table', '0005__create_token_blacklist.sql');