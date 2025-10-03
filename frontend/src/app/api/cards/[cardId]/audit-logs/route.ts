import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContentCard, verifyTeamAccess } from '@/lib/db/utils'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  action: z.enum(['created', 'updated', 'deleted', 'moved']).optional(),
  userId: z.string().uuid().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

    // Get card and verify access
    const card = await getContentCard(cardId)
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Verify user has access to the team
    const hasAccess = await verifyTeamAccess(session.user.id, card.teamId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = querySchema.parse({
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      action: searchParams.get('action') || undefined,
      userId: searchParams.get('userId') || undefined,
    })

    // Get audit logs
    const { logs, total } = await AuditLogService.getLogsForEntity({
      entityType: 'content_card',
      entityId: cardId,
      ...queryParams,
    })

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      timestamp: log.createdAt,
      user: log.user ? {
        id: log.user.id,
        name: `${log.user.firstName} ${log.user.lastName}`,
        email: log.user.email,
        avatar: log.user.avatar,
      } : null,
      changes: AuditLogService.formatChangedFields(log.changedFields),
      metadata: log.metadata,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      hasMore: queryParams.offset + formattedLogs.length < total,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching audit logs:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
