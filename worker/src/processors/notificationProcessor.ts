import { Job } from 'bull'
import { NotificationJobData } from '../queues/notificationQueue'
import { createInAppNotification } from '../services/notificationService'
import { sendSlackNotification } from '../services/slackService'

export async function processNotification(job: Job<NotificationJobData>) {
  const { data } = job

  console.log(`📨 Processing notification job ${job.id}: ${data.type} for user ${data.userId}`)

  try {
    // Always create in-app notification
    await createInAppNotification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedCardId: data.cardId,
      relatedCommentId: data.commentId,
    })

    // Send Slack notification if enabled
    if (data.slackEnabled && process.env.SLACK_NOTIFICATIONS_ENABLED === 'true') {
      await sendSlackNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        cardId: data.cardId,
      })
    }

    // Future: Send email notification
    if (data.emailEnabled) {
      // await sendEmailNotification(...)
      console.log('📧 Email notifications not yet implemented')
    }

    console.log(`✅ Successfully processed notification job ${job.id}`)
    return { success: true, jobId: job.id }
  } catch (error) {
    console.error(`❌ Failed to process notification job ${job.id}:`, error)
    throw error // Will trigger retry
  }
}

export default processNotification