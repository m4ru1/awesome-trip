# Cover SVG Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace emoji-based trip thumbnails with a library of 12-16 line-art SVG covers, selectable during trip creation and editable from the trip settings panel.

**Architecture:** Each cover is a TS module exporting `{ meta: CoverMeta, svg(accentColor: string) => string }`. A registry uses `import.meta.glob` to auto-discover all cover modules. A shared `CoverIcon` component replaces all inline emoji rendering across 5 files. `CoverPicker` (grid + color swatches) is embedded in `TripCreateDialog` and in a dialog opened from `TripPanel`.

**Tech Stack:** React, TypeScript, Vite (import.meta.glob), no new dependencies

---

### Task 1: Update Trip type and add new types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add coverId to Trip and create new types**

In `src/types/index.ts`, add after the existing imports (before the `Trip` interface):

```typescript
// Cover illustration types
export type CoverCategory = 'city' | 'nature' | 'culture' | 'food' | 'coastal' | 'seasonal'

export interface CoverMeta {
  id: string
  name: string
  tags: string[]
  category: CoverCategory
  defaultColor: string
}

export interface CoverModule {
  meta: CoverMeta
  svg: (accentColor: string) => string
}
```

In the `Trip` interface, add `coverId` and mark `coverEmoji` as optional:

```typescript
export interface Trip {
  id: string
  title: string
  subtitle: string
  destinationCity: string
  coverEmoji?: string
  coverId: string
  coverColor: string
  dateRange: string
  party: string
  days: Day[]
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors about missing `coverId` in existing code (seed.ts, App.tsx, TripCreateDialog, etc.). This is expected — subsequent tasks fix each one.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add coverId field and cover illustration types"
```

---

### Task 2: Create first cover module (autumn-temple.ts)

**Files:**
- Create: `src/components/covers/items/autumn-temple.ts`

- [ ] **Step 1: Write the cover module**

Create `src/components/covers/items/autumn-temple.ts`:

```typescript
import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'autumn-temple',
    name: '古城秋枫',
    tags: ['古城', '秋天', '寺庙', '红叶'],
    category: 'culture',
    defaultColor: '#D4753B',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <circle cx="40" cy="28" r="9" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M30 46 L26 60 L33 55 L40 60 L47 55 L54 60 L50 46 Z" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="36" y="60" width="8" height="10" rx="2" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M28 46 L22 62" stroke="${accent}99" stroke-width="1"/>
      <path d="M52 46 L58 62" stroke="${accent}99" stroke-width="1"/>
      <circle cx="22" cy="68" r="2" fill="${accent}33"/>
      <circle cx="58" cy="68" r="2" fill="${accent}33"/>
    </svg>`
  },
}

export default cover
```

- [ ] **Step 2: Type-check the new file**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/covers/items/autumn-temple.ts
git commit -m "feat: add autumn-temple cover module"
```

---

### Task 3: Create registry

**Files:**
- Create: `src/components/covers/registry.ts`

- [ ] **Step 1: Write registry with glob auto-discovery**

Create `src/components/covers/registry.ts`:

```typescript
import type { CoverCategory, CoverModule } from '@/types'

const modules = import.meta.glob<{ default: CoverModule }>(
  './items/*.ts', { eager: true }
)

export const coverList: CoverModule[] = Object.values(modules).map(m => m.default)

export const coverMap = new Map<string, CoverModule>(
  coverList.map(c => [c.meta.id, c])
)

export const coversByCategory = coverList.reduce((map, c) => {
  const arr = map.get(c.meta.category) ?? []
  arr.push(c)
  map.set(c.meta.category, arr)
  return map
}, new Map<CoverCategory, CoverModule[]>())
```

- [ ] **Step 2: Verify registry resolves**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/covers/registry.ts
git commit -m "feat: add cover registry with glob auto-discovery"
```

---

### Task 4: Create CoverIcon component

**Files:**
- Create: `src/components/covers/CoverIcon.tsx`

- [ ] **Step 1: Write CoverIcon component**

Create `src/components/covers/CoverIcon.tsx`:

```typescript
import { memo } from 'react'
import type { ReactNode } from 'react'
import { coverMap } from './registry'

interface CoverIconProps {
  coverId: string
  coverColor: string
  coverEmoji?: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

function CoverIcon({
  coverId,
  coverColor,
  coverEmoji,
  size = 52,
  className,
  style,
}: CoverIconProps): ReactNode {
  const mod = coverMap.get(coverId)

  if (!mod) {
    // Fallback: old emoji rendering for unmigrated trips
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.27),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.54),
          background: `linear-gradient(140deg, ${coverColor || '#FF8A4C'}, #FF6B5C)`,
          flexShrink: 0,
          ...style,
        }}
      >
        {coverEmoji || '✈️'}
      </span>
    )
  }

  const svgStr = mod.svg(coverColor || mod.meta.defaultColor)

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
      dangerouslySetInnerHTML={{
        __html: svgStr.replace(
          '<svg ',
          `<svg width="${size}" height="${size}" `
        ),
      }}
    />
  )
}

export default memo(CoverIcon)
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: CoverIcon compiles clean. Other pre-existing errors from missing coverId remain.

- [ ] **Step 3: Commit**

```bash
git add src/components/covers/CoverIcon.tsx
git commit -m "feat: add CoverIcon component with emoji fallback"
```

---

### Task 5: Normalize coverId in useTripLibrary

**Files:**
- Modify: `src/hooks/useTripLibrary.ts:7-16`

- [ ] **Step 1: Add coverId normalization to loadTrips**

In `src/hooks/useTripLibrary.ts`, replace the `loadTrips` function:

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

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTripLibrary.ts
git commit -m "fix: normalize coverId in loadTrips for backward compat"
```

---

### Task 6: Update seed trip

**Files:**
- Modify: `src/data/seed.ts`

- [ ] **Step 1: Add coverId to SEED_TRIP**

In `src/data/seed.ts`, change the cover fields on SEED_TRIP from:

```typescript
  coverEmoji: '🍁',
  coverColor: '#FF8A4C',
```

to:

```typescript
  coverEmoji: '🍁',
  coverId: 'autumn-temple',
  coverColor: '#D4753B',
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors from seed.ts.

- [ ] **Step 3: Commit**

```bash
git add src/data/seed.ts
git commit -m "feat: add coverId to seed trip"
```

---

### Task 7: Update App.tsx initialTrip fallback

**Files:**
- Modify: `src/App.tsx:37-39`

- [ ] **Step 1: Add coverId to initialTrip fallback**

In `src/App.tsx`, find the `initialTrip` useMemo (around line 37-39) and add `coverId: ''` to the fallback object:

Change from:
```typescript
    return found ? cloneTrip(found) : { id: '', title: '', subtitle: '', destinationCity: '', coverEmoji: '', coverColor: '#FF8A4C', dateRange: '', party: '', days: [] }
```

to:
```typescript
    return found ? cloneTrip(found) : { id: '', title: '', subtitle: '', destinationCity: '', coverEmoji: '', coverId: '', coverColor: '#FF8A4C', dateRange: '', party: '', days: [] }
```

- [ ] **Step 2: Type-check — all existing errors should now be gone**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors (all coverId requirements are now satisfied at the type level).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "fix: add coverId to initialTrip fallback"
```

---

### Task 8: Replace HomeView emoji with CoverIcon

**Files:**
- Modify: `src/components/home/HomeView.tsx:1-270` (imports + card rendering)

- [ ] **Step 1: Add CoverIcon import**

At the top of `src/components/home/HomeView.tsx`, add:

```typescript
import CoverIcon from '@/components/covers/CoverIcon'
```

- [ ] **Step 2: Replace emoji rendering in trip card**

In HomeView.tsx, replace lines 159-164:

```tsx
              <span
                className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl"
                style={{ background: `linear-gradient(140deg, ${t.coverColor || '#FF8A4C'}, #FF6B5C)` }}
              >
                {t.coverEmoji || '✈️'}
              </span>
```

with:

```tsx
              <CoverIcon
                coverId={t.coverId}
                coverColor={t.coverColor}
                coverEmoji={t.coverEmoji}
                size={52}
                className="mb-3"
              />
```

- [ ] **Step 3: Verify dev server starts and home page renders**

```bash
npm run dev
```

Open the home page. The seed trip should show the new autumn-temple SVG. Any other trips with empty coverId should fallback to emoji.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HomeView.tsx
git commit -m "feat: use CoverIcon in HomeView trip cards"
```

---

### Task 9: Replace TopBar emoji with CoverIcon

**Files:**
- Modify: `src/components/layout/TopBar.tsx:48-66`

- [ ] **Step 1: Add import**

At the top of `src/components/layout/TopBar.tsx`, add:

```typescript
import CoverIcon from '@/components/covers/CoverIcon'
```

- [ ] **Step 2: Replace TopBar emoji**

Replace lines 52-57:

```tsx
          <span
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] text-xl"
            style={{ background: 'linear-gradient(140deg,#FF8A4C,#FF6B5C)' }}
          >
            {trip.coverEmoji}
          </span>
```

with:

```tsx
          <CoverIcon
            coverId={trip.coverId}
            coverColor={trip.coverColor}
            coverEmoji={trip.coverEmoji}
            size={42}
          />
```

- [ ] **Step 3: Verify TopBar renders in trip view**

Open any trip, check the TopBar shows the correct cover (SVG or emoji fallback).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/TopBar.tsx
git commit -m "feat: use CoverIcon in TopBar"
```

---

### Task 10: Replace TripPanel emoji + add change cover entry

**Files:**
- Modify: `src/components/trip/TripPanel.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/components/trip/TripPanel.tsx`, add:

```typescript
import { useState } from 'react'
import CoverIcon from '@/components/covers/CoverIcon'
import CoverPicker from '@/components/covers/CoverPicker'
```

(`useState` should already be imported; only add if missing.)

- [ ] **Step 2: Add state for cover change dialog**

Add after existing state declarations (around line 30):

```typescript
  const [showCoverPicker, setShowCoverPicker] = useState(false)
```

- [ ] **Step 3: Replace header emoji (line 39)**

Replace:

```tsx
        <span className="text-2xl">{trip.coverEmoji}</span>
```

with:

```tsx
        <CoverIcon
          coverId={trip.coverId}
          coverColor={trip.coverColor}
          coverEmoji={trip.coverEmoji}
          size={36}
          style={{ borderRadius: 10 }}
        />
```

- [ ] **Step 4: Replace trip switcher emoji (line 68)**

Replace:

```tsx
                    <span>{t.coverEmoji}</span>
```

with:

```tsx
                    <CoverIcon
                      coverId={t.coverId}
                      coverColor={t.coverColor}
                      coverEmoji={t.coverEmoji}
                      size={28}
                      style={{ borderRadius: 8 }}
                    />
```

- [ ] **Step 5: Add "change cover" button and dialog**

Right before the closing `</div>` of the header (before `</div>` on the header div), add:

```tsx
        <button
          onClick={() => setShowCoverPicker(true)}
          className="flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-white/30 bg-white/20 px-2.5 text-xs font-bold text-white hover:bg-white/30"
        >
          更换封面
        </button>
```

Then, right before the `return` statement at the component's end, add the dialog:

```tsx
  if (showCoverPicker) {
    const picker = (
      <div
        onClick={() => setShowCoverPicker(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,.35)',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-card)',
            padding: '24px 20px 20px',
            maxWidth: 420,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="title-cn text-lg font-extrabold text-ink">更换封面</span>
            <button
              onClick={() => setShowCoverPicker(false)}
              className="btn btn-ghost h-8 w-8 !p-0"
            >
              ✕
            </button>
          </div>
          <CoverPicker
            selectedId={trip.coverId}
            selectedColor={trip.coverColor}
            onSelect={(coverId) => {
              const mod = coverMap.get(coverId)
              onUpdateTrip({
                ...trip,
                coverId,
                coverColor: mod?.meta.defaultColor ?? trip.coverColor,
              })
            }}
            onColorChange={(color) => {
              onUpdateTrip?.({ ...trip, coverColor: color })
            }}
          />
        </div>
      </div>
    )
    return contentElem ? (
      <>
        {content}
        {picker}
      </>
    ) : picker
  }
```

Wait — TripPanel isn't structured with a single return. Let me check its full structure first. The correct approach: add the `showCoverPicker` dialog rendering inside the component's JSX tree, near the end.

Actually, looking at the TripPanel structure from the explore results, TripPanel is a large component. Let me simplify: render the dialog as a portal/sibling at the bottom of the component's JSX. Add the `coverMap` import and the dialog JSX right before the final `return` statement.

**For implementation, the engineer should:**
1. Add `import { coverMap } from '@/components/covers/registry'` alongside the CoverPicker import
2. The dialog JSX should be appended right before the component's closing return, as a sibling element wrapped in a fragment if needed.
3. Check the component's exact structure during implementation to determine the right insertion point.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any errors from the TripPanel changes.

- [ ] **Step 7: Commit**

```bash
git add src/components/trip/TripPanel.tsx
git commit -m "feat: use CoverIcon in TripPanel, add change cover dialog"
```

---

### Task 11: Replace ShareView emoji with CoverIcon

**Files:**
- Modify: `src/components/views/ShareView.tsx:113,187`

- [ ] **Step 1: Add import**

At the top of `src/components/views/ShareView.tsx`, add:

```typescript
import CoverIcon from '@/components/covers/CoverIcon'
```

- [ ] **Step 2: Replace watermark emoji (line 113)**

Replace:

```tsx
          <div className="absolute -top-5 -right-2.5 text-[150px] opacity-[.18]" style={{ transform: 'rotate(12deg)' }}>{trip.coverEmoji}</div>
```

with:

```tsx
          <div className="absolute -top-5 -right-2.5 opacity-[.18]" style={{ transform: 'rotate(12deg)' }}>
            <CoverIcon
              coverId={trip.coverId}
              coverColor={trip.coverColor}
              coverEmoji={trip.coverEmoji}
              size={150}
            />
          </div>
```

- [ ] **Step 3: Replace footer emoji (line 187)**

Replace:

```tsx
          <div className="text-3xl">{trip.coverEmoji}</div>
```

with:

```tsx
          <CoverIcon
            coverId={trip.coverId}
            coverColor={trip.coverColor}
            coverEmoji={trip.coverEmoji}
            size={48}
          />
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/views/ShareView.tsx
git commit -m "feat: use CoverIcon in ShareView"
```

---

### Task 12: Create CoverPicker component

**Files:**
- Create: `src/components/covers/CoverPicker.tsx`

- [ ] **Step 1: Write CoverPicker component**

Create `src/components/covers/CoverPicker.tsx`:

```typescript
import { coverList } from './registry'
import CoverIcon from './CoverIcon'

const PRESET_COLORS = [
  { color: '#D4753B', name: '暖橙' },
  { color: '#4A90D9', name: '天蓝' },
  { color: '#2A9D8F', name: '松绿' },
  { color: '#E8738A', name: '樱粉' },
  { color: '#8B5CF6', name: '暮紫' },
  { color: '#6B7280', name: '岩灰' },
]

interface CoverPickerProps {
  selectedId: string
  selectedColor: string
  onSelect: (coverId: string) => void
  onColorChange: (color: string) => void
}

export default function CoverPicker({
  selectedId,
  selectedColor,
  onSelect,
  onColorChange,
}: CoverPickerProps) {
  return (
    <div>
      {/* Cover grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
        }}
      >
        {coverList.map(c => (
          <button
            key={c.meta.id}
            onClick={() => onSelect(c.meta.id)}
            title={c.meta.name}
            style={{
              aspectRatio: '1',
              borderRadius: 12,
              border: c.meta.id === selectedId
                ? '2px solid var(--color-brand)'
                : '2px solid transparent',
              padding: 0,
              cursor: 'pointer',
              background: 'transparent',
              overflow: 'hidden',
              transition: 'border-color .15s',
            }}
          >
            <CoverIcon
              coverId={c.meta.id}
              coverColor={selectedColor}
              size={52}
              style={{ borderRadius: 10 }}
            />
          </button>
        ))}
      </div>

      {/* Color swatches */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-ink3)', marginBottom: 8 }}>
          预设色调
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {PRESET_COLORS.map(({ color, name }) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              title={name}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: color,
                border: selectedColor === color
                  ? '2px solid var(--color-brand)'
                  : '2px solid transparent',
                outline: selectedColor === color
                  ? '2px solid #fff'
                  : 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'border-color .15s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/covers/CoverPicker.tsx
git commit -m "feat: add CoverPicker component with color swatches"
```

---

### Task 13: Update TripCreateDialog to use CoverPicker

**Files:**
- Modify: `src/components/home/TripCreateDialog.tsx`

- [ ] **Step 1: Replace state and imports**

In `src/components/home/TripCreateDialog.tsx`, replace the EmojiPicker import and coverEmoji state:

Remove:
```typescript
import EmojiPicker from '@/components/ui/EmojiPicker'
```

Add:
```typescript
import CoverPicker from '@/components/covers/CoverPicker'
import { coverList } from '@/components/covers/registry'
```

Replace:
```typescript
  const [coverEmoji, setCoverEmoji] = useState('✈️')
```

with:
```typescript
  const [coverId, setCoverId] = useState(coverList[0]?.meta.id ?? '')
  const [coverColor, setCoverColor] = useState(coverList[0]?.meta.defaultColor ?? '#FF8A4C')
```

- [ ] **Step 2: Update handleConfirm**

Replace in the `trip` object construction:

```typescript
      coverEmoji: coverEmoji || '✈️',
      coverColor: '#FF8A4C',
```

with:

```typescript
      coverEmoji: '',
      coverId,
      coverColor,
```

- [ ] **Step 3: Replace EmojiPicker UI with CoverPicker**

Replace the "封面 Emoji" EdField block (lines 75-80):

```tsx
        <EdField label="封面 Emoji">
          <div className="flex items-center gap-2">
            <EmojiPicker value={coverEmoji} onChange={setCoverEmoji} placeholder="✈️" />
            <span className="text-xs text-ink3">{coverEmoji || '✈️'}</span>
          </div>
        </EdField>
```

with:

```tsx
        <EdField label="选择封面">
          <CoverPicker
            selectedId={coverId}
            selectedColor={coverColor}
            onSelect={(id) => {
              setCoverId(id)
              const mod = coverList.find(c => c.meta.id === id)
              if (mod) setCoverColor(mod.meta.defaultColor)
            }}
            onColorChange={setCoverColor}
          />
        </EdField>
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/components/home/TripCreateDialog.tsx
git commit -m "feat: replace EmojiPicker with CoverPicker in TripCreateDialog"
```

---

### Task 14: Create remaining cover modules (12-16 total)

**Files:**
- Create: 11 more files in `src/components/covers/items/`

- [ ] **Step 1: Create all remaining cover modules**

Create each file with the same pattern as autumn-temple.ts. Each module exports a `CoverModule` with meta + `svg(accent) => string`.

Create the following files (exact SVG markup left to the implementer, following the style specs: viewBox 0 0 80 80, 1-1.5px strokes, accent color with varying opacity):

1. `mountain-lake.ts` — meta: { id: 'mountain-lake', name: '山野湖泊', tags: ['远足', '湖泊', '自然'], category: 'nature', defaultColor: '#4A90D9' }
2. `city-street.ts` — meta: { id: 'city-street', name: '城市街巷', tags: ['咖啡', '建筑', '街区'], category: 'city', defaultColor: '#E8734A' }
3. `beach-coast.ts` — meta: { id: 'beach-coast', name: '海滩海岸', tags: ['南洋', '潜水', '日落'], category: 'coastal', defaultColor: '#2A9D8F' }
4. `cherry-blossom.ts` — meta: { id: 'cherry-blossom', name: '樱花季', tags: ['春天', '赏花', '公园'], category: 'seasonal', defaultColor: '#E8738A' }
5. `night-market.ts` — meta: { id: 'night-market', name: '夜市烟火', tags: ['美食', '小吃', '夜市'], category: 'food', defaultColor: '#F4A261' }
6. `snow-village.ts` — meta: { id: 'snow-village', name: '雪国小镇', tags: ['冬天', '温泉', '雪景'], category: 'seasonal', defaultColor: '#6B7280' }
7. `museum-gallery.ts` — meta: { id: 'museum-gallery', name: '博物馆', tags: ['艺术', '展览', '历史'], category: 'culture', defaultColor: '#8B5CF6' }
8. `forest-hike.ts` — meta: { id: 'forest-hike', name: '森林徒步', tags: ['登山', '森林', '户外'], category: 'nature', defaultColor: '#4A7C59' }
9. `old-town.ts` — meta: { id: 'old-town', name: '古镇小巷', tags: ['古镇', '石板路', '老建筑'], category: 'culture', defaultColor: '#B5653B' }
10. `modern-skyline.ts` — meta: { id: 'modern-skyline', name: '都市天际', tags: ['夜景', '摩登', '购物'], category: 'city', defaultColor: '#4A6FA5' }
11. `tropical-island.ts` — meta: { id: 'tropical-island', name: '热带海岛', tags: ['海岛', '浮潜', '椰林'], category: 'coastal', defaultColor: '#1E8A7E' }

SVG design guidelines:
- viewBox: `0 0 80 80`
- Lines: 1-1.5px stroke, no fill on main shapes
- Color: `${accent}` for main strokes, `${accent}99` for secondary, `${accent}22` for subtle fills, `${accent}33` for accents
- Background rect: `<rect width="80" height="80" rx="16" fill="${accent}22"/>`
- Style: outline buildings, trees, mountains, waves — travel journal aesthetic

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit each batch of covers**

```bash
git add src/components/covers/items/mountain-lake.ts src/components/covers/items/city-street.ts src/components/covers/items/beach-coast.ts
git commit -m "feat: add nature/city/coastal cover modules"

git add src/components/covers/items/cherry-blossom.ts src/components/covers/items/night-market.ts src/components/covers/items/snow-village.ts
git commit -m "feat: add seasonal/food cover modules"

git add src/components/covers/items/museum-gallery.ts src/components/covers/items/forest-hike.ts src/components/covers/items/old-town.ts
git commit -m "feat: add culture/nature cover modules"

git add src/components/covers/items/modern-skyline.ts src/components/covers/items/tropical-island.ts
git commit -m "feat: add city/coastal cover modules"
```

---

### Task 15: Build and verify

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 2: Production build**

```bash
npm run build 2>&1
```

Expected: build succeeds.

- [ ] **Step 3: Manual verification checklist**

Start the dev server:
```bash
npm run dev
```

Verify:
- [ ] Home page: seed trip card shows autumn-temple SVG (not 🍁 emoji)
- [ ] Click seed trip → TopBar shows SVG at 42px
- [ ] Open TripPanel → header shows SVG, "更换封面" button visible
- [ ] Click "更换封面" → dialog opens with grid of all covers + color swatches
- [ ] Select a different cover → card updates
- [ ] Change color swatch → SVG accent color changes
- [ ] Close dialog, reopen → selection persists
- [ ] Create new trip → CoverPicker inline in form, default first cover selected
- [ ] New trip card appears on home screen with selected cover
- [ ] ShareView → watermark uses SVG, footer uses SVG
- [ ] Old trips (no coverId in localStorage) → fallback to emoji rendering
- [ ] Mobile viewport → all of the above works

- [ ] **Step 4: Commit any final fixes, then declare done**

```bash
git status
git add <any modified files>
git commit -m "chore: final verification fixes"
```
