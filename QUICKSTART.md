# Quickstart

Get Awesome Trip running locally in under a minute.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Setup

```bash
# 1. Clone and install
git clone <repo-url> awesome-trip
cd awesome-trip
npm install

# 2. Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

## First Trip

1. Click **+ 新建** (top-right) to create a trip, or click **从模板开始** to start with the "京都赏枫" template
2. Click a trip card to open it
3. Click a day cell in the grid to add a block — pick a type (sight, meal, transport, etc.), set times, and save
4. Use **+ 新建天** to add more days
5. Switch modes: **规划** (edit), **预览** (read), **执行** (checklist)

## Run Tests

```bash
npm run test          # 90 tests, ~1s
npm run test:watch    # Watch mode for development
```

## Production Build

```bash
npm run build         # Outputs to dist/
npm start             # Start Express server
```

## Backend (Optional)

The Express API server powers marketplace publishing and browsing:

```bash
npm run dev:server    # Start with hot-reload (port 3000)
```

If you don't need marketplace features, the frontend works fully standalone — all trip data is stored in localStorage.

## Deploy

See `CLAUDE.md` for the full deploy workflow (staging first, then production).

## Next Steps

- Read `CLAUDE.md` for architecture details and git workflow
- Check `docs/superpowers/specs/` for feature design documents
- Export trips via **Settings → 导出行程** and share `.ajourney` files
