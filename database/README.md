# JAVR Domain - Database Documentation

This directory contains the PostgreSQL database configuration and migration scripts for the JAVR Domain project.

## Overview

The database is managed using Docker and a custom migration system. It stores user information, session tokens, and permissions.

## Tables

### 1. `users`
Stores user accounts.
- `id`: UUID (Primary Key)
- `username`: TEXT (Unique, used for login)
- `password_hash`: TEXT (Bcrypt hashed password)
- `is_active`: BOOLEAN (Default: true)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ (Auto-updated via trigger)

*Note: The `email` field was removed to simplify user management.*

### 2. `refresh_tokens`
Used for maintaining persistent login sessions.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to `users.id`, deletes on cascade)
- `token`: TEXT (Unique)
- `expires_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ

### 3. `schema_version`
Internal table used by the migration system to track which SQL scripts have been applied.
- `version`: INTEGER (Primary Key)
- `description`: TEXT
- `script`: VARCHAR (Unique file name)
- `applied_at`: TIMESTAMPTZ

### 6. `db_version`
A simplified tracking table for the current major schema version.
- `version`: INTEGER (Primary Key)
- `updated_at`: TIMESTAMPTZ

## Migrations

Migrations are stored in the `./migrations` directory as `.sql` files. They follow a naming convention: `XXXX__description.sql`.

### How it works:
1. **MigrationManager** (in `server_manager`) reads the `./migrations` directory.
2. It compares files on disk with the entries in the `schema_version` table.
3. New scripts are executed in alphabetical order.
4. Each script is responsible for registering itself in `schema_version`.

## Commands

### Start Database
```bash
docker-compose up -d
```

### Reset Database (Wipe all data)
```bash
docker-compose down -v
docker-compose up -d
```

### Run Migrations Manually
```bash
cd server_manager
node src/utils/run-migrations.js
```

### Seed Initial Users
```bash
cd server_manager
node src/utils/seed.js
```
