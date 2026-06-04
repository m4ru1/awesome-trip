# 快速开始

一分钟内在本地启动 Awesome Trip。

## 环境要求

- **Node.js** >= 18
- **npm** >= 9

## 安装启动

```bash
# 1. 克隆并安装依赖
git clone <repo-url> awesome-trip
cd awesome-trip
npm install

# 2. 启动开发服务器
npm run dev
```

浏览器打开 **http://localhost:5173**。

## 创建第一个行程

1. 点击右上角 **+ 新建** 创建行程，或点击 **从模板开始** 使用"京都赏枫"模板
2. 点击行程卡片进入编辑器
3. 在网格中点击某一天的空格添加行程块 — 选择类型（景点/餐饮/交通等），设置时间，保存
4. 使用 **+ 新建天** 增加更多天数
5. 切换模式：**规划**（编辑）、**预览**（只读）、**执行**（打卡）

## 运行测试

```bash
npm run test          # 90 个测试，约 1 秒
npm run test:watch    # 开发时监听模式
```

## 生产构建

```bash
npm run build         # 输出到 dist/
npm start             # 启动 Express 服务器
```

## 后端（可选）

Express API 服务支持市场发布和浏览功能：

```bash
npm run dev:server    # 热重载启动（端口 3000）
```

如果不需要市场功能，前端可完全独立运行 — 所有行程数据存储在 localStorage 中。

## 部署

完整部署流程见 `CLAUDE.md`（先 staging 验证，再 production）。

## 下一步

- 阅读 `CLAUDE.md` 了解架构细节和 Git 工作流
- 查看 `docs/superpowers/specs/` 了解功能设计文档
- 通过 **设置 → 导出行程** 导出备份，分享 `.ajourney` 文件
