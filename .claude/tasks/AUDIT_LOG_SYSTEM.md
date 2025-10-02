# Audit Log System - Task Plan

## 📋 Overview

**Purpose**: Implement comprehensive audit logging system to track all Kanban board changes (create, update, delete operations) for accountability and history tracking.

**Target Users**: Admin, Strategist (viewing logs), All team members (their actions are logged)

**Priority**: Medium - Enhances accountability and provides valuable history tracking

**Timeline**: 1-2 days

---

## 🎯 Goals

1. **Track all content card operations**: Create, update, delete, stage transitions
2. **Store detailed change metadata**: Who, what, when, before/after states
3. **Provide UI for viewing history logs**: Per-card history with filtering
4. **Prepare for future expansion**: Subtasks, comments, assignments, attachments

---

## 🏗️ Architecture Design

### Database Schema

**New Table: `audit_logs`**
```typescript
{
  id: uuid (primary key)
  entity_type: enum ['content_card', 'subtask', 'comment', 'assignment', 'attachment'] // Extensible
  entity_id: uuid (references the entity)
  action: enum ['created', 'updated', 'deleted', 'moved'] // Core actions
  user_id: uuid (who performed the action)
  team_id: uuid (for multi-tenancy)

  // Change tracking
  changed_fields: jsonb // { fieldName: { old: value, new: value } }
  metadata: jsonb // Additional context (e.g., { from_stage: 'research', to_stage: 'envision' })

  // Timestamps
  created_at: timestamp

  // Indexes for fast queries
  indexes: [entity_id, user_id, team_id, action, created_at]
}
```

### API Endpoints

**1. Get Audit Logs (for a specific card)**
```
GET /api/cards/[cardId]/audit-logs
Query params:
  - limit (default: 50)
  - offset (for pagination)
  - action (filter by action type)
  - user_id (filter by user)
Response: { logs: AuditLog[], total: number }
```

**2. Create Audit Log (internal use)**
```typescript
// Used internally by other APIs, not exposed as public endpoint
function createAuditLog({
  entityType: 'content_card' | 'subtask' | ...,
  entityId: string,
  action: 'created' | 'updated' | 'deleted' | 'moved',
  userId: string,
  teamId: string,
  changedFields?: Record<string, { old: any, new: any }>,
  metadata?: Record<string, any>
})
```

---

## 📝 Implementation Tasks

### Phase 1: Database & Core Infrastructure (0.5 day)

**Tasks:**
- [ ] Create `audit_logs` table schema in Drizzle
- [ ] Add database migration script
- [ ] Create `AuditLog` TypeScript types
- [ ] Build `AuditLogService` utility class
  - `createLog()` - Create new audit entry
  - `getLogsForEntity()` - Fetch logs for specific entity
  - `getLogsForTeam()` - Fetch all team logs (admin view)
  - `formatChangedFields()` - Human-readable field changes

**Files to Create:**
- `/frontend/src/lib/db/schema/audit-logs.ts`
- `/frontend/src/lib/db/migrations/XXXX_create_audit_logs.sql`
- `/frontend/src/lib/services/audit-log.service.ts`

---

### Phase 2: Integration with Existing APIs (0.5 day)

**Integrate logging into existing endpoints:**

**1. Content Card APIs** (`/api/cards/[id]/route.ts`)
- [ ] Log `created` action on POST `/api/cards`
- [ ] Log `updated` action on PUT `/api/cards/[id]`
  - Track changed fields (title, description, priority, due_date, etc.)
- [ ] Log `deleted` action on DELETE `/api/cards/[id]`
- [ ] Log `moved` action on stage transitions
  - Metadata: `{ from_stage: 'research', to_stage: 'envision' }`

**2. Subtask APIs** (Future expansion - placeholder)
- [ ] Add logging hooks for subtask CRUD operations

**3. Comment APIs** (Future expansion - placeholder)
- [ ] Add logging for comment creation/deletion

**Files to Modify:**
- `/frontend/src/app/api/cards/route.ts`
- `/frontend/src/app/api/cards/[id]/route.ts`
- Any other card mutation endpoints

---

### Phase 3: Audit Log API Endpoint (0.5 day)

**Create dedicated audit log endpoint:**

**API Route:** `/api/cards/[cardId]/audit-logs/route.ts`

**Features:**
- [ ] GET handler with pagination
- [ ] Query filtering (action type, user, date range)
- [ ] Permission checks (team members can view logs)
- [ ] Formatted response with user details populated
- [ ] Sort by `created_at DESC` (newest first)

**Response Format:**
```typescript
{
  logs: [
    {
      id: "uuid",
      action: "updated",
      user: { id: "uuid", name: "John Doe", email: "john@example.com" },
      timestamp: "2025-10-02T10:30:00Z",
      changes: [
        { field: "title", old: "Old Title", new: "New Title" },
        { field: "priority", old: "medium", new: "high" }
      ],
      metadata: {}
    }
  ],
  total: 45,
  hasMore: true
}
```

---

### Phase 4: UI Components (0.5 day)

**1. Card History Modal/Panel**

Create new component: `/frontend/src/components/cards/CardHistoryPanel.tsx`

**Features:**
- [ ] Timeline-style display of changes
- [ ] User avatars and names
- [ ] Relative timestamps ("2 hours ago")
- [ ] Collapsible change details
- [ ] Filter by action type (dropdowns)
- [ ] Search by user name
- [ ] "Load More" pagination button

**Visual Design:**
```
┌─ Card History ─────────────────────────┐
│ Filter: [All Actions ▼] [All Users ▼] │
├────────────────────────────────────────┤
│ ● John Doe moved card                  │
│   Research → Envision                  │
│   2 hours ago                          │
├────────────────────────────────────────┤
│ ● Jane Smith updated card              │
│   Priority: medium → high              │
│   Due Date: 2025-10-05 → 2025-10-03   │
│   3 hours ago                          │
├────────────────────────────────────────┤
│ ● Admin User created card              │
│   5 hours ago                          │
├────────────────────────────────────────┤
│         [Load More History]            │
└────────────────────────────────────────┘
```

**2. History Button in Card Modal**

Modify: `/frontend/src/components/cards/ContentCardModal.tsx`

- [ ] Add "History" tab next to "Details", "Subtasks", "Comments", "Attachments"
- [ ] On click, render `CardHistoryPanel`
- [ ] Show history icon with badge (number of recent changes)

**3. Admin Dashboard - Team Audit Logs** (Optional - Future Phase)

- [ ] Create `/dashboard/admin/audit-logs` page
- [ ] Show all team logs across all cards
- [ ] Advanced filtering and export to CSV

---

## 🧪 Testing Plan

### Unit Tests
- [ ] Test `AuditLogService.createLog()` creates entries correctly
- [ ] Test field change tracking for all data types
- [ ] Test pagination and filtering logic

### Integration Tests
- [ ] Create card → Verify audit log entry
- [ ] Update card title → Verify changed fields tracked
- [ ] Move card between stages → Verify metadata captured
- [ ] Delete card → Verify deletion logged

### Manual UI Testing
- [ ] Open card history panel
- [ ] Verify timeline displays correctly
- [ ] Test filtering by action type
- [ ] Test pagination ("Load More")
- [ ] Verify user names and avatars display
- [ ] Test with multiple users making changes

---

## 🔒 Security & Performance Considerations

### Security
- [ ] Only team members can view audit logs for their team's cards
- [ ] Audit logs are immutable (no UPDATE or DELETE operations)
- [ ] User IDs validated against session
- [ ] Prevent audit log tampering

### Performance
- [ ] Index `entity_id` for fast card history queries
- [ ] Index `team_id` for admin dashboard queries
- [ ] Limit pagination to max 100 entries per request
- [ ] Consider archiving old logs (> 1 year) to separate table

### Data Retention
- [ ] Keep audit logs for minimum 1 year
- [ ] Optional: Add retention policy for automatic archival
- [ ] Optional: Export logs to external storage (S3, etc.)

---

## 🚀 Future Enhancements (Post-MVP)

### Phase 2 Expansion
- [ ] Log subtask changes (assignments, status updates)
- [ ] Log comment edits and deletions
- [ ] Log attachment uploads and deletions
- [ ] Log assignment changes

### Advanced Features
- [ ] Export card history to PDF
- [ ] Real-time activity feed (WebSocket updates)
- [ ] Rollback functionality (restore previous version)
- [ ] Compare two versions side-by-side
- [ ] Email digest of daily team activity

### Analytics
- [ ] Most active users report
- [ ] Cards with most changes report
- [ ] Average time in each stage (from logs)
- [ ] Bottleneck identification

---

## 📦 Deliverables

1. **Database schema and migration** - `audit_logs` table
2. **Audit log service** - Reusable logging utility
3. **API endpoint** - `/api/cards/[cardId]/audit-logs`
4. **UI components** - `CardHistoryPanel.tsx`
5. **Integration** - All card APIs logging changes
6. **Documentation** - Usage guide for viewing history

---

## ✅ Definition of Done

- [ ] All card CRUD operations are logged
- [ ] History panel displays logs with user details
- [ ] Pagination works correctly
- [ ] Filtering by action type works
- [ ] No performance degradation on card operations
- [ ] Manual testing completed (all scenarios pass)
- [ ] Code reviewed and merged

---

## 🤔 Open Questions

1. **Data retention policy**: How long should we keep audit logs? (Recommendation: 1 year minimum)
2. **Real-time updates**: Should history panel auto-refresh when new changes occur? (Can defer to Phase 2)
3. **Export functionality**: Should we allow exporting history to CSV/PDF? (Can defer to Phase 2)
4. **Admin dashboard**: Priority for team-wide audit log viewing? (Can defer to Phase 2)

---

## 📅 Estimated Timeline

- **Phase 1** (Database & Infrastructure): 0.5 day
- **Phase 2** (API Integration): 0.5 day
- **Phase 3** (Audit Log Endpoint): 0.5 day
- **Phase 4** (UI Components): 0.5 day

**Total: 2 days** (includes testing and documentation)

---

**Created**: October 2, 2025
**Status**: 🟢 **COMPLETE**
**Completed**: October 2, 2025

---

## ✅ Implementation Summary

All tasks have been successfully completed:

1. ✅ **Database Schema**: `audit_logs` table created with proper indexes
2. ✅ **Service Layer**: `AuditLogService` utility class with full CRUD operations
3. ✅ **API Integration**: All card CRUD operations now log changes automatically
4. ✅ **API Endpoint**: `/api/cards/[cardId]/audit-logs` with pagination and filtering
5. ✅ **UI Component**: `CardHistoryPanel` with timeline view and expandable changes
6. ✅ **Modal Integration**: "History" tab added to card details modal
7. ✅ **Bug Fix**: Corrected count query using `sql<number>\`count(*)\`` instead of array length
8. ✅ **Testing**: End-to-end testing verified with creation and update events

### Key Features Implemented:
- ✅ Timeline view showing who did what and when
- ✅ Expandable change details with before/after values
- ✅ Color-coded action badges (created, updated, deleted, moved)
- ✅ User avatars and relative timestamps
- ✅ Filter by action type dropdown
- ✅ Pagination support with "Load More" button
- ✅ Event count display ("Showing X of Y events")

### Screenshots:
- `audit-history-test.png` - Initial testing (showing creation event only)
- `audit-log-system-complete.png` - Final working system with multiple events and expanded changes
