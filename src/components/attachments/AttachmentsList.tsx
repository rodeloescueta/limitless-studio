'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Download,
  Eye,
  Trash2,
  MoreVertical,
  FileIcon,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import {
  useCardAttachments,
  useDeleteAttachment,
  getAttachmentUrl,
  formatFileSize,
  getFileIcon,
  isImageFile
} from '@/lib/hooks/useAttachments'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'

interface AttachmentsListProps {
  cardId: string
}

export function AttachmentsList({ cardId }: AttachmentsListProps) {
  const { data: session } = useSession()
  const { data: attachments, isLoading, error } = useCardAttachments(cardId)
  const deleteAttachment = useDeleteAttachment()
  const [previewAttachment, setPreviewAttachment] = useState<any>(null)

  const handleDownload = (attachmentId: string, filename: string) => {
    const url = getAttachmentUrl(attachmentId)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreview = (attachment: any) => {
    if (isImageFile(attachment.mimeType)) {
      setPreviewAttachment(attachment)
    } else {
      // For non-images, open in new tab
      window.open(getAttachmentUrl(attachment.id), '_blank')
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return
    await deleteAttachment.mutateAsync({ attachmentId })
  }

  const canDelete = (attachment: any) => {
    return session?.user?.role === 'admin' || attachment.uploadedBy.id === session?.user?.id
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <p className="text-sm text-destructive">Failed to load attachments</p>
      </div>
    )
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No attachments yet</p>
        <p className="text-xs">Upload files to share with your team</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            {/* File Icon */}
            <div className="flex-shrink-0">
              {isImageFile(attachment.mimeType) ? (
                <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>
              ) : (
                <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-lg">{getFileIcon(attachment.mimeType)}</span>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium truncate">
                  {attachment.originalFilename}
                </p>
                <Badge variant="outline" className="text-xs">
                  {formatFileSize(attachment.fileSize)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={attachment.uploadedBy.avatar || undefined} />
                  <AvatarFallback>
                    {attachment.uploadedBy.firstName[0]}{attachment.uploadedBy.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}
                </span>
                <span>•</span>
                <span>{format(new Date(attachment.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(attachment)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment.id, attachment.originalFilename)}
              >
                <Download className="h-4 w-4" />
              </Button>

              {canDelete(attachment) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deleteAttachment.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewAttachment && (
        <Dialog open={true} onOpenChange={() => setPreviewAttachment(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewAttachment.originalFilename}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={getAttachmentUrl(previewAttachment.id)}
                alt={previewAttachment.originalFilename}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}