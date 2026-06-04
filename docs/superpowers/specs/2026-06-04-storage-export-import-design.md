# Trip 本地存储管理与导出迁移 — 设计方案

**日期**: 2026-06-04
**状态**: 等待审核
**阶段**: Phase 1 = JSON 导出/导入 + 存储管理；Phase 2 = Markdown 导出

---

## 1. 架构总览

```
App.tsx (state owner)
  └── useTripLibrary.ts  ← 唯一公开 API，拥有所有 key 名和持久化逻辑
        ├── storage.ts   ← 纯函数：envelope 包装/解包、完整性校验、容量计算
        ├── export.ts    ← 纯函数：序列化为 JSON、生成文件名
        └── import.ts    ← 纯函数：JSON 解析、Schema 校验、冲突检测
```

**核心原则**：`useTripLibrary` 是持久化的唯一入口。不创建与之平行的 service 层。storage/export/import 三个模块是内部纯函数，由 hook 导入并编排。外部组件只通过 hook 返回值与持久化交互。

---

## 2. 数据完整性层 (`src/services/storage.ts`)

### 2.1 存储格式升级 v1 → v2

Key 从 `tt_trips_v1` 升级到 `tt_trips_v2`。数据包装在 Envelope 中：

```ts
// src/types/index.ts 新增
interface StorageEnvelope {
  version: number          // 当前 = 2，runtime 检查而非字面量类型
  savedAt: number          // Date.now()
  tripCount: number        // trips.length，用于截断检测
  trips: Trip[]
}
```

**不使用 SHA-256 异步哈希**。威胁模型是数据损坏（截断、部分写入、JSON 解析失败），不是恶意篡改。同步完整性检查方案：

1. `JSON.parse` 成功（不抛异常）
2. `envelope.version` 是已知版本号
3. `Array.isArray(envelope.trips)` 为 true
4. `envelope.trips.length === envelope.tripCount`
5. 每个 trip 有必需的 `id`、`title`、`days` 字段

### 2.2 双 key 写策略

- **主 key**：`tt_trips_v2` — 读取时从此 key 加载
- **备份 key**：`tt_trips_backup_v2` — 每次成功写入主 key 后，同步写入相同数据

写入流程：
```
1. 构建 StorageEnvelope
2. localStorage.setItem('tt_trips_v2', JSON.stringify(envelope))
3. 如果步骤 2 成功 → localStorage.setItem('tt_trips_backup_v2', 同数据)
```

### 2.3 读取与自动恢复

```
1. 读取 tt_trips_v2
2. JSON.parse → 成功？→ 完整性校验通过？→ 返回 trips
3. 任一失败 → 读取 tt_trips_backup_v2
4. 解析 + 校验通过？→ 用 backup 数据恢复主 key → 返回 trips
5. 两者都失败 → 返回 []，通知用户数据已损坏
```

### 2.4 v1 → v2 自动迁移

`useTripLibrary` 初始化时检测：
- `tt_trips_v1` 存在 且 `tt_trips_v2` 不存在 → 读取 v1 数据，包装为 v2 Envelope，写入 v2 主 key + backup key
- v1 key 保留不删除（保留逃生通道）
- `tt_active_trip_v1` 同样处理，升级到 `tt_active_trip_v2`

### 2.5 容量监控

```ts
interface StorageStats {
  usedBytes: number
  tripCount: number
  tripSizes: { id: string; title: string; bytes: number }[]
}
```

- `getStorageStats()`：遍历所有 localStorage key，统计 `tt_*` 前缀的占用
- 容量估算基于 `JSON.stringify(value).length * 2`（UTF-16 编码），这是 localStorage 的实际编码
- 在 UI 中以参考信息展示，不做硬限制断言（浏览器配额各异）
- 导出文件大小与存储占用不同（UTF-8 vs UTF-16），UI 不做换算

### 2.6 公开方法（由 useTripLibrary 暴露）

```ts
verifyIntegrity(): { ok: boolean; error?: string }
getStorageStats(): StorageStats
clearAllData(): void   // 清除所有 tt_* 前缀的 key，调用前二次确认
```

---

## 3. 导出模块 (`src/services/export.ts`)

### 3.1 JSON 导出格式

```ts
// src/types/index.ts 新增
interface ExportEnvelope {
  appVersion: string         // 从 package.json 或硬编码版本号
  exportedAt: number         // Date.now()
  trips: Trip[]              // 选中的 trip(s)
  tripCount: number          // trips.length
}
```

文件扩展名 `.ajourney`，实际内容为 `JSON.stringify(ExportEnvelope, null, 2)`（pretty-printed，方便 git diff）。

文件命名：`行程名-日期.ajourney`，例如 `京都赏枫5日-20260604.ajourney`；多 trip 导出用 `全部行程-20260604.ajourney`。

### 3.2 下载触发方式

纯浏览器 API，不引入 `file-saver` 等依赖：

```ts
function downloadJSON(envelope: ExportEnvelope, filename: string) {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

### 3.3 导出范围

- 当前行程 / 全部行程
- 全部行程导出时，`ExportEnvelope.trips` 包含所有 trip
- 导出不包含发布元数据（`tt_published_v1`、`tt_remix_*`），仅导出 trip 数据本身

### 3.4 Phase 2: Markdown 导出（本 spec 记录，延后实现）

Markdown 格式示例：

```markdown
# 🍁 京都赏枫5日
**日期:** 11/14 – 11/18 | **2人 · 情侣**

## Day 1 · 11/14 周五 ☀️ 15°C

| 时间 | 类型 | 内容 |
|------|------|------|
| 09:00–11:30 | 🏯 景点 | 清水寺 · ¥400 |
| 12:00–13:00 | 🍜 美食 | 一兰拉面 · ¥80/人 |
| 13:15–14:00 | 🚇 地铁 | → 伏见稻荷 (15min) |
...
```

需要特殊处理：
- `endTime: '次日'` 渲染为 "次日"
- `transportToNext` 渲染为行间分隔符
- `alternatives` 折叠显示或标注 "备选: ..."
- 对全部 trip 导出，生成多文件后用单个归档文件提供下载

---

## 4. 导入模块 (`src/services/import.ts`)

### 4.1 导入流程

```
FileReader 读取文件
  → JSON.parse
  → Schema 校验（验证 ExportEnvelope 结构）
  → 提取 trips[]
  → 逐 trip 校验必填字段
  → 冲突检测（按 trip.id 匹配现有 trips）
  → 返回 ImportPreview 给 UI 展示
  → 用户决策每项冲突
  → 原子写入
```

### 4.2 Schema 校验

```ts
function validateEnvelope(data: unknown): data is ExportEnvelope {
  // 检查: data 是对象
  // 检查: appVersion 是 string
  // 检查: exportedAt 是 number
  // 检查: trips 是数组且长度 > 0
  // 检查: tripCount === trips.length
  // 检查: 每个 trip 有 id (string), title (string), days (array)
}
```

校验失败 → 返回 `{ ok: false, error: "具体错误描述" }`。

### 4.3 冲突检测

按 `trip.id` 匹配现有的 trips 列表：

```ts
type ImportStatus = 'new' | 'conflict'

interface ImportPreviewItem {
  importTrip: Trip
  status: ImportStatus
  existingTrip?: Trip        // 冲突时存在
  existingModifiedAt?: number // 本地版本的 last modified（如果可获取）
}

interface ImportPreview {
  items: ImportPreviewItem[]
  newCount: number
  conflictCount: number
}
```

### 4.4 冲突解决 UI

`ImportDialog` 展示 `ImportPreview` 列表：

- **新行程**：绿色标记 "将新增"，无需操作
- **冲突行程**：黄色标记，显示 [导入版标题] [本地版标题]，默认选中 "保留两者"（给新 ID），可选 "覆盖本地"

### 4.5 原子写入策略

1. 将当前完整的 `trips` 数组写入 `tt_trips_backup_v2`（覆盖标准备份）
2. 构建新的 `trips` 数组：
   - new 项直接 push
   - conflict + "保留两者" → fork（新 ID）后 push
   - conflict + "覆盖" → 替换原位置的 trip
3. 将新数组包装为 `StorageEnvelope`，写入 `tt_trips_v2`
4. 写入成功后，更新 `tt_trips_backup_v2`
5. `useTripLibrary` 的 React state 通过 `setTrips(newTrips)` 同步更新
6. 如果当前活跃 trip 是被覆盖的 trip，重新从新数组加载活跃 trip 的 state

如果步骤 3 抛出 `QuotaExceededError`：
- 主 key 保持未修改状态（步骤 3 失败则不写入）
- 通知用户：容量不足，建议清理后重试
- backup key 仍保留导入前的数据

### 4.6 导入流程中的 React 状态同步

关键时序问题：用户正在编辑 trip A，然后导入了一个覆盖 trip A 的文件。

- 导入操作直接调用 `setTrips(newTrips)` 更新 trips 列表
- 如果活跃 trip 被覆盖/替换，调用 `setTrip(reloadFromNewTrips(activeTripId))` 强制刷新
- 导入期间的 autosave（useEffect）不会干扰，因为 trips state 已更新为包含导入数据的新数组

---

## 5. UI 设计

### 5.1 入口

Home 页面右上角添加齿轮图标 ⚙，点击打开 `SettingsPanel`（overlay 模式，与 `HelpOverlay` 一致）。

App.tsx 新增状态：`const [showSettings, setShowSettings] = useState(false)`

### 5.2 SettingsPanel

遵循 `HelpOverlay` 的 full-screen overlay + backdrop 模式。

内容布局：

```
┌─────────────────────────────────┐
│ 设置                          ✕ │
├─────────────────────────────────┤
│                                 │
│ 💾 存储空间                     │
│ ████████████░░░░░░ 12.3 KB     │
│ 共 3 个行程                     │
│                                 │
│ 行程明细：                      │
│ 🍁 京都赏枫5日      4.2 KB     │
│ 🗼 东京3日          3.1 KB     │
│ 🏖 沖縄度假         5.0 KB     │
│                                 │
│ 🔍 验证数据完整性  [检查]  ✓    │
│                                 │
│ 📥 导出行程         [导出]      │
│ 📤 导入行程         [导入]      │
│ 🗑 清除全部数据     [清除]      │
│                                 │
└─────────────────────────────────┘
```

### 5.3 ExportDialog

Modal dialog，内容：

- 范围选择：radio [当前行程] [全部行程 (N个)]
- 格式选择：Phase 1 仅 JSON；Phase 2 增加 Markdown
- [下载] 按钮 → 触发浏览器下载

### 5.4 ImportDialog

两阶段 modal：

**阶段 1 — 文件选择**：
- 拖拽区域或 [选择文件] 按钮，accept=".ajourney,.json"
- 文件读取后展示预览：发现 N 个行程，其中 M 个新行程，K 个冲突

**阶段 2 — 冲突解决**（仅当有冲突时）：
- 冲突列表，每项默认 "保留两者"
- [确认导入] 按钮 → 执行写入

### 5.5 容量预警

不在 Settings 面板之外展示 banner。当前数据量（3-5 个纯文本 trip）远不到需要持续监控的程度。

`getStorageStats()` 在 SettingsPanel 打开时调用一次。如果 >80% 使用率，面板内显示黄色提示。如果写入时抛 `QuotaExceededError`，当场弹错误 toast。

---

## 6. useTripLibrary 重构

### 6.1 变更概览

```
当前 (84 行):
  - 硬编码 key 名 tt_trips_v1 / tt_active_trip_v1
  - 同步 loadTrips / saveTrips
  - CRUD: saveTrip, createTrip, deleteTrip, getTrip
  - 返回: { trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip, getTrip, setTrips }

重构后 (~150 行):
  - 硬编码 key 名 tt_trips_v2 / tt_active_trip_v2 / tt_trips_backup_v2
  - v1 → v2 自动迁移逻辑
  - 同步 load/save（不变，不引入异步）
  - 原有 CRUD 保持不变
  - 新增: exportTripsJSON, importTripsJSON, resolveImportConflicts,
          getStorageStats, verifyIntegrity, clearAllData
  - 返回原有字段 + 新增字段
```

### 6.2 Key 常量

```ts
const TRIPS_KEY = 'tt_trips_v2'
const TRIPS_BACKUP_KEY = 'tt_trips_backup_v2'
const ACTIVE_KEY = 'tt_active_trip_v2'
const LEGACY_TRIPS_KEY = 'tt_trips_v1'
const LEGACY_ACTIVE_KEY = 'tt_active_trip_v1'
```

### 6.3 初始化流程

```ts
function loadTrips(): Trip[] {
  // 1. 尝试 v2 主 key
  let envelope = readEnvelope(TRIPS_KEY)
  if (envelope && verifyIntegrity(envelope)) return envelope.trips

  // 2. 尝试 v2 backup key
  envelope = readEnvelope(TRIPS_BACKUP_KEY)
  if (envelope && verifyIntegrity(envelope)) {
    writeEnvelope(TRIPS_KEY, envelope)  // 恢复主 key
    return envelope.trips
  }

  // 3. 尝试 v1 迁移
  const legacy = readLegacy(LEGACY_TRIPS_KEY)
  if (legacy) {
    writeEnvelope(TRIPS_KEY, wrapV2(legacy))
    writeEnvelope(TRIPS_BACKUP_KEY, wrapV2(legacy))
    return legacy
  }

  return []
}
```

---

## 7. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `src/services/storage.ts` | envelope 包装/解包、完整性校验、容量计算 |
| 新增 | `src/services/export.ts` | JSON 序列化、文件名生成、下载触发 |
| 新增 | `src/services/import.ts` | JSON 解析、Schema 校验、冲突检测 |
| 新增 | `src/components/settings/SettingsPanel.tsx` | 设置面板 overlay |
| 新增 | `src/components/settings/ExportDialog.tsx` | 导出选项 modal |
| 新增 | `src/components/settings/ImportDialog.tsx` | 导入 + 冲突解决 modal |
| 修改 | `src/hooks/useTripLibrary.ts` | 重构为 v2 + 新增 export/import/stats API |
| 修改 | `src/types/index.ts` | 新增 StorageEnvelope, ExportEnvelope, StorageStats 等类型 |
| 修改 | `src/App.tsx` | 新增 showSettings 状态 + SettingsPanel 渲染 |
| 修改 | `src/components/home/HomeView.tsx` | 新增齿轮图标入口 |

---

## 8. 设计决策记录

| 决策 | 选择 | 变更自初版 | 理由 |
|------|------|-----------|------|
| 完整性校验 | 同步 tripCount + 结构校验 | 原 SHA-256 | 威胁模型是损坏非篡改，避免 async 污染 |
| 架构模式 | 扩展 useTripLibrary | 原独立 services/ 层 | 避免 key 名重复和状态同步问题 |
| Markdown 导出 | Phase 2 延后 | 原 Phase 1 | JSON 已覆盖备份/迁移需求，Markdown 工作量大 |
| 备份 key 数量 | 1 个 (`tt_trips_backup_v2`) | 原 3 个 | 导入前复用标准 backup key |
| 设置入口 | Overlay 模式 | 原"齿轮图标"（未指定模式） | 遵循 HelpOverlay 模式，不新增 top-level view |
| 容量预警 | Settings 面板内 | 原全局 banner | 当前数据量不需要持续监控 |
| 存储引擎 | localStorage | 不变 | 数据量小，无需 IndexedDB |
| 依赖 | 零新增 | 不变 | 全部浏览器原生 API |

---

## 9. 未纳入范围（明确排除）

- 跨 tab 同步（当前代码库已有此限制，不做改善）
- 云端同步/备份（marketplace 已有 publish 机制，不与此设计整合）
- IndexedDB 迁移
- 图片/附件导出（当前无图片存储）
- 发布元数据导出（tt_published_v1, tt_remix_* 属于运行时状态而非用户数据）
