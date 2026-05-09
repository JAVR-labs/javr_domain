CREATE TABLE users
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    username      TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- Auto-update updated_at on row changes
CREATE
    OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Add trigger so `updated_at` is refreshed on record modification
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE
    ON users
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Update schema version
INSERT INTO schema_version (version, description, script)
VALUES (1, 'Create users table', '0001__create_users_table.sql');