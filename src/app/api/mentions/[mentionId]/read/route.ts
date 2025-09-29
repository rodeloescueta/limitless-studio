import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { commentMentions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// POST /api/mentions/[mentionId]/read - Mark mention as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mentionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mentionId } = await params

    // Check if mention exists and belongs to the user
    const [existingMention] = await db
      .select()
      .from(commentMentions)
      .where(
        and(
          eq(commentMentions.id, mentionId),
          eq(commentMentions.mentionedUserId, session.user.id)
        )
      )

    if (!existingMention) {
      return NextResponse.json(
        { error: 'Mention not found or access denied' },
        { status: 404 }
      )
    }

    // Mark as read
    await db
      .update(commentMentions)
      .set({ isRead: true })
      .where(eq(commentMentions.id, mentionId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking mention as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark mention as read' },
      { status: 500 }
    )
  }
}