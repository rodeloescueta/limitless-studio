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
import { GET } from '@/app/api/teams/[teamId]/cards/route';
import { GET as GetCard, PUT } from '@/app/api/cards/[cardId]/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Content Cards API - Permissions & Visibility', () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Card Visibility by Role', () => {
    it('should show all cards to all team members regardless of stage', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Create cards in all stages
      await createTestCard({
        title: 'Research Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      await createTestCard({
        title: 'Envision Card',
        stageId: stages.envision.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      await createTestCard({
        title: 'Assemble Card',
        stageId: stages.assemble.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      await createTestCard({
        title: 'Connect Card',
        stageId: stages.connect.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      await createTestCard({
        title: 'Hone Card',
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

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`);
      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await GET(request, context);
      const cards = await response.json();

      expect(response.status).toBe(200);
      expect(cards).toHaveLength(5);
      // Scriptwriter sees all cards even though they only have full access to Research/Envision
    });

    it('should not show cards from teams user is not member of', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      const team1 = await createTestTeam({
        name: 'Team 1',
        createdBy: user1.id,
      });

      const team2 = await createTestTeam({
        name: 'Team 2',
        createdBy: user2.id,
      });

      const stages1 = await createStagesForTeam(team1.id);
      const stages2 = await createStagesForTeam(team2.id);

      await createTestCard({
        title: 'Team 1 Card',
        stageId: stages1.research.id,
        teamId: team1.id,
        createdBy: user1.id,
      });

      await createTestCard({
        title: 'Team 2 Card',
        stageId: stages2.research.id,
        teamId: team2.id,
        createdBy: user2.id,
      });

      // User1 tries to access Team 2's cards
      (getServerSession as any).mockResolvedValue({
        user: {
          id: user1.id,
          email: user1.email,
          role: user1.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/teams/${team2.id}/cards`);
      const context = { params: Promise.resolve({ teamId: team2.id }) };
      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Role-Based Edit Permissions', () => {
    it('should allow editing cards in stages with full access', async () => {
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
        title: 'Research Card',
        stageId: stages.research.id,
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
        body: JSON.stringify({ title: 'Updated Research Card' }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.title).toBe('Updated Research Card');
    });

    it('should prevent editing cards in read-only stages', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter has read-only access to Assemble
      const card = await createTestCard({
        title: 'Assemble Card',
        stageId: stages.assemble.id,
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
        body: JSON.stringify({ title: 'Updated Assemble Card' }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow viewing but not editing in comment_approve stages', async () => {
      const strategist = await createTestUser({
        email: 'strategist@test.com',
        role: 'strategist',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: strategist.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Strategist has comment_approve on Research
      const card = await createTestCard({
        title: 'Research Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: strategist.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: strategist.id,
          email: strategist.email,
          role: strategist.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Should be able to view
      let request = new Request(`http://localhost:3000/api/cards/${card.id}`);
      let context = { params: Promise.resolve({ cardId: card.id }) };
      let response = await GetCard(request, context);

      expect(response.status).toBe(200);

      // Should not be able to edit
      request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Card' }),
      });

      context = { params: Promise.resolve({ cardId: card.id }) };
      response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Multi-User Team Permissions', () => {
    it('should enforce permissions for different roles in same team', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });
      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      const team = await createTestTeam({
        name: 'Multi-Role Team',
        createdBy: admin.id,
      });

      await addTeamMember({ teamId: team.id, userId: scriptwriter.id });
      await addTeamMember({ teamId: team.id, userId: editor.id });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Shared Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: admin.id,
      });

      // Scriptwriter can edit in Research
      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      let request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Scriptwriter Edit' }),
      });

      let context = { params: Promise.resolve({ cardId: card.id }) };
      let response = await PUT(request, context);

      expect(response.status).toBe(200);

      // Editor cannot edit in Research (read-only)
      (getServerSession as any).mockResolvedValue({
        user: {
          id: editor.id,
          email: editor.email,
          role: editor.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Editor Edit' }),
      });

      context = { params: Promise.resolve({ cardId: card.id }) };
      response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow all team members to view all cards', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });
      const coordinator = await createTestUser({
        email: 'coordinator@test.com',
        role: 'coordinator',
      });

      const team = await createTestTeam({
        name: 'Shared Team',
        createdBy: scriptwriter.id,
      });

      await addTeamMember({ teamId: team.id, userId: coordinator.id });

      const stages = await createStagesForTeam(team.id);

      // Create card in Hone stage (Coordinator has full, Scriptwriter read-only)
      const card = await createTestCard({
        title: 'Hone Card',
        stageId: stages.hone.id,
        teamId: team.id,
        createdBy: coordinator.id,
      });

      // Scriptwriter can view even though read-only
      (getServerSession as any).mockResolvedValue({
        user: {
          id: scriptwriter.id,
          email: scriptwriter.email,
          role: scriptwriter.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`);
      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await GetCard(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.title).toBe('Hone Card');
    });
  });

  describe('Client Role Restrictions', () => {
    it('should prevent client from creating cards', async () => {
      const client = await createTestUser({
        email: 'client@test.com',
        role: 'client',
      });

      const team = await createTestTeam({
        name: 'Client Team',
        createdBy: client.id,
      });

      const stages = await createStagesForTeam(team.id);

      (getServerSession as any).mockResolvedValue({
        user: {
          id: client.id,
          email: client.email,
          role: 'client',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const { POST } = await import('@/app/api/teams/[teamId]/cards/route');

      const request = new Request(`http://localhost:3000/api/teams/${team.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Client Card',
          stageId: stages.research.id,
        }),
      });

      const context = { params: Promise.resolve({ teamId: team.id }) };
      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow client to view cards', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });
      const client = await createTestUser({
        email: 'client@test.com',
        role: 'client',
      });

      const team = await createTestTeam({
        name: 'Client Team',
        createdBy: admin.id,
      });

      await addTeamMember({ teamId: team.id, userId: client.id });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Client View Card',
        stageId: stages.connect.id,
        teamId: team.id,
        createdBy: admin.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: client.id,
          email: client.email,
          role: 'client',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`);
      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await GetCard(request, context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.title).toBe('Client View Card');
    });

    it('should prevent client from editing cards', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });
      const client = await createTestUser({
        email: 'client@test.com',
        role: 'client',
      });

      const team = await createTestTeam({
        name: 'Client Team',
        createdBy: admin.id,
      });

      await addTeamMember({ teamId: team.id, userId: client.id });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Protected Card',
        stageId: stages.connect.id,
        teamId: team.id,
        createdBy: admin.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: client.id,
          email: client.email,
          role: 'client',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Client Edit Attempt' }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Admin Override Permissions', () => {
    it('should allow admin to bypass team membership for viewing', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });
      const owner = await createTestUser({ email: 'owner@test.com' });

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

      // Admin not a team member
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
      const response = await GetCard(request, context);

      expect(response.status).toBe(200);
    });

    it('should allow admin to edit any card in any stage', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });
      const owner = await createTestUser({ email: 'owner@test.com' });

      const team = await createTestTeam({
        name: 'Any Team',
        createdBy: owner.id,
      });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Any Card',
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
        body: JSON.stringify({ title: 'Admin Override Edit' }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.title).toBe('Admin Override Edit');
    });
  });
});
