# Cover SVG Library Design

## Overview

将 trip 封面从简陋 emoji + 渐变背景升级为精美 SVG 插画库。预置 12-16 张旅人手帐线稿风 SVG，支持按主题分类浏览，通过 `coverColor` 参数动态着色。

## Design Decisions

| 决策 | 选择 |
|------|------|
| 插图来源 | 预置精选 SVG 库（非数据驱动生成） |
| 风格 | 精致线稿风，细线条 + 淡彩，旅人手帐美学 |
| 规模 | 初始 12-16 张，架构支持无限扩展 |
| coverColor | 作为 SVG 主色调参数注入，一张图可产生多色变体 |
| 选择时机 | 创建 trip 时选 + TripPanel 随时更换 |
| 选择器形态 | 自适应：初始内联网格，未来可升级分类浮层 |
| 推荐 | 纯手动选择，不自动推荐 |

## Architecture

### Files

```
src/
├── types/index.ts              ← 新增 CoverMeta, CoverCategory, CoverModule
├── components/covers/
│   ├── items/
│   │   ├── autumn-temple.ts     ← 单张封面：meta + svg(accentColor)
│   │   ├── mountain-lake.ts
│   │   ├── city-street.ts
│   │   ├── beach-coast.ts
│   │   ├── cherry-blossom.ts
│   │   └── ... (12-16 files)
│   ├── registry.ts              ← import.meta.glob('./items/*.ts') 自动收集
│   ├── CoverIcon.tsx            ← 统一渲染组件，替换所有 emoji 渲染点
│   └── CoverPicker.tsx          ← 封面选择器网格 + 色调色板
└── components/trip/
    └── TripPanel.tsx            ← 新增"更换封面"入口 → 弹出 Dialog
```

### Data Model

**Trip type changes:**

- `coverEmoji: string` — 保留但标记 deprecated，作为 fallback
- `coverId: string` — 新增，指向 cover registry 中的 id（空字符串表示未迁移）

**New types:**

```typescript
export type CoverCategory = 'city' | 'nature' | 'culture' | 'food' | 'coastal' | 'seasonal'

export interface CoverMeta {
  id: string             // unique id, e.g. "autumn-temple"
  name: string           // Chinese display name
  tags: string[]          // e.g. ["古城", "秋天", "寺庙", "红叶"]
  category: CoverCategory
  defaultColor: string   // this cover's natural accent color, e.g. "#D4753B"
}

export interface CoverModule {
  meta: CoverMeta
  svg: (accentColor: string) => string  // receives coverColor, returns SVG markup
}
```

### CoverPicker Props

```typescript
interface CoverPickerProps {
  selectedId: string       // currently selected cover id
  selectedColor: string    // current accent color
  onSelect: (coverId: string) => void   // called when user picks a cover (also sets color to the cover's defaultColor)
  onColorChange: (color: string) => void // called when user picks a preset color swatch
}
```

CoverPicker is a controlled component — the parent owns `coverId` + `coverColor` state and passes it down. When the user selects a cover, CoverPicker calls `onSelect(id)` AND the parent also sets color to the selected cover's `defaultColor`. The parent is responsible for this two-field update.

### Cover Module Pattern

Each cover is a TS module exporting a default `CoverModule` object (~20 lines):

```typescript
import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'autumn-temple',
    name: '古城秋枫',
    tags: ['古城', '秋天', '寺庙', '红叶'],
    category: 'culture',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <circle cx="40" cy="30" r="8" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M32 44 L28 56 L34 52 L40 56 L46 52 L52 56 L48 44 Z"
            fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`
  },
}

export default cover
```

### Registry (auto-discovery)

```typescript
// src/components/covers/registry.ts
import type { CoverCategory, CoverModule } from '@/types'

const modules = import.meta.glob<{ default: CoverModule }>(
  './items/*.ts', { eager: true }
)

export const coverList: CoverModule[] = Object.values(modules).map(m => m.default)

export const coverMap = new Map<string, CoverModule>(
  coverList.map(c => [c.meta.id, c])
)

// Manual reduce instead of Map.groupBy (ES2024) to stay compatible with ES2020 target
export const coversByCategory = coverList.reduce((map, c) => {
  const arr = map.get(c.meta.category) ?? []
  arr.push(c)
  map.set(c.meta.category, arr)
  return map
}, new Map<CoverCategory, CoverModule[]>())
```

Adding a new cover = create a new `.ts` file in `covers/items/`, no registry edit needed.

**Note:** `import.meta.glob` with `{ eager: true }` loads all cover modules at build time into the initial bundle. This is fine for the planned 12-16 covers (~16-32 KB of SVG strings). If the library grows beyond ~50 covers, switch to `{ eager: false }` (lazy-load on demand) or code-split by category.

### CoverIcon Component

```typescript
interface CoverIconProps {
  coverId: string
  coverColor: string
  size?: number          // default 52; also used at 42 (TopBar), 150 (ShareView watermark)
  className?: string
  style?: React.CSSProperties
}
```

**Behavior:**
1. Look up `coverId` in `coverMap`
2. If found → call `module.svg(coverColor)`, render via `dangerouslySetInnerHTML`
3. If NOT found → fallback to old emoji rendering (backward compat for unmigrated trips)
4. Noto: CSS gradient background is no longer needed when SVG is used — the SVG includes its own background fill

### Replacement Scope

| File | Current | Replace With |
|------|---------|--------------|
| `HomeView.tsx:159` | 52px rounded square + emoji + gradient | `<CoverIcon coverId coverColor size={52} />` |
| `TopBar.tsx:52` | 42px square + emoji + gradient | `<CoverIcon coverId coverColor size={42} />` |
| `TripPanel.tsx:39,68` | Settings header + trip switcher emoji | `<CoverIcon coverId coverColor />` |
| `ShareView.tsx:113,187` | Share card watermark + footer emoji | `<CoverIcon coverId coverColor size={150\|52} />` |
| `MarketplaceView.tsx:167` | Card emoji + hardcoded gradient | `<CoverIcon ... />` (if API returns coverId) |

### CoverPicker Component

Shared component used in two contexts:
1. **TripCreateDialog** — embedded inline in the form, 5-column grid
2. **TripPanel "change cover"** — opens in a small overlay/dialog

Shows all covers from registry as a grid of thumbnail squares. Each thumbnail renders the SVG with a preview accent color. Selected cover has a highlight border. Above the grid, shows the currently selected cover with name and tags.

### Migration Strategy

**Phase 1 (this implementation):**
- Trip type retains `coverEmoji?: string` (deprecated)
- Add `coverId: string` (empty string = unmigrated)
- CoverIcon dual-path: has coverId → SVG, else → emoji fallback
- Seed trip: add `coverId: 'autumn-temple'`, keep `coverEmoji: '🍁'` (rollback safety — if code is reverted, emoji still renders)

**localStorage normalization in `useTripLibrary.loadTrips()`:**

```typescript
function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: Trip) => ({ ...t, coverId: t.coverId ?? '' }))
      }
    }
  } catch { /* ignore */ }
  return []
}
```

This ensures old trips without `coverId` get `''` at load time — the runtime value matches the TypeScript type (`coverId: string`). `coverMap.get('')` returns `undefined`, which falls through to emoji rendering.

**Phase 2 (future):**
- Remove `coverEmoji` from Trip type entirely
- Auto-migrate localStorage trips: map emoji → nearest cover

### Color Customization

Each cover has a `defaultColor` in its meta (e.g., autumn-temple defaults to `#D4753B` warm orange). When the user selects a cover, `coverColor` is automatically set to that cover's `defaultColor`.

Below the cover grid, a row of **6 preset color swatches** lets the user change the accent:

```
预设色调: [橙 #D4753B] [蓝 #4A90D9] [绿 #2A9D8F] [粉 #E8738A] [紫 #8B5CF6] [灰 #6B7280]
```

Each swatch is a small filled circle. The selected swatch has a ring highlight. Tapping a swatch calls `onColorChange(color)`.

No full color picker — the 6 presets cover the range of moods while keeping the line-art style consistent. The presets are the same for all covers (not per-cover), which keeps it simple.

### TripPanel "Change Cover" UX

**Desktop:** Clicking the cover area in the TripPanel header (the gradient bar at the top of the side panel) opens a centered **Dialog** — the same Dialog component style used by TripCreateDialog. The Dialog contains the CoverPicker grid + color swatches. On confirm, `onUpdateTrip({ coverId, coverColor })` is called. On cancel, no changes.

**Mobile:** The TripPanel is already a bottom sheet. The "change cover" action opens a **fullscreen takeover** (since a dialog-on-sheet would feel cramped). Same CoverPicker content, with a top bar ("更换封面" title + close button). Same confirm/cancel pattern.

```
TripPanel (desktop side panel)
  └── header bar with cover area (clickable)
       └── click → Dialog overlay
            └── CoverPicker (grid + color swatches)
                 └── confirm → onUpdateTrip({ coverId, coverColor })

TripPanel (mobile bottom sheet)
  └── header with cover area (clickable)
       └── click → fullscreen takeover
            └── CoverPicker (grid + color swatches)
                 └── confirm → onUpdateTrip({ coverId, coverColor })
```

## SVG Design Specs

- **ViewBox**: `0 0 80 80` (square aspect ratio, scales to any size)
- **Line width**: 1–1.5px for thin, delicate strokes
- **Color usage**: accent color for strokes and fills with varying opacity (`${accent}`, `${accent}99`, `${accent}22`, `${accent}15`)
- **Background**: each SVG includes its own subtle background fill (`${accent}15` or similar), no external CSS gradient needed
- **Style**: travel journal line-art — outline buildings, natural elements, simple geometric textures

### Initial Cover Catalog (12-16)

| id | name | category | defaultColor | tags |
|----|------|----------|-------------|------|
| autumn-temple | 古城秋枫 | culture | #D4753B | 古城, 秋天, 寺庙, 红叶 |
| mountain-lake | 山野湖泊 | nature | #4A90D9 | 远足, 湖泊, 自然 |
| city-street | 城市街巷 | city | #E8734A | 咖啡, 建筑, 街区 |
| beach-coast | 海滩海岸 | coastal | #2A9D8F | 南洋, 潜水, 日落 |
| cherry-blossom | 樱花季 | seasonal | #E8738A | 春天, 赏花, 公园 |
| night-market | 夜市烟火 | food | #F4A261 | 美食, 小吃, 夜市 |
| snow-village | 雪国小镇 | seasonal | #6B7280 | 冬天, 温泉, 雪景 |
| museum-gallery | 博物馆 | culture | #8B5CF6 | 艺术, 展览, 历史 |
| forest-hike | 森林徒步 | nature | #4A7C59 | 登山, 森林, 户外 |
| old-town | 古镇小巷 | culture | #B5653B | 古镇, 石板路, 老建筑 |
| modern-skyline | 都市天际 | city | #4A6FA5 | 夜景, 摩登, 购物 |
| tropical-island | 热带海岛 | coastal | #1E8A7E | 海岛, 浮潜, 椰林 |
| tea-garden | 茶山竹海 | nature | #6B8E4A | 茶园, 竹林, 宁静 |
| temple-shrine | 神社鸟居 | culture | #D4483B | 参拜, 鸟居, 祈福 |
| canal-bridge | 小桥流水 | city | #5B8C9E | 运河, 桥梁, 水乡 |
| market-bazaar | 集市巴扎 | food | #C4784A | 集市, 当地, 手工艺 |

### Preset Color Swatches

The 6 accent colors available to all covers:

| color | hex | mood |
|-------|-----|------|
| 暖橙 | #D4753B | 温暖、秋日、美食 |
| 天蓝 | #4A90D9 | 清新、自然、海洋 |
| 松绿 | #2A9D8F | 宁静、森林、海岸 |
| 樱粉 | #E8738A | 春日、浪漫、赏花 |
| 暮紫 | #8B5CF6 | 艺术、神秘、都市夜 |
| 岩灰 | #6B7280 | 冬季、现代、简约 |

## Implementation Notes

- No new dependencies required — SVGs are inline strings, no SVG loader or plugin needed
- `dangerouslySetInnerHTML` is safe here because SVG strings are static module exports, not user input
- CoverIcon should use `React.memo` since it renders frequently in lists
- The `import.meta.glob` pattern requires Vite (already the build tool)
- `coverColor` defaults to the selected cover's `defaultColor` for new trips
- When `coverColor` changes, CoverIcon calls `module.svg(newColor)` producing a new HTML string. React replaces the entire `innerHTML`, which is a full DOM teardown/rebuild of the SVG subtree. For an 80×80 icon this is imperceptible. `React.memo` prevents unnecessary re-renders when props haven't changed.
- `coversByCategory` in registry is computed for future use (category-filtered CoverPicker when library grows). Not consumed in Phase 1 CoverPicker (which shows a flat grid).
