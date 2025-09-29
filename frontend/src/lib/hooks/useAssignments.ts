import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, CreateAssignmentData, UpdateAssignmentData } from '@/lib/api-client'

export function useCardAssignments(cardId: string) {
  return useQuery({
    queryKey: ['card-assignments', cardId],
    queryFn: () => apiClient.cards.getAssignments(cardId),
    enabled: !!cardId,
  })
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => apiClient.teams.getMembers(teamId),
    enabled: !!teamId,
  })
}

export function useAssignUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CreateAssignmentData }) =>
      apiClient.cards.createAssignment(cardId, data),
    onSuccess: (newAssignment, { cardId }) => {
      // Update assignments cache
      queryClient.invalidateQueries({ queryKey: ['card-assignments', cardId] })
      // Update card details cache to reflect new assignment
      queryClient.invalidateQueries({ queryKey: ['card-details', cardId] })
    },
  })
}

export function useUnassignUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) => apiClient.assignments.delete(assignmentId),
    onSuccess: (_, assignmentId) => {
      // Invalidate assignments cache for all cards since we don't have cardId
      queryClient.invalidateQueries({ queryKey: ['card-assignments'] })
      // Invalidate card details as well
      queryClient.invalidateQueries({ queryKey: ['card-details'] })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: UpdateAssignmentData }) =>
      apiClient.assignments.update(assignmentId, data),
    onSuccess: () => {
      // Invalidate assignments and card details cache
      queryClient.invalidateQueries({ queryKey: ['card-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['card-details'] })
    },
  })
}