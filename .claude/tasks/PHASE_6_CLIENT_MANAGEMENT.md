# Phase 6: Enhanced Client Management

## Overview
Transform the system from a team-based model to a client-centric project management system with enhanced client profiles, 7-role permission system, and client approval workflows.

**Status**: 🟢 **IN PROGRESS** (Core features implemented)
**Priority**: HIGH (Critical for client requirements alignment)
**Timeline**: 2-3 days
**Time Spent**: 2 hours (database, API, core components complete)
**Dependencies**: Phase 5.5 user management system complete ✅

---

## 🎯 Problem Statement

### Current System
- Basic team structure without client-specific information
- 5 roles (admin, strategist, scriptwriter, editor, coordinator)
- No client profile management
- No dedicated client approval workflows
- Limited brand guidelines storage

### Business Requirements
- **Client-Centric Model**: Each client has their own profile with brand guidelines
- **7-Role System**: Need to add "member" and "client" roles
- **Client Approval Workflow**: Clients need direct access to approve content in Connect stage
- **Brand Guidelines Storage**: Store brand voice, target audience, style guidelines
- **Asset Link Management**: Quick access to client's Dropbox, Drive, Notion assets

---

## 🎯 Goals & Success Criteria

### Functional Requirements
- ✅ Client profiles with comprehensive brand information
- ✅ 7-role permission system (Admin, Strategist, Scriptwriter, Editor, Coordinator, Member, Client)
- ✅ Client approval workflow in Connect stage
- ✅ Brand guidelines accessible to all team members
- ✅ Asset links panel for quick access
- ✅ Client onboarding wizard

### User Experience Requirements
- ✅ Intuitive client onboarding process
- ✅ Clear role-based dashboard views
- ✅ Easy access to client brand guidelines
- ✅ Simple client approval interface
- ✅ Mobile-friendly client dashboard

### Technical Requirements
- ✅ Database schema supports client-centric model
- ✅ API endpoints for client profile management
- ✅ Permission system supports 7 roles
- ✅ Backward compatible with existing data
- ✅ Scalable for multiple clients per agency

---

## 🔧 Implementation Plan

### Task 1: Database Schema Extension (2 hours)

#### 1.1 Extend teams table for client information
**File**: Create `/frontend/src/lib/db/migrations/0003_client_schema.sql`

```sql
-- Add client fields to teams table
ALTER TABLE teams ADD COLUMN client_company_name VARCHAR(200);
ALTER TABLE teams ADD COLUMN industry VARCHAR(100);
ALTER TABLE teams ADD COLUMN contact_email VARCHAR(255);
ALTER TABLE teams ADD COLUMN is_client BOOLEAN DEFAULT FALSE;

-- Create index for client lookups
CREATE INDEX idx_teams_client ON teams(is_client);
```

#### 1.2 Create client_profiles table
**File**: Update `/frontend/src/lib/db/schema.ts`

```typescript
export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),

  // Brand Information
  brandBio: text('brand_bio'),
  brandVoice: text('brand_voice'),
  targetAudience: text('target_audience'),
  contentPillars: jsonb('content_pillars').$type<string[]>(),

  // Style Guidelines
  styleGuidelines: jsonb('style_guidelines').$type<{
    colors: string[];
    fonts: string[];
    tone: string;
    dosDonts: { dos: string[]; donts: string[] };
  }>(),

  // Asset Links
  assetLinks: jsonb('asset_links').$type<{
    dropbox?: string;
    googleDrive?: string;
    notion?: string;
    other?: { name: string; url: string }[];
  }>(),

  // Competitive Analysis
  competitiveChannels: jsonb('competitive_channels').$type<{
    platform: string;
    channelUrl: string;
    notes: string;
  }[]>(),

  // Performance Goals
  performanceGoals: jsonb('performance_goals').$type<{
    views: number;
    engagement: number;
    followers: number;
    timeframe: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### 1.3 Extend user roles enum to 7 roles
**File**: `/frontend/src/lib/db/schema.ts`

```typescript
export const userRoleEnum = pgEnum('user_role', [
  'admin',        // Full system access
  'strategist',   // Approve scripts, edits, final videos
  'scriptwriter', // Research + Envision access
  'editor',       // Assemble + Connect access
  'coordinator',  // Connect + Hone + orchestration
  'member',       // General team collaboration
  'client',       // View/approve in Connect stage only
]);
```

**Migration Commands**:
```bash
npm run db:generate  # Generate migration
npm run db:push      # Apply to database
```

---

### Task 2: Client Profile Management Interface (4 hours)

#### 2.1 Create Client Onboarding Wizard
**File**: `/frontend/src/components/clients/ClientOnboardingWizard.tsx`

**Features**:
- Multi-step form (Company Info → Brand Guidelines → Assets → Goals)
- Progress indicator
- Form validation with Zod
- Save draft functionality
- Review step before submission

**Steps**:
1. **Company Information**
   - Company name
   - Industry
   - Contact email

2. **Brand Guidelines**
   - Brand bio
   - Brand voice
   - Target audience
   - Content pillars

3. **Asset Links**
   - Dropbox link
   - Google Drive link
   - Notion link
   - Other asset links

4. **Performance Goals**
   - View goals
   - Engagement goals
   - Follower goals
   - Timeframe

#### 2.2 Build Client Profile Editor
**File**: `/frontend/src/components/clients/ClientProfileEditor.tsx`

**Features**:
- Edit all client profile fields
- Rich text editor for brand guidelines
- Array fields for content pillars
- Upload brand assets
- Competitive channel management

#### 2.3 Create Client Profile Display Components
**File**: `/frontend/src/components/clients/ClientProfileSidebar.tsx`

**Features**:
- Collapsible sidebar on Kanban board
- Quick access to brand guidelines
- Asset links panel
- Performance goals display
- Competitive channels list

---

### Task 3: 7-Role Permission System (3 hours)

#### 3.1 Update Permission Matrix
**File**: `/frontend/src/lib/permissions.ts`

Add new role permissions:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  // ... existing roles ...

  member: {
    research: 'read_only',
    envision: 'read_only',
    assemble: 'read_only',
    connect: 'read_only',
    hone: 'read_only',
  },

  client: {
    research: 'none',      // Clients don't see ideation
    envision: 'none',
    assemble: 'none',
    connect: 'comment_approve', // Client approval in Connect stage
    hone: 'read_only',     // Can see published performance
  },
};
```

#### 3.2 Create Role-Based Dashboard Views
**File**: `/frontend/src/components/dashboard/RoleBasedDashboard.tsx`

**Features**:
- Filter content by role permissions
- Role-specific navigation menus
- Stage access control by role
- Client-specific simplified view

#### 3.3 Update API Route Permissions
**Files**:
- `/frontend/src/app/api/cards/route.ts`
- `/frontend/src/app/api/cards/[id]/route.ts`
- `/frontend/src/app/api/teams/route.ts`

**Changes**:
- Add role checks for all endpoints
- Filter data based on user role
- Test role transitions

---

### Task 4: Enhanced Team → Client Structure (2 hours)

#### 4.1 Transform Team Management to Client Management
**File**: `/frontend/src/app/dashboard/clients/page.tsx`

**Features**:
- Client list view
- Create new client
- Edit client profile
- View client teams/projects
- Client dashboard access

#### 4.2 Add Client Approval Workflows
**File**: `/frontend/src/components/cards/ClientApprovalPanel.tsx`

**Features**:
- Client access to Connect stage cards
- Approve/Reject buttons
- Client feedback collection
- Approval history tracking
- Notification on approval/rejection

#### 4.3 Create Client-Specific Dashboard
**File**: `/frontend/src/app/dashboard/client-view/page.tsx`

**Features**:
- Simplified UI for clients
- Only show cards awaiting approval
- View published content (Hone stage)
- Performance metrics
- Mobile-friendly interface

---

## 📋 TODO List

### Phase 1: Database Schema ⏳
- [ ] Create migration file for client schema
- [ ] Extend teams table with client fields
- [ ] Create client_profiles table
- [ ] Update user_role enum to 7 roles
- [ ] Run migrations and test

### Phase 2: API Endpoints ⏳
- [ ] `POST /api/clients` - Create new client
- [ ] `GET /api/clients` - List all clients
- [ ] `GET /api/clients/[id]` - Get client profile
- [ ] `PUT /api/clients/[id]` - Update client profile
- [ ] `DELETE /api/clients/[id]` - Delete client
- [ ] `POST /api/clients/[id]/approve` - Client approval action

### Phase 3: Client Profile UI ⏳
- [ ] Build ClientOnboardingWizard component
- [ ] Create ClientProfileEditor component
- [ ] Build ClientProfileSidebar component
- [ ] Create BrandGuidelinesPanel component
- [ ] Build AssetLinksPanel component

### Phase 4: Permission System ⏳
- [ ] Update ROLE_PERMISSIONS with member and client
- [ ] Create client-specific permission checks
- [ ] Update RoleGate component for 7 roles
- [ ] Test all role transitions

### Phase 5: Client Dashboard ⏳
- [ ] Create client list page
- [ ] Build client detail page
- [ ] Create client-specific dashboard
- [ ] Add client approval interface
- [ ] Mobile-friendly design

### Phase 6: Testing ⏳
- [ ] Test client creation and onboarding
- [ ] Test all 7 roles and permissions
- [ ] Test client approval workflow
- [ ] Test brand guidelines access
- [ ] Test asset links functionality
- [ ] Mobile testing for client view

---

## 🧪 Testing Checklist

### Scenario 1: Client Onboarding
- [ ] Admin creates new client
- [ ] Fill out onboarding wizard (all 4 steps)
- [ ] Save client profile
- [ ] Verify client appears in client list
- [ ] Verify client profile data saved correctly

### Scenario 2: 7-Role Permission System
- [ ] Test admin role (full access)
- [ ] Test strategist role (comment/approve all stages)
- [ ] Test scriptwriter role (edit Research/Envision)
- [ ] Test editor role (edit Assemble/Connect)
- [ ] Test coordinator role (edit Connect/Hone)
- [ ] Test member role (read-only all stages)
- [ ] Test client role (approve in Connect, view Hone)

### Scenario 3: Client Approval Workflow
- [ ] Admin moves card to Connect stage
- [ ] Client logs in and sees card
- [ ] Client clicks "Approve" button
- [ ] Verify card status updates
- [ ] Verify notification sent to team
- [ ] Test "Reject" with feedback

### Scenario 4: Brand Guidelines Access
- [ ] Team member opens Kanban board
- [ ] Click on ClientProfileSidebar
- [ ] Verify brand guidelines display
- [ ] Click on asset links
- [ ] Verify links work correctly

### Scenario 5: Client Dashboard (Mobile)
- [ ] Client logs in on mobile device
- [ ] Verify simplified dashboard loads
- [ ] Click on card awaiting approval
- [ ] Approve/reject card
- [ ] View published content

---

## 📊 Database Schema Diagram

```
teams (existing)
├── id
├── name
├── description
├── created_by
├── client_company_name (NEW)
├── industry (NEW)
├── contact_email (NEW)
└── is_client (NEW)

client_profiles (NEW)
├── id
├── team_id → teams.id
├── brand_bio
├── brand_voice
├── target_audience
├── content_pillars (JSONB)
├── style_guidelines (JSONB)
├── asset_links (JSONB)
├── competitive_channels (JSONB)
├── performance_goals (JSONB)
├── created_at
└── updated_at

users (updated)
└── role → user_role enum (7 values)
```

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Client profiles with comprehensive information
- ✅ 7-role permission system working correctly
- ✅ Client approval workflow functional
- ✅ Brand guidelines accessible from Kanban board
- ✅ Asset links working correctly

### User Experience Requirements
- ✅ Intuitive client onboarding (< 5 minutes)
- ✅ Clear role-based dashboard views
- ✅ Simple client approval interface
- ✅ Mobile-friendly client dashboard
- ✅ Quick access to brand guidelines

### Technical Requirements
- ✅ Database migrations run successfully
- ✅ API endpoints respect 7-role permissions
- ✅ No breaking changes to existing functionality
- ✅ Scalable for 50+ clients
- ✅ Performance: Page load < 2 seconds

---

## 🐛 Potential Issues & Solutions

### Issue 1: Breaking Changes to Existing Teams
**Solution**:
- Make new client fields optional
- Add migration to set default values
- Update existing teams gradually

### Issue 2: Client Role Confusion
**Solution**:
- Clear onboarding instructions
- Role-specific help tooltips
- Demo mode for clients

### Issue 3: Brand Guidelines Too Complex
**Solution**:
- Start with MVP fields
- Add advanced fields later
- Provide templates

---

## 🔄 Rollback Plan

If Phase 6 causes issues:

1. Revert database migrations
   ```bash
   npm run db:migrate:down
   ```

2. Restore 5-role permission system in `/lib/permissions.ts`

3. Remove client-specific UI components

4. Test with Phase 5.5 state

**Rollback Time**: ~15 minutes

---

## 📝 Documentation Updates

After implementation:
- [ ] Update API documentation with client endpoints
- [ ] Create user guide for client onboarding
- [ ] Document 7-role permission matrix
- [ ] Add client approval workflow guide
- [ ] Update deployment docs with new migrations

---

## 🚀 Next Steps After Phase 6

### Option A: Phase 7 - AI Orchestration System
Build rule-based monitoring system with time-based alerts.

### Option B: Phase 5.6 - Notification Queue System
Implement Redis queue and Slack integration (if Slack access available).

### Option C: Polish Phase 6
- Add client analytics dashboard
- Build client reporting system
- Add client branding customization

### 💡 Recommendation
**Proceed with Option A (Phase 7)** - AI Orchestration provides immediate value with automated monitoring and alerts.

---

---

## ✅ IMPLEMENTATION PROGRESS (September 30, 2025)

### 🎉 What Was Completed

#### Task 1: Database Schema Extension ✅ DONE
- ✅ Extended teams table with client fields (clientCompanyName, industry, contactEmail, isClient)
- ✅ Created client_profiles table with JSONB fields for brand guidelines, asset links, goals
- ✅ 7-role enum already existed (admin, strategist, scriptwriter, editor, coordinator, member, client)
- ✅ Generated migration file: `0003_certain_cloak.sql`
- ✅ Applied migration successfully to database

#### Task 2: Permission Matrix ✅ DONE
- ✅ 7-role permission matrix already implemented in Phase 5.5
- ✅ All roles have proper access levels defined
- ✅ Client role: No access to ideation, comment_approve in Connect, read-only in Hone

#### Task 3: Client API Endpoints ✅ DONE
- ✅ Created `/api/clients/route.ts` (GET all clients, POST create client)
- ✅ Created `/api/clients/[id]/route.ts` (GET, PUT, DELETE individual client)
- ✅ Auto-creates REACH stages when creating new client
- ✅ Proper admin-only access control
- ✅ Team members can view their client details

#### Task 4: Client Onboarding Wizard ✅ DONE
- ✅ Created `ClientOnboardingWizard.tsx` component
- ✅ 4-step wizard (Company Info → Brand Guidelines → Asset Links → Performance Goals)
- ✅ Form validation with Zod schema
- ✅ Progress indicator
- ✅ Creates client team with profile data

#### Task 5: Client Profile Display ✅ DONE
- ✅ Created `ClientProfileSidebar.tsx` component
- ✅ Displays brand bio, voice, target audience
- ✅ Shows content pillars as badges
- ✅ Asset links with external link icons
- ✅ Performance goals display
- ✅ Collapsible sections for better UX

### 📊 Files Created/Modified

**New Files**:
1. `/frontend/src/app/api/clients/route.ts` - Client list and create endpoints
2. `/frontend/src/app/api/clients/[id]/route.ts` - Individual client endpoints
3. `/frontend/src/components/clients/ClientOnboardingWizard.tsx` - Onboarding wizard
4. `/frontend/src/components/clients/ClientProfileSidebar.tsx` - Profile sidebar
5. `/frontend/src/lib/db/migrations/0003_certain_cloak.sql` - Database migration

**Modified Files**:
1. `/frontend/src/lib/db/schema.ts` - Added client_profiles table, extended teams table

### 📝 What's NOT Done (Pending)

#### 🔜 Client List Page (30 min)
**Status**: NOT STARTED
**File**: `/frontend/src/app/dashboard/clients/page.tsx`
**Features**:
- List all clients with search/filter
- Create new client button
- Edit/delete client actions

#### 🔜 Client Detail Page (1 hour)
**Status**: NOT STARTED
**File**: `/frontend/src/app/dashboard/clients/[id]/page.tsx`
**Features**:
- Full client profile view
- Edit client button
- Team member management
- Client approval workflow integration

#### 🔜 Client Approval Workflow (2 hours)
**Status**: NOT STARTED
**File**: `/frontend/src/components/clients/ClientApprovalPanel.tsx`
**Features**:
- Client-specific view of Connect stage cards
- Approve/reject buttons
- Client feedback collection
- Approval history

#### 🔜 Integration with Kanban Board (1 hour)
**Status**: NOT STARTED
**Changes**:
- Add ClientProfileSidebar to Kanban board layout
- Fetch client profile for current team
- Toggle sidebar visibility

---

## 🎯 NEXT STEPS

### Option A: Complete Phase 6 UI (4 hours remaining)
Build the remaining UI components:
1. Client list page
2. Client detail page
3. Integrate sidebar with Kanban board
4. Client approval workflow

### Option B: Move to Phase 7 - AI Orchestration (Recommended)
Core Phase 6 functionality is complete:
- ✅ Database schema supports client-centric model
- ✅ API endpoints functional
- ✅ Onboarding wizard ready
- ✅ Profile display component built

The remaining work is UI integration, which can be done as needed. Phase 7 (AI Orchestration) provides more immediate value with automated monitoring.

### 💡 Recommendation

**Proceed with Option A** - Complete the UI integration since we're close to finishing Phase 6. The client management pages are needed for admins to effectively manage clients.

Estimated remaining time: **4 hours**

---

**Created**: 2025-09-30
**Last Updated**: 2025-09-30 (Implementation Progress Added)
**Related**: Phase 5.5 (User Management & Permissions), IMPLEMENTATION_ROADMAP.md
**Next Phase**: Phase 7 (AI Orchestration System) after UI completion