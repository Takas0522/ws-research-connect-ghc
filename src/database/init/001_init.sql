-- Initial database schema
-- This file runs automatically on first PostgreSQL startup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example table (replace with actual schema)
CREATE TABLE IF NOT EXISTS samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
