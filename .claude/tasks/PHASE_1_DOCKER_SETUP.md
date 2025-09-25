# Phase 1: Docker Infrastructure Setup

## Overview
Set up production-ready Docker environment with Next.js, PostgreSQL, and pgAdmin using Docker Compose v2.

## Goals
- Local development environment that mirrors production
- Multi-stage Docker builds for optimization
- Persistent data storage
- Easy deployment to Contabo VPS later

## Tasks Breakdown

### 1. Next.js Project Initialization
**Status**: Pending
**Command**: `npx create-next-app@latest content-reach-hub --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`

**Rationale**:
- Latest Next.js with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- App directory structure (modern)
- Source directory organization
- Import alias for cleaner imports

---

### 2. Multi-stage Dockerfile Creation
**Status**: Pending

**Key Requirements**:
- **Stage 1**: Dependencies installation
- **Stage 2**: Build process
- **Stage 3**: Production runtime
- Optimized layer caching
- Security best practices
- Minimal final image size

**Production Considerations**:
- Use `node:18-alpine` for smaller images
- Multi-stage build to exclude dev dependencies
- Proper user permissions (non-root)
- Health check endpoints
- Environment variable handling

---

### 3. Docker Compose v2 Services
**Status**: Pending

**Services Configuration**:

#### Web Service (Next.js)
- Build from local Dockerfile
- Port mapping: 3000:3000
- Environment variables from `.env.local`
- Volume mounting for development
- Depends on database service
- Restart policy

#### Database Service (PostgreSQL)
- Official PostgreSQL 15 image
- Persistent volume for data
- Environment variables for credentials
- Port mapping: 5432:5432
- Health check configuration
- Initial database creation

#### pgAdmin Service
- Official pgAdmin4 image
- Web interface on port 8080
- Pre-configured server connection
- Persistent configuration
- Depends on database service

#### Networks
- Internal network for services
- External access for development

---

### 4. Environment Configuration
**Status**: Pending

**Files to Create**:
- `.env.example` - Template with all required variables
- `.env.local` - Local development variables (git-ignored)
- `.dockerignore` - Exclude unnecessary files from build

**Environment Variables**:
```env
# Database
POSTGRES_DB=content_reach_hub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password_here
DATABASE_URL=postgresql://postgres:secure_password_here@db:5432/content_reach_hub

# NextAuth (for future phases)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin_password_here

# Node Environment
NODE_ENV=development
```

---

### 5. Development Scripts
**Status**: Pending

**Package.json Scripts**:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:build": "docker compose build",
    "docker:logs": "docker compose logs -f web",
    "docker:db": "docker compose exec db psql -U postgres -d content_reach_hub"
  }
}
```

---

### 6. Production Readiness Features

#### Docker Configuration
- **Health Checks**: Ensure services are running properly
- **Restart Policies**: Auto-restart on failure
- **Resource Limits**: Prevent resource exhaustion
- **Security**: Non-root user, minimal attack surface

#### Next.js Configuration
- **Output**: Standalone for Docker deployment
- **Environment**: Production optimizations
- **Logging**: Structured logging for monitoring
- **Port Configuration**: Configurable port binding

#### Database Setup
- **Persistent Volumes**: Data survives container restarts
- **Connection Pooling**: Efficient database connections
- **Backup Strategy**: Ready for production backups
- **Migration Path**: Database schema versioning

---

## Implementation Steps

### Step 1: Initialize Next.js Project
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Step 2: Create Dockerfile
Multi-stage build with proper optimization and security.

### Step 3: Create docker-compose.yml
Configure all services with proper networking and volumes.

### Step 4: Environment Setup
Create `.env.example` and configure environment variables.

### Step 5: Update package.json
Add Docker management scripts for development workflow.

### Step 6: Test Everything
Verify all services start, communicate, and persist data.

---

## Success Criteria

### Functional Requirements
- [x] Next.js app runs in Docker container
- [x] PostgreSQL database accessible and persistent
- [x] pgAdmin provides database administration
- [x] All services start with single `docker compose up` command
- [x] Hot reload works for development
- [x] Production build creates optimized image

### Technical Requirements
- [x] Docker Compose v2 syntax
- [x] Multi-stage Dockerfile for production
- [x] Persistent database volumes
- [x] Proper environment variable handling
- [x] Security best practices (non-root user, minimal image)
- [x] Ready for Contabo VPS deployment

### Development Experience
- [x] Simple development workflow
- [x] Fast startup times
- [x] Easy log access and debugging
- [x] Database inspection via pgAdmin
- [x] Clear documentation for team onboarding

---

## Testing Plan

### Local Testing
1. **Clean start**: `docker compose down -v && docker compose up --build`
2. **Service health**: Verify all services start without errors
3. **Database connection**: Test Next.js can connect to PostgreSQL
4. **pgAdmin access**: Verify database administration works
5. **Development workflow**: Test hot reload and code changes
6. **Data persistence**: Stop/start containers, verify data persists

### Production Readiness
1. **Build optimization**: Verify production build size and performance
2. **Security scan**: Check for vulnerabilities in images
3. **Resource usage**: Monitor memory and CPU usage
4. **Port configuration**: Test different port configurations
5. **Environment isolation**: Test with different environment files

---

## Troubleshooting Guide

### Common Issues
- **Port conflicts**: Use different ports if 3000/5432/8080 are taken
- **Permission errors**: Ensure proper file permissions for volumes
- **Network issues**: Check Docker network configuration
- **Build failures**: Clear Docker cache if builds fail
- **Database connection**: Verify connection strings and credentials

### Debug Commands
```bash
# View all containers
docker compose ps

# Check container logs
docker compose logs web
docker compose logs db
docker compose logs pgadmin

# Access database directly
docker compose exec db psql -U postgres -d content_reach_hub

# Rebuild everything
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## Next Phase Preparation

### Database Integration Points
- Connection configuration ready for Drizzle ORM
- Environment variables prepared for database URL
- Migration system can be added in Phase 2

### Authentication Integration Points
- Environment variables prepared for NextAuth
- HTTPS/TLS ready for production deployment
- Session storage ready for database implementation

### Deployment Readiness
- Docker configuration ready for Contabo VPS
- Environment variable management for production
- Nginx reverse proxy configuration prepared
- TLS/SSL certificate integration ready

---

## Implementation Log

### Changes Made
- [x] **COMPLETED**: Initialize Next.js project in `frontend/` directory with TypeScript, Tailwind, App Router
- [x] **COMPLETED**: Create production-ready Dockerfile with multi-stage build for Next.js
- [x] **COMPLETED**: Create development Dockerfile for hot reload
- [x] **COMPLETED**: Setup docker-compose.yml and docker-compose.dev.yml with all services
- [x] **COMPLETED**: Configure environment variables (.env.local, .env.example)
- [x] **COMPLETED**: Test complete setup - all services running successfully

### Issues Encountered
- **pgAdmin email validation**: Initial email `admin@contentreach.local` was rejected due to .local TLD
- **Environment variable loading**: Docker Compose wasn't loading .env.local automatically
- **Next.js health check**: Custom health endpoint created at `/api/health`

### Solutions Applied
- **Email fix**: Changed pgAdmin email to `admin@example.com`
- **Env loading**: Added `env_file: - .env.local` to all services in docker-compose files
- **Health endpoint**: Created `/frontend/src/app/api/health/route.ts` for Docker health checks

### Performance Notes
- **Build time**: Next.js Docker build takes ~30 seconds with dependencies
- **Startup time**: All services start in ~60 seconds
- **Database init**: PostgreSQL initializes with custom schema successfully
- **Memory usage**: All services running smoothly in development mode

## ✅ PHASE 1 COMPLETE - SUCCESS CRITERIA MET

### Verified Working Features:
1. ✅ **Next.js Application**: Running on http://localhost:3000 with health check endpoint
2. ✅ **PostgreSQL Database**: Running with persistent data and custom initialization
3. ✅ **pgAdmin Interface**: Accessible on http://localhost:8080 for database management
4. ✅ **Docker Networking**: All services communicate internally via app-network
5. ✅ **Environment Configuration**: Proper variable loading and security practices
6. ✅ **Development Workflow**: Hot reload working, logs accessible, easy restart/rebuild

### Ready for Phase 2: Database Foundation
- Database connection established and tested
- Drizzle ORM can be integrated seamlessly
- Migration system ready for implementation
- Admin user seeder preparation complete

---

## 🔄 DEVELOPMENT WORKFLOW UPDATE

### Simplified Single-Command Development

After initial implementation, the development workflow was further optimized:

**New Simplified Startup:**
```bash
npm run dev
```

**What this single command does:**
- ✅ Starts PostgreSQL database with persistent volumes
- ✅ Launches pgAdmin for database management
- ✅ Runs Next.js dev server with Turbopack and hot reload
- ✅ Sets up networking and loads environment variables
- ✅ Automatically installs dependencies in container

### Key Improvements Made

1. **Docker Compose Changes:**
   - Changed web service to use `node:18-alpine` directly
   - Added `command: sh -c "npm install && npm run dev"`
   - Direct volume mounting for true hot reload
   - No Docker build step required for development

2. **Package.json Scripts Updated:**
   - `npm run dev` - Start all services
   - `npm run dev:down` - Stop all services
   - `npm run dev:logs` - View Next.js logs
   - `npm run dev:logs:db` - View database logs
   - `npm run clean` - Clean up containers and volumes

3. **Next.js Configuration:**
   - Fixed config warning by removing invalid `outputFileTracingRoot`
   - Kept `output: 'standalone'` for production builds
   - Health endpoint at `/api/health` working perfectly

### Development Experience
- **Startup time**: ~30 seconds for all services
- **Hot reload**: Instant code changes with Turbopack
- **Database persistence**: Data survives container restarts
- **No build required**: Direct npm run dev in container
- **Environment**: All variables loaded automatically

This creates the optimal development experience requested - just run `npm run dev` and start coding! 🚀