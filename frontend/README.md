# ثانوية أسيستنت — لوحة متابعة الطالب

Next.js (App Router) + TypeScript + Tailwind dashboard for tracking a student's
tasks, habits, نفسي support sessions, and academic consultations.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then set NEXT_PUBLIC_API_URL
npm run dev
```

## Auth architecture (access + refresh tokens)

- **Access token**: kept only in memory (Zustand store, `store/useAuthStore.ts`).
  Never written to `localStorage`/`sessionStorage` to reduce XSS blast radius.
- **Refresh token**: an httpOnly cookie set directly by the backend on
  `/auth/login` and `/auth/register`. The frontend never touches its value —
  every request is sent with `withCredentials: true` so the browser attaches
  it automatically.
- **Axios client** (`lib/api.ts`):
  - Request interceptor attaches `Authorization: Bearer <accessToken>`.
  - Response interceptor catches `401`s, calls `POST /auth/refresh` exactly
    once even if multiple requests fail concurrently (via a shared promise
    lock), stores the new access token, and retries the original request.
  - If the refresh call itself fails, the session is cleared and the user is
    redirected to `/login`.
- **Session bootstrap** (`components/AuthProvider.tsx`): on first mount (e.g.
  after a hard refresh, where the in-memory access token is gone) it calls
  `/auth/refresh` then `/auth/me` to silently restore the session using the
  refreshToken cookie.
- **Route protection**: primary guard is client-side, in
  `app/dashboard/layout.tsx` (redirects to `/login` if bootstrap finishes with
  no user). `middleware.ts` is a best-effort edge-level redirect based on the
  presence of the `refreshToken` cookie — it only works if the frontend and
  API share a domain (or the API is proxied under the same origin), since
  browsers scope cookies to the domain that set them.

## Confirmed backend endpoints used

| Endpoint | Method | Purpose |
|---|---|---|
| `/auth/login` | POST | login, returns user + accessToken, sets refreshToken cookie |
| `/auth/register` | POST | register, same response shape |
| `/auth/refresh` | POST | mints a new accessToken from the refreshToken cookie |
| `/auth/me` | GET | current user profile |
| `/task` | POST | create task `{ title, frequency: "TODAY" \| "ALL_DAYS" }` |
| `/task/:id` | PATCH | update task |

## Assumed endpoints (not in the original spec — adjust freely)

These were needed for the dashboard/habits/support/consultations pages but
weren't part of the provided API contract. They currently mirror the `/task`
shape as closely as possible:

| Endpoint | Method | File |
|---|---|---|
| `/task` | GET, DELETE | `lib/tasks.ts` |
| `/habit`, `/habit/:id` | GET, POST, PATCH, DELETE | `lib/habits.ts` |
| `/support` | GET, POST | `lib/support.ts` |
| `/consultation` | GET, POST | `lib/support.ts` |

If your backend uses different paths/payloads, only these four `lib/*.ts`
files need to change — every page consumes them through typed functions, not
raw `fetch`/`axios` calls.

## Business rules implemented client-side

- الدعم النفسي (support): 1 session / calendar month.
- الاستشارات (consultations): 3 sessions / calendar month.
- Both are enforced by counting each resource's `createdAt` against the
  current month (`countThisMonth` in `lib/support.ts`) and disabling the
  request button once the quota is hit. This should also be enforced
  server-side — the frontend check is a UX convenience, not a security
  boundary.

## Structure

```
app/
  login/ register/          — public auth pages
  dashboard/
    layout.tsx               — sidebar + auth guard
    page.tsx                 — charts overview (tasks, habits, quotas)
    tasks/ habits/           — CRUD pages
    support/ consultations/ — quota-limited request pages
components/                  — AuthProvider, Sidebar, QuotaCard, ui/*
lib/                         — api.ts (axios+interceptors), auth.ts, tasks.ts, habits.ts, support.ts
store/useAuthStore.ts        — in-memory session state
types/index.ts               — shared TS types matching the API responses
middleware.ts                — edge-level route guard (best-effort)
```
