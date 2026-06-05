# 部署指南

Awesome Trip 的服务器部署流程。

> **[English](DEPLOY.md)**

## 服务器架构

```
客户端浏览器
      │
      ▼
┌──────────────┐
│    Nginx     │  SSL 终止、静态文件服务、反向代理
│  (端口 443)  │  /.well-known/ → certbot, /api → Express
└──────┬───────┘
       │ /api
       ▼
┌──────────────┐
│   Express    │  API 服务器（行程市场 CRUD、认证、限流）
│  (端口 3001) │  构建产物作为静态文件兜底
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   SQLite     │  WAL 模式，启动时自动迁移
│  (*.db)      │
└──────────────┘
```

每个环境（staging / production）作为独立的 systemd 服务运行在同一台 Ubuntu 服务器上，通过端口和目录隔离。

## 前置条件

- 一台腾讯云 Ubuntu 22.04 服务器，已配置 SSH 访问
- SSH 密钥已配置在 `~/.ssh/ssh_deploy_trip.pem`
- 本地 `deploy/` 目录中的部署脚本（未入库，仅本地维护）
- 本地已安装 `make` 和 `rsync`

## 部署配置

环境配置文件位于 `deploy/envs/<env>.env`，每个文件定义：

| 变量 | 说明 |
|------|------|
| `SSH_HOST` | 服务器 IP 地址 |
| `SSH_USER` | SSH 用户名（`ubuntu`） |
| `DOMAIN` | 公网域名 / URL 路径 |
| `PORT` | Express 服务器端口（staging: 3002, production: 3001） |
| `SYSTEMD_UNIT` | systemd 服务名称 |
| `ENV_DIR` | 服务器部署目录 |
| `BASE_PATH` | Vite 构建基础路径（子路径部署时使用） |
| `VITE_API_BASE` | 前端 API 基础 URL |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | CORS 允许的来源 |
| `DB_PATH` | 服务器上 SQLite 数据库路径 |

## 首次服务器初始化

每个环境只需执行一次：

```bash
# 初始化服务器（安装 Node.js、创建目录、注册 systemd 服务）
make -f deploy/Makefile init-server ENV=staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem

# 配置 Nginx + SSL 证书
make -f deploy/Makefile setup-nginx ENV=staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
```

## 部署流程

**始终先部署 staging，验证通过后再部署 production。**

### 1. 部署到 staging

```bash
make -f deploy/Makefile deploy-staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
```

脚本执行流程：
1. 本地构建前端（`tsc -b && vite build`）
2. 通过 rsync 同步 `dist/`、`server/`、`package.json`、`package-lock.json`
3. 在服务器上写入运行时 `.env`
4. 在服务器上运行 `npm ci --production`（为 Linux 重新编译 `better-sqlite3`）
5. 重启 systemd 服务
6. 执行健康检查

### 2. 验证 staging

打开 staging 地址，确认：
- 前端正常加载
- 行程创建和编辑功能正常
- 行程市场 API 可响应（如适用）
- 浏览器控制台无报错

### 3. 部署到 production

staging 验证通过后：

```bash
make -f deploy/Makefile deploy-production SSH_KEY=~/.ssh/ssh_deploy_trip.pem
```

### 4. 验证 production

与 staging 相同的检查清单，在 production 地址上验证。

## 故障排除

### 部署后健康检查失败

```bash
# 查看服务日志（最近 50 行）
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo journalctl -u awesome-trip-staging -n 50"

# 查看服务状态
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo systemctl status awesome-trip-staging"
```

### `better-sqlite3` 原生模块不匹配

最常见的部署失败原因。部署脚本已包含 `npm ci` 在服务器上重新编译原生模块的步骤。如果仍然失败：

```bash
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "cd /srv/awesome-trip/staging && npm rebuild better-sqlite3"
```

### Nginx 报错

```bash
# 测试 Nginx 配置语法
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo nginx -t"

# 重新加载 Nginx
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo systemctl reload nginx"
```

### 文件权限错误

部署脚本会将文件所有者设为 `www-data:www-data`。如果权限不正确：

```bash
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP> "sudo chown -R www-data:www-data /srv/awesome-trip/<env>"
```

## 常用命令速查

```bash
# 查看所有可用目标
make -f deploy/Makefile help

# 部署
make -f deploy/Makefile deploy-staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
make -f deploy/Makefile deploy-production SSH_KEY=~/.ssh/ssh_deploy_trip.pem

# 首次初始化
make -f deploy/Makefile init-server ENV=staging SSH_KEY=~/.ssh/ssh_deploy_trip.pem
make -f deploy/Makefile setup-nginx ENV=production SSH_KEY=~/.ssh/ssh_deploy_trip.pem

# SSH 登录服务器
ssh -i ~/.ssh/ssh_deploy_trip.pem ubuntu@<IP>
```
