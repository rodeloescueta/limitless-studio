// Type-only imports to avoid bundling Bull for client-side
import type { Queue as BullQueue } from 'bull'

let notificationQueueInstance: BullQueue<NotificationJobData> | null = null

// Lazy initialization - only import Bull when actually needed (server-side only)
async function getQueue() {
  if (typeof window !== 'undefined') {
    // Client-side - queue not available
    return null
  }

  if (!notificationQueueInstance && process.env.REDIS_URL) {
    // Dynamic import to prevent client-side bundling
    const Bull = (await import('bull')).default
    const Redis = (await import('ioredis')).default

    const redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })

    notificationQueueInstance = new Bull('notifications', {
      createClient: () => redisClient.duplicate(),
    })
  }

  return notificationQueueInstance
}

export interface NotificationJobData {
  type: 'assignment' | 'mention' | 'deadline' | 'approval' | 'stage_change'
  userId: string
  cardId?: string
  commentId?: string
  title: string
  message: string
  slackEnabled?: boolean
  emailEnabled?: boolean
}

export async function enqueueNotification(data: NotificationJobData) {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Queue not available on client-side')
    return null
  }

  try {
    const queue = await getQueue()

    if (!queue) {
      console.warn('⚠️ Queue not initialized - Redis URL may be missing')
      return null
    }

    const job = await queue.add(data, {
      priority: data.type === 'deadline' ? 1 : 5,
    })

    console.log(`✅ Enqueued notification job ${job.id}: ${data.type} for user ${data.userId}`)
    return job
  } catch (error) {
    console.error('❌ Failed to enqueue notification:', error)
    throw error
  }
}

// Export function to get queue instance (for admin routes)
export async function getNotificationQueue() {
  return getQueue()
}