import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Attachment {
  id: string
  contentCardId: string
  filename: string
  originalFilename: string
  filePath: string
  fileSize: number
  mimeType: string
  fileHash: string | null
  createdAt: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface UploadAttachmentRequest {
  cardId: string
  file: File
}

interface DeleteAttachmentRequest {
  attachmentId: string
}

// Get attachments for a card
export function useCardAttachments(cardId: string) {
  return useQuery({
    queryKey: ['attachments', cardId],
    queryFn: async (): Promise<Attachment[]> => {
      if (!cardId) return []

      const response = await fetch(`/api/cards/${cardId}/attachments`)
      if (!response.ok) {
        throw new Error('Failed to fetch attachments')
      }
      
return response.json()
    },
    enabled: !!cardId,
  })
}

// Upload file attachment
export function useUploadAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, file }: UploadAttachmentRequest): Promise<Attachment> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate and refetch attachments for this card
      queryClient.invalidateQueries({
        queryKey: ['attachments', data.contentCardId]
      })

      toast.success('File uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload file')
    },
  })
}

// Delete attachment
export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ attachmentId }: DeleteAttachmentRequest): Promise<void> => {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete attachment')
      }
    },
    onSuccess: () => {
      // Invalidate all attachment queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: ['attachments']
      })

      toast.success('File deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete file')
    },
  })
}

// Get download URL for attachment
export function getAttachmentUrl(attachmentId: string): string {
  return `/api/attachments/${attachmentId}`
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to get file icon based on MIME type
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType === 'text/plain') return '📄'
  if (mimeType === 'text/csv') return '📊'
  
return '📎'
}

// Helper function to check if file is an image for preview
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}