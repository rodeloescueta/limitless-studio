import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContentCard, verifyTeamAccess, updateContentCard, deleteContentCard } from '@/lib/db/utils'
import { withAuth, withPermission } from '@/lib/auth-middleware'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { z } from 'zod'
import { db } from '@/lib/db'
import { stages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { canEditCard, normalizeStage } from '@/lib/permissions'

const updateCardSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  contentFormat: z.enum(['short', 'long']).optional(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'ready_for_review', 'completed']).optional(),
  clientId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  dueWindowStart: z.string().datetime().optional().nullable(),
  dueWindowEnd: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
  stageId: z.string().uuid().optional(),
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
    const card = await getContentCard(cardId)
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Verify user has access to the team
    const hasAccess = await verifyTeamAccess(session.user.id, card.teamId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(card)

  } catch (error) {
    console.error('Error fetching card:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PUT = withPermission(
  async (request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) => {
    const { cardId } = await params
    
return cardId
  },
  'write',
  async (user, permissionData, request: NextRequest) => {
    try {
      const body = await request.json()
      const validatedData = updateCardSchema.parse(body)

      // If moving to a different stage, verify user has permission for destination stage
      if (validatedData.stageId && validatedData.stageId !== permissionData.card.stageId) {
        // Get destination stage
        const [destinationStage] = await db
          .select()
          .from(stages)
          .where(eq(stages.id, validatedData.stageId))
          .limit(1)

        if (!destinationStage) {
          return NextResponse.json(
            { error: 'Invalid destination stage' },
            { status: 400 }
          )
        }

        // Verify destination stage belongs to same team
        if (destinationStage.teamId !== permissionData.card.teamId) {
          return NextResponse.json(
            { error: 'Cannot move card to different team' },
            { status: 400 }
          )
        }

        // Check if user has edit permission for destination stage
        const destinationStageName = normalizeStage(destinationStage.name)
        if (!destinationStageName) {
          return NextResponse.json(
            { error: 'Invalid destination stage name' },
            { status: 400 }
          )
        }

        const hasDestinationAccess = canEditCard(user.role, destinationStageName)
        if (!hasDestinationAccess) {
          // Log detailed reason for debugging
          console.warn(`Stage transition denied: user ${user.id} (${user.role}) cannot move card to ${destinationStageName}`)
          
return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        }
      }

      // Detect changed fields for audit log
      const changedFields = AuditLogService.detectChangedFields(
        permissionData.card,
        { ...permissionData.card, ...validatedData },
        ['title', 'description', 'content', 'priority', 'assignedTo', 'dueDate', 'tags']
      )

      const updatedCard = await updateContentCard(permissionData.card.id, validatedData)

      // Log card update
      if (changedFields) {
        await AuditLogService.createLog({
          entityType: 'content_card',
          entityId: permissionData.card.id,
          action: 'updated',
          userId: user.id,
          teamId: permissionData.card.teamId,
          changedFields,
        })
      }

      return NextResponse.json(updatedCard)

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Error updating card:', error)
      
return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = withPermission(
  async (request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) => {
    const { cardId } = await params
    
return cardId
  },
  'delete',
  async (user, permissionData) => {
    try {
      // Log card deletion (before deleting)
      await AuditLogService.createLog({
        entityType: 'content_card',
        entityId: permissionData.card.id,
        action: 'deleted',
        userId: user.id,
        teamId: permissionData.card.teamId,
        metadata: {
          title: permissionData.card.title,
          stageId: permissionData.card.stageId,
        },
      })

      await deleteContentCard(permissionData.card.id)
      
return NextResponse.json({ success: true })

    } catch (error) {
      console.error('Error deleting card:', error)
      
return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)