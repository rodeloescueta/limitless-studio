# Next Priority Tasks Summary

**Created**: October 3, 2025
**Status**: 📋 **PLANNING**
**Based on**: IMPLEMENTATION_ROADMAP.md analysis + Current system gaps

---

## 🎯 **Roadmap Next Priorities (from IMPLEMENTATION_ROADMAP.md)**

According to the roadmap, the planned order is:

### **1. 🚀 VPS Staging Deployment** ⏭️ **PLANNED NEXT**
   - Deploy to VPS staging environment
   - Test Docker Compose production setup
   - Verify all services (PostgreSQL, Redis, Worker, Frontend)
   - Configure Nginx reverse proxy
   - Test end-to-end in staging

### **2. 💬 Slack Notification Integration** ⏸️ **WAITING**
   - Update worker service with Slack webhook URL
   - Test assignment notification → Slack
   - Test @mention notification → Slack
   - Verify retry logic for failed Slack messages

### **3. ✅ Phase 6 Client Management Testing**
   - Navigate to `/dashboard/clients` and verify UI
   - Test client creation workflow
   - Test client profile editing
   - Verify 7-role permission system
   - Test client approval workflows

---

## 🔴 **Critical Gaps Discovered (BLOCKING ISSUES)**

Based on user testing, these critical features are **missing** and should be prioritized:

### **Issue 1: User Edit Functionality - 404 Error** 🚨 **CRITICAL**
**Status**: ❌ **NOT IMPLEMENTED**
**Discovered**: October 3, 2025
**Impact**: Admin cannot edit user records

**Problem**:
- User management page (`/dashboard/users`) displays all users ✅
- "Edit" button exists and navigates to `/dashboard/users/[userId]` ❌
- **Route returns 404** - page does not exist
- No API endpoint for updating user records

**Required**:
- [ ] Create `/dashboard/users/[userId]/page.tsx` - User edit page
- [ ] Create `/api/users/[userId]/route.ts` - GET, PUT, DELETE endpoints
- [ ] Form to edit: firstName, lastName, email, role
- [ ] Email uniqueness validation
- [ ] Role dropdown with all 7 roles
- [ ] Admin-only access control
- [ ] Audit log for user updates

**Reference**: See `USER_MANAGEMENT_EDIT_FEATURE.md` for full implementation plan
**Estimated Time**: 3-4 hours
**Priority**: **HIGH** - Blocking admin workflows

---

### **Issue 2: Role Permissions Documentation Mismatch** ⚠️ **VERIFICATION NEEDED**

**Reference Image**: User provided role permissions table showing:

| Role | Description | Permissions |
|------|-------------|-------------|
| Admin / Manager | Oversees all operations, reviews performance | Full access |
| Strategist | Approves scripts, edits, and final videos | Approve, comment, reassign |
| Scriptwriter | Writes and revises scripts | Access Research + Envision |
| Editor / Designer | Edits videos, designs thumbnails | Access Assemble + Connect |
| Coordinator | Orchestrates end-to-end workflow, manages handoffs, ensures timeline adherence, publishes content | Research/Envision/Assemble: Read-only - Connect/Hone: Full access |
| AI System | Acts as project manager | Alert, escalate, track |

**Current Implementation** (`/frontend/src/lib/permissions.ts`):

```typescript
const PERMISSION_MATRIX: Record<UserRole, Record<StageName, PermissionLevel>> = {
  admin: { research: 'full', envision: 'full', assemble: 'full', connect: 'full', hone: 'full' },
  strategist: { research: 'comment_approve', envision: 'comment_approve', assemble: 'comment_approve', connect: 'comment_approve', hone: 'comment_approve' },
  scriptwriter: { research: 'full', envision: 'full', assemble: 'read_only', connect: 'read_only', hone: 'read_only' },
  editor: { research: 'read_only', envision: 'read_only', assemble: 'full', connect: 'full', hone: 'read_only' },
  coordinator: { research: 'read_only', envision: 'read_only', assemble: 'read_only', connect: 'full', hone: 'full' },
  member: { research: 'full', envision: 'full', assemble: 'full', connect: 'comment_approve', hone: 'read_only' },
  client: { research: 'none', envision: 'none', assemble: 'none', connect: 'comment_approve', hone: 'read_only' },
}
```

**Comparison**:

✅ **Admin**: Matches (Full access everywhere)
✅ **Strategist**: Matches (Comment/approve all stages)
✅ **Scriptwriter**: Matches (Research + Envision full, others read-only)
✅ **Editor**: Matches (Assemble + Connect full, others read-only)
✅ **Coordinator**: Matches (Connect + Hone full, Research/Envision/Assemble read-only)
❓ **Member**: Not in requirements doc (appears to be extra role)
✅ **Client**: Matches (Connect comment/approve, Hone read-only)

**Verification Needed**:
- [ ] Confirm "member" role is intentional or should be removed
- [ ] Document "member" role permissions if intentional
- [ ] Update role descriptions on users page to match requirements doc exactly

**Priority**: MEDIUM - System works but documentation should align

---

## 📊 **Recommended Priority Order**

Based on criticality and business impact:

### **IMMEDIATE (This Week)**

1. **🔴 Fix User Edit 404 Issue** (3-4 hours)
   - Critical blocker for admin workflows
   - Required for managing team members
   - Task document: `USER_MANAGEMENT_EDIT_FEATURE.md`

2. **✅ Verify Role Permissions Implementation** (1 hour)
   - Test each role's stage access
   - Ensure Kanban board respects permissions
   - Verify read-only stages show "View Only" badge
   - Document "member" role purpose

### **SHORT-TERM (Next 1-2 Weeks)**

3. **🧪 Phase 6 Client Management Testing** (2-3 hours)
   - Test `/dashboard/clients` page
   - Verify client creation workflow
   - Test client approval workflows
   - Document findings

4. **🚀 VPS Staging Deployment** (1-2 days)
   - Deploy to staging environment
   - Test Docker Compose setup
   - Configure Nginx
   - End-to-end testing

### **MEDIUM-TERM (After Deployment)**

5. **💬 Slack Integration** (2-3 hours)
   - Waiting for webhook access
   - Update worker service
   - Test notifications

6. **📈 Analytics & Monitoring** (Future phase)
   - Performance tracking
   - ROAC metrics
   - Reporting dashboard

---

## 🛠️ **Implementation Tasks Created**

### **Task Files**:
1. ✅ `USER_MANAGEMENT_EDIT_FEATURE.md` - Complete implementation plan for user edit functionality
2. ✅ `NEXT_PRIORITY_TASKS_SUMMARY.md` - This document (overview and planning)

### **Remaining Task Files to Create**:
3. [ ] `ROLE_PERMISSIONS_VERIFICATION.md` - Test plan for role-based permissions
4. [ ] `CLIENT_MANAGEMENT_TESTING.md` - Test plan for Phase 6 client features
5. [ ] `VPS_DEPLOYMENT_PLAN.md` - Deployment checklist and configuration guide

---

## 📅 **Timeline Estimate**

| Task | Estimated Time | Priority | Dependencies |
|------|---------------|----------|--------------|
| User Edit Feature | 3-4 hours | 🔴 CRITICAL | None |
| Role Permissions Verification | 1 hour | ⚠️ MEDIUM | None |
| Client Management Testing | 2-3 hours | 🟡 HIGH | None |
| VPS Deployment | 1-2 days | 🟢 PLANNED | Above complete |
| Slack Integration | 2-3 hours | 🔵 WAITING | Webhook access |

**Total Before Deployment**: ~6-8 hours (1 working day)

---

## 🎯 **Success Metrics**

### **User Management**
- [ ] Admin can edit all user fields (firstName, lastName, email, role)
- [ ] Email uniqueness validation working
- [ ] Changes save successfully and persist
- [ ] Audit log captures user updates
- [ ] Non-admin users cannot access edit page

### **Role Permissions**
- [ ] Each role sees correct stages (full pipeline visibility)
- [ ] Read-only stages show "View Only" badge
- [ ] Drag-and-drop restricted to full-access stages
- [ ] Comments/approval restricted per role
- [ ] No unexpected 403 errors

### **Client Management**
- [ ] Client creation workflow functional
- [ ] Client profiles editable
- [ ] Client approval workflow in Connect stage works
- [ ] 7-role system supports client role correctly

---

## 📝 **Notes for User**

Based on your roadmap and current system state:

1. **Top Priority**: Fix the user edit 404 issue - this is blocking your admin workflows right now
2. **Quick Win**: Verify role permissions are working as expected (looks good in code)
3. **Before Deployment**: Complete user management and test client features
4. **Then Deploy**: VPS staging deployment after core features are solid

The system is at **95% completion** according to roadmap. The user edit feature is a critical gap that should be addressed before moving to deployment phase.

**Recommended Next Action**: Start with `USER_MANAGEMENT_EDIT_FEATURE.md` implementation (3-4 hours)

---

**Last Updated**: October 3, 2025
**Created By**: Claude Code
**Based On**: IMPLEMENTATION_ROADMAP.md + User testing feedback
