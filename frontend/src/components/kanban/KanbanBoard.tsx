'use client'

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, pointerWithin, rectIntersection, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTeamCards } from '@/lib/hooks/useCards'
import { useTeamStages } from '@/lib/hooks/useTeams'
import { useCardMovement } from '@/lib/hooks/useCards'
import { KanbanColumn } from './KanbanColumn'
import { ContentCard } from './ContentCard'
import { Skeleton } from '@/components/ui/skeleton'
import { hasStageAccess, normalizeStage, filterCardsByPermissions, type UserRole, type StageName } from '@/lib/permissions'
import type { ContentCard as ContentCardType } from '@/lib/api-client'

interface KanbanBoardProps {
  teamId: string
}

export function KanbanBoard({ teamId }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<ContentCardType | null>(null)
  const { data: session } = useSession()

  const { data: cards = [], isLoading: cardsLoading } = useTeamCards(teamId)
  const { data: stages = [], isLoading: stagesLoading } = useTeamStages(teamId)
  const moveCard = useCardMovement()

  // Get user role for permission checking
  const userRole = (session?.user?.role as UserRole) || 'member'

  // Filter stages based on user permissions
  const accessibleStages = stages.filter(stage => {
    const stageName = normalizeStage(stage.name)
    return stageName && hasStageAccess(userRole, stageName, 'read')
  })

  // Filter cards based on user permissions
  const accessibleCards = filterCardsByPermissions(cards, userRole)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Custom collision detection that prioritizes stage containers over cards
  const customCollisionDetection = (args: any) => {
    console.log('Custom collision detection called')

    // First, check for collisions with stage containers (droppable areas)
    const stageCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container: any) => container.data.current?.type === 'stage'
      ),
    })

    console.log('Stage collisions:', stageCollisions)

    if (stageCollisions.length > 0) {
      return stageCollisions
    }

    // If no stage collisions, check for card collisions within the same stage
    const cardCollisions = closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container: any) => container.data.current?.type === 'card'
      ),
    })

    console.log('Card collisions:', cardCollisions)
    return cardCollisions
  }

  const handleDragStart = (event: DragStartEvent) => {
    const card = accessibleCards.find(c => c.id === event.active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    console.log('Drag end:', {
      activeId: active.id,
      overId: over?.id,
      overData: over?.data?.current
    })

    if (!over) {
      console.log('Drag cancelled: no target')
      return
    }

    const sourceCard = accessibleCards.find(c => c.id === active.id)
    if (!sourceCard) {
      console.log('Source card not found')
      return
    }

    // Get the target stage ID and position
    let targetStageId: string
    let targetPosition: number

    if (over.data.current?.type === 'stage') {
      // Dropped directly on a stage (empty area)
      targetStageId = over.id as string
      targetPosition = 1
      console.log('Dropped on stage:', targetStageId)
    } else if (over.data.current?.type === 'card') {
      // Dropped on another card
      const targetCard = accessibleCards.find(c => c.id === over.id)
      if (targetCard) {
        targetStageId = targetCard.stageId
        targetPosition = targetCard.position
        console.log('Dropped on card:', over.id, 'in stage:', targetStageId)
      } else {
        console.log('Target card not found')
        return
      }
    } else {
      // Try to find stage from DOM hierarchy
      console.log('Fallback: trying to detect stage from over element')
      const stageId = over.id as string
      const stage = accessibleStages.find(s => s.id === stageId)
      if (stage) {
        targetStageId = stageId
        targetPosition = accessibleCards.filter(c => c.stageId === stageId).length + 1
      } else {
        console.log('Could not determine target stage')
        return
      }
    }

    // Don't move if it's the same position
    if (sourceCard.stageId === targetStageId && sourceCard.position === targetPosition) {
      console.log('Same position, no move needed')
      return
    }

    console.log('Moving card:', {
      cardId: sourceCard.id,
      from: { stageId: sourceCard.stageId, position: sourceCard.position },
      to: { stageId: targetStageId, position: targetPosition }
    })

    try {
      await moveCard.mutateAsync({
        cardId: sourceCard.id,
        stageId: targetStageId,
        position: targetPosition,
      })
      console.log('Card moved successfully')
    } catch (error) {
      console.error('Failed to move card:', error)
    }
  }

  if (stagesLoading || cardsLoading) {
    return <KanbanBoardSkeleton />
  }

  if (accessibleStages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">No accessible stages</h3>
          <p className="text-gray-600">You don't have permission to view any workflow stages yet.</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={customCollisionDetection}
    >
      <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-background">
        {accessibleStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            cards={accessibleCards.filter(card => card.stageId === stage.id)}
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
    <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-background">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-80 bg-card rounded-lg shadow-sm border">
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