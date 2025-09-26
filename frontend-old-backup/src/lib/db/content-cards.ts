import { db } from './index';
import { contentCards, stages, users, teams } from './schema';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import type { NewContentCard, ContentCard } from './schema';

/**
 * Content Card Management Utilities
 */

export interface CreateCardData {
  teamId: string;
  stageId?: string;
  title: string;
  description?: string;
  contentType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdBy: string;
  dueDate?: Date;
  metadata?: any;
}

export interface UpdateCardData {
  title?: string;
  description?: string;
  contentType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: Date;
  metadata?: any;
}

export interface MoveCardData {
  cardId: string;
  newStageId: string;
  newPosition: number;
}

/**
 * Create a new content card
 */
export async function createContentCard(cardData: CreateCardData): Promise<ContentCard> {
  // Get the next position in the stage (if stageId provided)
  let position = 0;
  if (cardData.stageId) {
    const lastCard = await db.query.contentCards.findFirst({
      where: eq(contentCards.stageId, cardData.stageId),
      orderBy: desc(contentCards.position),
    });
    position = (lastCard?.position || 0) + 1;
  }

  const [card] = await db.insert(contentCards).values({
    teamId: cardData.teamId,
    stageId: cardData.stageId,
    title: cardData.title,
    description: cardData.description,
    contentType: cardData.contentType,
    priority: cardData.priority || 'medium',
    assignedTo: cardData.assignedTo,
    createdBy: cardData.createdBy,
    dueDate: cardData.dueDate,
    position,
    metadata: cardData.metadata,
  }).returning();

  return card;
}

/**
 * Get content card by ID with full details
 */
export async function getContentCardById(cardId: string) {
  const card = await db.query.contentCards.findFirst({
    where: eq(contentCards.id, cardId),
    with: {
      team: true,
      stage: true,
      assignedUser: {
        columns: {
          passwordHash: false,
        },
      },
      createdByUser: {
        columns: {
          passwordHash: false,
        },
      },
    },
  });

  return card;
}

/**
 * Get all cards for a team organized by stage
 */
export async function getTeamCards(teamId: string) {
  const cards = await db.query.contentCards.findMany({
    where: eq(contentCards.teamId, teamId),
    with: {
      stage: true,
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [asc(contentCards.position)],
  });

  return cards;
}

/**
 * Get cards by stage with proper ordering
 */
export async function getCardsByStage(stageId: string) {
  return await db.query.contentCards.findMany({
    where: eq(contentCards.stageId, stageId),
    with: {
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: asc(contentCards.position),
  });
}

/**
 * Update content card
 */
export async function updateContentCard(
  cardId: string,
  updates: UpdateCardData
): Promise<ContentCard> {
  const [card] = await db
    .update(contentCards)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(contentCards.id, cardId))
    .returning();

  return card;
}

/**
 * Move card to new stage and position
 */
export async function moveCard({ cardId, newStageId, newPosition }: MoveCardData): Promise<ContentCard> {
  // Get the current card
  const card = await getContentCardById(cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  const oldStageId = card.stageId;
  const oldPosition = card.position || 0;

  // If moving to same stage, just reorder
  if (oldStageId === newStageId) {
    await reorderCardsInStage(newStageId, oldPosition, newPosition);
  } else {
    // Moving to different stage

    // Remove from old position (shift cards down)
    if (oldStageId) {
      await db
        .update(contentCards)
        .set({ position: eq => sql`${eq.position} - 1` })
        .where(
          and(
            eq(contentCards.stageId, oldStageId),
            gt(contentCards.position, oldPosition)
          )
        );
    }

    // Make room in new stage (shift cards up)
    await db
      .update(contentCards)
      .set({ position: eq => sql`${eq.position} + 1` })
      .where(
        and(
          eq(contentCards.stageId, newStageId),
          gte(contentCards.position, newPosition)
        )
      );
  }

  // Update the card
  const [updatedCard] = await db
    .update(contentCards)
    .set({
      stageId: newStageId,
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(contentCards.id, cardId))
    .returning();

  return updatedCard;
}

/**
 * Reorder cards within the same stage
 */
async function reorderCardsInStage(stageId: string, oldPosition: number, newPosition: number) {
  if (oldPosition === newPosition) return;

  if (oldPosition < newPosition) {
    // Moving down - shift cards between old and new position up
    await db
      .update(contentCards)
      .set({ position: eq => sql`${eq.position} - 1` })
      .where(
        and(
          eq(contentCards.stageId, stageId),
          gt(contentCards.position, oldPosition),
          lte(contentCards.position, newPosition)
        )
      );
  } else {
    // Moving up - shift cards between new and old position down
    await db
      .update(contentCards)
      .set({ position: eq => sql`${eq.position} + 1` })
      .where(
        and(
          eq(contentCards.stageId, stageId),
          gte(contentCards.position, newPosition),
          lt(contentCards.position, oldPosition)
        )
      );
  }
}

/**
 * Delete content card
 */
export async function deleteContentCard(cardId: string): Promise<void> {
  const card = await getContentCardById(cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  // Remove card
  await db.delete(contentCards).where(eq(contentCards.id, cardId));

  // Shift remaining cards in stage down
  if (card.stageId && card.position !== null) {
    await db
      .update(contentCards)
      .set({ position: eq => sql`${eq.position} - 1` })
      .where(
        and(
          eq(contentCards.stageId, card.stageId),
          gt(contentCards.position, card.position)
        )
      );
  }
}

/**
 * Get cards assigned to specific user
 */
export async function getUserAssignedCards(userId: string, options?: { teamId?: string }) {
  return await db.query.contentCards.findMany({
    where: and(
      eq(contentCards.assignedTo, userId),
      options?.teamId ? eq(contentCards.teamId, options.teamId) : undefined
    ),
    with: {
      team: true,
      stage: true,
      createdByUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: desc(contentCards.updatedAt),
  });
}

/**
 * Get cards created by specific user
 */
export async function getUserCreatedCards(userId: string, options?: { teamId?: string }) {
  return await db.query.contentCards.findMany({
    where: and(
      eq(contentCards.createdBy, userId),
      options?.teamId ? eq(contentCards.teamId, options.teamId) : undefined
    ),
    with: {
      team: true,
      stage: true,
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: desc(contentCards.updatedAt),
  });
}

/**
 * Get overdue cards
 */
export async function getOverdueCards(teamId?: string) {
  const now = new Date();

  return await db.query.contentCards.findMany({
    where: and(
      lt(contentCards.dueDate, now),
      teamId ? eq(contentCards.teamId, teamId) : undefined
    ),
    with: {
      team: true,
      stage: true,
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: asc(contentCards.dueDate),
  });
}

// Add missing imports and fix SQL usage
import { sql, gt, gte, lt, lte } from 'drizzle-orm';