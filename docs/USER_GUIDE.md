# Content Reach Hub - User Guide & Manual Testing Guide

**Version**: 1.0
**Last Updated**: October 3, 2025
**Project**: Content Reach Hub (Content OS)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Role-Based Access Guide](#role-based-access-guide)
4. [Manual Testing Guide](#manual-testing-guide)
5. [Feature Testing Checklist](#feature-testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is Content Reach Hub?

Content Reach Hub is a specialized project management system for content creation agencies built around the **REACH workflow**:

- **Research** → **Envision** → **Assemble** → **Connect** → **Hone**

### Core Features

- ✅ **Kanban Board**: Visual workflow with 5 REACH stages
- ✅ **Role-Based Permissions**: 7 specialized roles with stage-specific access
- ✅ **Content Cards**: Rich metadata (client, format, status, due windows)
- ✅ **Stage-Specific Checklists**: Auto-populate tasks on stage transitions
- ✅ **Collaboration**: Comments, @mentions, file attachments
- ✅ **Assignments**: Multi-user task assignment system
- ✅ **Notifications**: Queue-based system with database tracking
- ✅ **Audit Logs**: Complete change history for accountability
- ✅ **User Management**: Admin controls for team members
- ✅ **Client Management**: Dedicated client profiles and workflows

---

## Getting Started

### Test Accounts

The system comes pre-seeded with 6 test users representing different roles:

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@test.local` | `admin123` | Admin | Full system access |
| `strategist@test.local` | `strat123` | Strategist | Comment/approve all stages |
| `scriptwriter@test.local` | `script123` | Scriptwriter | Full: Research + Envision |
| `editor@test.local` | `edit123` | Editor | Full: Assemble + Connect |
| `coordinator@test.local` | `coord123` | Coordinator | Full: Connect + Hone |
| `member@test.local` | `member123` | Member | Basic collaboration access |

**Note**: Use these accounts to test different permission levels.

### First Login

1. **Navigate to**: `http://localhost:3000` (or your VPS IP)
2. **Click**: "Sign In" button
3. **Enter credentials**: Use any test account above
4. **Expected Result**: Redirect to `/dashboard` with Kanban board

---

## Role-Based Access Guide

### Permission Matrix

| Role | Research | Envision | Assemble | Connect | Hone |
|------|----------|----------|----------|---------|------|
| **Admin** | Full | Full | Full | Full | Full |
| **Strategist** | Comment/Approve | Comment/Approve | Comment/Approve | Comment/Approve | Comment/Approve |
| **Scriptwriter** | Full | Full | Read-Only | Read-Only | Read-Only |
| **Editor** | Read-Only | Read-Only | Full | Full | Read-Only |
| **Coordinator** | Read-Only | Read-Only | Read-Only | Full | Full |
| **Member** | Full | Full | Full | Comment/Approve | Read-Only |
| **Client** | None | None | None | Comment/Approve | Read-Only |

### Permission Levels Explained

- **Full**: Create, edit, delete, move cards, assign users, drag-and-drop
- **Comment/Approve**: View cards, add comments, approve/reject content
- **Read-Only**: View cards and comments only (cannot edit)
- **None**: Stage not visible to user

### Role Descriptions

#### 1. Admin (Manager)
- **Purpose**: Oversees all operations, reviews performance
- **Access**: Full access to everything
- **Special Permissions**:
  - User management (create, edit, delete users)
  - Team management
  - Client management
  - Global reassignment
  - View all cards

#### 2. Strategist
- **Purpose**: Approves scripts, edits, and final videos
- **Access**: Comment/approve across all stages
- **Typical Workflow**:
  - Review cards in all stages
  - Leave strategic feedback via comments
  - Approve/reject content at any stage
  - Reassign cards globally

#### 3. Scriptwriter
- **Purpose**: Writes and revises scripts
- **Access**: Full access to Research + Envision stages
- **Typical Workflow**:
  - Create cards in Research stage
  - Move cards from Research → Envision
  - Edit scripts in Envision
  - View other stages (read-only)

#### 4. Editor/Designer
- **Purpose**: Edits videos, designs thumbnails
- **Access**: Full access to Assemble + Connect stages
- **Typical Workflow**:
  - Receive cards in Assemble stage
  - Upload edited videos as attachments
  - Design thumbnails
  - Move cards to Connect for publishing

#### 5. Coordinator
- **Purpose**: Orchestrates workflow, manages handoffs, publishes content
- **Access**: Full access to Connect + Hone stages
- **Typical Workflow**:
  - Manage publishing in Connect stage
  - Schedule content releases
  - Track performance in Hone stage
  - View upstream stages (read-only)

#### 6. Member
- **Purpose**: Basic collaboration across most stages
- **Access**: Full on Research/Envision/Assemble, comment/approve on Connect
- **Typical Workflow**: General team member with broad but not full access

#### 7. Client
- **Purpose**: Review and approve content before publishing
- **Access**: Comment/approve in Connect stage, read-only in Hone
- **Typical Workflow**:
  - Review content in Connect stage
  - Approve/reject content via comments
  - View performance in Hone stage

---

## Manual Testing Guide

### Pre-Testing Setup

**Environment Requirements:**
- Local: `http://localhost:3000`
- VPS Staging: `http://YOUR_VPS_IP:3000`

**Required Services:**
```bash
# Check all services are running
docker compose ps

# Expected services:
# - web (Next.js frontend)
# - db (PostgreSQL)
# - redis (Queue storage)
# - worker (Notification processor)
# - pgadmin (Database admin - optional)
```

---

## Feature Testing Checklist

### 1. Authentication & Authorization

#### Test 1.1: Login with Each Role
**Objective**: Verify all test accounts can log in successfully

**Steps**:
1. Navigate to `http://localhost:3000`
2. For each test account:
   - Enter email and password
   - Click "Sign In"
   - Verify redirect to `/dashboard`
   - Verify user name displayed in header
   - Verify correct navigation menu items

**Expected Results**:
- ✅ All accounts log in successfully
- ✅ Dashboard loads without errors
- ✅ User avatar/name shows in top-right
- ✅ Admin sees "Users" and "Clients" menu items
- ✅ Non-admin users don't see admin menu items

**Test Data**:
```
Admin: admin@test.local / admin123
Strategist: strategist@test.local / strat123
Scriptwriter: scriptwriter@test.local / script123
Editor: editor@test.local / edit123
Coordinator: coordinator@test.local / coord123
Member: member@test.local / member123
```

#### Test 1.2: Permission-Based UI Visibility
**Objective**: Verify read-only stages show "View Only" badge

**Steps**:
1. Log in as **Scriptwriter** (`scriptwriter@test.local`)
2. Observe Kanban board columns
3. Look for "View Only" badges on stages

**Expected Results**:
- ✅ Research: No badge (Full access)
- ✅ Envision: No badge (Full access)
- ✅ Assemble: "View Only" badge visible
- ✅ Connect: "View Only" badge visible
- ✅ Hone: "View Only" badge visible

**Repeat for**:
- Editor (expect badges on Research, Envision, Hone)
- Coordinator (expect badges on Research, Envision, Assemble)

---

### 2. Kanban Board Operations

#### Test 2.1: Create New Card (Admin)
**Objective**: Verify card creation with all metadata fields

**Steps**:
1. Log in as **Admin** (`admin@test.local`)
2. Click "New Card" button in any stage
3. Fill in all fields:
   - **Title**: "Test Video: Top 10 Tech Trends 2025"
   - **Description**: "Comprehensive video covering emerging technologies"
   - **Priority**: High
   - **Format**: Short
   - **Status**: Not Started
   - **Client**: Select "Acme Corporation"
   - **Due Window Start**: Select today's date
   - **Due Window End**: Select date 7 days from now
4. Click "Create Card"

**Expected Results**:
- ✅ Modal closes
- ✅ Card appears in selected stage
- ✅ Card displays:
  - Title: "Test Video: Top 10 Tech Trends 2025"
  - Priority badge (red for High)
  - Format badge: "Short"
  - Client name: "Acme Corporation"
  - Due window: "[Date] - [Date]"
  - Checklist count: "0/4" (auto-populated for stage)
- ✅ Toast notification: "Card created successfully"

#### Test 2.2: Drag and Drop Card (Full Access)
**Objective**: Verify drag-and-drop works for users with full access

**Steps**:
1. Log in as **Scriptwriter** (`scriptwriter@test.local`)
2. Find a card in **Research** stage
3. Drag card to **Envision** stage
4. Release mouse

**Expected Results**:
- ✅ Card moves to Envision stage
- ✅ Card remains visible in new stage
- ✅ Toast notification: "Card moved successfully"
- ✅ Stage transition recorded in audit log
- ✅ Checklist items auto-populated for Envision stage

#### Test 2.3: Drag and Drop Restriction (Read-Only)
**Objective**: Verify drag-and-drop is disabled for read-only stages

**Steps**:
1. Log in as **Scriptwriter** (`scriptwriter@test.local`)
2. Try to drag a card from **Assemble** stage (read-only for scriptwriter)
3. Attempt to drop in another stage

**Expected Results**:
- ✅ Card cannot be dragged (cursor doesn't change to grab)
- ✅ Read-only stages have reduced opacity
- ✅ No drag handle appears on hover

#### Test 2.4: View Card Details
**Objective**: Verify card modal displays all information

**Steps**:
1. Log in as any user
2. Click on any card in the Kanban board
3. Observe card details modal

**Expected Results**:
- ✅ Modal opens with card details
- ✅ Tabs visible: Details, Assignments, Checklist, Comments, Attachments, History
- ✅ Details tab shows:
  - Title (editable if user has permission)
  - Description
  - Priority dropdown
  - Format badge
  - Status dropdown
  - Client name
  - Due window dates
  - Created/Updated timestamps

---

### 3. Stage-Specific Checklists

#### Test 3.1: Auto-Population on Stage Move
**Objective**: Verify checklist items auto-populate when card moves stages

**Steps**:
1. Log in as **Admin**
2. Create a new card in **Research** stage
3. Open card modal → Click **Checklist** tab
4. Note checklist count (should be 4 items for Research)
5. Close modal
6. Drag card from Research → Envision
7. Reopen card → Checklist tab

**Expected Results**:
- ✅ Research stage items: 4 items
  - Define target audience
  - Research competitors
  - Identify content pillars
  - Gather reference materials
- ✅ After moving to Envision: 9 items total (4 Research + 5 Envision)
  - New items added:
    - Create script outline
    - Write hook/intro
    - Define content format
    - Plan visual elements
    - Get script approval
- ✅ Checklist count updates: "0/9"
- ✅ Progress bar reflects new total

#### Test 3.2: Toggle Checklist Item Completion
**Objective**: Verify checklist items can be marked complete/incomplete

**Steps**:
1. Open any card with checklist items
2. Click Checklist tab
3. Click checkbox next to first item
4. Verify item marked complete
5. Click checkbox again to uncheck

**Expected Results**:
- ✅ Checkbox toggles on/off
- ✅ Progress count updates (e.g., "1/9", "2/9")
- ✅ Progress bar fills proportionally
- ✅ Completed item shows:
  - Checkmark icon
  - "Completed by [User Name]"
  - Timestamp ("about X minutes ago")
- ✅ Toast notification: "Checklist item updated"

#### Test 3.3: Add Custom Checklist Item
**Objective**: Verify users can add custom checklist items

**Steps**:
1. Open any card → Checklist tab
2. Type in "Add custom item..." input: "Custom task: Final review"
3. Press Enter or click Add button

**Expected Results**:
- ✅ New item appears in checklist
- ✅ Item has "Custom" badge (blue)
- ✅ Item has delete button (trash icon)
- ✅ Progress count updates to include new item
- ✅ Can mark custom item as complete/incomplete

#### Test 3.4: Delete Custom Checklist Item
**Objective**: Verify custom items can be deleted, template items cannot

**Steps**:
1. Open card with custom checklist item
2. Hover over custom item → Click trash icon
3. Try to find delete button on template items

**Expected Results**:
- ✅ Custom item deleted successfully
- ✅ Toast notification: "Custom checklist item deleted"
- ✅ Progress count updates
- ✅ Template items have no delete button (protected)

---

### 4. Collaboration Features

#### Test 4.1: Add Comment to Card
**Objective**: Verify comment system works

**Steps**:
1. Log in as **Admin**
2. Open any card → **Comments** tab
3. Type comment: "Great work on this content piece!"
4. Click "Post Comment"

**Expected Results**:
- ✅ Comment appears immediately
- ✅ Comment shows:
  - User avatar
  - User name
  - Comment text
  - Timestamp ("a few seconds ago")
- ✅ Comment count badge updates
- ✅ Toast notification: "Comment posted"

#### Test 4.2: @Mention User in Comment
**Objective**: Verify mention system and notifications

**Steps**:
1. Log in as **Admin**
2. Open any card → Comments tab
3. Type: "@" (at symbol)
4. Select user from autocomplete dropdown
5. Complete message: "@Sarah Strategist please review this script"
6. Click "Post Comment"
7. Log out
8. Log in as **Sarah Strategist** (`strategist@test.local`)
9. Check notification bell in header

**Expected Results**:
- ✅ Typing "@" shows user dropdown with all team members
- ✅ Selected user inserted as mention
- ✅ Comment posted with highlighted mention
- ✅ Mentioned user receives notification
- ✅ Notification bell shows count badge (e.g., "1")
- ✅ Clicking notification navigates to card

#### Test 4.3: Upload File Attachment
**Objective**: Verify file upload system

**Steps**:
1. Open any card → **Attachments** tab
2. Click "Upload File" or drag file into dropzone
3. Select test file (image, PDF, or video under 10MB)
4. Wait for upload to complete

**Expected Results**:
- ✅ Upload progress bar displays
- ✅ File appears in attachments list
- ✅ File shows:
  - File name
  - File size
  - Upload date
  - Uploader name
- ✅ Preview available (for images)
- ✅ Download button works
- ✅ Delete button visible (for uploader or admin)

#### Test 4.4: Assign User to Card
**Objective**: Verify assignment system and notifications

**Steps**:
1. Log in as **Admin**
2. Open any card → **Assignments** tab
3. Click "Assign User" dropdown
4. Select **Editor** from list
5. Click "Assign"
6. Log out
7. Log in as **Editor** (`editor@test.local`)
8. Check notifications

**Expected Results**:
- ✅ User added to assignments list
- ✅ User avatar displayed on card (Kanban view)
- ✅ Toast notification: "User assigned successfully"
- ✅ Assigned user receives notification
- ✅ Notification message: "You have been assigned to [Card Title]"
- ✅ Queue processes assignment (check worker logs)

---

### 5. Audit Log System

#### Test 5.1: View Card History
**Objective**: Verify audit log tracks all changes

**Steps**:
1. Open any card that has been edited
2. Click **History** tab
3. Observe timeline of events

**Expected Results**:
- ✅ Timeline displays all events chronologically
- ✅ Events include:
  - Card created
  - Card updated (with field changes)
  - Card moved (stage transitions)
- ✅ Each event shows:
  - Action badge (color-coded)
  - User avatar
  - User name
  - Timestamp ("5 minutes ago")
  - Expandable details

#### Test 5.2: Expand Change Details
**Objective**: Verify field-level change tracking

**Steps**:
1. Open card History tab
2. Find "Card updated" event
3. Click "Show Changes" button
4. Observe before/after values

**Expected Results**:
- ✅ Changed fields listed
- ✅ Old value shown in red with strike-through
- ✅ New value shown in green
- ✅ Multiple field changes displayed together
- ✅ Example format:
  ```
  Title: Old Title → New Title
  Priority: Medium → High
  Status: Not Started → In Progress
  ```

#### Test 5.3: Filter Audit Log
**Objective**: Verify filtering by action type

**Steps**:
1. Open card History tab
2. Click filter dropdown (default: "All Actions")
3. Select "Updated"
4. Observe filtered results

**Expected Results**:
- ✅ Only "Card updated" events shown
- ✅ Other events (created, moved, deleted) hidden
- ✅ Event count updates (e.g., "Showing 3 of 15 events")
- ✅ Filter persists until changed

---

### 6. User Management (Admin Only)

#### Test 6.1: View Users List
**Objective**: Verify admin can view all users

**Steps**:
1. Log in as **Admin** (`admin@test.local`)
2. Click **"Users"** in navigation menu
3. Observe users list

**Expected Results**:
- ✅ Page loads: `/dashboard/users`
- ✅ Table displays all 6 users
- ✅ Columns shown:
  - Name
  - Email
  - Role (with color-coded badge)
  - Created Date
  - Actions (Edit button)
- ✅ Search bar functional
- ✅ Sorting by column works

#### Test 6.2: Edit User Details
**Objective**: Verify admin can update user information

**Steps**:
1. On Users page, click **"Edit"** for "Sarah Strategist"
2. Observe edit page loads: `/dashboard/users/[userId]`
3. Change first name: "Sarah" → "Sara"
4. Click "Save Changes"

**Expected Results**:
- ✅ Edit page loads without 404 error
- ✅ Form displays current user data
- ✅ All fields editable:
  - First Name
  - Last Name
  - Email
  - Role (dropdown with 7 roles)
- ✅ Save button triggers validation
- ✅ Success toast: "User updated successfully"
- ✅ Redirect to `/dashboard/users`
- ✅ User list shows updated name: "Sara Strategist"

#### Test 6.3: Email Uniqueness Validation
**Objective**: Verify system prevents duplicate emails

**Steps**:
1. Edit any user
2. Change email to existing email (e.g., `admin@test.local`)
3. Click "Save Changes"

**Expected Results**:
- ✅ Error message: "Email already in use by another user"
- ✅ Form stays on edit page
- ✅ Error displayed below email field
- ✅ Save button disabled or error toast shown

#### Test 6.4: Self-Edit Protection
**Objective**: Verify admin cannot lock themselves out

**Steps**:
1. Log in as Admin
2. Navigate to Users page
3. Click Edit on own account
4. Try to change role to "Strategist"
5. Try to click Delete button

**Expected Results**:
- ✅ Warning badge: "⚠️ You are editing your own account"
- ✅ Changing own role to non-admin shows error:
  - "Cannot change your own admin role. This would lock you out of the system."
- ✅ Delete button is **disabled** when editing own account
- ✅ Tooltip/warning explains self-deletion prevention

#### Test 6.5: Last Admin Protection
**Objective**: Verify system prevents deletion of last admin

**Scenario**: Only works if there's only one admin
**Steps**:
1. If multiple admins exist, delete all except one
2. Try to delete the last remaining admin

**Expected Results**:
- ✅ Error message: "Cannot delete the last admin user. System requires at least one admin."
- ✅ Delete operation blocked
- ✅ Toast notification shows error

#### Test 6.6: Delete User (Non-Admin)
**Objective**: Verify admin can delete non-admin users

**Steps**:
1. Edit any non-admin user (e.g., Member)
2. Click "Delete User" button
3. Observe confirmation dialog
4. Click "Delete User" in dialog

**Expected Results**:
- ✅ AlertDialog appears with warning
- ✅ Dialog text: "This action cannot be undone. This will permanently delete the user account for [Name]..."
- ✅ Two buttons: "Cancel" and "Delete User"
- ✅ Clicking Delete removes user
- ✅ Toast: "User deleted successfully"
- ✅ Redirect to users list
- ✅ Deleted user no longer appears in list

---

### 7. Client Management

#### Test 7.1: View Clients List
**Objective**: Verify admin can view all clients

**Steps**:
1. Log in as **Admin**
2. Click **"Clients"** in navigation menu
3. Observe clients page

**Expected Results**:
- ✅ Page loads: `/dashboard/clients`
- ✅ Table displays 5 clients:
  - TechVision Media Inc.
  - Acme Corporation
  - Bright Future Media
  - Global Innovations Inc
  - Test New Client Corp
- ✅ Columns displayed:
  - Company Name
  - Industry
  - Contact Email
  - Description
  - Created Date
- ✅ "New Client" button visible
- ✅ Search functionality works
- ✅ Table sorting works

#### Test 7.2: Navigate to Client Dashboard
**Objective**: Verify clicking client switches team context

**Steps**:
1. On Clients page, click **"Acme Corporation"**
2. Observe navigation and dashboard

**Expected Results**:
- ✅ Navigate to: `/dashboard?team=[teamId]`
- ✅ Team selector in header updates to "Acme Corporation"
- ✅ Kanban board displays Acme's cards only
- ✅ URL contains team query parameter

#### Test 7.3: Client Creation (if implemented)
**Objective**: Verify new client creation flow

**Steps**:
1. On Clients page, click "New Client"
2. Fill in client form
3. Submit

**Expected Results**:
- Modal or page for client creation
- Form fields for company info
- Successful creation adds to list

---

### 8. Notification System

#### Test 8.1: Assignment Notification Flow
**Objective**: Verify end-to-end notification pipeline

**Steps**:
1. Log in as **Admin**
2. Open any card → Assignments tab
3. Assign **Editor** to the card
4. Open browser DevTools → Network tab
5. Observe API call to `/api/cards/[id]/assignments`
6. Check worker logs:
   ```bash
   docker compose logs -f worker
   ```
7. Log in as **Editor**
8. Check notification bell

**Expected Results**:
- ✅ Assignment API call returns 200
- ✅ Worker logs show: "Processing notification job [jobId]"
- ✅ Worker logs show: "✅ Successfully processed notification job"
- ✅ Database notification created (check pgAdmin or query)
- ✅ Editor sees notification badge
- ✅ Clicking notification opens card

#### Test 8.2: Queue Monitoring Dashboard
**Objective**: Verify admin can monitor queue health

**Steps**:
1. Log in as **Admin**
2. Navigate to: `/dashboard/admin/queues`
3. Observe queue statistics

**Expected Results**:
- ✅ Page displays queue stats:
  - Waiting jobs
  - Active jobs
  - Completed jobs
  - Failed jobs
  - Delayed jobs
- ✅ Health status indicator (green = healthy)
- ✅ Auto-refresh every 5 seconds
- ✅ Recent job details shown

---

### 9. Card Metadata Fields

#### Test 9.1: Format Badge Display
**Objective**: Verify Short/Long format badge visible on cards

**Steps**:
1. View Kanban board
2. Locate card with format set
3. Observe badge display

**Expected Results**:
- ✅ "Short" badge visible (e.g., blue badge)
- ✅ "Long" badge visible (if applicable)
- ✅ Badge positioned near title or top of card

#### Test 9.2: Client Display on Card
**Objective**: Verify client name displayed on cards

**Steps**:
1. View card with assigned client
2. Check for client name

**Expected Results**:
- ✅ Client name visible (e.g., "Acme Corporation")
- ✅ Positioned below title or in metadata section
- ✅ Icon or styling differentiates client field

#### Test 9.3: Due Window Display
**Objective**: Verify due window range shown on cards

**Steps**:
1. View card with due window set
2. Check date display

**Expected Results**:
- ✅ Due window shown as range: "Dec 22 - Dec 31"
- ✅ Calendar icon visible
- ✅ Overdue cards highlighted (if past end date)

#### Test 9.4: Status Field Visibility
**Objective**: Verify status displayed somewhere on card

**Steps**:
1. View card with status set (e.g., "In Progress")
2. Check for status indicator

**Expected Results**:
- ✅ Status visible (badge, text, or icon)
- ✅ Status reflects current value (Not Started, In Progress, Blocked, Ready for Review, Completed)

---

### 10. Cross-Browser Testing

#### Test 10.1: Browser Compatibility
**Browsers to Test**:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest, macOS)
- ✅ Edge (latest)

**Key Features to Verify**:
- Kanban drag-and-drop
- File upload
- Modal dialogs
- Form validation
- Toast notifications
- Responsive layout (mobile/tablet)

---

## Troubleshooting

### Common Issues

#### Issue 1: 404 Error on Page Load
**Symptoms**: Page shows "404 | This page could not be found"

**Solutions**:
1. Check URL is correct
2. Verify route exists in `/app` directory
3. Clear Next.js cache: `rm -rf .next` and rebuild
4. Check server logs for errors

#### Issue 2: Cannot Login
**Symptoms**: Credentials rejected, "Invalid email or password"

**Solutions**:
1. Verify test account email/password exactly matches seed data
2. Check database connection: `docker compose ps`
3. Verify database has seed data:
   ```bash
   docker compose exec db psql -U postgres -d content_reach_hub -c "SELECT email, role FROM users;"
   ```
4. Re-run seed script if needed

#### Issue 3: Drag and Drop Not Working
**Symptoms**: Cannot drag cards between stages

**Solutions**:
1. Check user has **full access** to source stage
2. Verify dnd-kit library loaded (check console for errors)
3. Test with admin account (should always work)
4. Check browser console for JavaScript errors

#### Issue 4: Notifications Not Appearing
**Symptoms**: No notification badge after assignment

**Solutions**:
1. Check Redis running: `docker compose ps redis`
2. Check worker running: `docker compose ps worker`
3. View worker logs: `docker compose logs -f worker`
4. Check queue stats: Navigate to `/dashboard/admin/queues`
5. Verify REDIS_URL in `.env` file

#### Issue 5: File Upload Fails
**Symptoms**: Upload progress bar appears but file doesn't attach

**Solutions**:
1. Check file size (max 10MB)
2. Verify `/uploads` directory exists and is writable
3. Check disk space on server
4. View server logs: `docker compose logs -f web`

#### Issue 6: Changes Not Persisting
**Symptoms**: Edits save but disappear after refresh

**Solutions**:
1. Check database connection stable
2. Verify no database errors in logs
3. Check API response in Network tab (should return 200)
4. Clear browser cache and cookies

---

## Performance Testing

### Load Testing Scenarios

#### Scenario 1: Concurrent Users
- Simulate 10+ users logged in simultaneously
- Each user performing different actions (create card, add comment, drag-drop)
- Monitor server CPU/memory usage

#### Scenario 2: Large Card Volume
- Create 100+ cards in single team
- Test Kanban board performance (scrolling, drag-drop)
- Monitor database query performance

#### Scenario 3: File Upload Stress Test
- Upload multiple large files (5MB+) concurrently
- Monitor disk I/O and memory usage
- Verify upload queue doesn't overwhelm server

---

## Security Testing

### Security Checklist

- [ ] **Non-admin cannot access admin routes**
  - Try accessing `/dashboard/users` as Member
  - Expected: 403 Forbidden or redirect

- [ ] **Users cannot edit other users' data** (except admin)
  - Try editing another user's profile via API
  - Expected: 403 Forbidden

- [ ] **File upload validation**
  - Try uploading executable file (.exe, .sh)
  - Expected: Rejection with error message

- [ ] **SQL injection prevention**
  - Try malicious input in search fields: `'; DROP TABLE users;--`
  - Expected: Input escaped, no database damage

- [ ] **XSS prevention**
  - Try posting comment with script tag: `<script>alert('XSS')</script>`
  - Expected: Script escaped/sanitized, not executed

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Session Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: Local / Staging / Production
**Browser**: [Chrome/Firefox/Safari/Edge]

### Tests Completed

| Test ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| 1.1 | Login - Admin | ✅ Pass | |
| 1.2 | Permission UI | ✅ Pass | |
| 2.1 | Create Card | ⚠️ Warning | Due window validation missing |
| 2.2 | Drag & Drop | ❌ Fail | Card disappeared after drop |

### Issues Found

1. **[BUG-001] Card disappears after drag-drop**
   - **Severity**: High
   - **Steps to Reproduce**: [Steps]
   - **Expected**: Card moves to new stage
   - **Actual**: Card vanishes
   - **Screenshot**: [Link]

### Summary

- Total Tests: 45
- Passed: 42
- Failed: 2
- Warnings: 1
- Completion: 93%
```

---

## Additional Resources

- **API Documentation**: `/docs/API_REFERENCE.md` (if available)
- **Deployment Guide**: `/docs/VPS_DEPLOYMENT_GUIDE.md`
- **Implementation Roadmap**: `/.claude/tasks/IMPLEMENTATION_ROADMAP.md`
- **Requirements**: `/docs/LIMITLESS_STUDIO_REQUIREMENTS.md`

---

**Document Version**: 1.0
**Last Updated**: October 3, 2025
**Maintained By**: Development Team
