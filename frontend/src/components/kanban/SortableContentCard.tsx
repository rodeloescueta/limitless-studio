'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSession } from 'next-auth/react'
import { ContentCard } from './ContentCard'
import { CardDetailsModal } from './CardDetailsModal'
import { canDragCard, normalizeStage, type UserRole } from '@/lib/permissions'
import type { ContentCard as ContentCardType } from '@/lib/api-client'

interface SortableContentCardProps {
  card: ContentCardType
}

export function SortableContentCard({ card }: SortableContentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: session } = useSession()

  // Check if user can drag this card based on stage permissions
  const userRole = (session?.user?.role as UserRole) || 'member'
  const stageName = normalizeStage(card.stage.name)
  const isDraggable = stageName ? canDragCard(userRole, stageName) : false

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
    disabled: !isDraggable,  // Disable drag if user doesn't have permission
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes}>
        <ContentCard
          card={card}
          dragHandleProps={isDraggable ? listeners : undefined}  // Only allow dragging if permitted
          isDragging={isDragging}
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <CardDetailsModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}