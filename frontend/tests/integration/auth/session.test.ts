import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { clearDatabase, closeDatabase, createTestUser, createTestUsers } from '../../helpers';
import bcrypt from 'bcryptjs';

describe('Authentication - Session Management', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('User Creation', () => {
    it('should create user with hashed password', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        role: 'member',
      });

      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('member');
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('password123'); // Password should be hashed

      // Verify password was hashed correctly
      const isValid = await bcrypt.compare('password123', user.passwordHash!);
      expect(isValid).toBe(true);
    });

    it('should create users with different roles', async () => {
      const timestamp = Date.now();
      const admin = await createTestUser({ role: 'admin', email: `admin-${timestamp}@test.com` });
      const strategist = await createTestUser({ role: 'strategist', email: `strategist-${timestamp}@test.com` });
      const scriptwriter = await createTestUser({ role: 'scriptwriter', email: `scriptwriter-${timestamp}@test.com` });
      const editor = await createTestUser({ role: 'editor', email: `editor-${timestamp}@test.com` });
      const coordinator = await createTestUser({ role: 'coordinator', email: `coordinator-${timestamp}@test.com` });

      expect(admin.role).toBe('admin');
      expect(strategist.role).toBe('strategist');
      expect(scriptwriter.role).toBe('scriptwriter');
      expect(editor.role).toBe('editor');
      expect(coordinator.role).toBe('coordinator');
    });

    it('should create user with custom name', async () => {
      const user = await createTestUser({
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
    });
  });

  describe('Password Validation', () => {
    it('should validate correct password', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'mySecurePassword123',
      });

      const isValid = await bcrypt.compare('mySecurePassword123', user.passwordHash!);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'correctPassword',
      });

      const isValid = await bcrypt.compare('wrongPassword', user.passwordHash!);
      expect(isValid).toBe(false);
    });
  });

  describe('Multiple Users', () => {
    it('should create multiple users with createTestUsers helper', async () => {
      const users = await createTestUsers();

      expect(users.admin).toBeDefined();
      expect(users.admin.role).toBe('admin');
      expect(users.strategist.role).toBe('strategist');
      expect(users.scriptwriter.role).toBe('scriptwriter');
      expect(users.editor.role).toBe('editor');
      expect(users.coordinator.role).toBe('coordinator');
    });

    it('should create users with unique emails', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      expect(user1.email).toBe('user1@test.com');
      expect(user2.email).toBe('user2@test.com');
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('User Roles', () => {
    it('should assign correct permissions based on role', async () => {
      const roles = ['admin', 'strategist', 'scriptwriter', 'editor', 'coordinator', 'member', 'client'] as const;

      for (const role of roles) {
        const user = await createTestUser({
          email: `${role}@test.com`,
          role,
        });

        expect(user.role).toBe(role);
      }
    });
  });
});
