# Deploy Workflow Design

## Overview

为 awesome-trip 项目建立一键 SSH 部署工作流，部署到腾讯云 Ubuntu 22.04 服务器，Nginx 反向代理 + Let's Encrypt SSL，支持 staging/production 双环境。

## Directory Structure

```
deploy/
├── envs/
│   ├── production.env
│   └── staging.env
├── nginx/
│   ├── trip.conf.template
│   └── setup-nginx.sh
├── scripts/
│   ├── deploy.sh
│   ├── init-server.sh
│   └── lib.sh
├── Makefile
└── README.md
```

`deploy/` 在 `.gitignore` 中排除（但保留结构模板或通过 README 说明）。

## Environments

| 环境 | 子域名 | 端口 | systemd unit | 服务器目录 |
|------|--------|------|-------------|-----------|
| production | `trip.mollia.space` | 3001 | `awesome-trip.service` | `/srv/awesome-trip/production/` |
| staging | `staging.trip.mollia.space` | 3002 | `awesome-trip-staging.service` | `/srv/awesome-trip/staging/` |

## SSH Authentication

- 使用腾讯云下载的私钥文件，通过 `SSH_KEY` 环境变量或 Makefile 参数传入
- 脚本中所有 `ssh`/`rsync` 命令使用 `-i "$SSH_KEY"` 指定私钥
- 服务器 IP/用户通过环境变量 `SSH_HOST`、`SSH_USER` 配置，默认 `root`

## Deployment Flow (deploy.sh)

1. 校验必需变量（`SSH_KEY`、`SSH_HOST`、`ENV`）
2. 加载对应 `envs/<env>.env`
3. 本地执行 `npm run build`（type-check + vite build）
4. rsync `dist/`、`server/`、`package.json`、`package-lock.json` 到服务器对应环境目录（排除 `node_modules`）
5. SSH 远程：`npm ci --production`（Linux 环境下编译 native 模块）
6. SSH 远程：`sudo systemctl restart <unit>`
7. 健康检查：curl 本地端口确认服务启动

## init-server.sh

首次服务器初始化，幂等可重复执行：

1. `apt update && apt install -y nginx certbot python3-certbot-nginx`
2. 安装 Node.js 22 LTS（通过 NodeSource）
3. 创建目录 `/srv/awesome-trip/production/` 和 `/srv/awesome-trip/staging/`
4. 创建 systemd unit 文件（两个环境各一个）
5. 部署 Nginx 配置模板，替换 `{{DOMAIN}}`/`{{PORT}}` 占位符
6. certbot 获取 SSL 证书
7. 启动并 enable systemd units

## Nginx Configuration

单模板文件，通过 `sed` 替换占位符生成两个环境的配置：

- 静态文件：`location /` 直接 serve `/srv/awesome-trip/<env>/dist/`
- API：`location /api/` 反向代理到 `http://127.0.0.1:<port>`
- SPA fallback：非文件请求 → `try_files $uri /index.html`
- SSL：certbot 自动管理，HTTP → HTTPS 重定向

## systemd Units

```
[Unit]
Description=Awesome Trip (<env>)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/srv/awesome-trip/<env>
EnvironmentFile=/srv/awesome-trip/<env>/.env
ExecStart=/usr/bin/node server/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Environment Variables

`envs/production.env` 和 `envs/staging.env` 定义部署参数：

```
SSH_HOST=<服务器IP>
SSH_USER=root
DOMAIN=trip.mollia.space
PORT=3001
# 传递给 Node 进程的环境变量
NODE_ENV=production
ALLOWED_ORIGINS=https://trip.mollia.space
DB_PATH=/srv/awesome-trip/production/data/marketplace.db
```

## Build Notes

- `better-sqlite3` 是 native 模块，必须服务器端编译
- rsync 排除 `node_modules`，服务器端用 `npm ci --production` 重新安装
- 服务器端只需生产依赖（不含 devDependencies），节省磁盘和安装时间

## Verification

- `make deploy-staging` 后再 `make deploy-production` 验证双环境独立运行
- 浏览器访问 `https://trip.mollia.space` 和 `https://staging.trip.mollia.space` 确认正常
- `sudo systemctl status awesome-trip` 检查服务状态
