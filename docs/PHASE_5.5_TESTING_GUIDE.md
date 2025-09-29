# Phase 5.5 Testing Guide - User Management & Role-Based Permissions

## Overview
This document provides comprehensive testing information for the Phase 5.5 User Management & Role-Based Permissions system. Use this guide to verify functionality before proceeding to the next phase.

---

## 🔐 **Test User Credentials**

### **Access Information**
- **Application URL**: http://localhost:3000
- **Authentication**: Database-driven with bcrypt password hashing
- **Session Management**: NextAuth.js with JWT tokens

### **Test User Accounts**

| Role | Name | Email | Password | Access Level |
|------|------|-------|----------|--------------|
| **Admin** | Admin Manager | `admin@test.local` | `admin123` | Full access to all stages and functions |
| **Strategist** | Sarah Strategist | `strategist@test.local` | `strategist123` | Comment/Approve access across all stages |
| **Scriptwriter** | Sam Writer | `scriptwriter@test.local` | `scriptwriter123` | Full access to Research & Envision only |
| **Editor** | Emma Editor | `editor@test.local` | `editor123` | Full access to Assemble & Connect only |
| **Coordinator** | Chris Coordinator | `coordinator@test.local` | `coordinator123` | Read-only on Research/Envision/Assemble, Full on Connect/Hone |

### **Legacy Credentials (Deprecated)**
- Email: `admin@contentreach.local`
- Password: `7ba42eee`
- **Note**: These are old hardcoded credentials, replaced by database system

---

## 🔌 **API Endpoints Reference**

### **Authentication APIs**
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/callback/credentials` - Login with credentials
- `POST /api/auth/signout` - Logout user
- `GET /api/auth/csrf` - Get CSRF token

### **User Management APIs**
- `GET /api/users/me` - Get current user profile
- `GET /api/users/[userId]/notifications` - Get user notifications
- `GET /api/users/[userId]/notifications?unread=true` - Get unread notifications

### **Team Management APIs**
- `GET /api/users/me/teams` - Get user's teams
- `GET /api/teams/[teamId]/members` - Get team members
- `GET /api/teams/[teamId]/stages` - Get team workflow stages

### **Card Management APIs**
- `GET /api/cards/[cardId]` - Get card details (permission-based)
- `PUT /api/cards/[cardId]` - Update card (permission-based)
- `DELETE /api/cards/[cardId]` - Delete card (permission-based)
- `GET /api/teams/[teamId]/cards` - Get team cards
- `POST /api/teams/[teamId]/cards` - Create new card

### **Assignment APIs**
- `GET /api/cards/[cardId]/assignments` - Get card assignments
- `POST /api/cards/[cardId]/assignments` - Assign user to card
- `DELETE /api/assignments/[assignmentId]` - Remove assignment

### **Notification APIs**
- `POST /api/notifications/[notificationId]/read` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all notifications as read

---

## 🧪 **Testing Functions & Scenarios**

### **✅ Authentication System Testing**

#### **Already Tested with Playwright**
- [x] **Database Authentication**: Login with all 5 test user accounts
- [x] **Session Management**: User sessions persist correctly across page refreshes
- [x] **Password Security**: Bcrypt hashing validated
- [x] **Logout Functionality**: Clean session termination

#### **Manual Testing Steps**
1. Navigate to http://localhost:3000
2. Try logging in with each test user credential
3. Verify proper dashboard access and role indicators
4. Test logout and re-login functionality

### **✅ Role-Based Permission Testing**

#### **Already Tested with Playwright**
- [x] **Permission Matrix**: 5-role × 5-stage access combinations validated
- [x] **UI Access Controls**: Role-based component rendering
- [x] **API Security**: Permission boundaries enforced at API level
- [x] **Stage Access**: Users can only access appropriate workflow stages

#### **Manual Testing Matrix**

| User Role | Research | Envision | Assemble | Connect | Hone | Can Create Cards | Can Assign Users |
|-----------|----------|----------|----------|---------|------|------------------|------------------|
| **Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ All stages | ✅ All users |
| **Strategist** | ✅ Comment/Approve | ✅ Comment/Approve | ✅ Comment/Approve | ✅ Comment/Approve | ✅ Comment/Approve | ❌ No | ✅ Yes |
| **Scriptwriter** | ✅ Full | ✅ Full | ❌ No access | ❌ No access | ❌ No access | ✅ Research/Envision | ✅ Limited |
| **Editor** | ❌ No access | ❌ No access | ✅ Full | ✅ Full | ❌ No access | ✅ Assemble/Connect | ✅ Limited |
| **Coordinator** | 👁️ Read-only | 👁️ Read-only | 👁️ Read-only | ✅ Full | ✅ Full | ✅ Connect/Hone | ✅ Yes |

### **✅ Assignment System Testing**

#### **Already Tested with Playwright**
- [x] **Multi-User Assignment**: Strategist assigned Scriptwriter to Research card
- [x] **Assignment UI**: UserPicker, AssignmentPanel, AssigneeList components working
- [x] **Assignment Notifications**: Real-time notification delivery confirmed
- [x] **Role-Based Assignment**: Users can only assign to appropriate stages

#### **Manual Testing Steps**
1. **Login as Strategist** (`strategist@test.local` / `strategist123`)
2. **Create or Open Card** in Research stage
3. **Go to Assignments Tab** in card details modal
4. **Click "Assign User"** and select from team members
5. **Add Notes and Assign** user to card
6. **Verify Assignment** appears with user details
7. **Login as Assigned User** and check for notification

### **✅ Notification System Testing**

#### **Already Tested with Playwright**
- [x] **Real-Time Delivery**: Assignment notifications appear instantly
- [x] **Notification Badge**: Unread count displayed correctly
- [x] **Notification Details**: Complete assignment information shown
- [x] **Cross-User Experience**: Notifications visible to assigned users

#### **Manual Testing Steps**
1. **Create Assignment** (as any user with assignment permissions)
2. **Check Notification Badge** appears on assigned user's account
3. **Click Notification Bell** to open dropdown
4. **Verify Notification Content**: Should show assignment details
5. **Test "Mark as Read"** functionality
6. **Verify Badge Count** decreases when marked as read

### **✅ Team & Workflow Testing**

#### **Pre-configured Test Environment**
- **Test Team**: "Test Agency Team" with all 5 users as members
- **REACH Stages**: Research → Envision → Assemble → Connect → Hone
- **Sample Card**: "Test Research Card - Strategist Role" with assignment

#### **Workflow Testing Scenarios**

1. **Content Creation Flow**:
   - Scriptwriter creates card in Research
   - Coordinator reviews and moves to Envision
   - Editor takes over in Assemble
   - Strategist approves in Connect
   - Coordinator publishes in Hone

2. **Assignment Chain Testing**:
   - Admin assigns Scriptwriter to Research card
   - Scriptwriter completes and requests review
   - Strategist assigns Editor for Assemble stage
   - Editor uploads files and marks complete
   - Coordinator handles final publishing

---

## 🔍 **Verification Checklist**

### **Before Next Phase - Manual Verification Required**

#### **Authentication & User Management**
- [ ] All 5 test users can login successfully
- [ ] User sessions persist across browser refresh
- [ ] Logout functionality works properly
- [ ] Role indicators show correctly in UI

#### **Permission System Validation**
- [ ] Strategist can access all stages (comment/approve mode)
- [ ] Scriptwriter limited to Research & Envision stages
- [ ] Editor limited to Assemble & Connect stages
- [ ] Coordinator has read-only on first 3 stages, full access on last 2
- [ ] Admin has full access to everything

#### **Assignment & Notification Flow**
- [ ] Users can assign team members to appropriate cards
- [ ] Assignment notifications appear immediately
- [ ] Notification badge counts are accurate
- [ ] Assignment details show correctly in notifications
- [ ] Mark as read functionality works

#### **UI/UX Professional Quality**
- [ ] Role-based interface feels intuitive
- [ ] Permission restrictions are clear (not frustrating)
- [ ] Professional appearance suitable for business use
- [ ] All major components load without errors

#### **API Security & Performance**
- [ ] Unauthorized API requests properly rejected
- [ ] Permission boundaries enforced at all levels
- [ ] Page load times reasonable with multiple users
- [ ] No console errors during normal operation

---

## 🚨 **Known Issues & Troubleshooting**

### **Fixed Issues**
- ✅ **NextAuth URL Configuration**: Fixed redirect to correct port (3000)
- ✅ **Database Column Mapping**: Resolved snake_case column name conflicts
- ✅ **Permission Matrix**: All 25 role-stage combinations working

### **Potential Issues to Watch For**
- **Browser Cache**: Clear browser cache if experiencing login issues
- **Database Connection**: Ensure PostgreSQL is running and accessible
- **Port Conflicts**: Verify nothing else is running on port 3000
- **Environment Variables**: Confirm `.env.local` has correct configuration

### **Troubleshooting Steps**
1. **Login Issues**:
   - Check browser console for errors
   - Verify database is running
   - Try different user credentials

2. **Permission Errors**:
   - Check user role assignment in database
   - Verify team membership
   - Clear browser cache and re-login

3. **Notification Issues**:
   - Refresh page to trigger notification refresh
   - Check if assignment was created successfully
   - Verify notification API endpoints are working

---

## 📊 **Database Verification Queries**

### **Check Test Users**
```sql
SELECT email, role, first_name, last_name FROM users ORDER BY email;
```

### **Check Team Membership**
```sql
SELECT u.email, u.role, tm.joined_at
FROM team_members tm
JOIN users u ON tm.user_id = u.id
ORDER BY u.email;
```

### **Check Assignments**
```sql
SELECT ca.id, u.first_name, u.last_name, ca.role, ca.assigned_at, ca.notes
FROM card_assignments ca
JOIN users u ON ca.assigned_to = u.id
ORDER BY ca.assigned_at DESC;
```

### **Check Notifications**
```sql
SELECT n.type, n.title, n.message, n.created_at, u.email
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC;
```

---

## 🎯 **Success Criteria for Next Phase**

### **Must Pass Before Phase 6**
- All 5 test users can login and access their appropriate features
- Assignment workflow completes successfully across different roles
- Notification system delivers messages reliably
- Permission boundaries are enforced and intuitive
- Professional UI quality suitable for client demonstrations

### **Performance Benchmarks**
- Login time: < 2 seconds
- Page navigation: < 1 second
- Assignment creation: < 3 seconds
- Notification delivery: < 1 second (real-time)

---

**Created**: September 29, 2025
**Status**: Phase 5.5 Complete - Ready for Verification
**Next Phase**: Phase 6 - Client Management & Advanced Features

---

*This testing guide ensures the multi-role collaboration platform is fully functional and ready for real-world content agency use before proceeding with advanced features.*