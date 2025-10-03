import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, not } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/users/[userId] - Get single user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view user details
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[userId] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update users
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()

    // Validation schema
    const updateSchema = z.object({
      firstName: z.string().min(1, 'First name is required').optional(),
      lastName: z.string().min(1, 'Last name is required').optional(),
      email: z.string().email('Invalid email format').optional(),
      role: z
        .enum(['admin', 'strategist', 'scriptwriter', 'editor', 'coordinator', 'member', 'client'])
        .optional(),
    })

    const validatedData = updateSchema.parse(body)

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check email uniqueness if email is being changed
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: and(eq(users.email, validatedData.email), not(eq(users.id, userId))),
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        )
      }
    }

    // Prevent admin from changing their own role to non-admin (self-lockout protection)
    if (
      validatedData.role &&
      validatedData.role !== 'admin' &&
      session.user.id === userId
    ) {
      return NextResponse.json(
        { error: 'Cannot change your own admin role. This would lock you out of the system.' },
        { status: 400 }
      )
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[userId] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete users
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if this is the last admin (prevent system lockout)
    if (existingUser.role === 'admin') {
      const adminCount = await db.query.users.findMany({
        where: eq(users.role, 'admin'),
      })

      if (adminCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user. System requires at least one admin.' },
          { status: 400 }
        )
      }
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    
return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
