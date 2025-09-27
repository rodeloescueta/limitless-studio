import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, CreateCardData, UpdateCardData } from '@/lib/api-client'

export function useTeamCards(teamId: string) {
  return useQuery({
    queryKey: ['team-cards', teamId],
    queryFn: () => apiClient.teams.getCards(teamId),
    enabled: !!teamId,
  })
}

export function useCardDetails(cardId: string) {
  return useQuery({
    queryKey: ['card-details', cardId],
    queryFn: () => apiClient.cards.getById(cardId),
    enabled: !!cardId,
  })
}

export function useCreateCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: CreateCardData }) =>
      apiClient.teams.createCard(teamId, data),
    onSuccess: (newCard) => {
      // Invalidate team cards to refresh the board
      queryClient.invalidateQueries({ queryKey: ['team-cards', newCard.teamId] })
    },
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: UpdateCardData }) =>
      apiClient.cards.update(cardId, data),
    onSuccess: (updatedCard) => {
      // Update the card details cache
      queryClient.setQueryData(['card-details', updatedCard.id], updatedCard)
      // Invalidate team cards to refresh the board
      queryClient.invalidateQueries({ queryKey: ['team-cards', updatedCard.teamId] })
    },
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cardId: string) => apiClient.cards.delete(cardId),
    onSuccess: (_, cardId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['card-details', cardId] })
      // Invalidate all team cards to refresh boards
      queryClient.invalidateQueries({ queryKey: ['team-cards'] })
    },
  })
}

export function useCardMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, stageId, position }: { cardId: string; stageId: string; position: number }) =>
      apiClient.cards.move(cardId, stageId, position),
    onSuccess: (movedCard) => {
      // Update the card details cache
      queryClient.setQueryData(['card-details', movedCard.id], movedCard)
      // Invalidate team cards to refresh the board
      queryClient.invalidateQueries({ queryKey: ['team-cards', movedCard.teamId] })
    },
  })
}