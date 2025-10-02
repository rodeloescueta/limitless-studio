import { eq, and, desc, asc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from './index'
import { users, teams, teamMembers, stages, contentCards, type User, type Team, type Stage, type ContentCard } from './schema'
import bcrypt from 'bcrypt'

// User utilities
export async function getUserById(userId: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return result[0]
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0]
}

export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  const isValidPassword = await bcrypt.compare(password, user.passwordHash)
  return isValidPassword ? user : null
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await db
    .update(users)
    .set({
      passwordHash: hashedPassword,
      isFirstLogin: false,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
}

// Team utilities
export async function getUserTeams(userId: string): Promise<Team[]> {
  const user = await getUserById(userId)
  if (!user) return []

  // Admin users can see all teams
  if (user.role === 'admin') {
    return await db.select().from(teams).orderBy(asc(teams.name))
  }

  // Regular users see only their teams
  const result = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      createdBy: teams.createdBy,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
    })
    .from(teams)
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .orderBy(asc(teams.name))

  return result
}

export async function verifyTeamAccess(userId: string, teamId: string): Promise<boolean> {
  const user = await getUserById(userId)
  if (!user) return false

  // Admin users have access to all teams
  if (user.role === 'admin') return true

  // Check team membership
  const membership = await db
    .select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.teamId, teamId)
    ))
    .limit(1)

  return membership.length > 0
}

export async function getTeam(teamId: string): Promise<Team | undefined> {
  const result = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
  return result[0]
}

// Stage utilities
export async function getTeamStages(teamId: string): Promise<Stage[]> {
  return await db
    .select()
    .from(stages)
    .where(eq(stages.teamId, teamId))
    .orderBy(asc(stages.position))
}

export async function createDefaultStages(teamId: string): Promise<Stage[]> {
  const defaultStages = [
    { name: 'Research', description: 'Capture ideas, market research, AI suggestions', position: 1, color: '#3b82f6' },
    { name: 'Envision', description: 'Script outlines, frameworks, content planning', position: 2, color: '#8b5cf6' },
    { name: 'Assemble', description: 'Production tasks, file attachments, editing', position: 3, color: '#f59e0b' },
    { name: 'Connect', description: 'Publishing approval, client review workflow', position: 4, color: '#10b981' },
    { name: 'Hone', description: 'Analytics input, performance insights', position: 5, color: '#ef4444' },
  ]

  const insertedStages = []
  for (const stage of defaultStages) {
    const result = await db
      .insert(stages)
      .values({
        teamId,
        name: stage.name,
        description: stage.description,
        position: stage.position,
        color: stage.color,
      })
      .returning()

    insertedStages.push(result[0])
  }

  return insertedStages
}

// Content card utilities
export async function getTeamCards(teamId: string): Promise<(ContentCard & {
  assignedTo: User | null
  createdBy: User
  stage: Stage
})[]> {
  // Create aliases for users table to avoid conflict
  const assignedUser = alias(users, 'assignedUser')
  const createdUser = alias(users, 'createdUser')

  const result = await db
    .select({
      // Card fields
      id: contentCards.id,
      teamId: contentCards.teamId,
      stageId: contentCards.stageId,
      title: contentCards.title,
      description: contentCards.description,
      content: contentCards.content,
      contentType: contentCards.contentType,
      priority: contentCards.priority,
      assignedToId: contentCards.assignedTo,
      createdById: contentCards.createdBy,
      dueDate: contentCards.dueDate,
      position: contentCards.position,
      tags: contentCards.tags,
      metadata: contentCards.metadata,
      createdAt: contentCards.createdAt,
      updatedAt: contentCards.updatedAt,
      // Related data
      assignedToUser: assignedUser,
      createdByUser: createdUser,
      stage: stages,
    })
    .from(contentCards)
    .leftJoin(assignedUser, eq(contentCards.assignedTo, assignedUser.id))
    .innerJoin(createdUser, eq(contentCards.createdBy, createdUser.id))
    .innerJoin(stages, eq(contentCards.stageId, stages.id))
    .where(eq(contentCards.teamId, teamId))
    .orderBy(asc(stages.position), asc(contentCards.position))

  return result.map(row => ({
    id: row.id,
    teamId: row.teamId,
    stageId: row.stageId,
    title: row.title,
    description: row.description,
    content: row.content,
    contentType: row.contentType,
    priority: row.priority,
    dueDate: row.dueDate,
    position: row.position,
    tags: row.tags,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignedTo: row.assignedToUser,
    createdBy: row.createdByUser,
    stage: row.stage,
    commentsCount: 0, // TODO: Implement comments
    attachmentsCount: 0, // TODO: Implement attachments
  }))
}

export async function getContentCard(cardId: string): Promise<(ContentCard & {
  assignedTo: User | null
  createdBy: User
  stage: Stage
}) | undefined> {
  // Create aliases for users table to avoid conflict
  const assignedUser = alias(users, 'assignedUser')
  const createdUser = alias(users, 'createdUser')

  const result = await db
    .select({
      // Card fields
      id: contentCards.id,
      teamId: contentCards.teamId,
      stageId: contentCards.stageId,
      title: contentCards.title,
      description: contentCards.description,
      content: contentCards.content,
      contentType: contentCards.contentType,
      priority: contentCards.priority,
      assignedTo: contentCards.assignedTo,
      createdBy: contentCards.createdBy,
      dueDate: contentCards.dueDate,
      position: contentCards.position,
      tags: contentCards.tags,
      metadata: contentCards.metadata,
      createdAt: contentCards.createdAt,
      updatedAt: contentCards.updatedAt,
      // Related data
      assignedToUser: assignedUser,
      createdByUser: createdUser,
      stage: stages,
    })
    .from(contentCards)
    .leftJoin(assignedUser, eq(contentCards.assignedTo, assignedUser.id))
    .innerJoin(createdUser, eq(contentCards.createdBy, createdUser.id))
    .innerJoin(stages, eq(contentCards.stageId, stages.id))
    .where(eq(contentCards.id, cardId))
    .limit(1)

  if (result.length === 0) return undefined

  const row = result[0]
  return {
    id: row.id,
    teamId: row.teamId,
    stageId: row.stageId,
    title: row.title,
    description: row.description,
    content: row.content,
    contentType: row.contentType,
    priority: row.priority,
    dueDate: row.dueDate,
    position: row.position,
    tags: row.tags,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignedTo: row.assignedToUser,
    createdBy: row.createdByUser,
    stage: row.stage,
    commentsCount: 0, // TODO: Implement comments
    attachmentsCount: 0, // TODO: Implement attachments
  }
}

export async function createContentCard(data: {
  teamId: string
  stageId: string
  title: string
  description?: string
  content?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  createdBy: string
  dueDate?: string
  tags?: string[]
}): Promise<ContentCard> {
  // Get the next position in the stage
  const lastCard = await db
    .select({ position: contentCards.position })
    .from(contentCards)
    .where(eq(contentCards.stageId, data.stageId))
    .orderBy(desc(contentCards.position))
    .limit(1)

  const position = (lastCard[0]?.position || 0) + 1

  const result = await db
    .insert(contentCards)
    .values({
      teamId: data.teamId,
      stageId: data.stageId,
      title: data.title,
      description: data.description,
      content: data.content,
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo,
      createdBy: data.createdBy,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      position,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
    })
    .returning()

  return result[0]
}

export async function updateContentCard(cardId: string, data: {
  title?: string
  description?: string
  content?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  dueDate?: string
  tags?: string[]
  stageId?: string
}): Promise<ContentCard & { assignedTo: User | null; createdBy: User; stage: Stage }> {
  const updateData: any = {
    updatedAt: new Date(),
  }

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.content !== undefined) updateData.content = data.content
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null
  if (data.stageId !== undefined) updateData.stageId = data.stageId

  await db
    .update(contentCards)
    .set(updateData)
    .where(eq(contentCards.id, cardId))

  // Fetch the updated card with all relationships
  const updatedCard = await getContentCard(cardId)
  if (!updatedCard) {
    throw new Error('Card not found after update')
  }

  return updatedCard
}

export async function moveContentCard(cardId: string, newStageId: string, newPosition: number): Promise<ContentCard> {
  const result = await db
    .update(contentCards)
    .set({
      stageId: newStageId,
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(contentCards.id, cardId))
    .returning()

  return result[0]
}

export async function deleteContentCard(cardId: string): Promise<void> {
  await db.delete(contentCards).where(eq(contentCards.id, cardId))
}