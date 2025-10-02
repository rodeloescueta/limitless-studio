import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  createTestCard,
} from '../../../helpers'
import { GET as getComments, POST as createComment } from '@/app/api/cards/[cardId]/comments/route'
import { PUT as updateComment, DELETE as deleteComment } from '@/app/api/comments/[commentId]/route'

// Mock NextAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth/next'

describe('Comments API - CRUD Operations', () => {
  beforeEach(async () => {
    await clearDatabase()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await closeDatabase()
  })

  describe('POST /api/cards/[cardId]/comments - Create Comment', () => {
    it('should create a comment on a card', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const request = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'This is a great idea!' }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(201)
      const comment = await response.json()
      expect(comment.content).toBe('This is a great idea!')
      expect(comment.user.id).toBe(user.id)
      expect(comment.user.firstName).toBe(user.firstName)
    })

    it('should create a comment with mentions', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const mentionedUser = await createTestUser({
        email: 'mentioned@test.com',
        role: 'editor'
      })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const request = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Hey @user, check this out!',
          mentions: [mentionedUser.id]
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(201)
      const comment = await response.json()
      expect(comment.content).toBe('Hey @user, check this out!')
      expect(JSON.parse(comment.mentions)).toContain(mentionedUser.id)
    })

    it('should create a reply to another comment (nested)', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // Create parent comment
      const parentRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Parent comment' }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const parentResponse = await createComment(parentRequest, context)
      const parentComment = await parentResponse.json()

      // Create reply
      const replyRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Reply to parent',
          parentCommentId: parentComment.id
        }),
      })
      const replyResponse = await createComment(replyRequest, context)

      expect(replyResponse.status).toBe(201)
      const reply = await replyResponse.json()
      expect(reply.content).toBe('Reply to parent')
      expect(reply.parentCommentId).toBe(parentComment.id)
    })

    it('should reject empty comment content', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const request = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toBe('Invalid input')
    })

    it('should require authentication', async () => {
      ;(getServerSession as any).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/cards/fake-id/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test' }),
      })
      const context = { params: Promise.resolve({ cardId: 'fake-id' }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/cards/[cardId]/comments - List Comments', () => {
    it('should list all comments for a card', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // Create multiple comments
      await createComment(
        new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'First comment' }),
        }),
        { params: Promise.resolve({ cardId: card.id }) }
      )
      await createComment(
        new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Second comment' }),
        }),
        { params: Promise.resolve({ cardId: card.id }) }
      )

      const request = new Request(`http://localhost:3000/api/cards/${card.id}/comments`)
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await getComments(request, context)

      expect(response.status).toBe(200)
      const comments = await response.json()
      expect(comments).toHaveLength(2)
      expect(comments[0].content).toBe('Second comment') // DESC order
      expect(comments[1].content).toBe('First comment')
    })

    it('should return empty array for card with no comments', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const request = new Request(`http://localhost:3000/api/cards/${card.id}/comments`)
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await getComments(request, context)

      expect(response.status).toBe(200)
      const comments = await response.json()
      expect(comments).toHaveLength(0)
    })

    it('should require authentication', async () => {
      ;(getServerSession as any).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/cards/fake-id/comments')
      const context = { params: Promise.resolve({ cardId: 'fake-id' }) }
      const response = await getComments(request, context)

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/comments/[commentId] - Update Comment', () => {
    it('should allow user to update their own comment', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const createRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Original content' }),
      })
      const createResponse = await createComment(createRequest, { params: Promise.resolve({ cardId: card.id }) })
      const comment = await createResponse.json()

      const updateRequest = new Request(`http://localhost:3000/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      })
      const updateResponse = await updateComment(updateRequest, { params: Promise.resolve({ commentId: comment.id }) })

      expect(updateResponse.status).toBe(200)
      const updated = await updateResponse.json()
      expect(updated.content).toBe('Updated content')
    })

    it('should prevent user from updating another user\'s comment', async () => {
      const user1 = await createTestUser({ role: 'scriptwriter' })
      const user2 = await createTestUser({
        email: 'user2@test.com',
        role: 'editor'
      })
      const team = await createTestTeam({ createdBy: user1.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user1.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user1.id, email: user1.email, role: user1.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const createRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'User 1 comment' }),
      })
      const createResponse = await createComment(createRequest, { params: Promise.resolve({ cardId: card.id }) })
      const comment = await createResponse.json()

      // Change to user2
      ;(getServerSession as any).mockResolvedValue({
        user: { id: user2.id, email: user2.email, role: user2.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const updateRequest = new Request(`http://localhost:3000/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'User 2 trying to edit' }),
      })
      const updateResponse = await updateComment(updateRequest, { params: Promise.resolve({ commentId: comment.id }) })

      expect(updateResponse.status).toBe(404) // Not found (for security)
    })

    it('should reject empty content', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const createRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Original' }),
      })
      const createResponse = await createComment(createRequest, { params: Promise.resolve({ cardId: card.id }) })
      const comment = await createResponse.json()

      const updateRequest = new Request(`http://localhost:3000/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      })
      const updateResponse = await updateComment(updateRequest, { params: Promise.resolve({ commentId: comment.id }) })

      expect(updateResponse.status).toBe(400)
    })
  })

  describe('DELETE /api/comments/[commentId] - Delete Comment', () => {
    it('should allow user to delete their own comment', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const createRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'To be deleted' }),
      })
      const createResponse = await createComment(createRequest, { params: Promise.resolve({ cardId: card.id }) })
      const comment = await createResponse.json()

      const deleteRequest = new Request(`http://localhost:3000/api/comments/${comment.id}`, {
        method: 'DELETE',
      })
      const deleteResponse = await deleteComment(deleteRequest, { params: Promise.resolve({ commentId: comment.id }) })

      expect(deleteResponse.status).toBe(200)
      const result = await deleteResponse.json()
      expect(result.success).toBe(true)
    })

    it('should allow admin to delete any comment', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const admin = await createTestUser({
        email: 'admin@test.com',
        role: 'admin'
      })
      const team = await createTestTeam({ createdBy: user.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const createRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'User comment' }),
      })
      const createResponse = await createComment(createRequest, { params: Promise.resolve({ cardId: card.id }) })
      const comment = await createResponse.json()

      // Change to admin
      ;(getServerSession as any).mockResolvedValue({
        user: { id: admin.id, email: admin.email, role: admin.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const deleteRequest = new Request(`http://localhost:3000/api/comments/${comment.id}`, {
        method: 'DELETE',
      })
      const deleteResponse = await deleteComment(deleteRequest, { params: Promise.resolve({ commentId: comment.id }) })

      expect(deleteResponse.status).toBe(200)
    })

    it('should prevent non-owner from deleting comment', async () => {
      const user1 = await createTestUser({ role: 'scriptwriter' })
      const user2 = await createTestUser({
        email: 'user2@test.com',
        role: 'editor'
      })
      const team = await createTestTeam({ createdBy: user1.id })
      const stages = await createStagesForTeam(team.id)
      const card = await createTestCard({
        teamId: team.id,
        stageId: stages.research.id,
        createdBy: user1.id,
      })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user1.id, email: user1.email, role: user1.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const createRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'User 1 comment' }),
      })
      const createResponse = await createComment(createRequest, { params: Promise.resolve({ cardId: card.id }) })
      const comment = await createResponse.json()

      // Change to user2
      ;(getServerSession as any).mockResolvedValue({
        user: { id: user2.id, email: user2.email, role: user2.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const deleteRequest = new Request(`http://localhost:3000/api/comments/${comment.id}`, {
        method: 'DELETE',
      })
      const deleteResponse = await deleteComment(deleteRequest, { params: Promise.resolve({ commentId: comment.id }) })

      expect(deleteResponse.status).toBe(403)
    })

    it('should return 404 for non-existent comment', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })

      ;(getServerSession as any).mockResolvedValue({
        user: { id: user.id, email: user.email, role: user.role },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const deleteRequest = new Request('http://localhost:3000/api/comments/00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
      })
      const deleteResponse = await deleteComment(deleteRequest, { params: Promise.resolve({ commentId: '00000000-0000-0000-0000-000000000000' }) })

      expect(deleteResponse.status).toBe(404)
    })
  })
})
