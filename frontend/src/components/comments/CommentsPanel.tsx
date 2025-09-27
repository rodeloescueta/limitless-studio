'use client'

import { useState } from 'react'
import { useCardComments } from '@/lib/hooks/useComments'
import { CommentEditor } from './CommentEditor'
import { CommentThread } from './CommentThread'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare } from 'lucide-react'

interface CommentsPanelProps {
  cardId: string
}

export function CommentsPanel({ cardId }: CommentsPanelProps) {
  const { data: comments = [], isLoading, error } = useCardComments(cardId)
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)

  if (isLoading) {
    return <CommentsLoading />
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p>Failed to load comments. Please try again.</p>
      </div>
    )
  }

  const rootComments = comments.filter(comment => !comment.parentCommentId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">Comments</h3>
        <span className="text-sm text-muted-foreground">
          {comments.length}
        </span>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {rootComments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={comments.filter(c => c.parentCommentId === comment.id)}
              cardId={cardId}
              onReply={(commentId) => setReplyToCommentId(commentId)}
              replyingTo={replyToCommentId}
              onCancelReply={() => setReplyToCommentId(null)}
            />
          ))
        )}
      </div>

      {/* Comment Editor */}
      <div className="border-t p-4">
        <CommentEditor
          cardId={cardId}
          parentCommentId={replyToCommentId}
          onCancel={replyToCommentId ? () => setReplyToCommentId(null) : undefined}
          placeholder={replyToCommentId ? "Write a reply..." : "Add a comment..."}
        />
      </div>
    </div>
  )
}

function CommentsLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-6" />
      </div>

      {/* Comments Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>

      {/* Editor Skeleton */}
      <div className="border-t p-4">
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}