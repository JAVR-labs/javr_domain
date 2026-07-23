CREATE TABLE IF NOT EXISTS token_blacklist
(
    id         SERIAL PRIMARY KEY,
    token_hash TEXT                     NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at
    ON token_blacklist (expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
    ON refresh_tokens (token_hash);

INSERT INTO schema_version (version, description, script)
VALUES (5, 'Create token blacklist and add expires_at to refresh_tokens',
        '0005__create_token_blacklist.sql');