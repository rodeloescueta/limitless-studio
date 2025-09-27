'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ContentCard } from './ContentCard'
import { CardDetailsModal } from './CardDetailsModal'
import type { ContentCard as ContentCardType } from '@/lib/api-client'

interface SortableContentCardProps {
  card: ContentCardType
}

export function SortableContentCard({ card }: SortableContentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
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
          dragHandleProps={listeners}
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