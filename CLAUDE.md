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

## Deployment

Deploy scripts live in `deploy/` (gitignored, local-only). They deploy to a Tencent Cloud Ubuntu 22.04 server via SSH + rsync.

**Target server:**
- User: `ubuntu` (sudo-capable)
- SSH key: `~/.ssh/ssh_deploy_trip.pem`
- Server IP: configured in `deploy/envs/{production,staging}.env` (`SSH_HOST`)

**Architecture:** Nginx (SSL termination + static file serve) → Express (API only, port 3001/3002), managed by systemd.

**Deploy flow — always stage first, then production:**

```bash
# Stage first
make -C deploy deploy-staging
# Verify at https://staging.trip.mollia.space, then:
make -C deploy deploy-production
```

**Rule: always deploy to staging first.** After any feature or bugfix is merged to main, deploy to staging and verify before touching production. Never skip staging. Only deploy to production after the user confirms staging looks good.

**Deploy before commit.** 部署 staging 先于 git commit。先部署 staging 验证效果，确认无误后再提交代码，避免将有问题的改动提交到 git 历史。流程：开发完成 → 部署 staging → 验证 → 确认后 commit → 再部署 production。

**When to offer deployment:** After completing a feature or bugfix that the user asked to ship. Say "Ready to deploy. Stage first?" and let the user decide. Do NOT deploy unprompted.

**If deploy fails:** Check server logs (`sudo journalctl -u awesome-trip -n 50`) and Nginx config (`sudo nginx -t`). The most common failure is `better-sqlite3` native module mismatch — the server-side `npm ci --production` rebuilds it for Linux, so never rsync local `node_modules`.

**Key commands reference:**
```bash
make -f deploy/Makefile help                        # List all targets
make -f deploy/Makefile deploy-staging              # Build + rsync + restart staging
make -f deploy/Makefile deploy-production           # Build + rsync + restart production
make -f deploy/Makefile init-server ENV=production  # First-time server setup (once per env)
make -f deploy/Makefile setup-nginx ENV=production  # Configure nginx + SSL cert (once per env)
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP>       # SSH into server
```

## Design Specs

Feature specs are stored in `docs/superpowers/specs/`. Read the relevant spec before implementing any feature.
