import { db } from '@/lib/db'
import { auditLogs, users, type NewAuditLog, type AuditLogWithUser } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export type AuditEntityType = 'content_card' | 'subtask' | 'comment' | 'assignment' | 'attachment'
export type AuditAction = 'created' | 'updated' | 'deleted' | 'moved'

interface CreateAuditLogParams {
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  userId: string
  teamId: string
  changedFields?: Record<string, { old: any; new: any }>
  metadata?: Record<string, any>
}

interface GetLogsParams {
  entityType: AuditEntityType
  entityId: string
  limit?: number
  offset?: number
  action?: AuditAction
  userId?: string
}

export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  static async createLog(params: CreateAuditLogParams): Promise<void> {
    const { entityType, entityId, action, userId, teamId, changedFields, metadata } = params

    try {
      await db.insert(auditLogs).values({
        entityType,
        entityId,
        action,
        userId,
        teamId,
        changedFields: changedFields || null,
        metadata: metadata || null,
      })
    } catch (error) {
      console.error('[AuditLogService] Failed to create audit log:', error)
      // Don't throw - audit logging should not break main operations
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getLogsForEntity(params: GetLogsParams): Promise<{
    logs: AuditLogWithUser[]
    total: number
  }> {
    const { entityType, entityId, limit = 50, offset = 0, action, userId: filterUserId } = params

    // Build where conditions
    const conditions = [
      eq(auditLogs.entityType, entityType),
      eq(auditLogs.entityId, entityId),
    ]

    if (action) {
      conditions.push(eq(auditLogs.action, action))
    }

    if (filterUserId) {
      conditions.push(eq(auditLogs.userId, filterUserId))
    }

    // Fetch logs with user details
    const logs = await db
      .select({
        id: auditLogs.id,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        userId: auditLogs.userId,
        teamId: auditLogs.teamId,
        changedFields: auditLogs.changedFields,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        user: users,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(and(...conditions))

    return {
      logs: logs as AuditLogWithUser[],
      total: count,
    }
  }

  /**
   * Get audit logs for a team (admin view)
   */
  static async getLogsForTeam(
    teamId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    logs: AuditLogWithUser[]
    total: number
  }> {
    // Fetch logs with user details
    const logs = await db
      .select({
        id: auditLogs.id,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        userId: auditLogs.userId,
        teamId: auditLogs.teamId,
        changedFields: auditLogs.changedFields,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        user: users,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.teamId, teamId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(eq(auditLogs.teamId, teamId))

    return {
      logs: logs as AuditLogWithUser[],
      total: count,
    }
  }

  /**
   * Format changed fields for display
   */
  static formatChangedFields(
    changedFields: Record<string, { old: any; new: any }> | null
  ): { field: string; old: string; new: string }[] {
    if (!changedFields) return []

    return Object.entries(changedFields).map(([field, values]) => ({
      field: this.formatFieldName(field),
      old: this.formatFieldValue(values.old),
      new: this.formatFieldValue(values.new),
    }))
  }

  /**
   * Format field name to human-readable format
   */
  private static formatFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      content: 'Content',
      priority: 'Priority',
      dueDate: 'Due Date',
      assignedTo: 'Assigned To',
      stageId: 'Stage',
      tags: 'Tags',
      contentType: 'Content Type',
    }

    return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1)
  }

  /**
   * Format field value to human-readable format
   */
  private static formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return 'None'
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (value instanceof Date) {
      return value.toLocaleDateString()
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }

    return String(value)
  }

  /**
   * Detect changed fields between old and new objects
   */
  static detectChangedFields<T extends Record<string, any>>(
    oldObj: T,
    newObj: T,
    fieldsToTrack: (keyof T)[]
  ): Record<string, { old: any; new: any }> | undefined {
    const changes: Record<string, { old: any; new: any }> = {}

    for (const field of fieldsToTrack) {
      const oldValue = oldObj[field]
      const newValue = newObj[field]

      // Compare values (handle dates, objects, primitives)
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[String(field)] = {
          old: oldValue,
          new: newValue,
        }
      }
    }

    return Object.keys(changes).length > 0 ? changes : undefined
  }
}
