# Quick Start

This guide walks you through setting up Awesome Trip for local development.

> **[中文版](QUICKSTART.zh-CN.md)**

## Prerequisites

- **Node.js** >= 18 (LTS recommended)
- **npm** >= 9 (bundled with Node.js)
- **OS**: macOS, Linux, or Windows with WSL2

## Installation

```bash
# 1. Clone the repository
git clone <repo-url> awesome-trip
cd awesome-trip

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env
# Edit .env if you need to customize ports, database path, etc.
# Defaults work out of the box for local development.
```

## Running the Frontend

The frontend is a standalone React app that stores all trip data in localStorage. No backend needed.

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. You should see the home screen with the option to create a new trip or start from the "Kyoto Autumn" template.

### Verify it works

1. The dev server should start without errors
2. The browser shows the home screen with trip cards
3. Clicking "+" creates a new trip and opens the editor
4. All trip data persists across browser refreshes (localStorage)

## Running the Backend (Optional)

The Express server provides the marketplace API for publishing and browsing shared trips. It is not required for basic trip planning.

```bash
# In a separate terminal
npm run dev:server
```

The server starts on port 3000 (configurable via `PORT` env var). It automatically creates the SQLite database on first run.

### Full-stack mode

To run both frontend and backend together:

1. Start the backend: `npm run dev:server`
2. In another terminal, start the frontend: `npm run dev`
3. The frontend proxies `/api` requests to the backend via Vite config

## Running Tests

```bash
npm run test          # Run all tests (~90 tests, ~1s)
npm run test:watch    # Watch mode for active development
```

The test suite covers:
- Storage service (wrap/read/write, integrity verification)
- Import/export service (validation, conflict detection, merge)
- Trip library hook (CRUD operations, v1→v2 migration)

## Production Build

```bash
# Build the frontend
npm run build         # Type-check + bundle to dist/

# Start the production server (serves frontend + API)
npm start
```

The production server serves the built frontend as static files and exposes the API at `/api`.

## Creating Your First Trip

1. From the home screen, click **+ New** (top-right) to create a blank trip, or click **Start from template** to use the built-in "Kyoto Autumn" template
2. Click a trip card to open the editor
3. In the grid view (desktop) or timeline view (mobile), click to add a block — choose a type (sight, meal, transport, etc.), set start/end times, and save
4. Use **+ Add Day** to expand the itinerary
5. Switch between modes using the toolbar:
   - **Plan** — edit blocks, drag to reorder
   - **View** — read-only preview
   - **Execute** — check off items as you go

## Troubleshooting

### `npm install` fails with native module errors

If `better-sqlite3` fails to build, ensure you have a C++ compiler installed:
- **macOS**: `xcode-select --install`
- **Linux**: `sudo apt install build-essential` (Debian/Ubuntu)

### Port 5173 or 3000 already in use

```bash
# Find the process using the port
lsof -i :5173   # or :3000

# Kill it
kill -9 <PID>
```

### Frontend can't reach the API

Ensure the backend is running (`npm run dev:server`) and check `VITE_API_BASE` in your `.env` file. The default `/api` works when both servers run locally with Vite proxy.

## Next Steps

- Read [README.md](README.md) for architecture details
- Read [DEPLOY.md](DEPLOY.md) for deployment instructions
- Check `.env.example` for all available configuration options
