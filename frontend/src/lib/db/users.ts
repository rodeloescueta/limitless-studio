import { db } from './index';
import { users, teamMembers, teams } from './schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { NewUser, User } from './schema';

/**
 * User Management Utilities
 */

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'member' | 'client';
}

export interface UpdateUserPasswordData {
  userId: string;
  newPassword: string;
  markAsNotFirstLogin?: boolean;
}

/**
 * Create a new user with hashed password
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const [user] = await db.insert(users).values({
    email: userData.email,
    passwordHash: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role || 'member',
    isFirstLogin: true,
  }).returning();

  return user;
}

/**
 * Get user by email with team memberships
 */
export async function getUserByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      teamMemberships: {
        with: {
          team: true,
        },
      },
    },
  });

  return user;
}

/**
 * Get user by ID with full relationships
 */
export async function getUserById(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMemberships: {
        with: {
          team: {
            with: {
              stages: true,
            },
          },
        },
      },
      assignedCards: true,
      createdCards: true,
    },
  });

  return user;
}

/**
 * Update user password and mark as not first login
 */
export async function updateUserPassword({
  userId,
  newPassword,
  markAsNotFirstLogin = true,
}: UpdateUserPasswordData): Promise<User> {
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const [user] = await db
    .update(users)
    .set({
      passwordHash: hashedPassword,
      isFirstLogin: markAsNotFirstLogin ? false : undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user;
}

/**
 * Verify user password
 */
export async function verifyUserPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

/**
 * Get all users with pagination
 */
export async function getUsers(options?: {
  limit?: number;
  offset?: number;
  role?: 'admin' | 'member' | 'client';
}) {
  const { limit = 50, offset = 0, role } = options || {};

  const query = db.query.users.findMany({
    limit,
    offset,
    where: role ? eq(users.role, role) : undefined,
    with: {
      teamMemberships: {
        with: {
          team: true,
        },
      },
    },
    orderBy: (users, { asc }) => [asc(users.createdAt)],
  });

  return await query;
}

/**
 * Delete user (removes from teams first)
 */
export async function deleteUser(userId: string): Promise<void> {
  // Remove from all teams first (cascade should handle this, but being explicit)
  await db.delete(teamMembers).where(eq(teamMembers.userId, userId));

  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.role, 'admin')),
  });

  return !!user;
}