# Deploy Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-command SSH deploy workflow for awesome-trip to Tencent Cloud Ubuntu 22.04 with Nginx + Let's Encrypt SSL, supporting staging/production dual environments.

**Architecture:** Shell scripts (`deploy/scripts/`) handle the heavy lifting — `lib.sh` provides shared SSH/rsync/logging helpers, `deploy.sh` runs local build + rsync + remote restart, `init-server.sh` bootstraps a fresh server. A Makefile provides declarative entry points (`make deploy-staging`). Nginx config uses a single template file with `{{PLACEHOLDER}}` substitution for both environments.

**Tech Stack:** Bash, Make, Nginx, systemd, certbot, rsync, Node.js 22 LTS

---

### Task 1: Add `deploy/` to .gitignore

**Files:**
- Modify: `.gitignore:10`

- [ ] **Step 1: Append `deploy/` to .gitignore**

Add a new line at the end of `.gitignore`:

```
deploy/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: exclude deploy/ from version control"
```

---

### Task 2: Create environment config files

**Files:**
- Create: `deploy/envs/production.env`
- Create: `deploy/envs/staging.env`

- [ ] **Step 1: Create deploy/envs directory**

```bash
mkdir -p deploy/envs deploy/nginx deploy/scripts
```

- [ ] **Step 2: Write deploy/envs/production.env**

```bash
# Server connection
SSH_HOST=YOUR_SERVER_IP
SSH_USER=root

# Domain & routing
DOMAIN=trip.mollia.space
PORT=3001
SYSTEMD_UNIT=awesome-trip
ENV_DIR=/srv/awesome-trip/production

# Node runtime env (written to server .env)
NODE_ENV=production
ALLOWED_ORIGINS=https://trip.mollia.space
DB_PATH=/srv/awesome-trip/production/data/marketplace.db
```

- [ ] **Step 3: Write deploy/envs/staging.env**

```bash
# Server connection
SSH_HOST=YOUR_SERVER_IP
SSH_USER=root

# Domain & routing
DOMAIN=staging.trip.mollia.space
PORT=3002
SYSTEMD_UNIT=awesome-trip-staging
ENV_DIR=/srv/awesome-trip/staging

# Node runtime env (written to server .env)
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.trip.mollia.space
DB_PATH=/srv/awesome-trip/staging/data/marketplace.db
```

- [ ] **Step 4: Commit**

```bash
git add deploy/envs/
git commit -m "feat: add environment config templates for production and staging"
```

---

### Task 3: Create shared library (lib.sh)

**Files:**
- Create: `deploy/scripts/lib.sh`

- [ ] **Step 1: Write deploy/scripts/lib.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "\n${GREEN}==>${NC} $*"; }

die() {
    log_error "$@"
    exit 1
}

# Load env file and validate required vars
load_env() {
    local env_file="$1"
    [ -f "$env_file" ] || die "Env file not found: $env_file"
    source "$env_file"

    [ -n "${SSH_HOST:-}" ] || die "SSH_HOST is required in $env_file"
    [ -n "${SSH_USER:-}" ] || die "SSH_USER is required in $env_file"
    [ -n "${DOMAIN:-}" ]   || die "DOMAIN is required in $env_file"
    [ -n "${PORT:-}" ]     || die "PORT is required in $env_file"
    [ -n "${SYSTEMD_UNIT:-}" ] || die "SYSTEMD_UNIT is required in $env_file"
    [ -n "${ENV_DIR:-}" ]  || die "ENV_DIR is required in $env_file"
}

# Build SSH command with optional key
ssh_cmd() {
    local key="${SSH_KEY:-}"
    if [ -n "$key" ]; then
        echo "ssh -i \"$key\" -o StrictHostKeyChecking=accept-new"
    else
        echo "ssh -o StrictHostKeyChecking=accept-new"
    fi
}

# Build rsync command with optional key
rsync_cmd() {
    local key="${SSH_KEY:-}"
    if [ -n "$key" ]; then
        echo "rsync -avz --delete -e \"ssh -i $key -o StrictHostKeyChecking=accept-new\""
    else
        echo "rsync -avz --delete -e \"ssh -o StrictHostKeyChecking=accept-new\""
    fi
}

# Run command on remote server
remote() {
    eval "$(ssh_cmd) ${SSH_USER}@${SSH_HOST} \"$1\""
}

# Run rsync to remote server
sync_to_remote() {
    local src="$1"
    local dst="$2"
    eval "$(rsync_cmd) \"$src\" \"${SSH_USER}@${SSH_HOST}:$dst\""
}
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x deploy/scripts/lib.sh
```

- [ ] **Step 3: Commit**

```bash
git add deploy/scripts/lib.sh
git commit -m "feat: add shared shell library for SSH/rsync/logging"
```

---

### Task 4: Create deploy script (deploy.sh)

**Files:**
- Create: `deploy/scripts/deploy.sh`

- [ ] **Step 1: Write deploy/scripts/deploy.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/lib.sh"

# Parse args
ENV=""
SSH_KEY="${SSH_KEY:-}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -e|--env) ENV="$2"; shift 2 ;;
        -k|--key) SSH_KEY="$2"; shift 2 ;;
        *) die "Unknown option: $1" ;;
    esac
done

[ -n "$ENV" ] || die "Usage: deploy.sh -e <production|staging> [-k <ssh-key-path>]"

# Load environment config
ENV_FILE="$SCRIPT_DIR/../envs/$ENV.env"
load_env "$ENV_FILE"

log_step "Deploying $ENV ($DOMAIN)"

# Step 1: Build locally
log_info "Building project..."
cd "$PROJECT_DIR"
npm run build

# Step 2: Sync files to server
log_info "Syncing files to $SSH_HOST..."
sync_to_remote "$PROJECT_DIR/dist/"          "$ENV_DIR/dist/"
sync_to_remote "$PROJECT_DIR/server/"        "$ENV_DIR/server/"
sync_to_remote "$PROJECT_DIR/package.json"   "$ENV_DIR/package.json"
sync_to_remote "$PROJECT_DIR/package-lock.json" "$ENV_DIR/package-lock.json"

# Step 3: Write runtime .env on server
log_info "Writing runtime .env..."
remote "cat > $ENV_DIR/.env << 'DOTENV'
NODE_ENV=${NODE_ENV:-production}
PORT=$PORT
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-}
DB_PATH=${DB_PATH:-./data/marketplace.db}
DOTENV"

# Step 4: Install dependencies on server (Linux-native build for better-sqlite3)
log_info "Installing production dependencies..."
remote "cd $ENV_DIR && npm ci --production"

# Step 5: Restart service
log_info "Restarting service: $SYSTEMD_UNIT"
remote "sudo systemctl restart $SYSTEMD_UNIT"

# Step 6: Health check
log_info "Waiting for service to start..."
sleep 2
if remote "curl -sf http://127.0.0.1:$PORT/" > /dev/null 2>&1; then
    log_info "Health check passed"
else
    log_warn "Health check failed — check logs: sudo journalctl -u $SYSTEMD_UNIT -n 50"
fi

log_step "Deploy complete: https://$DOMAIN"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x deploy/scripts/deploy.sh
```

- [ ] **Step 3: Commit**

```bash
git add deploy/scripts/deploy.sh
git commit -m "feat: add deploy script with build + rsync + remote restart"
```

---

### Task 5: Create Nginx config template

**Files:**
- Create: `deploy/nginx/trip.conf.template`

- [ ] **Step 1: Write deploy/nginx/trip.conf.template**

```nginx
# HTTP — redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name {{DOMAIN}};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {{DOMAIN}};

    # Managed by certbot — placeholder, certbot fills these in
    # ssl_certificate     /etc/letsencrypt/live/{{DOMAIN}}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/{{DOMAIN}}/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;
    gzip_vary on;

    root {{ROOT}}/dist;
    index index.html;

    # API — reverse proxy to Node
    location /api/ {
        proxy_pass http://127.0.0.1:{{PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
    }

    # Static files — direct serve
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache busting: assets/ has hashed filenames
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add deploy/nginx/trip.conf.template
git commit -m "feat: add nginx config template with SSL + SPA fallback + API proxy"
```

---

### Task 6: Create Nginx setup script

**Files:**
- Create: `deploy/nginx/setup-nginx.sh`

- [ ] **Step 1: Write deploy/nginx/setup-nginx.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../scripts/lib.sh"

ENV=""
SSH_KEY="${SSH_KEY:-}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -e|--env) ENV="$2"; shift 2 ;;
        -k|--key) SSH_KEY="$2"; shift 2 ;;
        *) die "Unknown option: $1" ;;
    esac
done

[ -n "$ENV" ] || die "Usage: setup-nginx.sh -e <production|staging> [-k <ssh-key-path>]"

ENV_FILE="$SCRIPT_DIR/../envs/$ENV.env"
load_env "$ENV_FILE"

log_step "Setting up Nginx for $ENV ($DOMAIN)"

# Generate config from template
CONF_DIR="/etc/nginx/sites-available"
CONF_FILE="$CONF_DIR/awesome-trip-$ENV.conf"
LINK_FILE="/etc/nginx/sites-enabled/awesome-trip-$ENV.conf"

log_info "Generating Nginx config..."
TEMPLATE="$SCRIPT_DIR/trip.conf.template"
CONF_CONTENT=$(sed \
    -e "s|{{DOMAIN}}|$DOMAIN|g" \
    -e "s|{{ROOT}}|$ENV_DIR|g" \
    -e "s|{{PORT}}|$PORT|g" \
    "$TEMPLATE")

# Upload config
remote "cat > /tmp/awesome-trip-$ENV.conf << 'NGINX_EOF'
$CONF_CONTENT
NGINX_EOF
sudo mkdir -p $CONF_DIR /var/www/certbot
sudo mv /tmp/awesome-trip-$ENV.conf $CONF_FILE
sudo ln -sf $CONF_FILE $LINK_FILE"

# Test and reload
log_info "Testing Nginx config..."
remote "sudo nginx -t" || die "Nginx config test failed"

log_info "Reloading Nginx..."
remote "sudo systemctl reload nginx"

# Certbot — first obtain cert, then install
log_info "Obtaining SSL certificate (HTTP challenge)..."
remote "sudo certbot certonly --webroot -w /var/www/certbot \
    -d $DOMAIN \
    --non-interactive --agree-tos \
    --email admin@mollia.space \
    --keep-until-expiring" || log_warn "Certbot may need manual attention — run it after DNS propagates"

# If cert exists, enable SSL in config
log_info "Checking for SSL certificate..."
remote "
    if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
        # Replace the cert placeholder lines with actual cert paths
        sudo sed -i 's|# ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;|' $CONF_FILE
        sudo sed -i 's|# ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;|' $CONF_FILE
        sudo nginx -t && sudo systemctl reload nginx
        echo 'SSL certificate activated'
    else
        echo 'SSL certificate not yet available — run certbot manually after DNS is set up'
    fi
"

log_step "Nginx setup complete for $DOMAIN"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x deploy/nginx/setup-nginx.sh
```

- [ ] **Step 3: Commit**

```bash
git add deploy/nginx/setup-nginx.sh
git commit -m "feat: add nginx setup script with certbot integration"
```

---

### Task 7: Create server initialization script (init-server.sh)

**Files:**
- Create: `deploy/scripts/init-server.sh`

- [ ] **Step 1: Write deploy/scripts/init-server.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

ENV=""
SSH_KEY="${SSH_KEY:-}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -e|--env) ENV="$2"; shift 2 ;;
        -k|--key) SSH_KEY="$2"; shift 2 ;;
        *) die "Unknown option: $1" ;;
    esac
done

[ -n "$ENV" ] || die "Usage: init-server.sh -e <production|staging|all> [-k <ssh-key-path>]"

ENV_FILE="$SCRIPT_DIR/../envs/$ENV.env"

# If "all", init both environments on the same server
if [ "$ENV" = "all" ]; then
    "$0" -e production -k "$SSH_KEY"
    "$0" -e staging -k "$SSH_KEY"
    exit 0
fi

load_env "$ENV_FILE"

# The HARD-GATE check
log_warn "This will install packages and configure services on $SSH_HOST"
log_warn "Environment: $ENV ($DOMAIN, port $PORT)"
echo -n "Continue? [y/N] "
read -r confirm
[ "$confirm" = "y" ] || [ "$confirm" = "Y" ] || die "Aborted"

log_step "Initializing server for $ENV ($DOMAIN)"

# 1. Install system packages
log_info "Installing system packages..."
remote "sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx curl"

# 2. Install Node.js 22 LTS (idempotent)
log_info "Setting up Node.js 22 LTS..."
remote '
    if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt install -y nodejs
        echo "Node.js $(node -v) installed"
    else
        echo "Node.js $(node -v) already installed"
    fi
'

# 3. Create directory structure
log_info "Creating directory structure..."
remote "sudo mkdir -p $ENV_DIR/dist $ENV_DIR/server $ENV_DIR/data && sudo chown -R www-data:www-data $ENV_DIR"

# 4. Create systemd unit
log_info "Creating systemd unit: $SYSTEMD_UNIT..."
remote "sudo cat > /etc/systemd/system/$SYSTEMD_UNIT.service << 'UNIT_EOF'
[Unit]
Description=Awesome Trip ($ENV)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$ENV_DIR
EnvironmentFile=$ENV_DIR/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT_EOF
sudo systemctl daemon-reload
sudo systemctl enable $SYSTEMD_UNIT"

log_step "Server init complete for $ENV"
log_info "Next steps:"
log_info "  1. Run: make setup-nginx-$ENV SSH_KEY=/path/to/key"
log_info "  2. Run: make deploy-$ENV SSH_KEY=/path/to/key"
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x deploy/scripts/init-server.sh
```

- [ ] **Step 3: Commit**

```bash
git add deploy/scripts/init-server.sh
git commit -m "feat: add server init script for Node.js + nginx + systemd"
```

---

### Task 8: Create Makefile

**Files:**
- Create: `deploy/Makefile`

- [ ] **Step 1: Write deploy/Makefile**

```makefile
# Awesome Trip Deployment
# Usage:
#   make deploy-staging SSH_KEY=~/downloads/my-key.pem
#   make deploy-production SSH_KEY=~/downloads/my-key.pem
#   make init-server ENV=production SSH_KEY=~/downloads/my-key.pem
#   make setup-nginx ENV=staging SSH_KEY=~/downloads/my-key.pem

SSH_KEY ?=
ENV ?=

.PHONY: help deploy-staging deploy-production init-server setup-nginx deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-22s\033[0m %s\n", $$1, $$2}'

deploy-staging: ## Deploy to staging
	@bash scripts/deploy.sh -e staging -k "$(SSH_KEY)"

deploy-production: ## Deploy to production
	@bash scripts/deploy.sh -e production -k "$(SSH_KEY)"

init-server: ## Initialize server (ENV=production|staging|all)
	@[ -n "$(ENV)" ] || (echo "Usage: make init-server ENV=<production|staging|all> SSH_KEY=..." && exit 1)
	@bash scripts/init-server.sh -e "$(ENV)" -k "$(SSH_KEY)"

setup-nginx: ## Configure nginx + SSL for an environment (ENV=production|staging)
	@[ -n "$(ENV)" ] || (echo "Usage: make setup-nginx ENV=<production|staging> SSH_KEY=..." && exit 1)
	@bash nginx/setup-nginx.sh -e "$(ENV)" -k "$(SSH_KEY)"
```

- [ ] **Step 2: Commit**

```bash
git add deploy/Makefile
git commit -m "feat: add Makefile with deploy/init/nginx targets"
```

---

### Task 9: Create README

**Files:**
- Create: `deploy/README.md`

- [ ] **Step 1: Write deploy/README.md**

```markdown
# Awesome Trip Deployment

一键 SSH 部署到腾讯云 Ubuntu 22.04，Nginx + Let's Encrypt SSL，双环境（staging/production）。

## 前置条件

- 本地已安装：Node.js, rsync
- 服务器：腾讯云 Ubuntu 22.04 LTS（4核4G云盘）
- 服务器安全组已开放 80/443 端口
- 已准备腾讯云 SSH 私钥文件（.pem）

## 快速开始

### 1. 配置环境变量

编辑 `envs/production.env` 和 `envs/staging.env`，填入服务器 IP：

```bash
SSH_HOST=123.456.789.0   # 替换为实际 IP
```

### 2. 服务器初始化（仅首次）

```bash
# 初始化 production 环境
make -f deploy/Makefile init-server ENV=production SSH_KEY=~/downloads/my-key.pem

# 或一次初始化两个环境
make -f deploy/Makefile init-server ENV=all SSH_KEY=~/downloads/my-key.pem
```

这会安装 Nginx、Node.js 22、certbot，创建目录和 systemd 服务。

### 3. 配置 Nginx + SSL

先确保 DNS 已解析到服务器 IP。

```bash
make -f deploy/Makefile setup-nginx ENV=production SSH_KEY=~/downloads/my-key.pem
```

这会部署 Nginx 配置、申请 Let's Encrypt 证书。

### 4. 部署

```bash
# 先部署 staging 验证
make -f deploy/Makefile deploy-staging SSH_KEY=~/downloads/my-key.pem

# 确认无误后部署 production
make -f deploy/Makefile deploy-production SSH_KEY=~/downloads/my-key.pem
```

## 目录结构

```
deploy/
├── envs/
│   ├── production.env      # 环境变量（SSH 连接 + 域名 + 端口）
│   └── staging.env
├── nginx/
│   ├── trip.conf.template  # Nginx 配置模板（含 SSL + SPA + API proxy）
│   └── setup-nginx.sh
├── scripts/
│   ├── deploy.sh           # 一键部署入口
│   ├── init-server.sh      # 服务器初始化
│   └── lib.sh              # 公共函数
├── Makefile
└── README.md
```

## 服务器目录

```
/srv/awesome-trip/
├── production/
│   ├── dist/         # Vite 构建产物
│   ├── server/       # Express 服务端
│   ├── data/         # SQLite 数据库
│   ├── node_modules/
│   ├── package.json
│   └── .env          # 运行时环境变量
└── staging/
    └── ... (同上)
```

## 常用操作

```bash
# SSH 进入服务器
ssh -i ~/downloads/my-key.pem root@YOUR_SERVER_IP

# 查看服务状态
sudo systemctl status awesome-trip
sudo systemctl status awesome-trip-staging

# 查看日志
sudo journalctl -u awesome-trip -f
sudo journalctl -u awesome-trip-staging -f

# 手动重启
sudo systemctl restart awesome-trip

# 测试 Nginx 配置
sudo nginx -t && sudo systemctl reload nginx
```
```

- [ ] **Step 2: Commit**

```bash
git add deploy/README.md
git commit -m "docs: add deploy workflow README"
```

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `deploy/` is not tracked by git (`git status` shows clean after `.gitignore` change)
- [ ] All shell scripts are executable (`ls -la deploy/scripts/ deploy/nginx/`)
- [ ] `make -f deploy/Makefile help` prints help text
- [ ] `deploy/envs/production.env` and `staging.env` contain valid variable assignments
- [ ] `trip.conf.template` has valid Nginx syntax placeholders: `{{DOMAIN}}`, `{{ROOT}}`, `{{PORT}}`
