'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUploadAttachment } from '@/lib/hooks/useAttachments'

interface FileUploadZoneProps {
  cardId: string
  className?: string
}

const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function FileUploadZone({ cardId, className }: FileUploadZoneProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const uploadMutation = useUploadAttachment()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return // Error will be shown by dropzone
    }

    try {
      setUploadProgress(0)

      // Simulate upload progress (since we can't track real progress with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return 0
          if (prev >= 90) return prev
          
return prev + Math.random() * 20
        })
      }, 200)

      await uploadMutation.mutateAsync({ cardId, file })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(null), 1000)

    } catch (error) {
      setUploadProgress(null)
    }
  }, [cardId, uploadMutation])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: uploadMutation.isPending
  })

  const hasErrors = fileRejections.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-muted/50',
          isDragActive && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          hasErrors && 'border-destructive',
          uploadMutation.isPending && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-2">
          {uploadMutation.isPending ? (
            <div className="animate-pulse">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <FileIcon className="h-8 w-8 text-muted-foreground" />
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragActive
                ? 'Drop the file here'
                : uploadMutation.isPending
                ? 'Uploading...'
                : 'Drag & drop a file here, or click to select'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, Images, Word docs, Text files, CSV, Excel (max 10MB)
            </p>
          </div>

          {!uploadMutation.isPending && (
            <Button variant="outline" size="sm" className="mt-2">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error Messages */}
      {hasErrors && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {file.name}
                </p>
                {errors.map(error => (
                  <p key={error.code} className="text-xs text-destructive/80">
                    {error.code === 'file-too-large' && 'File is too large (max 10MB)'}
                    {error.code === 'file-invalid-type' && 'File type not supported'}
                    {error.code === 'too-many-files' && 'Only one file at a time'}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}