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
│   └── CoverIcon.tsx            ← 统一渲染组件，替换所有 emoji 渲染点
├── components/home/
│   └── CoverPicker.tsx          ← 封面选择器网格（内联在 TripCreateDialog 中）
└── components/trip/
    └── TripPanel.tsx            ← 新增"更换封面"入口
```

### Data Model

**Trip type changes:**

- `coverEmoji: string` — 保留但标记 deprecated，作为 fallback
- `coverId: string` — 新增，指向 cover registry 中的 id（空字符串表示未迁移）

**New types:**

```typescript
export type CoverCategory = 'city' | 'nature' | 'culture' | 'food' | 'coastal' | 'seasonal'

export interface CoverMeta {
  id: string          // unique id, e.g. "autumn-temple"
  name: string        // Chinese display name
  tags: string[]       // e.g. ["古城", "秋天", "寺庙", "红叶"]
  category: CoverCategory
}

export interface CoverModule {
  meta: CoverMeta
  svg: (accentColor: string) => string  // receives coverColor, returns SVG markup
}
```

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
import type { CoverModule } from '@/types'

const modules = import.meta.glob<{ default: CoverModule }>(
  './items/*.ts', { eager: true }
)

export const coverList: CoverModule[] = Object.values(modules).map(m => m.default)

export const coverMap = new Map<string, CoverModule>(
  coverList.map(c => [c.meta.id, c])
)

export const coversByCategory = Map.groupBy(coverList, c => c.meta.category)
```

Adding a new cover = create a new `.ts` file in `covers/items/`, no registry edit needed.

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
- Seed trip: `coverId: 'autumn-temple'`, no more `coverEmoji: '🍁'`

**Phase 2 (future):**
- Remove `coverEmoji` from Trip type entirely
- Auto-migrate localStorage trips: map emoji → nearest cover

## SVG Design Specs

- **ViewBox**: `0 0 80 80` (square aspect ratio, scales to any size)
- **Line width**: 1–1.5px for thin, delicate strokes
- **Color usage**: accent color for strokes and fills with varying opacity (`${accent}`, `${accent}99`, `${accent}22`, `${accent}15`)
- **Background**: each SVG includes its own subtle background fill (`${accent}15` or similar), no external CSS gradient needed
- **Style**: travel journal line-art — outline buildings, natural elements, simple geometric textures

### Initial Cover Catalog (12-16)

| id | name | category | tags |
|----|------|----------|------|
| autumn-temple | 古城秋枫 | culture | 古城, 秋天, 寺庙, 红叶 |
| mountain-lake | 山野湖泊 | nature | 远足, 湖泊, 自然 |
| city-street | 城市街巷 | city | 咖啡, 建筑, 街区 |
| beach-coast | 海滩海岸 | coastal | 南洋, 潜水, 日落 |
| cherry-blossom | 樱花季 | seasonal | 春天, 赏花, 公园 |
| night-market | 夜市烟火 | food | 美食, 小吃, 夜市 |
| snow-village | 雪国小镇 | seasonal | 冬天, 温泉, 雪景 |
| museum-gallery | 博物馆 | culture | 艺术, 展览, 历史 |
| forest-hike | 森林徒步 | nature | 登山, 森林, 户外 |
| old-town | 古镇小巷 | culture | 古镇, 石板路, 老建筑 |
| modern-skyline | 都市天际 | city | 夜景, 摩登, 购物 |
| tropical-island | 热带海岛 | coastal | 海岛, 浮潜, 椰林 |
| tea-garden | 茶山竹海 | nature | 茶园, 竹林, 宁静 |
| temple-shrine | 神社鸟居 | culture | 参拜, 鸟居, 祈福 |
| canal-bridge | 小桥流水 | city | 运河, 桥梁, 水乡 |
| market-bazaar | 集市巴扎 | food | 集市, 当地, 手工艺 |

## Implementation Notes

- No new dependencies required — SVGs are inline strings, no SVG loader or plugin needed
- `dangerouslySetInnerHTML` is safe here because SVG strings are static module exports, not user input
- CoverIcon should use `React.memo` since it renders frequently in lists
- The `import.meta.glob` pattern requires Vite (already the build tool)
- `coverColor` defaults to `'#FF8A4C'` for new trips if not explicitly set
