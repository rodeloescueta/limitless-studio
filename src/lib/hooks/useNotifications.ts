import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unread?: boolean
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: ['user-notifications', userId, options?.limit, options?.offset, options?.unread],
    queryFn: () => apiClient.notifications.getUserNotifications(userId, {
      limit: options?.limit,
      offset: options?.offset,
      unread: options?.unread,
    }),
    enabled: options?.enabled !== false && !!userId,
    refetchInterval: options?.refetchInterval || 30000, // Refetch every 30 seconds for real-time updates
  })
}

export function useUnreadNotifications(userId: string) {
  return useQuery({
    queryKey: ['unread-notifications', userId],
    queryFn: () => apiClient.notifications.getUserNotifications(userId, { unread: true }),
    enabled: !!userId,
    refetchInterval: 15000, // Check for new notifications every 15 seconds
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => apiClient.notifications.markAsRead(notificationId),
    onSuccess: (updatedNotification, notificationId) => {
      // Update the notification in all relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => apiClient.notifications.markAllAsRead(userId),
    onSuccess: (_, userId) => {
      // Invalidate all notification queries for this user
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications', userId] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => apiClient.notifications.delete(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] })
    },
  })
}