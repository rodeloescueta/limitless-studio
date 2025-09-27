import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContentCard, verifyTeamAccess, moveContentCard } from '@/lib/db/utils'
import { z } from 'zod'

const moveCardSchema = z.object({
  stageId: z.string().uuid(),
  position: z.number().int().min(1),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { cardId: string } }
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

    const card = await getContentCard(params.cardId)
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

    const movedCard = await moveContentCard(params.cardId, stageId, position)
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