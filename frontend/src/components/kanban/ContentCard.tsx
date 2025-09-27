'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  MessageSquareIcon,
  PaperclipIcon,
  GripVerticalIcon
} from 'lucide-react'
import { format } from 'date-fns'
import type { ContentCard as ContentCardType } from '@/lib/api-client'

interface ContentCardProps {
  card: ContentCardType
  dragHandleProps?: any
  isDragging?: boolean
  onClick?: () => void
}

export function ContentCard({ card, dragHandleProps, isDragging, onClick }: ContentCardProps) {
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
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1 mr-2">
            {card.title}
          </h4>
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
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {card.description}
          </p>
        )}
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

        {/* Card Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {card.assignedTo && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={card.assignedTo.avatar} />
                  <AvatarFallback className="text-xs">
                    {card.assignedTo.firstName[0]}{card.assignedTo.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {card.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span>{format(new Date(card.dueDate), 'MMM d')}</span>
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