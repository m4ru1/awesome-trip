# Handoff: 旅行课程表 (Trip Schedule Board)

## Overview
A mobile-and-desktop trip planning app that presents a multi-day itinerary as a "class
schedule" (课程表). Each day is a column/timeline of time-boxed **blocks** (sightseeing,
meals, lodging, transport, free time). Users can plan, view, execute (day-of check-in),
and share an itinerary, swap in **alternatives** (e.g. rainy-day / cheaper / faster
options), simulate **Plan B** scenarios, and see live **conflict warnings** (e.g. an
activity that runs past a venue's closing time).

The reference implementation ships with one sample itinerary ("京都赏枫 5 日" / Kyoto
autumn-leaves, 5 days).

---

## About the Design Files
The files in this bundle are **design references created in HTML + in-browser React/Babel**.
They are a high-fidelity, fully interactive prototype showing the intended look, layout, and
behavior — **not production code to copy directly**.

The task is to **recreate this design in the target codebase's environment** using its
established framework, patterns, and libraries. The prototype happens to be written in React,
but it relies on Babel-in-the-browser, global `window.*` singletons, and inline-style objects —
none of which belong in production. Treat the JSX as an executable spec, not a starting branch.

If no app environment exists yet, React (Vite + TypeScript) is a natural choice given the
component structure, but any modern framework will map cleanly.

---

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, radii, shadows, animation timings, and
interactions are all final and intentional. Recreate the UI faithfully using the codebase's
existing component library, then wire it to real data.

---

## ⭐ Data Model — this is your backend contract
The whole app is driven by a single immutable `Trip` object. Every view is a pure function of
`(trip, mode)`, and every edit is a pure transform that returns a **new** `Trip`. This is the
most important thing to preserve when integrating a backend: **the `Trip` shape below should
become your API schema / DTO.** Today it is seeded from `window.TRIP_DATA` in `data.js`; in
production you replace that single source with a fetch from your backend.

```ts
type Trip = {
  id: string;
  title: string;            // "京都赏枫 5 日"
  subtitle: string;
  destinationCity: string;  // "京都 · Kyoto"
  coverEmoji: string;       // "🍁"
  coverColor: string;       // hex, theme accent
  dateRange: string;        // "11/14 – 11/18" (display only)
  party: string;            // "2 人 · 情侣"
  days: Day[];
};

type Day = {
  id: string;
  dateLabel: string;        // "11/14"
  weekday: string;          // "周五"
  weatherHint: string;      // "多云 15°C"
  weatherIcon: string;      // emoji
  blocks: Block[];          // ordered by startTime
};

type Block = {
  id: string;
  type: "sight" | "meal" | "rest" | "transport" | "free";
  startTime: string;        // "09:30"  (HH:MM, 24h)
  endTime: string;          // "11:30"  OR the literal "次日" (= "next day", for lodging/return)
  status: "planned" | "done" | "skipped";   // used in Execute mode
  primary: Option;          // the currently chosen option
  alternatives: Option[];   // swappable options (Plan B, rainy day, cheaper, etc.)
  transportToNext: Transport | null;        // how to get to the NEXT block
  conflict?: { kind: "open" | "close"; msg: string } | null;  // computed, not stored
};

type Option = {
  id: string;
  name: string;
  emoji: string;
  tags: string[];
  highlight?: string;       // one-line "why this is great"
  swapReason?: "rain" | "save" | "time" | "closed" | "like";  // only on alternatives
  // --- sight ---
  address?: string;
  openHours?: string;       // "08:30–16:00" or "全天开放" / "免费" etc. (parsed for conflicts)
  ticketPrice?: string;     // "¥1,000" | "免费"
  suggestedDuration?: string;
  // --- meal ---
  cuisine?: string;
  perPersonCost?: string;   // "¥3,200"
  budgetLevel?: 1 | 2 | 3;
  signatureDishes?: string[];
  reservationNeeded?: boolean;
  // --- rest (lodging) ---
  pricePerNight?: string;
  rating?: number;          // 0–5
  checkIn?: string;
  checkOut?: string;
  amenities?: string[];
};

type Transport = {
  primary: TransportLeg;
  alternatives: TransportLeg[];
};

type TransportLeg = {
  mode: "walk" | "subway" | "bus" | "taxi" | "train" | "flight" | "bike";
  cost: string;       // "¥150" | "免费"
  duration: string;   // "12min"  (parsed to minutes)
  distance: string;   // "4.2km"
  note?: string;
};
```

### Notes for backend integration
- **Money / time / hours are stored as display strings** (`"¥3,200"`, `"12min"`, `"08:30–16:00"`)
  and parsed on the client by `util.js` (`parseYen`, `parseTransportMin`, `parseOpenHours`).
  For a real backend, prefer storing **structured numeric fields** (e.g. `costYen: 3200`,
  `durationMin: 12`, `openMin/closeMin`) and format on the client. The parsing helpers in
  `util.js` document exactly what formats the UI expects today.
- **`conflict` is derived, never persisted.** It is recomputed from `endTime` vs the parsed
  `openHours.close`. Keep this client-side (or compute server-side and send down) — don't store it.
- **Ordering is implicit by `startTime`** within a day, but drag-to-reorder works on `id`
  order; see "State Management" for the recalc rules.
- Everything is keyed by stable `id`s (`d1`, `b1-3`, `o-tofukuji`). Preserve stable ids from
  your backend so optimistic updates and reorders stay correct.
- The four "type meta" lookup tables (colors, labels, emoji for block types, transport modes,
  and swap-reason scenarios) live at the bottom of `data.js`. These are **presentation
  constants**, not data — port them to a frontend constants file, not the backend.

---

## Modes (top-level app state)
A single `mode` string drives most of the UI. Switched via the segmented `ModeSwitcher`.

| mode | label | emoji | behavior |
|------|-------|-------|----------|
| `plan` | 规划 (Plan) | ✏️ | Fully editable. Add/edit/delete blocks & days, drag to reorder, edit transport. |
| `view` | 查看 (View) | 👀 | Read-only. Alternatives still visible. |
| `execute` | 执行 (Execute) | 🧭 | Day-of mode. Shows a "now" simulator (a time slider + day picker), highlights the current block, and exposes ✓完成打卡 (check-in) / 跳过 (skip) on each block via `status`. |
| `share` | 分享 (Share) | 💌 | A clean, shareable read-only summary view (`ShareView`). Alternatives hidden. |

Independently of mode, a **Plan B** toggle (🅱️) overlays a scenario comparison view
(`PlanBView`) that lets the user apply a whole-trip scenario (rain / save / time / closed) and
see the diff in money & time vs the baseline.

---

## Screens / Views
Built responsively; the breakpoint is **`window.innerWidth < 860` → mobile**.

### 1. Top bar (`App` header)
- **Layout:** flex row, `padding 13px 20px` desktop / `11px 14px` mobile, `1px solid var(--line)`
  bottom border, translucent `rgba(255,248,240,.9)` background with `backdrop-filter: blur(8px)`.
- **Left:** a button (cover emoji tile 42×42, `border-radius 13px`, orange gradient
  `linear-gradient(140deg,#FF8A4C,#FF6B5C)`) + trip title (`title-cn` font, 23px desktop / 19px
  mobile) + subline (date range · city · day count). Tapping opens the **Trip Settings panel**.
- **Right:** `ModeSwitcher` (desktop only — moves to a 2nd row on mobile), a `?` help button, and
  the **Plan B** toggle button.
- **Execute mode only:** a "🧭 模拟「现在」" control bar appears — day pills (D1…Dn) + a time
  range slider (`8:00`–`21:00`, step 5 min) + the formatted current time.

### 2. Day timeline — mobile / single-day (`DayTimeline` + `DayTabs`)
- `DayTabs`: a horizontal scroll row of day pills (date + weekday + weather icon); active pill is
  `var(--brand)` filled. Plan mode shows a dashed "+ 加一天" (add day) pill.
- `DayTimeline`: a vertical list of blocks for the active day. Each row = a left time gutter
  (start time top, end time bottom, `num` font; a `⠿` drag grip in plan mode) + a `BlockCard`.
- **Drag-to-reorder** (plan mode): pointer-based. Press-and-move > 7px starts a drag; the dragged
  card floats and other cards animate out of the way (FLIP). On drop, the day's blocks reorder by
  id and times recalc. A tap (no drag) opens the detail drawer.
- A dashed "+ 加一项" button at the bottom adds a block.

### 3. Schedule grid — desktop (`ScheduleGrid`)
- Desktop-only (`!isMobile && !planB && mode !== "share"`). A true time-grid: all days as columns,
  a shared vertical time axis at `SCALE = 1.32 px/min`. Blocks are absolutely positioned by
  start/end. HTML5 drag-and-drop moves a block to another day. A small "改交通" pill sits between
  stacked blocks to open transport editing.

### 4. Block detail — drawer (desktop) / bottom sheet (mobile) (`BlockDrawer` / `BlockSheet` → `DetailContent`)
- **Drawer:** right side, `width 410px` (max `92vw`), full height, slides in
  (`drawerIn .34s var(--ease-spring)`), with a `rgba(43,45,51,.28)` scrim behind (click scrim or
  ✕ to close).
- **Sheet (mobile):** bottom, `max-height 90%`, `border-radius 24px` top corners, slides up
  (`sheetIn`), with a grab handle.
- **Contents (`DetailContent`):** 130px cover tile (colored placeholder + big emoji) with a ✕
  close button and type/status chips overlaid; then time range, title, address, a highlight
  callout (tinted by type), a **conflict warning** (pulsing red) if present, type-specific detail
  body (`SightDetail` / meal / lodging), a **"前往下一站" transport connector**, an **alternatives
  deck**, and an action row (Execute: 完成打卡 / 跳过; Plan: ✏️编辑 / 🗑️删除; always: 🗺️地图打开).
  > ⚠️ Implementation note: pass the `onClose` handler **explicitly** to the detail content and
  > the scrim. (In the prototype, relying on `{...rest}` prop spreading silently dropped the
  > close handler — make close handlers first-class props.)

### 5. Transport connector (`TransportConnector`)
- An expandable pill showing mode emoji + duration + cost between two stops. Click to expand and
  (in plan mode) switch mode, edit fields, or pick a transport alternative.

### 6. Alternatives deck (`AlternativeDeck`)
- A horizontally-scrollable row of `OptionMiniCard`s for the block's `alternatives`, each tagged
  with its `swapReason` chip (☔雨天 / 💰平价 / 🕒时间紧 / 🔒闭馆 / ❤️想换换). In plan mode the user
  can set one as primary (swaps `primary` ⇄ alternative), edit, delete, or add a new alternative.

### 7. Plan B view (`PlanBView`)
- Overlay comparison. Scenario chips (rain/save/time/closed); applying one swaps every block that
  has a matching alternative, then a `DiffSummary` shows Δ money / Δ time / # blocks affected vs
  the baseline trip. "↺ 全部还原" resets to baseline.

### 8. Share view (`ShareView`)
- A clean, read-only itinerary summary intended for sending to a travel companion.

### 9. Block editor (`BlockEditor`)
- A form (modal) for create/edit of a block or an alternative. Handles type-specific fields,
  default start time, save, and delete.

### 10. Trip settings panel (`TripPanel`)
- Right drawer (desktop) / bottom sheet (mobile). Edit trip meta, add/delete whole days, jump to
  a day. Note this component **already** passes `onClose` as an explicit named prop — follow that
  pattern everywhere.

### 11. Onboarding / Help overlay (`HelpOverlay`)
- A centered modal shown on first load (gated by `localStorage["tt_seen_help_v4"]`), re-openable
  via the `?` button. Orange gradient header, a few "how to use" rows, and a "开始规划 →" CTA.

---

## Interactions & Behavior
- **Open detail:** tap a block card (drawer on desktop, sheet on mobile).
- **Close detail:** click ✕ or the scrim. (Make this an explicit handler — see note in screen 4.)
- **Reorder (plan):** mobile = pointer-drag in the timeline (7px threshold to start; FLIP animation
  for the displaced cards; ~120ms guard after drop so the drag isn't read as a tap). Desktop =
  HTML5 drag between day columns in the grid.
- **Swap option:** in the alternatives deck, "set as primary" swaps `primary` with the chosen
  alternative (the old primary becomes an alternative).
- **Execute check-in:** toggles block `status` between `planned` / `done` / `skipped`.
- **Plan B:** applying a scenario swaps all matching alternatives trip-wide; reset restores baseline.
- **Conflict detection:** after any time change, recompute each block's `conflict` by comparing its
  `endTime`/`startTime` against the parsed `openHours`. Conflicts render as a pulsing red banner.
- **Time recalc:** see State Management.
- **Toasts:** transient bottom-center pill (`var(--ink)` bg, `border-radius 999px`), auto-dismiss
  after 1800ms, for actions like "已加一天", "已删除该项".

### Animations (port these timings)
- `floatIn` 0.42s spring (entrances), `drawerIn`/`sheetIn` 0.34s spring (panels), `fadeIn` 0.2s
  (scrims), `popCheck` (check stamp), `pulseRed` 1.6s loop (conflicts), `flipSwap` 0.42s (option
  swap), `rollNum` 0.4s (number changes).
- Shared spring easing: `cubic-bezier(.34, 1.56, .64, 1)` (CSS var `--ease-spring`).
- Buttons scale to `.96` on `:active`.

---

## State Management
All app state lives in the `App` component (`app.jsx`) as a handful of `useState` hooks:

| state | meaning |
|-------|---------|
| `trip` | the working `Trip` (seeded from `window.TRIP_DATA` via `TT.cloneTrip`) |
| `baseline` / `baselineTotals` | a frozen clone of the original trip + its totals, for Plan B diffs |
| `mode` | `"plan" \| "view" \| "execute" \| "share"` |
| `planB` | boolean — Plan B overlay on/off |
| `activeDay` | index of the day shown in the single-day timeline |
| `open` | `{ dayIdx, blockIdx } \| null` — which block's detail is open |
| `editing` | editor descriptor (`{ kind: "create" \| "edit", … }`) or null |
| `confirmDel` | pending delete confirmation or null |
| `isMobile`, `nowMin`, `toast`, `showHelp`, `showTrip` | UI/ephemeral |

**Edits are pure transforms** returning a new `Trip`. Key rules (in `app.jsx` / `util.js`):
- `flagConflicts(blocks)` — recompute `conflict` for each block.
- `sortByStart(blocks)` — order a day by start time.
- `nextStartFor(day)` — suggest a start time for a new block (last end + 15 min).
- `shiftFrom(blocks, fromIdx, delta)` — push later blocks by `delta` minutes.
- `TT.recalcDay(day)` — re-chain a day: anchor on the first block's start, then lay out each block
  by its fixed duration (`_durMin`) plus the transport time to the next, re-flagging conflicts.
- `TT.tripTotals(trip)` — rough money / transport-min / sight-min totals (used by Plan B diff).

**Persistence:** the prototype keeps everything in memory (lost on refresh) except the
"seen onboarding" flag in `localStorage`. For production:
1. Replace `window.TRIP_DATA` with a fetch of the `Trip` from your backend.
2. On each pure transform, persist the new `Trip` (PATCH the trip, or per-block mutations —
   the block `id`s make granular endpoints easy).
3. Keep `conflict` and totals computed client-side (or have the API return them).

---

## Design Tokens
From the `:root` block in `index.html`.

### Block-type accent colors (also the brand palette)
| token | hex | use |
|-------|-----|-----|
| `--c-sight` | `#FF8A4C` | 观光 sightseeing |
| `--c-meal` | `#F5A300` | 餐饮 meals |
| `--c-rest` | `#15B8A6` | 住宿 lodging |
| `--c-transport` | `#4C7DFF` | 交通 transport |
| `--c-free` | `#A66BFF` | 自由 free time |

Each has a `*-soft` variant at 12% alpha for tinted backgrounds.

### Neutrals & brand
| token | hex |
|-------|-----|
| `--paper` (app bg) | `#FFF8F0` |
| `--paper-2` (soft surface) | `#FBEFE2` |
| `--card` | `#FFFFFF` |
| `--ink` (text) | `#2B2D33` |
| `--ink-2` (secondary) | `#7A7E87` |
| `--ink-3` (tertiary) | `#B4B7BE` |
| `--brand` | `#FF6B5C` |
| `--brand-d` (hover) | `#ED5546` |
| `--line` (borders) | `#ECE2D6` |

The app background also has a subtle dotted texture:
`radial-gradient(rgba(150,110,70,.06) 1.1px, transparent 1.1px)` at `22px 22px`.

### Radii
`--r-card: 20px`, `--r-btn: 14px`, `--r-pill: 999px`.

### Shadows
- `--shadow-soft: 0 6px 20px rgba(75,55,40,.10)`
- `--shadow-pop: 0 10px 30px rgba(75,55,40,.16)`

### Typography
| role | family | source |
|------|--------|--------|
| `--font-cn-title` | "Smiley Sans" (得意黑), italic, +0.5px tracking | cn-fontsource CDN |
| `--font-cn-body` | "Noto Sans SC" | Google Fonts |
| `--font-num` | "Fredoka" (then Nunito) | Google Fonts |
| `--font-latin` | "Nunito" | Google Fonts |

Numbers/times use the `.num` class (Fredoka, `font-variant-numeric: tabular-nums`). Titles use
`.title-cn` (Smiley Sans, italic). Body copy uses Noto Sans SC. **Min text size: 12.5px.**

### Spacing
No formal scale; spacing is in px multiples of ~2–4 (common values: 4, 6, 9, 10, 12, 14, 16, 18,
20). Card padding ≈ `16px 18px`; chip padding `3px 10px`.

---

## Assets
- **No raster images.** All "photos" are placeholder tiles (`ImageTile` / `.img-placeholder`):
  a type-tinted background with a diagonal hairline stripe + a large emoji + a small "PHOTO"
  label. Replace these with real venue photography in production (the `Option` already implies a
  photo slot per option).
- **Icons are emoji** throughout (block types, transport modes, weather, scenario chips). In a
  production app you may swap to an icon set; the meta tables in `data.js` are where to map them.
- **Fonts** load from Google Fonts + a jsDelivr CDN (Smiley Sans). Self-host or use your app's
  font pipeline in production.

---

## Files
All files are at the project root. Load order matters (see `index.html`).

| file | role |
|------|------|
| `index.html` | shell: design tokens (`:root`), global CSS, keyframes, font links, script load order, mount point `#root` |
| `data.js` | seed `Trip` (`window.TRIP_DATA`) + presentation meta tables (`TYPE_META`, `TRANSPORT_META`, `SCENARIO_META`) — **this is the data layer to replace with your API** |
| `util.js` | `window.TT` — pure helpers: time parse/format, hours/cost parsing, day recalc, conflict detection, totals, deep clone |
| `cards.jsx` | shared UI atoms (`TypeTag`, `Stars`, `BudgetDots`, `MiniChip`, `ScenarioChip`, `ImageTile`) + `BlockCard` (compact block used in timeline & grid) |
| `panels.jsx` | `TransportConnector`, `AlternativeDeck`, `DetailContent`, `BlockDrawer`, `BlockSheet` (block detail) |
| `editor.jsx` | `BlockEditor` create/edit form + `ConfirmDialog` |
| `onboarding.jsx` | `HelpOverlay` first-run / help modal |
| `trip.jsx` | `TripPanel` trip settings & day management drawer/sheet |
| `grid.jsx` | `ScheduleGrid` desktop time-grid view |
| `timeline.jsx` | `DayTabs` + `DayTimeline` single-day list with pointer drag-reorder |
| `planb.jsx` | `PlanBView`, `OptionMiniCard`, `DiffSummary` scenario comparison |
| `share.jsx` | `ShareView` shareable read-only summary |
| `app.jsx` | `App` root: all state, pure transforms, mode switching, layout composition |

### Important caveats about the reference implementation (do NOT ship as-is)
- Uses **Babel-standalone in the browser** — for prototyping only. Compile ahead of time.
- Components communicate via **`window.*` globals** and `Object.assign(window, {...})` exports —
  replace with real module imports.
- Styling is **inline style objects** — migrate to your styling system (CSS modules / Tailwind /
  styled-components / your design-system components).
- **Pass event handlers (especially `onClose`) as explicit named props**, not via `{...rest}`
  spreads, to avoid silently dropping them.
- All money/duration/hours are **strings parsed at runtime** — prefer structured numeric fields
  from the backend and format in the UI.
