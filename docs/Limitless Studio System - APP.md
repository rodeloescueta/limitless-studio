

# **🧠 Limitless Studio System**

### **Product Requirements Document (PRD) — v1.0**

---

## **1\. 📌 Executive Summary**

The **Limitless Studio System** is a private, AI-orchestrated operating system designed exclusively for **The Limitless Company** to manage all video content production.

Built around the **REACH workflow (Research → Envision → Assemble → Connect → Hone)**, the system coordinates every role — strategists, scriptwriters, editors, coordinators, and managers — in one intelligent platform.

Its core goal is to **eliminate time gaps, missed tasks, and communication breakdowns** by using AI to orchestrate the entire creative process, check in with team members, manage approvals, and track outcomes — all while keeping every user focused on their role-specific tasks.

![][image1]

---

## **2\. 🌍 Background & Problem Statement**

### **Context**

The Limitless team currently uses ClickUp to manage creative production across multiple clients. However, due to nested subtasks, fragmented checklists, and overwhelming dashboards, critical steps are often forgotten or delayed.

Videos stall between handoffs, feedback loops lag, and project managers spend time manually following up. As content volume grows (20+ clients, 200+ videos, multiple editors and writers), these inefficiencies compound.

### **Problem**

There is no **central system that “thinks” like a studio** — one that ensures accountability, visualizes flow, and keeps each team member moving in sync.

We need a **self-managing production brain** — an internal OS that automatically coordinates Limitless’s video pipeline, ensures approvals happen on time, and alerts staff before bottlenecks occur.

---

## **3\. 🎯 Objectives & Goals**

* Eliminate time gaps and lost tasks between stages  
* Provide clear, role-based dashboards for each contributor  
* Enable AI to track, alert, and escalate overdue items  
* Automate stage approvals and progressions  
* Keep all client assets, bios, and guidelines one click away  
* Display team earnings, progress, and performance streaks  
* Give managers real-time visibility into pipeline health  
* Maintain simplicity and creative clarity across all roles

---

## **4\. 💡 Key Concepts**

### **4.1 REACH Framework**

The system follows Limitless’s proprietary **REACH method**, which mirrors how ideas evolve into finished content:

| Stage | Description |
| ----- | ----- |
| **Research** | Capture insights, pain points, audience hooks, and raw ideas |
| **Envision** | Turn ideas into structured scripts and creative directions |
| **Assemble** | Edit videos, design thumbnails, finalize creative assets |
| **Connect** | Publish, schedule, and attach post links |
| **Hone** | Track analytics, test variations, and extract insights |

### **4.2 Unit of Work: “Video Card”**

Each **card \= one video project**.

It passes through REACH stages and stores everything related to that video: script, assets, approvals, links, performance data, and assigned team.

### **4.3 Dual Dashboard Architecture** 

The system operates two distinct interfaces: Internal Dashboard: Full REACH workflow management for Limitless team Client Dashboard: Simplified view showing: 

* Pending approvals (ideas, scripts, final edits)   
* Publishing schedule & recently published content   
* Key analytics & performance metrics   
* ROAC moments (press mentions, brand deals, wins)   
* Celebratory animations when content goes live

---

## **5\. 👥 User Roles & Permissions**

| Role | Description | Permissions |
| ----- | ----- | ----- |
| **Admin / Manager** | Oversees all operations, reviews performance | Full access |
| **Strategist** | Approves scripts, edits, and final videos | Approve, comment, reassign |
| **Scriptwriter** | Writes and revises scripts | Access Research \+ Envision |
| **Editor / Designer** | Edits videos, designs thumbnails | Access Assemble \+ Connect |
| **Coordinator** | Orchestrates end-to-end workflow, manages handoffs between stages, ensures timeline adherence. Publishes content, attaches live links, tracks data | Research/Envision/Assemble: Read-only (can see progress, cannot edit) \- Connect/Hone: Full access (manage publishing, analytics) \- Global: Can reassign tasks, send reminders, update timelines |
| **AI System** | Acts as project manager | Alert, escalate, track |
| **Client** | Reviews ideas, provides voice notes, approves scripts/edits  | Approve ideas/scripts, upload voice notes, Read/comments, view analytics  |

---

## **6\. 🧩 Core Features & Functional Requirements**

### **6.1 REACH Kanban Board**

* Five visual columns for the REACH stages  
* Each card shows: title, client, format (Short/Long), assigned roles, status, due window  
* Drag-and-drop transitions trigger automations  
* Each stage has its own checklist of deliverables

---

### **6.2 AI Orchestration Engine**

The system’s core intelligence:

* Monitors all cards and task progress  
* Sends contextual alerts if:  
  * A staff member hasn’t responded to an assignment  
  * A stage hasn’t moved in its expected timeframe  
  * Approvals are pending too long  
* Escalates non-response to a manager  
* Reassigns idle tasks or flags overloads  
* Learns over time (average stage durations, bottlenecks)

AI delivers messages via:

* Slack DM (primary)  
* Email fallback  
* SMS  
* In-app notification

---

### **6.3 Role-Based Views**

Each team member sees only what’s relevant:

| Role | View | What They See |
| ----- | ----- | ----- |
| Manager | Global REACH board | All videos \+ team performance |
| Scriptwriter | Research \+ Envision | Assigned videos \+ deadlines |
| Editor | Assemble \+ Connect | Editing queue \+ assets |
| Coordinator | Connect \+ Hone | Publishing status \+ data |
| Admin | All | Mission Control dashboard |

No one gets overwhelmed — clarity by design.

---

### **6.4 Approval Workflow**

Approvals act as gates between stages:

1. **Script Approval** → Envision complete → triggers Assemble  
2. **Video Approval** → Assemble complete → triggers Connect  
3. **Publish Approval** → Connect complete → triggers Hone

AI ensures each stage has the right approver and reminds them daily until reviewed.

---

### **6.5 Client Profile Panel**

Every card includes a **Client Sidebar** with:

* Brand Bio & Voice Guidelines  
* Target Audience Summary  
* Content Pillars & Performance Goals  
* Style Guidelines (video editing, scripting)  
* Dropbox / Drive / Notion Links  
* Past top-performing examples  
* Competitive/Model Channels

Accessible from any card, so no hunting for docs.

---

### **6.6 Onboarding Form**

When a new client is onboarded, team fills a smart form that captures:

* Industry / Niche  
* Target Audiences  
* Key Topics & Pillars  
* Visual / Voice Preferences  
* Delivery Channels (YT, IG, TikTok)  
* Asset Folder Links  
* Approver Roles  
* Recorded kickoff call upload & transcription   
* Six-month content strategy goals   
* Monthly deliverable expectations (long-form \+ short-form ratios)   
* Competitive landscape analysis   
* Historical performance benchmarks (if existing channel)

The form auto-creates:

* Client Profile  
* Card Templates  
* Assigned REACH workflow

---

### **6.7 AI Notifications & Escalations**

Examples:

“Hey \[Editor\], your video ‘How to Build Authority’ has been idle for 2 days in Assemble. Do you need help?”  
 “Manager, script ‘Crypto 101’ is pending approval for 48 hours.”

AI never sleeps — it acts like a producer ensuring progress.

---

### **6.8 Incentive Tracker**

Each creative sees:

* Projects completed  
* On-time streaks  
* Missed deadlines  
* Total earnings this period

AI can trigger positive reinforcement:

“🔥 Great job — 5 on-time videos this week. You’re on a streak\!”

---

### **6.9 Analytics (Hone Stage)**

* Pull performance data from platforms (YT, IG)

* Track retention, views, engagement

* Compare by pillar or format

* Feed insights back into Research

Advanced Analytics & Reporting Performance Tracking:

 \- Views, watch time, CTR, engagement rate, subscriber growth \- Outlier scoring based on each client's historical data \- Content tagging by format, pillar, and style for comparison \- Format performance analysis ("I wish I knew" vs "How to XYZ") Monthly Auto-Generated Reports: \- ROAC tracking (Return On Attention Created) \- Wins and aha moments \- Format/pillar performance comparisons \- Goal tracking vs six-month strategy \- Next month iteration recommendations

### **6.10 Client Approval Workflows** 

Three-tier approval system: 

Idea Approval:

* Client reviews idea \+ uploads voice note   
* Auto-triggers script assignment to available writer   
* Uses "grab bag" assignment system for scriptwriters 

Script Approval: 

* Internal review → Client review → Production queue   
* Client feedback captured via comments/voice notes 

Final Content Approval: 

* Client reviews edited video \+ thumbnails   
* Approval triggers publishing workflow

### **6.13 Voice Note → Script Assignment** 

System Automated assignment workflow: 

* Client uploads voice note with idea approval   
* System auto-assigns to available scriptwriter via "grab bag" method   
* Scriptwriter receives: approved idea \+ client voice note \+ brand guidelines   
* Script delivery includes: full script \+ YouTube metadata \+ editor notes \+ short-form captions

---

## **7\. ⚙️ Non-Functional Requirements**

| Category | Requirement |
| ----- | ----- |
| **Performance** | Handle 50+ clients, 200+ active videos |
| **Reliability** | 99% uptime, AI always monitoring |
| **Security** | Private internal use only |
| **Integrations** | Slack MVP; Google Drive Phase 2 |
| **Scalability** | Add new roles/clients easily |
| **Usability** | Minimal clicks, role clarity |
| **Platform** | Web-based, desktop primary |

---

## **8\. 🧠 AI Behavioral Logic**

### **8.1 Monitoring**

* Every video must move through REACH within time windows:

  * Research (2 days)  
  * Envision (2 days)  
  * Assemble (3 days)  
  * Connect (1 day)  
  * Hone (7 days review window)

If any card stalls → AI pings responsible user.

If no response in 24h → escalate to manager.

---

### **8.2 Stage Transitions**

* Moving a card auto-assigns next user  
* Sends them Slack DM \+ checklist  
* Resets time window

---

### **8.3 Learning Loops**

AI records:

* Average stage durations  
* Which roles frequently delay  
* Which formats perform best  
* Which topics yield highest retention

Eventually, AI suggests:

“Consider shorter hooks in Envision — last 3 videos lost viewers before 5s mark.”

---

## **9\. 📈 Success Metrics**

| Metric | Target |
| ----- | ----- |
| Videos delivered on time | 95%+ |
| Missed approvals | \< 5% |
| Time gap reduction | 50% faster flow |
| Average video cycle | \< 10 days |
| AI alert accuracy | 95% |
| Team satisfaction | 9/10 average |

Client satisfaction with approval process: 

95%+ Voice note → script turnaround: \< 48 hours 

Publishing accuracy (no missed dates): 98%+ 

A/B test completion rate: 100%   
Monthly report delivery: 100% on-time   
ROAC moment capture: Track quarterly

---

## **10\. 🚀 Future Enhancements**

| Phase | Features |
| ----- | ----- |
| **Phase 2** | Slack \+ Drive integration, predictive scheduling |
| **Phase 3** | AI “Director Mode” (auto-prioritization) |
| **Phase 4** | Performance-based automation loops |
| **Phase 5** | External client dashboard |

Phase 1.5: Client Dashboard Polish \- Celebratory publishing animations \- ROAC moment tracking interface \- Simplified analytics with insights \- Mobile-friendly client approval flows

---

## **11\. 📊 Appendix (Visuals / Architecture)**

**Recommended visuals to add:**

* REACH pipeline diagram  
* AI Orchestration Map (who alerts whom)  
* Role-based view wireframes  
* Approval logic sequence  
* Notification trigger chart  
* Mission Control dashboard mock

---

[image1]: <data:image/png;base64,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>