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
  role: 'admin' | 'member' | 'client'
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

export { ApiError }