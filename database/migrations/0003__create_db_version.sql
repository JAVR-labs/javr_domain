CREATE TABLE db_version (
    version    INTEGER PRIMARY KEY,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize with current version (this file is 3, so we start at 3)
INSERT INTO db_version (version) VALUES (3);

-- Also log in the original schema_version table
INSERT INTO schema_version (version, description, script)
VALUES (3, 'Add db_version table for simplified tracking', '0003__create_db_version.sql');
