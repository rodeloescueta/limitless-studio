import Queue from 'bull'
import Redis from 'ioredis'

// Only initialize Redis client on server side
const isServer = typeof window === 'undefined'

let redisClient: Redis | null = null
let notificationQueueInstance: Queue.Queue<NotificationJobData> | null = null

if (isServer && process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  notificationQueueInstance = new Queue('notifications', {
    createClient: () => redisClient!.duplicate(),
  })
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
  if (!isServer || !notificationQueueInstance) {
    console.warn('Queue not available - this should only be called server-side')
    return null
  }

  try {
    const job = await notificationQueueInstance.add(data, {
      priority: data.type === 'deadline' ? 1 : 5,
    })
    console.log(`✅ Enqueued notification job ${job.id}: ${data.type} for user ${data.userId}`)
    return job
  } catch (error) {
    console.error('❌ Failed to enqueue notification:', error)
    throw error
  }
}

export const notificationQueue = notificationQueueInstance