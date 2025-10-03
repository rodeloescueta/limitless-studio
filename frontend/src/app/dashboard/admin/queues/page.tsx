'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface QueueStats {
  counts: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    total: number
  }
  jobs: {
    completed: Array<{ id: string; data: any; finishedOn?: number }>
    failed: Array<{ id: string; data: any; failedReason?: string; attemptsMade?: number }>
    active: Array<{ id: string; data: any; processedOn?: number }>
  }
  healthy: boolean
}

export default function QueueMonitoringPage() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/queues/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch queue stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    
return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchStats} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Monitoring</h1>
          <p className="text-muted-foreground">Monitor notification queue health and performance</p>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <Badge variant={stats.healthy ? 'default' : 'destructive'} className="text-sm">
              {stats.healthy ? '✓ Healthy' : '✗ Issues Detected'}
            </Badge>
          )}
          <Button onClick={fetchStats} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Waiting</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  {stats.counts.waiting}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  {stats.counts.active}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  {stats.counts.completed}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  {stats.counts.failed}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Delayed</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  {stats.counts.delayed}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Completed Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Completed</CardTitle>
                <CardDescription>Last 10 successful jobs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.jobs.completed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completed jobs</p>
                ) : (
                  stats.jobs.completed.map((job) => (
                    <div key={job.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">{job.data.type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {job.data.title}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Active Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Currently Processing</CardTitle>
                <CardDescription>Jobs in progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.jobs.active.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active jobs</p>
                ) : (
                  stats.jobs.active.map((job) => (
                    <div key={job.id} className="p-2 border rounded text-sm bg-blue-50 dark:bg-blue-950">
                      <div className="font-medium">{job.data.type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {job.data.title}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Failed Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Failures</CardTitle>
                <CardDescription>Jobs that failed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.jobs.failed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No failed jobs</p>
                ) : (
                  stats.jobs.failed.map((job) => (
                    <div key={job.id} className="p-2 border rounded text-sm bg-red-50 dark:bg-red-950">
                      <div className="font-medium">{job.data.type}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {job.failedReason || 'Unknown error'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Attempts: {job.attemptsMade || 0}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}