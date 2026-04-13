# Debales AI

A small multi-tenant app where each **project** (tenant) has its own chat, users with roles, and an **admin area whose layout is stored in MongoDB**. Stack is Next.js 14 (App Router), React, TypeScript, Tailwind, Mongoose, Zod, TanStack Query, and optionally Google Gemini for replies.

---

## What you need to run it

- Node 18+ and npm
- A MongoDB instance (Atlas is fine)
- Optional: a Gemini API key if you want live model calls instead of the built-in mock replies

---

## Setup

Clone the repo, install dependencies, then add environment variables.

You can use either **`.env`** or **`.env.local`** in the project root (Next.js reads both; `.env.local` overrides `.env` for local dev).

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.net/YOUR_DB_NAME

# Optional — if omitted or invalid, chat uses mock AI responses
GEMINI_API_KEY=
```

The seed script loads the same files so it hits the same database as the app:

```bash
npm install
npm run seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). If login fails with “user not found”, the database is empty or the URI doesn’t match what you seeded—run `npm run seed` again with the correct `.env` / `.env.local`.

**Database name:** In Compass or Atlas, open the database name that appears in your `MONGODB_URI` (not necessarily `debales-ai`; it depends on the path in your connection string).

---

## Demo logins

Passwords are not implemented. On the login screen you can type one of these emails or use the quick-login cards.

| Email              | Role   | Project slug |
| ------------------ | ------ | ------------ |
| admin@debales.ai   | Admin  | debales-demo |
| member@debales.ai  | Member | debales-demo |
| jordan@techcorp.ai | Admin  | techcorp     |
| casey@techcorp.ai  | Member | techcorp     |

Members can use chat but do not see the Admin dashboard link; the server also blocks admin APIs for them.

---

## Config-driven admin dashboard (assignment core)

**Requirement:** The project admin screen must read layout/content from MongoDB so you can change the dashboard by editing data, not React code.

**Where it lives:** Mongoose model `DashboardConfig`, MongoDB collection **`dashboardconfigs`**. Each document is tied to one project via **`projectId`** (unique per project).

**What it controls:** Dashboard title, theme, **sections** (id, title, order), and **widgets** inside each section (id, `type`, title, size, order, `visible`, optional `config`). The React admin page (`src/app/(app)/project/[slug]/admin/page.tsx`) fetches this via `GET /api/admin/dashboard` and maps each widget `type` to a component.

**Chat is not config-driven** (not required by the spec); only the admin dashboard is.

### Proving it in under a minute

1. Log in as an **admin** and open **Admin Dashboard** for a project.
2. In MongoDB Compass or Atlas, open **`dashboardconfigs`** and find the document whose `projectId` matches that project.
3. Change something obvious, e.g. set one widget’s **`visible`** to `false`, or change a **`title`** on a section or widget.
4. Reload the admin page in the browser. The UI should reflect the change with no code deploy.

Example shell updates (run in `mongosh` against your DB; replace `ObjectId` with the real `projectId` from the document):

```js
// Hide widget w4 (adjust id if your seed differs)
db.dashboardconfigs.updateOne(
  { "sections.widgets.id": "w4" },
  { $set: { "sections.$[].widgets.$[w].visible": false } },
  { arrayFilters: [{ "w.id": "w4" }] },
);

// Rename the dashboard
db.dashboardconfigs.updateOne(
  { _id: ObjectId("YOUR_DOC_ID") },
  { $set: { title: "Ops overview" } },
);
```

Widget `type` values the UI understands include: `stats-card`, `conversation-chart`, `integration-status`, `ai-usage-meter`, `recent-conversations`, `user-activity`, `quick-actions`. Unknown types are skipped safely.

---

## Architecture (how requests move)

The brief asked for a clear split: **access → services → routes → hooks → UI**.

1. **UI** – Pages under `src/app`, mostly client components where there is interactivity.
2. **Hooks** – `src/hooks/index.ts` wraps `fetch` with TanStack Query (`useQuery` / `useMutation`). Components do not talk to Mongoose directly.
3. **Routes** – `src/app/api/**/route.ts` are thin: parse body, run Zod where applicable, load session, enforce access, call a service, return JSON.
4. **Services** – `src/lib/services/*` hold business logic: conversations, messages, AI calls, dashboard reads/writes.
5. **Access** – `src/lib/access/session.ts` resolves the user from cookies and DB; `rules.ts` checks things like “is this slug their project?” and “is this user an admin?”.
6. **Database** – `src/lib/db/models.ts` + `connect.ts`; `seed.ts` fills demo data.

**Multi-tenant shape:** A **Project** is the tenant (slug in the URL). **Users** are linked to projects with **admin** vs **member** roles. **ProductInstance** rows tie a product template to a project (model, prompt, etc.). **Conversations** and **Messages** are scoped by `projectId` (and conversation carries `productInstanceId`). **Integrations** (Shopify-style + CRM-style flags) live on the project document; the chat service passes them into the AI layer so toggles change behaviour without a restart.

**AI:** `conversation.service.ts` saves the user message, then `ai.service.ts` either calls Gemini or returns mock text. Integration flags add mock “catalog” / “pipeline” text into the system prompt—they are not real Shopify or CRM API calls.

---

## API overview

| Method    | Path                               | Notes                                                                                                       |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| POST      | `/api/auth`                        | Body: `{ "email": "..." }`. Sets httpOnly cookies.                                                          |
| DELETE    | `/api/auth`                        | Clears session cookies.                                                                                     |
| GET       | `/api/auth/me`                     | Current user or 401.                                                                                        |
| GET       | `/api/conversations?slug=...`      | Lists conversations for the session user in that project.                                                   |
| POST      | `/api/conversations`               | Creates a conversation; product instance can be omitted and the server picks the first one for the project. |
| GET       | `/api/messages?conversationId=...` | Lists messages.                                                                                             |
| POST      | `/api/messages`                    | Sends a message; runs AI and stores the assistant reply.                                                    |
| GET/PATCH | `/api/integrations`                | Read/update integration toggles (admin path in practice).                                                   |
| GET/PATCH | `/api/admin/dashboard`             | Dashboard config + stats; **admin only**.                                                                   |

Inputs are validated with Zod in `src/lib/validations/schemas.ts` on the routes that use them.

---

## Deployment

**Vercel:** Connect the repo, set `MONGODB_URI` and optionally `GEMINI_API_KEY`, deploy. Same env vars as local.

**Docker:** From the repo root:

```bash
docker build -t debales-ai .
docker run -p 3000:3000 -e MONGODB_URI="..." -e GEMINI_API_KEY="..." debales-ai
```

---

## Tests

There is a small Jest setup under `tests/` (mostly access helpers and a few Zod cases). If Jest is not installed yet:

```bash
npm install --save-dev jest ts-jest @types/jest
npx jest
```

---

## What is mocked or simplified

| Area                    | What we did                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Auth                    | Email match + cookies only; no passwords or OAuth.                                     |
| Shopify / CRM           | No external APIs; mock JSON is injected into the AI system prompt when toggles are on. |
| Admin charts / activity | Placeholder or generated numbers where noted in code, not production analytics.        |
| AI                      | Real Gemini when the key works; otherwise (or on some errors / 429) mock replies.      |

---


---

## Project layout (src)

```
src/
├── app/
│   ├── layout.tsx, providers.tsx, globals.css, page.tsx
│   ├── login/page.tsx
│   ├── api/                    # Route handlers
│   │   ├── auth/, auth/me/
│   │   ├── conversations/, messages/
│   │   ├── integrations/
│   │   └── admin/dashboard/
│   └── (app)/project/[slug]/   # Authenticated shell + routes
│       ├── layout.tsx
│       ├── chat/page.tsx
│       └── admin/page.tsx
├── hooks/index.ts              # TanStack Query wrappers
├── types/index.ts
└── lib/
    ├── access/session.ts, rules.ts
    ├── db/connect.ts, models.ts, seed.ts
    ├── services/ai.service.ts, conversation.service.ts, dashboard.service.ts
    └── validations/schemas.ts
```

---


