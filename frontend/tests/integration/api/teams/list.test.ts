import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  addTeamMember,
} from '../../../helpers';
import { GET } from '@/app/api/teams/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('GET /api/teams - List Teams', () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock no session
      (getServerSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user id', async () => {
      // Mock session without user ID
      (getServerSession as any).mockResolvedValue({
        user: { email: 'test@example.com' },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Admin Access', () => {
    it('should return all teams for admin users', async () => {
      // Create admin user
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      // Create multiple teams with different creators
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      const team1 = await createTestTeam({
        name: 'Team Alpha',
        createdBy: user1.id,
      });

      const team2 = await createTestTeam({
        name: 'Team Beta',
        createdBy: user2.id,
      });

      const team3 = await createTestTeam({
        name: 'Team Gamma',
        createdBy: admin.id,
      });

      // Mock admin session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams).toHaveLength(3);
      expect(teams.map((t: any) => t.name).sort()).toEqual([
        'Team Alpha',
        'Team Beta',
        'Team Gamma',
      ]);
    });
  });

  describe('Regular User Access', () => {
    it('should return only teams user is a member of', async () => {
      // Create users
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      // Create teams
      const team1 = await createTestTeam({
        name: 'User1 Team',
        createdBy: user1.id,
      });

      const team2 = await createTestTeam({
        name: 'User2 Team',
        createdBy: user2.id,
      });

      const sharedTeam = await createTestTeam({
        name: 'Shared Team',
        createdBy: user1.id,
      });

      // Add user1 to their created teams (automatically added on creation)
      // Add user2 to shared team
      await addTeamMember({
        teamId: sharedTeam.id,
        userId: user2.id,
      });

      // Mock user1 session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: user1.id,
          email: user1.email,
          role: user1.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams).toHaveLength(2);
      expect(teams.map((t: any) => t.name).sort()).toEqual([
        'Shared Team',
        'User1 Team',
      ]);
    });

    it('should return empty array when user is not member of any team', async () => {
      const user = await createTestUser({ email: 'lonely@test.com' });

      // Create team without adding user
      const otherUser = await createTestUser({ email: 'other@test.com' });
      await createTestTeam({
        name: 'Other Team',
        createdBy: otherUser.id,
      });

      // Mock user session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams).toHaveLength(0);
    });
  });

  describe('Team Visibility', () => {
    it('should not expose teams from other users to non-admin', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      // User1 creates team
      const team1 = await createTestTeam({
        name: 'Private Team',
        createdBy: user1.id,
      });

      // User2 should NOT see user1's team
      (getServerSession as any).mockResolvedValue({
        user: {
          id: user2.id,
          email: user2.email,
          role: user2.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams).toHaveLength(0);
      expect(teams.some((t: any) => t.id === team1.id)).toBe(false);
    });
  });

  describe('Different Roles', () => {
    it('should return teams for strategist based on membership', async () => {
      const strategist = await createTestUser({
        email: 'strategist@test.com',
        role: 'strategist',
      });

      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      // Create team and add strategist
      const team = await createTestTeam({
        name: 'Strategy Team',
        createdBy: admin.id,
      });

      await addTeamMember({
        teamId: team.id,
        userId: strategist.id,
      });

      // Mock strategist session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: strategist.id,
          email: strategist.email,
          role: strategist.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams).toHaveLength(1);
      expect(teams[0].name).toBe('Strategy Team');
    });

    it('should return teams for scriptwriter based on membership', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Content Team',
        createdBy: scriptwriter.id,
      });

      // Mock scriptwriter session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams).toHaveLength(1);
      expect(teams[0].name).toBe('Content Team');
    });
  });

  describe('Team Ordering', () => {
    it('should return teams ordered by name alphabetically', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      // Create teams in non-alphabetical order
      await createTestTeam({ name: 'Zebra Team', createdBy: admin.id });
      await createTestTeam({ name: 'Alpha Team', createdBy: admin.id });
      await createTestTeam({ name: 'Beta Team', createdBy: admin.id });

      // Mock admin session
      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request('http://localhost:3000/api/teams');
      const response = await GET(request);
      const teams = await response.json();

      expect(response.status).toBe(200);
      expect(teams.map((t: any) => t.name)).toEqual([
        'Alpha Team',
        'Beta Team',
        'Zebra Team',
      ]);
    });
  });
});
