import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { Mode, Block, Day, BlockType, BlockStatus, SwapReason, TransportMode } from '@/types'
import { SCENARIO_META, TRANSPORT_META } from '@/data/constants'
import { useAnimation } from '@/hooks/useAnimation'
import { cloneTrip, forkTrip } from '@/utils/clone'
import { SEED_TRIP } from '@/data/seed'
import { toMin, parseTransportMin } from '@/utils/time'
import { flagConflicts, sortByStart, nextStartFor, shiftFrom, recalcDay } from '@/utils/transforms'
import { tripTotals } from '@/utils/totals'
import { useIsMobile } from '@/hooks/useIsMobile'
import useTripLibrary from '@/hooks/useTripLibrary'

import TopBar from '@/components/layout/TopBar'
import DayTabs from '@/components/timeline/DayTabs'
import DayTimeline from '@/components/timeline/DayTimeline'
import ScheduleGrid from '@/components/grid/ScheduleGrid'
import PlanBView from '@/components/views/PlanBView'
import ShareView from '@/components/views/ShareView'
import BlockDrawer from '@/components/panels/BlockDrawer'
import BlockSheet from '@/components/panels/BlockSheet'
import BlockEditor from '@/components/editor/BlockEditor'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import HelpOverlay from '@/components/onboarding/HelpOverlay'
import TripPanel from '@/components/trip/TripPanel'
import DayPanel from '@/components/trip/DayPanel'
import HomeView from '@/components/home/HomeView'
import MarketplaceView from '@/components/home/MarketplaceView'
import TripCreateDialog from '@/components/home/TripCreateDialog'
import usePublished from '@/hooks/usePublished'

export default function App() {
  const { trips, activeTripId, setActiveTrip, saveTrip, createTrip, deleteTrip, getTrip } = useTripLibrary()
  const { tr: animTr } = useAnimation()

  const initialTrip = useMemo(() => {
    const found = getTrip(activeTripId) ?? trips[0]
    return found ? cloneTrip(found) : { id: '', title: '', subtitle: '', destinationCity: '', coverEmoji: '', coverColor: '#FF8A4C', dateRange: '', party: '', days: [] }
  }, [getTrip, activeTripId, trips])
  const [trip, setTrip] = useState(initialTrip)

  // Sync trip back to library whenever it changes
  useEffect(() => { if (trip) saveTrip(trip) }, [trip, saveTrip])

  const baseline = useMemo(() => cloneTrip(trip), [trip])
  const baselineTotals = useMemo(() => tripTotals(baseline), [baseline])

  const [view, setView] = useState<'home' | 'trip'>(() => trips.length > 0 ? 'trip' : 'home')
  const [mode, setMode] = useState<Mode>('plan')
  const [planB, setPlanB] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [open, setOpen] = useState<{ dayIdx: number; blockIdx: number } | null>(null)
  const isMobile = useIsMobile(860)
  const [nowMin, setNowMin] = useState(14 * 60)
  const [toast, setToast] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    kind: 'create' | 'edit'
    variant?: 'block' | 'alt'
    dayIdx: number
    blockIdx?: number
    altIdx?: number
    defaultStart?: string
  } | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ dayIdx: number; blockIdx: number; name: string } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showTrip, setShowTrip] = useState(false)
  const [dayPanel, setDayPanel] = useState<number | null>(null)
  const [showCreateTrip, setShowCreateTrip] = useState(false)
  const [marketplace, setMarketplace] = useState(false)
  const [nickname, setNickname] = useState(() => {
    try { return localStorage.getItem('tt_nickname') || 'momo' } catch { return 'momo' }
  })

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGoHome = useCallback(() => {
    const switchView = () => setView('home')
    if (document.startViewTransition) {
      document.startViewTransition(() => { flushSync(switchView) })
    } else {
      switchView()
    }
  }, [])
  const handleSelectTrip = useCallback((id: string) => {
    const t = getTrip(id)
    if (!t) return
    const switchView = () => { setTrip(cloneTrip(t)); setActiveTrip(id); setActiveDay(0); setView('trip') }
    if (document.startViewTransition) {
      document.startViewTransition(() => { flushSync(switchView) })
    } else {
      switchView()
    }
  }, [getTrip, setActiveTrip])
  const handleSwitchTrip = useCallback((id: string) => {
    saveTrip(trip)
    const t = getTrip(id)
    if (t) { setTrip(cloneTrip(t)); setActiveTrip(id); setActiveDay(0) }
  }, [trip, saveTrip, getTrip, setActiveTrip])
  const handleCreateTrip = useCallback((newTrip: typeof trip) => {
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const today = new Date()
    const tripWithDay = newTrip.days.length === 0
      ? {
          ...newTrip,
          days: [{
            id: 'd' + Date.now(),
            dateLabel: `${today.getMonth() + 1}/${today.getDate()}`,
            weekday: wk[today.getDay()],
            weatherHint: '待定',
            weatherIcon: '🌤️',
            temperature: null,
            subtitle: undefined,
            blocks: [],
          }],
        }
      : newTrip
    createTrip(tripWithDay)
    setTrip(cloneTrip(tripWithDay))
    setView('trip')
    setActiveDay(0)
    setShowCreateTrip(false)
  }, [createTrip])

  const handleForkTemplate = useCallback(() => {
    handleCreateTrip(forkTrip(SEED_TRIP))
  }, [handleCreateTrip])

  // Auto-fork seed trip on first-ever visit (empty library, no prior seed)
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    const seeded = localStorage.getItem('tt_seeded_v1')
    if (!seeded && trips.length === 0) {
      handleCreateTrip(forkTrip(SEED_TRIP))
    }
    localStorage.setItem('tt_seeded_v1', '1')
  }, [trips.length, handleCreateTrip])

  const handleDuplicateTrip = useCallback((id: string) => {
    const source = getTrip(id)
    if (source) handleCreateTrip(forkTrip(source))
  }, [getTrip, handleCreateTrip])

  useEffect(() => {
    if (trips.length === 0) setView('home')
  }, [trips.length])

  useEffect(() => {
    try { if (!localStorage.getItem('tt_seen_help_v4')) setShowHelp(true) } catch { setShowHelp(true) }
  }, [])

  const closeHelp = useCallback(() => {
    setShowHelp(false)
    try { localStorage.setItem('tt_seen_help_v4', '1') } catch { /* ignore */ }
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }, [])

  const {
    publishing, isPublished, isDirty, myShareIds, updateSnapshot, getInfo,
    handlePublish: publish, handleSync: sync, handleUnpublish: unpublish,
  } = usePublished(showToast)

  const published = trip?.id ? isPublished(trip.id) : false
  const dirty = trip ? isDirty(trip) : false

  const handlePublish = useCallback(async () => {
    if (!trip?.id) return
    // Detect remix: check if the trip was forked from a known source
    // The source info would be stored in localStorage by the copy handler
    let originalAuthor: string | undefined
    let originalShareId: string | undefined
    let originalShareCode: string | undefined
    try {
      const remix = JSON.parse(localStorage.getItem(`tt_remix_${trip.id}`) || 'null')
      if (remix) {
        originalAuthor = remix.author
        originalShareId = remix.share_id
        originalShareCode = remix.share_code
      }
    } catch { /* ignore */ }
    await publish(trip, {
      publisher_nickname: nickname || 'momo',
      original_author: originalAuthor,
      original_share_id: originalShareId,
      original_share_code: originalShareCode,
    })
    // Clear remix info after publishing
    try { localStorage.removeItem(`tt_remix_${trip.id}`) } catch { /* ignore */ }
  }, [trip, nickname, publish])

  const handleSync = useCallback(async () => {
    if (!trip?.id) return
    await sync(trip, nickname || 'momo')
  }, [trip, nickname, sync])

  const handleUnpublish = useCallback(async () => {
    if (!trip?.id) return
    await unpublish(trip.id)
  }, [trip, unpublish])

  const handleRestore = useCallback(async () => {
    if (!trip?.id) return
    try {
      const map = JSON.parse(localStorage.getItem('tt_published_v1') || '{}')
      const pinfo = map[trip.id]
      if (!pinfo) return
      const { fetchMarketTrip } = await import('@/api/marketplace')
      const result = await fetchMarketTrip(pinfo.share_id)
      const restored = forkTrip(result.trip as unknown as typeof trip)
      setTrip(cloneTrip(restored))
      updateSnapshot(trip.id, JSON.stringify(restored))
      showToast('已恢复市场版本')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '恢复失败')
    }
  }, [trip, showToast, updateSnapshot])

  const handleCopyFromMarketplace = useCallback((newTrip: typeof trip, remixInfo?: { author: string; share_id: string; share_code: string }) => {
    const forked = forkTrip(newTrip)
    createTrip(forked)
    setTrip(cloneTrip(forked))
    // Store remix info for attribution when user publishes
    if (remixInfo) {
      try {
        localStorage.setItem(`tt_remix_${forked.id}`, JSON.stringify(remixInfo))
      } catch { /* ignore */ }
    }
    setView('trip')
    setMarketplace(false)
    setActiveDay(0)
    showToast('已复制到我的行程')
  }, [createTrip, showToast])

  const openBlock = open ? trip.days[open.dayIdx]?.blocks[open.blockIdx] : null

  /* ── Day mutation helper ── */
  function mutateDay(dayIdx: number, fn: (day: Day) => Day) {
    setTrip(prev => {
      const t = { ...prev, days: [...prev.days] }
      t.days[dayIdx] = fn({ ...t.days[dayIdx], blocks: [...t.days[dayIdx].blocks] })
      return t
    })
  }

  /* ── Option swaps ── */
  function setPrimaryAlt(dayIdx: number, blockIdx: number, altIdx: number) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const alts = [...b.alternatives]
      const newPrimary = alts[altIdx]
      alts[altIdx] = b.primary
      b.primary = newPrimary
      b.alternatives = alts
      blocks[blockIdx] = b
      return { ...day, blocks: flagConflicts(blocks) }
    })
    showToast('已切换主选 · 已重算冲突')
  }

  function switchTransport(dayIdx: number, blockIdx: number, segIdx: number, altIdx: number) {
    mutateDay(dayIdx, day => {
      let blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const chain = [...b.transportToNext]
      const conn = { ...chain[segIdx] }
      const alts = [...conn.alternatives]
      const oldP = conn.primary
      const newP = alts[altIdx]
      const delta = parseTransportMin(newP.duration) - parseTransportMin(oldP.duration)
      alts[altIdx] = oldP
      conn.primary = newP
      conn.alternatives = alts
      chain[segIdx] = conn
      b.transportToNext = chain
      blocks[blockIdx] = b
      blocks = shiftFrom(blocks, blockIdx, delta)
      return { ...day, blocks: flagConflicts(blocks) }
    })
    showToast('已换交通 · 下游时间重算')
  }

  /* ── Transport field edits ── */
  function setTransportMode(dayIdx: number, blockIdx: number, segIdx: number, modeKey: string) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const chain = [...b.transportToNext]
      if (!chain[segIdx]?.primary) return day
      const conn = { ...chain[segIdx] }
      conn.primary = { ...conn.primary, mode: modeKey as TransportMode }
      chain[segIdx] = conn
      b.transportToNext = chain
      blocks[blockIdx] = b
      return { ...day, blocks }
    })
    showToast(`已改走「${(TRANSPORT_META as Record<string, { zh: string }>)[modeKey]?.zh ?? modeKey}」`)
  }

  function setTransportField(dayIdx: number, blockIdx: number, segIdx: number, field: string, value: string) {
    mutateDay(dayIdx, day => {
      let blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const chain = [...b.transportToNext]
      if (!chain[segIdx]?.primary) return day
      const conn = { ...chain[segIdx] }
      const oldP = conn.primary
      conn.primary = { ...oldP, [field]: value }
      chain[segIdx] = conn
      b.transportToNext = chain
      blocks[blockIdx] = b
      if (field === 'duration') {
        const delta = parseTransportMin(value) - parseTransportMin(oldP.duration)
        blocks = shiftFrom(blocks, blockIdx, delta)
      }
      return { ...day, blocks: flagConflicts(blocks) }
    })
  }

  function addTransport(dayIdx: number, blockIdx: number) {
    mutateDay(dayIdx, day => {
      let blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      b.transportToNext = [...b.transportToNext, { primary: { mode: 'walk', duration: '10min', cost: '免费', distance: '' }, alternatives: [] }]
      blocks[blockIdx] = b
      blocks = shiftFrom(blocks, blockIdx, 10)
      return { ...day, blocks: flagConflicts(blocks) }
    })
    showToast('已加一段交通 · 下游时间重算')
  }

  function removeTransport(dayIdx: number, blockIdx: number, segIdx: number) {
    mutateDay(dayIdx, day => {
      let blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const chain = [...b.transportToNext]
      const removed = chain[segIdx]
      const dur = removed?.primary ? parseTransportMin(removed.primary.duration) : 0
      chain.splice(segIdx, 1)
      b.transportToNext = chain
      blocks[blockIdx] = b
      blocks = shiftFrom(blocks, blockIdx, -dur)
      return { ...day, blocks: flagConflicts(blocks) }
    })
    showToast('已移除该段交通')
  }

  function reorderTransportSegments(dayIdx: number, blockIdx: number, fromIdx: number, toIdx: number) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const chain = [...b.transportToNext]
      const [moved] = chain.splice(fromIdx, 1)
      chain.splice(toIdx, 0, moved)
      b.transportToNext = chain
      blocks[blockIdx] = b
      return { ...day, blocks: flagConflicts(blocks) }
    })
    showToast('已重排交通顺序')
  }

  function bindTransport(d: number, b: number) {
    return {
      editable: mode === 'plan',
      onSwitchAlt: (segIdx: number, altIdx: number) => switchTransport(d, b, segIdx, altIdx),
      onSetMode: (segIdx: number, k: string) => setTransportMode(d, b, segIdx, k),
      onSetField: (segIdx: number, f: string, v: string) => setTransportField(d, b, segIdx, f, v),
      onAdd: () => addTransport(d, b),
      onRemove: (segIdx: number) => removeTransport(d, b, segIdx),
      onReorder: (fromIdx: number, toIdx: number) => reorderTransportSegments(d, b, fromIdx, toIdx),
    }
  }

  /* ── Day management ── */
  function nextDayMeta(last: Day | undefined) {
    const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    if (last) {
      const m = /(\d{1,2})\/(\d{1,2})/.exec(last.dateLabel)
      if (m) {
        const d = new Date(2025, +m[1] - 1, +m[2])
        d.setDate(d.getDate() + 1)
        return { dateLabel: `${d.getMonth() + 1}/${d.getDate()}`, weekday: wk[d.getDay()] }
      }
    }
    return { dateLabel: '', weekday: '' }
  }

  function addDay() {
    let newIdx = 0
    setTrip(prev => {
      const days = [...prev.days]
      const nd = nextDayMeta(days[days.length - 1])
      days.push({ id: 'd' + Date.now(), dateLabel: nd.dateLabel, weekday: nd.weekday, weatherHint: '待定', weatherIcon: '🌤️', temperature: null, subtitle: undefined, blocks: [] })
      newIdx = days.length - 1
      return { ...prev, days }
    })
    setActiveDay(newIdx)
    setDayPanel(newIdx)
    showToast(`已加一天 · Day ${newIdx + 1}`)
  }

  function deleteDay(dayIdx: number) {
    setTrip(prev => {
      if (prev.days.length <= 1) return prev
      const days = [...prev.days]
      days.splice(dayIdx, 1)
      setActiveDay(a => Math.max(0, Math.min(a, days.length - 1)))
      return { ...prev, days }
    })
    setOpen(null)
    showToast(`已删除 Day ${dayIdx + 1}`)
  }

  function updateTrip(patch: Partial<typeof trip>) {
    setTrip(prev => ({ ...prev, ...patch }))
  }

  function updateDay(dayIdx: number, patch: Partial<Day>) {
    setTrip(prev => {
      const days = [...prev.days]
      days[dayIdx] = { ...days[dayIdx], ...patch }
      return { ...prev, days }
    })
  }

  /* ── Detail callbacks ── */
  function onSetPrimary(kind: string, idx: number) {
    if (!open) return
    if (kind === 'alt') setPrimaryAlt(open.dayIdx, open.blockIdx, idx)
  }

  function toggleStatus(status: BlockStatus) {
    if (!open) return
    mutateDay(open.dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[open.blockIdx] }
      b.status = b.status === status ? 'planned' : status
      blocks[open.blockIdx] = b
      return { ...day, blocks }
    })
  }

  /* ── Alternative CRUD ── */
  function addAlternative(dayIdx: number, blockIdx: number, option: Block['primary']) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      b.alternatives = [...(b.alternatives || []), { ...option, id: option.id || 'alt-' + Date.now() }]
      blocks[blockIdx] = b
      return { ...day, blocks }
    })
    showToast('已加备选')
  }

  function updateAlternative(dayIdx: number, blockIdx: number, altIdx: number, option: Partial<Block['primary']>) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const alts = [...b.alternatives]
      alts[altIdx] = { ...alts[altIdx], ...option }
      b.alternatives = alts
      blocks[blockIdx] = b
      return { ...day, blocks }
    })
    showToast('已保存备选')
  }

  function deleteAlternative(dayIdx: number, blockIdx: number, altIdx: number) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const b = { ...blocks[blockIdx] }
      const alts = [...b.alternatives]
      alts.splice(altIdx, 1)
      b.alternatives = alts
      blocks[blockIdx] = b
      return { ...day, blocks }
    })
    showToast('已删除备选')
  }

  function openAddAlt() {
    if (open) setEditing({ kind: 'create', variant: 'alt', dayIdx: open.dayIdx, blockIdx: open.blockIdx })
  }
  function openEditAlt(altIdx: number) {
    if (open) setEditing({ kind: 'edit', variant: 'alt', dayIdx: open.dayIdx, blockIdx: open.blockIdx, altIdx })
  }
  function deleteAltCurrent(altIdx: number) {
    if (open) deleteAlternative(open.dayIdx, open.blockIdx, altIdx)
  }

  /* ── Block CRUD ── */
  function addBlock(dayIdx: number, patch: { type: BlockType; startTime: string; endTime: string; primary: Block['primary'] }) {
    mutateDay(dayIdx, day => {
      const block: Block = {
        id: 'b-' + Date.now(), type: patch.type, startTime: patch.startTime, endTime: patch.endTime,
        status: 'planned', primary: patch.primary, alternatives: [], transportToNext: [],
      }
      const blocks = [...day.blocks, block]
      return { ...day, blocks: flagConflicts(sortByStart(blocks)) }
    })
    showToast(`已加入「${patch.primary.name}」`)
  }

  function updateBlock(dayIdx: number, blockIdx: number, patch: { type: BlockType; startTime: string; endTime: string; primary: Block['primary'] }) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      const old = blocks[blockIdx]
      blocks[blockIdx] = { ...old, type: patch.type, startTime: patch.startTime, endTime: patch.endTime, primary: { ...old.primary, ...patch.primary } }
      return { ...day, blocks: flagConflicts(sortByStart(blocks)) }
    })
    showToast('已保存修改')
  }

  function deleteBlock(dayIdx: number, blockIdx: number) {
    mutateDay(dayIdx, day => {
      const blocks = [...day.blocks]
      blocks.splice(blockIdx, 1)
      return { ...day, blocks: flagConflicts(blocks) }
    })
    setOpen(null); setEditing(null); setConfirmDel(null)
    showToast('已删除该项')
  }

  function openCreate(dayIdx: number) {
    setOpen(null)
    setEditing({ kind: 'create', dayIdx, defaultStart: nextStartFor(trip.days[dayIdx]) })
  }
  function openEditCurrent() {
    if (!open) return
    setEditing({ kind: 'edit', dayIdx: open.dayIdx, blockIdx: open.blockIdx })
    setOpen(null)
  }
  function requestDeleteCurrent() {
    if (!open) return
    const b = trip.days[open.dayIdx].blocks[open.blockIdx]
    setConfirmDel({ dayIdx: open.dayIdx, blockIdx: open.blockIdx, name: b.primary.name })
  }
  function saveEditor(result: { type: BlockType; startTime: string; endTime: string; primary: Block['primary']; option?: Block['primary'] }) {
    if (!editing) return
    if (editing.variant === 'alt' && result.option) {
      if (editing.kind === 'create') addAlternative(editing.dayIdx, editing.blockIdx!, result.option)
      else updateAlternative(editing.dayIdx, editing.blockIdx!, editing.altIdx!, result.option)
    } else {
      if (editing.kind === 'create') addBlock(editing.dayIdx, result)
      else updateBlock(editing.dayIdx, editing.blockIdx!, result)
    }
    setEditing(null)
  }
  function editorDelete() {
    if (!editing) return
    if (editing.variant === 'alt') {
      deleteAlternative(editing.dayIdx, editing.blockIdx!, editing.altIdx!)
      setEditing(null)
    } else if (editing.kind === 'edit') {
      setConfirmDel({ dayIdx: editing.dayIdx, blockIdx: editing.blockIdx!, name: trip.days[editing.dayIdx].blocks[editing.blockIdx!].primary.name })
    }
  }

  /* ── Drag reorder ── */
  function moveBlock(src: { dayIdx: number; blockIdx: number }, targetDayIdx: number, dropMin: number) {
    setTrip(prev => {
      const t = cloneTrip(prev)
      const srcDay = t.days[src.dayIdx]
      const [moved] = srcDay.blocks.splice(src.blockIdx, 1)
      const target = t.days[targetDayIdx]
      let insertAt = target.blocks.findIndex(b => toMin(b.startTime)! > dropMin)
      if (insertAt === -1) insertAt = target.blocks.length
      target.blocks.splice(insertAt, 0, moved)
      t.days[src.dayIdx] = recalcDay(t.days[src.dayIdx])
      if (targetDayIdx !== src.dayIdx) t.days[targetDayIdx] = recalcDay(t.days[targetDayIdx])
      return t
    })
    showToast(src.dayIdx === targetDayIdx ? '已重排 · 时间重算' : `已移动到 Day ${targetDayIdx + 1} · 时间重算`)
  }

  function reorder(dayIdx: number, from: number, to: number) {
    setTrip(prev => {
      const t = cloneTrip(prev)
      const blocks = t.days[dayIdx].blocks
      const [m] = blocks.splice(from, 1)
      blocks.splice(to, 0, m)
      t.days[dayIdx] = recalcDay(t.days[dayIdx])
      return t
    })
    showToast('已重排 · 时间重算')
  }

  void reorder

  function reorderDayByIds(dayIdx: number, ids: string[]) {
    setTrip(prev => {
      const t = cloneTrip(prev)
      const blocks = t.days[dayIdx].blocks
      const byId = Object.fromEntries(blocks.map(b => [b.id, b]))
      const next = ids.map(id => byId[id]).filter(Boolean)
      if (next.length === blocks.length) t.days[dayIdx].blocks = next
      t.days[dayIdx] = recalcDay(t.days[dayIdx])
      return t
    })
    showToast('已重排 · 时间重算')
  }

  /* ── Plan B ── */
  function applyScenario(reason: SwapReason) {
    setTrip(prev => {
      const t = cloneTrip(prev)
      t.days.forEach(day => {
        day.blocks.forEach(b => {
          const ai = (b.alternatives || []).findIndex(a => a.swapReason === reason)
          if (ai !== -1) {
            const old = b.primary
            b.primary = b.alternatives[ai]
            b.alternatives[ai] = old
          }
        })
        day.blocks = flagConflicts(day.blocks)
      })
      return t
    })
    showToast(`已切到「${SCENARIO_META[reason].zh.replace('备选', '方案')}」`)
  }
  function setPrimaryAtGlobal(dayIdx: number, blockIdx: number, altIdx: number) { setPrimaryAlt(dayIdx, blockIdx, altIdx) }
  function resetPlan() { const original = getTrip(trip.id); if (original) setTrip(cloneTrip(original)); showToast('已全部还原') }

  /* ── nowInfo (execute mode) ── */
  const nowInfo = useMemo(() => {
    if (mode !== 'execute') return null
    const day = trip.days[activeDay]
    let blockIdx: number | null = null
    let nextBlockIdx: number | null = null
    for (let i = 0; i < day.blocks.length; i++) {
      const s = toMin(day.blocks[i].startTime)
      const e = day.blocks[i].endTime === '次日' ? 24 * 60 : toMin(day.blocks[i].endTime)
      if (s != null && e != null && nowMin >= s && nowMin < e) blockIdx = i
    }
    for (let i = 0; i < day.blocks.length; i++) {
      const s = toMin(day.blocks[i].startTime)
      if (s != null && s > nowMin) { nextBlockIdx = i; break }
    }
    return { dayIdx: activeDay, min: nowMin, blockIdx, nextBlockIdx }
  }, [mode, trip, activeDay, nowMin])

  const showGrid = !isMobile && !planB && mode !== 'share'

  /* Editor helpers */
  const editorVariant = editing?.variant || 'block'
  let editorInitial: unknown = null
  let editorBlockType: BlockType | undefined
  if (editing && editing.blockIdx != null) {
    const blk = trip.days[editing.dayIdx].blocks[editing.blockIdx]
    if (editorVariant === 'alt') {
      editorBlockType = blk.type
      editorInitial = editing.kind === 'edit' ? { type: blk.type, primary: blk.alternatives[editing.altIdx!] } : null
    } else {
      editorInitial = editing.kind === 'edit' ? blk : null
    }
  }

  const detailProps = open && openBlock ? {
    block: openBlock, mode,
    onClose: () => setOpen(null),
    onSetPrimary, onAddAlt: openAddAlt, onEditAlt: openEditAlt, onDeleteAlt: deleteAltCurrent,
    onToggleStatus: toggleStatus, onEdit: openEditCurrent, onDelete: requestDeleteCurrent,
    transport: bindTransport(open.dayIdx, open.blockIdx),
  } : null

  return (
    <div className="relative flex h-full flex-col">
      {view === 'trip' && (
        <TopBar
          trip={trip} mode={mode} planB={planB} isMobile={isMobile} nowMin={nowMin}
          onSetMode={m => { setMode(m); setPlanB(false) }}
          onTogglePlanB={() => setPlanB(p => !p)}
          onShowHelp={() => setShowHelp(true)}
          onShowTrip={() => setShowTrip(true)}
          onGoHome={handleGoHome}
          activeDay={activeDay} onSetActiveDay={setActiveDay} onSetNowMin={setNowMin}
        />
      )}

      <main className="relative min-h-0 flex-1">
        {view === 'home' ? (
          marketplace ? (
            <MarketplaceView
              onCopyTrip={handleCopyFromMarketplace}
              onBack={() => setMarketplace(false)}
              myShareIds={myShareIds}
              showToast={showToast}
            />
          ) : (
          <HomeView
            trips={trips}
            onSelectTrip={handleSelectTrip}
            onCreateTrip={() => setShowCreateTrip(true)}
            onDeleteTrip={deleteTrip}
            onForkTemplate={handleForkTemplate}
            onDuplicateTrip={handleDuplicateTrip}
            onOpenMarketplace={() => setMarketplace(true)}
          />
          )
        ) : (
        <>
        <AnimatePresence mode="wait">
        {planB ? (
          <motion.div key="planB" className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={animTr({ duration: 0.2, ease: 'easeOut' })}
          >
          <PlanBView trip={trip} baselineTrip={baseline} baselineTotals={baselineTotals}
            onApplyScenario={applyScenario} onSetPrimaryAt={setPrimaryAtGlobal} onReset={resetPlan} />
          </motion.div>
        ) : mode === 'share' ? (
          <motion.div key="share" className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={animTr({ duration: 0.2, ease: 'easeOut' })}
          >
          <ShareView
            trip={trip}
            published={published}
            dirty={dirty}
            publishing={publishing}
            version={trip?.id ? (getInfo(trip.id)?.version) : undefined}
            shareCode={trip?.id ? (getInfo(trip.id)?.share_code) : undefined}
            nickname={nickname}
            onNicknameChange={n => { setNickname(n); try { localStorage.setItem('tt_nickname', n) } catch {} }}
            onPublish={handlePublish}
            onSync={handleSync}
            onRestore={handleRestore}
            onUnpublish={handleUnpublish}
          />
          </motion.div>
        ) : showGrid ? (
          <motion.div key="grid" className="h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={animTr({ duration: 0.2, ease: 'easeOut' })}
          >
          <ScheduleGrid trip={trip} mode={mode}
            onOpenBlock={(d, b) => setOpen({ dayIdx: d, blockIdx: b })}
            onMoveBlock={moveBlock} onAddBlock={openCreate} onAddDay={addDay}
            onDayHeaderClick={setDayPanel} nowInfo={nowInfo} />
          </motion.div>
        ) : (
          <motion.div key="timeline" className="flex h-full flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={animTr({ duration: 0.2, ease: 'easeOut' })}
          >
            <DayTabs trip={trip} activeIdx={activeDay} onPick={setActiveDay}
              onAddDay={mode === 'plan' ? addDay : undefined}
              onDayHeaderClick={mode === 'plan' ? setDayPanel : undefined}
              editable={mode === 'plan'} />
            <div className="min-h-0 flex-1">
              <DayTimeline trip={trip} activeIdx={activeDay} mode={mode}
                onOpenBlock={(d, b) => setOpen({ dayIdx: d, blockIdx: b })}
                onReorderIds={reorderDayByIds} onAddBlock={openCreate}
                transportBinder={bindTransport} nowInfo={nowInfo} />
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {open && detailProps && (
        <AnimatePresence>
          {isMobile
            ? <BlockSheet key="detail-panel" {...detailProps} />
            : <BlockDrawer key="detail-panel" {...detailProps} />
          }
        </AnimatePresence>
        )}

        {editing && (
          <BlockEditor
            kind={editing.kind} variant={editorVariant} blockType={editorBlockType}
            initial={editorInitial as { type: BlockType; primary: Block['primary'] } | null | undefined} defaultStart={editing.defaultStart}
            onSave={saveEditor} onCancel={() => setEditing(null)} onDelete={editorDelete}
          />
        )}

        {confirmDel && (
          <ConfirmDialog danger title="删除这一项？"
            body={`「${confirmDel.name}」将从行程中移除，此操作不影响其它卡片。`}
            confirmText="删除"
            onConfirm={() => deleteBlock(confirmDel.dayIdx, confirmDel.blockIdx)}
            onCancel={() => setConfirmDel(null)} />
        )}
        </>
        )}
      </main>

      {toast && (
        <div className="float-in absolute bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_10px_26px_rgba(0,0,0,.25)]">
          {toast}
        </div>
      )}

      {showHelp && <HelpOverlay onClose={closeHelp} />}

      {view === 'trip' && showTrip && <TripPanel trip={trip} isMobile={isMobile} onClose={() => setShowTrip(false)}
        onUpdateTrip={updateTrip} onUpdateDay={updateDay} onAddDay={addDay} onDeleteDay={deleteDay}
        onPickDay={i => { setActiveDay(i); setShowTrip(false) }}
        allTrips={trips} activeTripId={activeTripId}
        onSwitchTrip={handleSwitchTrip} onGoHome={handleGoHome}
        onDuplicateTrip={() => handleDuplicateTrip(trip.id)} />}

      {view === 'trip' && dayPanel !== null && (
        <DayPanel
          dayIdx={dayPanel}
          day={trip.days[dayPanel]}
          isMobile={isMobile}
          onClose={() => setDayPanel(null)}
          onUpdate={patch => updateDay(dayPanel, patch)}
          onDelete={() => { deleteDay(dayPanel); setDayPanel(null) }}
          dayCount={trip.days.length}
        />
      )}

      {showCreateTrip && (
        <TripCreateDialog
          onConfirm={handleCreateTrip}
          onCancel={() => setShowCreateTrip(false)}
        />
      )}

      {view === 'trip' && mode === 'plan' && !planB && !open && (
        <div className="absolute bottom-4 left-4 z-20 rounded-[10px] bg-white/80 px-3 py-1.5 text-xs text-ink3 shadow-soft">
          {isMobile ? '长按拖动卡片可重排顺序' : '拖动卡片到别的天 / 别的时段，时间会自动重算'}
        </div>
      )}
    </div>
  )
}
