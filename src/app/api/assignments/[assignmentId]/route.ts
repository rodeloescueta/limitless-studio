import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cardAssignments, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// DELETE /api/assignments/[assignmentId] - Remove assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params

    // Find the assignment
    const assignment = await db
      .select()
      .from(cardAssignments)
      .where(eq(cardAssignments.id, assignmentId))
      .limit(1)

    if (!assignment || assignment.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const assignmentData = assignment[0]

    // Check if user has permission to remove assignment
    // Only the person who created the assignment, the assigned user, or admin can remove it
    if (
      assignmentData.assignedBy !== session.user.id &&
      assignmentData.assignedTo !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the assignment
    await db
      .delete(cardAssignments)
      .where(eq(cardAssignments.id, assignmentId))

    // Create notification for assignment removal (if removed by someone else)
    if (assignmentData.assignedTo !== session.user.id) {
      await db.insert(notifications).values({
        userId: assignmentData.assignedTo,
        type: 'assignment',
        title: 'Assignment Removed',
        message: `You have been unassigned from a card`,
        relatedCardId: assignmentData.contentCardId,
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/assignments/[assignmentId] - Update assignment (e.g., mark as completed)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params

    // Find the assignment
    const assignment = await db
      .select()
      .from(cardAssignments)
      .where(eq(cardAssignments.id, assignmentId))
      .limit(1)

    if (!assignment || assignment.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const body = await request.json()
    const { completed } = body

    // Update assignment completion status
    const updatedAssignment = await db
      .update(cardAssignments)
      .set({
        completedAt: completed ? new Date() : null,
      })
      .where(eq(cardAssignments.id, assignmentId))
      .returning()

    return NextResponse.json(updatedAssignment[0])

  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}