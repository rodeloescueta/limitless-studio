import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ChecklistItem, CreateChecklistItemData } from '@/lib/api-client'

// Query keys
export const checklistKeys = {
  all: ['checklist'] as const,
  lists: () => [...checklistKeys.all, 'list'] as const,
  list: (cardId: string) => [...checklistKeys.lists(), cardId] as const,
}

// Get checklist items for a card
export function useCardChecklist(cardId: string) {
  return useQuery({
    queryKey: checklistKeys.list(cardId),
    queryFn: () => apiClient.cards.getChecklist(cardId),
    enabled: !!cardId,
  })
}

// Create custom checklist item
export function useCreateChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CreateChecklistItemData }) =>
      apiClient.cards.createChecklistItem(cardId, data),
    onSuccess: (newItem, { cardId }) => {
      // Add the new item to the list
      queryClient.setQueryData<ChecklistItem[]>(
        checklistKeys.list(cardId),
        (old) => old ? [...old, newItem] : [newItem]
      )

      // Invalidate the checklist to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: checklistKeys.list(cardId) })
    },
  })
}

// Toggle checklist item completion
export function useToggleChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, itemId, isCompleted }: { cardId: string; itemId: string; isCompleted: boolean }) =>
      apiClient.cards.toggleChecklistItem(cardId, itemId, isCompleted),
    onSuccess: (updatedItem, { cardId }) => {
      // Update the item in the list
      queryClient.setQueryData<ChecklistItem[]>(
        checklistKeys.list(cardId),
        (old) => {
          if (!old) return old
          
return old.map(item =>
            item.id === updatedItem.id ? updatedItem : item
          )
        }
      )
    },
  })
}

// Delete custom checklist item
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cardId, itemId }: { cardId: string; itemId: string }) =>
      apiClient.cards.deleteChecklistItem(cardId, itemId),
    onSuccess: (_, { cardId, itemId }) => {
      // Remove the item from the list
      queryClient.setQueryData<ChecklistItem[]>(
        checklistKeys.list(cardId),
        (old) => {
          if (!old) return old
          
return old.filter(item => item.id !== itemId)
        }
      )
    },
  })
}
