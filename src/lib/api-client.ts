class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestConfig extends RequestInit {
  requireAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requireAuth = true, ...requestConfig } = config

    const url = `${this.baseUrl}/api${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestConfig.headers,
    }

    // Authentication is handled by NextAuth.js session cookies
    // No need to manually add auth headers for same-origin requests

    const response = await fetch(url, {
      ...requestConfig,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      let errorData = null

      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      throw new ApiError(response.status, errorMessage, errorData)
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T
    }

    return response.json()
  }

  // Teams API
  teams = {
    list: () => this.request<Team[]>('/teams'),

    getById: (teamId: string) =>
      this.request<Team>(`/teams/${teamId}`),

    getStages: (teamId: string) =>
      this.request<Stage[]>(`/teams/${teamId}/stages`),

    getCards: (teamId: string) =>
      this.request<ContentCard[]>(`/teams/${teamId}/cards`),

    createCard: (teamId: string, data: CreateCardData) =>
      this.request<ContentCard>(`/teams/${teamId}/cards`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMembers: (teamId: string) =>
      this.request<TeamMember[]>(`/teams/${teamId}/members`),
  }

  // Cards API
  cards = {
    getById: (cardId: string) =>
      this.request<ContentCard>(`/cards/${cardId}`),

    update: (cardId: string, data: UpdateCardData) =>
      this.request<ContentCard>(`/cards/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (cardId: string) =>
      this.request<void>(`/cards/${cardId}`, {
        method: 'DELETE',
      }),

    move: (cardId: string, stageId: string, position: number) =>
      this.request<ContentCard>(`/cards/${cardId}/move`, {
        method: 'PUT',
        body: JSON.stringify({ stageId, position }),
      }),

    // Comments
    getComments: (cardId: string) =>
      this.request<Comment[]>(`/cards/${cardId}/comments`),

    createComment: (cardId: string, data: CreateCommentData) =>
      this.request<Comment>(`/cards/${cardId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Assignments
    getAssignments: (cardId: string) =>
      this.request<Assignment[]>(`/cards/${cardId}/assignments`),

    createAssignment: (cardId: string, data: CreateAssignmentData) =>
      this.request<Assignment>(`/cards/${cardId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  }

  // Comments API
  comments = {
    update: (commentId: string, data: UpdateCommentData) =>
      this.request<Comment>(`/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (commentId: string) =>
      this.request<void>(`/comments/${commentId}`, {
        method: 'DELETE',
      }),
  }

  // Assignments API
  assignments = {
    delete: (assignmentId: string) =>
      this.request<void>(`/assignments/${assignmentId}`, {
        method: 'DELETE',
      }),

    update: (assignmentId: string, data: UpdateAssignmentData) =>
      this.request<Assignment>(`/assignments/${assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  }

  // Notifications API
  notifications = {
    getUserNotifications: (userId: string, params?: { limit?: number; offset?: number; unread?: boolean }) => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.offset) searchParams.set('offset', params.offset.toString())
      if (params?.unread) searchParams.set('unread', params.unread.toString())

      const queryString = searchParams.toString()
      const endpoint = `/users/${userId}/notifications${queryString ? `?${queryString}` : ''}`

      return this.request<NotificationResponse>(endpoint)
    },

    markAsRead: (notificationId: string) =>
      this.request<Notification>(`/notifications/${notificationId}`, {
        method: 'PUT',
      }),

    markAllAsRead: (userId: string) =>
      this.request<{ success: boolean }>(`/users/${userId}/notifications`, {
        method: 'PUT',
      }),

    delete: (notificationId: string) =>
      this.request<{ success: boolean }>(`/notifications/${notificationId}`, {
        method: 'DELETE',
      }),
  }

  // Users API
  users = {
    me: () => this.request<User>('/users/me'),

    getTeams: () => this.request<Team[]>('/users/me/teams'),
  }
}

export const apiClient = new ApiClient()

// Types
export interface Team {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Stage {
  id: string
  name: string
  description?: string
  position: number
  color?: string
  teamId: string
}

export interface ContentCard {
  id: string
  title: string
  description?: string
  content?: string
  stageId: string
  teamId: string
  assignedTo?: User
  createdBy: User
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  tags?: string[]
  position: number
  commentsCount: number
  attachmentsCount: number
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'member' | 'client' | 'strategist' | 'scriptwriter' | 'editor' | 'coordinator'
  avatar?: string
}

export interface CreateCardData {
  title: string
  description?: string
  content?: string
  stageId: string
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  tags?: string[]
}

export interface UpdateCardData extends Partial<CreateCardData> {
  title?: string
}

export interface Comment {
  id: string
  content: string
  mentions?: string[]
  parentCommentId?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string
  }
}

export interface CreateCommentData {
  content: string
  mentions?: string[]
  parentCommentId?: string
}

export interface UpdateCommentData {
  content: string
}

export interface CommentMention {
  id: string
  isRead: boolean
  createdAt: string
  comment: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  card: {
    id: string
    title: string
  }
}

export interface Assignment {
  id: string
  role: 'primary' | 'reviewer' | 'approver' | 'collaborator'
  assignedAt: string
  dueDate?: string
  completedAt?: string
  notes?: string
  assignedTo: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    avatar?: string
  }
  assignedBy?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export interface CreateAssignmentData {
  assignedTo: string
  role?: 'primary' | 'reviewer' | 'approver' | 'collaborator'
  dueDate?: string
  notes?: string
}

export interface UpdateAssignmentData {
  completed?: boolean
  notes?: string
}

export interface TeamMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'member' | 'client' | 'strategist' | 'scriptwriter' | 'editor' | 'coordinator'
  avatar?: string
  joinedAt: string
}

export interface Notification {
  id: string
  type: 'assignment' | 'mention' | 'deadline' | 'approval'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedCard?: {
    id: string
    title: string
  }
  relatedComment?: {
    id: string
    content: string
  }
}

export interface NotificationResponse {
  notifications: Notification[]
  unreadCount: number
  hasMore: boolean
}

export { ApiError }