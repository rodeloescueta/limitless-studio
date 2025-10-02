'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  Edit,
  Plus,
  Trash2,
  MoveRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type AuditAction = 'created' | 'updated' | 'deleted' | 'moved'

interface AuditLogChange {
  field: string
  old: string
  new: string
}

interface AuditLogUser {
  id: string
  name: string
  email: string
  avatar?: string | null
}

interface AuditLog {
  id: string
  action: AuditAction
  timestamp: string
  user: AuditLogUser | null
  changes: AuditLogChange[]
  metadata?: Record<string, any>
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  hasMore: boolean
}

interface CardHistoryPanelProps {
  cardId: string
}

export function CardHistoryPanel({ cardId }: CardHistoryPanelProps) {
  const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  const { data, isLoading, fetchNextPage, hasNextPage } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', cardId, filterAction],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      })

      if (filterAction !== 'all') {
        params.append('action', filterAction)
      }

      const response = await fetch(`/api/cards/${cardId}/audit-logs?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      return response.json()
    },
    enabled: !!cardId,
  })

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />
      case 'moved':
        return <MoveRight className="h-4 w-4 text-purple-600" />
    }
  }

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'created':
        return 'bg-green-50 border-green-200'
      case 'updated':
        return 'bg-blue-50 border-blue-200'
      case 'deleted':
        return 'bg-red-50 border-red-200'
      case 'moved':
        return 'bg-purple-50 border-purple-200'
    }
  }

  const getActionText = (log: AuditLog) => {
    switch (log.action) {
      case 'created':
        return 'created this card'
      case 'updated':
        return 'updated this card'
      case 'deleted':
        return 'deleted this card'
      case 'moved':
        return `moved card from ${log.metadata?.fromStage} to ${log.metadata?.toStage}`
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No history available for this card</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">Card History</h3>
        <Select
          value={filterAction}
          onValueChange={(value) => setFilterAction(value as AuditAction | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="moved">Moved</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {data.logs.map((log, index) => {
          const isExpanded = expandedLogs.has(log.id)
          const hasDetails = log.changes.length > 0

          return (
            <div
              key={log.id}
              className={`relative border rounded-lg p-4 ${getActionColor(log.action)}`}
            >
              {/* Timeline line */}
              {index !== data.logs.length - 1 && (
                <div className="absolute left-[26px] top-[52px] bottom-[-12px] w-0.5 bg-border" />
              )}

              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative z-10">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={log.user?.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {log.user ? getUserInitials(log.user.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {log.user?.name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {getActionText(log)}
                      </span>
                      <div className="flex items-center gap-1">
                        {getActionIcon(log.action)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Changes */}
                  {hasDetails && (
                    <>
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {log.changes.length} field{log.changes.length !== 1 ? 's' : ''} changed
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 bg-background/50 rounded p-3 border">
                          {log.changes.map((change, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="font-medium text-foreground mb-1">
                                {change.field}
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 line-through">
                                  {change.old || 'None'}
                                </code>
                                <MoveRight className="h-3 w-3 text-muted-foreground" />
                                <code className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200">
                                  {change.new || 'None'}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {data.hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
          >
            Load More History
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        Showing {data.logs.length} of {data.total} events
      </div>
    </div>
  )
}
