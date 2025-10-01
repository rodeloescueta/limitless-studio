import { NextRequest, NextResponse } from 'next/server'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { notificationQueue } from '@/lib/queue'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Only initialize Bull Board if queue is available
let serverAdapter: ExpressAdapter | null = null

if (notificationQueue) {
  serverAdapter = new ExpressAdapter()
  serverAdapter.setBasePath('/api/admin/queues/ui')

  createBullBoard({
    queues: [new BullAdapter(notificationQueue)],
    serverAdapter: serverAdapter,
  })
}

export async function GET(request: NextRequest) {
  // Check authentication and admin permission
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!serverAdapter) {
    return NextResponse.json(
      { error: 'Queue monitoring not available' },
      { status: 503 }
    )
  }

  // Bull Board handles the UI rendering
  const handler = serverAdapter.getRouter()
  return handler(request as any) as any
}