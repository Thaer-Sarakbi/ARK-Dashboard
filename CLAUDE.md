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
- **Recharts v3** — bar charts on the Analytics page
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
    salary-advances/page.tsx          # Salary advances (all users) with All/Pending/Approved/Rejected filter tabs
    salary-advances/[userId]/[advanceId]/page.tsx  # Read-only advance detail + image attachment slider
    rooms/page.tsx                    # Room status — reads from Firestore /dates/ + date pagination
    complaints/page.tsx               # Complaints — reads from Firestore /dates/ + date pagination
    reports/page.tsx                  # Daily admin reports + manual re-analyze
    daily-sales/page.tsx              # Daily sales per hotel — reads from Firestore /sales/ + date pagination
    analytics/page.tsx                # Analytics — 4 bar charts (Total Sales/Expenses/Empty Rooms/Online Booking) by hotel, range filter
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
  analytics/
    HotelBarChart.tsx                 # Reusable Recharts bar chart — one bar per hotel, custom tooltip, horizontally scrollable
    HotelTrendChart.tsx               # Recharts line chart — 4 metrics for one hotel over time, each line indexed to its own peak (0-100%)
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
| `useAdvancesStore` | `users/{uid}/advances` (collectionGroup) | All users' salary advances, sorted newest first by `creationDate`; also exports `advanceCreatedMs()` |
| `useReportsStore` | `users/{uid}/attendance/{date}/report/today` | Admin daily reports + AI-analysed `AnalysisResult` (used by reports page) |
| `useRoomStatusStore` | `/dates/{date}/roomStatus/` (Firestore) | Room status per date, fetched on demand via `fetchForDate(dateKey)` |
| `useComplaintsStore` | `/dates/{date}/complaints/` (Firestore) | Complaints per date, fetched on demand via `fetchForDate(dateKey)` |
| `useSalesStore` | `/sales/{date}/{hotel_name}/today` (Firestore) | Daily sales per hotel, fetched on demand via `fetchForDate(dateKey)`; hotel list derived from distinct `placeName` values in `users` |
| `useAnalyticsStore` | `/sales/{date}/{hotel_name}/today` (Firestore), summed across a date range | Per-hotel totals (Total Sales/Expenses/Empty Rooms/Online Booking) for the Analytics page's bar charts, fetched via `fetchForRange(range)` where `range` is `"1"\|"7"\|"30"` |
| `useHotelTrendStore` | `/sales/{date}/{hotel_name}/today` (Firestore), one doc per day | Per-day series for a single hotel (all 4 metrics) for the Analytics page's trend line chart, fetched via `fetch(hotel, range)` |
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

users/{uid}/advances/{advanceId}
  .title / .amount / .creationDate / .description / .location / .requestedBy
  .status ("Pending"|"Approved"|"Rejected")  — lowercase field name

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

sales/{DD-MM-YYYY}/{hotel_name}/today
  .totalSales / .totalExpenses / .banking / .emptyRooms / .onlineBooking
  .by (name of the worker who submitted the sale)
```

Date keys are formatted `DD-MM-YYYY` (see `todayKey()` / `dateKeyFromDate()` in `src/lib/utils.ts`).

### Firebase Storage data model

```
users/{uid}/profile/files                                          # Profile photo
users/{uid}/attendance/{DD-MM-YYYY}/report/today/files            # Daily report attachments
users/{uid}/tasks/{taskId}/files                                  # Task attachments (shown as slider in task detail)
users/{uid}/tasks/{taskId}/updates/{updateId}/files               # Task update attachments
users/{uid}/advances/{advanceId}/files                            # Salary advance attachments (slider in advance detail)
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

### Daily Sales

- Sidebar entry "Daily Sales" → `/daily-sales`, in the Operations nav group.
- Each hotel is rendered as its own card/section, fields shown in fixed order: Total Sales → Total Expenses → Banking → Empty Rooms → Online Booking. Total Sales/Total Expenses/Banking format as currency (`RM`); Empty Rooms and Online Booking format as plain integer counts (no `RM`, no decimals).
- Each hotel card header shows "Submitted by {worker}" on the right, read from the `by` field of `sales/{date}/{hotel_name}/today`; falls back to `—` when absent. The all-hotels Total card has no submitter.
- `SalesDoc` mixes numeric amounts with the string `by`, so the amount-only field keys use the `SalesAmountKey` type in `src/lib/types.ts` (used by the page's FIELDS/totals and by `src/lib/exportSales.ts`).
- Hotel names are not stored as a field — they come from the Firestore path itself (`sales/{date}/{hotel_name}/today`), so `useSalesStore` discovers the hotel list from distinct `placeName` values across the `users` collection, then reads each hotel's `today` doc for the selected date.
- Paginated by date via the same Prev/Next arrow pattern as Room status / Complaints (`getPrevDay` / `getNextDay` / `formatDateKey`), defaulting to `todayKey()` with Next disabled on today.

### Analytics

- Sidebar entry "Analytics" → `/analytics`, in the Operations nav group (after Daily Sales).
- 4 bar charts, one per metric, each with one bar per hotel: Total Sales, Total Expenses, Empty Rooms, Online Booking — all read from `sales/{date}/{hotel_name}/today` (`totalSales` / `totalExpenses` / `emptyRooms` / `onlineBooking`), same source doc as Daily Sales.
- Date-range filter (segmented control, top-right): Last day / Last 7 days / Last 30 days, backed by `getLastNDaysKeys(n)` in `src/lib/utils.ts` (today + the previous `n-1` days).
- Aggregation: for multi-day ranges each hotel's bar is the **sum** across every date in the range (money and counts both summed, not averaged). A date with no doc for a hotel contributes 0. A hotel with no doc on *any* date in the range is omitted from the charts entirely (mirrors the "only show hotels that submitted" behavior of the Daily Sales page).
- Data flow: `src/lib/analyticsData.ts` (`fetchAnalyticsForRange`) fans out `fetchSalesForDate` (from `salesData.ts`) across the range and sums per hotel → `useAnalyticsStore` → `analytics/page.tsx` → `HotelBarChart` (Recharts `BarChart`, single accent-colored series, no legend needed for a single series, custom tooltip, angled x-axis hotel labels, horizontally scrollable when the hotel count is wide).
- Money fields format as `RM` with 2 decimals; Empty Rooms/Online Booking format as plain integer counts — same `formatAmount`/`formatCount` convention as Daily Sales.
- **Hotel trend section** (below the 4 bar charts, its own filter row — hotel `<select>` + its own Last day/7/30 days range, independent of the bar charts' range): one `HotelTrendChart` line chart for a single selected hotel with 4 lines (Total Sales, Total Expenses, Empty Rooms, Online Booking), one point per day in range (missing days plot as 0, keeping the line continuous). Default hotel is the alphabetically-first entry in `SORTED_HOTELS` (`src/lib/analyticsData.ts`).
- **Normalized y-axis**: money (RM, often thousands) and room/booking counts (single/double digits) can't share a readable linear scale, so each line is indexed to its **own peak within the selected range** (0-100%, `value / max(that metric in range) * 100`) rather than plotted on shared raw-value or dual axes — this keeps all 4 lines visible together on one axis. The tooltip and legend still show/label the real RM amounts and counts; only the plotted line position is normalized.
- **Fixed line colors** (never reassigned by filter state): Total Sales `#2a78d6` (blue), Total Expenses `#eb6834` (orange), Empty Rooms `#1baf7a` (aqua), Online Booking `#eda100` (yellow) — a validated CVD-safe categorical order, distinct from the app's semantic status tokens (ok/warn/err) so a trend line is never mistaken for a status color.

### Salary advances

- Sidebar entry "Salary advances" → `/salary-advances`, in the Operations group right after Task tracker.
- List shows title, requestedBy, location, amount (`formatRM`), status; filter tabs All / Pending / Approved / Rejected (default All).
- Detail route is `/salary-advances/{userId}/{advanceId}` so it reads `users/{userId}/advances/{advanceId}` directly (live `onSnapshot`) and works from a direct link. Read-only — no approve/reject actions in the dashboard.
- Header has a "Send by WhatsApp" button (same as task detail) when the requesting worker (`useWorkersStore`, matched by `userId`) has a `phoneNumber`; opens an empty `wa.me` chat with that worker (no prefilled message).
- Status pills via `advancePillClass` (Pending=warn, Approved=ok, Rejected=err); `StatusBadge` accepts `AdvanceStatus`.

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

Helper functions in `src/lib/utils.ts`: `statusPillClass`, `attendancePillClass`, `severityPillClass`, `dateKeyFromDate`, `getPrevDay`, `getNextDay`, `formatDateKey`, `formatDateKeyShort`, `getMonthToDateKeys`, `getLastNDaysKeys(n)`, `advancePillClass`, `formatRM`, `toWhatsAppNumber` (digits-only, prepends `60` when missing, dropping a local leading `0` — used by both WhatsApp buttons).

### Routing conventions

All dashboard routes live inside the `(dashboard)` route group so they share the Sidebar + Topbar layout without that group appearing in the URL. New routes follow App Router conventions: a folder under `src/app/(dashboard)/` with a `page.tsx` entry.
