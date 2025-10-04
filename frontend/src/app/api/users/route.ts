import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, teams, teamMembers } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { enqueueNotification } from '@/lib/queue'

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can list users
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    return NextResponse.json(allUsers)

  } catch (error) {
    console.error('Error fetching users:', error)

return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'strategist', 'scriptwriter', 'editor', 'coordinator', 'member', 'client']),
})

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create users
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }

    // Use email as temporary password (user will be prompted to change on first login)
    const temporaryPassword = validatedData.email
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
      })

    // Add user to Main Agency Team automatically (non-client users only)
    if (validatedData.role !== 'client') {
      const mainAgencyTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.isClient, false))
        .limit(1)

      if (mainAgencyTeam && mainAgencyTeam.length > 0) {
        await db.insert(teamMembers).values({
          teamId: mainAgencyTeam[0].id,
          userId: newUser[0].id,
        })
      }
    }

    // Send Slack notification for new user (non-blocking)
    const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    await enqueueNotification({
      type: 'user_created',
      userId: newUser[0].id,
      title: '👋 Welcome to Content Reach Hub!',
      message: `*${newUser[0].firstName} ${newUser[0].lastName}* has been added to the team!\n\n📧 *Email:* ${newUser[0].email}\n👤 *Role:* ${newUser[0].role}\n🔑 *Temporary Password:* ${newUser[0].email}\n\n🔗 *Login here:* ${loginUrl}/auth/signin\n\n⚠️ *Important:* Please change your password on first login.\n\n_Added by ${session.user.name}_`,
      slackEnabled: true,
    })

    return NextResponse.json(newUser[0], { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}