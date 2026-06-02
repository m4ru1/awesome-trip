import type { Block, Day } from '@/types'
import { toMin, fmt, parseTransportMin, parseOpenHours } from './time'

export function withDurations(day: Day): Day {
  return {
    ...day,
    blocks: day.blocks.map(b => {
      let dur = 0
      const s = toMin(b.startTime), e = toMin(b.endTime)
      if (s != null && e != null) dur = e - s
      else if (b.endTime === '次日') dur = 0
      else dur = 60
      return { ...b, _durMin: b._durMin != null ? b._durMin : dur }
    }),
  }
}

export function recalcDay(day: Day): Day {
  const d = withDurations(day)
  const blocks = d.blocks.map(b => ({ ...b }))
  let cursor = blocks.length > 0 ? toMin(blocks[0].startTime) : null
  if (cursor == null) cursor = 9 * 60

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    b.startTime = fmt(cursor)
    if (b.endTime !== '次日') b.endTime = fmt(cursor + b._durMin!)
    cursor += b._durMin!

    b.conflict = null
    const oh = parseOpenHours(b.primary?.openHours ?? '')
    if (oh) {
      const endM = toMin(b.endTime)
      if (endM != null && endM > oh.close)
        b.conflict = { kind: 'close', msg: `晚于闭馆 ${fmt(oh.close)}，建议提前或缩短` }
      else if (toMin(b.startTime)! < oh.open)
        b.conflict = { kind: 'open', msg: `早于开门 ${fmt(oh.open)}` }
    }

    if (b.transportToNext?.primary)
      cursor += parseTransportMin(b.transportToNext.primary.duration)
  }
  return { ...day, blocks }
}

export function flagConflicts(blocks: Block[]): Block[] {
  return blocks.map(b => {
    const conflict: Block['conflict'] = null
    const oh = parseOpenHours(b.primary?.openHours ?? '')
    if (oh) {
      const endM = toMin(b.endTime)
      if (endM != null && endM > oh.close)
        return { ...b, conflict: { kind: 'close', msg: `晚于闭馆 ${fmt(oh.close)}，建议提前或缩短` } }
      if (toMin(b.startTime)! < oh.open)
        return { ...b, conflict: { kind: 'open', msg: `早于开门 ${fmt(oh.open)}` } }
    }
    return { ...b, conflict }
  })
}

export function sortByStart(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => {
    const am = toMin(a.startTime) ?? 0
    const bm = toMin(b.startTime) ?? 0
    return am - bm
  })
}

export function nextStartFor(day: Day): string {
  const blocks = day.blocks
  if (blocks.length === 0) return '09:00'
  const last = blocks[blocks.length - 1]
  if (last.endTime === '次日') return '09:00'
  const end = toMin(last.endTime)
  if (end == null) return '09:00'
  return fmt(end + 15)
}

export function shiftFrom(blocks: Block[], fromIdx: number, delta: number): Block[] {
  return blocks.map((b, i) => {
    if (i <= fromIdx) return b
    const s = toMin(b.startTime)
    const e = toMin(b.endTime)
    if (s == null) return b
    return {
      ...b,
      startTime: fmt(s + delta),
      endTime: b.endTime === '次日' ? b.endTime : (e != null ? fmt(e + delta) : b.endTime),
    }
  })
}
