'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableContentCard } from './SortableContentCard'
import { CreateCardButton } from './CreateCardButton'
import type { Stage, ContentCard } from '@/lib/api-client'

interface KanbanColumnProps {
  stage: Stage
  cards: ContentCard[]
  teamId: string
}

export function KanbanColumn({ stage, cards, teamId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'stage',
      stageId: stage.id,
    },
  })

  return (
    <div className="w-80 bg-card rounded-lg shadow-sm border flex flex-col">
      {/* Column Header */}
      <div
        className="p-4 border-b border-l-4 rounded-t-lg"
        style={{ borderLeftColor: stage.color || '#6b7280' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-card-foreground">{stage.name}</h3>
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
          isOver ? 'bg-accent' : ''
        }`}
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
            <p className="text-sm">Drop cards here</p>
          </div>
        )}

        <CreateCardButton stageId={stage.id} teamId={teamId} />
      </div>
    </div>
  )
}