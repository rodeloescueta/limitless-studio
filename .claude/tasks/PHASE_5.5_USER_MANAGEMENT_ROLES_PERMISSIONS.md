# Phase 5.5: User Management & Role-Based Permissions

## Overview
Implement sophisticated user management system with business-aligned roles, stage-based permissions, multi-user assignments, and MVP notification system. This phase transforms the basic admin/member system into a professional collaboration platform matching real-world content agency workflows.

## 🎯 **Phase 5.5 Goals**
**Duration**: 1.5-2 days
**Status**: 🟡 **READY TO START**

Transform basic user system into sophisticated role-based collaboration platform with:
- **5 Business Roles** with stage-specific permissions ✅ **CORE REQUIREMENT**
- **Multi-User Assignment System** with role-based restrictions ✅ **CORE REQUIREMENT**
- **MVP Notification System** with direct database writes ✅ **MVP APPROACH**
- **Stage-Based Access Control** across REACH workflow ✅ **CORE REQUIREMENT**
- **Comprehensive Testing Environment** with 5 test users ✅ **ESSENTIAL**

---

## 🏗️ **Business Requirements Alignment**

### **Original Role Specifications**
From `docs/Limitless Studio System - APP.md`:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin / Manager** | Oversees all operations, reviews performance | Full access |
| **Strategist** | Approves scripts, edits, and final videos | Approve, comment, reassign |
| **Scriptwriter** | Writes and revises scripts | Access Research + Envision |
| **Editor / Designer** | Edits videos, designs thumbnails | Access Assemble + Connect |
| **Coordinator** | Orchestrates end-to-end workflow, manages handoffs between stages, ensures timeline adherence. Publishes content, attaches live links, tracks data | Research/Envision/Assemble: Read-only (can see progress, cannot edit) - Connect/Hone: Full access (manage publishing, analytics) - Global: Can reassign tasks, send reminders, update timelines |

**Note**: Skipping AI System and Client roles for Phase 5.5 (will be added in Phase 6)

---

## 🔐 **Permission Matrix Implementation**

### **REACH Workflow Stage Permissions**

| Role | Research | Envision | Assemble | Connect | Hone | Global Actions |
|------|----------|----------|----------|---------|------|----------------|
| **Admin** | Full | Full | Full | Full | Full | All actions, user management |
| **Strategist** | Comment, Approve | Comment, Approve | Comment, Approve | Comment, Approve | Comment, Approve | Reassign, comment on any card |
| **Scriptwriter** | Full | Full | None | None | None | Comment only, limited reassign |
| **Editor** | None | None | Full | Full | None | Comment only, limited reassign |
| **Coordinator** | Read-only | Read-only | Read-only | Full | Full | Reassign, timeline management, global view |

### **Permission Levels Definition**
- **Full**: Create, edit, delete, move cards, assign users, manage content
- **Comment, Approve**: View cards, add comments, approve/reject content, cannot edit
- **Read-only**: View cards and comments, cannot edit or comment
- **None**: Cannot access stage at all

---

## 🛠️ **Implementation Plan**

### **Phase 1: Database Schema & Authentication (4-6 hours)**

#### **1.1 Extend User Role System**
```sql
-- Update user role enum
ALTER TYPE user_role ADD VALUE 'strategist';
ALTER TYPE user_role ADD VALUE 'scriptwriter';
ALTER TYPE user_role ADD VALUE 'editor';
ALTER TYPE user_role ADD VALUE 'coordinator';

-- Final enum: ['admin', 'member', 'client', 'strategist', 'scriptwriter', 'editor', 'coordinator']
```

#### **1.2 Create Test Users**
```typescript
// Test user accounts for each role
const testUsers = [
  { email: 'admin@test.local', role: 'admin', name: 'Admin Manager' },
  { email: 'strategist@test.local', role: 'strategist', name: 'Sarah Strategist' },
  { email: 'scriptwriter@test.local', role: 'scriptwriter', name: 'Sam Writer' },
  { email: 'editor@test.local', role: 'editor', name: 'Emma Editor' },
  { email: 'coordinator@test.local', role: 'coordinator', name: 'Chris Coordinator' }
]
```

#### **1.3 Update Authentication System**
- Replace hardcoded admin authentication with database-driven system
- Create user seeder script for test environment
- Update NextAuth configuration for multiple users
- Add role-based session management

### **Phase 2: Assignment System (6-8 hours)**

#### **2.1 Assignment API Endpoints**
```typescript
// API Routes to implement
POST /api/cards/[cardId]/assignments
  - Assign multiple users to card with roles
  - Role-based permission checking
  - Auto-notification generation

GET /api/cards/[cardId]/assignments
  - List card assignments with user details
  - Role-based filtering
  - Assignment history tracking

DELETE /api/assignments/[assignmentId]
  - Remove assignments (permission-controlled)
  - Notification generation
  - Assignment history update
```

#### **2.2 Assignment UI Components**
```typescript
// Components to build
AssignmentPanel.tsx
  - Multi-user selection interface
  - Role-based user filtering
  - Due date setting
  - Assignment role selection

AssigneeList.tsx
  - Display assigned users with avatars
  - Show assignment roles and due dates
  - Quick unassign functionality
  - Assignment status indicators

UserPicker.tsx
  - Search and select team members
  - Filter by role permissions for current stage
  - Role-appropriate assignment options
  - Real-time user availability
```

#### **2.3 React Query Integration**
```typescript
// Hooks to implement
useCardAssignments(cardId)
  - Fetch card assignments with caching
  - Real-time updates on assignment changes
  - Role-based data filtering

useAssignUser()
  - Optimistic assignment updates
  - Permission validation
  - Auto-notification triggering

useUnassignUser()
  - Assignment removal with confirmation
  - Optimistic UI updates
  - Cleanup notifications
```

### **Phase 3: MVP Notification System (4-6 hours)**

#### **3.1 Notification Database Usage**
```sql
-- Use existing notifications table (already in schema)
-- Focus on core notification types for MVP
INSERT INTO notifications (user_id, type, title, message, related_card_id)
VALUES (...);
```

#### **3.2 Notification API Endpoints**
```typescript
// MVP API implementation
GET /api/users/[userId]/notifications
  - Fetch user notifications with pagination
  - Mark notifications as read automatically
  - Role-based notification filtering

POST /api/notifications/[notificationId]/read
  - Individual notification read status
  - Update timestamps
  - Analytics tracking

POST /api/notifications/mark-all-read
  - Bulk mark as read functionality
  - Efficient database updates
  - User experience optimization
```

#### **3.3 Notification UI Components**
```typescript
// MVP UI Components
NotificationDropdown.tsx
  - Header notification bell with count
  - Dropdown list of recent notifications
  - Mark as read functionality
  - Link to related cards/comments

NotificationItem.tsx
  - Individual notification display
  - User avatar and action description
  - Timestamp and read status
  - Quick action buttons
```

#### **3.4 Notification Triggers (MVP)**
```typescript
// Auto-generate notifications for:
- Card assignments (immediate DB write)
- @mentions in comments (immediate DB write)
- Due date reminders (basic implementation)
- Stage transitions (when applicable)
- Assignment changes/removals

// Note: Advanced scheduling and Slack integration deferred to Phase 5.6
```

### **Phase 4: Permission System Implementation (3-4 hours)**

#### **4.1 Permission Middleware & Utilities**
```typescript
// Core permission functions
hasStageAccess(userRole: string, stageName: string, action: string): boolean
  - Check if user role can perform action on stage
  - Implement permission matrix logic
  - Return boolean for access control

canEditCard(user: User, card: ContentCard): boolean
  - Card-level permission checking
  - Consider card stage and user role
  - Handle special cases (assignments, ownership)

canAssignUsers(user: User, targetStage: string): boolean
  - Check if user can assign others to specific stage
  - Role-based assignment restrictions
  - Global assignment permissions for coordinators/admins
```

#### **4.2 API Route Protection**
```typescript
// Update all API routes with permission checks
/api/cards/[cardId] - GET/PUT/DELETE
  - Check stage access permissions
  - Filter data based on user role
  - Restrict edit capabilities

/api/cards/[cardId]/assignments - POST
  - Validate assignment permissions
  - Check target user stage access
  - Ensure role compatibility

/api/cards/[cardId]/comments - POST/PUT/DELETE
  - Allow comments based on stage access
  - Restrict editing to comment authors + admins
  - Honor read-only permissions
```

#### **4.3 UI Permission Controls**
```typescript
// Component permission integration
<RoleGate role={user.role} stage={card.stage} action="edit">
  <EditCardButton />
</RoleGate>

// Conditional rendering based on permissions
{hasStageAccess(user.role, card.stage, 'comment') && (
  <CommentSection cardId={card.id} />
)}

// Assignment UI restrictions
{canAssignUsers(user, card.stage) && (
  <AssignmentPanel cardId={card.id} />
)}
```

### **Phase 5: CardDetailsModal Integration (2-3 hours)**

#### **5.1 Modal Updates**
```typescript
// Add assignments section to Overview tab
- Display current assignees with avatars and roles
- Show assignment due dates and status
- Quick assignment actions for authorized users

// Permission-based tab access
- Hide/disable tabs based on user role and stage
- Show read-only indicators where appropriate
- Contextual help for permission restrictions
```

#### **5.2 Visual Role Indicators**
```typescript
// UI enhancements
- Role badges on user avatars
- Stage access indicators in navigation
- Permission-based button states (enabled/disabled)
- Contextual tooltips explaining restrictions
```

---

## 🧪 **Testing Strategy**

### **Multi-User Testing Scenarios**

#### **Test User Workflows**
1. **Scriptwriter (Sam)**:
   - Can access Research and Envision stages only
   - Cannot see Assemble, Connect, or Hone stages
   - Can be assigned to cards in Research/Envision
   - Receives notifications for assignments and @mentions

2. **Editor (Emma)**:
   - Can access Assemble and Connect stages only
   - Cannot see Research, Envision, or Hone stages
   - Can edit cards and upload files in accessible stages
   - Receives assignment notifications

3. **Coordinator (Chris)**:
   - Read-only access to Research, Envision, Assemble
   - Full access to Connect and Hone stages
   - Can reassign cards between stages
   - Can view all cards but edit only in permitted stages

4. **Strategist (Sarah)**:
   - Can view all stages (comment/approve mode)
   - Cannot directly edit content
   - Can approve/reject cards and provide feedback
   - Can reassign cards to other users

5. **Admin (Manager)**:
   - Full access to all stages and functions
   - Can manage users and permissions
   - Can override any restrictions
   - Receives all system notifications

### **Permission Boundary Testing**

#### **Security Validation**
- Attempt to access restricted API endpoints with different user roles
- Verify UI elements hide/show correctly based on permissions
- Test direct URL navigation to restricted areas
- Validate assignment restrictions (can't assign users to inaccessible stages)

#### **Edge Cases**
- User role changes while logged in
- Card moves between stages with different permission sets
- Assignment conflicts (user assigned to inaccessible stage)
- Notification permissions and filtering

### **Collaboration Workflow Testing**

#### **End-to-End Scenarios**
1. **Content Creation Workflow**:
   - Scriptwriter creates card in Research
   - Coordinator moves to Envision for scripting
   - Editor takes over in Assemble for production
   - Strategist approves in Connect
   - Coordinator publishes and tracks in Hone

2. **Assignment and Handoff**:
   - Admin assigns Scriptwriter to new Research card
   - Scriptwriter completes work and notifies team
   - Coordinator reassigns to Editor for Assemble stage
   - Editor uploads files and marks complete
   - Strategist reviews and approves final content

3. **Notification Flow**:
   - @mentions trigger notifications to appropriate users
   - Assignment notifications reach correct team members
   - Due date reminders function properly
   - Read/unread status tracks correctly

---

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ 5 business roles implemented with correct stage permissions
- ✅ Multi-user assignment system working with role restrictions
- ✅ In-app notification system delivering relevant alerts
- ✅ Permission boundaries enforced in both UI and API
- ✅ Test environment with 5 functional user accounts
- ✅ Assignment workflows operating smoothly across roles

### **Technical Requirements**
- ✅ Database schema extended for new roles without breaking changes
- ✅ Authentication system supports multiple users reliably
- ✅ API endpoints protected with proper permission checking
- ✅ React components respect role-based access controls
- ✅ Notification system scales with user activity
- ✅ Performance remains good with multiple users and permissions

### **User Experience Requirements**
- ✅ Role-based interface feels intuitive and natural
- ✅ Permission restrictions are clear and helpful (not frustrating)
- ✅ Assignment process is streamlined and efficient
- ✅ Notifications are relevant and actionable
- ✅ Multi-user collaboration enhances productivity
- ✅ Professional appearance suitable for business use

---

## 🚧 **Implementation Notes**

### **MVP Approach Rationale**
- **Direct Database Notifications**: Faster implementation, immediate functionality
- **No Queue System Initially**: Reduces complexity while maintaining core value
- **Business Role Focus**: Addresses primary user needs without over-engineering
- **Clear Upgrade Path**: Queue system architecture documented for Phase 5.6

### **Security Considerations**
- **Permission Validation**: Double-check permissions in both frontend and backend
- **Role Transition**: Handle role changes gracefully without security gaps
- **Assignment Security**: Validate all assignments respect stage access rules
- **Session Management**: Ensure role changes invalidate appropriate sessions

### **Performance Optimizations**
- **Permission Caching**: Cache role permissions to avoid repeated calculations
- **Selective Data Loading**: Only load data user has permission to access
- **Efficient Queries**: Optimize database queries for role-based filtering
- **UI Lazy Loading**: Load assignment and notification data as needed

### **Future Scalability Considerations**
- **Queue System Integration**: Phase 5.6 will add Redis-based notification queue
- **Advanced Permissions**: Foundation ready for more granular permission system
- **Client Role Addition**: Phase 6 will add client role with approval workflows
- **Audit Trail**: Assignment and permission changes tracked for compliance

---

## 🏁 **Phase 5.5 Deliverables**

### **Core Systems Delivered**
1. **Extended Authentication System** - 5 business roles with test users
2. **Assignment Management Platform** - Multi-user assignments with role restrictions
3. **MVP Notification System** - In-app alerts for key collaboration events
4. **Stage-Based Permission Engine** - Complete access control across REACH workflow
5. **Professional Testing Environment** - Comprehensive multi-role testing setup

### **Enhanced UI Components**
- Assignment panels with role-based user selection
- Notification dropdown with real-time updates
- Permission-aware navigation and controls
- Role indicators and access level visualization
- Professional collaboration interface

### **API Infrastructure**
- Assignment CRUD with comprehensive permission checking
- Notification delivery with role-based filtering
- Permission validation middleware for all routes
- User management endpoints for test environment
- Role-based data access controls

### **Database Foundation**
- Extended user role system with 5 business roles
- Assignment tracking with role and permission metadata
- Notification system with targeted delivery
- Permission audit trail for security compliance
- Test user data for development and validation

---

## 🔄 **Phase 6 Preparation**

### **Ready for Client Management**
- Role system foundation ready for client role addition
- Permission engine can accommodate client-specific restrictions
- Assignment system ready for client approval workflows
- Notification infrastructure prepared for client communications

### **Technical Debt Addressed**
- Authentication system now scalable and maintainable
- Permission logic centralized and reusable
- UI components follow consistent permission patterns
- Database design supports advanced features

---

## 📋 **Getting Started Checklist**

### **Pre-Implementation Setup**
- [ ] Review business role requirements and permission matrix
- [ ] Plan database migration strategy for new roles
- [ ] Set up test user accounts and credentials
- [ ] Design permission checking architecture
- [ ] Plan UI component integration approach

### **Development Environment**
- [ ] Extend database schema with new user roles
- [ ] Create test user seeder script
- [ ] Update authentication configuration
- [ ] Set up permission validation utilities
- [ ] Prepare notification system integration

### **Team Coordination**
- [ ] Define role transition and assignment policies
- [ ] Establish permission checking standards
- [ ] Plan multi-user testing approach
- [ ] Set up collaboration workflow validation
- [ ] Prepare user role documentation

---

*Phase 5.5 will transform the Content Reach Hub from basic collaboration tool into sophisticated multi-role platform, enabling professional content agency workflows with proper access controls, assignment management, and team coordination.*

---

## 📊 **Current Status**

**Phase Status**: 🟡 **READY TO START**
**Dependencies**: Phase 5 collaboration features (Comments ✅, File Upload ✅)
**Next Steps**: Begin database schema extension and test user creation
**Estimated Completion**: 1.5-2 days from start
**Success Metrics**: 5 test users, role-based permissions, assignment workflows, MVP notifications

*This implementation will provide immediate business value while maintaining clear architecture for advanced features in Phase 5.6 and beyond.*