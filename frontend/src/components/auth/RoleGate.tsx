'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import {
  hasStageAccess,
  canEditCard,
  canDeleteCard,
  canAssignUsers,
  canComment,
  canApprove,
  hasGlobalPermission,
  normalizeStage,
  type UserRole,
  type StageName,
  type PermissionAction
} from '@/lib/permissions'

interface RoleGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode

  // Role-based access
  roles?: UserRole[]

  // Stage-based access
  stage?: StageName | string
  action?: PermissionAction

  // Specific permission checks
  canEdit?: boolean
  canDelete?: boolean
  canAssign?: boolean
  canComment?: boolean
  canApprove?: boolean

  // Global permissions
  globalPermission?: string

  // Custom permission function
  hasPermission?: (userRole: UserRole) => boolean

  // Inverse logic (show when user DOESN'T have permission)
  inverse?: boolean
}

export function RoleGate({
  children,
  fallback = null,
  roles,
  stage,
  action,
  canEdit = false,
  canDelete = false,
  canAssign = false,
  canComment: canCommentProp = false,
  canApprove: canApproveProp = false,
  globalPermission,
  hasPermission,
  inverse = false
}: RoleGateProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return inverse ? <>{children}</> : <>{fallback}</>
  }

  const userRole = session.user.role as UserRole
  let allowed = false

  // Role-based check
  if (roles) {
    allowed = roles.includes(userRole)
  }

  // Stage and action-based check
  if (stage && action) {
    const stageName = normalizeStage(stage)
    if (stageName) {
      allowed = hasStageAccess(userRole, stageName, action)
    }
  }

  // Specific permission checks
  if (stage) {
    const stageName = normalizeStage(stage)
    if (stageName) {
      if (canEdit) {
        allowed = canEditCard(userRole, stageName)
      } else if (canDelete) {
        allowed = canDeleteCard(userRole, stageName)
      } else if (canAssign) {
        allowed = canAssignUsers(userRole, stageName)
      } else if (canCommentProp) {
        allowed = canComment(userRole, stageName)
      } else if (canApproveProp) {
        allowed = canApprove(userRole, stageName)
      }
    }
  }

  // Global permission check
  if (globalPermission) {
    allowed = hasGlobalPermission(userRole, globalPermission)
  }

  // Custom permission function
  if (hasPermission) {
    allowed = hasPermission(userRole)
  }

  // Handle inverse logic
  if (inverse) {
    allowed = !allowed
  }

  return allowed ? <>{children}</> : <>{fallback}</>
}

/**
 * Convenience components for common permission patterns
 */

interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RoleGate roles={['admin']} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

interface StageAccessProps {
  children: React.ReactNode
  stage: StageName | string
  action?: PermissionAction
  fallback?: React.ReactNode
}

export function StageAccess({ children, stage, action = 'read', fallback }: StageAccessProps) {
  return (
    <RoleGate stage={stage} action={action} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

interface EditAccessProps {
  children: React.ReactNode
  stage: StageName | string
  fallback?: React.ReactNode
}

export function EditAccess({ children, stage, fallback }: EditAccessProps) {
  return (
    <RoleGate stage={stage} canEdit fallback={fallback}>
      {children}
    </RoleGate>
  )
}

interface AssignAccessProps {
  children: React.ReactNode
  stage?: StageName | string
  fallback?: React.ReactNode
}

export function AssignAccess({ children, stage, fallback }: AssignAccessProps) {
  return (
    <RoleGate stage={stage} canAssign fallback={fallback}>
      {children}
    </RoleGate>
  )
}

/**
 * Hook for permission checking in components
 */
export function usePermissions() {
  const { data: session } = useSession()

  const userRole = (session?.user?.role as UserRole) || null

  return {
    userRole,
    hasStageAccess: (stage: StageName | string, action: PermissionAction) => {
      if (!userRole) return false
      const stageName = normalizeStage(stage)
      
return stageName ? hasStageAccess(userRole, stageName, action) : false
    },
    canEdit: (stage: StageName | string) => {
      if (!userRole) return false
      const stageName = normalizeStage(stage)
      
return stageName ? canEditCard(userRole, stageName) : false
    },
    canDelete: (stage: StageName | string) => {
      if (!userRole) return false
      const stageName = normalizeStage(stage)
      
return stageName ? canDeleteCard(userRole, stageName) : false
    },
    canAssign: (stage?: StageName | string) => {
      if (!userRole) return false
      const stageName = stage ? normalizeStage(stage) : undefined
      
return canAssignUsers(userRole, stageName)
    },
    canComment: (stage: StageName | string) => {
      if (!userRole) return false
      const stageName = normalizeStage(stage)
      
return stageName ? canComment(userRole, stageName) : false
    },
    canApprove: (stage: StageName | string) => {
      if (!userRole) return false
      const stageName = normalizeStage(stage)
      
return stageName ? canApprove(userRole, stageName) : false
    },
    hasGlobalPermission: (permission: string) => {
      if (!userRole) return false
      
return hasGlobalPermission(userRole, permission)
    },
    isAdmin: userRole === 'admin',
    isLoggedIn: !!userRole,
  }
}