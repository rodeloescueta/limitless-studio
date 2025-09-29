# 🤖 AI Orchestration (Rule-Based MVP)

## 📌 Overview

The goal of **AI Orchestration** is to **monitor tasks, deadlines, and notifications** in the REACH workflow.

👉 Important: **We do not need AI to achieve the basics.**

- Rule-based orchestration is enough for tracking deadlines, sending alerts, and escalating tasks.
- “AI” will be an **optional layer on top** to add smart insights (summaries, prioritization, suggestions).

---

## 🏗️ Rule-Based Orchestration (MVP)

### ✅ Core Features

- Monitor all **cards** and their stage durations
- Trigger alerts when a card exceeds its **time window**
- Escalate to managers if **no response in 24h**
- Log events in the **alerts table**
- Send notifications via:
  - In-app notification center
  - Slack (webhook)
  - Email fallback (optional)

### ⏱️ Stage Time Windows

| Stage    | Max Duration |
| -------- | ------------ |
| Research | 2 days       |
| Envision | 2 days       |
| Assemble | 3 days       |
| Connect  | 1 day        |
| Hone     | 7 days       |

### ⚙️ Example Logic

```ts
const LIMITS = {
  Research: 2 * DAY,
  Envision: 2 * DAY,
  Assemble: 3 * DAY,
  Connect: 1 * DAY,
  Hone: 7 * DAY,
};

for (const card of overdueCards()) {
  createAlert(card, "overdue", msg(card));
  notifySlack(card.assignee, msg(card));

  if (staleAlert(card, 24 * HOUR)) {
    notifySlack(card.manager, escalateMsg(card));
  }
}
```

🧠 Optional “AI” Layer (Future Enhancements)
Where AI Adds Value

Daily Briefs
Generate personalized summaries of today’s priorities for each user.

Smart Summaries
Convert long comment threads into concise next steps.

Assignee Suggestions
Recommend the best available scriptwriter/editor based on past performance and workload.

Voice Note Processing (future)

Transcribe client voice notes (STT, e.g., Whisper API).

Extract tasks and auto-fill card briefs.

Example AI Use Cases

Slack “Daily Brief”:

“You have 3 scripts pending approval (avg 30h wait, expected 12h). Card ‘Crypto 101’ is delayed. Suggested priority: review today.”

Card Thread Summarization:
Input: Comment history
Output: “Blocker = missing brand assets. Next action: strategist approval.”

🗄️ Database & Tables
alerts
Field Type Notes
id UUID PK
cardId UUID Ref: content_cards
userId UUID Who alert is for
type TEXT overdue / escalation / info
message TEXT Alert message
isRead BOOLEAN Default: false
createdAt TIMESTAMP Default: now()
stage_transitions
Field Type Notes
id UUID PK
cardId UUID Ref: content_cards
fromStage TEXT Stage moved from
toStage TEXT Stage moved to
userId UUID Who made the transition
transitionedAt TIMESTAMP When the change occurred
🔄 Implementation Plan
Step 1: Rule Engine

Cron job or BullMQ worker checks all active cards

Compare against LIMITS table

Create alerts + send notifications

Step 2: Escalation Workflow

If alert exists > 24h unresolved → escalate to manager

Auto-reassign if still unresolved (future enhancement)

Step 3: Notification Integration

In-app dropdown

Slack webhook

Email fallback

Step 4: AI Add-ons (Future)

Add LLM API key (OpenAI / Anthropic / etc.)

Create isolated aiService.ts for prompts

Use advisory outputs only (non-blocking)

🚀 Key Takeaways

MVP = Rule Engine + Alerts + Escalations

AI layer is optional and should be advisory only

Keeps the system reliable while giving the client the “AI” branding they want

Can expand later to include smart briefs, summaries, and auto-assignment
