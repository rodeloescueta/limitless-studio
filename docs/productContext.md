# Product Context (PRD) — Content OS (MVP)

## Why This Project Exists

We need an internal operating system to manage our content pipeline end-to-end (ideation → scripting → editing → publishing → analytics) with collaboration built in. Generic PM tools don’t fit creator workflows, and context is scattered across docs, chats, and storage. This MVP proves the core workflow and readies us to grow into a SaaS.

---

## Problems It Solves

- **Fragmented workflow:** Ideas, scripts, edits, approvals, and analytics live in different places.
- **Missing collaboration context:** Comments, mentions, assignments should live on the same content card.
- **Unclear accountability:** Subtasks, owners, and due dates per stage.
- **Slow ideation & insights:** Lightweight AI for hooks/ideas and simple analytics summaries.
- **Client/SME visibility:** Approvals and status tracking without leaving the board.

---

## How It Should Work

**Kanban (REACH):** Columns = Research → Envision → Assemble → Connect → Hone.  
**Content Cards:** title, type, notes (rich text), AI suggestions, subtasks (assignable + due dates), attachments, comments/mentions, basic analytics in Hone.  
**Collaboration:** multi-user assignments, real-time-ish updates, approvals, role visibility.  
**AI (V1):** “Suggest Ideas/Hooks” on card; optional “Summarize Analytics” in Hone.

---

## Scope for MVP

- Kanban board with **REACH workflow** (Research → Envision → Assemble → Connect → Hone).
- Content Card CRUD with subtasks, assignments, attachments, and comments.
- **User authentication** (email/password or OAuth if simple).
- **Role-based permissions** (at minimum: `admin`, `member`, `client/approver`).
  - Admin: manage team, all content.
  - Member: create/edit cards, tasks, comments.
  - Client/Approver: view, comment, approve in Connect stage.
- Lightweight AI integration: idea generation + optional Hone insights.
- Simple notifications (toasts or email stubs).
- **Keep it simple:** don’t over-engineer — use straightforward solutions (NextAuth, session-based roles, Drizzle ORM for RBAC).

---

## Technology Stack

### Core Choices

- **Runtime & Framework**

  - **Next.js** (App Router, API routes / route handlers). Full-stack in one repo.
  - **TypeScript**.

- **Database & Tooling**

  - **PostgreSQL** (primary DB).
  - **pgAdmin** (admin UI).
  - **ORM: Drizzle** (recommended for simplicity and type safety).

- **Auth**

  - **NextAuth.js (Auth.js)** with credentials for MVP.
  - Roles stored in DB (`role` column) → checked in API routes & UI.

- **UI & State**

  - **shadcn/ui** + **TailwindCSS**.
  - **dnd-kit** for drag/drop Kanban.
  - **TanStack Query** for server state.
  - **React Hook Form + Zod** for forms.

- **AI (switchable)**

  - Minimal wrapper for provider API (e.g., OpenAI).

- **Containerization & DevOps**
  - **Docker + docker-compose** (services: web, db, pgadmin).
  - Deploy to **VPS** (DigitalOcean or Contabo).
  - Reverse proxy: **Nginx**.
  - TLS: **Let’s Encrypt**.

---

## High-Level Architecture

[Client UI (Next.js)]
└─ Kanban board, cards, comments, attachments
└─ shadcn/Tailwind, dnd-kit, TanStack Query

[Next.js API Routes]
├─ Auth (NextAuth + role checks)
├─ Cards / Columns (REACH)
├─ Subtasks / Assignments / Comments
├─ Attachments (local dev; S3-ready interface)
└─ AI Service (simple wrapper)

[DB: PostgreSQL]
└─ Drizzle schema & migrations (users with role-based access)

[pgAdmin]
└─ DB admin

[Docker Compose]
├─ web (Next.js)
├─ db (Postgres)
└─ pgadmin

[Production VPS]
└─ Nginx (reverse proxy, TLS) → web container(s)

---

## Minimal Data Model (MVP)

- **users**: id, name, email, password_hash, role (admin|member|client), created_at
- **teams**: id, name
- **team_members**: id, team_id, user_id, role
- **stages**: id, team_id, name (Research|Envision|Assemble|Connect|Hone), order
- **content_cards**: id, team_id, stage_id, title, type, notes_rich, created_by, approved_at (nullable), timestamps
- **subtasks**: id, card_id, title, due_at, assignee_id, status
- **comments**: id, card_id, author_id, body_rich, mentions (JSON), timestamps
- **attachments**: id, card_id, filename, url, mime, size_bytes, uploaded_by, timestamps
- **analytics**: id, card_id, metrics_json, summarized_text, timestamps

---

## Deployment Plan (VPS)

1. Build Docker images and push to registry.
2. Provision VPS with Postgres volume, `.env`, and `docker-compose.yml`.
3. Set up Nginx reverse proxy + TLS (Let’s Encrypt).
4. Run migrations with Drizzle.
5. Launch app and smoke test auth + Kanban.

---

## Milestones

**M1 — Foundations**

- Next.js + Tailwind + shadcn + Drizzle + NextAuth.
- Docker Compose with Postgres + pgAdmin.
- DB schema: users with role column.

**M2 — Kanban & Cards**

- REACH board with drag/drop.
- CRUD for cards, subtasks, comments.
- Role-based access checks (simple).

**M3 — AI Assist & Hone**

- Button for AI idea generation.
- Hone stage input + AI summary.

**M4 — Hardening & Deploy**

- Finalize auth + RBAC.
- VPS deployment (DigitalOcean/Contabo).
- Run initial smoke tests + docs.
