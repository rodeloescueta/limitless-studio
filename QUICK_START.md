# Content OS - Quick Start Guide

**Last Updated:** October 2, 2025

---

## 🚀 Quick Start

```bash
# Navigate to project
cd /home/delo/Desktop/freelance/content-reach-hub/frontend

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 📊 Current Status

✅ **Phase 5 Testing Complete** - Comments & Collaboration API
✅ **151 tests passing** (100% pass rate on active tests)
✅ **4 critical bugs fixed** during testing
⚠️ **3 tests skipped** (require Redis for Phase 6)

---

## 📂 Key Documentation

| Document | Purpose |
|----------|---------|
| **TESTING_RESUME.md** | Resume testing work (START HERE) |
| **TESTING_SESSION_SUMMARY.md** | Latest session summary |
| **docs/TESTING_FINDINGS.md** | All testing findings |
| **docs/PHASE_5_COMPLETION_SUMMARY.md** | Phase 5 details |
| **.claude/tasks/TESTING_STRATEGY_IMPLEMENTATION.md** | Overall testing plan |

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run specific phase
npm test -- tests/integration/api/comments    # Phase 5
npm test -- tests/integration/api/cards       # Phase 4
npm test -- tests/integration/api/teams       # Phase 3
npm test -- tests/integration/auth            # Phase 2
npm test -- tests/unit                        # Unit tests

# Run specific file
npm test -- tests/integration/api/comments/crud.test.ts

# Run with test name filter
npm test -- -t "should create a comment"

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 🔧 Development Commands

```bash
# Development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Database operations
npm run db:generate    # Generate migrations
npm run db:push        # Push schema to database
npm run db:studio      # Open Drizzle Studio

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 🐳 Docker Commands

```bash
# Start all services (web, db, pgAdmin)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f web
docker-compose logs -f db

# Restart services
docker-compose restart
```

---

## 📝 Recent Changes (Phase 5)

### Tests Added
- ✅ Comments CRUD (15 tests)
- ✅ Mentions & Collaboration (5 tests, 3 skipped)

### Bugs Fixed
- ✅ CardDetailsModal runtime crash
- ✅ Added sequential test execution
- ✅ Fixed optional chaining in UI

### Next Steps
- 🔜 Phase 6: Notification Queue (requires Redis)
- 🔜 Fix Phase 3 timing issues (optional)

---

## ⚙️ Configuration Files

```
frontend/
├── .env.local              # Local environment variables
├── .env.test               # Test environment variables
├── vitest.config.ts        # Test configuration
├── drizzle.config.ts       # Database configuration
└── package.json            # Dependencies & scripts
```

---

## 🗄️ Database Access

### PostgreSQL (Development)
```bash
# Connect via psql
PGPASSWORD=devPassword123! psql -h localhost -p 5432 -U postgres -d content_reach_hub

# Via pgAdmin
# URL: http://localhost:5050
# Email: admin@admin.com
# Password: admin
```

### Test Database
```bash
# Connect to test database
PGPASSWORD=devPassword123! psql -h localhost -p 5432 -U postgres -d content_reach_hub_test

# Set up test database (one-time)
npm run test:setup-db
```

---

## 🎯 Quick Issue Resolution

### Tests Failing?
```bash
# 1. Ensure test database exists
npm run test:setup-db

# 2. Clear and re-run
npm test -- --clearCache
npm test

# 3. Check database is running
docker-compose ps
```

### Development Server Not Starting?
```bash
# 1. Check if port 3000 is in use
lsof -i :3000

# 2. Kill process if needed
kill -9 <PID>

# 3. Restart
npm run dev
```

### Database Issues?
```bash
# 1. Restart Docker services
docker-compose down
docker-compose up -d

# 2. Check database logs
docker-compose logs db

# 3. Reset database (caution!)
docker-compose down -v
docker-compose up -d
npm run db:push
```

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Total Tests | 151 passing, 3 skipped |
| Test Coverage | ~80% (target) |
| API Routes | 15+ tested |
| Bugs Fixed | 4 critical |
| Phases Complete | 5/10 |

---

## 🔗 Useful Links

- **Testing Strategy:** `.claude/tasks/TESTING_STRATEGY_IMPLEMENTATION.md`
- **Resume Guide:** `docs/TESTING_RESUME.md`
- **Latest Session:** `TESTING_SESSION_SUMMARY.md`
- **Test Helpers:** `frontend/tests/helpers/`
- **Test README:** `frontend/tests/README.md`

---

## 💡 Pro Tips

1. **Always run tests before committing**
   ```bash
   npm test && git commit
   ```

2. **Use watch mode during development**
   ```bash
   npm run test:watch
   ```

3. **Check specific test file when debugging**
   ```bash
   npm test -- tests/path/to/file.test.ts
   ```

4. **Sequential execution prevents deadlocks**
   - Don't remove `singleFork: true` from vitest.config.ts

5. **Match NextAuth import paths in mocks**
   - Check if route uses `'next-auth'` or `'next-auth/next'`

---

## 📞 Need Help?

Check these documents in order:
1. `TESTING_RESUME.md` - Resume testing work
2. `TESTING_SESSION_SUMMARY.md` - Latest session details
3. `docs/TESTING_FINDINGS.md` - All findings and discoveries
4. `frontend/tests/README.md` - Testing framework guide

---

**Ready to code!** 🚀
