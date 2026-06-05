# Awesome Trip

一款可视化旅行规划工具，帮助你按天编排行程。创建行程、安排景点/餐饮/交通，轻松导出或分享你的旅行计划。

**[快速开始](QUICKSTART.zh-CN.md)** | **[Quick Start](QUICKSTART.md)** | **[部署指南](DEPLOY.zh-CN.md)** | **[Deploy Guide](DEPLOY.md)**

---

## 功能特性

- **多行程管理** — 在行程库中创建、复制和管理多个旅行计划
- **按天规划** — 为景点、餐饮、休息、交通和自由活动添加定时行程块
- **三种模式** — 规划（编辑）、预览（只读）、执行（逐项打卡）
- **冲突检测** — 自动标记时间段重叠的行程块
- **行程市场** — 发布行程模板供社区浏览，也可以 fork 他人行程
- **导出导入** — 以 `.ajourney` 格式导出行程，支持冲突感知的导入与合并
- **响应式设计** — 桌面端日历网格视图 + 移动端时间轴视图

## 架构概览

```
┌─────────────────────────────────────────────┐
│  前端 (React 19 + TypeScript + Tailwind)     │
│  ┌─────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ 首页    │ │  行程      │ │  行程市场   │ │
│  │ 行程库  │ │  编辑器    │ │  浏览器     │ │
│  └─────────┘ └────────────┘ └─────────────┘ │
│       状态管理: App.tsx (纯 Props 驱动)       │
│       数据存储: localStorage (v2 封装格式)    │
└──────────────────┬──────────────────────────┘
                   │ /api
┌──────────────────▼──────────────────────────┐
│  后端 (Express 5 + better-sqlite3)           │
│  ┌────────────────┐ ┌─────────────────────┐ │
│  │ 行程市场 API   │ │  认证 & 限流        │ │
│  │ (CRUD + 分享)  │ │  中间件             │ │
│  └────────────────┘ └─────────────────────┘ │
       数据库: SQLite (WAL 模式)              │
└──────────────────────────────────────────────┘
```

前端可完全独立运行——所有行程数据存储在浏览器 localStorage 中。后端仅在需要行程市场功能（发布和浏览共享行程）时使用。

## 快速开始

完整指南请参阅 **[QUICKSTART.zh-CN.md](QUICKSTART.zh-CN.md)**。最简启动方式：

```bash
git clone <repo-url> awesome-trip && cd awesome-trip
npm install
npm run dev        # → http://localhost:5173
```

## 开发

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（HMR） |
| `npm run dev:server` | 启动 Express API 服务器（热重载） |
| `npm run build` | 类型检查 + 生产构建到 `dist/` |
| `npm start` | 启动 Express 服务器（提供构建产物 + API） |
| `npm run test` | 运行测试套件（Vitest + jsdom） |
| `npm run test:watch` | 监听模式运行测试 |
| `npx tsc --noEmit` | 仅类型检查 |

### 环境变量

将 `.env.example` 复制为 `.env` 并按需修改。所有变量均有本地开发的默认值，详见 `.env.example`。

主要变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | Express 服务器端口 |
| `ALLOWED_ORIGINS` | *(空)* | CORS 允许的来源（逗号分隔；空 = 允许所有） |
| `DB_PATH` | `./data/marketplace.db` | SQLite 数据库路径 |

前端变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE` | `/api` | API 基础 URL |

### 项目结构

```
src/
├── App.tsx                    # 中央状态管理、视图路由、CRUD 回调
├── types/index.ts             # TypeScript 类型定义 (Trip, Day, Block, Option …)
├── hooks/useTripLibrary.ts    # 多行程 CRUD、localStorage 持久化、导入导出
├── services/                  # 存储封装、导出、导入逻辑
├── components/
│   ├── home/                  # 首页（行程库卡片）
│   ├── editor/                # 行程块编辑器弹窗
│   ├── grid/                  # 日程网格视图（桌面端）
│   ├── timeline/              # 日程时间轴（移动端）
│   ├── panels/                # 详情抽屉/底部面板
│   └── settings/              # 设置、导出弹窗、导入弹窗
├── data/                      # 种子数据、常量、元数据
└── utils/                     # 时间工具函数、日程级别转换
server/
├── index.ts                   # Express 入口
├── config.ts                  # 基于环境变量的配置
├── db.ts                      # SQLite 初始化 + 迁移
├── routes/marketplace.ts      # 行程市场 API 端点
└── middleware/                 # 认证、限流、参数校验
```

### Git 工作流

所有开发在功能分支上进行，不直接提交到 `main`：

```bash
git checkout -b feature/<name>   # 或 fix/<name>
# ... 修改、提交 ...
git checkout main && git merge <branch>
```

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：`feat:`、`fix:`、`docs:`、`chore:` 等。

### 测试

测试套件使用 Vitest + jsdom + React Testing Library：

```bash
npm run test        # 运行所有测试（约 90 个，约 1 秒）
npm run test:watch  # 开发时监听模式
```

测试文件位于对应代码的 `__tests__/` 目录中。

## 部署

完整部署指南（包括 staging、production 和故障排除）请参阅 **[DEPLOY.zh-CN.md](DEPLOY.zh-CN.md)**。

## 许可证

Copyright (c) 2024-2026 mora. 保留所有权利。详见 [LICENSE](LICENSE)。

---

**[English Documentation](README.md)**
