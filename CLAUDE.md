# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

**Never commit directly to `main`.** All work must happen on feature branches:

```bash
git checkout -b feature/<name>   # or fix/<name>
# ... make changes, commit ...
git checkout main && git merge <branch>
```

Commits follow conventional commit style: `feat:`, `fix:`, `docs:` prefixes with Chinese or English descriptions.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build
npx tsc --noEmit   # Type-check only (no emit)
```

No test suite is configured. The build (`tsc -b && vite build`) is the primary verification step.

## Architecture

Single-page trip planner with no router library. `App.tsx` (~620 lines) is the central state owner — all trip data, UI state, and CRUD callbacks live here and are threaded down via props.

**View switching** is pure state: `view` (`'home' | 'trip'`) toggles between the home screen and trip editor. `mode` (`'plan' | 'view' | 'execute' | 'share'`) switches sub-views within the editor.

**State flow:** `useTripLibrary` hook → `App.tsx` local `trip` state → props down to components → callbacks up. No context, no Zustand, no Redux.

**Persistence:** `useTripLibrary` stores `Trip[]` in localStorage (`tt_trips_v1`) and active trip ID (`tt_active_trip_v1`). On first launch, the seed trip ("京都赏枫5日") is used as default data.

## Data Model (`src/types/index.ts`)

```
Trip { id, title, subtitle, destinationCity, coverEmoji, coverColor, dateRange, party, days: Day[] }
Day  { id, dateLabel, weekday, weatherHint, weatherIcon, temperature?, subtitle?, blocks: Block[] }
Block { id, type (sight|meal|rest|transport|free), startTime, endTime, status, primary: Option, alternatives: Option[], transportToNext: Transport|null, conflict? }
Option { id, name, emoji, tags[], highlight?, address?, openHours?, ticketPrice?, ...type-specific fields }
```

## Key Files

| Path | Role |
|------|------|
| `src/App.tsx` | All state, all CRUD callbacks, view routing |
| `src/types/index.ts` | TypeScript interfaces for all data |
| `src/hooks/useTripLibrary.ts` | localStorage persistence, multi-trip CRUD |
| `src/data/seed.ts` | Seed/template trip data ("京都赏枫5日") |
| `src/data/constants.ts` | TYPE_META, TRANSPORT_META, SCENARIO_META, weather presets |
| `src/utils/transforms.ts` | Day-level ops: recalcDay, sortByStart, flagConflicts, nextStartFor |
| `src/utils/time.ts` | Time helpers: toMin, fmt, parseTransportMin |
| `src/components/editor/BlockEditor.tsx` | Modal form for creating/editing blocks and alternatives |
| `src/components/panels/DetailContent.tsx` | Shared block detail body (drawer + sheet) |
| `src/components/grid/ScheduleGrid.tsx` | Desktop calendar grid view (time-based positioning) |
| `src/components/timeline/DayTimeline.tsx` | Mobile vertical timeline view |

## Path Alias

`@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

## Design Specs

Feature specs are stored in `docs/superpowers/specs/`. Read the relevant spec before implementing any feature.
