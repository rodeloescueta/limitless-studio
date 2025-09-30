# Phase 7: AI Orchestration System (Rule-Based MVP)

## Overview
Implement a rule-based monitoring system that tracks content cards through REACH workflow stages, detects delays, and automatically escalates issues. This is an MVP approach using time-based rules before implementing full AI/ML orchestration.

**Status**: 🟡 **READY TO START**
**Priority**: HIGH (Automated monitoring and alerts)
**Timeline**: 3-4 days
**Dependencies**: Phase 5.5 (User Management) ✅, Phase 6 (Client Management) ✅

---

## 🎯 Problem Statement

### Current Challenges
- No automated monitoring of card progress through stages
- Cards can get stuck in stages indefinitely
- No alerts when deadlines are missed
- Manual tracking required for workflow bottlenecks
- No escalation system for overdue tasks

### Business Requirements
- **Time-Based Monitoring**: Detect cards exceeding stage time limits
- **Automated Alerts**: Notify assignees and managers of overdue cards
- **Escalation System**: Escalate to managers after 24 hours of no response
- **Performance Analytics**: Track stage durations and bottlenecks
- **Coordinator Dashboard**: Central view of all issues and alerts

---

## 🎯 Goals & Success Criteria

### Functional Requirements
- ✅ Monitor card progress through all REACH stages
- ✅ Detect cards exceeding defined time windows
- ✅ Generate alerts for overdue cards
- ✅ Escalate unresolved alerts to managers
- ✅ Track alert response times
- ✅ Provide dashboard for coordinators/admins

### Time Windows (Configurable)
- **Research**: 2 days maximum
- **Envision**: 2 days maximum
- **Assemble**: 3 days maximum
- **Connect**: 1 day maximum
- **Hone**: 7 days maximum

### User Experience Requirements
- ✅ Clear alert notifications with action buttons
- ✅ One-click acknowledgment/resolution
- ✅ Visual indicators on overdue cards
- ✅ Alert history and audit trail

### Technical Requirements
- ✅ Background cron job for monitoring (runs every hour)
- ✅ Database schema for alerts and escalations
- ✅ Notification system integration
- ✅ Performance metrics collection

---

## 🔧 Implementation Plan

### Task 1: Database Schema for Alerts (30 min)

#### Create alerts table
**File**: Update `/frontend/src/lib/db/schema.ts`

```typescript
export const alertTypeEnum = pgEnum('alert_type', [
  'stage_overdue',
  'deadline_missed',
  'no_response',
  'manual',
])

export const alertSeverityEnum = pgEnum('alert_severity', [
  'low',
  'medium',
  'high',
  'critical',
])

export const alertStatusEnum = pgEnum('alert_status', [
  'open',
  'acknowledged',
  'resolved',
  'escalated',
  'dismissed',
])

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
```

#### Create stage_time_configs table
```typescript
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
```

---

### Task 2: Monitoring Service (2 hours)

#### Create monitoring service
**File**: `/frontend/src/lib/services/monitoring.ts`

```typescript
import { db } from '@/lib/db'
import { contentCards, stages, alerts, notifications, users } from '@/lib/db/schema'
import { eq, and, lt, isNull } from 'drizzle-orm'

const DEFAULT_TIME_LIMITS: Record<string, number> = {
  'Research': 2,
  'Envision': 2,
  'Assemble': 3,
  'Connect': 1,
  'Hone': 7,
}

export async function checkOverdueCards() {
  console.log('[Monitoring] Starting overdue card check...')

  // Get all cards with their stage information
  const cards = await db
    .select({
      card: contentCards,
      stage: stages,
      assignedUser: users,
    })
    .from(contentCards)
    .innerJoin(stages, eq(contentCards.stageId, stages.id))
    .leftJoin(users, eq(contentCards.assignedTo, users.id))

  const now = new Date()
  const overdueCards = []

  for (const { card, stage, assignedUser } of cards) {
    const timeLimit = DEFAULT_TIME_LIMITS[stage.name] || 3
    const cardAge = (now.getTime() - card.updatedAt.getTime()) / (1000 * 60 * 60 * 24)

    if (cardAge > timeLimit) {
      // Check if alert already exists
      const existingAlert = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.contentCardId, card.id),
            eq(alerts.status, 'open')
          )
        )
        .limit(1)

      if (existingAlert.length === 0) {
        // Create new alert
        const severity = cardAge > timeLimit * 2 ? 'high' : 'medium'

        const [newAlert] = await db
          .insert(alerts)
          .values({
            contentCardId: card.id,
            teamId: card.teamId,
            type: 'stage_overdue',
            severity,
            status: 'open',
            title: `Card overdue in ${stage.name}`,
            message: `Card "${card.title}" has been in ${stage.name} for ${Math.floor(cardAge)} days (limit: ${timeLimit} days)`,
            assignedTo: card.assignedTo,
            metadata: {
              stageName: stage.name,
              daysOverdue: Math.floor(cardAge - timeLimit),
              timeLimit,
            },
          })
          .returning()

        // Create notification for assignee
        if (card.assignedTo) {
          await db.insert(notifications).values({
            userId: card.assignedTo,
            type: 'deadline',
            title: `⚠️ Card Overdue: ${card.title}`,
            message: `Your card has been in ${stage.name} for ${Math.floor(cardAge)} days. Please update or move it forward.`,
            relatedCardId: card.id,
          })
        }

        overdueCards.push(newAlert)
      }
    }
  }

  console.log(`[Monitoring] Found ${overdueCards.length} new overdue cards`)
  return overdueCards
}

export async function checkEscalations() {
  console.log('[Monitoring] Checking for escalations...')

  const now = new Date()
  const escalationThreshold = 24 // hours

  // Get all open alerts that are older than 24 hours
  const oldAlerts = await db
    .select({
      alert: alerts,
      card: contentCards,
      assignedUser: users,
    })
    .from(alerts)
    .innerJoin(contentCards, eq(alerts.contentCardId, contentCards.id))
    .leftJoin(users, eq(alerts.assignedTo, users.id))
    .where(
      and(
        eq(alerts.status, 'open'),
        isNull(alerts.escalatedAt)
      )
    )

  const escalations = []

  for (const { alert, card, assignedUser } of oldAlerts) {
    const alertAge = (now.getTime() - alert.detectedAt.getTime()) / (1000 * 60 * 60)

    if (alertAge > escalationThreshold) {
      // Find coordinator or admin to escalate to
      const coordinators = await db
        .select()
        .from(users)
        .where(eq(users.role, 'coordinator'))
        .limit(1)

      const escalateTo = coordinators[0]?.id

      if (escalateTo) {
        // Update alert with escalation
        await db
          .update(alerts)
          .set({
            status: 'escalated',
            escalatedAt: now,
            escalatedTo,
            escalationReason: `No response for ${Math.floor(alertAge)} hours`,
            updatedAt: now,
          })
          .where(eq(alerts.id, alert.id))

        // Notify coordinator
        await db.insert(notifications).values({
          userId: escalateTo,
          type: 'deadline',
          title: `🚨 Escalation: ${card.title}`,
          message: `Card has been overdue for ${Math.floor(alertAge)} hours with no response. Please review.`,
          relatedCardId: card.id,
        })

        escalations.push(alert)
      }
    }
  }

  console.log(`[Monitoring] Escalated ${escalations.length} alerts`)
  return escalations
}

export async function runMonitoring() {
  try {
    const overdueCards = await checkOverdueCards()
    const escalations = await checkEscalations()

    return {
      success: true,
      overdueCards: overdueCards.length,
      escalations: escalations.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Monitoring] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}
```

---

### Task 3: Cron Job API Endpoint (30 min)

#### Create monitoring endpoint
**File**: `/frontend/src/app/api/monitoring/run/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { runMonitoring } from '@/lib/services/monitoring'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// This endpoint should be called by a cron job every hour
// In production, secure this with a secret token
export async function GET(request: NextRequest) {
  try {
    // Check for authorization token (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runMonitoring()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### Task 4: Alert Management API (1 hour)

#### Create alert endpoints
**File**: `/frontend/src/app/api/alerts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { alerts, contentCards, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

// GET /api/alerts - List alerts (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // open, acknowledged, resolved, escalated
    const severity = searchParams.get('severity') // low, medium, high, critical

    let query = db
      .select({
        alert: alerts,
        card: contentCards,
        assignedUser: users,
      })
      .from(alerts)
      .leftJoin(contentCards, eq(alerts.contentCardId, contentCards.id))
      .leftJoin(users, eq(alerts.assignedTo, users.id))
      .orderBy(desc(alerts.createdAt))

    // Filter based on user role
    if (session.user.role === 'admin' || session.user.role === 'coordinator') {
      // Admins and coordinators see all alerts
    } else {
      // Other users only see their assigned alerts
      query = query.where(eq(alerts.assignedTo, session.user.id))
    }

    const allAlerts = await query

    return NextResponse.json(allAlerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**File**: `/frontend/src/app/api/alerts/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { alerts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// PUT /api/alerts/[id] - Update alert status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === 'acknowledged') {
      updateData.acknowledgedAt = new Date()
    } else if (status === 'resolved') {
      updateData.resolvedAt = new Date()
    }

    const [updated] = await db
      .update(alerts)
      .set(updateData)
      .where(eq(alerts.id, params.id))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### Task 5: Alert Dashboard UI (2 hours)

#### Create alert dashboard
**File**: `/frontend/src/app/dashboard/alerts/page.tsx`

Key features:
- List of all alerts with filters (status, severity, type)
- Card preview with alert details
- Quick action buttons (Acknowledge, Resolve, Dismiss)
- Alert history timeline
- Statistics (total alerts, open, escalated, resolved)

#### Create alert widget for main dashboard
**File**: `/frontend/src/components/alerts/AlertWidget.tsx`

Features:
- Show count of open alerts
- Color-coded by severity
- Click to view alert details
- Dismiss/acknowledge inline

---

## 📋 TODO List

### Phase 1: Database Schema ⏳
- [ ] Create alert-related enums (alertType, alertSeverity, alertStatus)
- [ ] Create alerts table with escalation tracking
- [ ] Create stageTimeConfigs table for custom time limits
- [ ] Generate and apply migrations

### Phase 2: Monitoring Service ⏳
- [ ] Create monitoring.ts service file
- [ ] Implement checkOverdueCards() function
- [ ] Implement checkEscalations() function
- [ ] Add logging and error handling

### Phase 3: API Endpoints ⏳
- [ ] Create /api/monitoring/run endpoint for cron
- [ ] Create /api/alerts GET endpoint (list alerts)
- [ ] Create /api/alerts/[id] PUT endpoint (update status)
- [ ] Add role-based filtering

### Phase 4: Cron Job Setup ⏳
- [ ] Set up external cron service (cron-job.org or similar)
- [ ] Configure CRON_SECRET environment variable
- [ ] Test monitoring endpoint manually
- [ ] Schedule hourly execution

### Phase 5: Dashboard UI ⏳
- [ ] Create alerts dashboard page
- [ ] Build alert list with filters
- [ ] Add quick action buttons
- [ ] Create alert widget for main dashboard
- [ ] Add visual indicators on overdue cards

### Phase 6: Testing ⏳
- [ ] Test overdue detection with mock data
- [ ] Test escalation after 24 hours
- [ ] Test notifications sent correctly
- [ ] Test role-based alert visibility
- [ ] Test manual alert dismissal

---

## 🧪 Testing Checklist

### Scenario 1: Card Overdue Detection
- [ ] Create card in Research stage
- [ ] Manually update card.updatedAt to 3 days ago
- [ ] Run monitoring endpoint
- [ ] Verify alert created with correct severity
- [ ] Verify notification sent to assignee

### Scenario 2: Alert Escalation
- [ ] Create overdue alert
- [ ] Set alert.detectedAt to 25 hours ago
- [ ] Run monitoring endpoint
- [ ] Verify alert escalated to coordinator
- [ ] Verify escalation notification sent

### Scenario 3: Alert Management
- [ ] View alerts as coordinator (should see all)
- [ ] View alerts as team member (should see only assigned)
- [ ] Acknowledge an alert
- [ ] Resolve an alert
- [ ] Verify status updates correctly

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Monitoring runs automatically every hour
- ✅ Overdue cards detected correctly
- ✅ Alerts created with appropriate severity
- ✅ Notifications sent to assignees
- ✅ Escalations work after 24 hours
- ✅ Alert dashboard functional

### Performance Requirements
- ✅ Monitoring runs in < 10 seconds
- ✅ Alert queries return in < 1 second
- ✅ No duplicate alerts created
- ✅ Efficient database queries

### User Experience Requirements
- ✅ Clear alert messages
- ✅ Easy to acknowledge/resolve
- ✅ Visual indicators on cards
- ✅ Alert history accessible

---

## 📊 Default Time Limits

| Stage | Time Limit | Rationale |
|-------|-----------|-----------|
| Research | 2 days | Quick ideation phase |
| Envision | 2 days | Script outlining and planning |
| Assemble | 3 days | Production and editing |
| Connect | 1 day | Quick approval/publishing |
| Hone | 7 days | Analytics gathering period |

---

## 🔄 Future Enhancements (Post-MVP)

### Phase 7.1: Advanced Analytics
- Team performance metrics
- Bottleneck detection
- Predictive analytics
- Custom reporting

### Phase 7.2: AI-Powered Orchestration
- ML-based time prediction
- Intelligent task assignment
- Anomaly detection
- Smart recommendations

### Phase 7.3: Integration
- Slack notifications
- Email digests
- Calendar integration
- External webhooks

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Related**: Phase 5.5 (User Management), Phase 6 (Client Management)
**Next Phase**: Phase 8 (Voice Notes & Client Dashboard)