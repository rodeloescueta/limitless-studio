'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUpdateComment, useDeleteComment } from '@/lib/hooks/useComments'
import { CommentEditor } from './CommentEditor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Reply, Edit, Trash2 } from 'lucide-react'
import type { Comment } from '@/lib/api-client'

interface CommentThreadProps {
  comment: Comment
  replies: Comment[]
  cardId: string
  onReply: (commentId: string) => void
  replyingTo: string | null
  onCancelReply: () => void
}

export function CommentThread({
  comment,
  replies,
  cardId,
  onReply,
  replyingTo,
  onCancelReply
}: CommentThreadProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()

  const isOwner = session?.user?.id === comment.user.id
  const isAdmin = session?.user?.role === 'admin'
  const canDelete = isOwner || isAdmin
  const canEdit = isOwner

  const handleEdit = async (content: string) => {
    try {
      await updateComment.mutateAsync({
        commentId: comment.id,
        data: { content }
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment.mutateAsync(comment.id)
      } catch (error) {
        console.error('Failed to delete comment:', error)
      }
    }
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="group">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.avatar} />
            <AvatarFallback className="text-xs">
              {getUserInitials(comment.user.firstName, comment.user.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.user.firstName} {comment.user.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.updatedAt !== comment.createdAt && ' (edited)'}
              </span>
            </div>

            {isEditing ? (
              <CommentEditor
                cardId={cardId}
                initialContent={comment.content}
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                placeholder="Edit your comment..."
                submitLabel="Save"
              />
            ) : (
              <div className="text-sm">
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  className="h-7 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>

                {(canEdit || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Editor */}
        {replyingTo === comment.id && (
          <div className="ml-11 mt-3">
            <CommentEditor
              cardId={cardId}
              parentCommentId={comment.id}
              onCancel={onCancelReply}
              placeholder="Write a reply..."
              onSubmit={() => onCancelReply()}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11 space-y-3">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              replies={[]} // Nested replies not supported for now
              cardId={cardId}
              onReply={onReply}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}