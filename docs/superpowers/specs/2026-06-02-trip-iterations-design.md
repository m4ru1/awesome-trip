# Design Spec: Three UX Iterations
**Date:** 2026-06-02  
**Project:** awesome-trip  
**Status:** Approved

---

## Overview

Three independent improvements to the trip planner:

1. **列宽约束** — cap desktop grid column width to prevent over-stretching on wide monitors
2. **天配置面板 (DayPanel)** — clickable day headers open a focused day-info editor; adding a day auto-opens it
3. **旅行管理主入口 (HomeView)** — a home screen for managing multiple trip plans, with localStorage persistence

---

## Iteration 1: Desktop Column Max-Width

### Problem
`ScheduleGrid` uses `minmax(186px, 1fr)` for each day column. On a 1920px monitor with 5 days, each column stretches to ~350px, harming readability.

### Solution
Change the column template from `1fr` to `240px` max:

```
gridTemplateColumns: `58px repeat(${trip.days.length}, minmax(186px, 240px))${editable ? ' 66px' : ''}`
```

Also update `gridMinWidth` accordingly (already uses `200` per column, no change needed).

### Files
- `src/components/grid/ScheduleGrid.tsx` — line 106, one-line change

---

## Iteration 2: Day Config Panel (DayPanel)

### Goals
- Clicking any day column header (in grid or DayTabs) opens a lightweight panel for that day
- Adding a new day auto-opens DayPanel for the new day
- Date field is **display-only** (no accidental edits); only weather icon and weather hint are editable
- Low cognitive overhead — no extra modal layer, reuses existing data flow

### New Component: `DayPanel`

**Location:** `src/components/trip/DayPanel.tsx`

**Props:**
```ts
interface DayPanelProps {
  dayIdx: number
  day: Day
  onClose: () => void
  onUpdate: (patch: Partial<Day>) => void
}
```

**Layout (desktop):** small centered modal overlay (width ~320px), same pattern as `ConfirmDialog` — backdrop + card. On mobile: bottom sheet (same as `BlockSheet` pattern).

**Fields:**
| Field | Behavior |
|---|---|
| 日期 | Read-only text: `"11/19 · 周三"` (dateLabel + weekday joined) |
| 天气图标 | Single-line text input (emoji, e.g. `☀️`) |
| 天气描述 | Single-line text input (e.g. `晴 18°C`) |

**No** weekday editing (derived from date; editing date is out of scope).

### State in App.tsx
```ts
const [dayPanel, setDayPanel] = useState<number | null>(null) // dayIdx or null
```

### Trigger Points

**ScheduleGrid:** day header `<div>` (currently not interactive) gets:
```tsx
onClick={() => onDayHeaderClick(di)}
style={{ cursor: 'pointer' }}
```
New prop: `onDayHeaderClick: (dayIdx: number) => void`

**DayTabs:** each tab gets a small edit icon `✎` that triggers `onDayHeaderClick` (separate from the tab's main `onPick` click to avoid conflict with tab switching).

**addDay() in App.tsx:** after `setTrip(...)`, call `setDayPanel(newIdx)` to auto-open.

### Files
- `src/components/trip/DayPanel.tsx` — new component
- `src/components/grid/ScheduleGrid.tsx` — add `onDayHeaderClick` prop + onClick on headers
- `src/components/timeline/DayTabs.tsx` — add edit icon per tab
- `src/App.tsx` — add `dayPanel` state, wire up `DayPanel`, pass callback to grid/tabs, call `setDayPanel` after `addDay`

---

## Iteration 3: Trip Management Home (HomeView)

### Goals
- Users can manage multiple independent trip plans
- Home screen is the app entry point (card grid of all trips)
- In-trip: TopBar provides a back button to home; TripPanel gets a "切换旅行" section (the "B" supplement)
- No backend or router library needed

### Data Layer (localStorage)

| Key | Value | Notes |
|---|---|---|
| `tt_trips_v1` | `Trip[]` JSON | All saved trips |
| `tt_active_trip_v1` | `string` (trip ID) | Last-opened trip |

**First launch:** if `tt_trips_v1` is empty, write `[SEED_TRIP]` and set active ID to `SEED_TRIP.id`.

**Custom hook:** `src/hooks/useTripLibrary.ts`
```ts
// Returns: trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip
```
Handles all read/write to localStorage. Components never touch localStorage directly.

### App-Level Routing (pure state, no react-router)

In `App.tsx`, add:
```ts
const [view, setView] = useState<'home' | 'trip'>('home')
```

- `view === 'home'` → render `<HomeView>`
- `view === 'trip'` → render existing trip editor (no internal changes)

On initial load: if active trip exists → go directly to `'trip'`; otherwise show `'home'`.

### New Component: HomeView

**Location:** `src/components/home/HomeView.tsx`

**Layout:**
```
┌─────────────────────────────────┐
│  ✈️  我的旅行          [+ 新建]  │  ← header bar
├─────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ 🍁   │  │ 🗼   │  │  +   │  │  ← card grid (2-col mobile, 3-4 col desktop)
│  │京都   │  │东京   │  │新建   │  │
│  │5天    │  │7天    │  │      │  │
│  └──────┘  └──────┘  └──────┘  │
└─────────────────────────────────┘
```

**Trip card fields displayed:** coverEmoji, title, subtitle, dateRange, party, days count, blocks count.

**Interactions:**
- Click card → `setActiveTrip(id)` + `setView('trip')`
- Click "新建" card or "+ 新建旅行" button → open `TripCreateDialog`
- Card has a `⋯` overflow menu with "删除" option (triggers inline confirm, same pattern as TripPanel day deletion)

### New Component: TripCreateDialog

**Location:** `src/components/home/TripCreateDialog.tsx`

**Fields:**
| Field | Type | Default |
|---|---|---|
| 旅行名称 | text input | `"新旅行"` |
| 封面 Emoji | single emoji input | `"✈️"` |
| 目的地 | text input | `""` |
| 日期范围 | text input | `""` (e.g. `"6/1 – 6/5"`) |
| 出行人 | text input | `""` |

Confirm → create `Trip` with `id = 't-' + Date.now()`, `days = []`, `coverColor = '#FF8A4C'` → save via `useTripLibrary` → navigate to the new trip.

### TopBar Changes

Add a small "← 首页" back button to the left of the trip emoji:

```tsx
<button onClick={() => setView('home')} className="btn btn-ghost h-9 w-9 !p-0">
  ←
</button>
```

Existing emoji/title click still opens TripPanel (no change).

### TripPanel "切换旅行" Section (B-style supplement)

At the top of TripPanel, before trip meta fields, add a collapsible section:

```
切换旅行   ▾
  🍁 京都赏枫 5日  (当前)
  🗼 东京春游 7日  → 点击切换
  ← 返回主页
```

Uses `useTripLibrary` to list trips; clicking one calls `setActiveTrip` and closes TripPanel.

### Files
- `src/hooks/useTripLibrary.ts` — new hook
- `src/components/home/HomeView.tsx` — new component
- `src/components/home/TripCreateDialog.tsx` — new component
- `src/components/layout/TopBar.tsx` — add back button prop
- `src/components/trip/TripPanel.tsx` — add trip-switcher section at top
- `src/App.tsx` — add `view` state, integrate `useTripLibrary`, wire everything

---

## Component Boundary Summary

| Component | Responsibility | Communicates via |
|---|---|---|
| `useTripLibrary` | All localStorage I/O for trips list | Hook return values |
| `HomeView` | Display and select trips | Props from App |
| `TripCreateDialog` | Collect new trip metadata | `onConfirm(trip)` callback |
| `DayPanel` | Edit weather for one day | `onUpdate(patch)` callback |
| `App` | Owns `view` state + active trip | Props down, callbacks up |

---

## Out of Scope

- Import/export trips as JSON files (can be added later)
- Date editing within DayPanel (date is display-only by design)
- Drag-to-reorder trips on home screen
- Trip duplication/clone
