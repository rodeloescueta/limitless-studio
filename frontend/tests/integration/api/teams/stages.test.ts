import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  addTeamMember,
} from '../../../helpers';
import { GET } from '@/app/api/teams/[teamId]/stages/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('GET /api/teams/[teamId]/stages - Team Stages', () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/teams/test-id/stages');
      const context = { params: Promise.resolve({ teamId: 'test-id' }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user id', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams/test-id/stages');
      const context = { params: Promise.resolve({ teamId: 'test-id' }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Access Control', () => {
    it('should return 403 when user is not a team member', async () => {
      const teamOwner = await createTestUser({ email: 'owner@test.com' });
      const nonMember = await createTestUser({ email: 'outsider@test.com' });

      const team = await createTestTeam({
        name: 'Private Team',
        createdBy: teamOwner.id,
      });

      await createStagesForTeam(team.id);

      // Mock non-member session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: nonMember.id,
          email: nonMember.email,
          role: nonMember.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow team members to view stages', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const member = await createTestUser({ email: 'member@test.com' });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: owner.id,
      });

      await addTeamMember({ teamId: team.id, userId: member.id });
      await createStagesForTeam(team.id);

      // Mock member session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: member.id,
          email: member.email,
          role: member.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });

    it('should allow admin to view any team stages', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const teamOwner = await createTestUser({ email: 'owner@test.com' });

      const team = await createTestTeam({
        name: 'Other Team',
        createdBy: teamOwner.id,
      });

      await createStagesForTeam(team.id);

      // Mock admin session (not a team member)
      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe('REACH Stages', () => {
    it('should return all 5 REACH stages in correct order', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: owner.id,
      });

      const stages = await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: owner.id,
          email: owner.email,
          role: owner.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const returnedStages = await response.json();

      expect(response.status).toBe(200);
      expect(returnedStages).toHaveLength(5);

      // Verify REACH workflow order
      const stageNames = returnedStages.map((s: any) => s.name);
      expect(stageNames).toEqual([
        'Research',
        'Envision',
        'Assemble',
        'Connect',
        'Hone',
      ]);
    });

    it('should include stage properties', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: owner.id,
      });

      await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: owner.id,
          email: owner.email,
          role: owner.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const stages = await response.json();

      expect(response.status).toBe(200);

      // Verify first stage structure
      const researchStage = stages[0];
      expect(researchStage).toHaveProperty('id');
      expect(researchStage).toHaveProperty('teamId');
      expect(researchStage).toHaveProperty('name');
      expect(researchStage).toHaveProperty('position');
      expect(researchStage).toHaveProperty('color');
      expect(researchStage.teamId).toBe(team.id);
    });

    it('should return stages ordered by position', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: owner.id,
      });

      await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: owner.id,
          email: owner.email,
          role: owner.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const stages = await response.json();

      expect(response.status).toBe(200);

      // Verify positions are sequential
      const positions = stages.map((s: any) => s.position);
      expect(positions).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('Empty Team', () => {
    it('should return empty array for team without stages', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const team = await createTestTeam({
        name: 'Empty Team',
        createdBy: owner.id,
      });

      // Don't create stages

      (getServerSession as any).mockResolvedValue({
        user: {
          id: owner.id,
          email: owner.email,
          role: owner.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const stages = await response.json();

      expect(response.status).toBe(200);
      expect(stages).toHaveLength(0);
    });
  });

  describe('Invalid Team ID', () => {
    it('should return 403 for non-existent team', async () => {
      const user = await createTestUser({ email: 'user@test.com' });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const fakeTeamId = '00000000-0000-0000-0000-000000000000';
      const request = new Request(`http://localhost:3000/api/teams/${fakeTeamId}/stages`);
      const context = { params: Promise.resolve({ teamId: fakeTeamId }) };
      const response = await GET(request, context);

      expect(response.status).toBe(403);
    });
  });

  describe('Role-Based Access', () => {
    it('should allow scriptwriter to view team stages', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Content Team',
        createdBy: scriptwriter.id,
      });

      await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });

    it('should allow editor to view team stages', async () => {
      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      const team = await createTestTeam({
        name: 'Production Team',
        createdBy: editor.id,
      });

      await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: editor.id,
          email: editor.email,
          role: editor.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });

    it('should allow coordinator to view team stages', async () => {
      const coordinator = await createTestUser({
        email: 'coordinator@test.com',
        role: 'coordinator',
      });

      const team = await createTestTeam({
        name: 'Coordination Team',
        createdBy: coordinator.id,
      });

      await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: coordinator.id,
          email: coordinator.email,
          role: coordinator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team.id}) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe('Multiple Teams', () => {
    it('should only return stages for the requested team', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });

      const team1 = await createTestTeam({
        name: 'Team 1',
        createdBy: owner.id,
      });

      const team2 = await createTestTeam({
        name: 'Team 2',
        createdBy: owner.id,
      });

      await createStagesForTeam(team1.id);
      await createStagesForTeam(team2.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: owner.id,
          email: owner.email,
          role: owner.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Request team1 stages
      const request = new Request(`http://localhost:3000/api/teams/${team1.id}/stages`);
      const context = { params: Promise.resolve({ teamId: team1.id }) };
      const response = await GET(request, context);
      const stages = await response.json();

      expect(response.status).toBe(200);
      expect(stages).toHaveLength(5);

      // Verify all stages belong to team1
      stages.forEach((stage: any) => {
        expect(stage.teamId).toBe(team1.id);
      });
    });
  });
});
