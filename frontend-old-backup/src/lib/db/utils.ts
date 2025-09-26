/**
 * Database Utilities - Main exports
 *
 * This file provides a centralized export of all database utility functions
 * organized by domain for easy importing in the application.
 */

// User utilities
export {
  createUser,
  getUserByEmail,
  getUserById,
  updateUserPassword,
  verifyUserPassword,
  getUsers,
  deleteUser,
  isUserAdmin,
  type CreateUserData,
  type UpdateUserPasswordData,
} from './users';

// Team utilities
export {
  createTeamWithStages,
  getTeamById,
  getAllTeams,
  addUserToTeam,
  removeUserFromTeam,
  getTeamMembers,
  getUserTeams,
  updateTeam,
  deleteTeam,
  userHasTeamAccess,
  getTeamStats,
  type CreateTeamData,
} from './teams';

// Content card utilities
export {
  createContentCard,
  getContentCardById,
  getTeamCards,
  getCardsByStage,
  updateContentCard,
  moveCard,
  deleteContentCard,
  getUserAssignedCards,
  getUserCreatedCards,
  getOverdueCards,
  type CreateCardData,
  type UpdateCardData,
  type MoveCardData,
} from './content-cards';

// Seeding utilities
export {
  seedAdminUser,
  seedDefaultTeam,
  runSeeder,
} from './seed';

// Core database exports
export { db } from './index';
export type {
  User,
  NewUser,
  Team,
  NewTeam,
  TeamMember,
  NewTeamMember,
  Stage,
  NewStage,
  ContentCard,
  NewContentCard,
  UserRole,
  ContentPriority,
} from './schema';

/**
 * Common database patterns and helpers
 */

/**
 * Database transaction wrapper
 * Usage: await withTransaction(async (tx) => { ... })
 */
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}

/**
 * Check if record exists by ID
 */
export async function recordExists(
  table: any,
  id: string
): Promise<boolean> {
  const record = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return record.length > 0;
}

/**
 * Pagination helper
 */
export function getPaginationParams(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  return { limit, offset };
}

/**
 * Date range helpers
 */
export function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

// Import required functions for helpers
import { eq } from 'drizzle-orm';
import { db } from './index';