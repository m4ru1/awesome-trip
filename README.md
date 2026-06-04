# Awesome Trip

A visual trip planner for travelers who want beautifully organized itineraries. Plan day-by-day, track sights/meals/transport, and export your trips for sharing or backup.

## Features

- **Multi-trip library** — create, duplicate, and manage multiple trips
- **Day-by-day planning** — add blocks (sights, meals, rest, transport, free time) with start/end times
- **Three-panel carousel** — swipe through days on mobile without jank
- **Schedule grid** — time-based calendar view on desktop
- **Block editor** — rich block creation with primary options, alternatives, transport links, and conflict detection
- **Three modes** — Plan (edit), View (read-only), Execute (check off items)
- **Marketplace** — browse and fork published trip templates from the community
- **Storage V2** — automatic v1→v2 migration, dual-key backup, integrity verification
- **Export/Import** — JSON export (`.ajourney` format) with conflict-aware import and fork support
- **Responsive** — desktop grid view, mobile timeline, adaptive layouts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Motion (Framer) |
| Build | Vite 8 |
| Backend | Express 5, better-sqlite3 |
| Testing | Vitest, @testing-library/react, jsdom |
| Storage | localStorage (v2 StorageEnvelope with backup key) |

## Commands

```bash
npm run dev          # Start dev server (Vite HMR at localhost:5173)
npm run dev:server   # Start Express API server
npm run build        # Type-check + production build
npm run test         # Run 90 tests across 4 suites
npm run test:watch   # Watch mode
npm start            # Production server
```

## Project Structure

```
src/
├── App.tsx                   # Central state owner, view routing
├── types/index.ts            # TypeScript interfaces
├── hooks/
│   ├── useTripLibrary.ts     # Multi-trip CRUD, v1→v2 migration, export/import
│   └── __tests__/            # Hook tests (23)
├── services/
│   ├── storage.ts            # StorageEnvelope wrap/read/write, integrity verify
│   ├── export.ts             # ExportEnvelope, filename sanitize, JSON download
│   ├── import.ts             # Envelope validation, conflict detection, import apply
│   └── __tests__/            # Service tests (59)
├── components/
│   ├── editor/               # BlockEditor modal
│   ├── grid/                 # ScheduleGrid (desktop)
│   ├── timeline/             # DayTimeline (mobile)
│   ├── panels/               # DetailContent drawer/sheet
│   ├── home/                 # HomeView trip cards
│   └── settings/             # SettingsPanel, ExportDialog, ImportDialog
├── data/
│   ├── seed.ts               # Seed trip template ("京都赏枫")
│   └── constants.ts          # Type metadata, weather presets, APP_VERSION
└── utils/
    ├── transforms.ts         # Day-level ops: sort, conflict detection
    └── time.ts               # Time helpers
```

## Design Specs

Feature specs live in `docs/superpowers/specs/`. Read the relevant spec before working on a feature.

## License

Private project.
