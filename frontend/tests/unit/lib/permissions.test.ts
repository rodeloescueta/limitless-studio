import { describe, it, expect } from 'vitest';
import {
  hasStageAccess,
  canEditCard,
  canDeleteCard,
  canAssignUsers,
  canComment,
  canApprove,
  hasGlobalPermission,
  getAccessibleStages,
  getStagePermissionLevel,
  canViewAllCards,
  canDragCard,
  isStageReadOnly,
  type UserRole,
  type StageName,
} from '@/lib/permissions';

describe('Permission System', () => {
  describe('hasStageAccess', () => {
    it('admin should have full access to all stages', () => {
      const stages: StageName[] = ['research', 'envision', 'assemble', 'connect', 'hone'];
      stages.forEach((stage) => {
        expect(hasStageAccess('admin', stage, 'read')).toBe(true);
        expect(hasStageAccess('admin', stage, 'write')).toBe(true);
        expect(hasStageAccess('admin', stage, 'delete')).toBe(true);
      });
    });

    it('strategist should have comment/approve access to all stages', () => {
      const stages: StageName[] = ['research', 'envision', 'assemble', 'connect', 'hone'];
      stages.forEach((stage) => {
        expect(hasStageAccess('strategist', stage, 'read')).toBe(true);
        expect(hasStageAccess('strategist', stage, 'comment')).toBe(true);
        expect(hasStageAccess('strategist', stage, 'approve')).toBe(true);
        expect(hasStageAccess('strategist', stage, 'write')).toBe(false);
        expect(hasStageAccess('strategist', stage, 'delete')).toBe(false);
      });
    });

    it('scriptwriter should have full access to research and envision', () => {
      expect(hasStageAccess('scriptwriter', 'research', 'write')).toBe(true);
      expect(hasStageAccess('scriptwriter', 'envision', 'write')).toBe(true);
      expect(hasStageAccess('scriptwriter', 'assemble', 'write')).toBe(false);
      expect(hasStageAccess('scriptwriter', 'assemble', 'read')).toBe(true);
    });

    it('editor should have full access to assemble and connect', () => {
      expect(hasStageAccess('editor', 'assemble', 'write')).toBe(true);
      expect(hasStageAccess('editor', 'connect', 'write')).toBe(true);
      expect(hasStageAccess('editor', 'research', 'write')).toBe(false);
      expect(hasStageAccess('editor', 'research', 'read')).toBe(true);
    });

    it('coordinator should have full access to connect and hone', () => {
      expect(hasStageAccess('coordinator', 'connect', 'write')).toBe(true);
      expect(hasStageAccess('coordinator', 'hone', 'write')).toBe(true);
      expect(hasStageAccess('coordinator', 'research', 'write')).toBe(false);
      expect(hasStageAccess('coordinator', 'research', 'read')).toBe(true);
    });

    it('client should only have access to connect (comment) and hone (read)', () => {
      expect(hasStageAccess('client', 'research', 'read')).toBe(false);
      expect(hasStageAccess('client', 'connect', 'comment')).toBe(true);
      expect(hasStageAccess('client', 'connect', 'write')).toBe(false);
      expect(hasStageAccess('client', 'hone', 'read')).toBe(true);
    });
  });

  describe('canEditCard', () => {
    it('should return true for users with full access to stage', () => {
      expect(canEditCard('admin', 'research')).toBe(true);
      expect(canEditCard('scriptwriter', 'research')).toBe(true);
      expect(canEditCard('editor', 'assemble')).toBe(true);
    });

    it('should return false for users with read-only access', () => {
      expect(canEditCard('scriptwriter', 'assemble')).toBe(false);
      expect(canEditCard('editor', 'research')).toBe(false);
      expect(canEditCard('coordinator', 'research')).toBe(false);
    });

    it('should return false for strategist (comment-only access)', () => {
      expect(canEditCard('strategist', 'research')).toBe(false);
      expect(canEditCard('strategist', 'hone')).toBe(false);
    });
  });

  describe('canDeleteCard', () => {
    it('admin should always be able to delete cards', () => {
      const stages: StageName[] = ['research', 'envision', 'assemble', 'connect', 'hone'];
      stages.forEach((stage) => {
        expect(canDeleteCard('admin', stage)).toBe(true);
      });
    });

    it('users with full access can delete cards in their stages', () => {
      // Users with full access to a stage can delete cards in that stage
      expect(canDeleteCard('scriptwriter', 'research')).toBe(true);
      expect(canDeleteCard('editor', 'assemble')).toBe(true);
      expect(canDeleteCard('coordinator', 'hone')).toBe(true);
    });

    it('users cannot delete cards in stages they do not have full access to', () => {
      expect(canDeleteCard('scriptwriter', 'assemble')).toBe(false); // read-only
      expect(canDeleteCard('editor', 'research')).toBe(false); // read-only
      expect(canDeleteCard('strategist', 'research')).toBe(false); // comment-approve
    });
  });

  describe('canComment', () => {
    it('should return true for all users except clients on stages they cannot access', () => {
      expect(canComment('strategist', 'research')).toBe(true);
      expect(canComment('scriptwriter', 'assemble')).toBe(false); // read-only
      expect(canComment('client', 'connect')).toBe(true);
      expect(canComment('client', 'research')).toBe(false);
    });
  });

  describe('canApprove', () => {
    it('strategist should be able to approve in all stages', () => {
      const stages: StageName[] = ['research', 'envision', 'assemble', 'connect', 'hone'];
      stages.forEach((stage) => {
        expect(canApprove('strategist', stage)).toBe(true);
      });
    });

    it('client should be able to approve only in connect stage', () => {
      expect(canApprove('client', 'connect')).toBe(true);
      expect(canApprove('client', 'hone')).toBe(false);
      expect(canApprove('client', 'research')).toBe(false);
    });
  });

  describe('canAssignUsers', () => {
    it('admin should be able to assign users globally', () => {
      expect(canAssignUsers('admin')).toBe(true);
      expect(canAssignUsers('admin', 'research')).toBe(true);
    });

    it('strategist should be able to assign users globally', () => {
      expect(canAssignUsers('strategist')).toBe(true);
    });

    it('coordinator should be able to assign users globally', () => {
      expect(canAssignUsers('coordinator')).toBe(true);
    });

    it('scriptwriter should have limited assignment capabilities', () => {
      expect(canAssignUsers('scriptwriter')).toBe(false);
    });
  });

  describe('hasGlobalPermission', () => {
    it('admin should have all global permissions', () => {
      expect(hasGlobalPermission('admin', 'user_management')).toBe(true);
      expect(hasGlobalPermission('admin', 'team_management')).toBe(true);
      expect(hasGlobalPermission('admin', 'anything')).toBe(true);
    });

    it('should check specific permissions for other roles', () => {
      expect(hasGlobalPermission('strategist', 'global_reassign')).toBe(true);
      expect(hasGlobalPermission('strategist', 'user_management')).toBe(false);
      expect(hasGlobalPermission('coordinator', 'timeline_management')).toBe(true);
    });
  });

  describe('getAccessibleStages', () => {
    it('admin should have access to all stages', () => {
      const stages = getAccessibleStages('admin');
      expect(stages).toHaveLength(5);
      expect(stages).toContain('research');
      expect(stages).toContain('hone');
    });

    it('client should only have access to connect and hone', () => {
      const stages = getAccessibleStages('client');
      expect(stages).toHaveLength(2);
      expect(stages).toContain('connect');
      expect(stages).toContain('hone');
    });

    it('scriptwriter should have access to all stages (full + read-only)', () => {
      const stages = getAccessibleStages('scriptwriter');
      expect(stages).toHaveLength(5);
    });
  });

  describe('getStagePermissionLevel', () => {
    it('should return correct permission levels', () => {
      expect(getStagePermissionLevel('admin', 'research')).toBe('full');
      expect(getStagePermissionLevel('strategist', 'research')).toBe('comment_approve');
      expect(getStagePermissionLevel('scriptwriter', 'assemble')).toBe('read_only');
      expect(getStagePermissionLevel('client', 'research')).toBe('none');
    });
  });

  describe('canViewAllCards', () => {
    it('admin should be able to view all cards', () => {
      expect(canViewAllCards('admin')).toBe(true);
    });

    it('strategist should be able to view all cards', () => {
      expect(canViewAllCards('strategist')).toBe(true);
    });

    it('coordinator should be able to view all cards', () => {
      expect(canViewAllCards('coordinator')).toBe(true);
    });

    it('client should not be able to view all cards', () => {
      expect(canViewAllCards('client')).toBe(false);
    });
  });

  describe('canDragCard', () => {
    it('should only allow drag for full access', () => {
      expect(canDragCard('admin', 'research')).toBe(true);
      expect(canDragCard('scriptwriter', 'research')).toBe(true);
      expect(canDragCard('scriptwriter', 'assemble')).toBe(false); // read-only
      expect(canDragCard('strategist', 'research')).toBe(false); // comment-approve
    });
  });

  describe('isStageReadOnly', () => {
    it('should return true for read-only and comment-approve stages', () => {
      expect(isStageReadOnly('scriptwriter', 'assemble')).toBe(true);
      expect(isStageReadOnly('strategist', 'research')).toBe(true);
      expect(isStageReadOnly('client', 'hone')).toBe(true);
    });

    it('should return false for full access stages', () => {
      expect(isStageReadOnly('admin', 'research')).toBe(false);
      expect(isStageReadOnly('scriptwriter', 'research')).toBe(false);
      expect(isStageReadOnly('editor', 'assemble')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid role gracefully', () => {
      // @ts-expect-error Testing invalid role
      expect(hasStageAccess('invalid_role', 'research', 'read')).toBe(false);
    });

    it('should handle all permission actions correctly', () => {
      const actions = ['read', 'write', 'comment', 'approve', 'assign', 'delete'] as const;
      actions.forEach((action) => {
        const result = hasStageAccess('admin', 'research', action);
        expect(typeof result).toBe('boolean');
      });
    });
  });
});
