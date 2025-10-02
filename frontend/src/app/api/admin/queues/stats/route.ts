import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getNotificationQueue } from '@/lib/queue'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permission
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationQueue = await getNotificationQueue()

    if (!notificationQueue) {
      return NextResponse.json(
        { error: 'Queue not available', message: 'Redis connection not initialized' },
        { status: 503 }
      )
    }

    // Get queue job counts
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      notificationQueue.getWaitingCount(),
      notificationQueue.getActiveCount(),
      notificationQueue.getCompletedCount(),
      notificationQueue.getFailedCount(),
      notificationQueue.getDelayedCount(),
    ])

    // Get recent jobs
    const recentCompleted = await notificationQueue.getCompleted(0, 9)
    const recentFailed = await notificationQueue.getFailed(0, 9)
    const currentActive = await notificationQueue.getActive(0, 9)

    return NextResponse.json({
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      },
      jobs: {
        completed: recentCompleted.map((job) => ({
          id: job.id,
          data: job.data,
          finishedOn: job.finishedOn,
          processedOn: job.processedOn,
        })),
        failed: recentFailed.map((job) => ({
          id: job.id,
          data: job.data,
          failedReason: job.failedReason,
          attemptsMade: job.attemptsMade,
        })),
        active: currentActive.map((job) => ({
          id: job.id,
          data: job.data,
          processedOn: job.processedOn,
        })),
      },
      healthy: failed < 10 && active < 50, // Simple health check
    })
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue statistics' },
      { status: 500 }
    )
  }
}