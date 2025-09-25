# Content Reach Hub - Content Operating System

A specialized project management system for content creation agencies built with Next.js, PostgreSQL, and Docker.

## 🚀 Quick Start

### Development Mode

Start all services (database, pgAdmin, and Next.js with hot reload):

```bash
npm run dev
```

This single command will:
- Start PostgreSQL database with persistent data
- Launch pgAdmin for database management
- Run Next.js dev server with Turbopack and hot reload
- Set up all networking and environment variables

### Access Points

- **Frontend Application**: http://localhost:3000
- **pgAdmin (Database UI)**: http://localhost:8080
  - Email: `admin@example.com`
  - Password: `adminDev123!`
- **Health Check**: http://localhost:3000/api/health

### Useful Commands

```bash
# Stop all services
npm run dev:down

# View Next.js logs
npm run dev:logs

# View database logs
npm run dev:logs:db

# Connect to database directly
npm run db:connect

# Clean up (remove containers and volumes)
npm run clean

# Force rebuild all containers
npm run rebuild
```

## 🏗️ Project Structure

```
content-reach-hub/
├── frontend/                 # Next.js application (TypeScript + Tailwind)
├── docker-compose.dev.yml    # Development environment
├── docker-compose.yml        # Production environment
├── .env.local               # Development environment variables
├── .env.example             # Environment template
├── db/init/                 # Database initialization scripts
└── .claude/tasks/           # Implementation documentation
```

## 🔧 Technology Stack

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, App Router
- **Database**: PostgreSQL 15 with persistent volumes
- **Admin**: pgAdmin 4 for database management
- **Development**: Docker Compose with hot reload support
- **Build Tool**: Turbopack for fast development builds

## 🎯 REACH Workflow

Content moves through 5 stages:
- **Research** → **Envision** → **Assemble** → **Connect** → **Hone**

Each stage represents a step in the content creation pipeline, from ideation to analytics.

## 📝 Development Notes

- Hot reload is enabled for all code changes
- Database data persists between container restarts
- pgAdmin configuration is saved in Docker volumes
- Environment variables are loaded from `.env.local`
- Health checks ensure services are running properly

## 🚀 Production Deployment

For production deployment to Contabo VPS:

```bash
npm run prod
```

This uses the production Docker configuration with optimized builds and security settings.

---

Built for content creators, by content creators. 🎬