import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'client'])
export const contentPriorityEnum = pgEnum('content_priority', ['low', 'medium', 'high', 'urgent'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('member'),
  isFirstLogin: boolean('is_first_login').default(true),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}))

// Teams table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Team members junction table
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  teamUserIdx: index('team_members_team_user_idx').on(table.teamId, table.userId),
  uniqueTeamUser: unique('unique_team_user').on(table.teamId, table.userId),
}))

// Stages table (REACH workflow)
export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  position: integer('position').notNull(),
  color: varchar('color', { length: 7 }), // Hex color
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  teamPositionIdx: index('stages_team_position_idx').on(table.teamId, table.position),
  uniqueTeamPosition: unique('unique_team_position').on(table.teamId, table.position),
}))

// Content cards table
export const contentCards = pgTable('content_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  stageId: uuid('stage_id').references(() => stages.id).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  content: text('content'), // Rich content/script
  contentType: varchar('content_type', { length: 50 }),
  priority: contentPriorityEnum('priority').default('medium'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  dueDate: timestamp('due_date'),
  position: integer('position'),
  tags: text('tags'), // JSON array as text
  metadata: text('metadata'), // JSON metadata as text
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  teamIdx: index('content_cards_team_idx').on(table.teamId),
  stageIdx: index('content_cards_stage_idx').on(table.stageId),
  assignedToIdx: index('content_cards_assigned_to_idx').on(table.assignedTo),
  createdByIdx: index('content_cards_created_by_idx').on(table.createdBy),
  stagePositionIdx: index('content_cards_stage_position_idx').on(table.stageId, table.position),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  createdTeams: many(teams),
  assignedCards: many(contentCards, { relationName: 'assignedCards' }),
  createdCards: many(contentCards, { relationName: 'createdCards' }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  members: many(teamMembers),
  stages: many(stages),
  contentCards: many(contentCards),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}))

export const stagesRelations = relations(stages, ({ one, many }) => ({
  team: one(teams, {
    fields: [stages.teamId],
    references: [teams.id],
  }),
  contentCards: many(contentCards),
}))

export const contentCardsRelations = relations(contentCards, ({ one }) => ({
  team: one(teams, {
    fields: [contentCards.teamId],
    references: [teams.id],
  }),
  stage: one(stages, {
    fields: [contentCards.stageId],
    references: [stages.id],
  }),
  assignedTo: one(users, {
    fields: [contentCards.assignedTo],
    references: [users.id],
    relationName: 'assignedCards',
  }),
  createdBy: one(users, {
    fields: [contentCards.createdBy],
    references: [users.id],
    relationName: 'createdCards',
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type Stage = typeof stages.$inferSelect
export type NewStage = typeof stages.$inferInsert
export type ContentCard = typeof contentCards.$inferSelect
export type NewContentCard = typeof contentCards.$inferInsert