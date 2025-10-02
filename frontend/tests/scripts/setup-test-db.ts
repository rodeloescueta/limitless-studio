#!/usr/bin/env tsx
/**
 * Setup script for test database
 * Creates the test database and runs migrations
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

const ADMIN_URL = 'postgresql://postgres:devPassword123!@localhost:5432/postgres';
const TEST_DB_NAME = 'content_reach_hub_test';
const TEST_DB_URL = `postgresql://postgres:devPassword123!@localhost:5432/${TEST_DB_NAME}`;

async function setupTestDatabase() {
  console.log('🚀 Setting up test database...');

  // Connect to postgres database to create test database
  const adminClient = postgres(ADMIN_URL, { max: 1 });

  try {
    // Drop existing test database if it exists
    console.log('📦 Dropping existing test database (if exists)...');
    await adminClient.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);

    // Create test database
    console.log('📦 Creating test database...');
    await adminClient.unsafe(`CREATE DATABASE ${TEST_DB_NAME}`);

    console.log('✅ Test database created successfully');
  } catch (error) {
    console.error('❌ Error creating test database:', error);
    throw error;
  } finally {
    await adminClient.end();
  }

  // Connect to test database and run migrations
  const testClient = postgres(TEST_DB_URL, { max: 1 });
  const db = drizzle(testClient);

  try {
    console.log('📦 Running migrations...');
    const migrationsPath = path.resolve(__dirname, '../../src/lib/db/migrations');

    await migrate(db, { migrationsFolder: migrationsPath });

    console.log('✅ Migrations completed successfully');
    console.log('✅ Test database setup complete!');
    console.log(`📍 Database URL: ${TEST_DB_URL}`);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  } finally {
    await testClient.end();
  }
}

// Run setup
setupTestDatabase()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
