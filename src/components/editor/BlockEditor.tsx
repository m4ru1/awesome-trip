import { useState } from 'react'
import type { BlockType, Option, SwapReason } from '@/types'
import { TYPE_META, SCENARIO_META } from '@/data/constants'
import EdField from '@/components/ui/EdField'
import EdInput from '@/components/ui/EdInput'
import EmojiPicker from '@/components/ui/EmojiPicker'
import NumberSpinner from '@/components/ui/NumberSpinner'
import { toMin, fmt } from '@/utils/time'

interface Props {
  kind: 'create' | 'edit'
  variant: 'block' | 'alt'
  blockType?: BlockType
  initial?: { type: BlockType; primary: Option } | null
  defaultStart?: string
  onSave: (result: { type: BlockType; startTime: string; endTime: string; primary: Option; option?: Option }) => void
  onCancel: () => void
  onDelete: () => void
}

type PrimState = {
  name: string; emoji: string; address: string; highlight: string; tags: string[]
  id?: string; swapReason?: SwapReason
  openHours?: string; ticketPrice?: string; suggestedDuration?: string
  cuisine?: string; perPersonCost?: string; budgetLevel?: 1 | 2 | 3
  signatureDishes?: string[]; reservationNeeded?: boolean
  pricePerNight?: string; rating?: number; checkIn?: string; checkOut?: string
  amenities?: string[]
}

export default function BlockEditor({ kind, variant, blockType, initial, defaultStart, onSave, onCancel, onDelete }: Props) {
  const isEdit = kind === 'edit'
  const isAlt = variant === 'alt'
  const seedStart = (initial as Record<string, unknown> | null)?.startTime as string || defaultStart || '09:00'
  const seedEnd = (initial as Record<string, unknown> | null)?.endTime as string || fmt((toMin(seedStart) ?? 540) + 60)

  const [type, setType] = useState<BlockType>(initial?.type ?? blockType ?? 'sight')
  const [startTime, setStart] = useState(seedStart)
  const [endTime, setEnd] = useState(seedEnd)
  const [overnight, setOvernight] = useState((initial as Record<string, unknown> | null)?.endTime === '次日')
  const [p, setP] = useState<PrimState>(() => {
    const prim = initial?.primary
    return {
      name: prim?.name ?? '', emoji: prim?.emoji ?? '', address: prim?.address ?? '',
      highlight: prim?.highlight ?? '', tags: prim?.tags ?? [],
      openHours: prim?.openHours ?? '', ticketPrice: prim?.ticketPrice ?? '',
      suggestedDuration: prim?.suggestedDuration ?? '', cuisine: prim?.cuisine ?? '',
      perPersonCost: prim?.perPersonCost ?? '', budgetLevel: prim?.budgetLevel,
      signatureDishes: prim?.signatureDishes, reservationNeeded: prim?.reservationNeeded,
      pricePerNight: prim?.pricePerNight ?? '', rating: prim?.rating,
      checkIn: prim?.checkIn ?? '', checkOut: prim?.checkOut ?? '',
      amenities: prim?.amenities, swapReason: prim?.swapReason, id: prim?.id,
    }
  })
  const [reason, setReason] = useState<SwapReason>(initial?.primary?.swapReason ?? 'like')
  const [tried, setTried] = useState(false)

  const up = (k: string, v: string | number | boolean | string[] | undefined) => setP(prev => ({ ...prev, [k]: v }))
  const m = TYPE_META[type]
  const nameOk = (p.name || '').trim().length > 0

  function save() {
    if (!nameOk) { setTried(true); return }
    const prim = { ...p, name: p.name.trim(), emoji: p.emoji || m.emoji, id: p.id || (isAlt ? 'alt-' : 'opt-') + Date.now() } as Option
    if (isAlt) {
      prim.swapReason = reason
      onSave({ type, startTime: '', endTime: '', primary: {} as Option, option: prim })
    } else {
      onSave({ type, startTime, endTime: overnight ? '次日' : endTime, primary: prim })
    }
  }

  const showStay = type === 'rest'
  const showFood = type === 'meal'
  const showVisit = type === 'sight' || type === 'free' || type === 'transport'

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(43,45,51,.42)', backdropFilter: 'blur(3px)', animation: 'fadeIn .18s ease' }}
      onClick={onCancel}
    >
      <div
        className="float-in flex max-h-[80%] max-[860px]:max-h-[70%] w-full max-w-[460px] flex-col overflow-hidden rounded-[22px] bg-white"
        style={{ boxShadow: '0 24px 60px rgba(43,45,51,.34)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4" style={{ background: m.soft }}>
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white text-xl" style={{ boxShadow: `0 3px 9px ${m.color}30` }}>
            {p.emoji || m.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="title-cn text-[17px] font-extrabold">
              {isAlt ? (isEdit ? '编辑备选' : '新增备选') : (isEdit ? '编辑行程' : '新增一项行程')}
            </div>
            <div className="text-xs text-ink2">
              {isAlt ? '存一个候选，随时一键换成主选' : (isEdit ? '改完点保存，时间会自动重排该天顺序' : '填好后会按时间插入到当天')}
            </div>
          </div>
          <button onClick={onCancel} className="h-8 w-8 cursor-pointer rounded-full border-none bg-white text-[15px] shadow-[0_2px_6px_rgba(0,0,0,.1)]">✕</button>
        </div>

        {/* Form body */}
        <div className="overscroll-contain overflow-y-auto px-5 py-4">
          {/* Scenario reason (alt only) */}
          {isAlt && (
            <EdField label="什么情况下换它" hint="会显示成彩色标签，也能在 Plan B 里成套切换">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SCENARIO_META) as SwapReason[]).map(key => {
                  const s = SCENARIO_META[key]
                  const on = reason === key
                  return (
                    <button key={key} onClick={() => setReason(key)} className="cursor-pointer rounded-full px-3 py-[7px] text-[13px] font-bold transition-all duration-150"
                      style={{ border: `1.5px solid ${on ? s.color : 'var(--color-line)'}`, background: on ? s.color : '#fff', color: on ? '#fff' : 'var(--color-ink2)', boxShadow: on ? `0 3px 9px ${s.color}55` : 'none' }}>
                      {s.emoji} {s.zh}
                    </button>
                  )
                })}
              </div>
            </EdField>
          )}

          {/* Type selector (block only) */}
          {!isAlt && (
            <EdField label="类型">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_META) as BlockType[]).map(key => {
                  const tm = TYPE_META[key]
                  const on = type === key
                  return (
                    <button key={key} onClick={() => setType(key)} className="cursor-pointer rounded-full px-3 py-[7px] text-[13px] font-bold transition-all duration-150"
                      style={{ border: `1.5px solid ${on ? tm.color : 'var(--color-line)'}`, background: on ? tm.soft : '#fff', color: on ? tm.color : 'var(--color-ink2)' }}>
                      {tm.emoji} {tm.zh}
                    </button>
                  )
                })}
              </div>
            </EdField>
          )}

          {/* Emoji + Name */}
          <EdField label="名称" hint="必填">
            <div className="flex gap-2">
              <EmojiPicker value={p.emoji || ''} onChange={v => up('emoji', v)} placeholder={m.emoji} />
              <EdInput value={p.name || ''} onChange={v => up('name', v)} placeholder="例如：清水寺 + 二三年坂" />
            </div>
            {tried && !nameOk && <div className="mt-1.5 text-[11.5px] font-bold text-brand">请填写名称</div>}
          </EdField>

          {/* Time (block only) */}
          {!isAlt && (
            <EdField label="时间">
              <div className="flex items-center gap-2">
                <input type="time" value={startTime} onChange={e => setStart(e.target.value)} className="num flex-1 rounded-xl border-[1.5px] border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none" />
                <span className="font-bold text-ink3">→</span>
                {overnight ? (
                  <div className="flex-1 rounded-xl border-[1.5px] border-dashed border-rest bg-rest-soft px-3 py-2.5 text-center text-sm font-bold text-rest">次日</div>
                ) : (
                  <input type="time" value={endTime} onChange={e => setEnd(e.target.value)} className="num flex-1 rounded-xl border-[1.5px] border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink outline-none" />
                )}
              </div>
              {type === 'rest' && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12.5px] text-ink2">
                  <input type="checkbox" checked={overnight} onChange={e => setOvernight(e.target.checked)} className="h-4 w-4 accent-rest" />
                  住宿 / 过夜（结束记为「次日」）
                </label>
              )}
            </EdField>
          )}

          {/* Address */}
          <EdField label="地址" hint="选填">
            <EdInput value={p.address || ''} onChange={v => up('address', v)} placeholder="例如：东山区清水1丁目294" />
          </EdField>

          {/* Type-specific fields */}
          {showVisit && (
            <div className="grid grid-cols-2 max-[860px]:grid-cols-1 gap-3">
              <EdField label="开放时间" hint="选填"><EdInput value={p.openHours || ''} onChange={v => up('openHours', v)} placeholder="08:30–16:00" /></EdField>
              <EdField label="门票" hint="选填"><EdInput value={p.ticketPrice || ''} onChange={v => up('ticketPrice', v)} placeholder="¥1,000 / 免费" /></EdField>
              <EdField label="建议时长" hint="选填"><EdInput value={p.suggestedDuration || ''} onChange={v => up('suggestedDuration', v)} placeholder="2 小时" /></EdField>
            </div>
          )}
          {showFood && (
            <div className="grid grid-cols-2 max-[860px]:grid-cols-1 gap-3">
              <EdField label="菜系" hint="选填"><EdInput value={p.cuisine || ''} onChange={v => up('cuisine', v)} placeholder="日式鳗鱼" /></EdField>
              <EdField label="人均花费" hint="选填"><EdInput value={p.perPersonCost || ''} onChange={v => up('perPersonCost', v)} placeholder="¥3,200" /></EdField>
              <EdField label="预算等级">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(lv => (
                    <button key={lv} onClick={() => up('budgetLevel', lv)} className="flex-1 cursor-pointer rounded-[10px] py-2 text-[13px] font-bold"
                      style={{ border: `1.5px solid ${(p.budgetLevel ?? 1) === lv ? 'var(--color-meal)' : 'var(--color-line)'}`, background: (p.budgetLevel ?? 1) === lv ? 'var(--color-meal-soft)' : '#fff' }}>
                      {'💰'.repeat(lv)}
                    </button>
                  ))}
                </div>
              </EdField>
              <EdField label="是否预订">
                <label className="flex cursor-pointer items-center gap-2 py-2.5 text-[13px] text-ink2">
                  <input type="checkbox" checked={!!p.reservationNeeded} onChange={e => up('reservationNeeded', e.target.checked)} className="h-4 w-4 accent-meal" />
                  建议提前预订
                </label>
              </EdField>
            </div>
          )}
          {showStay && (
            <div className="grid grid-cols-2 max-[860px]:grid-cols-1 gap-3">
              <EdField label="每晚价" hint="选填"><EdInput value={p.pricePerNight || ''} onChange={v => up('pricePerNight', v)} placeholder="¥2,400" /></EdField>
              <EdField label="评分" hint="选填">
                <NumberSpinner value={p.rating ?? null} onChange={v => up('rating', v ?? undefined)} min={0} max={5} step={0.5} placeholder="评分" />
              </EdField>
              <EdField label="入住"><EdInput value={p.checkIn || ''} onChange={v => up('checkIn', v)} placeholder="15:00" /></EdField>
              <EdField label="退房"><EdInput value={p.checkOut || ''} onChange={v => up('checkOut', v)} placeholder="11:00" /></EdField>
            </div>
          )}

          {/* Highlight */}
          <EdField label="亮点 / 备注" hint="选填">
            <textarea value={p.highlight || ''} onChange={e => up('highlight', e.target.value)} placeholder="一句话写下为什么值得来这一站…" rows={2}
              className="w-full resize-y rounded-xl border-[1.5px] border-line bg-white px-3 py-2.5 text-[13.5px] leading-snug text-ink outline-none" style={{ fontFamily: 'var(--font-cn-body)' }} />
          </EdField>

          {/* Tags */}
          <EdField label="标签" hint="自由添加，按回车确认">
            <div className="flex flex-wrap gap-2">
              {(p.tags ?? []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
                  style={{ background: m.soft, color: m.color, border: `1px solid ${m.color}33` }}>
                  {t}
                  <button onClick={() => up('tags', (p.tags ?? []).filter((_, j) => j !== i))}
                    className="ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-none text-[10px]"
                    style={{ background: 'rgba(0,0,0,.08)', color: m.color }}>✕</button>
                </span>
              ))}
              <input
                placeholder={((p.tags ?? []).length === 0 ? '例如：赏枫名所、世界遗产' : '＋ 添加标签')}
                className="min-w-[120px] flex-1 rounded-xl border-[1.5px] border-dashed border-line bg-transparent px-3 py-1.5 text-[12.5px] text-ink outline-none"
                style={{ fontFamily: 'var(--font-cn-body)' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const v = (e.target as HTMLInputElement).value.trim()
                    if (v) { up('tags', [...(p.tags ?? []), v]); (e.target as HTMLInputElement).value = '' }
                  }
                }}
              />
            </div>
          </EdField>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-line bg-[#FFFDFA] px-5 py-3">
          {isEdit && (
            <button onClick={onDelete} className="btn text-[13px]" style={{ background: 'rgba(255,107,92,.1)', color: 'var(--color-brand)' }}>🗑️ 删除</button>
          )}
          <span className="flex-1" />
          <button onClick={onCancel} className="btn btn-soft">取消</button>
          <button onClick={save} className="btn btn-primary">{isEdit ? '保存修改' : (isAlt ? '＋ 加为备选' : '＋ 加入行程')}</button>
        </div>
      </div>
    </div>
  )
}
