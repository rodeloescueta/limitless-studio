// Permission matrix for role-based access control
// Based on the business requirements from Phase 5.5 plan

export type UserRole = 'admin' | 'member' | 'client' | 'strategist' | 'scriptwriter' | 'editor' | 'coordinator'
export type StageName = 'research' | 'envision' | 'assemble' | 'connect' | 'hone'
export type PermissionAction = 'read' | 'write' | 'comment' | 'approve' | 'assign' | 'delete'

// Permission levels for each role and stage combination
type PermissionLevel = 'full' | 'comment_approve' | 'read_only' | 'none'

const PERMISSION_MATRIX: Record<UserRole, Record<StageName, PermissionLevel>> = {
  admin: {
    research: 'full',
    envision: 'full',
    assemble: 'full',
    connect: 'full',
    hone: 'full',
  },
  strategist: {
    research: 'comment_approve',
    envision: 'comment_approve',
    assemble: 'comment_approve',
    connect: 'comment_approve',
    hone: 'comment_approve',
  },
  scriptwriter: {
    research: 'full',
    envision: 'full',
    assemble: 'read_only',
    connect: 'read_only',
    hone: 'read_only',
  },
  editor: {
    research: 'read_only',
    envision: 'read_only',
    assemble: 'full',
    connect: 'full',
    hone: 'read_only',
  },
  coordinator: {
    research: 'read_only',
    envision: 'read_only',
    assemble: 'read_only',
    connect: 'full',
    hone: 'full',
  },
  member: {
    research: 'full',
    envision: 'full',
    assemble: 'full',
    connect: 'comment_approve',
    hone: 'read_only',
  },
  client: {
    research: 'none',
    envision: 'none',
    assemble: 'none',
    connect: 'comment_approve',
    hone: 'read_only',
  },
}

// Global permissions (not stage-specific)
const GLOBAL_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['user_management', 'team_management', 'global_reassign', 'global_delete', 'view_all'],
  strategist: ['global_reassign', 'global_comment', 'view_all'],
  scriptwriter: ['limited_reassign', 'comment_only'],
  editor: ['limited_reassign', 'comment_only'],
  coordinator: ['global_reassign', 'timeline_management', 'global_view', 'publishing'],
  member: ['basic_operations'],
  client: ['view_assigned'],
}

/**
 * Check if user has access to a specific stage with given action
 */
export function hasStageAccess(
  userRole: UserRole,
  stageName: StageName,
  action: PermissionAction
): boolean {
  const permissionLevel = PERMISSION_MATRIX[userRole]?.[stageName]

  if (!permissionLevel || permissionLevel === 'none') {
    return false
  }

  switch (permissionLevel) {
    case 'full':
      return true // All actions allowed

    case 'comment_approve':
      return ['read', 'comment', 'approve'].includes(action)

    case 'read_only':
      return action === 'read'

    default:
      return false
  }
}

/**
 * Check if user can edit a specific card
 */
export function canEditCard(userRole: UserRole, stageName: StageName): boolean {
  return hasStageAccess(userRole, stageName, 'write')
}

/**
 * Check if user can delete a card
 */
export function canDeleteCard(userRole: UserRole, stageName: StageName): boolean {
  if (userRole === 'admin') return true
  return hasStageAccess(userRole, stageName, 'delete')
}

/**
 * Check if user can assign others to cards
 */
export function canAssignUsers(userRole: UserRole, targetStage?: StageName): boolean {
  const globalPerms = GLOBAL_PERMISSIONS[userRole] || []

  if (globalPerms.includes('global_reassign') || globalPerms.includes('user_management')) {
    return true
  }

  if (globalPerms.includes('limited_reassign') && targetStage) {
    return hasStageAccess(userRole, targetStage, 'assign')
  }

  return false
}

/**
 * Check if user can comment on cards in a stage
 */
export function canComment(userRole: UserRole, stageName: StageName): boolean {
  return hasStageAccess(userRole, stageName, 'comment')
}

/**
 * Check if user can approve/reject cards
 */
export function canApprove(userRole: UserRole, stageName: StageName): boolean {
  return hasStageAccess(userRole, stageName, 'approve')
}

/**
 * Check if user has global permission
 */
export function hasGlobalPermission(userRole: UserRole, permission: string): boolean {
  const globalPerms = GLOBAL_PERMISSIONS[userRole] || []
  return globalPerms.includes(permission) || userRole === 'admin'
}

/**
 * Get all stages a user can access
 */
export function getAccessibleStages(userRole: UserRole): StageName[] {
  const stages: StageName[] = ['research', 'envision', 'assemble', 'connect', 'hone']
  return stages.filter(stage => hasStageAccess(userRole, stage, 'read'))
}

/**
 * Get permission level for a user in a specific stage
 */
export function getStagePermissionLevel(userRole: UserRole, stageName: StageName): PermissionLevel {
  return PERMISSION_MATRIX[userRole]?.[stageName] || 'none'
}

/**
 * Check if user can view all cards (regardless of assignment)
 */
export function canViewAllCards(userRole: UserRole): boolean {
  const globalPerms = GLOBAL_PERMISSIONS[userRole] || []
  return globalPerms.includes('view_all') || globalPerms.includes('global_view') || userRole === 'admin'
}

/**
 * Normalize stage name from various formats
 */
export function normalizeStage(stageOrName: string | { name: string }): StageName | null {
  const stageName = typeof stageOrName === 'string' ? stageOrName : stageOrName.name
  const normalized = stageName.toLowerCase()

  const stageMap: Record<string, StageName> = {
    'research': 'research',
    'envision': 'envision',
    'assemble': 'assemble',
    'connect': 'connect',
    'hone': 'hone',
  }

  return stageMap[normalized] || null
}

/**
 * Filter cards based on user permissions
 */
export function filterCardsByPermissions<T extends { stage: { name: string } }>(
  cards: T[],
  userRole: UserRole
): T[] {
  if (canViewAllCards(userRole)) {
    return cards
  }

  return cards.filter(card => {
    const stageName = normalizeStage(card.stage)
    return stageName && hasStageAccess(userRole, stageName, 'read')
  })
}

/**
 * Get user-friendly permission description
 */
export function getPermissionDescription(userRole: UserRole, stageName: StageName): string {
  const level = getStagePermissionLevel(userRole, stageName)

  switch (level) {
    case 'full':
      return 'Full access - create, edit, delete, move cards, assign users'
    case 'comment_approve':
      return 'View cards, add comments, approve/reject content'
    case 'read_only':
      return 'View cards and comments only'
    case 'none':
      return 'No access to this stage'
    default:
      return 'Access level unknown'
  }
}

/**
 * Check if user can drag and drop cards in a stage
 */
export function canDragCard(userRole: UserRole, stageName: StageName): boolean {
  const level = getStagePermissionLevel(userRole, stageName)
  // Only allow drag-drop for full access
  return level === 'full'
}

/**
 * Check if stage should show as read-only (visible but restricted)
 */
export function isStageReadOnly(userRole: UserRole, stageName: StageName): boolean {
  const level = getStagePermissionLevel(userRole, stageName)
  return level === 'read_only' || level === 'comment_approve'
}