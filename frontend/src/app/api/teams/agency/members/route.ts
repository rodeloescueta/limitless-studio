import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, teams, teamMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/teams/agency/members - Get all Main Agency Team members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Main Agency Team (first non-client team)
    const mainAgencyTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.isClient, false))
      .limit(1)

    if (!mainAgencyTeam || mainAgencyTeam.length === 0) {
      return NextResponse.json({ error: 'Main Agency Team not found' }, { status: 404 })
    }

    // Get all members of the Main Agency Team
    const members = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatar: users.avatar,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, mainAgencyTeam[0].id))

    return NextResponse.json(members)

  } catch (error) {
    console.error('Error fetching agency members:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
