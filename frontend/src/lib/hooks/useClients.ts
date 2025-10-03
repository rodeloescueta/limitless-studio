import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: () => [...clientKeys.lists()] as const,
}

// Get all clients
export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: () => apiClient.teams.getClients(),
  })
}
