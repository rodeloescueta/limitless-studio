import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { comments, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
})

// PUT /api/comments/[commentId] - Update comment (own comments only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = await params
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // Check if comment exists and user owns it
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, commentId),
          eq(comments.userId, session.user.id)
        )
      )

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found or access denied' },
        { status: 404 }
      )
    }

    // Update the comment
    const [updatedComment] = await db
      .update(comments)
      .set({
        content: validatedData.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning()

    // Fetch the complete comment with user info
    const [commentWithUser] = await db
      .select({
        id: comments.id,
        content: comments.content,
        mentions: comments.mentions,
        parentCommentId: comments.parentCommentId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, commentId))

    return NextResponse.json(commentWithUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[commentId] - Delete comment (own + admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = await params

    // Check if comment exists
    const [existingComment] = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        user: {
          role: users.role,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, commentId))

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user owns the comment or is admin
    const isOwner = existingComment.userId === session.user.id
    const isAdmin = session.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete the comment (cascading will handle mentions and notifications)
    await db.delete(comments).where(eq(comments.id, commentId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}