import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, index, unique, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'member', 'client', 'strategist', 'scriptwriter', 'editor', 'coordinator'])
export const contentPriorityEnum = pgEnum('content_priority', ['low', 'medium', 'high', 'urgent'])
export const contentFormatEnum = pgEnum('content_format', ['short', 'long'])
export const cardStatusEnum = pgEnum('card_status', ['not_started', 'in_progress', 'blocked', 'ready_for_review', 'completed'])
export const alertTypeEnum = pgEnum('alert_type', ['stage_overdue', 'deadline_missed', 'no_response', 'manual'])
export const alertSeverityEnum = pgEnum('alert_severity', ['low', 'medium', 'high', 'critical'])
export const alertStatusEnum = pgEnum('alert_status', ['open', 'acknowledged', 'resolved', 'escalated', 'dismissed'])
export const auditEntityTypeEnum = pgEnum('audit_entity_type', ['content_card', 'subtask', 'comment', 'assignment', 'attachment'])
export const auditActionEnum = pgEnum('audit_action', ['created', 'updated', 'deleted', 'moved'])

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
  // Client-specific fields
  clientCompanyName: varchar('client_company_name', { length: 200 }),
  industry: varchar('industry', { length: 100 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  isClient: boolean('is_client').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdx: index('teams_client_idx').on(table.isClient),
}))

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
  contentFormat: contentFormatEnum('content_format').default('short'),
  priority: contentPriorityEnum('priority').default('medium'),
  status: cardStatusEnum('status').default('not_started'),
  clientId: uuid('client_id').references(() => teams.id),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  dueDate: timestamp('due_date'),
  dueWindowStart: timestamp('due_window_start'),
  dueWindowEnd: timestamp('due_window_end'),
  position: integer('position'),
  tags: text('tags'), // JSON array as text
  metadata: text('metadata'), // JSON metadata as text
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  teamIdx: index('content_cards_team_idx').on(table.teamId),
  stageIdx: index('content_cards_stage_idx').on(table.stageId),
  clientIdx: index('content_cards_client_idx').on(table.clientId),
  assignedToIdx: index('content_cards_assigned_to_idx').on(table.assignedTo),
  createdByIdx: index('content_cards_created_by_idx').on(table.createdBy),
  stagePositionIdx: index('content_cards_stage_position_idx').on(table.stageId, table.position),
}))

// Comments table with mentions support
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentCardId: uuid('content_card_id').references(() => contentCards.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  mentions: text('mentions'), // JSON array of mentioned user IDs
  parentCommentId: uuid('parent_comment_id').references(() => comments.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cardIdx: index('comments_card_idx').on(table.contentCardId),
  userIdx: index('comments_user_idx').on(table.userId),
  parentIdx: index('comments_parent_idx').on(table.parentCommentId),
}))

// Comment mentions for notification tracking
export const commentMentions = pgTable('comment_mentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  mentionedUserId: uuid('mentioned_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  commentIdx: index('comment_mentions_comment_idx').on(table.commentId),
  userIdx: index('comment_mentions_user_idx').on(table.mentionedUserId),
}))

// File attachments table
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentCardId: uuid('content_card_id').references(() => contentCards.id, { onDelete: 'cascade' }).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileHash: varchar('file_hash', { length: 64 }), // SHA-256 for deduplication
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cardIdx: index('attachments_card_idx').on(table.contentCardId),
  userIdx: index('attachments_user_idx').on(table.uploadedBy),
}))

// Enhanced assignments (extending existing assigned_to)
export const cardAssignments = pgTable('card_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentCardId: uuid('content_card_id').references(() => contentCards.id, { onDelete: 'cascade' }).notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }), // 'primary', 'reviewer', 'approver', 'collaborator'
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
}, (table) => ({
  cardIdx: index('card_assignments_card_idx').on(table.contentCardId),
  assigneeIdx: index('card_assignments_assignee_idx').on(table.assignedTo),
}))

// In-app notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'assignment', 'mention', 'deadline', 'approval'
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  relatedCardId: uuid('related_card_id').references(() => contentCards.id, { onDelete: 'cascade' }),
  relatedCommentId: uuid('related_comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  typeIdx: index('notifications_type_idx').on(table.type),
  unreadIdx: index('notifications_unread_idx').on(table.userId, table.isRead),
}))

// Card sharing across teams
export const cardTeamShares = pgTable('card_team_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentCardId: uuid('content_card_id').references(() => contentCards.id, { onDelete: 'cascade' }).notNull(),
  sharedWithTeamId: uuid('shared_with_team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  sharedBy: uuid('shared_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  permissionLevel: varchar('permission_level', { length: 20 }).default('view'), // 'view', 'comment', 'edit'
  sharedAt: timestamp('shared_at').defaultNow().notNull(),
}, (table) => ({
  cardIdx: index('card_team_shares_card_idx').on(table.contentCardId),
  teamIdx: index('card_team_shares_team_idx').on(table.sharedWithTeamId),
}))

// Activity feed for collaboration tracking
export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'created_card', 'commented', 'assigned', etc.
  resourceType: varchar('resource_type', { length: 50 }), // 'card', 'comment', 'attachment'
  resourceId: uuid('resource_id'),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('activity_feed_user_idx').on(table.userId),
  teamIdx: index('activity_feed_team_idx').on(table.teamId),
  actionIdx: index('activity_feed_action_idx').on(table.actionType),
}))

// Client profiles table
export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull().unique(),

  // Brand Information
  brandBio: text('brand_bio'),
  brandVoice: text('brand_voice'),
  targetAudience: text('target_audience'),
  contentPillars: jsonb('content_pillars').$type<string[]>(),

  // Style Guidelines
  styleGuidelines: jsonb('style_guidelines').$type<{
    colors?: string[]
    fonts?: string[]
    tone?: string
    dosDonts?: { dos: string[]; donts: string[] }
  }>(),

  // Asset Links
  assetLinks: jsonb('asset_links').$type<{
    dropbox?: string
    googleDrive?: string
    notion?: string
    other?: { name: string; url: string }[]
  }>(),

  // Competitive Analysis
  competitiveChannels: jsonb('competitive_channels').$type<{
    platform: string
    channelUrl: string
    notes: string
  }[]>(),

  // Performance Goals
  performanceGoals: jsonb('performance_goals').$type<{
    views?: number
    engagement?: number
    followers?: number
    timeframe?: string
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  teamIdx: index('client_profiles_team_idx').on(table.teamId),
}))

// Alerts table for monitoring and escalation
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentCardId: uuid('content_card_id').references(() => contentCards.id, { onDelete: 'cascade' }).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),

  type: alertTypeEnum('type').notNull(),
  severity: alertSeverityEnum('severity').notNull().default('medium'),
  status: alertStatusEnum('status').notNull().default('open'),

  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),

  // Assigned to whom
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),

  // Time tracking
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),

  // Escalation tracking
  escalatedAt: timestamp('escalated_at'),
  escalatedTo: uuid('escalated_to').references(() => users.id, { onDelete: 'set null' }),
  escalationReason: text('escalation_reason'),

  // Metadata
  metadata: jsonb('metadata').$type<{
    stageName?: string
    daysOverdue?: number
    timeLimit?: number
    previousAssignee?: string
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cardIdx: index('alerts_card_idx').on(table.contentCardId),
  teamIdx: index('alerts_team_idx').on(table.teamId),
  statusIdx: index('alerts_status_idx').on(table.status),
  severityIdx: index('alerts_severity_idx').on(table.severity),
  assignedToIdx: index('alerts_assigned_to_idx').on(table.assignedTo),
}))

// Stage time configurations
export const stageTimeConfigs = pgTable('stage_time_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  stageName: varchar('stage_name', { length: 100 }).notNull(),
  maxDays: integer('max_days').notNull(),
  isGlobal: boolean('is_global').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  teamStageIdx: index('stage_time_configs_team_stage_idx').on(table.teamId, table.stageName),
}))

// Audit logs table for tracking all changes
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: auditEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: auditActionEnum('action').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),

  // Change tracking
  changedFields: jsonb('changed_fields').$type<Record<string, { old: any; new: any }>>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  userIdx: index('audit_logs_user_idx').on(table.userId),
  teamIdx: index('audit_logs_team_idx').on(table.teamId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}))

// Checklist templates (stage-specific deliverables)
export const checklistTemplates = pgTable('checklist_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  stageId: uuid('stage_id').references(() => stages.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  position: integer('position').notNull().default(0),
  isRequired: boolean('is_required').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  stageIdx: index('checklist_templates_stage_idx').on(table.stageId),
  stagePositionIdx: index('checklist_templates_stage_position_idx').on(table.stageId, table.position),
}))

// Card checklist items (actual checklist for each card)
export const cardChecklistItems = pgTable('card_checklist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').references(() => contentCards.id, { onDelete: 'cascade' }).notNull(),
  templateId: uuid('template_id').references(() => checklistTemplates.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  position: integer('position').notNull().default(0),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by').references(() => users.id, { onDelete: 'set null' }),
  isCustom: boolean('is_custom').default(false), // true if added by user, false if from template
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cardIdx: index('card_checklist_items_card_idx').on(table.cardId),
  templateIdx: index('card_checklist_items_template_idx').on(table.templateId),
  cardPositionIdx: index('card_checklist_items_card_position_idx').on(table.cardId, table.position),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  createdTeams: many(teams),
  assignedCards: many(contentCards, { relationName: 'assignedCards' }),
  createdCards: many(contentCards, { relationName: 'createdCards' }),
  comments: many(comments),
  commentMentions: many(commentMentions),
  uploadedAttachments: many(attachments),
  assignedTasks: many(cardAssignments, { relationName: 'assignedToUser' }),
  createdAssignments: many(cardAssignments, { relationName: 'assignedByUser' }),
  notifications: many(notifications),
  sharedCards: many(cardTeamShares),
  activities: many(activityFeed),
  auditLogs: many(auditLogs),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  members: many(teamMembers),
  stages: many(stages),
  contentCards: many(contentCards),
  clientProfile: one(clientProfiles),
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

export const contentCardsRelations = relations(contentCards, ({ one, many }) => ({
  team: one(teams, {
    fields: [contentCards.teamId],
    references: [teams.id],
  }),
  stage: one(stages, {
    fields: [contentCards.stageId],
    references: [stages.id],
  }),
  client: one(teams, {
    fields: [contentCards.clientId],
    references: [teams.id],
    relationName: 'clientCards',
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
  comments: many(comments),
  attachments: many(attachments),
  assignments: many(cardAssignments),
  teamShares: many(cardTeamShares),
  checklistItems: many(cardChecklistItems),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  contentCard: one(contentCards, {
    fields: [comments.contentCardId],
    references: [contentCards.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: 'parentComment',
  }),
  replies: many(comments, { relationName: 'parentComment' }),
  mentions: many(commentMentions),
}))

export const commentMentionsRelations = relations(commentMentions, ({ one }) => ({
  comment: one(comments, {
    fields: [commentMentions.commentId],
    references: [comments.id],
  }),
  mentionedUser: one(users, {
    fields: [commentMentions.mentionedUserId],
    references: [users.id],
  }),
}))

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  contentCard: one(contentCards, {
    fields: [attachments.contentCardId],
    references: [contentCards.id],
  }),
  uploadedBy: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}))

export const cardAssignmentsRelations = relations(cardAssignments, ({ one }) => ({
  contentCard: one(contentCards, {
    fields: [cardAssignments.contentCardId],
    references: [contentCards.id],
  }),
  assignedTo: one(users, {
    fields: [cardAssignments.assignedTo],
    references: [users.id],
    relationName: 'assignedToUser',
  }),
  assignedBy: one(users, {
    fields: [cardAssignments.assignedBy],
    references: [users.id],
    relationName: 'assignedByUser',
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedCard: one(contentCards, {
    fields: [notifications.relatedCardId],
    references: [contentCards.id],
  }),
  relatedComment: one(comments, {
    fields: [notifications.relatedCommentId],
    references: [comments.id],
  }),
}))

export const cardTeamSharesRelations = relations(cardTeamShares, ({ one }) => ({
  contentCard: one(contentCards, {
    fields: [cardTeamShares.contentCardId],
    references: [contentCards.id],
  }),
  sharedWithTeam: one(teams, {
    fields: [cardTeamShares.sharedWithTeamId],
    references: [teams.id],
  }),
  sharedBy: one(users, {
    fields: [cardTeamShares.sharedBy],
    references: [users.id],
  }),
}))

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
  user: one(users, {
    fields: [activityFeed.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [activityFeed.teamId],
    references: [teams.id],
  }),
}))

export const clientProfilesRelations = relations(clientProfiles, ({ one }) => ({
  team: one(teams, {
    fields: [clientProfiles.teamId],
    references: [teams.id],
  }),
}))

export const alertsRelations = relations(alerts, ({ one }) => ({
  contentCard: one(contentCards, {
    fields: [alerts.contentCardId],
    references: [contentCards.id],
  }),
  team: one(teams, {
    fields: [alerts.teamId],
    references: [teams.id],
  }),
  assignedUser: one(users, {
    fields: [alerts.assignedTo],
    references: [users.id],
    relationName: 'assignedAlerts',
  }),
  escalatedUser: one(users, {
    fields: [alerts.escalatedTo],
    references: [users.id],
    relationName: 'escalatedAlerts',
  }),
}))

export const stageTimeConfigsRelations = relations(stageTimeConfigs, ({ one }) => ({
  team: one(teams, {
    fields: [stageTimeConfigs.teamId],
    references: [teams.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [auditLogs.teamId],
    references: [teams.id],
  }),
}))

export const checklistTemplatesRelations = relations(checklistTemplates, ({ one, many }) => ({
  stage: one(stages, {
    fields: [checklistTemplates.stageId],
    references: [stages.id],
  }),
  checklistItems: many(cardChecklistItems),
}))

export const cardChecklistItemsRelations = relations(cardChecklistItems, ({ one }) => ({
  card: one(contentCards, {
    fields: [cardChecklistItems.cardId],
    references: [contentCards.id],
  }),
  template: one(checklistTemplates, {
    fields: [cardChecklistItems.templateId],
    references: [checklistTemplates.id],
  }),
  completedByUser: one(users, {
    fields: [cardChecklistItems.completedBy],
    references: [users.id],
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

// Extended type for card with relationships (used by API responses)
export type ContentCardWithRelations = ContentCard & {
  stage: Stage
  assignedTo: User | null
  createdBy: User
  contentType?: string
  commentsCount?: number
  attachmentsCount?: number
}
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type CommentMention = typeof commentMentions.$inferSelect
export type NewCommentMention = typeof commentMentions.$inferInsert
export type Attachment = typeof attachments.$inferSelect
export type NewAttachment = typeof attachments.$inferInsert
export type CardAssignment = typeof cardAssignments.$inferSelect
export type NewCardAssignment = typeof cardAssignments.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type CardTeamShare = typeof cardTeamShares.$inferSelect
export type NewCardTeamShare = typeof cardTeamShares.$inferInsert
export type ActivityFeedItem = typeof activityFeed.$inferSelect
export type NewActivityFeedItem = typeof activityFeed.$inferInsert
export type ClientProfile = typeof clientProfiles.$inferSelect
export type NewClientProfile = typeof clientProfiles.$inferInsert
export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert
export type StageTimeConfig = typeof stageTimeConfigs.$inferSelect
export type NewStageTimeConfig = typeof stageTimeConfigs.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect
export type NewChecklistTemplate = typeof checklistTemplates.$inferInsert
export type CardChecklistItem = typeof cardChecklistItems.$inferSelect
export type NewCardChecklistItem = typeof cardChecklistItems.$inferInsert
export type NewAuditLog = typeof auditLogs.$inferInsert

// Extended type for audit log with user details
export type AuditLogWithUser = AuditLog & {
  user: User | null
}