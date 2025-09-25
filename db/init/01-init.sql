-- Initial database setup for Content Reach Hub
-- This file will be executed when the PostgreSQL container first starts

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial database (already created by POSTGRES_DB, but ensuring it exists)
-- Note: This script runs inside the database specified by POSTGRES_DB

-- Basic health check table to verify database connectivity
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status VARCHAR(10) DEFAULT 'ok',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health check record
INSERT INTO health_check (status) VALUES ('ok');

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Content Reach Hub database initialized successfully!';
END $$;