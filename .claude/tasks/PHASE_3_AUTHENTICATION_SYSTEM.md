# Phase 3: Authentication System

## Overview
Implement secure email/password authentication with NextAuth.js, role-based access control, and admin user management capabilities with Slack notifications.

## Goals
- Secure authentication using existing database schema
- Role-based access control (admin/member/client)
- Protected API routes and pages
- Admin user management with invite system
- Slack notifications for user account creation
- First-login password change enforcement

## Tasks Breakdown

### 1. NextAuth.js Email/Password Setup
**Status**: Pending
**Duration**: ~4 hours

**Dependencies to Install**:
```bash
npm install next-auth @auth/drizzle-adapter
npm install @types/bcryptjs bcryptjs
```

**Configuration Files**:
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/lib/auth.ts` - NextAuth configuration
- `src/middleware.ts` - Route protection middleware
- `src/types/next-auth.d.ts` - TypeScript declarations

**Key Requirements**:
- Email/password credentials provider
- Integration with existing Drizzle database schema
- Session management with role information
- Secure password verification using bcrypt
- Custom login/logout pages

**NextAuth Configuration**:
```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      // Email/password authentication
      // Integration with verifyUserPassword utility
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Include role in session
    // Handle first login redirect
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
  }
};
```

---

### 2. Role-Based Access Control (RBAC)
**Status**: Pending
**Duration**: ~3 hours

**RBAC Implementation Strategy**:

#### Permission Levels
- **Admin**: Full system access, user management, all teams
- **Member**: Create/edit content, team collaboration, assigned tasks
- **Client**: View/comment on content, approve in Connect stage only

#### Access Control Components
```typescript
// src/lib/auth/permissions.ts
export const PERMISSIONS = {
  // User management
  CREATE_USERS: ['admin'],
  DELETE_USERS: ['admin'],

  // Team management
  CREATE_TEAMS: ['admin'],
  MANAGE_TEAM_MEMBERS: ['admin'],

  // Content management
  CREATE_CARDS: ['admin', 'member'],
  EDIT_CARDS: ['admin', 'member'],
  DELETE_CARDS: ['admin', 'member'],
  COMMENT_ON_CARDS: ['admin', 'member', 'client'],
  APPROVE_CONTENT: ['admin', 'client'],
} as const;
```

#### Route Protection Middleware
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect('/auth/signin');
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect('/auth/signin');
    }
  }
}
```

#### API Route Protection
```typescript
// src/lib/auth/api-auth.ts
export async function requireAuth(req: NextRequest, roles?: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (roles && !roles.includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return session;
}
```

---

### 3. Protected API Routes Architecture
**Status**: Pending
**Duration**: ~4 hours

**API Route Structure**:
```
/api/auth/*              - NextAuth endpoints
/api/admin/*            - Admin-only endpoints
  /api/admin/users      - User management
  /api/admin/teams      - Team management
  /api/admin/stats      - System statistics
/api/teams/*            - Team operations (member+ access)
  /api/teams/[id]       - Team details
  /api/teams/[id]/cards - Team content cards
/api/cards/*            - Content card operations
  /api/cards/[id]       - Card CRUD
  /api/cards/[id]/comments - Card comments
/api/user/*             - User profile operations
```

**Protected Route Template**:
```typescript
// src/app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['admin']);

    // Admin-only logic
    const users = await getUsers();

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

**API Endpoints to Implement**:

#### Admin User Management
- `POST /api/admin/users` - Create new user + Slack notification
- `GET /api/admin/users` - List all users with pagination
- `PUT /api/admin/users/[id]` - Update user details
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/admin/users/[id]/reset-password` - Force password reset

#### Team Management
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create team (admin only)
- `POST /api/teams/[id]/members` - Add team member
- `DELETE /api/teams/[id]/members/[userId]` - Remove member

#### Content Card Operations
- `GET /api/teams/[id]/cards` - Get team cards
- `POST /api/cards` - Create content card
- `PUT /api/cards/[id]` - Update card
- `PUT /api/cards/[id]/move` - Move card between stages
- `POST /api/cards/[id]/comments` - Add comment

---

### 4. Authentication UI Components
**Status**: Pending
**Duration**: ~3 hours

**Pages to Create**:
- `src/app/auth/signin/page.tsx` - Custom login page
- `src/app/auth/signout/page.tsx` - Custom logout page
- `src/app/auth/first-login/page.tsx` - First-login password change
- `src/app/auth/error/page.tsx` - Authentication error page

**Login Page Features**:
```typescript
// src/app/auth/signin/page.tsx
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2>Sign in to Content Reach Hub</h2>
          <p>Enter your email and password to access your account</p>
        </div>

        <SignInForm />

        <div className="text-center text-sm text-gray-600">
          Internal access only • Contact admin for account creation
        </div>
      </div>
    </div>
  );
}
```

**First Login Flow**:
```typescript
// src/app/auth/first-login/page.tsx
export default function FirstLoginPage() {
  // Force password change on first login
  // Update user.isFirstLogin = false after success
  // Redirect to dashboard
}
```

**UI Components**:
- `<SignInForm>` - Email/password form with validation
- `<PasswordChangeForm>` - First-login password change
- `<AuthGuard>` - Wrapper component for protected pages
- `<RoleGuard>` - Component-level role checking

---

### 5. Admin User Management Interface
**Status**: Pending
**Duration**: ~5 hours

**Admin Dashboard Structure**:
```
/admin                   - Admin dashboard overview
/admin/users            - User management interface
/admin/teams            - Team management interface
/admin/settings         - System settings
```

**User Management Features**:

#### User List Interface
```typescript
// src/app/admin/users/page.tsx
export default function UsersManagementPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>User Management</h1>
        <CreateUserButton />
      </div>

      <UserTable />
      <UserPagination />
    </div>
  );
}
```

#### Create User Modal
```typescript
// components/admin/CreateUserModal.tsx
interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'client';
  teamIds: string[];
}

export function CreateUserModal() {
  // Form validation with Zod
  // API call to create user
  // Trigger Slack notification
  // Show generated password (one-time display)
}
```

**Key UI Components**:
- `<UserTable>` - Sortable, filterable user list
- `<CreateUserModal>` - New user creation form
- `<EditUserModal>` - User details editing
- `<PasswordResetModal>` - Force password reset
- `<TeamAssignmentModal>` - Manage user team memberships

**User Management Actions**:
- Create new user account
- Assign users to teams
- Change user roles
- Force password reset
- Deactivate/reactivate users
- View user activity logs

---

### 6. Slack Notification System
**Status**: Pending
**Duration**: ~2 hours

**Slack Integration Architecture**:
```typescript
// src/lib/notifications/slack.ts
interface SlackNotification {
  channel?: string;
  text: string;
  blocks?: any[];
}

export async function sendSlackNotification(notification: SlackNotification) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook not configured');
    return;
  }

  const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    throw new Error('Failed to send Slack notification');
  }
}
```

**Notification Triggers**:

#### User Account Creation
```typescript
// src/app/api/admin/users/route.ts
export async function POST(request: NextRequest) {
  // ... user creation logic ...

  // Send Slack notification
  await sendSlackNotification({
    text: `🆕 New user account created`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New User Account Created*\n• Name: ${firstName} ${lastName}\n• Email: ${email}\n• Role: ${role}\n• Created by: ${createdBy.name}`
        }
      }
    ]
  });
}
```

#### Future Notification Types (Phase 5+)
- Content approval requests
- Deadline reminders
- Team member additions
- Important system updates

**Environment Variables**:
```env
# Add to .env.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

### 7. Session Management & Security
**Status**: Pending
**Duration**: ~2 hours

**Security Features**:

#### Session Configuration
```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isFirstLogin = user.isFirstLogin;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.isFirstLogin = token.isFirstLogin;
      return session;
    },
  },
};
```

#### Password Security
- **Existing**: bcrypt hashing with 12 rounds (from Phase 2)
- **Add**: Password strength requirements
- **Add**: Password change on first login enforcement
- **Add**: Session invalidation on password change

#### Security Headers & CSRF Protection
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}
```

---

## Implementation Steps

### Step 1: NextAuth.js Foundation (Day 1)
1. Install NextAuth.js and dependencies
2. Create auth configuration with credentials provider
3. Set up API routes and session management
4. Create basic login/logout pages
5. Test authentication with existing admin user

### Step 2: Role-Based Access (Day 1-2)
1. Implement permission system and middleware
2. Protect API routes with role checking
3. Create protected page components
4. Test access control for different roles

### Step 3: Admin Interface (Day 2)
1. Build admin dashboard layout
2. Implement user management interface
3. Create user creation flow with password generation
4. Test admin user management features

### Step 4: Slack Integration (Day 2)
1. Set up Slack webhook configuration
2. Implement notification service
3. Add notifications to user creation flow
4. Test Slack notifications

### Step 5: Security & Polish (Day 3)
1. Implement first-login password change
2. Add comprehensive error handling
3. Security testing and validation
4. Performance optimization and cleanup

---

## Success Criteria

### Functional Requirements
- [ ] Users can log in with email/password
- [ ] Role-based access control working correctly
- [ ] Admin can create and manage user accounts
- [ ] First-login password change enforced
- [ ] Slack notifications sent on user creation
- [ ] Protected routes redirect unauthorized users
- [ ] Session management working properly

### Technical Requirements
- [ ] Integration with existing Drizzle database schema
- [ ] Type-safe authentication throughout application
- [ ] Secure password handling and storage
- [ ] Proper error handling and user feedback
- [ ] CSRF protection and security headers
- [ ] Responsive admin interface design

### Security Requirements
- [ ] Passwords properly hashed and verified
- [ ] Sessions expire after 8 hours
- [ ] Protected routes require authentication
- [ ] Role-based permissions enforced on API and UI
- [ ] No sensitive information exposed in client
- [ ] Secure first-login flow implementation

---

## Database Integration

### Existing Schema Compatibility
✅ **User table ready**: Compatible with NextAuth.js adapter
✅ **Role system ready**: admin/member/client roles implemented
✅ **Password utilities ready**: verifyUserPassword, updateUserPassword
✅ **Team relationships ready**: User-team associations established

### Required Environment Variables
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Slack integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Existing (already configured)
DATABASE_URL=postgresql://postgres:devPassword123!@db:5432/content_reach_hub
```

---

## Testing Strategy

### Authentication Testing
1. **Login flow**: Test with seeded admin user credentials
2. **Role permissions**: Verify admin/member/client access levels
3. **First login**: Test password change enforcement
4. **Session management**: Test session expiration and renewal

### API Endpoint Testing
1. **Protected routes**: Verify authentication requirements
2. **Role-based access**: Test permission enforcement
3. **User management**: Test CRUD operations for admin
4. **Error handling**: Test unauthorized access scenarios

### Integration Testing
1. **Database operations**: Test with existing utilities
2. **Slack notifications**: Test webhook integration
3. **UI components**: Test authentication states
4. **Security features**: Test CSRF protection and headers

---

## Risk Mitigation

### Authentication Risks
- **Password security**: Use existing bcrypt utilities (12 rounds)
- **Session hijacking**: Short session timeouts, secure cookies
- **CSRF attacks**: NextAuth.js built-in protection + custom headers
- **Role escalation**: Strict permission checking on all routes

### Integration Risks
- **Database compatibility**: Use existing Drizzle schema and utilities
- **Breaking changes**: Maintain backward compatibility with Phase 2
- **Performance**: Implement efficient session and permission checking
- **User experience**: Graceful error handling and clear feedback

### Deployment Risks
- **Environment variables**: Secure secret management
- **Docker compatibility**: Test all auth flows in containers
- **Production setup**: HTTPS requirements for secure cookies
- **Slack integration**: Fallback handling for notification failures

---

## Post-Phase 3 Readiness

### Ready for Phase 4: Core Kanban Structure
- ✅ User authentication and sessions
- ✅ Role-based access control for UI components
- ✅ Protected API routes for card operations
- ✅ Team member verification for card access
- ✅ Admin interface for user/team management

### Integration Points Prepared
- **API routes**: Protected endpoints ready for Kanban operations
- **UI components**: Authentication state management
- **Database access**: User context available for all operations
- **Team permissions**: Foundation for team-based card access
- **Admin tools**: User management for team assignments

---

## Current Status: Ready to Begin

**Prerequisites Met**:
- ✅ Database schema with users/teams/roles implemented
- ✅ Password utilities (verifyUserPassword, updateUserPassword)
- ✅ Admin user seeded with test credentials
- ✅ Docker environment configured
- ✅ Type-safe database operations established

**Test Credentials Available**:
- Email: `admin@contentreach.local`
- Password: `7ba42eee`
- Role: admin

**Next Actions**:
1. Install NextAuth.js and dependencies
2. Configure authentication with existing database
3. Implement role-based access control
4. Build admin user management interface
5. Set up Slack notification system

**Expected Timeline**: 2-3 days for complete Phase 3 implementation