import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContentCard, verifyTeamAccess, updateContentCard, deleteContentCard } from '@/lib/db/utils'
import { withAuth, withPermission } from '@/lib/auth-middleware'
import { z } from 'zod'

const updateCardSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).optional(),
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

      const updatedCard = await updateContentCard(permissionData.card.id, validatedData)
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