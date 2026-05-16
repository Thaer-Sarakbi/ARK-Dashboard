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

## Architecture

### App Router layout

```
src/app/
  layout.tsx                     # Root layout — mounts FirebaseProvider, Geist fonts
  page.tsx                       # Redirects to /overview
  (dashboard)/
    layout.tsx                   # Dashboard shell: Sidebar + Topbar + <main>
    overview/page.tsx            # Overview page (delegates to OverviewClient)
    attendance/page.tsx          # Attendance tracker
    tasks/page.tsx               # Task list
    tasks/[taskId]/page.tsx      # Task detail
    rooms/page.tsx               # Room status
    complaints/page.tsx          # Complaints log
    reports/page.tsx             # Daily admin reports
  api/
    chat/route.ts                # POST — AI chat stream (OpenRouter → Claude)
    analyze-reports/route.ts     # POST — AI structured extraction from admin reports
```

### Components

```
src/components/
  FirebaseProvider.tsx           # Mounts Auth + profile Firestore listeners at app root
  layout/
    Sidebar.tsx                  # 196px dark sidebar with nav groups + user footer
    Topbar.tsx                   # Top bar
  overview/
    OverviewClient.tsx           # Overview dashboard client component
    AiChatPanel.tsx              # Sliding AI chat panel (useChat hook)
  tasks/
    AssignTaskModal.tsx          # Modal for creating/assigning a task
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
| `useWorkersStore` | `users` collection + attendance subcollections | All worker profiles with today's check-in/check-out |
| `useTasksStore` | `users/{uid}/tasks` (collectionGroup) | All tasks across all workers; create and update status |
| `useReportsStore` | `users/{uid}/attendance/{date}/report/today` | Admin daily reports + AI-analysed `AnalysisResult`. Uses `subscribeReports(adminWorkers)` — registers `onSnapshot` listeners on today's report doc per admin (synchronous), falls back to yesterday via lazy `getDoc`. Module-level `reportMap`/`yesterdayCache`/`activeListeners` manage listener lifetime with ref-counting (`subscriberCount`). |
| `useStorageStore` | Firebase Storage | Download URLs and folder listings with caching |
| `createCollectionStore<T>` | Generic factory | Typed Zustand store for any Firestore collection path |

### Firestore data model

```
users/{uid}
  .name / .fullName / .email / .role / .placeName / .admin / .photoURL

users/{uid}/tasks/{taskId}
  .title / .description / .assignedTo / .assignedBy / .location
  .duration / .status / .progress / .createdAt / .updatedAt

users/{uid}/attendance/{DD-MM-YYYY}/checkIn/Morning
  .time  (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/checkOut/Morning
  .timestamp  (Timestamp)

users/{uid}/attendance/{DD-MM-YYYY}/report/today
  .note  (string)
```

Date keys are formatted `DD-MM-YYYY` (see `todayKey()` / `yesterdayKey()` in `src/lib/utils.ts`).

### AI routes

- **`/api/chat`** — streams a response via `streamText` using `anthropic/claude-sonnet-4-6` on OpenRouter. Accepts `{ messages, context }` where `context` carries live KPI data (attendance counts, open complaints, empty rooms, active/overdue tasks) injected into the system prompt.
- **`/api/analyze-reports`** — calls `generateObject` with a Zod schema to extract structured hotel data (room counts, complaint severities) from free-text admin reports.

### Design tokens

Defined in `src/app/globals.css` under `@theme inline`. Key CSS variables:

| Token | Value | Use |
|---|---|---|
| `--color-acc` | `#185FA5` | Brand blue (buttons, active states) |
| `--color-canvas` | `#EDF0F4` | Page background |
| `--color-surface` | `#FFFFFF` | Card/panel background |
| `--color-sidebar-bg` | `#0F1E35` | Sidebar dark navy |
| `--color-ok/warn/err` | green/amber/red | Status pill text |
| `--color-ok-bg/warn-bg/err-bg` | tints | Status pill background |

Helper functions in `src/lib/utils.ts` map statuses to pill classes: `statusPillClass`, `attendancePillClass`, `severityPillClass`.

### Routing conventions

All dashboard routes live inside the `(dashboard)` route group so they share the Sidebar + Topbar layout without that group appearing in the URL. New routes follow App Router conventions: a folder under `src/app/(dashboard)/` with a `page.tsx` entry.
