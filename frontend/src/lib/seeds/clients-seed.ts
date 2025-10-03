import { db } from '../db'
import { teams, users } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Seed test client teams
 */
export async function seedClients() {
  console.log('🌱 Seeding test clients...')

  // Get the admin user to set as creator
  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@test.local'))
    .limit(1)

  if (!adminUser) {
    console.error('❌ Admin user not found. Please run the main seed script first.')
    return
  }

  const testClients = [
    {
      name: 'Acme Corporation',
      description: 'Leading technology solutions provider',
      clientCompanyName: 'Acme Corporation',
      industry: 'Technology',
      contactEmail: 'contact@acme.com',
      isClient: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Bright Future Media',
      description: 'Digital marketing and content creation agency',
      clientCompanyName: 'Bright Future Media',
      industry: 'Marketing & Media',
      contactEmail: 'hello@brightfuture.com',
      isClient: true,
      createdBy: adminUser.id,
    },
    {
      name: 'Global Innovations Inc',
      description: 'Innovative products for modern businesses',
      clientCompanyName: 'Global Innovations Inc',
      industry: 'Product Development',
      contactEmail: 'info@globalinnovations.com',
      isClient: true,
      createdBy: adminUser.id,
    },
  ]

  for (const clientData of testClients) {
    // Check if client already exists
    const [existingClient] = await db
      .select()
      .from(teams)
      .where(eq(teams.name, clientData.name))
      .limit(1)

    if (existingClient) {
      console.log(`⏭️  Client "${clientData.name}" already exists, skipping...`)
      continue
    }

    const [newClient] = await db
      .insert(teams)
      .values(clientData)
      .returning()

    console.log(`✅ Created client: ${newClient.clientCompanyName} (${newClient.industry})`)
  }

  console.log('✅ Client seeding complete!')
}

// Run if called directly
if (require.main === module) {
  seedClients()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error seeding clients:', error)
      process.exit(1)
    })
}
