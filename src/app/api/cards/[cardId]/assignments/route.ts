import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withAuth, withPermission } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import { cardAssignments, contentCards, users, notifications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const createAssignmentSchema = z.object({
  assignedTo: z.string().uuid(),
  role: z.enum(['primary', 'reviewer', 'approver', 'collaborator']).default('primary'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// GET /api/cards/[cardId]/assignments - Get all assignments for a card
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

    // Verify card exists and user has access
    const card = await db
      .select()
      .from(contentCards)
      .where(eq(contentCards.id, cardId))
      .limit(1)

    if (!card || card.length === 0) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Get assignments with user details
    const assignments = await db
      .select({
        id: cardAssignments.id,
        role: cardAssignments.role,
        assignedAt: cardAssignments.assignedAt,
        dueDate: cardAssignments.dueDate,
        completedAt: cardAssignments.completedAt,
        notes: cardAssignments.notes,
        assignedTo: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          avatar: users.avatar,
        },
        assignedBy: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(cardAssignments)
      .leftJoin(users, eq(cardAssignments.assignedTo, users.id))
      .where(eq(cardAssignments.contentCardId, cardId))

    return NextResponse.json(assignments)

  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/cards/[cardId]/assignments - Create new assignment
export const POST = withPermission(
  async (request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) => {
    const { cardId } = await params
    return cardId
  },
  'assign',
  async (user, permissionData, request: NextRequest) => {
    try {
      const body = await request.json()
      const validatedData = createAssignmentSchema.parse(body)

      // Check if user being assigned exists
      const assigneeUser = await db
        .select()
        .from(users)
        .where(eq(users.id, validatedData.assignedTo))
        .limit(1)

      if (!assigneeUser || assigneeUser.length === 0) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 })
      }

      // Check if assignment already exists
      const existingAssignment = await db
        .select()
        .from(cardAssignments)
        .where(
          and(
            eq(cardAssignments.contentCardId, permissionData.card.id),
            eq(cardAssignments.assignedTo, validatedData.assignedTo)
          )
        )
        .limit(1)

      if (existingAssignment && existingAssignment.length > 0) {
        return NextResponse.json({ error: 'User already assigned to this card' }, { status: 400 })
      }

      // Create assignment
      const newAssignment = await db
        .insert(cardAssignments)
        .values({
          contentCardId: permissionData.card.id,
          assignedTo: validatedData.assignedTo,
          assignedBy: user.id,
          role: validatedData.role,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          notes: validatedData.notes,
        })
        .returning()

      // Create notification for assigned user
      await db.insert(notifications).values({
        userId: validatedData.assignedTo,
        type: 'assignment',
        title: 'New Assignment',
        message: `You have been assigned to "${permissionData.card.title}"`,
        relatedCardId: permissionData.card.id,
      })

      // Return assignment with user details
      const assignmentWithUser = await db
        .select({
          id: cardAssignments.id,
          role: cardAssignments.role,
          assignedAt: cardAssignments.assignedAt,
          dueDate: cardAssignments.dueDate,
          completedAt: cardAssignments.completedAt,
          notes: cardAssignments.notes,
          assignedTo: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            avatar: users.avatar,
          }
        })
        .from(cardAssignments)
        .leftJoin(users, eq(cardAssignments.assignedTo, users.id))
        .where(eq(cardAssignments.id, newAssignment[0].id))
        .limit(1)

      return NextResponse.json(assignmentWithUser[0], { status: 201 })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Error creating assignment:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)