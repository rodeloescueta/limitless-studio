import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { teams } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'

// GET /api/teams/clients - Get all client teams
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all teams marked as clients
    const clients = await db
      .select({
        id: teams.id,
        name: teams.name,
        clientCompanyName: teams.clientCompanyName,
        industry: teams.industry,
        contactEmail: teams.contactEmail,
      })
      .from(teams)
      .where(eq(teams.isClient, true))
      .orderBy(asc(teams.name))

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    
return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
