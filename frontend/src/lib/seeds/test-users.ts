import { db } from '../db'
import { users } from '../db/schema'
import { eq, inArray } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Test user accounts for each role as specified in the plan
const testUsers = [
  { email: 'admin@test.local', role: 'admin' as const, firstName: 'Admin', lastName: 'Manager', password: 'admin123' },
  { email: 'strategist@test.local', role: 'strategist' as const, firstName: 'Sarah', lastName: 'Strategist', password: 'strategist123' },
  { email: 'scriptwriter@test.local', role: 'scriptwriter' as const, firstName: 'Sam', lastName: 'Writer', password: 'scriptwriter123' },
  { email: 'editor@test.local', role: 'editor' as const, firstName: 'Emma', lastName: 'Editor', password: 'editor123' },
  { email: 'coordinator@test.local', role: 'coordinator' as const, firstName: 'Chris', lastName: 'Coordinator', password: 'coordinator123' }
]

export async function seedTestUsers() {
  console.log('🌱 Seeding test users...')

  try {
    // Check if users already exist
    const existingUsers = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, [
        'admin@test.local',
        'strategist@test.local',
        'scriptwriter@test.local',
        'editor@test.local',
        'coordinator@test.local'
      ]))

    const existingEmails = existingUsers.map(u => u.email)
    const usersToCreate = testUsers.filter(user => !existingEmails.includes(user.email))

    if (usersToCreate.length === 0) {
      console.log('✅ All test users already exist')
      return
    }

    // Create users with hashed passwords
    for (const userData of usersToCreate) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      await db.insert(users).values({
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isFirstLogin: false
      })

      console.log(`✅ Created ${userData.role}: ${userData.email}`)
    }

    console.log('🎉 Test users seeded successfully!')
    console.log('\n📋 Test User Credentials:')
    console.log('=========================')
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(12)} | ${user.email.padEnd(25)} | ${user.password}`)
    })

  } catch (error) {
    console.error('❌ Error seeding test users:', error)
    throw error
  }
}

export { testUsers }