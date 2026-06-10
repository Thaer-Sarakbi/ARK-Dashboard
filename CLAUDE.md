# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instructions for Claude Code

After completing any task, feature, or file change in this project, 
automatically update this CLAUDE.md file to reflect what was built. 
Do this without being asked. Never end a session without syncing 
this file to the current state of the project.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19**
- **TypeScript** (strict mode, `@/*` maps to `src/*`)
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css` using the new `@theme` inline API (no `tailwind.config.js`)
- **Firebase v12** — Auth, Firestore, Realtime Database, Storage, Analytics
- **Zustand v5** — global state with Firestore real-time subscriptions
- **Vercel AI SDK v6** (`ai`, `@ai-sdk/react`) + **OpenRouter** (`@openrouter/ai-sdk-provider`) — AI chat and structured extraction
- **Tabler Icons** (`@tabler/icons-react`) — icon set used throughout the UI
- **Zod v4** — schema validation for AI-generated structured output
- **ESLint v9** flat config (`eslint.config.mjs`) with `eslint-config-next` core-web-vitals + TypeScript rules

## Environment Variables

All `NEXT_PUBLIC_FIREBASE_*` vars are required for Firebase initialization. Server-side AI routes require `OPENROUTER_API_KEY`.
Add `CRON_SECRET` to `.env.local` — Vercel passes this as the `Authorization: Bearer` header when invoking cron routes.

## Architecture

### App Router layout

```
src/app/
  layout.tsx                          # Root layout — mounts FirebaseProvider, Geist fonts
  page.tsx                            # Redirects to /overview
  (dashboard)/
    layout.tsx                        # Dashboard shell: Sidebar + Topbar + <main>
    overview/page.tsx                 # Overview page (delegates to OverviewClient)
    attendance/page.tsx               # Attendance tracker — date pagination, night shift, worker popup
    tasks/page.tsx                    # Task list with status filter tabs
    tasks/[taskId]/page.tsx           # Task detail with image attachment slider
    rooms/page.tsx                    # Room status — reads from Firestore /dates/ + date pagination
    complaints/page.tsx               # Complaints — reads from Firestore /dates/ + date pagination
    reports/page.tsx                  # Daily admin reports + manual re-analyze
  api/
    chat/route.ts                     # POST — AI chat stream (OpenRouter → Claude)
    analyze-reports/route.ts          # POST — AI structured extraction from admin reports (manual)
    cron/analyze-reports/route.ts     # GET — Daily cron: analyze reports + write to Firestore
```

### Components

```
src/components/
  FirebaseProvider.tsx                # Mounts Auth + profile Firestore listeners at app root
  layout/
    SidebarContext.tsx                # React context — provides isOpen/toggle/close for mobile drawer
    Sidebar.tsx                       # 196px dark sidebar; fixed drawer on mobile (z-50), static on md+
    Topbar.tsx                        # Top bar — hamburger button (md:hidden) toggles mobile drawer
  overview/
    OverviewClient.tsx                # Overview dashboard — reads KPIs from new Firebase stores
    AiChatPanel.tsx                   # Sliding AI chat panel (useChat hook)
  attendance/
    WorkerAttendanceModal.tsx         # Monthly attendance popup (click worker name to open)
  tasks/
    AssignTaskModal.tsx               # Modal for creating/assigning a task
  ui/
    Avatar.tsx
    KpiCard.tsx
    Modal.tsx
    ProgressBar.tsx
    StatusBadge.tsx
```

### State (Zustand stores)

All stores live under `src/store/`. Each subscribes to Firebase in real-time and exposes a `clear()` for sign-out cleanup.

| Store | Source | Purpose |
|---|---|---|
| `useAuthStore` | Firebase Auth | Sign-in, sign-out, `onAuthStateChanged` listener |
| `useUserStore` | `users/{uid}` (Firestore) | Signed-in user's profile document |
| `useWorkersStore` | `users` collection + attendance subcollections | All worker profiles with today's Morning + Night check-in/check-out |
| `useTasksStore` | `users/{uid}/tasks` (collectionGroup) | All tasks; create and update status |
| `useReportsStore` | `users/{uid}/attendance/{date}/report/today` | Admin daily reports + AI-analysed `AnalysisResult` (used by reports page) |
| `useRoomStatusStore` | `/dates/{date}/roomStatus/` (Firestore) | Room status per date, fetched on demand via `fetchForDate(dateKey)` |
| `useComplaintsStore` | `/dates/{date}/complaints/` (Firestore) | Complaints per date, fetched on demand via `fetchForDate(dateKey)` |
| `useStorageStore` | Firebase Storage | Download URLs and folder listings with caching |
| `createCollectionStore<T>` | Generic factory | Typed Zustand store for any Firestore collection path |

### Firestore data model

```
users/{uid}
  .name / .fullName / .email / .role / .placeName / .fcmToken / .admin

users/{uid}/tasks/{taskId}
  .title / .description
  .assignedTo (worker name) / .assignedToId / .assignedBy / .assignedById
  .location / .duration (days) / .Status ("Not Started"|"In progress"|"Completed")
  .creationDate (Date) / .updatedAt (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/checkIn/Morning
  .time  (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/checkIn/Night
  .time  (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/checkOut/Morning
  .timestamp  (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/checkOut/Night
  .timestamp  (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/report/today
  .note  (string)

dates/{DD-MM-YYYY}/roomStatus/{autoId}
  .hotel / .emptyRooms / .staffRooms / .occupiedRooms / .analyzedAt

dates/{DD-MM-YYYY}/complaints/{autoId}
  .text / .severity ("low"|"medium"|"high") / .hotel / .submittedBy / .analyzedAt
```

Date keys are formatted `DD-MM-YYYY` (see `todayKey()` / `dateKeyFromDate()` in `src/lib/utils.ts`).

### Firebase Storage data model

```
users/{uid}/profile/files                                          # Profile photo
users/{uid}/attendance/{DD-MM-YYYY}/report/today/files            # Daily report attachments
users/{uid}/tasks/{taskId}/files                                  # Task attachments (shown as slider in task detail)
users/{uid}/tasks/{taskId}/updates/{updateId}/files               # Task update attachments
```

### AI routes

- **`/api/chat`** — streams a response via `streamText` using `anthropic/claude-sonnet-4-6` on OpenRouter. Accepts `{ messages, context }` where `context` carries live KPI data injected into the system prompt.
- **`/api/analyze-reports`** — calls `generateObject` with a Zod schema to extract structured hotel data from free-text admin reports (used by the reports page's manual Re-analyze button).
- **`/api/cron/analyze-reports`** — GET endpoint called by Vercel Cron at 12:00 AM UTC daily. Fetches all admin users, reads today's reports, runs AI analysis, writes results to `/dates/{date}/roomStatus/` and `/dates/{date}/complaints/` in Firestore.

### Vercel Cron

Configured in `vercel.json` at project root:
```json
{ "crons": [{ "path": "/api/cron/analyze-reports", "schedule": "0 0 * * *" }] }
```
Requires `CRON_SECRET` env var. The route verifies `Authorization: Bearer ${CRON_SECRET}`.

### Task status

`TaskStatus` values: `"Not Started"` | `"In progress"` | `"Completed"` | `"Delayed"` | `"Urgent"`.
New tasks are created with `Status: "Not Started"` (capital S field name in Firestore).
The tasks page filter shows only Not Started / In progress / Completed; Delayed and Urgent are hidden.

### Attendance

- Status is `"Present"` | `"Absent"` | `"Finished"`.
- Present = has morning OR night check-in (with no checkout yet).
- Monthly popup (`WorkerAttendanceModal`): Present = BOTH morning check-in AND check-out for that day.
- Attendance page supports Prev/Next day arrows; today uses live store, past dates fetch directly from Firestore.
- Duration column shows text only (`8h 30m`) — no progress bar. Shows `"–"` when no checkout after 24 hours.
- **Night shift carryover**: `useWorkersStore` checks yesterday's Night check-in if today has none. If yesterday's night check-in exists with no checkout, it is carried forward as the active shift so the worker stays `"Present"` across midnight.
- **Night shift status rule**: Night workers remain `"Present"` until they explicitly check out — no 24-hour cap (unlike morning shift). Duration shows `"–"` if checkout hasn't happened within 24h.

### Assign Task

Hardcoded: `assignedBy: 'Surendran Balan'`, `assignedById: 'TN7uEpCUmZRStizVfME1vvqx3az2'`.
Duration stored in days (integer).

### Design tokens

Defined in `src/app/globals.css` under `@theme inline`. Base font-size: 15px. Key CSS variables:

| Token | Value | Use |
|---|---|---|
| `--color-acc` | `#185FA5` | Brand blue (buttons, active states) |
| `--color-canvas` | `#EDF0F4` | Page background |
| `--color-surface` | `#FFFFFF` | Card/panel background |
| `--color-sidebar-bg` | `#0F1E35` | Sidebar dark navy |
| `--color-ok/warn/err` | green/amber/red | Status pill text |
| `--color-ok-bg/warn-bg/err-bg` | tints | Status pill background |

Helper functions in `src/lib/utils.ts`: `statusPillClass`, `attendancePillClass`, `severityPillClass`, `dateKeyFromDate`, `getPrevDay`, `getNextDay`, `formatDateKey`.

### Routing conventions

All dashboard routes live inside the `(dashboard)` route group so they share the Sidebar + Topbar layout without that group appearing in the URL. New routes follow App Router conventions: a folder under `src/app/(dashboard)/` with a `page.tsx` entry.
