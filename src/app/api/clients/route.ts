import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { teams, clientProfiles, stages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/clients - List all clients (teams where isClient = true)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can list all clients
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clients = await db
      .select({
        team: teams,
        profile: clientProfiles,
      })
      .from(teams)
      .leftJoin(clientProfiles, eq(teams.id, clientProfiles.teamId))
      .where(eq(teams.isClient, true))

    return NextResponse.json(clients)

  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create clients
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      clientCompanyName,
      industry,
      contactEmail,
      brandBio,
      brandVoice,
      targetAudience,
      contentPillars,
      styleGuidelines,
      assetLinks,
      competitiveChannels,
      performanceGoals,
    } = body

    // Validate required fields
    if (!name || !clientCompanyName) {
      return NextResponse.json(
        { error: 'Name and client company name are required' },
        { status: 400 }
      )
    }

    // Create team first
    const [newTeam] = await db
      .insert(teams)
      .values({
        name,
        description,
        clientCompanyName,
        industry,
        contactEmail,
        isClient: true,
        createdBy: session.user.id,
      })
      .returning()

    // Create default REACH stages for the team
    const stageNames = [
      { name: 'Research', position: 0, color: '#3B82F6' },
      { name: 'Envision', position: 1, color: '#8B5CF6' },
      { name: 'Assemble', position: 2, color: '#EC4899' },
      { name: 'Connect', position: 3, color: '#10B981' },
      { name: 'Hone', position: 4, color: '#F59E0B' },
    ]

    await db.insert(stages).values(
      stageNames.map(stage => ({
        teamId: newTeam.id,
        name: stage.name,
        position: stage.position,
        color: stage.color,
        description: `${stage.name} stage`,
      }))
    )

    // Create client profile if any profile data provided
    let profile = null
    if (brandBio || brandVoice || targetAudience || contentPillars) {
      const [newProfile] = await db
        .insert(clientProfiles)
        .values({
          teamId: newTeam.id,
          brandBio,
          brandVoice,
          targetAudience,
          contentPillars,
          styleGuidelines,
          assetLinks,
          competitiveChannels,
          performanceGoals,
        })
        .returning()

      profile = newProfile
    }

    return NextResponse.json({
      team: newTeam,
      profile,
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}