import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications, contentCards, comments, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

// GET /api/users/[userId]/notifications - Get user notifications
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

    // Users can only access their own notifications (except admins)
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Build query conditions
    let whereConditions = eq(notifications.userId, userId)
    if (unreadOnly) {
      whereConditions = and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    }

    // Get notifications with related data
    const userNotifications = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        relatedCard: {
          id: contentCards.id,
          title: contentCards.title,
        },
        relatedComment: {
          id: comments.id,
          content: comments.content,
        }
      })
      .from(notifications)
      .leftJoin(contentCards, eq(notifications.relatedCardId, contentCards.id))
      .leftJoin(comments, eq(notifications.relatedCommentId, comments.id))
      .where(whereConditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    // Also get count of unread notifications
    const unreadCount = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
      hasMore: userNotifications.length === limit
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[userId]/notifications - Mark all notifications as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    // Users can only modify their own notifications
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark all unread notifications as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking notifications as read:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}