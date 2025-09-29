import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { contentCards, stages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  hasStageAccess,
  canEditCard,
  canDeleteCard,
  canAssignUsers,
  normalizeStage,
  type UserRole,
  type PermissionAction
} from '@/lib/permissions'

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  name: string
}

/**
 * Authenticate request and return user session
 */
export async function authenticateUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.role as UserRole,
    name: session.user.name || '',
  }
}

/**
 * Check if user has permission for a specific action
 */
export async function requirePermission(
  user: AuthenticatedUser | null,
  cardId: string,
  action: PermissionAction
): Promise<{ allowed: boolean; card?: any; stage?: any; error?: string }> {
  if (!user) {
    return { allowed: false, error: 'Authentication required' }
  }

  // Get card and stage information
  const cardData = await db
    .select({
      id: contentCards.id,
      title: contentCards.title,
      teamId: contentCards.teamId,
      stageId: contentCards.stageId,
      stage: {
        id: stages.id,
        name: stages.name,
      }
    })
    .from(contentCards)
    .leftJoin(stages, eq(contentCards.stageId, stages.id))
    .where(eq(contentCards.id, cardId))
    .limit(1)

  if (!cardData || cardData.length === 0) {
    return { allowed: false, error: 'Card not found' }
  }

  const card = cardData[0]
  const stageName = normalizeStage(card.stage?.name || '')

  if (!stageName) {
    return { allowed: false, error: 'Invalid stage' }
  }

  // Check specific action permissions
  let allowed = false

  switch (action) {
    case 'read':
      allowed = hasStageAccess(user.role, stageName, 'read')
      break
    case 'write':
      allowed = canEditCard(user.role, stageName)
      break
    case 'delete':
      allowed = canDeleteCard(user.role, stageName)
      break
    case 'assign':
      allowed = canAssignUsers(user.role, stageName)
      break
    case 'comment':
    case 'approve':
      allowed = hasStageAccess(user.role, stageName, action)
      break
    default:
      allowed = false
  }

  return {
    allowed,
    card,
    stage: card.stage,
    error: allowed ? undefined : `Insufficient permissions for ${action} action`
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const user = await authenticateUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(user, ...args)
  }
}

/**
 * Middleware wrapper for API routes that require specific permissions
 */
export function withPermission<T extends any[]>(
  cardIdExtractor: (...args: T) => string | Promise<string>,
  action: PermissionAction,
  handler: (user: AuthenticatedUser, permissionData: any, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (user: AuthenticatedUser, ...args: T): Promise<NextResponse> => {
    try {
      const cardId = await cardIdExtractor(...args)
      const permissionCheck = await requirePermission(user, cardId, action)

      if (!permissionCheck.allowed) {
        return NextResponse.json(
          { error: permissionCheck.error || 'Access denied' },
          { status: 403 }
        )
      }

      return handler(user, permissionCheck, ...args)
    } catch (error) {
      console.error('Permission check error:', error)
      return NextResponse.json(
        { error: 'Permission validation failed' },
        { status: 500 }
      )
    }
  })
}

/**
 * Admin-only middleware wrapper
 */
export function withAdminAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (user: AuthenticatedUser, ...args: T): Promise<NextResponse> => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return handler(user, ...args)
  })
}

/**
 * Role-based middleware wrapper
 */
export function withRoles<T extends any[]>(
  allowedRoles: UserRole[],
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return withAuth(async (user: AuthenticatedUser, ...args: T): Promise<NextResponse> => {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: `Access restricted to: ${allowedRoles.join(', ')}` },
        { status: 403 }
      )
    }

    return handler(user, ...args)
  })
}