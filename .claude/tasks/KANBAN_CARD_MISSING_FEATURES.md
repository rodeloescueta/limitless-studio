# Kanban Card Missing Features - Task Document

**Created**: October 3, 2025
**Status**: 🟡 PENDING REVIEW
**Priority**: HIGH - Core Requirements Gap

---

## 📋 **Overview**

This document identifies missing features in the Kanban board content cards based on the requirements outlined in Section 6.1 of the project documentation and current implementation analysis.

### **Required Features (Section 6.1 REACH Kanban Board)**

> Each card shows: title, client, format (Short/Long), assigned roles, status, due window

### **Current Implementation Gap Analysis**

Based on screenshots and code review:

**✅ Currently Implemented:**
- Title
- Description
- Priority badge (Low/Medium/High/Urgent)
- Single assigned user (avatar)
- Due date (MMM d format)
- Comments count
- Attachments count
- Tags
- Drag handle

**❌ Missing Features:**
1. **Client selection/display** - No client field visible in card or modal
2. **Format field (Short/Long)** - No content format selector
3. **Assigned roles** - Only single user assignment, not role-based assignment
4. **Status field** - No explicit status beyond stage position
5. **Due window** - Only shows single due date, not time window
6. **Stage-specific checklists** - No deliverables checklist per stage

---

## 🎯 **Task Breakdown**

### **Task 1: Add Client Selection to Cards**
**Priority**: HIGH
**Estimated Time**: 2-3 hours

#### **Subtasks:**
1. **Database Schema Changes**
   - [ ] Add `clientId` field to `content_cards` table (UUID reference to teams where `isClient = true`)
   - [ ] Create migration for new field
   - [ ] Add index on `clientId` for performance

2. **API Updates**
   - [ ] Update `POST /api/teams/[teamId]/cards` to accept `clientId`
   - [ ] Update `PUT /api/cards/[cardId]` to handle `clientId` updates
   - [ ] Add client data to card response (join with teams/clientProfiles)

3. **UI Components - CreateCardModal**
   - [ ] Add "Client" select dropdown field
   - [ ] Fetch available clients from API (`GET /api/teams?isClient=true` or similar)
   - [ ] Update form schema to include `clientId` (optional field)
   - [ ] Display client selection in modal

4. **UI Components - ContentCard**
   - [ ] Add client badge/label display (e.g., "Client: Acme Corp")
   - [ ] Position near title or in metadata section
   - [ ] Style with subtle badge or icon

5. **UI Components - CardDetailsModal**
   - [ ] Add client field to "Edit Card Details" section
   - [ ] Allow changing client assignment
   - [ ] Display client in "DETAILS" sidebar

#### **Files to Modify:**
- `/frontend/src/lib/db/schema.ts` - Add `clientId` field
- `/frontend/src/app/api/teams/[teamId]/cards/route.ts` - Update create/list
- `/frontend/src/app/api/cards/[cardId]/route.ts` - Update edit
- `/frontend/src/components/kanban/CreateCardModal.tsx` - Add client select
- `/frontend/src/components/kanban/ContentCard.tsx` - Display client
- `/frontend/src/components/kanban/CardDetailsModal.tsx` - Edit client

---

### **Task 2: Add Format Field (Short/Long)**
**Priority**: HIGH
**Estimated Time**: 1-2 hours

#### **Subtasks:**
1. **Database Schema Changes**
   - [ ] Add `contentFormat` enum to schema: `pgEnum('content_format', ['short', 'long'])`
   - [ ] Add `contentFormat` field to `content_cards` table
   - [ ] Create migration

2. **API Updates**
   - [ ] Update card creation/edit APIs to accept `contentFormat`
   - [ ] Add to response types

3. **UI Components - CreateCardModal**
   - [ ] Add "Format" select dropdown (Short/Long)
   - [ ] Update form schema with `contentFormat` field
   - [ ] Set default value (e.g., 'short')

4. **UI Components - ContentCard**
   - [ ] Display format badge (e.g., "Short" or "Long")
   - [ ] Position near priority badge or in metadata
   - [ ] Use distinct colors (Short = blue, Long = purple)

5. **UI Components - CardDetailsModal**
   - [ ] Add format field to edit section
   - [ ] Allow changing format
   - [ ] Display in details sidebar

#### **Files to Modify:**
- `/frontend/src/lib/db/schema.ts` - Add enum and field
- `/frontend/src/app/api/teams/[teamId]/cards/route.ts`
- `/frontend/src/app/api/cards/[cardId]/route.ts`
- `/frontend/src/components/kanban/CreateCardModal.tsx`
- `/frontend/src/components/kanban/ContentCard.tsx`
- `/frontend/src/components/kanban/CardDetailsModal.tsx`

---

### **Task 3: Add Assigned Roles (Multi-Role Assignment)**
**Priority**: HIGH
**Estimated Time**: 3-4 hours

#### **Background:**
Currently, cards show single `assignedTo` user. Requirements specify "assigned roles" (plural), suggesting multiple users/roles can be assigned to a card.

#### **Subtasks:**
1. **Review Existing Assignment System**
   - [ ] Check if `assignments` table already exists (from Phase 5.5)
   - [ ] Verify current multi-user assignment support
   - [ ] Review assignment API endpoints

2. **UI Components - ContentCard** (if not already implemented)
   - [ ] Display multiple assigned users as avatar group
   - [ ] Show role labels (e.g., "Editor", "Scriptwriter")
   - [ ] Limit display to 3 avatars + "+X more" indicator

3. **UI Components - CreateCardModal**
   - [ ] Add "Assign Roles" section
   - [ ] Multi-select dropdown for team members
   - [ ] Show role badges for each user
   - [ ] Optional: Allow role-based filtering

4. **UI Components - CardDetailsModal**
   - [ ] Verify "Assign" tab displays all assignments
   - [ ] Ensure role labels are visible
   - [ ] Test add/remove assignment functionality

5. **API Validation**
   - [ ] Test fetching cards with multiple assignments
   - [ ] Verify `assignmentsCount` or similar metadata

#### **Files to Review/Modify:**
- `/frontend/src/lib/db/schema.ts` - Check `assignments` table
- `/frontend/src/components/kanban/ContentCard.tsx` - Multi-avatar display
- `/frontend/src/components/kanban/CreateCardModal.tsx` - Initial assignment
- `/frontend/src/components/assignment/AssignmentPanel.tsx` - Verify exists
- `/frontend/src/lib/api-client.ts` - Check assignment types

---

### **Task 4: Add Status Field**
**Priority**: MEDIUM
**Estimated Time**: 1-2 hours

#### **Background:**
Cards move through stages (Research → Envision → Assemble → Connect → Hone), but may need additional status within a stage (e.g., "In Progress", "Blocked", "Ready for Review").

#### **Subtasks:**
1. **Database Schema Changes**
   - [ ] Add `status` enum: `pgEnum('card_status', ['not_started', 'in_progress', 'blocked', 'ready_for_review', 'completed'])`
   - [ ] Add `status` field to `content_cards` table (default: 'not_started')
   - [ ] Create migration

2. **API Updates**
   - [ ] Update card creation/edit APIs to accept `status`
   - [ ] Add to response types

3. **UI Components - CreateCardModal**
   - [ ] Add "Status" select dropdown (optional field)
   - [ ] Default to "Not Started"

4. **UI Components - ContentCard**
   - [ ] Display status badge (small, subtle)
   - [ ] Color-code statuses:
     - Not Started: Gray
     - In Progress: Blue
     - Blocked: Red
     - Ready for Review: Yellow
     - Completed: Green

5. **UI Components - CardDetailsModal**
   - [ ] Add status field to edit section
   - [ ] Display prominently in details sidebar
   - [ ] Allow quick status changes

#### **Files to Modify:**
- `/frontend/src/lib/db/schema.ts`
- `/frontend/src/app/api/teams/[teamId]/cards/route.ts`
- `/frontend/src/app/api/cards/[cardId]/route.ts`
- `/frontend/src/components/kanban/CreateCardModal.tsx`
- `/frontend/src/components/kanban/ContentCard.tsx`
- `/frontend/src/components/kanban/CardDetailsModal.tsx`

---

### **Task 5: Add Due Window (Instead of Single Due Date)**
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

#### **Background:**
Current implementation shows single `dueDate`. Requirements specify "due window", suggesting a time range (e.g., "Oct 5-7" or "3-5 days").

#### **Subtasks:**
1. **Database Schema Changes**
   - [ ] Add `dueWindowStart` field (timestamp, optional)
   - [ ] Rename or keep `dueDate` as `dueWindowEnd`
   - [ ] Create migration

2. **API Updates**
   - [ ] Update card APIs to accept both `dueWindowStart` and `dueWindowEnd`
   - [ ] Validate that start < end

3. **UI Components - CreateCardModal**
   - [ ] Add "Due Window" section with two date pickers
   - [ ] Label as "Start Date" and "End Date" or "Due By"
   - [ ] Make both optional

4. **UI Components - ContentCard**
   - [ ] Display due window as range (e.g., "Oct 5-7")
   - [ ] If only end date, show single date
   - [ ] If only start date, show "From Oct 5"

5. **UI Components - CardDetailsModal**
   - [ ] Add both date fields to edit section
   - [ ] Display window in details sidebar

#### **Files to Modify:**
- `/frontend/src/lib/db/schema.ts`
- `/frontend/src/app/api/teams/[teamId]/cards/route.ts`
- `/frontend/src/app/api/cards/[cardId]/route.ts`
- `/frontend/src/components/kanban/CreateCardModal.tsx`
- `/frontend/src/components/kanban/ContentCard.tsx`
- `/frontend/src/components/kanban/CardDetailsModal.tsx`

---

### **Task 6: Add Stage-Specific Checklists**
**Priority**: HIGH
**Estimated Time**: 4-5 hours

#### **Background:**
Requirements: "Each stage has its own checklist of deliverables"

This is a more complex feature requiring a checklist system per card that adapts based on the stage.

#### **Subtasks:**
1. **Database Schema Changes**
   - [ ] Create `checklist_templates` table:
     - `id`, `stageId`, `title`, `description`, `position`, `createdAt`
   - [ ] Create `card_checklist_items` table:
     - `id`, `cardId`, `checklistTemplateId`, `title`, `isCompleted`, `completedAt`, `completedBy`, `position`
   - [ ] Create migrations

2. **API Endpoints - Checklist Templates (Admin)**
   - [ ] `GET /api/stages/[stageId]/checklist-templates` - List templates for stage
   - [ ] `POST /api/stages/[stageId]/checklist-templates` - Create template (admin only)
   - [ ] `PUT /api/checklist-templates/[id]` - Update template
   - [ ] `DELETE /api/checklist-templates/[id]` - Delete template

3. **API Endpoints - Card Checklists**
   - [ ] `GET /api/cards/[cardId]/checklist` - Get card's checklist items
   - [ ] `POST /api/cards/[cardId]/checklist` - Add custom item
   - [ ] `PUT /api/cards/[cardId]/checklist/[itemId]` - Toggle completion
   - [ ] Auto-populate checklist when card moves to new stage

4. **Logic - Auto-Populate on Stage Move**
   - [ ] When card moves to new stage, copy stage's checklist templates
   - [ ] Create `card_checklist_items` entries for each template
   - [ ] Preserve existing custom items

5. **UI Components - ChecklistPanel**
   - [ ] Create `ChecklistPanel.tsx` component
   - [ ] Display checklist items with checkboxes
   - [ ] Show completion progress (e.g., "3/5 completed")
   - [ ] Allow adding custom checklist items
   - [ ] Allow toggling completion

6. **UI Components - CardDetailsModal**
   - [ ] Add "Checklist" tab (or integrate into Overview tab)
   - [ ] Display checklist with completion tracking
   - [ ] Show which items are stage-specific vs custom

7. **UI Components - ContentCard**
   - [ ] Display checklist progress indicator (e.g., "3/5 ✓")
   - [ ] Optional: Small progress bar

8. **Seed Data - Default Checklists**
   - [ ] Create default checklist templates for each REACH stage:
     - **Research**: "Identify target audience", "Research competitors", "Define content pillars"
     - **Envision**: "Create script outline", "Define hook", "Set content format"
     - **Assemble**: "Record video/audio", "Edit footage", "Add graphics"
     - **Connect**: "Upload to platform", "Schedule publish", "Notify client"
     - **Hone**: "Track analytics", "Collect feedback", "Document insights"

#### **Files to Create:**
- `/frontend/src/lib/db/schema.ts` - Add tables
- `/frontend/src/lib/db/migrations/XXXX_checklist_system.sql`
- `/frontend/src/app/api/stages/[stageId]/checklist-templates/route.ts`
- `/frontend/src/app/api/cards/[cardId]/checklist/route.ts`
- `/frontend/src/app/api/cards/[cardId]/checklist/[itemId]/route.ts`
- `/frontend/src/components/checklist/ChecklistPanel.tsx`
- `/frontend/src/lib/seeds/checklist-templates-seed.ts`

#### **Files to Modify:**
- `/frontend/src/app/api/cards/[cardId]/move/route.ts` - Auto-populate checklist
- `/frontend/src/components/kanban/CardDetailsModal.tsx` - Add checklist tab
- `/frontend/src/components/kanban/ContentCard.tsx` - Display progress

---

## 📊 **Implementation Priority Recommendation**

### **Phase 1: Critical Card Fields (Days 1-2)**
1. Client Selection (Task 1)
2. Format Field (Task 2)
3. Assigned Roles Review/Enhancement (Task 3)

### **Phase 2: Enhanced Metadata (Day 3)**
4. Status Field (Task 4)
5. Due Window (Task 5)

### **Phase 3: Advanced Features (Days 4-5)**
6. Stage-Specific Checklists (Task 6)

---

## 🧪 **Testing Requirements**

### **For Each Task:**
- [ ] Create new card with new fields
- [ ] Edit existing card fields
- [ ] Verify fields display correctly on Kanban board
- [ ] Verify fields display in card details modal
- [ ] Test with different user roles (permissions)
- [ ] Test database migrations work cleanly
- [ ] Verify API responses include new fields

### **Integration Testing:**
- [ ] Create card with all fields populated
- [ ] Move card between stages (verify data persists)
- [ ] Assign multiple users/roles
- [ ] Test checklist auto-population on stage change
- [ ] Test with real client data

---

## 📝 **Notes & Considerations**

### **Design Questions to Clarify:**
1. **Client Selection**: Should cards be filterable by client? Should client be required or optional?
2. **Format**: Should format affect card behavior (e.g., different checklists for Short vs Long)?
3. **Status**: Should status be stage-specific or universal across all stages?
4. **Due Window**: Is this a hard deadline range or a target window?
5. **Checklists**: Should checklist templates be editable by admins only, or can team leads customize?

### **Potential Dependencies:**
- Client management UI (`/dashboard/clients`) should be functional for client selection
- Assignment system (Phase 5.5) should be fully tested before enhancing
- Permission system should restrict who can edit certain fields (e.g., only admins can change client)

### **Migration Strategy:**
- All new fields should be optional (nullable) initially to avoid breaking existing cards
- Provide default values or migration scripts to populate legacy data
- Test migrations on development database before applying to production

---

## 🚀 **Next Steps**

1. **Review this task document** with project owner
2. **Clarify design questions** listed above
3. **Prioritize tasks** based on business needs
4. **Create detailed implementation plan** for Phase 1
5. **Begin development** starting with Task 1 (Client Selection)

---

**Document Status**: 🟡 **AWAITING REVIEW**
**Last Updated**: October 3, 2025
