import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachments, contentCards } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface RouteParams {
  params: Promise<{ cardId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

    // Verify card exists and user has access
    const card = await db.query.contentCards.findFirst({
      where: eq(contentCards.id, cardId),
      with: {
        team: {
          with: {
            members: true
          }
        }
      }
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Check if user is a team member
    const isTeamMember = card.team.members.some(member => member.userId === session.user.id)
    if (!isTeamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'File type not allowed. Supported types: PDF, Images (JPG, PNG, GIF, WebP), Word Documents, Text files, CSV, Excel'
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`

    // Create directory structure
    const uploadDir = join(process.cwd(), 'uploads', 'cards', cardId)
    await mkdir(uploadDir, { recursive: true })

    // Generate file hash for deduplication
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')

    // Check for duplicate files
    const existingAttachment = await db.query.attachments.findFirst({
      where: and(
        eq(attachments.contentCardId, cardId),
        eq(attachments.fileHash, fileHash)
      )
    })

    if (existingAttachment) {
      return NextResponse.json({
        error: 'This file has already been uploaded to this card'
      }, { status: 400 })
    }

    // Save file to disk
    const filePath = join(uploadDir, uniqueFilename)
    await writeFile(filePath, buffer)

    // Save attachment record to database
    const [newAttachment] = await db.insert(attachments).values({
      contentCardId: cardId,
      uploadedBy: session.user.id,
      filename: uniqueFilename,
      originalFilename: file.name,
      filePath: `uploads/cards/${cardId}/${uniqueFilename}`,
      fileSize: file.size,
      mimeType: file.type,
      fileHash
    }).returning()

    // Get the attachment with user details
    const attachmentWithUser = await db.query.attachments.findFirst({
      where: eq(attachments.id, newAttachment.id),
      with: {
        uploadedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json(attachmentWithUser)

  } catch (error) {
    console.error('Upload error:', error)
    
return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
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

    const { cardId } = await params

    // Verify card exists and user has access
    const card = await db.query.contentCards.findFirst({
      where: eq(contentCards.id, cardId),
      with: {
        team: {
          with: {
            members: true
          }
        }
      }
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Check if user is a team member
    const isTeamMember = card.team.members.some(member => member.userId === session.user.id)
    if (!isTeamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get attachments for this card
    const cardAttachments = await db.query.attachments.findMany({
      where: eq(attachments.contentCardId, cardId),
      with: {
        uploadedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: (attachments, { desc }) => [desc(attachments.createdAt)]
    })

    return NextResponse.json(cardAttachments)

  } catch (error) {
    console.error('Get attachments error:', error)
    
return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}