import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  createTestCard,
} from '../../../helpers';
import { GET, PUT } from '@/app/api/cards/[cardId]/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Content Cards API - Read & Update', () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/cards/[cardId] - Get Single Card', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/cards/test-id');
      const context = { params: Promise.resolve({ cardId: 'test-id' }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when card does not exist', async () => {
      const user = await createTestUser({ email: 'user@test.com' });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(
        'http://localhost:3000/api/cards/00000000-0000-0000-0000-000000000000'
      );
      const context = {
        params: Promise.resolve({ cardId: '00000000-0000-0000-0000-000000000000' }),
      };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Card not found');
    });

    it('should return 403 when user is not a team member', async () => {
      const owner = await createTestUser({ email: 'owner@test.com' });
      const outsider = await createTestUser({ email: 'outsider@test.com' });

      const team = await createTestTeam({
        name: 'Private Team',
        createdBy: owner.id,
      });

      const stages = await createStagesForTeam(team.id);
      const card = await createTestCard({
        title: 'Private Card',
        stageId: stages.research.id,
        teamId: team.id,
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

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`);
      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return card for team member', async () => {
      const user = await createTestUser({ email: 'user@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: user.id,
      });

      const stages = await createStagesForTeam(team.id);
      const card = await createTestCard({
        title: 'Test Card',
        description: 'Test description',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: user.id,
        priority: 'high',
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`);
      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await GET(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.id).toBe(card.id);
      expect(result.title).toBe('Test Card');
      expect(result.description).toBe('Test description');
      expect(result.priority).toBe('high');
      expect(result.stageId).toBe(stages.research.id);
    });

    it('should allow admin to view any card', async () => {
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
      const card = await createTestCard({
        title: 'Admin View Test',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: owner.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`);
      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await GET(request, context);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/cards/[cardId] - Update Card', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/cards/test-id', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const context = { params: Promise.resolve({ cardId: 'test-id' }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when card does not exist', async () => {
      const user = await createTestUser({ email: 'user@test.com' });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(
        'http://localhost:3000/api/cards/00000000-0000-0000-0000-000000000000',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Updated' }),
        }
      );
      const context = {
        params: Promise.resolve({ cardId: '00000000-0000-0000-0000-000000000000' }),
      };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Card not found');
    });

    it('should return 403 when user lacks permission to edit', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter has full access to Research but read-only on Hone
      const card = await createTestCard({
        title: 'Hone Stage Card',
        stageId: stages.hone.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should update card when user has full access to stage', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter has full access to Research
      const card = await createTestCard({
        title: 'Original Title',
        description: 'Original description',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
        priority: 'low',
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          priority: 'high',
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.priority).toBe('high');
      expect(updated.stageId).toBe(stages.research.id); // Stage unchanged
    });

    it('should allow admin to update any card', async () => {
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
      const card = await createTestCard({
        title: 'Admin Update Test',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: owner.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Admin Updated' }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.title).toBe('Admin Updated');
    });

    it('should validate update data', async () => {
      const user = await createTestUser({ email: 'user@test.com' });
      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: user.id,
      });

      const stages = await createStagesForTeam(team.id);
      const card = await createTestCard({
        title: 'Test Card',
        stageId: stages.research.id,
        teamId: team.id,
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

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority: 'invalid-priority', // Invalid enum value
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });
});
