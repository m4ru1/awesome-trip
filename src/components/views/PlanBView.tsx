import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import type { Trip, SwapReason } from '@/types'
import { SCENARIO_META, TYPE_META } from '@/data/constants'
import { tripTotals, planBStats } from '@/utils/totals'
import TypeTag from '@/components/ui/TypeTag'
import ScenarioChip from '@/components/ui/ScenarioChip'

import DiffSummary from './DiffSummary'
import OptionMiniCard from './OptionMiniCard'

const PLANB_SCENARIOS: SwapReason[] = ['rain', 'save', 'time', 'closed']

interface Props {
  trip: Trip
  baselineTrip: Trip
  baselineTotals: { money: number; transportMin: number; sightMin: number }
  onApplyScenario: (reason: SwapReason) => void
  onSetPrimaryAt: (dayIdx: number, blockIdx: number, altIdx: number) => void
  onReset: () => void
}

export default function PlanBView({ trip, baselineTrip, baselineTotals, onApplyScenario, onSetPrimaryAt, onReset }: Props) {
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()
  const list = useMemo(() => planBStats(trip), [trip])
  const current = useMemo(() => tripTotals(trip), [trip])

  let affected = 0
  trip.days.forEach((day, di) => day.blocks.forEach((b, bi) => {
    const base = baselineTrip.days[di]?.blocks[bi]
    if (base && base.primary.id !== b.primary.id) affected++
  }))

  const [activeScenario, setActiveScenario] = useState<SwapReason | null>(null)

  function applyScenario(r: SwapReason) {
    setActiveScenario(prev => prev === r ? null : r)
    onApplyScenario(r)
  }

  return (
    <motion.div ref={rubberRef} className="overscroll-none mx-auto h-full max-w-[1000px] overflow-y-auto px-5 pb-10 pt-[18px]" style={{ y: rubberY }}>
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="title-cn m-0 text-[26px]">Plan B · 备选总览</h2>
        <span className="text-[13px] text-ink2">共 {list.length} 个块带备选，按场景一键切换</span>
      </div>

      {/* Scenario batch switch */}
      <div className="mt-4 rounded-[18px] bg-paper2 p-4">
        <div className="mb-2.5 text-[13px] font-bold text-ink2">遇到情况了？一键切换整套方案 →</div>
        <div className="mb-3.5 flex flex-wrap gap-2.5">
          {PLANB_SCENARIOS.map(r => {
            const s = SCENARIO_META[r]
            const cnt = list.filter(x => x.block.alternatives.some(a => a.swapReason === r)).length
            const on = activeScenario === r
            return (
              <button key={r} disabled={!cnt} onClick={() => applyScenario(r)}
                className="rounded-[14px] px-[15px] py-2.5 text-[13.5px] font-bold transition-all duration-200"
                style={{
                  border: `2px solid ${on ? s.color : 'transparent'}`, cursor: cnt ? 'pointer' : 'not-allowed',
                  background: on ? s.color : '#fff', color: on ? '#fff' : (cnt ? 'var(--color-ink)' : 'var(--color-ink3)'),
                  boxShadow: on ? `0 6px 16px ${s.color}55` : 'var(--shadow-soft)', opacity: cnt ? 1 : .55,
                }}>
                {s.emoji} 全部切到{s.zh.replace('备选', '方案')} <span className="num text-xs opacity-70">· {cnt}</span>
              </button>
            )
          })}
          <button onClick={() => { setActiveScenario(null); onReset() }} className="btn btn-ghost ml-auto">↺ 全部还原</button>
        </div>
        <DiffSummary baseline={baselineTotals} current={current} affected={affected} />
      </div>

      {/* A/B comparison */}
      <div className="mt-[22px] flex flex-col gap-4">
        {list.map(({ dayIdx, blockIdx, block }) => {
          const base = baselineTrip.days[dayIdx]?.blocks[blockIdx]
          const swapped = base ? base.primary.id !== block.primary.id : false
          return (
            <div key={block.id} className="rounded-[18px] bg-white p-4 shadow-soft">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="num rounded-lg bg-paper2 px-2 py-0.5 text-xs font-bold">DAY {dayIdx + 1} · {block.startTime}</span>
                <TypeTag type={block.type} />
                {swapped && <span className="chip bg-brand text-white">已切换</span>}
              </div>
              <div className="flex flex-wrap items-stretch gap-3.5">
                <div className="min-w-[220px] flex-1">
                  <div className="mb-1.5 text-[11.5px] font-bold text-ink2">当前主选 (A)</div>
                  <OptionMiniCard option={block.primary} type={block.type}
                    badge={<span className="chip text-[11px]" style={{ background: TYPE_META[block.type].color, color: '#fff' }}>主选</span>} />
                </div>
                <div className="flex items-center text-[22px] text-ink3">⇄</div>
                <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                  <div className="-mt-0.5 mb-0 text-[11.5px] font-bold text-ink2">备选 (B)</div>
                  {block.alternatives.map((a, ai) => (
                    <div key={a.id} className="flex items-stretch gap-2">
                      <OptionMiniCard option={a} type={block.type} dim
                        badge={a.swapReason ? <ScenarioChip reason={a.swapReason} small /> : undefined} />
                      <button className="btn btn-soft shrink-0 self-center text-[12.5px]"
                        onClick={() => onSetPrimaryAt(dayIdx, blockIdx, ai)}>设为主选</button>
                    </div>
                  ))}
                  {swapped && base && (
                    <div className="text-[11.5px] text-ink3">原主选：{base.primary.emoji} {base.primary.name}（用「还原」切回）</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
