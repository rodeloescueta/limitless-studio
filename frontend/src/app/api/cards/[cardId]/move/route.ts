import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContentCard, verifyTeamAccess, moveContentCard } from '@/lib/db/utils'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { db } from '@/lib/db'
import { stages, checklistTemplates, cardChecklistItems } from '@/lib/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import { z } from 'zod'

const moveCardSchema = z.object({
  stageId: z.string().uuid(),
  position: z.number().int().min(1),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and member can move cards
    if (session.user.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const body = await request.json()
    const { stageId, position } = moveCardSchema.parse(body)

    // Get old and new stage names for audit log
    const [oldStage] = await db
      .select()
      .from(stages)
      .where(eq(stages.id, card.stageId))
      .limit(1)

    const [newStage] = await db
      .select()
      .from(stages)
      .where(eq(stages.id, stageId))
      .limit(1)

    const movedCard = await moveContentCard(cardId, stageId, position)

    // Auto-populate checklist when stage changes
    if (card.stageId !== stageId && newStage) {
      // Delete old template-based checklist items (keep custom items)
      await db
        .delete(cardChecklistItems)
        .where(
          and(
            eq(cardChecklistItems.cardId, cardId),
            eq(cardChecklistItems.isCustom, false)
          )
        )

      // Get templates for the new stage
      const templates = await db
        .select()
        .from(checklistTemplates)
        .where(eq(checklistTemplates.stageId, newStage.id))
        .orderBy(asc(checklistTemplates.position))

      // Create checklist items from templates
      for (const template of templates) {
        await db.insert(cardChecklistItems).values({
          cardId,
          templateId: template.id,
          title: template.title,
          description: template.description,
          position: template.position,
          isCustom: false, // Template-based item
        })
      }
    }

    // Log card move if stage changed
    if (card.stageId !== stageId && oldStage && newStage) {
      await AuditLogService.createLog({
        entityType: 'content_card',
        entityId: cardId,
        action: 'moved',
        userId: session.user.id,
        teamId: card.teamId,
        metadata: {
          fromStage: oldStage.name,
          toStage: newStage.name,
          fromStageId: card.stageId,
          toStageId: stageId,
        },
      })
    }

    return NextResponse.json(movedCard)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error moving card:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}