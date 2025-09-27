import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Comment, CreateCommentData, UpdateCommentData } from '@/lib/api-client'

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (cardId: string) => [...commentKeys.lists(), cardId] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
}

// Get comments for a card
export function useCardComments(cardId: string) {
  return useQuery({
    queryKey: commentKeys.list(cardId),
    queryFn: () => apiClient.cards.getComments(cardId),
    enabled: !!cardId,
  })
}

// Create comment
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CreateCommentData }) =>
      apiClient.cards.createComment(cardId, data),
    onSuccess: (newComment, { cardId }) => {
      // Add the new comment to the list
      queryClient.setQueryData<Comment[]>(
        commentKeys.list(cardId),
        (old) => old ? [newComment, ...old] : [newComment]
      )

      // Invalidate the comments list to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: commentKeys.list(cardId) })
    },
  })
}

// Update comment
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentData }) =>
      apiClient.comments.update(commentId, data),
    onSuccess: (updatedComment) => {
      // Update the comment in all relevant queries
      queryClient.setQueriesData<Comment[]>(
        { queryKey: commentKeys.lists() },
        (old) => {
          if (!old) return old
          return old.map(comment =>
            comment.id === updatedComment.id ? updatedComment : comment
          )
        }
      )
    },
  })
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => apiClient.comments.delete(commentId),
    onSuccess: (_, commentId) => {
      // Remove the comment from all relevant queries
      queryClient.setQueriesData<Comment[]>(
        { queryKey: commentKeys.lists() },
        (old) => {
          if (!old) return old
          return old.filter(comment => comment.id !== commentId)
        }
      )
    },
  })
}