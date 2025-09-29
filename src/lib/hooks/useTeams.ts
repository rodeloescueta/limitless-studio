import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useUserTeams() {
  return useQuery({
    queryKey: ['user-teams'],
    queryFn: () => apiClient.users.getTeams(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => apiClient.teams.getById(teamId),
    enabled: !!teamId,
  })
}

export function useTeamStages(teamId: string) {
  return useQuery({
    queryKey: ['team-stages', teamId],
    queryFn: () => apiClient.teams.getStages(teamId),
    enabled: !!teamId,
  })
}