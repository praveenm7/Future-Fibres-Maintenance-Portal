# Future Fibres Maintenance Portal — Comprehensive Changelog

**Project:** Future Fibres Maintenance Portal
**Repository:** `d:\Repos\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal`
**Stack:** React 18 + TypeScript + Vite | Express + Node.js | SQL Server
**Branch:** `main`
**Last Updated:** 2026-02-20

---

## UNCOMMITTED CHANGES (Current Session — 2026-02-21)

<!-- QA AUDIT CHANGES — To revert all QA fixes, revert all changes after this comment -->
<!-- Individual changes can be reverted by restoring the original code noted in each section -->

### ESLint Cleanup: Fix Pre-existing Warnings (40 → 9)

<!-- ESLINT CLEANUP — Reverts: restore original imports/params from git diff -->

Removed 15 unused imports across 10 files, prefixed 6 unused parameters with `_`, removed 2 unused variables, and suppressed 7 intentional `exhaustive-deps` warnings with `eslint-disable-next-line`. Remaining 9 problems are all in shadcn-ui auto-generated components (not user code).

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/calendar/DayView.tsx` | Removed unused `Circle` import |
| `src/components/schedule/ScheduleConfigSheet.tsx` | Removed `Moon` import; prefixed unused `date` param as `_date` |
| `src/components/schedule/ScheduleGantt.tsx` | Removed unused `ScheduleBreak` type import |
| `src/components/ui/DataImportDialog.tsx` | Prefixed unused `i` as `_i` |
| `src/components/machines/QRScanner.tsx` | Added eslint-disable for intentional deps omission |
| `src/hooks/use-toast.ts` | Inlined `actionTypes` as direct type (was runtime value used only as type) |
| `src/hooks/useNonConformities.ts` | Removed unused `variables` param from `useUpdateComment` |
| `src/pages/AuthorizationMatrix.tsx` | Added eslint-disable for intentional deps omission |
| `src/pages/MachineManagement.tsx` | Added eslint-disable for intentional deps omission |
| `src/pages/MaintenancePlan.tsx` | Added eslint-disable for intentional deps omission |
| `src/pages/MaintenancePlanReport.tsx` | Removed unused `NonConformity`, `Clock` imports |
| `src/pages/NCMaintenanceReport.tsx` | Removed unused `Circle`, `Minus` imports; prefixed `dot` as `_dot` |
| `src/pages/NonConformities.tsx` | Removed unused `NonConformity`, `toast` imports; added 2 eslint-disables |
| `src/pages/SpareParts.tsx` | Added eslint-disable for intentional deps omission |
| `src/pages/SectionDashboard.tsx` | Removed unused `cn` import |
| `src/pages/ListsModification.tsx` | Removed unused catch variables (optional catch binding) |
| `src/pages/admin/AdminDashboard.tsx` | Removed unused `Users`, `Activity`, `AlertTriangle` imports |
| `src/pages/admin/DatabaseExplorer.tsx` | Removed unused `Eye` import |
| `src/pages/admin/SystemMonitoring.tsx` | Removed unused `Activity`, `Clock` imports |
| `src/pages/dashboards/CustomDashboard.tsx` | Removed unused `loadingNC` destructured alias |

### QA Audit: Security Hardening (Backend)

Added security headers via `helmet.js` and API rate limiting via `express-rate-limit` (100 req/15min per IP). Added Joi input validation schemas for all 22 POST/PUT endpoints across 10 route files. Configured MIME type validation for document uploads (extension + mimetype checked). Added connection pool sizing (min:2, max:20), exponential backoff retry (3 attempts), and transaction timeout (30s).

**Files Created:**
| File | Purpose |
|------|---------|
| `server/middleware/validate.js` | Joi validation middleware + schemas for all routes |

**Files Modified:**
| File | Changes |
|------|---------|
| `server/index.js` | Added helmet, rate limiter middleware; explicit body parser limits |
| `server/config/database.js` | Pool sizing, request timeout, retry logic with exponential backoff |
| `server/config/upload.js` | MIME type validation map for document uploads |
| `server/routes/machines.js` | Added validation middleware to POST/PUT; transaction timeout |
| `server/routes/maintenanceActions.js` | Added validation middleware to POST/PUT |
| `server/routes/nonConformities.js` | Added validation middleware to POST/PUT |
| `server/routes/ncComments.js` | Added validation middleware to POST |
| `server/routes/spareParts.js` | Added validation middleware to POST/PUT |
| `server/routes/operators.js` | Added validation middleware to POST/PUT |
| `server/routes/listOptions.js` | Added validation middleware to POST/PUT |
| `server/routes/authMatrix.js` | Added validation middleware to POST/PUT |
| `server/routes/maintenanceExecutions.js` | Added validation middleware to POST/PUT |
| `server/routes/shifts.js` | Added validation middleware to PUT/POST |
| `server/package.json` | Added helmet, express-rate-limit, joi dependencies |

<!-- REVERT: Remove helmet/rateLimit imports and app.use() from index.js; revert database.js to simple connect(); remove validate() from route handlers; delete validate.js; revert upload.js fileFilter; npm uninstall helmet express-rate-limit joi -->

---

### QA Audit: Type Safety & Code Splitting (Frontend Core)

Fixed API service to use typed generics (`post<T, D>` instead of `any`), added 30s request timeout, and fixed DELETE handler for 204 No Content. Added Error Boundary component. Converted all 29 page imports to `React.lazy()` with Suspense for code splitting. Fixed unsafe type assertions (`as any` → proper types). Replaced `any` types in 7 files with proper interfaces. Flattened queryKey objects to primitives for cache stability.

**Files Created:**
| File | Purpose |
|------|---------|
| `src/components/ErrorBoundary.tsx` | React error boundary with retry/reload UI |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/services/api.ts` | Typed generics `post<T,D>`, `put<T,D>`; AbortSignal.timeout(30s); DELETE handles 204 |
| `src/App.tsx` | All imports → React.lazy(); Suspense + ErrorBoundary wrappers |
| `src/pages/AuthorizationMatrix.tsx` | `as any` → `as 'new' \| 'modify' \| 'delete'` |
| `src/pages/MaintenancePlan.tsx` | `'IDEAL' as any` → `'IDEAL' as const` |
| `src/pages/NonConformities.tsx` | `'' as unknown as number` → `0` |
| `src/pages/SpareParts.tsx` | `'' as unknown as number` → `0` |
| `src/hooks/useDashboard.ts` | `any` → `DashboardStats`, `MaintenanceReportRow` types |
| `src/pages/dashboards/WorkforceDashboard.tsx` | 6 `any` → proper typed callbacks |
| `src/pages/admin/SystemMonitoring.tsx` | `icon: any` → `icon: LucideIcon` |
| `src/pages/admin/DatabaseExplorer.tsx` | `Record<string, any>` → `Record<string, unknown>` |
| `src/pages/ListsModification.tsx` | `any[]` → `ListItem[]` with proper interface |
| `src/types/dashboards.ts` | Added 4 workforce interfaces |
| `src/types/admin.ts` | `any` → `unknown` in TableDataResponse |
| `src/hooks/useAdmin.ts` | `any` → `unknown` in mutation param |
| `src/hooks/useDashboards.ts` | Flattened filter objects in queryKeys |
| `src/hooks/useDailySchedule.ts` | Flattened config object in queryKey |
| `src/hooks/useListOptions.ts` | `{ listType }` → `listType` in queryKey |

<!-- REVERT: Restore api.ts to use `any`; revert App.tsx to direct imports; revert type assertion files to original casts; delete ErrorBoundary.tsx -->

---

### QA Audit: Error States, Empty States & Accessibility (Frontend UX)

Added error handling UI (`QueryError` component with retry button) to all 10 data-fetching pages. Added empty state displays where missing. Added `aria-label` attributes to image gallery action buttons.

**Files Created:**
| File | Purpose |
|------|---------|
| `src/components/ui/QueryError.tsx` | Reusable query error component with retry button |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/pages/MachineryListReport.tsx` | Added error state + empty state |
| `src/pages/MaintenancePlan.tsx` | Added error states for machines + actions |
| `src/pages/NonConformities.tsx` | Added error states for machines + NCs |
| `src/pages/SpareParts.tsx` | Added error state + empty state |
| `src/pages/AuthorizationMatrix.tsx` | Added error state + empty state |
| `src/pages/NCComments.tsx` | Added error states for machines + NCs + comments |
| `src/pages/MaintenancePlanReport.tsx` | Added combined error state for all queries |
| `src/pages/NCMaintenanceReport.tsx` | Added error state + empty state |
| `src/pages/MaintenanceSummary.tsx` | Added error state |
| `src/pages/AuthorizationReport.tsx` | Added error state + empty state |
| `src/components/machines/ImageGallery.tsx` | Added aria-label to remove buttons |

<!-- REVERT: Remove QueryError imports and isError/refetch destructuring from all pages; delete QueryError.tsx; remove aria-labels from ImageGallery.tsx -->

---

### QA Audit: ESLint Strictness

Re-enabled `@typescript-eslint/no-unused-vars` rule (changed from `"off"` to `"warn"`) to detect dead code.

**File Modified:** `eslint.config.js` — `no-unused-vars: "off"` → `"warn"`

<!-- REVERT: Change "warn" back to "off" in eslint.config.js line 23 -->

---

### Fix: Gantt Chart Break Label Overlap

Break labels ("BREAKFAST", "LUNCH") previously overlapped with hour markers in the schedule Gantt chart timeline header because both were absolutely positioned on the same layer. Fixed by splitting the header into two distinct rows: a thin break indicator pills row on top, and the existing hour labels row below. Break zone overlay opacity reduced from 50% to 30% for cleaner visual separation.

**File Modified:** `src/components/schedule/ScheduleGantt.tsx`

---

### Feature: Today's Schedule Dashboard Widget

New widget on the Overview Dashboard providing at-a-glance visibility into today's schedule without navigating to the calendar. Shows 5 mini KPIs (total tasks, scheduled, completed, unscheduled, avg utilization) and lists up to 5 upcoming pending tasks with time, machine code, action, duration, and assigned operator. Includes a "View Full Schedule" button that deep-links directly to the calendar's schedule view.

**Files Created:**

| File | Purpose |
|------|---------|
| `src/components/dashboards/TodaysScheduleWidget.tsx` | Self-contained schedule summary widget with loading skeleton and empty state |

**Files Modified:**

| File | Changes |
|------|---------|
| `src/pages/dashboards/OverviewDashboard.tsx` | Imported and rendered `TodaysScheduleWidget` between KPI cards and charts |

---

### Feature: Deep-Link Support for Calendar Schedule View

The maintenance calendar now accepts URL search parameters (`?view=day&subView=schedule`) to open directly into a specific view mode and sub-view. Enables bookmarkable links and navigation from the dashboard widget.

**File Modified:** `src/pages/MaintenanceCalendar.tsx` — Added `useSearchParams` from React Router to initialize `viewMode` and `daySubView` state from URL params.

---

### Feature: Always-Visible Tasks/Schedule Toggle

The Tasks/Schedule toggle in the calendar header was previously only visible in Day view (requiring users to first switch to Day, then discover the toggle). Now visible in all view modes (Month, Week, Day). Selecting "Schedule" from Month or Week automatically switches to Day view.

**Files Modified:**

| File | Changes |
|------|---------|
| `src/components/calendar/CalendarHeader.tsx` | Removed `viewMode === 'day'` condition gating the toggle visibility |
| `src/pages/MaintenanceCalendar.tsx` | Added `handleDaySubViewChange` wrapper that auto-switches to Day view when Schedule is selected from Month/Week |

---

### Feature: Workforce Dashboard — 4 New Visualizations + 2 New KPIs

Expanded the Workforce Dashboard with richer insights using schedule, execution, and shift data.

**New Charts:**
- **Operator Efficiency (Est. vs Actual Time)** — Grouped bar chart comparing average estimated vs actual task time per operator, with task count in tooltip
- **Completion Rate by Operator (Last 3 Months)** — Horizontal bar chart with color-coded bars: green (>80%), amber (50-80%), red (<50%)
- **Shift Coverage** — Custom table grouped by shift with color-coded shift badges (Morning=amber, Day=orange, Afternoon=purple, Night=indigo) showing operator names and departments
- **Maintenance Completion Trend (6 Months)** — Stacked area chart showing completed (green) vs skipped (red) tasks over time

**New KPI Cards:**
- **Avg Completion Rate** — Average completion percentage across all operators (from last 3 months)
- **Avg Time Variance** — Average difference between actual and estimated task time in minutes (positive = over budget)

KPI grid expanded from `lg:grid-cols-5` to `lg:grid-cols-7`.

**Backend — 4 new result sets** added to `sp_GetWorkforceAnalytics` stored procedure:
1. Operator Efficiency (avg estimated vs actual time from completed executions, min 3 tasks)
2. Operator Completion Rates (last 3 months, completed/skipped/total with percentage)
3. Shift Coverage (active operators with their default shift)
4. Maintenance Completion Trend (6-month monthly breakdown of completed vs skipped)

**Files Modified:**

| File | Changes |
|------|---------|
| `database/05_dashboard_stored_procedures.sql` | Added result sets 6-9 to `sp_GetWorkforceAnalytics` |
| `server/routes/dashboards.js` | Extended `/workforce` route to map `recordsets[5]` through `[8]` into response |
| `src/pages/dashboards/WorkforceDashboard.tsx` | Added 4 chart cards (2 new rows), 2 new KPI cards, new imports (AreaChart, Area, Clock, CheckCircle2), shift badge colors, month formatter |

---

### Feature: Per-Operator Shift Scheduling

Operators work different shifts (Morning, Day, Afternoon, Night). The scheduling engine now assigns tasks only within each operator's shift window, with the Gantt chart grouped by shift. Each operator has a **default shift** (set in Authorization Matrix) and shifts can be **overridden per date** (covering for someone, temporary reassignment, or day off).

**Shift Definitions (seeded):**
| Shift | Start | End |
|-------|-------|-----|
| Morning | 06:00 | 14:00 |
| Day | 06:00 | 18:00 |
| Afternoon | 14:00 | 22:00 |
| Night | 18:00 | 06:00 |

**Static Meal Breaks:** 4 fixed break times (Midnight 01:00, Breakfast 08:00, Lunch 12:00, Dinner 20:00) — only those falling within a shift's time window are applied. Configurable break duration (default 30 min).

**Scheduling Algorithm Changes:**
- Queries each operator's effective shift for the target date (`override > default > unassigned`)
- Groups operators by shift, schedules tasks per-shift with per-shift work windows and breaks
- Machine availability shared across shifts (same machine can't be used simultaneously)
- Overnight shift support: when `endTime < startTime`, normalizes by adding 24h (e.g., Night 18:00–06:00 = 18:00–30:00 internally)

**Gantt Chart Redesign:**
- Each shift renders as a separate section with its own time axis, operator lanes, break zones, and "now" line
- Shift header badges color-coded: Morning=amber, Day=orange, Afternoon=purple, Night=indigo
- Empty states for "no shifts configured" and "no operators assigned"

**Config Sheet Redesign:**
- Operator Shifts section: shows all operators grouped by effective shift with dropdown to change shift for today
- Override indicators ("OVR" badge), "Reset to default" button, day-off option
- Meal breaks info section with configurable break duration

**Operator Management (Authorization Matrix):**
- New "Default Shift" dropdown on the operator form (New/Modify modes)
- Shows all shifts with time ranges (e.g., "Morning (06:00–14:00)")
- Persisted via backend alongside other operator fields

**Database Migration (`database/08_shifts.sql`):**

```sql
CREATE TABLE Shifts (ShiftID, ShiftName, StartTime, EndTime, IsActive)
-- 4 presets seeded (Morning, Day, Afternoon, Night)

ALTER TABLE Operators ADD DefaultShiftID INT FK → Shifts

CREATE TABLE OperatorShiftOverrides (OverrideID, OperatorID, ShiftDate, ShiftID nullable)
-- ShiftID NULL = day off; UNIQUE(OperatorID, ShiftDate)
```

**Files Created:**

| File | Purpose |
|------|---------|
| `database/08_shifts.sql` | DB migration: Shifts table, DefaultShiftID on Operators, OperatorShiftOverrides table |
| `server/routes/shifts.js` | Shifts CRUD API: list shifts, roster, default shift, overrides |
| `src/hooks/useShifts.ts` | React Query hooks: useShifts, useShiftRoster, useSetDefaultShift, useSetShiftOverride, useRemoveShiftOverride |

**Files Modified:**

| File | Changes |
|------|---------|
| `server/routes/schedule.js` | Complete rewrite: per-operator shift queries, group-by-shift scheduling, multi-break support, overnight normalization, shift-grouped response shape |
| `server/routes/authMatrix.js` | GET/POST/PUT now include `DefaultShiftID` + shift name via Shifts JOIN; accepts `defaultShiftId` in create/update |
| `server/index.js` | Registered `/api/shifts` route |
| `src/types/schedule.ts` | Added Shift, ShiftSchedule, UnassignedOperator, OperatorRosterEntry types; DailySchedule now contains `shifts[]` instead of flat `operators[]`; removed workdayStart/workdayEnd from config |
| `src/types/maintenance.ts` | Added `defaultShiftId`, `defaultShiftName` to AuthorizationMatrix interface |
| `src/lib/schemas/authMatrixSchema.ts` | Added `defaultShiftId` optional field |
| `src/hooks/useDailySchedule.ts` | Removed workday params; sends breakDuration, buffer, scheduling options only |
| `src/hooks/useAuthMatrix.ts` | Create/update mutations now invalidate shift-roster, daily-schedule, operators caches |
| `src/components/schedule/ScheduleGantt.tsx` | Complete rewrite: ShiftGanttSection component, per-shift time axes, break zones, now lines, overnight normalization |
| `src/components/schedule/ScheduleConfigSheet.tsx` | Complete rewrite: operator shift assignment UI with roster, shift dropdowns, override management, meal breaks info |
| `src/components/schedule/ScheduleTable.tsx` | Updated data flattening from `shifts[].operators[].tasks`; added Shift column |
| `src/components/schedule/ScheduleSummaryBar.tsx` | Added shift count stat with CalendarClock icon |
| `src/pages/MaintenanceCalendar.tsx` | Updated default config (removed workday params); passes date to ConfigSheet |
| `src/pages/AuthorizationMatrix.tsx` | Added Default Shift dropdown (SelectField) to operator form; imports useShifts |

**New API Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/shifts` | List all active shift definitions |
| GET | `/api/shifts/roster?date=` | Effective shift for all operators on a date (defaults + overrides merged) |
| PUT | `/api/shifts/operators/:id/default` | Set operator's default shift |
| POST | `/api/shifts/overrides` | Create/update a date override (MERGE upsert) |
| DELETE | `/api/shifts/overrides?operatorId=&date=` | Remove an override (revert to default) |

**New Database Tables:**

```
Shifts                  (ShiftID, ShiftName, StartTime, EndTime, IsActive)
OperatorShiftOverrides  (OverrideID, OperatorID, ShiftDate, ShiftID nullable)
```

---

### Feature: Daily Schedule — Rule-Based Task Timetable (Integrated into Calendar)

A rule-based scheduling engine that auto-generates a daily timetable, assigning maintenance tasks to operators in time slots with conflict prevention. Integrated as a **Schedule sub-view** within the Maintenance Calendar's Day mode — accessible via a `[Tasks | Schedule]` toggle.

**Scheduling Rules:**
- Operator conflict prevention: one operator can only work on one task at a time
- Machine conflict prevention: one machine can only be serviced by one operator at a time
- Authorization-aware: operators must be authorized for the machine's authorization group
- Preferred operator: maintenance-in-charge tasks prefer the machine's person in charge
- Priority ordering: MANDATORY before IDEAL; rarer periodicities scheduled first
- Machine grouping: tasks on the same machine batched together
- Configurable working hours, lunch break, and buffer time between tasks

**UI Features:**
- `[Tasks | Schedule]` sub-toggle in Day view header
- Gantt chart view with horizontal time axis, operator lanes, and positioned task blocks
- Table view fallback (Gantt/Table toggle appears when Schedule is active)
- "Now" red line indicator for today's schedule
- Lunch zone shading across all views
- Task blocks color-coded by periodicity, MANDATORY tasks with red left border
- Completion/skip workflow via side sheet
- Unscheduled tasks panel with reasons (e.g., "No authorized operator")
- Configurable settings sheet via gear icon (working hours, lunch, buffer, scheduling options)
- Cross-view invalidation: completing a task in Tasks view refreshes Schedule view and vice versa

**Files Created:**

| File | Purpose |
|------|---------|
| `server/routes/schedule.js` | Backend scheduling engine with greedy algorithm |
| `src/types/schedule.ts` | TypeScript types (ScheduleConfig, ScheduledTask, OperatorLane, etc.) |
| `src/hooks/useDailySchedule.ts` | React Query hook for schedule API |
| `src/components/schedule/ScheduleSummaryBar.tsx` | Stats: scheduled/total, operators, work time |
| `src/components/schedule/ScheduleGantt.tsx` | Gantt chart with time axis and operator lanes |
| `src/components/schedule/ScheduleOperatorLane.tsx` | Single operator row with task blocks |
| `src/components/schedule/ScheduleTaskBlock.tsx` | Individual task block (positioned, colored) |
| `src/components/schedule/ScheduleTable.tsx` | Flat table view of all scheduled tasks |
| `src/components/schedule/ScheduleUnscheduled.tsx` | Collapsible panel for unschedulable tasks |
| `src/components/schedule/ScheduleConfigSheet.tsx` | Settings side panel |
| `src/components/schedule/ScheduleTaskSheet.tsx` | Task detail + completion side sheet |

**Files Modified:**

| File | Changes |
|------|---------|
| `server/index.js` | Registered `/api/schedule` route |
| `src/components/calendar/CalendarHeader.tsx` | Added optional `Tasks\|Schedule` sub-toggle, `Gantt\|Table` toggle, and config gear button for Day view mode |
| `src/pages/MaintenanceCalendar.tsx` | Integrated schedule components: conditional data fetching via `useDailySchedule`, schedule completion callbacks, conditional rendering of Gantt/Table/Unscheduled within Day view |
| `src/hooks/useMaintenanceExecutions.ts` | Added `['daily-schedule']` to cache invalidation on upsert/delete so both views stay in sync |

---

### Fix: Equipment Health "Plan Execution" KPI Now Respects Filters

The "Plan Execution" KPI card on the Equipment Health dashboard previously showed a global completion rate regardless of type/area filter selections. Now it correctly filters by machine type (MACHINE/TOOLING) and area when filters are applied.

**Files Modified:**

| File | Changes |
|------|---------|
| `server/routes/dashboards.js` | `/execution-summary` endpoint now accepts optional `?area=&type=` params; all 3 SQL queries JOIN to `Machines` table and filter accordingly |
| `src/hooks/useDashboards.ts` | `useExecutionSummary` now accepts optional `DashboardFilters`; includes filters in `queryKey` for automatic refetch |
| `src/pages/dashboards/EquipmentHealthDashboard.tsx` | Passes `filters` to `useExecutionSummary(filters)` |

---

### Feature: Planned vs Completed — Accurate Compliance Metrics

All completion metrics now compare completed tasks against **planned occurrences** (computed from action periodicity) instead of only counting existing execution records. Previously, actions never attempted were invisible — a machine with 3/51 planned tasks showing 100% because all 3 records existed. Now it correctly shows ~6%.

**Backend Changes:**
- Created shared `server/utils/occurrences.js` utility (extracted from `dashboard.js`) with `generateOccurrences(action, rangeStart, rangeEnd)` and `countPlannedOccurrences(actions, start, end)`
- `maintenanceExecutions.js` stats endpoint: Changed to `LEFT JOIN` so actions with 0 records appear; added `totalPlanned` per action; `completionRate` = completed/planned
- `dashboards.js` execution-summary endpoint: Added `plannedThisMonth` KPI; added `planned` to each trend month; `completionRate` = completed/planned
- `dashboard.js`: Replaced inline occurrence helpers with shared utility import

**Frontend Changes:**

| File | Changes |
|------|---------|
| `src/types/maintenance.ts` | Added `totalPlanned` to `ExecutionStats` |
| `src/types/dashboards.ts` | Added `plannedThisMonth` to `ExecutionSummaryKPIs`; added `planned` to trend entries |
| `src/pages/MaintenancePlanReport.tsx` | % Done uses `totalCompleted/totalPlanned`; Done column shows "X/Y" with planned count; Rate uses planned-based rate |
| `src/pages/dashboards/OverviewDashboard.tsx` | "Done This Month" KPI shows "completed / planned"; Completion Trend chart shows Planned vs Completed bars |

---

### Feature: Maintenance Summary Page — Functional Weekly Heatmap

Made the previously non-functional Maintenance Summary page fully operational. It now displays a year-long weekly heatmap showing maintenance completion status per machine, computed from real `MaintenanceExecutions` data.

**Scoring Logic:**
- Green (1) = All actions (IDEAL + MANDATORY) completed → 100%
- Yellow (2) = Only MANDATORY completed, IDEAL missed → 50%
- Red (0) = MANDATORY not completed → 0%
- Gray (-1) = No scheduled actions / future week

**Files Modified:**

| File | Changes |
|------|---------|
| `server/routes/dashboard.js` | Added `GET /maintenance-summary` endpoint with 3 SQL queries + Node.js aggregation (occurrence generation, week-slot mapping, per-machine scoring) |
| `src/types/maintenance.ts` | Added `MaintenanceSummaryRow` interface |
| `src/hooks/useDashboard.ts` | Added `useGetMaintenanceSummary(periodicity, year)` hook |
| `src/pages/MaintenanceSummary.tsx` | Full rewrite: removed broken `useMachines` merge, wired to new endpoint, added year selector, added QUARTERLY option, dynamic month headers, updated legend, updated Excel export |

---

### Bugfix: Execution changes not reflecting in other pages

Completing or reverting a task in the calendar now correctly updates all other pages (Plan Form, Plan Report, Overview Dashboard, Equipment Health Dashboard). Previously only the calendar's own query cache was invalidated.

**File:** `src/hooks/useMaintenanceExecutions.ts`
- Added `['maintenance-execution-stats']` and `['dashboards', 'execution-summary']` cache invalidation to all 3 mutation `onSuccess` handlers (upsert, update, delete)

---

### Feature: Interactive Calendar Completion Tracking + Cross-Section Visibility

Turned the Maintenance Calendar into an interactive planner where users can mark tasks complete, record actual time, select the completing operator, and add notes. Completion data then flows to all 3 maintenance sections plus dashboards.

#### New Files Created (4)

| File | Purpose |
|------|---------|
| `database/07_maintenance_executions.sql` | DB migration: `MaintenanceExecutions` table with PK, FKs (cascade to Actions, Machines, Operators), UNIQUE(ActionID, ScheduledDate), CHECK on Status |
| `server/routes/maintenanceExecutions.js` | Express CRUD route: GET (date range), GET /stats (aggregated per-action), POST (MERGE upsert), PUT, DELETE |
| `src/hooks/useMaintenanceExecutions.ts` | React Query hook: useGetExecutions, useGetExecutionStats, useUpsertExecution, useUpdateExecution, useDeleteExecution |
| `src/hooks/useOperators.ts` | React Query hook: useGetOperators (fetches from existing /api/operators) |

#### Modified Files (15)

**Backend:**
| File | Changes |
|------|---------|
| `server/index.js` | Registered `/api/maintenance-executions` route |
| `server/routes/dashboards.js` | Added `GET /api/dashboards/execution-summary` endpoint (KPIs: completedThisMonth, completionRate, avgTimeVariance + 6-month trend) |

**Types:**
| File | Changes |
|------|---------|
| `src/types/maintenance.ts` | Added `MaintenanceExecution`, `ExecutionStats`, `Operator` interfaces |
| `src/types/dashboards.ts` | Added `ExecutionSummaryKPIs`, `ExecutionSummaryData` interfaces |

**Hooks:**
| File | Changes |
|------|---------|
| `src/hooks/useDashboards.ts` | Added `useExecutionSummary()` hook |

**Calendar Components (Core feature):**
| File | Changes |
|------|---------|
| `src/components/calendar/calendarUtils.ts` | Added `execution?` field to `CalendarEvent` interface |
| `src/components/calendar/useCalendarEvents.ts` | Fetches executions for visible date range, merges into events via lookup map, exposes upsert/delete mutations |
| `src/components/calendar/DayView.tsx` | Added quick-complete checkbox per action, completion count in summaries, green styling for completed, strikethrough text, `SERVER_BASE` image fix |
| `src/components/calendar/EventDetailSheet.tsx` | Added full completion form (actual time, operator dropdown, notes), "Mark Complete"/"Skip" buttons, read-only summary for completed tasks, "Revert to Pending" button, `SERVER_BASE` image fix |
| `src/components/calendar/EventChip.tsx` | Green styling + check icon for completed events, "Done"/"Skipped" labels, muted styling for skipped |
| `src/pages/MaintenanceCalendar.tsx` | Wired handleToggleComplete, handleCompleteWithDetails, handleUndoComplete callbacks |

**Cross-Section Completion Visibility:**
| File | Changes |
|------|---------|
| `src/pages/MaintenancePlan.tsx` | Added "Completion" (X/Y with color coding) and "Last Done" (date) columns to DataTable |
| `src/pages/MaintenancePlanReport.tsx` | Added 4 new columns to Actions table (Done, Rate %, Avg Time, Last Done), 4th QuickStat card (% Done), updated Print and Excel export |
| `src/pages/dashboards/OverviewDashboard.tsx` | Added 2 KPI cards (Done This Month, Completion Rate), Completion Trend bar chart (last 6 months), grid expanded to 8 columns |
| `src/pages/dashboards/EquipmentHealthDashboard.tsx` | Added Plan Execution KPI card (completion rate %), grid expanded to 6 columns |

#### Database Schema Added

```sql
CREATE TABLE MaintenanceExecutions (
    ExecutionID INT IDENTITY(1,1) PRIMARY KEY,
    ActionID INT NOT NULL (FK -> MaintenanceActions, CASCADE),
    MachineID INT NOT NULL (FK -> Machines),
    ScheduledDate DATE NOT NULL,
    Status NVARCHAR(50) DEFAULT 'PENDING' CHECK (IN 'PENDING','COMPLETED','SKIPPED'),
    ActualTime INT NULL,
    CompletedByID INT NULL (FK -> Operators),
    CompletedDate DATETIME NULL,
    Notes NVARCHAR(1000) NULL,
    UNIQUE(ActionID, ScheduledDate)
)
```

#### New API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/maintenance-executions?from=&to=` | Fetch executions for date range (with operator name join) |
| GET | `/api/maintenance-executions/stats?machineId=` | Aggregated per-action stats (completed, skipped, rate, avg time, last done) |
| POST | `/api/maintenance-executions` | Upsert execution (MERGE pattern on ActionID+ScheduledDate) |
| PUT | `/api/maintenance-executions/:id` | Update execution fields |
| DELETE | `/api/maintenance-executions/:id` | Delete execution record |
| GET | `/api/dashboards/execution-summary` | Month KPIs + 6-month completion trend |

---

## v1.6 — 2026-02-15 (Commit `23e746d`)

### UI/UX Improvements and Bug Fixes

Major refactor of the Maintenance Calendar into a modular component architecture with Month/Week/Day views, sidebar filters, and event detail sheets.

**Created (13 files):**
- `src/components/calendar/CalendarFilters.tsx` — Filter controls (machine, area, periodicity, status)
- `src/components/calendar/CalendarHeader.tsx` — Navigation + view mode toggle (month/week/day)
- `src/components/calendar/CalendarSidebar.tsx` — Mini calendar + filter panel
- `src/components/calendar/DayCell.tsx` — Individual day cell in month grid
- `src/components/calendar/DayView.tsx` — Full day view with machine-grouped actions
- `src/components/calendar/EventChip.tsx` — Compact event chip for month/week views
- `src/components/calendar/EventDetailSheet.tsx` — Slide-out detail panel for events
- `src/components/calendar/MonthView.tsx` — Month grid layout
- `src/components/calendar/WeekView.tsx` — Week timeline layout
- `src/components/calendar/calendarUtils.ts` — Date helpers, periodicity colors, event types
- `src/components/calendar/useCalendarEvents.ts` — Event computation from actions + periodicity rules
- `src/components/calendar/useCalendarFilters.ts` — Filter state management

**Modified (20 files):**
- `src/pages/MaintenanceCalendar.tsx` — Rewired to use modular calendar components
- `src/components/dashboards/DashboardShell.tsx` — Layout adjustments
- `src/components/layout/MainLayout.tsx` — Navigation updates
- `src/components/ui/DataTable.tsx` — Minor enhancements
- `src/components/ui/PageHeader.tsx` — Redesigned header component
- `src/index.css` — New CSS utilities
- `src/App.css` — Removed (42 lines deleted)
- Various page files — Minor icon/import cleanups

---

## v1.5 — 2026-02-15 (Commit `ebcc010`)

### Timezone: UTC + README Update

- Updated `README.md` with comprehensive project documentation (+165 lines)
- Enhanced `server/index.js` with improved error handling and logging (+59 lines)
- Refined `server/middleware/requestLogger.js`
- Minor admin dashboard fixes

---

## v1.4 — 2026-02-15 (Commit `d28b85e`)

### Admin & Dashboard Feature Completion

Final polish on admin and dashboard features.

- Enhanced `server/index.js` with additional middleware
- Extended `server/routes/admin.js` with refined endpoints
- Updated `src/components/layout/MainLayout.tsx` layout structure
- Added system monitoring enhancements to `src/pages/admin/SystemMonitoring.tsx`

---

## v1.3 — 2026-02-15 (Commit `59b824b`)

### New Optimizations and Enhancements

Massive feature release with PWA support, mobile UI, QR scanning, bulk operations, and data import capabilities.

**Created (22 files):**
- `public/sw.js` — Service Worker for offline/PWA support
- `src/lib/registerSW.ts` — SW registration utility
- `src/components/layout/BottomNav.tsx` — Mobile bottom navigation
- `src/components/machines/ImageGallery.tsx` — Machine image gallery/carousel
- `src/components/machines/QRScanner.tsx` — QR code scanner for machine lookup
- `src/components/ui/BulkActionsBar.tsx` — Bulk selection action toolbar
- `src/components/ui/DataImportDialog.tsx` — CSV/Excel data import dialog
- `src/components/ui/EmptyState.tsx` — Reusable empty state component
- `src/components/ui/StatusBadge.tsx` — Consistent status badge component
- `src/components/ui/ThemeToggle.tsx` — Dark/light theme switcher
- `src/components/dashboards/DashboardSkeleton.tsx` — Loading skeleton for dashboards
- `src/hooks/useOnlineStatus.ts` — Online/offline detection
- `src/hooks/useSidebarBadges.ts` — Sidebar badge counts
- `src/hooks/useUnsavedChanges.ts` — Unsaved changes warning (beforeunload)
- `src/lib/schemas/machineSchema.ts` — Zod schema for machine forms
- `src/lib/schemas/maintenanceActionSchema.ts` — Zod schema for actions
- `src/lib/schemas/nonConformitySchema.ts` — Zod schema for NCs
- `src/lib/schemas/ncCommentSchema.ts` — Zod schema for NC comments
- `src/lib/schemas/sparePartSchema.ts` — Zod schema for spare parts
- `src/lib/schemas/authMatrixSchema.ts` — Zod schema for auth matrix
- `src/pages/dashboards/CustomDashboard.tsx` — Custom drag-and-drop dashboard builder
- `database/06_migrate_finalcodes.sql` — Machine code migration script

**Modified (30+ files):**
- `src/components/ui/DataTable.tsx` — Added sorting, search, pagination, bulk selection, column resizing (+400 lines)
- `src/pages/MachineManagement.tsx` — Complete rewrite with image upload, QR codes, documents
- `src/components/machines/FileUploadDialog.tsx` — Enhanced with drag-and-drop
- `src/components/dashboards/ChartCard.tsx` — Improved chart container
- `src/components/dashboards/KPICard.tsx` — Enhanced KPI presentation
- `src/components/layout/MainLayout.tsx` — Responsive sidebar + mobile bottom nav
- `src/components/ui/FormField.tsx` — Additional field types
- `src/components/ui/ActionButton.tsx` — Style refinements
- `src/pages/MaintenanceCalendar.tsx` — Initial calendar implementation (244 lines)
- All form pages — Added Zod validation, unsaved changes warnings, bulk operations
- `database/02_seed_data.sql` — Additional seed data
- `database/03_stored_procedures.sql` — Procedure updates
- `index.html` — PWA manifest + meta tags
- `package.json` — Added html5-qrcode, qrcode.react, react-grid-layout dependencies

---

## v1.2 — 2026-02-15 (Commit `2f6589c`)

### Document Management, Print Labels, Report Export & UI Enhancements

Added file upload/download, print functionality, Excel export, and enhanced reports.

**Created (10 files):**
- `server/config/upload.js` — Multer file upload configuration
- `server/routes/documents.js` — Document CRUD + file serving
- `src/components/machines/DocumentsList.tsx` — Machine documents list view
- `src/components/machines/FileUploadDialog.tsx` — File upload dialog
- `src/components/machines/PrintLabelDialog.tsx` — Print machine labels with QR codes
- `src/components/ui/ReportToolbar.tsx` — Print + Excel export toolbar
- `src/hooks/useMachineDocuments.ts` — Document management hook
- `src/lib/exportExcel.ts` — xlsx-based Excel export utility
- `src/lib/printReport.ts` — Browser print with styled HTML
- `src/services/api.ts` — Added multipart upload support

**Modified (15 files):**
- `database/01_schema.sql` — Added `MachineDocuments` table
- `database/02_seed_data.sql` — Additional list options
- `server/index.js` — Registered documents route, static file serving
- `server/routes/machines.js` — Image upload endpoint
- All report pages — Added print + Excel export functionality
- `src/pages/MachineManagement.tsx` — Added document management tab
- `src/types/maintenance.ts` — Added `MachineDocument` type

---

## v1.1 — 2026-02-15 (Commit `97d2227`)

### Admin Panel and Dashboard Analytics

Full admin panel and 5 analytics dashboards with stored procedures.

**Created (22 files):**
- `database/04_admin_schema.sql` — ApiRequestLogs + ErrorLogs tables
- `database/05_dashboard_stored_procedures.sql` — 5 analytics stored procedures
- `server/routes/admin.js` — 660-line admin API (DB explorer, monitoring, user management)
- `server/routes/dashboards.js` — Dashboard analytics endpoints (overview, NC, equipment, parts, workforce)
- `server/middleware/requestLogger.js` — API request logging middleware
- `src/hooks/useAdmin.ts` — Admin data hooks
- `src/hooks/useDashboards.ts` — Dashboard data hooks
- `src/types/admin.ts` — Admin TypeScript interfaces
- `src/types/dashboards.ts` — Dashboard TypeScript interfaces
- `src/components/dashboards/ChartCard.tsx` — Chart container component
- `src/components/dashboards/DashboardFilters.tsx` — Area/type filter bar
- `src/components/dashboards/DashboardShell.tsx` — Dashboard page layout
- `src/components/dashboards/KPICard.tsx` — KPI display card
- `src/pages/dashboards/DashboardsIndex.tsx` — Dashboard hub/index page
- `src/pages/dashboards/OverviewDashboard.tsx` — Overview with 6 KPIs + 4 charts
- `src/pages/dashboards/NCAnalyticsDashboard.tsx` — NC trends + priority analysis
- `src/pages/dashboards/EquipmentHealthDashboard.tsx` — Machine health metrics
- `src/pages/dashboards/SparePartsDashboard.tsx` — Parts inventory analytics
- `src/pages/dashboards/WorkforceDashboard.tsx` — Operator workload + performance
- `src/pages/admin/AdminDashboard.tsx` — Admin overview
- `src/pages/admin/DatabaseExplorer.tsx` — Browse/edit database tables
- `src/pages/admin/UserManagement.tsx` — User role management
- `src/pages/admin/SystemMonitoring.tsx` — API metrics + error logs
- `src/pages/admin/ActivityLogs.tsx` — Request audit trail

**Modified (20+ files):**
- `server/index.js` — Registered admin + dashboard routes, added middleware
- `src/App.tsx` — Added dashboard + admin routes
- `src/components/layout/MainLayout.tsx` — Added admin + dashboard nav sections
- All form pages — Refactored to use react-hook-form + zod, consistent patterns
- `src/components/ui/DataTable.tsx` — Enhanced with selection support
- `src/components/ui/FormField.tsx` — Expanded field types
- `src/index.css` — New CSS variables and dark mode support

---

## v1.0 — 2026-02-06 (Commit `ad8ad73`)

### Server Backend + Local SQL Server

Replaced Supabase/mock data with full Express + SQL Server backend.

**Created (21 files):**
- `server/index.js` — Express server (port 3002)
- `server/config/database.js` — SQL Server connection pool (mssql)
- `server/routes/machines.js` — Machine CRUD
- `server/routes/maintenanceActions.js` — Maintenance action CRUD
- `server/routes/nonConformities.js` — NC CRUD with auto-generated NC codes
- `server/routes/ncComments.js` — NC comment CRUD
- `server/routes/spareParts.js` — Spare parts CRUD
- `server/routes/operators.js` — Operator CRUD
- `server/routes/listOptions.js` — Dropdown option management
- `server/routes/authMatrix.js` — Authorization matrix CRUD
- `server/routes/dashboard.js` — Legacy dashboard stats
- `database/00_create_database.sql` — Database + user creation
- `database/01_schema.sql` — 8 core tables
- `database/02_seed_data.sql` — Sample data (machines, operators, list options)
- `database/03_stored_procedures.sql` — Business logic procedures
- `database/CHECK_PERMISSIONS.sql`, `GRANT_ACCESS.sql`, `QUICK_SETUP.md`, `SETUP_ALL_IN_ONE.sql`, `SETUP_COMPLETE.sql`, `CRITICAL_SETUP_INSTRUCTIONS.md`
- `src/services/api.ts` — Axios-based API client
- 7 React Query hooks (`useMachines`, `useMaintenanceActions`, `useNonConformities`, `useSpareParts`, `useListOptions`, `useAuthMatrix`, `useDashboard`)

**Removed:**
- `src/context/MaintenanceContext.tsx` — Removed mock data context
- `src/data/mockData.ts` — Removed mock data

**Modified (14 files):**
- All page components — Migrated from context/mock data to React Query hooks + API calls

---

## v0.3 — 2026-02-06 (Commit `72adbd1`)

### README Update
- Comprehensive README rewrite (+299 lines)

---

## v0.2 — 2026-02-06 (Commit `5fad53a`)

### Bug Fix
- Fixed Authorization Report rendering issue

---

## v0.1 — 2026-02-05 (Commits `3cfb2c4`, `3d84aad`)

### Initial Local Development

Brought Lovable-generated app to local development with major enhancements.

**Created:**
- `src/pages/LandingPage.tsx` — Welcome/landing page
- `src/pages/SectionDashboard.tsx` — Section navigation hub
- `src/context/MaintenanceContext.tsx` — Shared state context (later replaced)

**Modified:**
- `src/components/layout/MainLayout.tsx` — Redesigned sidebar navigation
- All form pages — Expanded features and improved UX
- `src/index.css` — Complete CSS overhaul

---

## v0.0 — 2026-01-19 (Commits `ea95eb0` -> `97a7900`)

### Lovable-Generated Foundation

Initial app scaffolding via Lovable AI with Supabase integration.

**Created (24+ files):**
- All core page components (Dashboard, MachineManagement, MaintenancePlan, NonConformities, NCComments, SpareParts, AuthorizationMatrix, ListsModification, 5 reports)
- `src/components/layout/MainLayout.tsx` — App shell with sidebar
- `src/components/ui/ActionButton.tsx`, `DataTable.tsx`, `FormField.tsx`, `PageHeader.tsx`
- `src/types/maintenance.ts` — Core domain types
- `src/data/mockData.ts` — Mock data for development
- Supabase integration (`src/integrations/supabase/`)

---

## v-1.0 — 2025-01-01 (Commit `b331aa1`)

### Template: Vite + React + shadcn/ui + TypeScript

Lovable starter template: Vite 5.4, React 18 + TypeScript, 70+ shadcn/ui components (Radix UI + Tailwind CSS), Vitest, ESLint.

---

## COMPLETE FILE INVENTORY

### Database (12 files)
```
database/00_create_database.sql
database/01_schema.sql
database/02_seed_data.sql
database/03_stored_procedures.sql
database/04_admin_schema.sql
database/05_dashboard_stored_procedures.sql
database/06_migrate_finalcodes.sql
database/07_maintenance_executions.sql (NEW - uncommitted)
database/08_shifts.sql (NEW - uncommitted)
database/CHECK_PERMISSIONS.sql
database/GRANT_ACCESS.sql
database/SETUP_ALL_IN_ONE.sql
database/SETUP_COMPLETE.sql
```

### Backend Routes (15 files)
```
server/routes/machines.js
server/routes/maintenanceActions.js
server/routes/maintenanceExecutions.js (NEW - uncommitted)
server/routes/nonConformities.js
server/routes/ncComments.js
server/routes/spareParts.js
server/routes/operators.js
server/routes/listOptions.js
server/routes/authMatrix.js
server/routes/documents.js
server/routes/dashboard.js
server/routes/dashboards.js
server/routes/admin.js
server/routes/schedule.js (NEW - uncommitted)
server/routes/shifts.js (NEW - uncommitted)
```

### Frontend Pages (29 files)
```
src/pages/LandingPage.tsx
src/pages/Dashboard.tsx
src/pages/SectionDashboard.tsx
src/pages/MachineManagement.tsx
src/pages/MaintenancePlan.tsx
src/pages/MaintenanceCalendar.tsx
src/pages/NonConformities.tsx
src/pages/NCComments.tsx
src/pages/SpareParts.tsx
src/pages/AuthorizationMatrix.tsx
src/pages/ListsModification.tsx
src/pages/MachineryListReport.tsx
src/pages/MaintenancePlanReport.tsx
src/pages/MaintenanceSummary.tsx
src/pages/NCMaintenanceReport.tsx
src/pages/AuthorizationReport.tsx
src/pages/NotFound.tsx
src/pages/dashboards/DashboardsIndex.tsx
src/pages/dashboards/OverviewDashboard.tsx
src/pages/dashboards/NCAnalyticsDashboard.tsx
src/pages/dashboards/EquipmentHealthDashboard.tsx
src/pages/dashboards/SparePartsDashboard.tsx
src/pages/dashboards/WorkforceDashboard.tsx
src/pages/dashboards/CustomDashboard.tsx
src/pages/admin/AdminDashboard.tsx
src/pages/admin/DatabaseExplorer.tsx
src/pages/admin/UserManagement.tsx
src/pages/admin/SystemMonitoring.tsx
src/pages/admin/ActivityLogs.tsx
```

### Custom Hooks (19 files)
```
src/hooks/useMachines.ts
src/hooks/useMaintenanceActions.ts
src/hooks/useMaintenanceExecutions.ts (NEW - uncommitted)
src/hooks/useNonConformities.ts
src/hooks/useSpareParts.ts
src/hooks/useOperators.ts (NEW - uncommitted)
src/hooks/useListOptions.ts
src/hooks/useAuthMatrix.ts
src/hooks/useMachineDocuments.ts
src/hooks/useDashboard.ts
src/hooks/useDashboards.ts
src/hooks/useDailySchedule.ts (NEW - uncommitted)
src/hooks/useShifts.ts (NEW - uncommitted)
src/hooks/useAdmin.ts
src/hooks/useSidebarBadges.ts
src/hooks/useOnlineStatus.ts
src/hooks/useUnsavedChanges.ts
src/hooks/use-mobile.tsx
src/hooks/use-toast.ts
```

### Database Tables (14)
```
Operators               MaintenanceExecutions (NEW)
Machines                NonConformities
MaintenanceActions      NCComments
SpareParts              AuthorizationMatrix
ListOptions             MachineDocuments
ApiRequestLogs          ErrorLogs
Shifts (NEW)            OperatorShiftOverrides (NEW)
```

### API Endpoints (55+)
```
/api/machines                        — GET, POST, PUT, DELETE + image upload
/api/maintenance-actions             — GET (by machine), POST, PUT, DELETE
/api/maintenance-executions          — GET (date range), GET /stats, POST (upsert), PUT, DELETE
/api/non-conformities                — GET (filtered), POST, PUT, DELETE
/api/nc-comments                     — GET (by NC), POST, DELETE
/api/spare-parts                     — GET (by machine), POST, PUT, DELETE
/api/operators                       — GET, POST, PUT, DELETE
/api/list-options                    — GET (by category), POST, PUT, DELETE
/api/auth-matrix                     — GET (by machine), POST, PUT, DELETE
/api/documents                       — GET, POST, DELETE + file serving
/api/schedule                        — GET (?date=&breakDuration=&...) (NEW - uncommitted)
/api/shifts                          — GET (list shifts) (NEW - uncommitted)
/api/shifts/roster                   — GET (?date=) (NEW - uncommitted)
/api/shifts/operators/:id/default    — PUT (set default shift) (NEW - uncommitted)
/api/shifts/overrides                — POST (upsert), DELETE (NEW - uncommitted)
/api/dashboard                       — GET (legacy stats)
/api/dashboards/overview             — GET
/api/dashboards/nc-analytics         — GET (?area=)
/api/dashboards/equipment-health     — GET (?type=&area=)
/api/dashboards/spare-parts          — GET (?area=)
/api/dashboards/workforce            — GET
/api/dashboards/execution-summary    — GET (NEW - uncommitted)
/api/admin/db/*                      — Database explorer
/api/admin/metrics/*                 — System monitoring
/api/admin/users                     — User management
/api/health                          — Health check
```

---

## TECHNOLOGY STACK

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 5.4 | Build tool |
| React Router DOM | 6.30 | Routing |
| TanStack React Query | 5.83 | Server state management |
| React Hook Form | 7.61 | Form handling |
| Zod | 3.25 | Schema validation |
| Radix UI / shadcn-ui | latest | 70+ UI components |
| Tailwind CSS | 3.4 | Styling |
| Recharts | 2.15 | Charts & visualization |
| Lucide React | 0.462 | Icons |
| Sonner | 1.7 | Toast notifications |
| next-themes | 0.3 | Dark mode |
| date-fns | 3.6 | Date utilities |
| xlsx | 0.18 | Excel export |
| html5-qrcode | latest | QR scanning |
| qrcode.react | latest | QR code generation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | latest | Runtime |
| Express | 4.18 | HTTP framework |
| mssql | 10.0 | SQL Server driver |
| Multer | 2.0 | File uploads |
| CORS | 2.8 | Cross-origin |
| dotenv | 16.4 | Environment config |
| Nodemon | 3.0 | Dev hot reload |

### Database
| Technology | Purpose |
|------------|---------|
| SQL Server | Primary database |
| 14 tables | Core data model |
| 9+ stored procedures | Business logic |
| MERGE upsert pattern | Idempotent writes |
