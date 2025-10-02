import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// Test database connection string
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:devPassword123!@localhost:5432/content_reach_hub_test';

// Create test database connection
const testClient = postgres(TEST_DATABASE_URL, {
  max: 1, // Single connection for tests
});

export const testDb = drizzle(testClient, { schema });

/**
 * Clear all tables in the test database
 * Run this before each test to ensure clean state
 */
export async function clearDatabase() {
  const tables = [
    'activity_feed',
    'alerts',
    'card_assignments',
    'card_team_shares',
    'comment_mentions',
    'notifications',
    'attachments',
    'comments',
    'content_cards',
    'stage_time_configs',
    'stages',
    'team_members',
    'teams',
    'client_profiles',
    'users',
  ];

  for (const table of tables) {
    await testDb.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
  }
}

/**
 * Reset database sequences after clearing
 */
export async function resetSequences() {
  await testDb.execute(sql`
    SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);
  `);
}

/**
 * Close database connection
 * Call this in afterAll() hooks
 */
export async function closeDatabase() {
  await testClient.end();
}

/**
 * Setup test database
 * Creates the test database if it doesn't exist
 */
export async function setupTestDatabase() {
  const adminClient = postgres(
    'postgresql://postgres:devPassword123!@localhost:5432/postgres',
    { max: 1 }
  );

  try {
    // Check if test database exists
    const result = await adminClient`
      SELECT 1 FROM pg_database WHERE datname = 'content_reach_hub_test'
    `;

    if (result.length === 0) {
      // Create test database
      await adminClient.unsafe('CREATE DATABASE content_reach_hub_test');
      console.log('✅ Test database created');
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
  } finally {
    await adminClient.end();
  }
}
