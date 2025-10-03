import { db } from './index'
import { users, teams, teamMembers, stages } from './schema'
import bcrypt from 'bcryptjs'

// Load environment variables from .env.local
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  console.log('💡 Make sure to run this script with DATABASE_URL set or from the frontend directory with .env.local file')
  process.exit(1)
}

const STAGE_NAMES = ['Research', 'Envision', 'Assemble', 'Connect', 'Hone'] as const
const STAGE_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'] as const

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Create test users with different roles
    console.log('Creating users...')
    const hashedPassword = await bcrypt.hash('password123', 10)

    const [admin, strategist, scriptwriter, editor, coordinator, member] = await db
      .insert(users)
      .values([
        {
          email: 'admin@test.local',
          passwordHash: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isFirstLogin: false,
        },
        {
          email: 'strategist@test.local',
          passwordHash: hashedPassword,
          firstName: 'Strategy',
          lastName: 'Lead',
          role: 'strategist',
          isFirstLogin: false,
        },
        {
          email: 'scriptwriter@test.local',
          passwordHash: hashedPassword,
          firstName: 'Script',
          lastName: 'Writer',
          role: 'scriptwriter',
          isFirstLogin: false,
        },
        {
          email: 'editor@test.local',
          passwordHash: hashedPassword,
          firstName: 'Video',
          lastName: 'Editor',
          role: 'editor',
          isFirstLogin: false,
        },
        {
          email: 'coordinator@test.local',
          passwordHash: hashedPassword,
          firstName: 'Content',
          lastName: 'Coordinator',
          role: 'coordinator',
          isFirstLogin: false,
        },
        {
          email: 'member@test.local',
          passwordHash: hashedPassword,
          firstName: 'Team',
          lastName: 'Member',
          role: 'member',
          isFirstLogin: false,
        },
      ])
      .returning()

    console.log(`✓ Created ${6} users`)

    // Create a test team
    console.log('Creating team...')
    const [team] = await db
      .insert(teams)
      .values({
        name: 'Test Agency Team',
        description: 'A test team for role-based permission testing',
        createdBy: admin.id,
        isClient: false,
      })
      .returning()

    console.log(`✓ Created team: ${team.name}`)

    // Add all users to the team
    console.log('Adding team members...')
    await db.insert(teamMembers).values([
      { teamId: team.id, userId: admin.id },
      { teamId: team.id, userId: strategist.id },
      { teamId: team.id, userId: scriptwriter.id },
      { teamId: team.id, userId: editor.id },
      { teamId: team.id, userId: coordinator.id },
      { teamId: team.id, userId: member.id },
    ])

    console.log(`✓ Added ${6} team members`)

    // Create REACH workflow stages
    console.log('Creating REACH workflow stages...')
    await db.insert(stages).values(
      STAGE_NAMES.map((name, index) => ({
        teamId: team.id,
        name,
        description: `${name} stage of the REACH workflow`,
        position: index,
        color: STAGE_COLORS[index],
      }))
    )

    console.log(`✓ Created ${STAGE_NAMES.length} stages: ${STAGE_NAMES.join(', ')}`)

    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n📋 Test Users:')
    console.log('━'.repeat(60))
    console.log('Email                    | Password     | Role')
    console.log('━'.repeat(60))
    console.log('admin@test.local         | password123  | Admin')
    console.log('strategist@test.local    | password123  | Strategist')
    console.log('scriptwriter@test.local  | password123  | Scriptwriter')
    console.log('editor@test.local        | password123  | Editor')
    console.log('coordinator@test.local   | password123  | Coordinator')
    console.log('member@test.local        | password123  | Member')
    console.log('━'.repeat(60))
    console.log('\n🎯 All users are part of "Test Agency Team"')
    console.log('🔄 REACH workflow stages created: Research → Envision → Assemble → Connect → Hone')
    console.log('\n🚀 You can now login with any of the above credentials!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seed()
