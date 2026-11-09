# Express + TypeScript + PostgreSQL + Prisma — Starter

A clean, layered REST API starter following common Node.js best practices.

## Stack

- **Express 5** — HTTP server
- **TypeScript** (strict mode) — type safety
- **PostgreSQL** + **Prisma 7** (with the `pg` driver adapter) — database & ORM
- **Zod** — runtime request validation and env validation
- **Helmet, CORS, Morgan** — security headers, CORS, request logging
- **ESLint + Prettier** — linting & formatting

## Architecture

```
src/
├── config/           # env validation, Prisma client singleton
├── middlewares/       # error handler, 404 handler, validate()
├── modules/
│   └── user/          # example feature module
│       ├── user.schema.ts       # Zod validation schemas
│       ├── user.repository.ts   # Prisma queries only
│       ├── user.service.ts      # business logic
│       ├── user.controller.ts   # HTTP request/response only
│       └── user.routes.ts
├── routes/            # aggregates feature routers under /api/v1
├── utils/             # AppError, asyncHandler, logger
├── app.ts             # Express app wiring (middleware, routes)
└── server.ts           # entrypoint, DB connect, graceful shutdown
```

Each feature module follows **routes → controller → service → repository**:

- **routes**: wires HTTP verbs/paths to controllers + validation middleware
- **controller**: translates HTTP ↔ service calls only, no business logic
- **service**: business logic, orchestration, throws `AppError` subclasses
- **repository**: the *only* layer that calls Prisma directly

This keeps business logic testable and decoupled from both HTTP and the database driver.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Install the browser used for PDF generation**

   ```bash
   npx puppeteer browsers install chrome
   ```

   Run this after installing dependencies in each environment that generates PDFs.

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `DATABASE_URL` to point at your PostgreSQL instance:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/app_db?schema=public"
   ```

4. **Generate the Prisma client**

   ```bash
   npm run prisma:generate
   ```

   The client is also generated automatically before starting the development server or building the backend.

5. **Run the first migration** (creates the `users` table)

   ```bash
   npx prisma migrate dev --name init
   ```

6. **Start the dev server**

   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:4000` by default. Health check: `GET /health`.

## Scripts

| Script                    | Description                                  |
|---------------------------|-----------------------------------------------|
| `npm run dev`             | Start with hot-reload (ts-node-dev)          |
| `npm run build`           | Compile TypeScript to `dist/`                |
| `npm start`               | Run the compiled build (`dist/server.js`)    |
| `npm run lint`            | Lint source                                  |
| `npm run lint:fix`        | Lint and auto-fix                            |
| `npm run format`          | Format source with Prettier                  |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes|
| `npm run prisma:migrate`  | Create/apply a dev migration                 |
| `npm run prisma:studio`   | Open Prisma Studio (DB GUI)                  |

## API

Base path: `/api/v1`

| Method | Path         | Description        |
|--------|--------------|---------------------|
| POST   | `/users`     | Create a user        |
| GET    | `/users`     | List users (paginated: `?page=1&limit=10`) |
| GET    | `/users/:id` | Get a user by id     |
| PATCH  | `/users/:id` | Update a user        |
| DELETE | `/users/:id` | Delete a user         |

All responses follow the shape `{ status: 'success' | 'error', data?, message?, errors? }`.

### Subject catalog

The catalog follows `Subject -> Unit -> Lesson`. Administrators manage shared
subjects, while authenticated students can create, edit, and delete their own
subjects, units, and lessons. Students can also read the shared catalog, but
cannot modify another user's subjects. List responses are paginated and subject
detail returns ordered units and lessons.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/subjects?page=1&limit=10` | Paginated summaries with `unitsCount` and `lessonsCount` |
| GET | `/subjects/:id` | Subject with ordered `units[]` and each unit's `lessons[]` |
| POST | `/subjects` | Create a subject with optional nested units and lessons |
| PATCH / DELETE | `/subjects/:id` | Rename or delete a subject |
| POST | `/subjects/:id/units` | Add a unit (optionally with lessons) |
| PATCH / DELETE | `/units/:id` | Rename/reposition or delete a unit |
| PUT | `/subjects/:id/units/order` | Reorder using `{ "unitIds": ["uuid", "..."] }` |
| POST | `/units/:id/lessons` | Add a lesson |
| PATCH / DELETE | `/lessons/:id` | Rename/move/reposition or delete a lesson |
| PUT | `/units/:id/lessons/order` | Reorder using `{ "lessonIds": ["uuid", "..."] }` |

Example create request:

```json
{
  "title": "Sample JSON",
  "units": [
    {
      "title": "Item 1",
      "lessons": [{ "title": "Lesson 1" }, { "title": "Lesson 2" }]
    }
  ]
}
```

Subject and unit deletes cascade through lessons, study sessions, and lesson
completions. Existing study days remain attached to their tables and may become
empty.

#### Applying the hierarchy migration

Back up the database before applying these migrations. The hierarchy migration
preserves unit and lesson UUIDs, flattens nested unit titles and leaf lesson
titles, and removes sessions/completions that referred to non-leaf lessons. It
reports the number of removed rows with a PostgreSQL `NOTICE`. A follow-up
migration aligns the unit and lesson order defaults with the Prisma schema.

From `backend`:

```bash
npx prisma migrate status
npx prisma migrate deploy
npm run prisma:generate
```

The migration is intentionally not reversible: the removed parent lessons,
their sessions/completions, and the original nested names/order cannot be
reconstructed from the flattened rows. To roll back, restore a database backup
made before deployment (including `_prisma_migrations`); do not use
`prisma migrate resolve --rolled-back` as a substitute for restoring the data.

### Study tables

Study-session dates use `YYYY-MM-DD`; sessions have no start/end times.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/study-table?page=1&limit=10` | List the signed-in user's tables |
| POST | `/study-table` | Create an empty table |
| POST | `/study-table/generate?preview=true` | Preview a generated plan |
| POST | `/study-table/generate` | Generate and save a plan |
| GET | `/study-table/:id` | Get a table with days and sessions |
| PATCH | `/study-table/:id` | Update the owned table's title, subjects, or type-specific dates |
| DELETE | `/study-table/:id` | Delete the owned table and its schedule |
| GET | `/study-table/:id/progress` | Get total, per-subject, and per-unit progress |
| GET | `/study-table/:id/pdf` | Download a paginated PDF |
| POST | `/study-table/:id/sessions` | Add a session using `{ "subjectId": "...", "lessonId": "...", "date": "YYYY-MM-DD" }` (or `dayId`) |
| PATCH / DELETE | `/study-table/sessions/:id` | Update or remove an owned session |
| PUT | `/study-table/days/:dayId/sessions` | Replace and reorder a day's sessions |
| POST / DELETE | `/study-table/sessions/:id/complete` | Complete or uncomplete a session |

Weekly inputs need only `startDate`; monthly inputs use `month` (English or Arabic
month name, or 1–12) and optional `year`; custom and global inputs use
`startDate` and `endDate`. Generated plans accept
`schedule: { "studyWeekdays": [0, 1, 2, 3, 4, 5, 6], "maxSessionsPerDay": 3 }`.

Create and generate requests may include `selectedLessonIds` to limit the table to
specific lessons across the selected subjects. Omit it to include every lesson
within the subject scope. The subject-selection UI sends lesson IDs for selected
subjects, units, and individual lessons; saved tables also enforce that scope
when sessions are added or replaced.

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications?page=1&limit=20` | Get a page of the signed-in user's notifications |
| GET | `/notifications/unread-count` | Get the unread count |
| PATCH | `/notifications/:id/read` | Mark one notification as read |
| POST | `/notifications/read-all` | Mark all notifications as read |

## Design decisions / best practices applied

- **Strict TypeScript** (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, etc.) catches bugs at compile time.
- **Env validation with Zod** — the app refuses to start with missing/invalid config instead of failing unpredictably at runtime.
- **Centralized error handling** — controllers/services throw `AppError` subclasses (`NotFoundError`, `ConflictError`, ...); a single middleware maps them (plus Zod and Prisma errors) to consistent HTTP responses. Unexpected errors are logged in full but never leak internals to the client.
- **`asyncHandler` wrapper** — no repetitive `try/catch` in every controller; rejected promises are forwarded to Express's error pipeline automatically.
- **Passwords never leave the service layer** — `toSafeUser()` strips the password hash before returning a user object anywhere.
- **Repository pattern** — Prisma is only imported in `*.repository.ts` files, so swapping ORMs or adding a cache layer later doesn't touch business logic.
- **Prisma 7 driver adapter** — Prisma 7 removed its built-in connection engine; `PrismaClient` is constructed with a `@prisma/adapter-pg` adapter wrapping `node-postgres`. Connection settings used by the CLI (`migrate`, `studio`, ...) live in `prisma.config.ts`; the app's own runtime connection is configured separately in `src/config/prisma.ts` from the same `DATABASE_URL`.
- **Prisma client singleton** cached on `globalThis` in development to avoid exhausting DB connections across `ts-node-dev` hot reloads.
- **Graceful shutdown** — `SIGINT`/`SIGTERM` close the HTTP server and disconnect Prisma cleanly, with a forced-exit timeout as a safety net.
- **Security middleware by default** — `helmet()` for headers, CORS restricted via `CORS_ORIGIN` env var, JSON body size limit.
