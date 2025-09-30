import axios from 'axios'

interface SlackNotificationData {
  type: string
  title: string
  message: string
  cardId?: string
}

const SLACK_COLORS: Record<string, string> = {
  assignment: '#3b82f6',    // Blue
  mention: '#8b5cf6',       // Purple
  deadline: '#f59e0b',      // Orange
  approval: '#10b981',      // Green
  stage_change: '#6366f1',  // Indigo
}

export async function sendSlackNotification(data: SlackNotificationData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl || webhookUrl.trim() === '') {
    console.log('⚠️  Slack webhook URL not configured, skipping Slack notification')
    return
  }

  const cardLink = data.cardId
    ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
    : null

  const payload = {
    text: data.title,
    attachments: [
      {
        color: SLACK_COLORS[data.type] || '#6b7280',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${data.title}*\n${data.message}`,
            },
          },
          ...(cardLink
            ? [
                {
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: 'View Dashboard',
                      },
                      url: cardLink,
                    },
                  ],
                },
              ]
            : []),
        ],
      },
    ],
  }

  try {
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    })
    console.log(`✅ Sent Slack notification: ${data.title}`)
  } catch (error) {
    console.error('❌ Failed to send Slack notification:', error)
    throw error // Will trigger retry
  }
}

export default { sendSlackNotification }