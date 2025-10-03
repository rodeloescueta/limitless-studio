import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface RouteParams {
  params: Promise<{ attachmentId: string }>
}

// Type for the attachment query result with nested relations
type AttachmentWithRelations = {
  id: string
  contentCardId: string
  uploadedBy: string
  filename: string
  originalFilename: string
  filePath: string
  fileSize: number
  mimeType: string
  fileHash: string | null
  createdAt: Date
  contentCard: {
    id: string
    teamId: string
    team: {
      id: string
      members: Array<{
        userId: string
      }>
    }
  }
}

type AttachmentWithUploader = AttachmentWithRelations & {
  uploadedByUser: {
    id: string
    role: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attachmentId } = await params

    // Get attachment with card and team info
    const attachment = await db.query.attachments.findFirst({
      where: eq(attachments.id, attachmentId),
      with: {
        contentCard: {
          with: {
            team: {
              with: {
                members: true
              }
            }
          }
        }
      }
    }) as AttachmentWithRelations | undefined

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check if user is a team member
    const isTeamMember = attachment.contentCard.team.members.some(
      member => member.userId === session.user.id
    )

    if (!isTeamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Read file from disk
    const filePath = join(process.cwd(), attachment.filePath)
    const fileBuffer = await readFile(filePath)

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', attachment.mimeType)
    headers.set('Content-Length', attachment.fileSize.toString())
    headers.set('Content-Disposition', `inline; filename="${attachment.originalFilename}"`)

    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Download error:', error)
    
return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attachmentId } = await params

    // Get attachment with card and team info
    const attachment = await db.query.attachments.findFirst({
      where: eq(attachments.id, attachmentId),
      with: {
        contentCard: {
          with: {
            team: {
              with: {
                members: true
              }
            }
          }
        },
        uploadedBy: true
      }
    }) as AttachmentWithUploader | undefined

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check if user is a team member and either uploaded the file or is admin
    const isTeamMember = attachment.contentCard.team.members.some(
      member => member.userId === session.user.id
    )
    const isUploader = attachment.uploadedByUser.id === session.user.id
    const isAdmin = session.user.role === 'admin'

    if (!isTeamMember || (!isUploader && !isAdmin)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete from database first
    await db.delete(attachments).where(eq(attachments.id, attachmentId))

    // Try to delete file from disk (don't fail if file doesn't exist)
    try {
      const { unlink } = await import('fs/promises')
      const filePath = join(process.cwd(), attachment.filePath)
      await unlink(filePath)
    } catch (fileError) {
      console.warn('Could not delete file from disk:', fileError)
      // Continue - database record is deleted
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    
return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}