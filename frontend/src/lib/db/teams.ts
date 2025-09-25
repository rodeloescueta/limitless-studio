import { db } from './index';
import { teams, teamMembers, stages, users, contentCards } from './schema';
import { eq, and } from 'drizzle-orm';
import type { NewTeam, Team, NewStage } from './schema';

/**
 * Team Management Utilities
 */

export interface CreateTeamData {
  name: string;
  description?: string;
  createdBy: string;
  createDefaultStages?: boolean;
}

// Default REACH stages for new teams
const DEFAULT_STAGES = [
  { name: 'Research', position: 1, description: 'Research and ideation phase' },
  { name: 'Envision', position: 2, description: 'Content planning and framework design' },
  { name: 'Assemble', position: 3, description: 'Production and content creation' },
  { name: 'Connect', position: 4, description: 'Publishing and client approval' },
  { name: 'Hone', position: 5, description: 'Analytics and optimization' },
];

/**
 * Create a new team with optional default REACH stages
 */
export async function createTeamWithStages(teamData: CreateTeamData): Promise<Team> {
  const { createDefaultStages = true } = teamData;

  // Create team
  const [team] = await db.insert(teams).values({
    name: teamData.name,
    description: teamData.description,
    createdBy: teamData.createdBy,
  }).returning();

  // Add creator to team
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: teamData.createdBy,
  });

  // Create default stages if requested
  if (createDefaultStages) {
    const stagePromises = DEFAULT_STAGES.map(stage =>
      db.insert(stages).values({
        teamId: team.id,
        name: stage.name,
        position: stage.position,
        description: stage.description,
      })
    );

    await Promise.all(stagePromises);
  }

  return team;
}

/**
 * Get team by ID with full details
 */
export async function getTeamById(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      stages: {
        orderBy: (stages, { asc }) => [asc(stages.position)],
      },
      contentCards: {
        with: {
          assignedUser: true,
          createdByUser: true,
          stage: true,
        },
        orderBy: (contentCards, { desc }) => [desc(contentCards.updatedAt)],
      },
      createdBy: true,
    },
  });

  return team;
}

/**
 * Get all teams with basic info
 */
export async function getAllTeams(options?: { limit?: number; offset?: number }) {
  const { limit = 50, offset = 0 } = options || {};

  return await db.query.teams.findMany({
    limit,
    offset,
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      stages: {
        orderBy: (stages, { asc }) => [asc(stages.position)],
      },
      createdBy: true,
    },
    orderBy: (teams, { desc }) => [desc(teams.createdAt)],
  });
}

/**
 * Add user to team
 */
export async function addUserToTeam(userId: string, teamId: string): Promise<void> {
  // Check if membership already exists
  const existingMembership = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, teamId)
    ),
  });

  if (existingMembership) {
    throw new Error('User is already a member of this team');
  }

  await db.insert(teamMembers).values({
    teamId,
    userId,
  });
}

/**
 * Remove user from team
 */
export async function removeUserFromTeam(userId: string, teamId: string): Promise<void> {
  await db
    .delete(teamMembers)
    .where(and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, teamId)
    ));
}

/**
 * Get team members with user details
 */
export async function getTeamMembers(teamId: string) {
  return await db.query.teamMembers.findMany({
    where: eq(teamMembers.teamId, teamId),
    with: {
      user: {
        columns: {
          passwordHash: false, // Exclude sensitive data
        },
      },
    },
  });
}

/**
 * Get teams user belongs to
 */
export async function getUserTeams(userId: string) {
  return await db.query.teamMembers.findMany({
    where: eq(teamMembers.userId, userId),
    with: {
      team: {
        with: {
          stages: {
            orderBy: (stages, { asc }) => [asc(stages.position)],
          },
        },
      },
    },
  });
}

/**
 * Update team details
 */
export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description'>>
): Promise<Team> {
  const [team] = await db
    .update(teams)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId))
    .returning();

  return team;
}

/**
 * Delete team (cascades to members, stages, and cards)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await db.delete(teams).where(eq(teams.id, teamId));
}

/**
 * Check if user has access to team
 */
export async function userHasTeamAccess(userId: string, teamId: string): Promise<boolean> {
  const membership = await db.query.teamMembers.findFirst({
    where: and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, teamId)
    ),
  });

  return !!membership;
}

/**
 * Get team statistics
 */
export async function getTeamStats(teamId: string) {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      members: true,
      contentCards: {
        with: {
          stage: true,
        },
      },
      stages: true,
    },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  const cardsByStage = team.stages.map(stage => ({
    stageId: stage.id,
    stageName: stage.name,
    cardCount: team.contentCards.filter(card => card.stageId === stage.id).length,
  }));

  return {
    teamId: team.id,
    teamName: team.name,
    memberCount: team.members.length,
    totalCards: team.contentCards.length,
    stageCount: team.stages.length,
    cardsByStage,
  };
}