'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateCardModal } from './CreateCardModal'

interface CreateCardButtonProps {
  stageId: string
  teamId: string
}

export function CreateCardButton({ stageId, teamId }: CreateCardButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2 text-gray-600 border-dashed border-gray-300 hover:border-gray-400"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add card
      </Button>

      <CreateCardModal
        stageId={stageId}
        teamId={teamId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}