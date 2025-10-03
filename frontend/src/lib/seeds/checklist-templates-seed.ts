import { db } from '../db'
import { stages, checklistTemplates } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Seed default checklist templates for each REACH workflow stage
 */
export async function seedChecklistTemplates() {
  console.log('🌱 Seeding checklist templates...')

  // Get all stages
  const allStages = await db.select().from(stages)

  for (const stage of allStages) {
    const stageName = stage.name.toLowerCase()

    let templates: Array<{ title: string; description: string; position: number; isRequired: boolean }> = []

    switch (stageName) {
      case 'research':
        templates = [
          {
            title: 'Identify target audience',
            description: 'Define who this content is for and what they care about',
            position: 0,
            isRequired: true,
          },
          {
            title: 'Research competitors',
            description: 'Analyze similar content and identify gaps',
            position: 1,
            isRequired: false,
          },
          {
            title: 'Define content pillars',
            description: 'Establish key themes and messaging',
            position: 2,
            isRequired: true,
          },
          {
            title: 'Gather reference materials',
            description: 'Collect sources, data, and inspiration',
            position: 3,
            isRequired: false,
          },
        ]
        break

      case 'envision':
        templates = [
          {
            title: 'Create script outline',
            description: 'Draft the main structure and flow',
            position: 0,
            isRequired: true,
          },
          {
            title: 'Define hook/intro',
            description: 'Craft an attention-grabbing opening',
            position: 1,
            isRequired: true,
          },
          {
            title: 'Set content format',
            description: 'Decide on video style, length, and format',
            position: 2,
            isRequired: true,
          },
          {
            title: 'Plan visuals/graphics',
            description: 'Outline what visual elements are needed',
            position: 3,
            isRequired: false,
          },
          {
            title: 'Review and approve outline',
            description: 'Get stakeholder approval on the plan',
            position: 4,
            isRequired: true,
          },
        ]
        break

      case 'assemble':
        templates = [
          {
            title: 'Record video/audio',
            description: 'Capture the main content footage',
            position: 0,
            isRequired: true,
          },
          {
            title: 'Edit footage',
            description: 'Cut, arrange, and refine the content',
            position: 1,
            isRequired: true,
          },
          {
            title: 'Add graphics/effects',
            description: 'Include text overlays, animations, and visual elements',
            position: 2,
            isRequired: false,
          },
          {
            title: 'Add music/sound effects',
            description: 'Include background music and audio enhancements',
            position: 3,
            isRequired: false,
          },
          {
            title: 'Create thumbnail',
            description: 'Design an eye-catching thumbnail image',
            position: 4,
            isRequired: true,
          },
          {
            title: 'Quality check',
            description: 'Review for errors, timing, and quality',
            position: 5,
            isRequired: true,
          },
        ]
        break

      case 'connect':
        templates = [
          {
            title: 'Upload to platform',
            description: 'Upload final video to YouTube/TikTok/Instagram',
            position: 0,
            isRequired: true,
          },
          {
            title: 'Write description/caption',
            description: 'Create engaging description with keywords and CTAs',
            position: 1,
            isRequired: true,
          },
          {
            title: 'Add tags/categories',
            description: 'Optimize for discoverability',
            position: 2,
            isRequired: true,
          },
          {
            title: 'Schedule publish time',
            description: 'Set optimal publish date and time',
            position: 3,
            isRequired: true,
          },
          {
            title: 'Notify client for approval',
            description: 'Send preview link to client for final approval',
            position: 4,
            isRequired: true,
          },
          {
            title: 'Client approved',
            description: 'Confirm client has reviewed and approved',
            position: 5,
            isRequired: true,
          },
        ]
        break

      case 'hone':
        templates = [
          {
            title: 'Track analytics',
            description: 'Monitor views, engagement, and performance metrics',
            position: 0,
            isRequired: true,
          },
          {
            title: 'Collect feedback',
            description: 'Gather comments and audience reactions',
            position: 1,
            isRequired: false,
          },
          {
            title: 'Document insights',
            description: 'Record what worked well and what to improve',
            position: 2,
            isRequired: true,
          },
          {
            title: 'Calculate ROAC',
            description: 'Measure Return on Attention Created',
            position: 3,
            isRequired: false,
          },
          {
            title: 'Share results with team',
            description: 'Present findings and learnings',
            position: 4,
            isRequired: true,
          },
        ]
        break

      default:
        console.log(`⏭️  No default templates for stage: ${stageName}`)
        continue
    }

    // Insert templates for this stage
    for (const template of templates) {
      await db.insert(checklistTemplates).values({
        stageId: stage.id,
        ...template,
      })
    }

    console.log(`✅ Created ${templates.length} templates for ${stage.name} stage`)
  }

  console.log('✅ Checklist templates seeding complete!')
}

// Run if called directly
if (require.main === module) {
  seedChecklistTemplates()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error seeding checklist templates:', error)
      process.exit(1)
    })
}
