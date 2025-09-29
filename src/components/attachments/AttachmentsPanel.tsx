'use client'

import { FileUploadZone } from './FileUploadZone'
import { AttachmentsList } from './AttachmentsList'
import { Separator } from '@/components/ui/separator'
import { Paperclip } from 'lucide-react'
import { useCardAttachments } from '@/lib/hooks/useAttachments'

interface AttachmentsPanelProps {
  cardId: string
}

export function AttachmentsPanel({ cardId }: AttachmentsPanelProps) {
  const { data: attachments } = useCardAttachments(cardId)
  const attachmentCount = attachments?.length || 0

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Paperclip className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Attachments</h3>
        {attachmentCount > 0 && (
          <span className="bg-muted text-muted-foreground text-sm px-2 py-1 rounded-full">
            {attachmentCount}
          </span>
        )}
      </div>

      {/* Upload Zone */}
      <FileUploadZone cardId={cardId} />

      {/* Separator */}
      {attachmentCount > 0 && <Separator />}

      {/* Attachments List */}
      <div className="flex-1 overflow-y-auto">
        <AttachmentsList cardId={cardId} />
      </div>
    </div>
  )
}