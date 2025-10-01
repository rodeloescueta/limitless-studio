import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { teams, clientProfiles, teamMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// GET /api/clients/[id] - Get client details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = params.id

    // Check if user has access (admin or team member)
    const isAdmin = session.user.role === 'admin'
    const isMember = !isAdmin && await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, clientId),
          eq(teamMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (!isAdmin && !isMember.length) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [result] = await db
      .select({
        team: teams,
        profile: clientProfiles,
      })
      .from(teams)
      .leftJoin(clientProfiles, eq(teams.id, clientProfiles.teamId))
      .where(eq(teams.id, clientId))
      .limit(1)

    if (!result) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update clients
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientId = params.id
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

    // Update team
    const teamUpdate: any = {}
    if (name !== undefined) teamUpdate.name = name
    if (description !== undefined) teamUpdate.description = description
    if (clientCompanyName !== undefined) teamUpdate.clientCompanyName = clientCompanyName
    if (industry !== undefined) teamUpdate.industry = industry
    if (contactEmail !== undefined) teamUpdate.contactEmail = contactEmail

    if (Object.keys(teamUpdate).length > 0) {
      teamUpdate.updatedAt = new Date()
      await db
        .update(teams)
        .set(teamUpdate)
        .where(eq(teams.id, clientId))
    }

    // Update or create client profile
    const profileUpdate: any = {}
    if (brandBio !== undefined) profileUpdate.brandBio = brandBio
    if (brandVoice !== undefined) profileUpdate.brandVoice = brandVoice
    if (targetAudience !== undefined) profileUpdate.targetAudience = targetAudience
    if (contentPillars !== undefined) profileUpdate.contentPillars = contentPillars
    if (styleGuidelines !== undefined) profileUpdate.styleGuidelines = styleGuidelines
    if (assetLinks !== undefined) profileUpdate.assetLinks = assetLinks
    if (competitiveChannels !== undefined) profileUpdate.competitiveChannels = competitiveChannels
    if (performanceGoals !== undefined) profileUpdate.performanceGoals = performanceGoals

    let profile = null
    if (Object.keys(profileUpdate).length > 0) {
      profileUpdate.updatedAt = new Date()

      // Check if profile exists
      const [existingProfile] = await db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.teamId, clientId))
        .limit(1)

      if (existingProfile) {
        // Update existing profile
        const [updated] = await db
          .update(clientProfiles)
          .set(profileUpdate)
          .where(eq(clientProfiles.teamId, clientId))
          .returning()
        profile = updated
      } else {
        // Create new profile
        const [created] = await db
          .insert(clientProfiles)
          .values({
            teamId: clientId,
            ...profileUpdate,
          })
          .returning()
        profile = created
      }
    }

    // Fetch updated data
    const [result] = await db
      .select({
        team: teams,
        profile: clientProfiles,
      })
      .from(teams)
      .leftJoin(clientProfiles, eq(teams.id, clientProfiles.teamId))
      .where(eq(teams.id, clientId))
      .limit(1)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete clients
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const clientId = params.id

    // Delete team (cascade will handle related records)
    await db
      .delete(teams)
      .where(eq(teams.id, clientId))

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}