CREATE TABLE refresh_tokens
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE,
    issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    revoked_at TIMESTAMPTZ          DEFAULT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- Function to set the expiry date
CREATE
    OR REPLACE FUNCTION set_expiry_date()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.expires_at = NOW() + INTERVAL '7 days';
    RETURN NEW;
END;
$$
    LANGUAGE plpgsql;


-- Trigger to set the expiry date
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE
    ON refresh_tokens
    FOR EACH ROW
EXECUTE FUNCTION set_expiry_date();

-- Update schema version
INSERT INTO schema_version (version, description, script)
VALUES (2, 'Create refresh tokens table', '0002__create_refresh_tokens_table.sql');