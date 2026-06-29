CREATE TABLE schema_version
(
    version     INTEGER      NOT NULL,
    description TEXT         NOT NULL,
    script      VARCHAR(255) NOT NULL UNIQUE,
    applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    PRIMARY KEY (version)
);

INSERT INTO schema_version (version, description, script)
VALUES (0, 'Initialize schema version tracking', '0000__init.sql');