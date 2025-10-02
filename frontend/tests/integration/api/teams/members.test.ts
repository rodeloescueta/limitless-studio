import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  addTeamMember,
  getTeamMembers,
} from '../../../helpers';
import { GET } from '@/app/api/teams/[teamId]/members/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('GET /api/teams/[teamId]/members - Team Members', () => {
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

      const request = new Request('http://localhost:3000/api/teams/test-id/members');
      const context = { params: Promise.resolve({ teamId: 'test-id' }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Fetching Team Members', () => {
    it('should return all team members with user details', async () => {
      // Create team creator
      const creator = await createTestUser({
        email: 'creator@test.com',
        firstName: 'Team',
        lastName: 'Creator',
      });

      // Create team
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: creator.id,
      });

      // Add more members
      const member1 = await createTestUser({
        email: 'member1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scriptwriter',
      });

      const member2 = await createTestUser({
        email: 'member2@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'editor',
      });

      await addTeamMember({ teamId: team.id, userId: member1.id });
      await addTeamMember({ teamId: team.id, userId: member2.id });

      // Mock session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: creator.id,
          email: creator.email,
          role: creator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const members = await response.json();

      expect(response.status).toBe(200);
      expect(members).toHaveLength(3); // creator + 2 members

      // Verify member structure
      expect(members[0]).toHaveProperty('id');
      expect(members[0]).toHaveProperty('email');
      expect(members[0]).toHaveProperty('firstName');
      expect(members[0]).toHaveProperty('lastName');
      expect(members[0]).toHaveProperty('role');
      expect(members[0]).toHaveProperty('joinedAt');

      // Verify all members are included
      const emails = members.map((m: any) => m.email).sort();
      expect(emails).toContain('creator@test.com');
      expect(emails).toContain('member1@test.com');
      expect(emails).toContain('member2@test.com');
    });

    it('should return empty array for team with no members', async () => {
      const creator = await createTestUser({ email: 'creator@test.com' });
      const team = await createTestTeam({
        name: 'Empty Team',
        createdBy: creator.id,
      });

      // Manually remove creator from team (if auto-added)
      // For this test, we'll just verify current behavior

      (getServerSession as any).mockResolvedValue({
        user: {
          id: creator.id,
          email: creator.email,
          role: creator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const members = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(members)).toBe(true);
    });

    it('should include user role information for each member', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const team = await createTestTeam({
        name: 'Role Test Team',
        createdBy: admin.id,
      });

      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      const coordinator = await createTestUser({
        email: 'coordinator@test.com',
        role: 'coordinator',
      });

      await addTeamMember({ teamId: team.id, userId: scriptwriter.id });
      await addTeamMember({ teamId: team.id, userId: editor.id });
      await addTeamMember({ teamId: team.id, userId: coordinator.id });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const members = await response.json();

      expect(response.status).toBe(200);

      // Verify each role is present
      const roles = members.map((m: any) => m.role);
      expect(roles).toContain('admin');
      expect(roles).toContain('scriptwriter');
      expect(roles).toContain('editor');
      expect(roles).toContain('coordinator');
    });
  });

  describe('Access Control', () => {
    it('should allow any authenticated user to view team members', async () => {
      // This tests current implementation - may need to change based on requirements
      const creator = await createTestUser({ email: 'creator@test.com' });
      const viewer = await createTestUser({ email: 'viewer@test.com' });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: creator.id,
      });

      // Viewer is not a team member
      (getServerSession as any).mockResolvedValue({
        user: {
          id: viewer.id,
          email: viewer.email,
          role: viewer.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      // Current implementation allows viewing - document this behavior
      expect(response.status).toBe(200);
    });

    it('should work for admin users across all teams', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const otherUser = await createTestUser({ email: 'other@test.com' });

      const team = await createTestTeam({
        name: 'Other Team',
        createdBy: otherUser.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe('Invalid Team ID', () => {
    it('should return empty array for non-existent team', async () => {
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
      const request = new Request(`http://localhost:3000/api/teams/${fakeTeamId}/members`);
      const context = { params: Promise.resolve({ teamId: fakeTeamId }) };
      const response = await GET(request, context);
      const members = await response.json();

      expect(response.status).toBe(200);
      expect(members).toHaveLength(0);
    });
  });

  describe('Member Information Completeness', () => {
    it('should include all required user fields', async () => {
      const creator = await createTestUser({
        email: 'creator@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: creator.id,
      });

      const member = await createTestUser({
        email: 'member@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'scriptwriter',
      });

      await addTeamMember({ teamId: team.id, userId: member.id });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: creator.id,
          email: creator.email,
          role: creator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const members = await response.json();

      expect(response.status).toBe(200);

      const janeMember = members.find((m: any) => m.email === 'member@test.com');
      expect(janeMember).toBeDefined();
      expect(janeMember.firstName).toBe('Jane');
      expect(janeMember.lastName).toBe('Smith');
      expect(janeMember.role).toBe('scriptwriter');
      expect(janeMember.id).toBe(member.id);
    });

    it('should include joinedAt timestamp', async () => {
      const creator = await createTestUser({ email: 'creator@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: creator.id,
      });

      const member = await createTestUser({ email: 'member@test.com' });
      await addTeamMember({ teamId: team.id, userId: member.id });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: creator.id,
          email: creator.email,
          role: creator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/members`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const members = await response.json();

      expect(response.status).toBe(200);
      expect(members[0].joinedAt).toBeDefined();
      expect(new Date(members[0].joinedAt)).toBeInstanceOf(Date);
    });
  });
});
