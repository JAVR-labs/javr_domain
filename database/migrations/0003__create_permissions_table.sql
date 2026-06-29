CREATE TABLE permissions
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE INDEX idx_permissions_name ON permissions (name);

-- Update schema version
INSERT INTO schema_version (version, description, script)
VALUES (3, 'Create permissions table', '0003__create_permissions_table.sql');