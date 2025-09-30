import 'dotenv/config'
import { notificationQueue } from './queues/notificationQueue'
import { processNotification } from './processors/notificationProcessor'

async function startWorker() {
  console.log('🚀 Starting Content Reach Hub notification worker...')
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📦 Redis URL: ${process.env.REDIS_URL}`)
  console.log(`💬 Slack enabled: ${process.env.SLACK_NOTIFICATIONS_ENABLED}`)

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '3')
  console.log(`⚙️  Worker concurrency: ${concurrency}`)

  // Process notification jobs
  notificationQueue.process(concurrency, processNotification)

  // Event listeners for monitoring
  notificationQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed:`, result)
  })

  notificationQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })

  notificationQueue.on('stalled', (job) => {
    console.warn(`⚠️  Job ${job.id} stalled - may be stuck`)
  })

  notificationQueue.on('error', (error) => {
    console.error('❌ Queue error:', error)
  })

  console.log('✅ Worker ready and listening for notification jobs')
  console.log('📊 Waiting for jobs...')
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  await notificationQueue.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  await notificationQueue.close()
  process.exit(0)
})

// Start the worker
startWorker().catch((error) => {
  console.error('💥 Failed to start worker:', error)
  process.exit(1)
})