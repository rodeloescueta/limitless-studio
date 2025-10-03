import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cardChecklistItems, contentCards, checklistTemplates, users } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'

const createChecklistItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  position: z.number().int().optional(),
})

// GET /api/cards/[cardId]/checklist - Get all checklist items for a card
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

    // Verify card exists
    const [card] = await db
      .select()
      .from(contentCards)
      .where(eq(contentCards.id, cardId))
      .limit(1)

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Get checklist items with completed by user
    const items = await db
      .select({
        id: cardChecklistItems.id,
        cardId: cardChecklistItems.cardId,
        templateId: cardChecklistItems.templateId,
        title: cardChecklistItems.title,
        description: cardChecklistItems.description,
        position: cardChecklistItems.position,
        isCompleted: cardChecklistItems.isCompleted,
        completedAt: cardChecklistItems.completedAt,
        isCustom: cardChecklistItems.isCustom,
        createdAt: cardChecklistItems.createdAt,
        updatedAt: cardChecklistItems.updatedAt,
        completedBy: users,
      })
      .from(cardChecklistItems)
      .leftJoin(users, eq(cardChecklistItems.completedBy, users.id))
      .where(eq(cardChecklistItems.cardId, cardId))
      .orderBy(asc(cardChecklistItems.position))

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching checklist:', error)
    
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cards/[cardId]/checklist - Add custom checklist item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

    // Verify card exists
    const [card] = await db
      .select()
      .from(contentCards)
      .where(eq(contentCards.id, cardId))
      .limit(1)

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createChecklistItemSchema.parse(body)

    // Get next position if not provided
    let position = validatedData.position
    if (position === undefined) {
      const existingItems = await db
        .select({ position: cardChecklistItems.position })
        .from(cardChecklistItems)
        .where(eq(cardChecklistItems.cardId, cardId))
        .orderBy(asc(cardChecklistItems.position))

      position = existingItems.length > 0 ? Math.max(...existingItems.map(i => i.position)) + 1 : 0
    }

    const [newItem] = await db
      .insert(cardChecklistItems)
      .values({
        cardId,
        title: validatedData.title,
        description: validatedData.description,
        position,
        isCustom: true, // Custom items added by user
      })
      .returning()

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating checklist item:', error)
    
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
