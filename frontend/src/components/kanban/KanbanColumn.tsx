'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSession } from 'next-auth/react'
import { Eye, Lock } from 'lucide-react'
import { SortableContentCard } from './SortableContentCard'
import { CreateCardButton } from './CreateCardButton'
import { hasStageAccess, normalizeStage, isStageReadOnly, getPermissionDescription, type UserRole } from '@/lib/permissions'
import type { Stage, ContentCard } from '@/lib/api-client'

interface KanbanColumnProps {
  stage: Stage
  cards: ContentCard[]
  teamId: string
}

export function KanbanColumn({ stage, cards, teamId }: KanbanColumnProps) {
  const { data: session } = useSession()
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'stage',
      stageId: stage.id,
    },
  })

  // Check user permissions for this stage
  const userRole = (session?.user?.role as UserRole) || 'member'
  const stageName = normalizeStage(stage.name)
  const canCreateCard = stageName && hasStageAccess(userRole, stageName, 'write')
  const isReadOnly = stageName && isStageReadOnly(userRole, stageName)
  const permissionDesc = stageName ? getPermissionDescription(userRole, stageName) : ''

  return (
    <div className="w-80 bg-card rounded-lg shadow-sm border flex flex-col">
      {/* Column Header */}
      <div
        className="p-4 border-b border-l-4 rounded-t-lg"
        style={{ borderLeftColor: stage.color || '#6b7280' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-card-foreground">{stage.name}</h3>
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full" title={permissionDesc}>
                <Eye className="w-3 h-3" />
                View Only
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>
        {stage.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stage.description}</p>
        )}
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`p-4 space-y-3 min-h-[500px] flex-1 transition-colors ${
          isOver && !isReadOnly ? 'bg-accent' : ''
        } ${isReadOnly ? 'opacity-75' : ''}`}
        data-stage-id={stage.id}
      >
        <SortableContext
          items={cards.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableContentCard key={card.id} card={card} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            {isReadOnly ? (
              <div className="text-center">
                <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Read-only access</p>
              </div>
            ) : (
              <p className="text-sm">Drop cards here</p>
            )}
          </div>
        )}

        {canCreateCard && <CreateCardButton stageId={stage.id} teamId={teamId} />}
      </div>
    </div>
  )
}