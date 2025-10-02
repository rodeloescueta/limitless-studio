import { testDb } from './db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a test content card
 */
export async function createTestCard(data: {
  title?: string;
  description?: string;
  stageId: string;
  teamId: string;
  createdBy: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in_progress' | 'review' | 'done';
}) {
  const {
    title = `Test Card ${Date.now()}`,
    description = 'Test card description',
    stageId,
    teamId,
    createdBy,
    assignedTo,
    priority = 'medium',
    status = 'todo',
  } = data;

  const [card] = await testDb
    .insert(schema.contentCards)
    .values({
      title,
      description,
      stageId,
      teamId,
      createdBy,
      assignedTo,
      priority,
      status,
    })
    .returning();

  return card;
}

/**
 * Create a subtask for a content card
 */
export async function createTestSubtask(data: {
  cardId: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  completed?: boolean;
}) {
  const {
    cardId,
    title = `Test Subtask ${Date.now()}`,
    description = 'Test subtask description',
    assignedTo,
    completed = false,
  } = data;

  const [subtask] = await testDb
    .insert(schema.subtasks)
    .values({
      cardId,
      title,
      description,
      assignedTo,
      completed,
    })
    .returning();

  return subtask;
}

/**
 * Create a comment on a content card
 */
export async function createTestComment(data: {
  cardId: string;
  userId: string;
  content?: string;
  mentions?: string[];
}) {
  const {
    cardId,
    userId,
    content = 'Test comment',
    mentions = [],
  } = data;

  const [comment] = await testDb
    .insert(schema.comments)
    .values({
      cardId,
      userId,
      content,
      mentions,
    })
    .returning();

  return comment;
}

/**
 * Create an attachment for a content card
 */
export async function createTestAttachment(data: {
  cardId: string;
  uploadedBy: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
}) {
  const {
    cardId,
    uploadedBy,
    fileName = 'test-file.pdf',
    fileUrl = 'https://example.com/files/test-file.pdf',
    fileSize = 1024,
    fileType = 'application/pdf',
  } = data;

  const [attachment] = await testDb
    .insert(schema.attachments)
    .values({
      cardId,
      uploadedBy,
      fileName,
      fileUrl,
      fileSize,
      fileType,
    })
    .returning();

  return attachment;
}

/**
 * Get card by ID with relations
 */
export async function getCardById(cardId: string) {
  const [card] = await testDb
    .select()
    .from(schema.contentCards)
    .where(eq(schema.contentCards.id, cardId))
    .limit(1);

  return card;
}

/**
 * Get all cards in a stage
 */
export async function getCardsByStage(stageId: string) {
  const cards = await testDb
    .select()
    .from(schema.contentCards)
    .where(eq(schema.contentCards.stageId, stageId));

  return cards;
}

/**
 * Get all subtasks for a card
 */
export async function getSubtasksByCard(cardId: string) {
  const subtasks = await testDb
    .select()
    .from(schema.subtasks)
    .where(eq(schema.subtasks.cardId, cardId));

  return subtasks;
}

/**
 * Get all comments for a card
 */
export async function getCommentsByCard(cardId: string) {
  const comments = await testDb
    .select()
    .from(schema.comments)
    .where(eq(schema.comments.cardId, cardId));

  return comments;
}
