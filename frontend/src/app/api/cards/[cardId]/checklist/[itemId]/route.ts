import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cardChecklistItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateChecklistItemSchema = z.object({
  isCompleted: z.boolean(),
})

// PUT /api/cards/[cardId]/checklist/[itemId] - Toggle checklist item completion
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId, itemId } = await params

    // Verify item exists and belongs to card
    const [item] = await db
      .select()
      .from(cardChecklistItems)
      .where(eq(cardChecklistItems.id, itemId))
      .limit(1)

    if (!item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    if (item.cardId !== cardId) {
      return NextResponse.json({ error: 'Item does not belong to this card' }, { status: 400 })
    }

    const body = await request.json()
    const { isCompleted } = updateChecklistItemSchema.parse(body)

    const [updatedItem] = await db
      .update(cardChecklistItems)
      .set({
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedBy: isCompleted ? session.user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(cardChecklistItems.id, itemId))
      .returning()

    return NextResponse.json(updatedItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating checklist item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/cards/[cardId]/checklist/[itemId] - Delete checklist item (custom only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId, itemId } = await params

    // Verify item exists and belongs to card
    const [item] = await db
      .select()
      .from(cardChecklistItems)
      .where(eq(cardChecklistItems.id, itemId))
      .limit(1)

    if (!item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    if (item.cardId !== cardId) {
      return NextResponse.json({ error: 'Item does not belong to this card' }, { status: 400 })
    }

    // Only allow deleting custom items
    if (!item.isCustom) {
      return NextResponse.json({ error: 'Cannot delete template-based items' }, { status: 403 })
    }

    await db.delete(cardChecklistItems).where(eq(cardChecklistItems.id, itemId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
