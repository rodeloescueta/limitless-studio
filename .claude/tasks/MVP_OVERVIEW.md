# Content OS MVP - Overall Implementation Plan

## Project Vision
Build an internal Content Operating System for content creation agencies - "Trello for content creators" with REACH workflow (Research → Envision → Assemble → Connect → Hone).

## MVP Requirements Summary
- **Internal app**: 20 users max, invite-only access
- **Multi-team**: Simple team structure
- **Auth**: Email/password with role-based access (admin/member/client)
- **File storage**: Local uploads initially
- **Deployment**: Contabo VPS with Docker
- **Keep it simple**: No over-engineering

## 📝 Key Decisions & Requirements (From Initial Discussions)

### **Authentication Strategy**
- **NO OAuth Google** (initially considered but rejected)
  - Reason: Would allow anyone with Google account to attempt login
  - Not suitable for internal 20-person team
- **Email/Password Only** with invite-only system
- **Admin creates user accounts** → **Slack notifications** when accounts are created
- **Forced password change** on first login
- **Seeded admin user** with random 8-character password

### **Slack Integration Points**
- **User account creation notifications** - When admin creates new user accounts
- **Future Phase**: General notifications for deadlines and approvals (mentioned in original requirements)
- **Not for authentication** - Only for notifications

### **Team Structure (Simple)**
- Users belong to **one primary team**
- Teams can **share certain cards if needed** (keep minimal)
- **Multi-team support** but simple implementation
- **Max 20 users total** across all teams initially

### **File Upload Strategy**
- **Start with local file storage** in `/uploads` folder
- **Common file types**: PDF, images (PNG/JPG), docs (DOC/DOCX)
- **10MB file size limit** initially
- **Ready for cloud migration** (S3) in future phases
- **Interface designed** to switch storage backends easily

### **User Roles & Permissions**
- **Admin**:
  - Manage team and users
  - All content access
  - Can create/delete user accounts
  - First user becomes admin automatically (via seeder)
- **Member**:
  - Create/edit cards, tasks, comments
  - Full collaboration features
- **Client/Approver**:
  - View and comment on content
  - Approve content in Connect stage
  - Limited access scope

### **AI Integration (Future Phases)**
- **Phase 5+**: Optional AI features
- **Content cards**: "Suggest Ideas/Hooks" button
- **Hone stage**: "Summarize Analytics" insights
- **Switchable provider architecture** (OpenAI, etc.)
- **Keep lightweight and contextual**

### **Original Business Context**
From job posting requirements:
- **Content creation workflow**: Video ideation → scripting → editing → publishing → A/B testing
- **Multi-role collaboration**: Video editors, scriptwriters, producers, stakeholders
- **Clear tracking**: Projects, timelines, deliverables
- **User alerts**: Deadlines and approvals
- **Proprietary methodology**: Embed content creation process into workflow
- **Future SaaS potential**: Scale to external agencies later

## 6-Phase Implementation Plan

### Phase 1: Docker Infrastructure Setup ✅ COMPLETE
**Duration**: Completed
**Goal**: Production-ready Docker environment

**Tasks:**
- [x] Next.js project with TypeScript
- [x] Multi-stage Dockerfile for production
- [x] Docker Compose v2 (web, db, pgadmin)
- [x] Environment variable management
- [x] Development workflow scripts
- [x] Single-command development startup (`npm run dev`)
- [x] Hot reload with Turbopack integration
- [x] Git repository initialization and cleanup

**Deliverables:**
- ✅ Working local development environment
- ✅ Production-ready Docker configuration
- ✅ Database connection established
- ✅ Simplified development workflow
- ✅ Clean git repository ready for GitHub

---

### Phase 2: Database Foundation ✅ COMPLETE
**Duration**: 1-2 days (Completed)
**Goal**: Solid data layer with user management

**Tasks:**
- [x] Drizzle ORM setup and configuration
- [x] Database schema design (users, teams, stages, content_cards)
- [x] Migration system setup
- [x] Admin user seeder (random 8-char password)
- [x] Database connection testing
- [x] Basic database utilities and helpers

**Deliverables:**
- ✅ Complete database schema with proper relationships
- ✅ Working migration system
- ✅ Seeded admin user with secure random password (`admin@contentreach.local` / `7ba42eee`)
- ✅ Type-safe database operations with Drizzle
- ✅ Database utilities for common operations
- ✅ Full REACH workflow stages (Research → Envision → Assemble → Connect → Hone)
- ✅ Comprehensive testing suite with verification

---

### Phase 3: Authentication System ⚡ NEXT
**Duration**: 2-3 days
**Goal**: Secure role-based authentication

**Tasks:**
- [ ] NextAuth.js email/password setup
- [ ] Role-based access control (RBAC)
- [ ] Protected API routes
- [ ] Session management
- [ ] Admin user management (create users)
- [ ] **Slack notification system** for user account creation
- [ ] Forced password change on first login
- [ ] Password security policies

**Deliverables:**
- Login/logout functionality
- Role-based permissions working
- Admin can create users with Slack notifications
- Secure password management
- First-login password change flow

---

### Phase 4: Core Kanban Structure
**Duration**: 3-4 days
**Goal**: Basic REACH workflow

**Tasks:**
- [ ] REACH stages setup (Research → Envision → Assemble → Connect → Hone)
- [ ] Content Cards CRUD operations
- [ ] Basic team management
- [ ] Drag-and-drop functionality (dnd-kit)
- [ ] Card details modal

**Deliverables:**
- Working Kanban board
- Cards can move between stages
- Basic card creation/editing

---

### Phase 5: Collaboration Features
**Duration**: 3-4 days
**Goal**: Team collaboration tools

**Tasks:**
- [ ] Comments system with mentions
- [ ] Subtask management with assignments
- [ ] File upload system (local storage, 10MB limit)
- [ ] User notifications (basic + Slack integration)
- [ ] Team member assignments
- [ ] **Slack notifications for deadlines and approvals**
- [ ] Multi-team content sharing (simple)

**Deliverables:**
- Full collaboration features
- File attachments working (PDF, images, docs)
- Comments and mentions functional
- Slack integration for key workflow notifications
- Simple multi-team content sharing

---

### Phase 6: UI/UX Polish
**Duration**: 2-3 days
**Goal**: Production-ready interface

**Tasks:**
- [ ] shadcn/ui component integration
- [ ] Responsive design implementation
- [ ] Error handling and validation
- [ ] Loading states and feedback
- [ ] Final UX refinements

**Deliverables:**
- Polished, responsive interface
- Proper error handling
- Production-ready MVP

---

## Success Criteria for MVP

### Core Functionality
- ✅ Teams can create and manage content cards
- ✅ Cards move through REACH workflow stages
- ✅ Comments, mentions, and file attachments work
- ✅ Role-based permissions enforced
- ✅ Admin can manage users and teams

### Technical Requirements
- ✅ Docker environment runs reliably
- ✅ Database migrations work properly
- ✅ Authentication is secure
- ✅ File uploads handle common formats
- ✅ Ready for Contabo VPS deployment

### User Experience
- ✅ Interface is intuitive for content teams
- ✅ Collaboration feels natural
- ✅ Performance is acceptable for 20 users
- ✅ Works on desktop and mobile

## Technology Decisions Rationale

### Stack Choices
- **Next.js + TypeScript**: Full-stack, type-safe, production-ready
- **PostgreSQL + Drizzle**: Relational data with type-safe ORM
- **NextAuth.js**: Battle-tested authentication
- **shadcn/ui + Tailwind**: Modern, accessible UI components
- **dnd-kit**: Reliable drag-and-drop for Kanban

### Architecture Principles
- **Simple over complex**: Choose proven, straightforward solutions
- **Production-ready**: Every choice considers deployment requirements
- **Team-focused**: Optimize for collaboration and multi-user workflows
- **Extensible**: Build foundation that can grow into SaaS later

## 🔧 Technical Implementation Notes

### **Slack Integration Architecture**
- **Webhook-based notifications** (not OAuth)
- **Environment variable**: `SLACK_WEBHOOK_URL` for team notifications
- **Notification triggers**:
  - User account creation (admin creates new user)
  - Important deadline reminders
  - Approval requests in Connect stage
- **Keep lightweight**: Simple webhook POST requests, no complex Slack app

### **Database Design Considerations**
- **Multi-team structure**: Users belong to primary team, but can collaborate across teams
- **Role inheritance**: Roles are user-level, not team-level (simpler for 20-user internal app)
- **Content sharing**: Simple flag on content cards for cross-team visibility
- **Audit trail**: Track who created/modified content for accountability

### **File Storage Evolution Path**
```
Phase 1-4: Local storage (/uploads)
├── Simple file handling
├── 10MB limit for MVP
└── Basic security checks

Future Phases: Cloud storage
├── S3-compatible interface
├── CDN integration
└── Advanced file management
```

### **Authentication Flow**
```
1. Admin creates user account
2. System generates random 8-char password
3. Slack notification sent to team
4. User logs in with temporary password
5. Forced to change password on first login
6. Session management via NextAuth
```

## Risk Mitigation

### Technical Risks
- **Docker complexity**: Use proven patterns, test early
- **Database design**: Keep schema simple, plan for changes
- **Authentication security**: Follow NextAuth.js best practices
- **File storage**: Start local, design for cloud migration

### Project Risks
- **Scope creep**: Stick to MVP requirements, document future features
- **Performance**: Test with realistic data early
- **Deployment**: Prepare for Contabo VPS from day 1

---

## 🚀 Current Status & Next Steps

**Phase 1: Docker Infrastructure Setup** - ✅ **COMPLETE**
- All infrastructure components working
- Single-command development workflow (`npm run dev`)
- Git repository initialized and ready for GitHub connection

**Phase 2: Database Foundation** - ⚡ **READY TO START**
- Database connection already established
- PostgreSQL running with persistent volumes
- Ready for Drizzle ORM integration and schema design

**Recommended Next Action:**
1. Create detailed Phase 2 implementation plan
2. Set up Drizzle ORM with TypeScript integration
3. Design and implement core database schema
4. Create migration system and admin user seeder

See `.claude/tasks/PHASE_1_DOCKER_SETUP.md` for completed Phase 1 details.