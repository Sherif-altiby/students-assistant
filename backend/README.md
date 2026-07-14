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

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `DATABASE_URL` to point at your PostgreSQL instance:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/app_db?schema=public"
   ```

3. **Generate the Prisma client**

   ```bash
   npx prisma generate
   ```

4. **Run the first migration** (creates the `users` table)

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:3000` by default. Health check: `GET /health`.

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
