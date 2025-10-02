import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  createTestCard,
  addTeamMember,
} from '../../../helpers';
import { GET, POST } from '@/app/api/teams/[teamId]/cards/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Content Cards API - List & Create', () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/teams/[teamId]/cards - List Cards', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/teams/test-id/cards');
      const context = { params: Promise.resolve({ teamId: 'test-id' }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is not a team member', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const outsider = await createTestUser({ email: 'outsider@test.com' });

      const team = await createTestTeam({
        name: 'Private Team',
        createdBy: owner.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: outsider.id,
          email: outsider.email,
          role: outsider.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return all cards for team members', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: owner.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Create cards in different stages
      await createTestCard({
        title: 'Card 1',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: owner.id,
      });

      await createTestCard({
        title: 'Card 2',
        stageId: stages.envision.id,
        teamId: team.id,
        createdBy: owner.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: owner.id,
          email: owner.email,
          role: owner.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const cards = await response.json();

      expect(response.status).toBe(200);
      expect(cards).toHaveLength(2);
      expect(cards.map((c: any) => c.title).sort()).toEqual(['Card 1', 'Card 2']);
    });

    it('should allow admin to view any team cards', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const owner = await createTestUser({ email: 'owner@test.com' });
      const team = await createTestTeam({
        name: 'Other Team',
        createdBy: owner.id,
      });

      const stages = await createStagesForTeam(team.id);
      await createTestCard({
        title: 'Test Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: owner.id,
      });

      // Admin not a team member
      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/teams/[teamId]/cards - Create Card', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/teams/test-id/cards', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const context = { params: Promise.resolve({ teamId: 'test-id' }) };
      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when user is a client', async () => {
      const client = await createTestUser({
        email: 'client@test.com',
        role: 'client',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: client.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: client.id,
          email: client.email,
          role: 'client',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const stages = await createStagesForTeam(team.id);

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Card',
          stageId: stages.research.id,
        }),
      });

      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should create card for team member', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Content Card',
          description: 'Test description',
          stageId: stages.research.id,
          priority: 'high',
        }),
      });

      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await POST(request, context);
      const card = await response.json();

      expect(response.status).toBe(201);
      expect(card.title).toBe('New Content Card');
      expect(card.description).toBe('Test description');
      expect(card.stageId).toBe(stages.research.id);
      expect(card.priority).toBe('high');
      expect(card.createdBy).toBe(scriptwriter.id);
    });

    it('should validate required fields', async () => {
      const user = await createTestUser({ email: 'user@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: user.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing title and stageId
          description: 'Test',
        }),
      });

      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should set default priority to medium', async () => {
      const user = await createTestUser({ email: 'user@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: user.id,
      });

      const stages = await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Card without priority',
          stageId: stages.research.id,
        }),
      });

      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await POST(request, context);
      const card = await response.json();

      expect(response.status).toBe(201);
      expect(card.priority).toBe('medium');
    });
  });
});
