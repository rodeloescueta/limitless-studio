import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  createTestCard,
} from '../../../helpers';
import { PUT } from '@/app/api/cards/[cardId]/route';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Content Cards API - Stage Transitions', () => {
  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Stage Transition Permissions', () => {
    it('should allow moving card from Research to Envision with full access', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter has full access to both Research and Envision
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
        body: JSON.stringify({
          stageId: stages.envision.id,
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.stageId).toBe(stages.envision.id);
    });

    it('should prevent moving card from Research to Assemble without permission', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter has full access to Research but read-only on Assemble
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
        body: JSON.stringify({
          stageId: stages.assemble.id, // No permission for Assemble
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow editor to move card from Assemble to Connect', async () => {
      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: editor.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Editor has full access to Assemble and Connect
      const card = await createTestCard({
        title: 'Assemble Card',
        stageId: stages.assemble.id,
        teamId: team.id,
        createdBy: editor.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: editor.id,
          email: editor.email,
          role: editor.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: stages.connect.id,
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.stageId).toBe(stages.connect.id);
    });

    it('should prevent editor from moving card to Research stage', async () => {
      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: editor.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Editor has read-only access to Research
      const card = await createTestCard({
        title: 'Connect Card',
        stageId: stages.connect.id,
        teamId: team.id,
        createdBy: editor.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: editor.id,
          email: editor.email,
          role: editor.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: stages.research.id, // No permission for Research
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow coordinator to move card from Connect to Hone', async () => {
      const coordinator = await createTestUser({
        email: 'coordinator@test.com',
        role: 'coordinator',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: coordinator.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Coordinator has full access to Connect and Hone
      const card = await createTestCard({
        title: 'Connect Card',
        stageId: stages.connect.id,
        teamId: team.id,
        createdBy: coordinator.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: coordinator.id,
          email: coordinator.email,
          role: coordinator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: stages.hone.id,
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.stageId).toBe(stages.hone.id);
    });

    it('should prevent coordinator from moving card to Envision', async () => {
      const coordinator = await createTestUser({
        email: 'coordinator@test.com',
        role: 'coordinator',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: coordinator.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Coordinator has read-only access to Envision
      const card = await createTestCard({
        title: 'Hone Card',
        stageId: stages.hone.id,
        teamId: team.id,
        createdBy: coordinator.id,
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: coordinator.id,
          email: coordinator.email,
          role: coordinator.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: stages.envision.id, // No permission for Envision
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow admin to move card to any stage', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });
      const owner = await createTestUser({ email: 'owner@test.com' });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: owner.id,
      });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Admin Move Test',
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

      // Move through all stages
      for (const stage of [
        stages.envision,
        stages.assemble,
        stages.connect,
        stages.hone,
      ]) {
        const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stageId: stage.id,
          }),
        });

        const context = { params: Promise.resolve({ cardId: card.id }) };
        const response = await PUT(request, context);

        expect(response.status).toBe(200);
      }
    });

    it('should prevent strategist from moving cards (comment_approve access)', async () => {
      const strategist = await createTestUser({
        email: 'strategist@test.com',
        role: 'strategist',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: strategist.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Strategist has comment_approve on all stages (no full access)
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

      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: stages.envision.id,
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });
  });

  describe('Cross-Stage Workflow Scenarios', () => {
    it('should support handoff from scriptwriter to editor', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });
      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter creates card in Research
      const card = await createTestCard({
        title: 'Content Piece',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      // Scriptwriter moves to Envision
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
        body: JSON.stringify({ stageId: stages.envision.id }),
      });

      let context = { params: Promise.resolve({ cardId: card.id }) };
      let response = await PUT(request, context);
      expect(response.status).toBe(200);

      // Scriptwriter cannot move to Assemble (read-only)
      request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: stages.assemble.id }),
      });

      context = { params: Promise.resolve({ cardId: card.id }) };
      response = await PUT(request, context);
      expect(response.status).toBe(403);

      // Admin or Editor needs to move it to Assemble for handoff
      (getServerSession as any).mockResolvedValue({
        user: {
          id: editor.id,
          email: editor.email,
          role: editor.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Editor moves from Envision (read-only for editor) to Assemble - should fail
      request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: stages.assemble.id }),
      });

      context = { params: Promise.resolve({ cardId: card.id }) };
      response = await PUT(request, context);
      expect(response.status).toBe(403); // Editor doesn't have full access to Envision
    });

    it('should allow multi-stage card update with permissions', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: admin.id,
      });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Multi-stage Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: admin.id,
        priority: 'low',
      });

      (getServerSession as any).mockResolvedValue({
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Update both stage and other fields
      const request = new Request(`http://localhost:3000/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Multi-stage Card',
          stageId: stages.hone.id,
          priority: 'high',
        }),
      });

      const context = { params: Promise.resolve({ cardId: card.id }) };
      const response = await PUT(request, context);
      const updated = await response.json();

      expect(response.status).toBe(200);
      expect(updated.title).toBe('Updated Multi-stage Card');
      expect(updated.stageId).toBe(stages.hone.id);
      expect(updated.priority).toBe('high');
    });
  });
});
