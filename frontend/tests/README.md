# Testing Guide for Content OS

This directory contains all tests for the Content OS application, organized into unit tests, integration tests, and E2E tests.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/                   # Unit tests for isolated functions/components
│   └── lib/               # Library/utility function tests
│       └── permissions.test.ts
├── integration/           # Integration tests for API routes & database
│   ├── api/              # API route tests
│   └── services/         # Service layer tests
├── e2e/                  # End-to-end tests (Playwright)
│   └── workflows/        # Complete user workflow tests
├── helpers/              # Test utilities and helpers
│   ├── db.ts            # Database test utilities
│   ├── auth.ts          # Authentication helpers
│   ├── teams.ts         # Team creation helpers
│   ├── cards.ts         # Card creation helpers
│   └── index.ts         # Export barrel
├── scripts/              # Test setup scripts
│   └── setup-test-db.ts # Test database initialization
└── setup.ts             # Global test setup (mocks, env vars)
```

## Test Database Setup

Before running integration tests, you need to set up the test database:

```bash
# Create and migrate test database
npm run test:setup-db
```

This will:
1. Drop existing `content_reach_hub_test` database (if exists)
2. Create a fresh test database
3. Run all migrations

**Environment Variables:**
- Test database URL: `postgresql://postgres:devPassword123!@localhost:5432/content_reach_hub_test`
- Automatically configured in `tests/helpers/db.ts`

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { hasStageAccess } from '@/lib/permissions';

describe('hasStageAccess', () => {
  it('should return true for admin on all stages', () => {
    expect(hasStageAccess('admin', 'research', 'read')).toBe(true);
  });
});
```

### Integration Tests

Integration tests test API routes, database interactions, and service layers:

```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { clearDatabase, closeDatabase, createTestUser } from '../helpers';

describe('Teams API', () => {
  beforeEach(async () => {
    await clearDatabase(); // Clear database before each test
  });

  afterAll(async () => {
    await closeDatabase(); // Clean up database connection
  });

  it('should create a team', async () => {
    const user = await createTestUser({ role: 'admin' });

    // Test your API route here
    // Mock NextAuth session
    // Make request to API
    // Assert response
  });
});
```

### E2E Tests (Playwright)

E2E tests verify complete user workflows through the browser:

```typescript
import { test, expect } from '@playwright/test';

test('scriptwriter can create and move cards through research and envision', async ({ page }) => {
  await page.goto('/login');
  // ... complete workflow test
});
```

## Test Helpers

### Database Helpers (`tests/helpers/db.ts`)

```typescript
import { clearDatabase, testDb } from './helpers';

// Clear all tables before each test
await clearDatabase();

// Use testDb for database operations
const users = await testDb.select().from(schema.users);
```

### Authentication Helpers (`tests/helpers/auth.ts`)

```typescript
import { createTestUser, createTestUsers, createMockSession } from './helpers';

// Create a single test user
const admin = await createTestUser({ role: 'admin', email: 'admin@test.com' });

// Create all role users at once
const users = await createTestUsers();
const { admin, strategist, scriptwriter, editor, coordinator } = users;

// Create a mock session
const session = createMockSession(admin);
```

### Team Helpers (`tests/helpers/teams.ts`)

```typescript
import { createTestTeam, createStagesForTeam, addTeamMember } from './helpers';

// Create a team
const team = await createTestTeam({ name: 'My Team', createdBy: admin.id });

// Create REACH stages for team
const stages = await createStagesForTeam(team.id);
const { research, envision, assemble, connect, hone } = stages;

// Add team member
await addTeamMember({ teamId: team.id, userId: user.id, role: 'member' });
```

### Card Helpers (`tests/helpers/cards.ts`)

```typescript
import { createTestCard, createTestSubtask, createTestComment } from './helpers';

// Create a card
const card = await createTestCard({
  title: 'Test Card',
  stageId: stages.research.id,
  teamId: team.id,
  createdBy: user.id,
});

// Create a subtask
const subtask = await createTestSubtask({
  cardId: card.id,
  title: 'Test Subtask',
  assignedTo: user.id,
});

// Create a comment
const comment = await createTestComment({
  cardId: card.id,
  userId: user.id,
  content: 'Test comment with @mention',
  mentions: [anotherUser.id],
});
```

## Coverage Goals

We aim for the following coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Priority areas for testing:
1. ✅ Permission system (`lib/permissions.ts`) - 100% coverage
2. API routes (especially RBAC logic) - Target 90%+
3. Database operations - Target 85%+
4. Critical user workflows (E2E) - 5 key flows minimum

## Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('should update card status', async () => {
  // Arrange
  const user = await createTestUser({ role: 'admin' });
  const card = await createTestCard({ createdBy: user.id });

  // Act
  const response = await updateCard(card.id, { status: 'done' });

  // Assert
  expect(response.status).toBe('done');
});
```

### 2. Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 3. Clear Test Names

```typescript
// ✅ Good
it('scriptwriter can edit cards in research stage')

// ❌ Bad
it('test permissions')
```

### 4. Test Edge Cases

```typescript
describe('hasStageAccess', () => {
  it('should handle invalid role gracefully', () => {
    expect(hasStageAccess('invalid_role', 'research', 'read')).toBe(false);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Every push to feature branches
- Pull requests to `main`
- Pre-commit hooks (planned)

**CI Pipeline:**
1. Setup test database
2. Run unit tests
3. Run integration tests
4. Run E2E tests (critical flows only)
5. Generate coverage report
6. Fail if coverage < 80%

## Debugging Tests

### Run a Single Test File

```bash
npm test -- tests/unit/lib/permissions.test.ts
```

### Run a Single Test Suite

```bash
npm test -- tests/unit/lib/permissions.test.ts -t "canDeleteCard"
```

### Enable Verbose Output

```bash
npm test -- --reporter=verbose
```

### Debug in VS Code

Add this to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Tests failing with database errors

**Problem:** Connection refused or database not found

**Solution:**
```bash
# Ensure PostgreSQL is running
docker compose -f docker-compose.dev.yml up db

# Reset test database
npm run test:setup-db
```

### Mock not working

**Problem:** NextAuth session returns undefined

**Solution:** Check `tests/setup.ts` for proper mocks, or use `vi.mock()` in your test file.

### Tests passing locally but failing in CI

**Problem:** Environment-specific issues

**Solution:** Check environment variables in CI, ensure test database is created, verify Node version matches.

## Next Steps

See `.claude/tasks/TESTING_STRATEGY_IMPLEMENTATION.md` for the full testing roadmap:

- ✅ Phase 1: Test Infrastructure Setup (Complete)
- 🔄 Phase 2: Integration Tests - Auth & Authorization (Next)
- ⏳ Phase 3: Integration Tests - Team Management
- ⏳ Phase 4: Integration Tests - Content Cards
- ⏳ Phase 5-10: Additional test coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Drizzle ORM Testing Guide](https://orm.drizzle.team/docs/overview)
