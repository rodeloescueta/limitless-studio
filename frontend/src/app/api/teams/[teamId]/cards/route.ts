import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTeamCards, verifyTeamAccess, createContentCard } from '@/lib/db/utils'
import { AuditLogService } from '@/lib/services/audit-log.service'
import { z } from 'zod'

const createCardSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  content: z.string().optional(),
  stageId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  contentFormat: z.enum(['short', 'long']).default('short'),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'ready_for_review', 'completed']).default('not_started'),
  dueDate: z.string().datetime().optional(),
  dueWindowStart: z.string().datetime().optional(),
  dueWindowEnd: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params

    // Verify user has access to this team
    const hasAccess = await verifyTeamAccess(session.user.id, teamId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const cards = await getTeamCards(teamId)
    
return NextResponse.json(cards)

  } catch (error) {
    console.error('Error fetching team cards:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and member can create cards
    if (session.user.role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { teamId } = await params

    // Verify user has access to this team
    const hasAccess = await verifyTeamAccess(session.user.id, teamId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createCardSchema.parse(body)

    const card = await createContentCard({
      ...validatedData,
      teamId: teamId,
      createdBy: session.user.id,
    })

    // Log card creation
    await AuditLogService.createLog({
      entityType: 'content_card',
      entityId: card.id,
      action: 'created',
      userId: session.user.id,
      teamId: teamId,
      metadata: {
        title: card.title,
        priority: card.priority,
      },
    })

    return NextResponse.json(card, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating card:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}