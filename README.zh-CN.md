# Awesome Trip · 旅行课程表

一款面向旅行者的可视化行程规划工具。按天编排行程，追踪景点、餐饮、交通，支持导出备份和分享。

## 功能

- **多行程管理** — 创建、复制、管理多个旅行计划
- **按天规划** — 添加行程块（景点、餐饮、休息、交通、自由活动），设置起止时间
- **三面板轮播** — 移动端流畅滑动切换天数，无抖动
- **时间网格视图** — 桌面端日历式时间轴布局
- **行程块编辑器** — 丰富的编辑能力：主选项、备选方案、交通接驳、冲突检测
- **三种模式** — 规划（编辑）、预览（只读）、执行（打卡）
- **市场** — 浏览和 Fork 社区发布的行程模板
- **存储 V2** — 自动 v1→v2 迁移，双 key 备份，完整性校验
- **导出/导入** — JSON 导出（`.ajourney` 格式），冲突检测导入，支持 Fork 合并
- **响应式** — 桌面网格视图、移动端时间线、自适应布局

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript, Tailwind CSS 4, Motion (Framer) |
| 构建 | Vite 8 |
| 后端 | Express 5, better-sqlite3 |
| 测试 | Vitest, @testing-library/react, jsdom |
| 存储 | localStorage（v2 StorageEnvelope，双 key 备份） |

## 命令

```bash
npm run dev          # 启动开发服务器（Vite HMR，localhost:5173）
npm run dev:server   # 启动 Express API 服务
npm run build        # 类型检查 + 生产构建
npm run test         # 运行 90 个测试（4 个套件）
npm run test:watch   # 监听模式
npm start            # 生产环境启动
```

## 项目结构

```
src/
├── App.tsx                   # 中心状态管理，视图路由
├── types/index.ts            # TypeScript 类型定义
├── hooks/
│   ├── useTripLibrary.ts     # 多行程 CRUD，v1→v2 迁移，导出/导入
│   └── __tests__/            # Hook 测试（23 个）
├── services/
│   ├── storage.ts            # StorageEnvelope 封装/读写/完整性校验
│   ├── export.ts             # ExportEnvelope 构建、文件名清洗、JSON 下载
│   ├── import.ts             # 信封校验、冲突检测、导入合并
│   └── __tests__/            # Service 测试（59 个）
├── components/
│   ├── editor/               # BlockEditor 编辑弹窗
│   ├── grid/                 # ScheduleGrid 桌面日历视图
│   ├── timeline/             # DayTimeline 移动端时间线
│   ├── panels/               # DetailContent 详情抽屉/底部弹出
│   ├── home/                 # HomeView 行程卡片列表
│   └── settings/             # SettingsPanel、ExportDialog、ImportDialog
├── data/
│   ├── seed.ts               # 种子行程模板（"京都赏枫5日"）
│   └── constants.ts          # 类型元数据、天气预设、APP_VERSION
└── utils/
    ├── transforms.ts         # Day 级操作：排序、冲突检测
    └── time.ts               # 时间工具函数
```

## 设计文档

功能设计文档位于 `docs/superpowers/specs/`。开发新功能前请先阅读相关设计文档。

## 许可证

私有项目。
