'use client'

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useTeamCards } from '@/lib/hooks/useCards'
import { useTeamStages } from '@/lib/hooks/useTeams'
import { useCardMovement } from '@/lib/hooks/useCards'
import { KanbanColumn } from './KanbanColumn'
import { ContentCard } from './ContentCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { ContentCard as ContentCardType } from '@/lib/api-client'

interface KanbanBoardProps {
  teamId: string
}

export function KanbanBoard({ teamId }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<ContentCardType | null>(null)

  const { data: cards = [], isLoading: cardsLoading } = useTeamCards(teamId)
  const { data: stages = [], isLoading: stagesLoading } = useTeamStages(teamId)
  const moveCard = useCardMovement()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over || active.id === over.id) {
      return
    }

    const sourceCard = cards.find(c => c.id === active.id)
    if (!sourceCard) return

    // Get the target stage ID
    let targetStageId: string
    let targetPosition: number

    if (over.data.current?.type === 'stage') {
      // Dropped on empty stage
      targetStageId = over.id as string
      targetPosition = 1
    } else {
      // Dropped on or near another card
      const targetCard = cards.find(c => c.id === over.id)
      if (targetCard) {
        targetStageId = targetCard.stageId
        targetPosition = targetCard.position
      } else {
        return
      }
    }

    // Don't move if it's the same position
    if (sourceCard.stageId === targetStageId && sourceCard.position === targetPosition) {
      return
    }

    try {
      await moveCard.mutateAsync({
        cardId: sourceCard.id,
        stageId: targetStageId,
        position: targetPosition,
      })
    } catch (error) {
      console.error('Failed to move card:', error)
    }
  }

  if (stagesLoading || cardsLoading) {
    return <KanbanBoardSkeleton />
  }

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No stages found</h3>
          <p className="text-gray-600">This team doesn't have any workflow stages yet.</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-gray-50">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            cards={cards.filter(card => card.stageId === stage.id)}
            teamId={teamId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <ContentCard
            card={activeCard}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-gray-50">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-80 bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}