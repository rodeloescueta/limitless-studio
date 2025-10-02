import { testDb } from './db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a test team with specified creator
 */
export async function createTestTeam(data: {
  name?: string;
  description?: string;
  createdBy: string; // User ID
}) {
  const {
    name = `Test Team ${Date.now()}`,
    description = 'Test team description',
    createdBy,
  } = data;

  const [team] = await testDb
    .insert(schema.teams)
    .values({
      name,
      description,
      createdBy,
    })
    .returning();

  // Automatically add creator as team member
  await testDb
    .insert(schema.teamMembers)
    .values({
      teamId: team.id,
      userId: createdBy,
    });

  return team;
}

/**
 * Add a member to a team
 */
export async function addTeamMember(data: {
  teamId: string;
  userId: string;
  role?: 'admin' | 'member';
}) {
  const { teamId, userId, role = 'member' } = data;

  const [member] = await testDb
    .insert(schema.teamMembers)
    .values({
      teamId,
      userId,
      role,
    })
    .returning();

  return member;
}

/**
 * Create a team with members
 */
export async function createTestTeamWithMembers(data: {
  name?: string;
  createdBy: string;
  members: Array<{ userId: string; role?: 'admin' | 'member' }>;
}) {
  const team = await createTestTeam({
    name: data.name,
    createdBy: data.createdBy,
  });

  const teamMembers = await Promise.all(
    data.members.map((member) =>
      addTeamMember({
        teamId: team.id,
        userId: member.userId,
        role: member.role,
      })
    )
  );

  return { team, members: teamMembers };
}

/**
 * Create default REACH stages for a team
 */
export async function createStagesForTeam(teamId: string) {
  const stageData = [
    { name: 'Research', position: 0, color: '#3B82F6' },
    { name: 'Envision', position: 1, color: '#8B5CF6' },
    { name: 'Assemble', position: 2, color: '#EC4899' },
    { name: 'Connect', position: 3, color: '#F59E0B' },
    { name: 'Hone', position: 4, color: '#10B981' },
  ];

  const stages = await Promise.all(
    stageData.map(async (stage) => {
      const [created] = await testDb
        .insert(schema.stages)
        .values({
          teamId,
          name: stage.name,
          position: stage.position,
          color: stage.color,
        })
        .returning();
      return created;
    })
  );

  return {
    research: stages[0],
    envision: stages[1],
    assemble: stages[2],
    connect: stages[3],
    hone: stages[4],
  };
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string) {
  const [team] = await testDb
    .select()
    .from(schema.teams)
    .where(eq(schema.teams.id, teamId))
    .limit(1);

  return team;
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string) {
  const members = await testDb
    .select()
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.teamId, teamId));

  return members;
}
