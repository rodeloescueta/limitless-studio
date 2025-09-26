import { db } from './index';
import { users, teams, stages, teamMembers } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

// Default REACH stages for each team
const DEFAULT_STAGES = [
  { name: 'Research', position: 1, description: 'Research and ideation phase' },
  { name: 'Envision', position: 2, description: 'Content planning and framework design' },
  { name: 'Assemble', position: 3, description: 'Production and content creation' },
  { name: 'Connect', position: 4, description: 'Publishing and client approval' },
  { name: 'Hone', position: 5, description: 'Analytics and optimization' },
];

async function seedAdminUser() {
  console.log('🔄 Checking for existing admin user...');

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists:', existingAdmin[0].email);
      return existingAdmin[0];
    }

    console.log('🔄 Creating admin user...');

    // Generate secure 8-character password (hex = readable characters)
    const password = randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const [adminUser] = await db.insert(users).values({
      email: 'admin@contentreach.local',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isFirstLogin: true,
    }).returning();

    console.log('='.repeat(60));
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${adminUser.id}`);
    console.log('='.repeat(60));
    console.log('⚠️  SAVE THIS PASSWORD - IT WILL NOT BE SHOWN AGAIN');
    console.log('⚠️  You will be forced to change it on first login');
    console.log('='.repeat(60));

    return adminUser;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

async function seedDefaultTeam(adminUserId: string) {
  console.log('🔄 Creating default team with REACH stages...');

  try {
    // Check if a team already exists
    const existingTeams = await db.select().from(teams).limit(1);

    if (existingTeams.length > 0) {
      console.log('✅ Team already exists:', existingTeams[0].name);
      return existingTeams[0];
    }

    // Create default team
    const [team] = await db.insert(teams).values({
      name: 'Content Reach Team',
      description: 'Default team for content creation workflow',
      createdBy: adminUserId,
    }).returning();

    // Add admin to team
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: adminUserId,
    });

    // Create REACH stages for the team
    const stagePromises = DEFAULT_STAGES.map(stage =>
      db.insert(stages).values({
        teamId: team.id,
        name: stage.name,
        position: stage.position,
        description: stage.description,
      })
    );

    await Promise.all(stagePromises);

    console.log('✅ Default team created with REACH stages');
    console.log(`🏢 Team: ${team.name}`);
    console.log(`📋 Stages: ${DEFAULT_STAGES.map(s => s.name).join(' → ')}`);

    return team;
  } catch (error) {
    console.error('❌ Failed to create default team:', error);
    throw error;
  }
}

async function runSeeder() {
  console.log('🌱 Starting database seeding...');
  console.log('📅', new Date().toISOString());
  console.log('');

  try {
    // Seed admin user
    const adminUser = await seedAdminUser();

    // Seed default team with stages
    await seedDefaultTeam(adminUser.id);

    console.log('');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Save the admin password shown above');
    console.log('   2. Start the application: npm run dev');
    console.log('   3. Navigate to http://localhost:3000');
    console.log('   4. Log in with the admin credentials');
    console.log('   5. Change password on first login');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  runSeeder().then(() => {
    console.log('✨ Seeding process completed');
    process.exit(0);
  });
}

// Export functions for use in other scripts
export { seedAdminUser, seedDefaultTeam, runSeeder };