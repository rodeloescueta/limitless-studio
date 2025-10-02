import { testDb } from './db';
import * as schema from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

/**
 * Create a test user with specified role
 */
export async function createTestUser(data: {
  email?: string;
  password?: string;
  role?: 'admin' | 'strategist' | 'scriptwriter' | 'editor' | 'coordinator' | 'member' | 'client';
  firstName?: string;
  lastName?: string;
}) {
  const {
    email = `test-${Date.now()}@example.com`,
    password = 'password123',
    role = 'member',
    firstName = 'Test',
    lastName = 'User',
  } = data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await testDb
    .insert(schema.users)
    .values({
      email,
      passwordHash: hashedPassword,
      role,
      firstName,
      lastName,
    })
    .returning();

  return { ...user, plainPassword: password };
}

/**
 * Create multiple test users with different roles
 */
export async function createTestUsers() {
  const admin = await createTestUser({
    email: 'admin@test.local',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  });

  const strategist = await createTestUser({
    email: 'strategist@test.local',
    role: 'strategist',
    firstName: 'Strategic',
    lastName: 'Planner',
  });

  const scriptwriter = await createTestUser({
    email: 'scriptwriter@test.local',
    role: 'scriptwriter',
    firstName: 'Script',
    lastName: 'Writer',
  });

  const editor = await createTestUser({
    email: 'editor@test.local',
    role: 'editor',
    firstName: 'Content',
    lastName: 'Editor',
  });

  const coordinator = await createTestUser({
    email: 'coordinator@test.local',
    role: 'coordinator',
    firstName: 'Project',
    lastName: 'Coordinator',
  });

  return {
    admin,
    strategist,
    scriptwriter,
    editor,
    coordinator,
  };
}

/**
 * Create a mock NextAuth session for testing
 */
export function createMockSession(user: any) {
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };
}

/**
 * Mock NextAuth getServerSession for API route tests
 */
export function mockGetServerSession(session: any) {
  const { getServerSession } = require('next-auth');

  if (typeof getServerSession === 'function') {
    getServerSession.mockResolvedValue(session);
  }

  return session;
}

/**
 * Get user by email from test database
 */
export async function getUserByEmail(email: string) {
  const [user] = await testDb
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  return user;
}
