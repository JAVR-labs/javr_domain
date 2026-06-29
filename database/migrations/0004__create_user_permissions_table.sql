CREATE TABLE user_permissions
(
    user_id       UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    permission_id UUID        NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions (user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions (permission_id);

-- Update schema version
INSERT INTO schema_version (version, description, script)
VALUES (4, 'Create user_permissions table', '0004__create_user_permissions_table.sql');