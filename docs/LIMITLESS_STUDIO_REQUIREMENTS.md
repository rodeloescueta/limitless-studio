# Limitless Studio System - Requirements & Implementation Plan

## 📋 Executive Summary

**Project**: Limitless Studio System for The Limitless Company
**Purpose**: Internal video content production workflow management
**Approach**: Simple, practical implementation focused on core workflow that can scale
**Timeline**: 7 phases, ~3-4 weeks total development

### Key Principles
- **Core workflow first** - Focus on making the REACH process work perfectly for internal team
- **Simple solutions** - Avoid over-engineering, choose proven approaches
- **Growth ready** - Build foundation that can expand to full client requirements later
- **Team focused** - Optimize for 20-person internal team initially, scale to clients afterward

---

## 🎯 Project Context & Vision

### Current Situation
The Limitless Company currently uses ClickUp for managing video content production across multiple clients. Due to nested subtasks, fragmented checklists, and overwhelming dashboards, critical steps are often forgotten or delayed. Videos stall between handoffs, feedback loops lag, and project managers spend time manually following up.

### Target Vision
A **self-managing production brain** - an internal operating system that automatically coordinates Limitless's video pipeline, ensures approvals happen on time, and alerts staff before bottlenecks occur.

### Success Definition
- **Eliminate time gaps** between REACH stages
- **Clear role-based dashboards** for each contributor
- **Automated tracking and alerts** for overdue items
- **Streamlined approvals** and progressions
- **Real-time visibility** into pipeline health

---

## 🏗️ Core Requirements (Simplified for MVP)

### 1. REACH Workflow Management
**Priority**: Critical - Core system purpose

- **Five visual columns**: Research → Envision → Assemble → Connect → Hone
- **Content Cards**: Each card = one video project
- **Drag-and-drop**: Move cards between stages with automatic notifications
- **Stage-specific checklists**: Each stage has deliverable requirements
- **Time tracking**: Monitor how long cards spend in each stage

### 2. User Role Management (7 Roles)
**Priority**: High - Essential for workflow

| Role | Primary Access | Key Responsibilities |
|------|---------------|---------------------|
| **Admin/Manager** | All stages + team management | Oversee operations, review performance |
| **Strategist** | Research + Envision + approvals | Approve scripts, edits, final videos |
| **Scriptwriter** | Research + Envision | Write and revise scripts |
| **Editor/Designer** | Assemble + Connect | Edit videos, design thumbnails |
| **Coordinator** | Connect + Hone + orchestration | Manage publishing, track analytics |
| **Client** | Connect stage + limited view | Approve ideas/scripts, provide feedback |
| **AI System** | Monitoring + alerts | *Future: automated tracking and escalation* |

### 3. Basic Client Management
**Priority**: Medium - Simplified for MVP

- **Client profiles**: Basic company info and contact details
- **Content association**: Link cards to specific clients
- **Approval workflow**: Client can approve/reject in Connect stage
- **Simple access control**: Clients see only their content

### 4. Team Collaboration
**Priority**: High - Core workflow dependency

- **Comments system**: Already implemented with @mentions
- **File attachments**: PDF, images, documents (local storage initially)
- **Task assignments**: Assign team members to cards
- **Status updates**: Real-time notifications when cards move

### 5. Automated Monitoring (Simplified)
**Priority**: Medium - Start simple, evolve to AI

- **Time-based alerts**: If cards stay too long in stages
- **Slack notifications**: Key workflow events
- **Deadline tracking**: Due dates and reminders
- **Escalation logic**: Alert managers when team members don't respond

---

## 🚀 Updated Implementation Plan (Based on Current Progress)

### Phase 1: Infrastructure Setup ✅ COMPLETE
**Duration**: Completed
**Status**: ✅ Done

**Completed Deliverables**:
- Docker environment with Next.js, PostgreSQL, pgAdmin
- Development workflow established
- Git repository initialized
- Hot reload and Turbopack integration

---

### Phase 2: Database Foundation & Authentication ✅ COMPLETE
**Duration**: Completed
**Status**: ✅ Done

**Completed Deliverables**:
- Drizzle ORM setup with PostgreSQL
- Complete database schema (users, teams, stages, content_cards)
- NextAuth.js email/password authentication
- Admin user seeder (admin@contentreach.local)
- Role-based access control (3 roles: admin/member/client)

---

### Phase 3: Authentication System ✅ COMPLETE
**Duration**: Completed
**Status**: ✅ Done

**Completed Deliverables**:
- Email/password login working
- Protected routes and API endpoints
- Session management
- Role-based permissions

---

### Phase 4: Core REACH Workflow ✅ COMPLETE
**Duration**: Completed
**Status**: ✅ Done

**Completed Deliverables**:
- Full REACH Kanban board (Research → Envision → Assemble → Connect → Hone)
- Content card CRUD operations
- Drag-and-drop functionality with @dnd-kit
- Card details modal
- Team-based access control

---

### Phase 5: Collaboration Features 🟠 IN PROGRESS (60% Complete)
**Duration**: Partially completed
**Status**: 🟠 Comments system working, other features pending

**✅ Completed**:
- Comments system with @mentions
- Rich text commenting
- Real-time updates via React Query

**🟡 Remaining**:
- File upload system
- User assignments with roles
- In-app notifications
- Slack integration

---

### Phase 6: Enhanced Client Management ⚡ NEXT PRIORITY
**Duration**: 2-3 days
**Priority**: High - Client requirements alignment

**Objectives**:
- Transform current "teams" into client-company structure
- Implement client profiles with brand guidelines
- Create client onboarding forms
- Build client approval workflows

**Database Schema Extensions Needed**:
```sql
-- Extend existing schema for client-centric model
ALTER TABLE teams ADD COLUMN client_company_name VARCHAR(200);
ALTER TABLE teams ADD COLUMN industry VARCHAR(100);
ALTER TABLE teams ADD COLUMN contact_email VARCHAR(255);

-- New client profile table
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  brand_bio TEXT,
  voice_guidelines TEXT,
  target_audience TEXT,
  content_pillars TEXT[],
  style_guidelines JSONB,
  asset_links JSONB, -- Dropbox, Drive, Notion links
  competitive_channels TEXT[],
  performance_goals JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced user roles (expand from 3 to 7)
ALTER TYPE user_role ADD VALUE 'strategist';
ALTER TYPE user_role ADD VALUE 'scriptwriter';
ALTER TYPE user_role ADD VALUE 'editor';
ALTER TYPE user_role ADD VALUE 'coordinator';
```

**Implementation Tasks**:
- Extend existing teams to support client company information
- Build client profile management interface
- Create client onboarding wizard
- Implement 7-role permission system (Admin, Strategist, Scriptwriter, Editor, Coordinator, Member, Client)
- Create role-based dashboard views

**Deliverables**:
- Client profile management system
- Enhanced role-based permissions (7 roles)
- Client onboarding flow
- Role-specific dashboard filtering

---

### Phase 7: AI Orchestration System (Rule-Based MVP) 🤖 FUTURE
**Duration**: 3-4 days
**Priority**: Medium - Start with rule-based, evolve to AI

**Objectives**:
- Time-based monitoring system for REACH stages
- Automated alert system (Slack, email, in-app)
- Escalation logic for overdue tasks
- Basic learning patterns (stage duration tracking)

**Implementation Approach** (Simplified, Non-AI Initially):
```typescript
// Rule-based monitoring system
const STAGE_TIME_WINDOWS = {
  'Research': 2 * 24 * 60 * 60 * 1000, // 2 days in ms
  'Envision': 2 * 24 * 60 * 60 * 1000, // 2 days
  'Assemble': 3 * 24 * 60 * 60 * 1000, // 3 days
  'Connect': 1 * 24 * 60 * 60 * 1000,  // 1 day
  'Hone': 7 * 24 * 60 * 60 * 1000      // 7 days
};

// Simple monitoring logic
function checkOverdueCards() {
  // Find cards that haven't moved within time window
  // Send alerts via Slack/email
  // Escalate to managers after 24h no response
}
```

**Key Features**:
- Cron job monitoring system
- Multi-channel alerts (Slack, email, SMS, in-app)
- Escalation workflows
- Stage transition tracking
- Performance analytics foundation

**Deliverables**:
- Automated monitoring system
- Alert and escalation workflows
- Performance tracking dashboard
- Foundation for true AI implementation

---

### Phase 8: Voice Note Integration & Client Dashboard 🎙️ FUTURE
**Duration**: 2-3 days
**Priority**: Medium - Client-specific features

**Objectives**:
- Voice note upload system for client approvals
- Auto-assignment workflow to scriptwriters
- Dedicated client dashboard (simplified view)
- Enhanced client approval process

**Implementation Tasks**:
- Voice file upload system
- Audio file processing and storage
- Auto-assignment logic ("grab bag" method)
- Client dashboard with approval-focused UI
- Voice note → script delivery pipeline

**Deliverables**:
- Voice note upload and processing
- Auto-assignment to scriptwriters
- Client-focused dashboard interface
- Enhanced approval workflows

---

### Phase 9: Advanced Analytics & ROAC Tracking 📊 FUTURE
**Duration**: 3-4 days
**Priority**: Lower - Business intelligence

**Objectives**:
- Platform integrations (YouTube, Instagram, TikTok)
- Performance tracking and outlier detection
- Monthly automated reporting
- ROAC (Return On Attention Created) tracking

**Implementation Tasks**:
- Social platform API integrations
- Analytics data collection and storage
- Report generation system
- Performance comparison algorithms
- ROAC calculation and tracking

**Deliverables**:
- Platform performance integrations
- Automated reporting system
- ROAC tracking dashboard
- Business intelligence insights
users (id, email, password, role, firstName, lastName, isActive)
clients (id, name, industry, contactEmail, onboardedAt)
teams (id, name, clientId, description)
stages (id, name, order, timeWindow, teamId)
content_cards (id, title, description, clientId, stageId, assignedTo, createdAt, dueDate)

-- Collaboration
comments (id, cardId, userId, content, mentions, parentId, createdAt)
attachments (id, cardId, fileName, filePath, uploadedBy, createdAt)
card_assignments (id, cardId, userId, role, assignedAt)

-- Monitoring (for future AI)
stage_transitions (id, cardId, fromStage, toStage, userId, transitionedAt)
alerts (id, cardId, userId, type, message, isRead, createdAt)
```

**Authentication System**:
- NextAuth.js with email/password
- 7-role system with role-based access control
- Admin can create user accounts
- Session management and protected routes

**Deliverables**:
- Complete database schema with migrations
- Working authentication with all 7 roles
- Admin user management interface
- Role-based route protection

---

### Phase 3: Core REACH Workflow
**Duration**: 3-4 days
**Priority**: Critical - Core functionality

**REACH Kanban Board**:
- Five columns for Research → Envision → Assemble → Connect → Hone
- Drag-and-drop functionality using @dnd-kit (already working)
- Card creation, editing, and management
- Stage-specific views and filtering

**Content Card Management**:
- Rich card details with client association
- Title, description, client selection, due dates
- Assignment to team members
- Status tracking and history

**Role-Based Dashboard Views**:
```typescript
// Dashboard filtering by role
Manager: See all cards across all stages
Scriptwriter: Focus on Research + Envision stages
Editor: Focus on Assemble + Connect stages
Coordinator: Focus on Connect + Hone stages
Client: See only their cards in Connect stage
```

**Deliverables**:
- Fully functional REACH kanban board
- Content card CRUD operations
- Role-based filtered views
- Drag-and-drop stage transitions

---

### Phase 4: Client Integration & Approval Workflow
**Duration**: 2-3 days
**Priority**: High - Client interaction

**Basic Client Management**:
- Client profile creation and management
- Client-specific content filtering
- Simple onboarding form (no complex brand guidelines yet)

**Approval Workflow**:
- Client access to Connect stage cards
- Approve/reject functionality with comments
- Notification system for approvals
- Status tracking for pending approvals

**Client Dashboard Access**:
- Simplified view showing only client's content
- Focus on approval actions and published content
- Basic analytics view (views, engagement if available)

**Deliverables**:
- Client profile management
- Working approval workflow in Connect stage
- Client-specific dashboard access
- Approval notification system

---

### Phase 5: Enhanced Monitoring & Alerts
**Duration**: 2-3 days
**Priority**: Medium - Workflow optimization

**Time-Based Monitoring**:
```typescript
// Simple rule-based monitoring (not AI yet)
Research: 2 days → Alert if card hasn't moved
Envision: 2 days → Alert if card hasn't moved
Assemble: 3 days → Alert if card hasn't moved
Connect: 1 day → Alert if pending approval
Hone: 7 days → Alert for analytics review
```

**Slack Integration**:
- Webhook-based notifications (simple, not OAuth)
- Key events: card assignments, deadline reminders, approvals needed
- Escalation messages to managers
- User preference settings for notification types

**Alert System**:
- In-app notification center
- Email fallback for critical alerts
- Escalation logic (24h no response → notify manager)
- Alert history and tracking

**Deliverables**:
- Working time-based alert system
- Slack webhook integration
- In-app notification system
- Basic escalation logic

---

### Phase 6: File Management & Enhanced Collaboration
**Duration**: 2-3 days
**Priority**: Medium - Team productivity

**File Upload System**:
- Local file storage in `/uploads` directory
- Support for PDF, images (PNG/JPG), documents (DOC/DOCX)
- 10MB file size limit
- Security validation and virus scanning
- File preview and download functionality

**Enhanced Collaboration**:
- Comments system with @mentions (already implemented)
- Multiple assignees per card
- Assignment role management (primary, reviewer, approver)
- Activity feed showing recent changes

**Team Management**:
- Team member search and assignment
- Workload visibility (cards per person)
- Performance tracking (on-time completion rates)

**Deliverables**:
- Complete file upload and management system
- Enhanced assignment capabilities
- Activity tracking and team insights
- Performance monitoring foundation

---

### Phase 7: UI/UX Polish & Performance
**Duration**: 2-3 days
**Priority**: Medium - Production readiness

**Interface Refinement**:
- shadcn/ui component consistency
- Responsive design for mobile access
- Loading states and error handling
- User experience improvements

**Performance Optimization**:
- Database query optimization
- Caching strategy implementation
- Image optimization for attachments
- API response time improvements

**Production Preparation**:
- Error logging and monitoring
- Security hardening
- Deployment configuration for Contabo VPS
- Backup and recovery procedures

**Deliverables**:
- Polished, responsive interface
- Production-ready performance
- Deployment documentation
- Monitoring and maintenance tools

---

## 🎨 Future Phase Preparation

### Phase 8+: AI Orchestration (Post-MVP)
**When client confirms AI requirements**:
- Replace rule-based monitoring with intelligent AI system
- Learning algorithms for pattern recognition
- Predictive analytics for bottleneck prevention
- Advanced escalation and task reassignment

### Phase 9+: Client Dashboard Enhancement
- Dedicated client portal with rich analytics
- ROAC tracking and celebration animations
- Advanced brand guideline management
- Voice note integration for approvals

### Phase 10+: Voice Note Integration
- Voice note upload and processing
- Auto-assignment to scriptwriters
- Voice-to-text transcription
- Integration with approval workflows

### Phase 11+: Advanced Analytics
- Platform integrations (YouTube, Instagram, TikTok)
- Performance outlier detection
- Monthly automated reporting
- Content strategy recommendations

---

## 📊 Technology Stack & Architecture

### Core Technologies (Proven & Simple)
- **Frontend**: Next.js 15 with TypeScript and App Router
- **Backend**: Next.js API routes with proper error handling
- **Database**: PostgreSQL with Drizzle ORM for type safety
- **Authentication**: NextAuth.js with session management
- **UI Components**: shadcn/ui with Tailwind CSS
- **Drag & Drop**: @dnd-kit (already implemented and working)
- **State Management**: React Query (@tanstack/react-query)

### Integration & Services
- **File Storage**: Local filesystem initially, cloud-ready interface
- **Notifications**: Slack webhooks + email fallback
- **Monitoring**: Node.js cron jobs for time-based alerts
- **Real-time**: WebSocket for live notifications (if needed)

### Infrastructure
- **Development**: Docker Compose (already working)
- **Production**: Contabo VPS with Docker
- **Database**: PostgreSQL with persistent volumes
- **Reverse Proxy**: Nginx for production deployment

---

## 🎯 Success Criteria & Metrics

### Core Functionality Requirements
- ✅ **REACH Workflow**: All 5 stages working with drag-and-drop
- ✅ **Role Management**: All 7 roles with appropriate access levels
- ✅ **Client Integration**: Basic client profiles and approval workflow
- ✅ **Collaboration**: Comments, file uploads, assignments working
- ✅ **Monitoring**: Time-based alerts and Slack notifications

### Performance & Scale Targets
- **User Load**: Handle current Limitless team (~20 users) smoothly
- **Content Volume**: Manage 50+ active content cards efficiently
- **Response Time**: < 2 seconds for all major operations
- **Reliability**: 99%+ uptime with proper error handling
- **Growth Ready**: Database and architecture can scale to 200+ cards

### User Experience Goals
- **Intuitive Interface**: Team can use without training
- **Fast Workflow**: Reduce time between stage transitions
- **Clear Visibility**: Everyone knows what needs attention
- **Reliable Notifications**: No missed deadlines or approvals
- **Mobile Friendly**: Works on tablets and phones

---

## 🚨 Risk Mitigation & Contingencies

### Technical Risks
1. **Database Performance**: Start with proper indexing, plan for optimization
2. **File Storage**: Begin local, design interface for cloud migration
3. **Authentication Security**: Follow NextAuth.js best practices
4. **Notification Reliability**: Build retry logic and fallback channels

### Project Risks
1. **Scope Creep**: Document future features clearly, resist early implementation
2. **Client Feedback**: Plan for iterative improvements after core workflow
3. **Team Adoption**: Focus on intuitive UX and gradual rollout
4. **Performance Issues**: Monitor early, optimize proactively

### Contingency Plans
- **MVP Fallback**: Core REACH workflow can work without client integration
- **Simple Alerts**: Rule-based monitoring works without AI complexity
- **Progressive Enhancement**: Each phase delivers standalone value
- **Rollback Strategy**: Each phase can be reverted if issues arise

---

## 📈 Growth Path & Scalability

### Near Term (3-6 months)
- **Current Team Optimization**: Perfect workflow for internal team
- **Client Rollout**: Gradually add clients to approval workflow
- **Feature Refinement**: Based on real usage patterns
- **Performance Tuning**: Optimize based on actual load

### Medium Term (6-12 months)
- **AI Integration**: Add intelligent monitoring when requirements are clear
- **Client Portal**: Enhanced dashboard for client self-service
- **Advanced Analytics**: Platform integrations and reporting
- **Voice Processing**: Voice note workflows for efficiency

### Long Term (1+ years)
- **SaaS Evolution**: Multi-tenant architecture for external agencies
- **Advanced AI**: Predictive analytics and optimization
- **Integration Ecosystem**: Third-party tool connections
- **Enterprise Features**: Advanced reporting and customization

---

## 🔄 Implementation Timeline

### Week 1: Foundation
- **Days 1-2**: Phase 2 (Database & Auth)
- **Days 3-5**: Phase 3 (Core REACH Workflow)

### Week 2: Client Integration
- **Days 1-3**: Phase 4 (Client Integration & Approvals)
- **Days 4-5**: Phase 5 Start (Monitoring setup)

### Week 3: Enhancement
- **Days 1-2**: Phase 5 Complete (Alerts & Slack)
- **Days 3-5**: Phase 6 (Files & Collaboration)

### Week 4: Polish & Deploy
- **Days 1-3**: Phase 7 (UI/UX & Performance)
- **Days 4-5**: Deployment, testing, and handoff

---

## 📝 Next Steps & Decision Points

### Immediate Actions (Phase 2)
1. **Database Schema Review**: Finalize table structures for growth
2. **Role Permission Matrix**: Define exact access levels for each role
3. **Authentication Flow**: Design user creation and first-login process
4. **Client Data Model**: Simple but extensible client profile structure

### Client Decisions Needed
1. **AI Monitoring Timeline**: When to implement intelligent vs. rule-based alerts
2. **Client Dashboard Priority**: How soon full client portal is needed
3. **Voice Note Integration**: Timeline and technical requirements
4. **Scale Requirements**: Confirm growth expectations and timeline

### Technical Decisions
1. **File Storage Strategy**: Local vs. cloud timing decision
2. **Real-time Updates**: WebSocket implementation necessity
3. **Mobile App Future**: API design considerations
4. **Third-party Integrations**: YouTube/social platform priority

---

**This document serves as the single source of truth for Limitless Studio System requirements and implementation plan. It balances the client's vision with practical development constraints, ensuring we build a system that works today and scales for tomorrow.**

---

## 📊 **CURRENT PROGRESS ANALYSIS** (September 27, 2025)

### 🎯 **Excellent Foundation Established**

**Based on screenshots and phase documentation analysis, Content Reach Hub has a solid foundation that aligns well with Limitless Studio System requirements.**

### **✅ Completed Phases (100% Working)**

#### Phases 1-4: Core Infrastructure ✅ COMPLETE
- **Docker Environment**: Full development workflow with hot reload
- **Database Foundation**: Drizzle ORM with PostgreSQL, proper schema design
- **Authentication System**: NextAuth.js with email/password, 3-role system working
- **REACH Workflow**: Complete Kanban board with all 5 stages functional
- **Content Cards**: Full CRUD operations, drag-and-drop working perfectly
- **Team Management**: Multi-team support with role-based access

#### Phase 5: Collaboration (60% Complete) 🟠 IN PROGRESS
- **✅ Comments System**: @mentions, threading, real-time updates working
- **🟡 File Uploads**: Pending implementation (next priority)
- **🟡 User Assignments**: Basic assignment exists, need role-based enhancement
- **🟡 Notifications**: In-app system needed
- **🟡 Slack Integration**: Webhook system pending

### **🔄 Alignment with Client Requirements**

| **Limitless Studio Feature** | **Current Status** | **Gap Analysis** |
|-------------------------------|-------------------|------------------|
| **REACH Workflow** | ✅ 100% Complete | Perfect match! |
| **Kanban Board** | ✅ 100% Complete | Drag-drop working perfectly |
| **User Authentication** | ✅ 100% Complete | Solid foundation |
| **Content Cards** | ✅ 95% Complete | Need metadata enhancements |
| **Team Collaboration** | ✅ 70% Complete | Comments working, files pending |
| **7-Role System** | 🟡 40% Complete | Have 3 roles, need 4 more |
| **Client Management** | 🟡 30% Complete | Teams exist, need client-focus |
| **AI Orchestration** | ❌ 0% Complete | Rule-based approach planned |
| **Voice Notes** | ❌ 0% Complete | Future phase |
| **Dual Dashboards** | 🟡 20% Complete | Single dashboard, role filtering |
| **Client Profiles** | 🟡 20% Complete | Basic info exists, need brand guidelines |

### **🚀 Strengths: What's Working Great**

1. **Solid Technical Foundation**:
   - Next.js 15 with TypeScript (production-ready)
   - PostgreSQL with Drizzle ORM (type-safe, scalable)
   - Docker environment (deployment-ready)
   - Real-time updates with React Query

2. **Core Workflow Complete**:
   - All 5 REACH stages functional
   - Smooth drag-and-drop experience
   - Card management with permissions
   - Comments system with @mentions

3. **Authentication & Security**:
   - Role-based access control working
   - Protected API routes
   - Session management
   - Secure password handling

### **🎯 Strategic Recommendation: Build on Strengths**

**Approach**: Continue with current architecture and enhance rather than rebuild.

**Why This Works**:
- ✅ **80% of core functionality already working**
- ✅ **Database schema can be extended** (not rebuilt)
- ✅ **UI components are reusable** for client features
- ✅ **Team foundation maps perfectly to client structure**

### **📋 Next Steps Priority Order**

1. **Complete Phase 5** (File uploads, notifications, Slack)
2. **Implement Phase 6** (Client management, 7-role system)
3. **Add Phase 7** (Rule-based monitoring system)
4. **Future phases** (Voice notes, advanced analytics)

**Estimated Timeline**: 2-3 weeks to full client requirements compliance.

---

*Document Version: 1.1*
*Created: September 27, 2025*
*Updated: September 27, 2025 - Added current progress analysis*
*Next Review: After Phase 5 completion*