'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bell, MessageSquare, Calendar, CheckCircle, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Notification } from '@/lib/api-client'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  onCardClick?: (cardId: string) => void
  className?: string
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onCardClick,
  className
}: NotificationItemProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Bell className="h-4 w-4" />
      case 'mention':
        return <MessageSquare className="h-4 w-4" />
      case 'deadline':
        return <Calendar className="h-4 w-4" />
      case 'approval':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-800'
      case 'mention':
        return 'bg-green-100 text-green-800'
      case 'deadline':
        return 'bg-red-100 text-red-800'
      case 'approval':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCardClick = () => {
    if (notification.relatedCard && onCardClick) {
      onCardClick(notification.relatedCard.id)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(notification.id)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.isRead && "bg-blue-50 border-l-4 border-l-blue-500",
        className
      )}
      onClick={handleCardClick}
    >
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
        getTypeColor(notification.type)
      )}>
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h4 className={cn(
            "text-sm font-medium truncate",
            !notification.isRead && "font-semibold"
          )}>
            {notification.title}
          </h4>
          <div className="flex items-center gap-1 ml-2">
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
            <Badge variant="outline" className={cn("text-xs", getTypeColor(notification.type))}>
              {notification.type}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {notification.message}
        </p>

        {notification.relatedCard && (
          <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{notification.relatedCard.title}</span>
          </div>
        )}

        {notification.relatedComment && (
          <div className="text-xs text-gray-500 bg-gray-100 rounded p-2 mb-2">
            <MessageSquare className="h-3 w-3 inline mr-1" />
            {notification.relatedComment.content.substring(0, 100)}
            {notification.relatedComment.content.length > 100 && '...'}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>

          <div className="flex items-center gap-1">
            {!notification.isRead && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
              >
                Mark read
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}