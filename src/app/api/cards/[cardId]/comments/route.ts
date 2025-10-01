import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { comments, commentMentions, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { enqueueNotification } from '@/lib/queue'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  mentions: z.array(z.string()).optional().default([]),
  parentCommentId: z.string().optional().nullable(),
})

// GET /api/cards/[cardId]/comments - List comments for a card
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

    const cardComments = await db
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
      .where(eq(comments.contentCardId, cardId))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json(cardComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/cards/[cardId]/comments - Create a new comment
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
    const body = await request.json()

    const validatedData = createCommentSchema.parse(body)

    // Create the comment
    const [newComment] = await db
      .insert(comments)
      .values({
        contentCardId: cardId,
        userId: session.user.id,
        content: validatedData.content,
        mentions: JSON.stringify(validatedData.mentions),
        parentCommentId: validatedData.parentCommentId,
      })
      .returning()

    // Create mention notifications
    if (validatedData.mentions.length > 0) {
      // Get the current user's details for the notification message
      const [currentUser] = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, session.user.id))

      const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Someone'

      for (const mentionedUserId of validatedData.mentions) {
        // Create mention record
        await db.insert(commentMentions).values({
          commentId: newComment.id,
          mentionedUserId,
          isRead: false,
        })

        // Queue notification (non-blocking)
        await enqueueNotification({
          type: 'mention',
          userId: mentionedUserId,
          cardId: cardId,
          commentId: newComment.id,
          title: 'You were mentioned in a comment',
          message: `${userName} mentioned you in a comment`,
          slackEnabled: true,
        })
      }
    }

    // Fetch the complete comment with user info
    const [createdComment] = await db
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
      .where(eq(comments.id, newComment.id))

    return NextResponse.json(createdComment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}