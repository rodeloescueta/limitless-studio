import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// PUT /api/notifications/[notificationId] - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await params

    // Find the notification first to verify ownership
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1)

    if (!notification || notification.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Verify user owns this notification
    if (notification[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as read
    const updatedNotification = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning()

    return NextResponse.json(updatedNotification[0])

  } catch (error) {
    console.error('Error updating notification:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[notificationId] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await params

    // Find the notification first to verify ownership
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1)

    if (!notification || notification.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Verify user owns this notification or is admin
    if (notification[0].userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete notification
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting notification:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}