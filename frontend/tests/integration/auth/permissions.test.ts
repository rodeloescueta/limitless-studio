import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  createTestCard,
} from '../../helpers';
import {
  hasStageAccess,
  canEditCard,
  canDeleteCard,
  canAssignUsers,
  canViewAllCards,
  getAccessibleStages,
} from '@/lib/permissions';

describe('Integration - Permission System with Database', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Role-Based Stage Access', () => {
    it('should verify scriptwriter has full access to research and envision stages', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      // Full access to Research and Envision
      expect(hasStageAccess('scriptwriter', 'research', 'write')).toBe(true);
      expect(hasStageAccess('scriptwriter', 'envision', 'write')).toBe(true);

      // Read-only access to other stages
      expect(hasStageAccess('scriptwriter', 'assemble', 'write')).toBe(false);
      expect(hasStageAccess('scriptwriter', 'assemble', 'read')).toBe(true);
    });

    it('should verify editor has full access to assemble and connect stages', async () => {
      const editor = await createTestUser({
        email: 'editor@test.com',
        role: 'editor',
      });

      // Full access to Assemble and Connect
      expect(hasStageAccess('editor', 'assemble', 'write')).toBe(true);
      expect(hasStageAccess('editor', 'connect', 'write')).toBe(true);

      // Read-only access to other stages
      expect(hasStageAccess('editor', 'research', 'write')).toBe(false);
      expect(hasStageAccess('editor', 'research', 'read')).toBe(true);
    });

    it('should verify coordinator has full access to connect and hone stages', async () => {
      const coordinator = await createTestUser({
        email: 'coordinator@test.com',
        role: 'coordinator',
      });

      // Full access to Connect and Hone
      expect(hasStageAccess('coordinator', 'connect', 'write')).toBe(true);
      expect(hasStageAccess('coordinator', 'hone', 'write')).toBe(true);

      // Read-only access to other stages
      expect(hasStageAccess('coordinator', 'research', 'write')).toBe(false);
      expect(hasStageAccess('coordinator', 'envision', 'read')).toBe(true);
    });
  });

  describe('Card Permissions with Real Data', () => {
    it('should allow scriptwriter to edit cards in research stage', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      const card = await createTestCard({
        title: 'Research Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      // Scriptwriter should be able to edit cards in research stage
      expect(canEditCard('scriptwriter', 'research')).toBe(true);
      expect(card.stageId).toBe(stages.research.id);
    });

    it('should prevent scriptwriter from editing cards in assemble stage', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const team = await createTestTeam({
        name: 'Test Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter should NOT be able to edit cards in assemble stage
      expect(canEditCard('scriptwriter', 'assemble')).toBe(false);
    });
  });

  describe('Delete Permissions', () => {
    it('should allow admin to delete cards in any stage', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const stages = ['research', 'envision', 'assemble', 'connect', 'hone'] as const;

      stages.forEach((stage) => {
        expect(canDeleteCard('admin', stage)).toBe(true);
      });
    });

    it('should allow users to delete cards in stages with full access', async () => {
      // Scriptwriter can delete in research/envision
      expect(canDeleteCard('scriptwriter', 'research')).toBe(true);
      expect(canDeleteCard('scriptwriter', 'envision')).toBe(true);
      expect(canDeleteCard('scriptwriter', 'assemble')).toBe(false);

      // Editor can delete in assemble/connect
      expect(canDeleteCard('editor', 'assemble')).toBe(true);
      expect(canDeleteCard('editor', 'connect')).toBe(true);
      expect(canDeleteCard('editor', 'research')).toBe(false);

      // Coordinator can delete in connect/hone
      expect(canDeleteCard('coordinator', 'connect')).toBe(true);
      expect(canDeleteCard('coordinator', 'hone')).toBe(true);
      expect(canDeleteCard('coordinator', 'research')).toBe(false);
    });
  });

  describe('Assignment Permissions', () => {
    it('should allow admin, strategist, and coordinator to assign users globally', async () => {
      expect(canAssignUsers('admin')).toBe(true);
      expect(canAssignUsers('strategist')).toBe(true);
      expect(canAssignUsers('coordinator')).toBe(true);
    });

    it('should restrict scriptwriter and editor assignment capabilities', async () => {
      expect(canAssignUsers('scriptwriter')).toBe(false);
      expect(canAssignUsers('editor')).toBe(false);
    });
  });

  describe('View All Cards Permission', () => {
    it('should allow admin, strategist, and coordinator to view all cards', async () => {
      expect(canViewAllCards('admin')).toBe(true);
      expect(canViewAllCards('strategist')).toBe(true);
      expect(canViewAllCards('coordinator')).toBe(true);
    });

    it('should restrict client from viewing all cards', async () => {
      expect(canViewAllCards('client')).toBe(false);
    });
  });

  describe('Accessible Stages', () => {
    it('should return all stages for admin', async () => {
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin',
      });

      const accessibleStages = getAccessibleStages('admin');

      expect(accessibleStages).toHaveLength(5);
      expect(accessibleStages).toContain('research');
      expect(accessibleStages).toContain('envision');
      expect(accessibleStages).toContain('assemble');
      expect(accessibleStages).toContain('connect');
      expect(accessibleStages).toContain('hone');
    });

    it('should return limited stages for client', async () => {
      const client = await createTestUser({
        email: 'client@test.com',
        role: 'client',
      });

      const accessibleStages = getAccessibleStages('client');

      expect(accessibleStages).toHaveLength(2);
      expect(accessibleStages).toContain('connect');
      expect(accessibleStages).toContain('hone');
      expect(accessibleStages).not.toContain('research');
    });

    it('should return all stages for scriptwriter (with varying access levels)', async () => {
      const scriptwriter = await createTestUser({
        email: 'scriptwriter@test.com',
        role: 'scriptwriter',
      });

      const accessibleStages = getAccessibleStages('scriptwriter');

      // Scriptwriter can READ all stages (full access to some, read-only to others)
      expect(accessibleStages).toHaveLength(5);
    });
  });

  describe('Cross-Role Scenarios', () => {
    it('should test complete workflow with multiple roles', async () => {
      // Create users with different roles
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

      // Create team and stages
      const team = await createTestTeam({
        name: 'Cross-Role Team',
        createdBy: scriptwriter.id,
      });

      const stages = await createStagesForTeam(team.id);

      // Scriptwriter creates card in Research
      const researchCard = await createTestCard({
        title: 'Research Card',
        stageId: stages.research.id,
        teamId: team.id,
        createdBy: scriptwriter.id,
      });

      // Verify scriptwriter can edit in research
      expect(canEditCard('scriptwriter', 'research')).toBe(true);

      // Verify editor CANNOT edit in research
      expect(canEditCard('editor', 'research')).toBe(false);

      // Create card in Assemble (editor's domain)
      const assembleCard = await createTestCard({
        title: 'Assemble Card',
        stageId: stages.assemble.id,
        teamId: team.id,
        createdBy: editor.id,
      });

      // Verify editor can edit in assemble
      expect(canEditCard('editor', 'assemble')).toBe(true);

      // Verify scriptwriter CANNOT edit in assemble
      expect(canEditCard('scriptwriter', 'assemble')).toBe(false);

      // Create card in Hone (coordinator's domain)
      const honeCard = await createTestCard({
        title: 'Hone Card',
        stageId: stages.hone.id,
        teamId: team.id,
        createdBy: coordinator.id,
      });

      // Verify coordinator can edit in hone
      expect(canEditCard('coordinator', 'hone')).toBe(true);

      // Verify others cannot edit in hone
      expect(canEditCard('scriptwriter', 'hone')).toBe(false);
      expect(canEditCard('editor', 'hone')).toBe(false);
    });
  });
});
