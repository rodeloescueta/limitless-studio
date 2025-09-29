#!/usr/bin/env ts-node

import { seedTestUsers } from './test-users'

async function main() {
  console.log('🚀 Starting database seeding...')

  try {
    await seedTestUsers()
    console.log('✅ Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}