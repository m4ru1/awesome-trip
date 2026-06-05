# 快速开始

本指南帮助你在本地搭建 Awesome Trip 开发环境。

> **[English](QUICKSTART.md)**

## 环境要求

- **Node.js** >= 18（推荐 LTS 版本）
- **npm** >= 9（随 Node.js 附带安装）
- **操作系统**：macOS、Linux 或 Windows (WSL2)

## 安装

```bash
# 1. 克隆仓库
git clone <repo-url> awesome-trip
cd awesome-trip

# 2. 安装依赖
npm install

# 3.（可选）配置环境变量
cp .env.example .env
# 按需修改 .env 中的端口、数据库路径等配置
# 默认值可直接用于本地开发，无需修改
```

## 启动前端

前端是独立的 React 应用，所有行程数据存储在浏览器 localStorage 中，无需后端。

```bash
npm run dev
```

浏览器打开 **http://localhost:5173**。你应该能看到首页，可选择新建行程或使用"京都赏枫"模板开始。

### 验证是否正常运行

1. 开发服务器启动无报错
2. 浏览器显示首页行程卡片
3. 点击 "+" 可创建新行程并进入编辑器
4. 行程数据在刷新浏览器后仍然存在（localStorage）

## 启动后端（可选）

Express 服务器提供行程市场 API，用于发布和浏览共享行程。基本的行程规划不需要后端。

```bash
# 在另一个终端中运行
npm run dev:server
```

服务器默认在 3000 端口启动（可通过 `PORT` 环境变量配置），首次运行会自动创建 SQLite 数据库。

### 全栈模式

同时运行前端和后端：

1. 启动后端：`npm run dev:server`
2. 在另一个终端启动前端：`npm run dev`
3. 前端通过 Vite 代理将 `/api` 请求转发到后端

## 运行测试

```bash
npm run test        # 运行所有测试（约 90 个，约 1 秒）
npm run test:watch  # 开发时监听模式
```

测试套件覆盖：
- 存储服务（封装/读取/写入、完整性校验）
- 导入导出服务（验证、冲突检测、合并）
- 行程库 Hook（CRUD 操作、v1→v2 迁移）

## 生产构建

```bash
# 构建前端
npm run build         # 类型检查 + 打包到 dist/

# 启动生产服务器（同时提供前端和 API）
npm start
```

生产服务器将构建产物作为静态文件提供，API 挂载在 `/api` 路径下。

## 创建第一个行程

1. 在首页点击右上角 **+ 新建** 创建空白行程，或点击 **从模板开始** 使用内置的"京都赏枫"模板
2. 点击行程卡片进入编辑器
3. 在网格视图（桌面端）或时间轴视图（移动端）中点击添加行程块 — 选择类型（景点/餐饮/交通等），设置起止时间，保存
4. 使用 **+ 新建天** 扩展行程天数
5. 通过工具栏切换模式：
   - **规划** — 编辑行程块
   - **预览** — 只读预览
   - **执行** — 逐项打卡

## 常见问题

### `npm install` 原生模块编译失败

如果 `better-sqlite3` 编译失败，请确认已安装 C++ 编译器：
- **macOS**：`xcode-select --install`
- **Linux**：`sudo apt install build-essential`（Debian/Ubuntu）

### 端口 5173 或 3000 被占用

```bash
# 查找占用端口的进程
lsof -i :5173   # 或 :3000

# 终止进程
kill -9 <PID>
```

### 前端无法访问 API

确认后端正在运行（`npm run dev:server`），检查 `.env` 中的 `VITE_API_BASE` 配置。默认值 `/api` 在本地同时运行两个服务时通过 Vite 代理正常工作。

## 下一步

- 阅读 [README.zh-CN.md](README.zh-CN.md) 了解架构详情
- 阅读 [DEPLOY.zh-CN.md](DEPLOY.zh-CN.md) 了解部署流程
- 查看 `.env.example` 了解所有可配置项
