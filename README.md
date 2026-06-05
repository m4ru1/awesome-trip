# Awesome Trip

A visual trip planner that helps you organize day-by-day itineraries. Create trips, schedule sights, meals, and transport with drag-and-drop ease, then export or share your plans.

**[Quick Start](QUICKSTART.md)** | **[快速开始](QUICKSTART.zh-CN.md)** | **[Deploy Guide](DEPLOY.md)** | **[部署指南](DEPLOY.zh-CN.md)**

---

## Features

- **Multi-trip management** — create, duplicate, and organize multiple trips in a library
- **Day-by-day planning** — add timed blocks for sights, meals, rest, transport, and free time
- **Three planning modes** — Plan (edit), View (read-only), Execute (check off items as you go)
- **Conflict detection** — automatically flags overlapping time blocks
- **Marketplace** — publish trip templates for the community, browse and fork others' trips
- **Export & Import** — export trips as `.ajourney` files with conflict-aware import and merge
- **Responsive design** — desktop calendar grid and mobile timeline views

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React 19 + TypeScript + Tailwind) │
│  ┌─────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Home    │ │  Trip      │ │  Marketplace│ │
│  │ Screen  │ │  Editor    │ │  Browser    │ │
│  └─────────┘ └────────────┘ └─────────────┘ │
│       State: App.tsx (props-driven, no Redux) │
│       Storage: localStorage (v2 envelope)     │
└──────────────────┬──────────────────────────┘
                   │ /api
┌──────────────────▼──────────────────────────┐
│  Backend (Express 5 + better-sqlite3)        │
│  ┌────────────────┐ ┌─────────────────────┐ │
│  │ Marketplace API│ │  Auth & Rate Limit  │ │
│  │ (CRUD + share) │ │  Middleware         │ │
│  └────────────────┘ └─────────────────────┘ │
│       Database: SQLite (WAL mode)            │
└──────────────────────────────────────────────┘
```

The frontend works fully standalone — all trip data is stored in the browser's localStorage. The backend is only needed for marketplace features (publishing and browsing shared trips).

## Getting Started

See **[QUICKSTART.md](QUICKSTART.md)** for the full setup guide. The shortest path:

```bash
git clone <repo-url> awesome-trip && cd awesome-trip
npm install
npm run dev        # → http://localhost:5173
```

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run dev:server` | Start Express API server with hot-reload |
| `npm run build` | Type-check + production build to `dist/` |
| `npm start` | Start Express server (serves built frontend + API) |
| `npm run test` | Run test suite (Vitest + jsdom) |
| `npm run test:watch` | Run tests in watch mode |
| `npx tsc --noEmit` | Type-check only |

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed. See `.env.example` for the full list of variables and defaults. Most variables have sensible defaults for local development.

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Express server port |
| `ALLOWED_ORIGINS` | *(empty)* | CORS origins (comma-separated; empty = allow all) |
| `DB_PATH` | `./data/marketplace.db` | SQLite database path |

Frontend-only variable:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | `/api` | API base URL |

### Project Structure

```
src/
├── App.tsx                    # Central state, view routing, CRUD callbacks
├── types/index.ts             # TypeScript interfaces (Trip, Day, Block, Option, …)
├── hooks/useTripLibrary.ts    # Multi-trip CRUD, localStorage persistence, import/export
├── services/                  # Storage, export, import logic
├── components/
│   ├── home/                  # Home screen (trip library cards)
│   ├── editor/                # Block editor modal
│   ├── grid/                  # Schedule grid (desktop)
│   ├── timeline/              # Day timeline (mobile)
│   ├── panels/                # Detail drawer/sheet
│   └── settings/              # Settings, export dialog, import dialog
├── data/                      # Seed data, constants, metadata
└── utils/                     # Time helpers, day-level transforms
server/
├── index.ts                   # Express entry point
├── config.ts                  # Environment-based configuration
├── db.ts                      # SQLite setup + migrations
├── routes/marketplace.ts      # Marketplace API endpoints
└── middleware/                 # Auth, rate limiting, validation
```

### Git Workflow

All work happens on feature branches, never directly on `main`:

```bash
git checkout -b feature/<name>   # or fix/<name>
# ... make changes, commit ...
git checkout main && git merge <branch>
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, etc.

### Testing

The test suite uses Vitest with jsdom and React Testing Library:

```bash
npm run test        # Run all tests (~90 tests, ~1s)
npm run test:watch  # Watch mode during development
```

Tests live in `__tests__/` directories next to the code they test.

## Deployment

See **[DEPLOY.md](DEPLOY.md)** for the full deployment guide including staging, production, and troubleshooting.

## License

Copyright (c) 2024-2026 mora. All rights reserved. See [LICENSE](LICENSE) for details.

---

**[中文文档](README.zh-CN.md)**
