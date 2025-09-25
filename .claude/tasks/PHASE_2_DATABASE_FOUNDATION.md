# Phase 2: Database Foundation

## Overview
Implement type-safe database layer with Drizzle ORM, design core schema for multi-team content management, and create admin user seeding system.

## Goals
- Type-safe database operations with Drizzle ORM
- Solid foundation for user management and team structure
- REACH workflow stages properly modeled
- Migration system for schema evolution
- Admin user seeder for secure initial setup

## Tasks Breakdown

### 1. Drizzle ORM Setup
**Status**: Pending
**Duration**: ~2 hours

**Implementation Steps**:
```bash
# Install Drizzle ORM dependencies
npm install drizzle-orm pg @types/pg
npm install -D drizzle-kit
```

**Configuration Files**:
- `drizzle.config.ts` - Drizzle Kit configuration
- `lib/db.ts` - Database connection and client setup
- `lib/db/index.ts` - Drizzle schema exports

**Key Requirements**:
- PostgreSQL connection using existing DATABASE_URL
- Type-safe query building
- Development and production environment support
- Integration with existing Docker setup

---

### 2. Core Database Schema Design
**Status**: Pending
**Duration**: ~3 hours

**Schema Structure**:

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  is_first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('admin', 'member', 'client');
```

#### Teams Table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Team Members (Junction Table)
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

#### Stages Table (REACH Workflow)
```sql
CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, position)
);
```

#### Content Cards Table
```sql
CREATE TABLE content_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  content_type VARCHAR(50),
  priority content_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  due_date TIMESTAMP,
  position INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE content_priority AS ENUM ('low', 'medium', 'high', 'urgent');
```

**Relationships Overview**:
- Users belong to multiple teams (many-to-many via team_members)
- Teams have stages (REACH workflow columns)
- Content cards belong to teams and sit in specific stages
- Users can be assigned to content cards
- Support for metadata storage (JSONB for flexibility)

---

### 3. Migration System Implementation
**Status**: Pending
**Duration**: ~1 hour

**Migration Setup**:
```typescript
// drizzle.config.ts
export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};
```

**Scripts to Add**:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "tsx lib/db/migrate.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Migration Commands**:
- Generate migrations from schema changes
- Apply migrations to database
- Rollback capability for development
- Studio interface for database inspection

---

### 4. Admin User Seeder
**Status**: Pending
**Duration**: ~1 hour

**Seeder Requirements**:
- Create first admin user automatically
- Generate secure random 8-character password
- Hash password using bcrypt
- Output password securely for initial login
- Run only if no admin users exist

**Seeder Script**: `lib/db/seed.ts`
```typescript
import { db } from './index';
import { users } from './schema';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

async function seedAdminUser() {
  // Check if admin exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log('Admin user already exists');
    return;
  }

  // Generate secure password
  const password = randomBytes(4).toString('hex'); // 8 character hex
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin user
  const adminUser = await db.insert(users).values({
    email: 'admin@contentreach.local',
    passwordHash: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isFirstLogin: true,
  }).returning();

  console.log('='.repeat(50));
  console.log('ADMIN USER CREATED');
  console.log('='.repeat(50));
  console.log(`Email: admin@contentreach.local`);
  console.log(`Password: ${password}`);
  console.log('='.repeat(50));
  console.log('SAVE THIS PASSWORD - IT WILL NOT BE SHOWN AGAIN');
  console.log('='.repeat(50));
}
```

---

### 5. Database Utilities and Helpers
**Status**: Pending
**Duration**: ~2 hours

**Utility Functions**:

#### User Management
```typescript
// lib/db/users.ts
export async function createUser(userData: CreateUserData) {
  // Hash password, create user, handle team assignment
}

export async function getUserByEmail(email: string) {
  // Get user with team memberships
}

export async function updateUserPassword(userId: string, newPassword: string) {
  // Hash and update password, set first_login to false
}
```

#### Team Operations
```typescript
// lib/db/teams.ts
export async function createTeamWithStages(teamData: CreateTeamData) {
  // Create team and default REACH stages
}

export async function addUserToTeam(userId: string, teamId: string) {
  // Add team membership
}

export async function getTeamMembers(teamId: string) {
  // Get all team members with user details
}
```

#### Content Card Operations
```typescript
// lib/db/cards.ts
export async function createContentCard(cardData: CreateCardData) {
  // Create card, assign to stage, set position
}

export async function moveCard(cardId: string, newStageId: string, newPosition: number) {
  // Update card stage and position
}

export async function getTeamCards(teamId: string) {
  // Get all cards for team organized by stage
}
```

**Query Optimization**:
- Proper indexing for performance
- Eager loading for related data
- Pagination support for large datasets
- Search functionality preparation

---

## Implementation Order

### Step 1: Core Dependencies & Configuration
```bash
# Install Drizzle dependencies
npm install drizzle-orm pg @types/pg bcrypt @types/bcrypt tsx
npm install -D drizzle-kit

# Create configuration files
touch drizzle.config.ts
touch lib/db/schema.ts
touch lib/db/index.ts
```

### Step 2: Database Schema Definition
- Define all tables in `lib/db/schema.ts`
- Set up proper relationships and constraints
- Add TypeScript types for all entities

### Step 3: Migration System Setup
- Configure Drizzle Kit
- Generate initial migration
- Test migration apply/rollback

### Step 4: Database Connection & Client
- Set up connection pool
- Configure for Docker environment
- Test connectivity

### Step 5: Seeder & Initial Data
- Create admin user seeder
- Create default team stages (REACH)
- Test seeding process

### Step 6: Utility Functions
- Build core database operations
- Add error handling
- Create TypeScript interfaces

---

## Success Criteria

### Functional Requirements
- [ ] Drizzle ORM connected to PostgreSQL
- [ ] All core tables created with proper relationships
- [ ] Migration system working (generate, apply, rollback)
- [ ] Admin user seeder creates secure initial admin
- [ ] Database utilities provide type-safe operations
- [ ] All operations work in Docker environment

### Technical Requirements
- [ ] TypeScript integration with full type safety
- [ ] Proper error handling and logging
- [ ] Environment-based configuration
- [ ] Ready for NextAuth integration (Phase 3)
- [ ] Performance optimized with proper indexing
- [ ] Development tools (Drizzle Studio) accessible

### Data Model Requirements
- [ ] Multi-team support with user memberships
- [ ] Role-based access control foundation
- [ ] REACH workflow stages properly modeled
- [ ] Content cards with rich metadata support
- [ ] Extensible for future features (comments, files, etc.)

---

## Testing Strategy

### Database Connection Testing
```bash
# Test connection
npm run db:studio

# Verify tables exist
docker-compose exec db psql -U postgres -d content_reach_hub -c "\dt"
```

### Schema Validation
```bash
# Generate and apply migrations
npm run db:generate
npm run db:migrate

# Verify schema
npm run db:studio
```

### Seeder Testing
```bash
# Run seeder
npm run db:seed

# Verify admin user created
docker-compose exec db psql -U postgres -d content_reach_hub -c "SELECT * FROM users WHERE role = 'admin';"
```

### Utility Function Testing
- Create test team and verify REACH stages
- Test user creation and team assignment
- Verify content card operations

---

## Risk Mitigation

### Schema Design Risks
- **Over-normalization**: Keep schema simple for MVP, add complexity later
- **Missing relationships**: Document all entity relationships upfront
- **Performance**: Add indexes for common query patterns

### Migration Risks
- **Data loss**: Test all migrations in development first
- **Rollback issues**: Ensure all migrations are reversible
- **Production safety**: Use transactions for complex migrations

### Security Risks
- **Password storage**: Use bcrypt with proper salt rounds (12+)
- **Admin access**: Secure password generation and one-time display
- **Database access**: Proper connection string security

---

## Next Phase Integration

### Authentication Preparation (Phase 3)
- User table ready for NextAuth integration
- Password hashing compatible with NextAuth
- Role-based access control foundation in place
- Session management preparation

### API Route Preparation
- Database utilities ready for API endpoints
- Error handling patterns established
- TypeScript interfaces for API responses
- Validation schemas prepared

---

## Environment Dependencies

### Required Environment Variables
```env
# Existing (already configured)
DATABASE_URL=postgresql://postgres:secure_password_here@db:5432/content_reach_hub

# New for Phase 2
BCRYPT_ROUNDS=12
ADMIN_EMAIL=admin@contentreach.local
```

### Docker Integration
- All operations must work within Docker containers
- Database utilities accessible from web container
- pgAdmin should show all new tables and data
- Migration scripts executable in Docker environment

---

## Current Status: Ready to Begin

**Prerequisites Met**:
- ✅ PostgreSQL database running and accessible
- ✅ Next.js environment configured
- ✅ Docker development workflow established
- ✅ Environment variables configured

**Next Actions**:
1. Install Drizzle ORM dependencies
2. Create database schema definitions
3. Set up migration system
4. Implement admin user seeder
5. Build core database utilities

**Expected Timeline**: 1-2 days for complete Phase 2 implementation

---

## ✅ PHASE 2 COMPLETE - IMPLEMENTATION RESULTS

### Successfully Implemented (December 25, 2025)

#### 1. Drizzle ORM Setup - ✅ COMPLETE
- **Dependencies installed**: drizzle-orm, pg, postgres, bcrypt, tsx, drizzle-kit
- **Configuration created**: `drizzle.config.ts` with PostgreSQL connection
- **Database connection**: `src/lib/db/index.ts` with connection pooling
- **Integration**: Full TypeScript integration with schema inference

#### 2. Database Schema Design - ✅ COMPLETE
- **Schema file**: `src/lib/db/schema.ts` with 5 core tables
- **Tables created**: users, teams, team_members, stages, content_cards
- **Relationships**: Proper foreign keys and indexes for performance
- **Types**: Full TypeScript type generation for all entities
- **Enums**: user_role (admin/member/client), content_priority (low/medium/high/urgent)

**Database Schema Applied**:
```sql
✅ users (9 columns, 2 indexes)
✅ teams (6 columns)
✅ team_members (4 columns, 2 indexes, unique constraint)
✅ stages (6 columns, 1 index, unique constraint)
✅ content_cards (14 columns, 5 indexes, 4 foreign keys)
```

#### 3. Migration System - ✅ COMPLETE
- **Migration generated**: `0000_heavy_spectrum.sql` with all schema changes
- **Migration runner**: `src/lib/db/migrate.ts` for automated deployment
- **Applied successfully**: All tables, indexes, and constraints created
- **Package.json scripts**: db:generate, db:push, db:migrate, db:seed, db:studio

#### 4. Admin User Seeder - ✅ COMPLETE
- **Seeder script**: `src/lib/db/seed.ts` with secure password generation
- **Admin user created**: email: `admin@contentreach.local`, password: `7ba42eee`
- **Default team**: "Content Reach Team" with full REACH workflow stages
- **Security**: 8-character hex password, bcrypt hashing (12 rounds), first-login flag

**Seeded Data**:
```
👤 Admin User: da898ec3-0580-4a45-8ec1-319c59e6c1a6
🏢 Default Team: Content Reach Team
📋 REACH Stages: Research → Envision → Assemble → Connect → Hone
```

#### 5. Database Utilities - ✅ COMPLETE
- **User utilities**: `src/lib/db/users.ts` - Full CRUD, authentication, password management
- **Team utilities**: `src/lib/db/teams.ts` - Team management, member operations, statistics
- **Card utilities**: `src/lib/db/content-cards.ts` - Content cards, stage movement, assignments
- **Central exports**: `src/lib/db/utils.ts` - Consolidated API with transaction support
- **Testing verified**: All utilities tested and working correctly

**Utility Functions Available**:
- User: createUser, getUserByEmail, verifyPassword, updatePassword, etc.
- Team: createTeamWithStages, addUserToTeam, getTeamStats, etc.
- Cards: createContentCard, moveCard, getUserAssignedCards, etc.

#### 6. Testing & Verification - ✅ COMPLETE
- **Test script**: `src/lib/db/test-utils.ts` for comprehensive functionality testing
- **All tests passed**: User lookup, team operations, card creation, statistics
- **Data verification**: Confirmed seeded admin user and team structure
- **Performance verified**: Proper indexing and query optimization

### Technical Achievements

#### Database Architecture
- **Multi-team support**: Users can belong to multiple teams via junction table
- **Role-based access**: Admin/Member/Client roles with proper constraints
- **REACH workflow**: 5-stage content pipeline (Research→Envision→Assemble→Connect→Hone)
- **Card management**: Full position-based ordering with drag-drop support preparation
- **Audit trail**: Created/updated timestamps and user tracking

#### Type Safety & Developer Experience
- **Full TypeScript**: All database operations are type-safe
- **Schema inference**: Automatic type generation from database schema
- **Relationship mapping**: Drizzle relations for complex queries
- **Error handling**: Proper error messages and validation

#### Production Readiness
- **Connection pooling**: Optimized database connections
- **Migration system**: Version-controlled schema changes
- **Security**: Password hashing, parameterized queries, input validation
- **Performance**: Proper indexing strategy for common query patterns

### Ready for Phase 3: Authentication System

**Integration Points Prepared**:
- ✅ User table compatible with NextAuth.js
- ✅ Password verification utilities ready
- ✅ Role-based access control foundation
- ✅ First-login workflow support
- ✅ Admin user management capabilities

**Database Commands Working**:
```bash
npm run db:generate  # Generate new migrations
npm run db:push      # Push schema changes
npm run db:migrate   # Run migration scripts
npm run db:seed      # Seed initial data
npm run db:studio    # Database GUI (Drizzle Studio)
```

### 🔐 IMPORTANT: Admin Credentials

**Save these credentials for Phase 3 authentication testing:**
- Email: `admin@contentreach.local`
- Password: `7ba42eee`
- Role: admin
- First login: Required password change

---

## Next Phase: Authentication System (Phase 3)

With Phase 2 complete, we're ready to implement:
1. NextAuth.js email/password authentication
2. Role-based access control middleware
3. Protected API routes
4. Session management
5. Admin user management interface
6. Slack notification system for user creation

The database foundation provides everything needed for a robust authentication system!