import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { commentMentions, comments, users, contentCards } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/users/[userId]/mentions - Get user's unread mentions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    // Users can only access their own mentions (or admins can access any)
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    let query = db
      .select({
        id: commentMentions.id,
        isRead: commentMentions.isRead,
        createdAt: commentMentions.createdAt,
        comment: {
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            avatar: users.avatar,
          },
        },
        card: {
          id: contentCards.id,
          title: contentCards.title,
        },
      })
      .from(commentMentions)
      .leftJoin(comments, eq(commentMentions.commentId, comments.id))
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(contentCards, eq(comments.contentCardId, contentCards.id))
      .where(eq(commentMentions.mentionedUserId, userId))
      .orderBy(desc(commentMentions.createdAt))

    if (unreadOnly) {
      query = query.where(eq(commentMentions.isRead, false))
    }

    const mentions = await query

    return NextResponse.json(mentions)
  } catch (error) {
    console.error('Error fetching mentions:', error)
    
return NextResponse.json(
      { error: 'Failed to fetch mentions' },
      { status: 500 }
    )
  }
}