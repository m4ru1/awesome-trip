# Design Spec: Tag Editing for Itinerary Items

**Date:** 2026-06-02
**Project:** awesome-trip
**Status:** Draft

---

## Problem

Template trip items have meaningful tags (`赏枫名所`, `世界遗产`, `百年老铺`, `需排队`, etc.) that add visual richness and practical info. New trips have no way to add or manage tags — the feature exists in data but has no UI.

## Scope

1. **Add tag editing to BlockEditor** — the core fix. Users need a simple way to add/remove freeform tags when creating or editing a block.
2. **Add tag display to RestDetail** — consistency fix. SightDetail, MealDetail, and FreeDetail already show tags; RestDetail doesn't.
3. **Optionally add tags to BlockCard** — timeline cards currently don't show tags. Adding a compact tag row on cards would make tags visible without opening the detail panel.

## Design

### 1. Tag Editing in BlockEditor

**Location:** `src/components/editor/BlockEditor.tsx`

Add a new section below the "Highlight / 备注" field:

```
标签 · Tags
┌─────────────────────────────────────────┐
│ [赏枫名所 ✕] [世界遗产 ✕] [+ 添加标签]   │
└─────────────────────────────────────────┘
```

**Behavior:**
- Existing tags rendered as removable chips (`MiniChip` style, with `✕` to remove)
- "＋ 添加标签" button opens a small inline input
- Typing + Enter adds the tag; empty input is discarded
- Tags are freeform strings (no predefined list — same as the seed data model)
- Max ~8 tags suggested but not enforced (UX hint only)

**Implementation:**
- New local state: `const [tagInput, setTagInput] = useState('')` and `const [showTagInput, setShowTagInput] = useState(false)`
- `addTag(t: string)` — pushes to primState.tags, clears input
- `removeTag(i: number)` — splices from primState.tags

### 2. Tag Display in RestDetail

**Location:** `src/components/cards/RestDetail.tsx`

Add a `TagRow` render block, same pattern as SightDetail/MealDetail/FreeDetail:

```tsx
{o.tags && o.tags.length > 0 && (
  <div style={{ marginTop: 14 }}>
    <TagRow tags={o.tags} color="var(--color-rest)" />
  </div>
)}
```

### 3. Tag Display on BlockCard (Optional)

**Location:** `src/components/cards/BlockCard.tsx`

If `block.primary.tags` is non-empty, render a compact `TagRow` below the sub-info line. Use the block type's color. In compact mode, show max 2 tags.

**Tradeoff:** Adds visual density to cards. The seed trip has 4-7 blocks per day — tags would make cards taller. Worth doing for discoverability (users won't find tags if they're only in the detail panel), but adds clutter.

**Recommendation:** Include in scope. Tags are data the user intentionally added — hiding them defeats the purpose.

---

## Files

| File | Change |
|------|--------|
| `src/components/editor/BlockEditor.tsx` | Add tag editing UI (inline add/remove chips) |
| `src/components/cards/RestDetail.tsx` | Add TagRow render (consistency fix) |
| `src/components/cards/BlockCard.tsx` | Add compact TagRow below sub-info (optional) |

## Out of Scope

- Predefined tag library / tag suggestions
- Tag colors (all tags share the block type's color)
- Tag reordering
- Tag search/filter across trips
