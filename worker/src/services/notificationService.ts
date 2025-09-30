import { db } from '../config/database'
import { notifications } from '../config/schema'

interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  message: string
  relatedCardId?: string
  relatedCommentId?: string
}

export async function createInAppNotification(params: CreateNotificationParams) {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedCardId: params.relatedCardId || null,
        relatedCommentId: params.relatedCommentId || null,
        isRead: false,
      })
      .returning()

    console.log(`✅ Created notification for user ${params.userId}: ${params.title}`)
    return notification
  } catch (error) {
    console.error('❌ Failed to create notification:', error)
    throw error
  }
}

export default { createInAppNotification }