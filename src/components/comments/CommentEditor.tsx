'use client'

import { useState, useRef, useEffect } from 'react'
import { useCreateComment } from '@/lib/hooks/useComments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MentionPicker } from './MentionPicker'
import { Loader2, Send } from 'lucide-react'

interface CommentEditorProps {
  cardId: string
  parentCommentId?: string
  initialContent?: string
  onSubmit?: (content: string) => Promise<void> | void
  onCancel?: () => void
  placeholder?: string
  submitLabel?: string
}

export function CommentEditor({
  cardId,
  parentCommentId,
  initialContent = '',
  onSubmit,
  onCancel,
  placeholder = 'Add a comment...',
  submitLabel = 'Comment'
}: CommentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentions, setMentions] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const createComment = useCreateComment()
  const isLoading = createComment.isPending

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent)
    }
  }, [initialContent])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const cursorPos = e.target.selectionStart

    setContent(newContent)
    setCursorPosition(cursorPos)

    // Check for @mention trigger
    const textBeforeCursor = newContent.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  const insertMention = (userId: string, userName: string) => {
    if (!textareaRef.current) return

    const textBeforeCursor = content.slice(0, cursorPosition)
    const textAfterCursor = content.slice(cursorPosition)

    // Find the @ symbol position
    const mentionStart = textBeforeCursor.lastIndexOf('@')
    const beforeMention = content.slice(0, mentionStart)
    const mentionText = `@${userName} `

    const newContent = beforeMention + mentionText + textAfterCursor
    const newCursorPos = mentionStart + mentionText.length

    setContent(newContent)
    setShowMentions(false)
    setMentionQuery('')

    // Add to mentions array if not already present
    if (!mentions.includes(userId)) {
      setMentions(prev => [...prev, userId])
    }

    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) return

    try {
      if (onSubmit) {
        await onSubmit(content.trim())
      } else {
        await createComment.mutateAsync({
          cardId,
          data: {
            content: content.trim(),
            mentions,
            parentCommentId,
          }
        })
      }

      // Reset form
      setContent('')
      setMentions([])
      setShowMentions(false)
      setMentionQuery('')
    } catch (error) {
      console.error('Failed to submit comment:', error)
    }
  }

  const handleCancel = () => {
    setContent(initialContent)
    setMentions([])
    setShowMentions(false)
    setMentionQuery('')
    onCancel?.()
  }

  const hasContent = content.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={isLoading}
        />

        {showMentions && (
          <MentionPicker
            query={mentionQuery}
            onSelect={insertMention}
            onClose={() => setShowMentions(false)}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {mentions.length > 0 && (
            <span>
              Mentioning {mentions.length} {mentions.length === 1 ? 'person' : 'people'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={!hasContent || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}