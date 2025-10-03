'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  MessageSquareIcon,
  PaperclipIcon,
  GripVerticalIcon,
  CheckSquare
} from 'lucide-react'
import { format } from 'date-fns'
import type { ContentCard as ContentCardType } from '@/lib/api-client'

interface ContentCardProps {
  card: ContentCardType
  dragHandleProps?: any
  isDragging?: boolean
  onClick?: () => void
  stageColor?: string
}

export function ContentCard({ card, dragHandleProps, isDragging, onClick, stageColor }: ContentCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the drag handle
    if (dragHandleProps && e.target === e.currentTarget) {
      return
    }
    onClick?.()
  }
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const tags = card.tags ? (typeof card.tags === 'string' ? JSON.parse(card.tags) : card.tags) : []

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''
      }`}
      onClick={handleClick}
      style={stageColor ? {
        borderLeft: `4px solid ${stageColor}`,
        boxShadow: `
          -2px 0 8px -2px ${stageColor},
          0 1px 3px 0 rgb(0 0 0 / 0.1),
          0 1px 2px -1px rgb(0 0 0 / 0.1)
        `
      } : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <h4 className="font-medium text-sm text-card-foreground line-clamp-2">
              {card.title}
            </h4>
            {card.client && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {card.client.clientCompanyName || card.client.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge
              variant="secondary"
              className={`text-xs ${priorityColors[card.priority]}`}
            >
              {card.priority}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 cursor-grab active:cursor-grabbing"
              {...dragHandleProps}
            >
              <GripVerticalIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {card.description}
          </p>
        )}

        {/* Format and Status badges */}
        <div className="flex gap-1 mt-2">
          {card.contentFormat && (
            <Badge variant="outline" className="text-xs">
              {card.contentFormat === 'short' ? 'Short' : 'Long'}
            </Badge>
          )}
          {card.status && card.status !== 'not_started' && (
            <Badge
              variant="outline"
              className={`text-xs ${
                card.status === 'completed' ? 'bg-green-50 text-green-700' :
                card.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                card.status === 'blocked' ? 'bg-red-50 text-red-700' :
                'bg-yellow-50 text-yellow-700'
              }`}
            >
              {card.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Checklist Progress Bar */}
        {card.checklistTotal > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span>Checklist</span>
              </div>
              <span className="font-medium">
                {card.checklistCompleted}/{card.checklistTotal}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  card.checklistCompleted === card.checklistTotal
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${(card.checklistCompleted / card.checklistTotal) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {card.assignedTo && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={card.assignedTo.avatar} />
                  <AvatarFallback className="text-xs">
                    {card.assignedTo.firstName?.[0] || ''}{card.assignedTo.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {(card.dueWindowStart || card.dueWindowEnd || card.dueDate) && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {card.dueWindowStart && card.dueWindowEnd ? (
                    `${format(new Date(card.dueWindowStart), 'MMM d')} - ${format(new Date(card.dueWindowEnd), 'MMM d')}`
                  ) : card.dueWindowEnd ? (
                    `Due ${format(new Date(card.dueWindowEnd), 'MMM d')}`
                  ) : card.dueWindowStart ? (
                    `From ${format(new Date(card.dueWindowStart), 'MMM d')}`
                  ) : card.dueDate ? (
                    format(new Date(card.dueDate), 'MMM d')
                  ) : null}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {card.commentsCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquareIcon className="h-3 w-3" />
                <span>{card.commentsCount}</span>
              </div>
            )}

            {card.attachmentsCount > 0 && (
              <div className="flex items-center gap-1">
                <PaperclipIcon className="h-3 w-3" />
                <span>{card.attachmentsCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}