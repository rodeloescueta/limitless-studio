# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan & Review

### Before starting work

- Write a plan to .claude/tasks/TASK_NAME.md.
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
- Don’t over plan it, always think MVP.
- Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing

- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

Content OS (Operating System) - A specialized project management system for content creation agencies. Think "Trello for content creators" with AI-powered insights and collaboration features.

### Core Workflow: REACH

- **Research** → **Envision** → **Assemble** → **Connect** → **Hone**
- Each stage is a column in a Kanban board
- Content Cards move through stages with rich collaboration features

### User Roles

- **Admin**: Manage team, all content access
- **Member**: Create/edit cards, tasks, comments
- **Client/Approver**: View, comment, approve in Connect stage

## Technology Stack

### Core Framework

- **Next.js** (App Router) with TypeScript
- **PostgreSQL** database with **Drizzle ORM**
- **NextAuth.js** for authentication

### UI & Interaction

- **shadcn/ui** + **TailwindCSS** for components
- **dnd-kit** for drag-and-drop Kanban functionality
- **TanStack Query** for server state management
- **React Hook Form + Zod** for form validation

### Infrastructure

- **Docker Compose** (web, db, pgAdmin services)
- **Nginx** reverse proxy for production
- **PostgreSQL** with pgAdmin for database management

## Development Commands

```bash
# Development setup (once implemented)
npm install
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript checks

# Database operations
npm run db:generate        # Generate Drizzle migrations
npm run db:push           # Push schema to database
npm run db:migrate        # Run migrations
npm run db:studio         # Open Drizzle Studio

# Docker development
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs web   # View app logs
```

## Architecture Overview

### Database Schema (Core Tables)

- `users`: Authentication + role-based access (`admin`|`member`|`client`)
- `teams`: Team organization
- `team_members`: Team membership with roles
- `stages`: REACH workflow columns per team
- `content_cards`: Core content items with rich metadata
- `subtasks`: Assignable tasks within cards
- `comments`: Collaboration with mentions
- `attachments`: File uploads per card
- `analytics`: Performance data for Hone stage

### API Structure

```
/api/auth/*           - NextAuth endpoints
/api/teams/*          - Team management
/api/cards/*          - Content card CRUD
/api/cards/[id]/subtasks  - Subtask management
/api/cards/[id]/comments  - Comment system
/api/ai/*             - AI assistance endpoints
/api/analytics/*      - Analytics & insights
```

### Key Components Architecture

- **KanbanBoard**: Main drag-drop interface using dnd-kit
- **ContentCard**: Rich card component with expandable details
- **AIAssistant**: Contextual AI suggestions within cards
- **CollaborationPanel**: Comments, mentions, assignments
- **RoleGate**: Permission wrapper for role-based access

### State Management Pattern

- **Server State**: TanStack Query for API data
- **Client State**: React useState/useReducer for UI state
- **Form State**: React Hook Form with Zod validation
- **Auth State**: NextAuth session management

## Development Workflow

### Authentication Flow

1. NextAuth.js handles authentication
2. Role stored in `users.role` database field
3. API routes check permissions via session
4. UI components use `RoleGate` wrapper for access control

### Content Card Lifecycle

1. **Research**: Capture ideas, AI-generated suggestions
2. **Envision**: Script outlines, frameworks, content planning
3. **Assemble**: Production tasks, file attachments, editing
4. **Connect**: Publishing approval, client review workflow
5. **Hone**: Analytics input, AI-generated insights

### AI Integration Points

- Content cards: "Suggest Ideas/Hooks" button
- Hone stage: "Summarize Analytics" insights
- Extensible wrapper for switching AI providers (OpenAI, etc.)

## File Structure Expectations

```
/app                    # Next.js App Router
  /api                  # API route handlers
  /dashboard            # Main Kanban interface
  /auth                 # Authentication pages
/components             # Reusable UI components
  /ui                   # shadcn/ui components
  /kanban              # Kanban-specific components
  /content-cards       # Card components
/lib                    # Utilities & configurations
  /auth.ts             # NextAuth configuration
  /db.ts               # Database connection
  /ai.ts               # AI service wrapper
/db                     # Database schema & migrations
  /schema.ts           # Drizzle schema definitions
  /migrations/         # Database migration files
/docker-compose.yml     # Development environment
/.env.local            # Local environment variables
```

## Key Development Principles

### Role-Based Access Control (RBAC)

- Check permissions in both API routes and UI components
- Use database-driven roles rather than hardcoded permissions
- Implement proper session management with NextAuth

### Collaboration-First Design

- Real-time updates where possible
- Comments, mentions, and assignments on all content
- Clear ownership and accountability for each task

### AI Integration Strategy

- Keep AI features lightweight and contextual
- Switchable provider architecture for flexibility
- Focus on practical workflow enhancement, not novelty

### Docker Development

- All services run in containers for consistency
- PostgreSQL data persistence via Docker volumes
- pgAdmin available for database inspection and management

## Deployment Notes

- Target: VPS deployment (DigitalOcean/Contabo)
- Nginx reverse proxy with Let's Encrypt TLS
- Docker Compose orchestration for production
- Environment-based configuration management
