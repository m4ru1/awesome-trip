# Deployment Guide

How to deploy Awesome Trip to staging and production servers.

> **[中文版](DEPLOY.zh-CN.md)**

## Architecture

```
Client Browser
      │
      ▼
┌──────────────┐
│    Nginx     │  SSL termination, static file serving, reverse proxy
│  (port 443)  │  /.well-known/ → certbot, /api → Express
└──────┬───────┘
       │ /api
       ▼
┌──────────────┐
│   Express    │  API server (marketplace CRUD, auth, rate limiting)
│  (port 3001) │  Serves built frontend as fallback
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   SQLite     │  WAL mode, auto-migration on startup
│  (*.db)      │
└──────────────┘
```

Each environment (staging / production) runs as an independent systemd service on the same Ubuntu server, isolated by port and directory.

## Prerequisites

- A Tencent Cloud Ubuntu 22.04 server with SSH access
- SSH key configured at `~/.ssh/ssh_deploy_trip.pem`
- Deploy scripts in `deploy/` directory (not in git — local only)
- `make` and `rsync` installed locally

## Deploy Configuration

Environment configs live in `deploy/envs/<env>.env`. Each file defines:

| Variable | Description |
|----------|-------------|
| `SSH_HOST` | Server IP address |
| `SSH_USER` | SSH user (`ubuntu`) |
| `DOMAIN` | Public domain / URL path |
| `PORT` | Express server port (staging: 3002, production: 3001) |
| `SYSTEMD_UNIT` | systemd service name |
| `ENV_DIR` | Server deployment directory |
| `BASE_PATH` | Vite base path for sub-path deployment |
| `VITE_API_BASE` | API base URL for frontend |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | CORS origins |
| `DB_PATH` | SQLite database path on server |

## First-Time Server Setup

Run these once per environment:

```bash
# Initialize server (install Node.js, create directories, systemd unit)
make -f deploy/Makefile init-server ENV=staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem

# Configure Nginx + SSL certificate
make -f deploy/Makefile setup-nginx ENV=staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
```

## Deploy Workflow

**Always deploy to staging first, then production.**

### 1. Deploy to staging

```bash
make -f deploy/Makefile deploy-staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
```

This script:
1. Builds the frontend locally (`tsc -b && vite build`)
2. Syncs `dist/`, `server/`, `package.json`, `package-lock.json` via rsync
3. Writes the runtime `.env` on the server
4. Runs `npm ci --production` on the server (rebuilds `better-sqlite3` for Linux)
5. Restarts the systemd service
6. Runs a health check

### 2. Verify on staging

Open the staging URL and verify:
- Frontend loads correctly
- Trip creation and editing work
- Marketplace API responds (if applicable)
- No console errors

### 3. Deploy to production

Only after staging verification passes:

```bash
make -f deploy/Makefile deploy-production SSH_KEY=~/.ssh/ssh_deploy_trip.pem
```

### 4. Verify on production

Same checklist as staging, on the production URL.

## Troubleshooting

### Health check fails after deploy

```bash
# Check service logs (last 50 lines)
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo journalctl -u awesome-trip-staging -n 50"

# Check service status
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo systemctl status awesome-trip-staging"
```

### `better-sqlite3` native module mismatch

The most common deploy failure. The fix is included in the deploy script (`npm ci` on the server rebuilds native modules for Linux). If it still fails:

```bash
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "cd /srv/awesome-trip/staging && npm rebuild better-sqlite3"
```

### Nginx errors

```bash
# Test Nginx config syntax
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo nginx -t"

# Reload Nginx
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo systemctl reload nginx"
```

### Permission errors

The deploy script sets ownership to `www-data:www-data`. If files get wrong permissions:

```bash
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo chown -R www-data:www-data /srv/awesome-trip/<env>"
```

## Quick Reference

```bash
# All available targets
make -f deploy/Makefile help

# Deploy
make -f deploy/Makefile deploy-staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
make -f deploy/Makefile deploy-production SSH_KEY=~/.ssh/ssh_deploy_trip.pem

# First-time setup
make -f deploy/Makefile init-server ENV=staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
make -f deploy/Makefile setup-nginx ENV=production SSH_KEY=~/.ssh/ssh_deploy_trip.pem

# SSH into server
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP>
```
