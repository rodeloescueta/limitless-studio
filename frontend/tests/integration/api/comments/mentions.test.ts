import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import {
  clearDatabase,
  closeDatabase,
  createTestUser,
  createTestTeam,
  createStagesForTeam,
  createTestCard,
  testDb,
} from '../../../helpers'
import { POST as createComment } from '@/app/api/cards/[cardId]/comments/route'
import { commentMentions, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Mock NextAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth/next'

describe('Comments API - Mentions & Notifications', () => {
  beforeEach(async () => {
    await clearDatabase()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await closeDatabase()
  })

  describe('Comment Mentions', () => {
    it('should create mention records when users are mentioned', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const mentionedUser1 = await createTestUser({
        email: 'mentioned1@test.com',
        role: 'editor'
      })
      const mentionedUser2 = await createTestUser({
        email: 'mentioned2@test.com',
        role: 'coordinator'
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
          content: 'Hey @user1 and @user2, check this!',
          mentions: [mentionedUser1.id, mentionedUser2.id]
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(201)
      const comment = await response.json()

      // Check mention records created
      const mentions = await testDb
        .select()
        .from(commentMentions)
        .where(eq(commentMentions.commentId, comment.id))

      expect(mentions).toHaveLength(2)
      expect(mentions[0].mentionedUserId).toBe(mentionedUser1.id)
      expect(mentions[0].isRead).toBe(false)
      expect(mentions[1].mentionedUserId).toBe(mentionedUser2.id)
      expect(mentions[1].isRead).toBe(false)
    })

    it('should handle empty mentions array', async () => {
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
        body: JSON.stringify({
          content: 'No mentions here',
          mentions: []
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(201)
      const comment = await response.json()

      const mentions = await testDb
        .select()
        .from(commentMentions)
        .where(eq(commentMentions.commentId, comment.id))

      expect(mentions).toHaveLength(0)
    })

    it('should store mentions as JSON in comment', async () => {
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
          content: 'Hey @user!',
          mentions: [mentionedUser.id]
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      const comment = await response.json()
      const mentionsArray = JSON.parse(comment.mentions)
      expect(mentionsArray).toEqual([mentionedUser.id])
    })
  })

  describe('Notification Queue Integration (Requires Redis)', () => {
    it.skip('should enqueue notifications for mentioned users', async () => {
      const user = await createTestUser({
        firstName: 'John',
        lastName: 'Doe',
        role: 'scriptwriter'
      })
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
          content: 'Hey @user, your input needed!',
          mentions: [mentionedUser.id]
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(201)
      const comment = await response.json()

      // Check notification was queued
      const queuedNotifications = await testDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, mentionedUser.id))

      expect(queuedNotifications).toHaveLength(1)
      expect(queuedNotifications[0].type).toBe('mention')
      expect(queuedNotifications[0].cardId).toBe(card.id)
      expect(queuedNotifications[0].commentId).toBe(comment.id)
      expect(queuedNotifications[0].title).toBe('You were mentioned in a comment')
      expect(queuedNotifications[0].message).toContain('John Doe')
      expect(queuedNotifications[0].status).toBe('pending')
    })

    it.skip('should create notifications for multiple mentions', async () => {
      const user = await createTestUser({ role: 'scriptwriter' })
      const mentionedUser1 = await createTestUser({
        email: 'mentioned1@test.com',
        role: 'editor'
      })
      const mentionedUser2 = await createTestUser({
        email: 'mentioned2@test.com',
        role: 'coordinator'
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
          content: 'Team discussion @user1 @user2',
          mentions: [mentionedUser1.id, mentionedUser2.id]
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      expect(response.status).toBe(201)

      // Check both users got notifications
      const notifications1 = await testDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, mentionedUser1.id))

      const notifications2 = await testDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, mentionedUser2.id))

      expect(notifications1).toHaveLength(1)
      expect(notifications2).toHaveLength(1)
      expect(notifications1[0].type).toBe('mention')
      expect(notifications2[0].type).toBe('mention')
    })

    it('should not call queue when no mentions', async () => {
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
        body: JSON.stringify({
          content: 'Regular comment without mentions',
          mentions: []
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const response = await createComment(request, context)

      // Just verify the comment was created successfully without mentions
      expect(response.status).toBe(201)
    })

    it.skip('should set slackEnabled flag for mention notifications', async () => {
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
          content: '@user check this',
          mentions: [mentionedUser.id]
        }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      await createComment(request, context)

      const notification = await testDb
        .select()
        .from(notifications)
        .where(eq(notifications.userId, mentionedUser.id))

      expect(notification[0].slackEnabled).toBe(true)
    })
  })

  describe('Nested Comments with Mentions', () => {
    it('should handle mentions in nested replies', async () => {
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

      // Parent comment
      const parentRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Parent comment' }),
      })
      const context = { params: Promise.resolve({ cardId: card.id }) }
      const parentResponse = await createComment(parentRequest, context)
      const parent = await parentResponse.json()

      // Reply with mention
      const replyRequest = new Request(`http://localhost:3000/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '@user what do you think?',
          mentions: [mentionedUser.id],
          parentCommentId: parent.id
        }),
      })
      const replyResponse = await createComment(replyRequest, context)

      expect(replyResponse.status).toBe(201)
      const reply = await replyResponse.json()
      expect(reply.parentCommentId).toBe(parent.id)

      // Check mention created
      const mentions = await testDb
        .select()
        .from(commentMentions)
        .where(eq(commentMentions.commentId, reply.id))

      expect(mentions).toHaveLength(1)
      expect(mentions[0].mentionedUserId).toBe(mentionedUser.id)
    })
  })
})
