import Queue from 'bull'
import redisClient from '../config/redis'

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

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  createClient: () => redisClient.duplicate(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

export async function addNotificationJob(data: NotificationJobData) {
  const priority = data.type === 'deadline' ? 1 : 5 // Higher priority for deadlines
  return notificationQueue.add(data, { priority })
}

console.log('✅ Notification queue initialized')

export default notificationQueue