import { useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import type { Trip } from '@/types'

interface Props {
  trips: Trip[]
  onSelectTrip: (id: string) => void
  onCreateTrip: () => void
  onDeleteTrip: (id: string) => void
  onForkTemplate?: () => void
  onDuplicateTrip?: (id: string) => void
}

function tripSummary(t: Trip): string {
  const parts: string[] = []
  if (t.days.length) parts.push(`${t.days.length}天`)
  const blockCount = t.days.reduce((s, d) => s + d.blocks.length, 0)
  if (blockCount) parts.push(`${blockCount}项`)
  if (t.dateRange) parts.push(t.dateRange)
  return parts.join(' · ')
}

export default function HomeView({ trips, onSelectTrip, onCreateTrip, onDeleteTrip, onForkTemplate, onDuplicateTrip }: Props): ReactNode {
  const [deleting, setDeleting] = useState<string | null>(null)
  const { enabled, toggle } = useAnimation()
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-line)' }}
      >
        <span className="text-2xl">{'✈️'}</span>
        <span className="title-cn flex-1 text-[22px] font-extrabold text-ink">我的旅行</span>
        <button
          onClick={toggle}
          className="btn btn-ghost h-9 !px-2.5 text-sm flex items-center justify-center gap-1"
          title={enabled ? '动效已开启，点击关闭' : '动效已关闭，点击开启'}
        >
          ✨
          <span style={{ fontSize: 10, fontWeight: 700, opacity: enabled ? 1 : 0.4 }}>
            {enabled ? 'ON' : 'OFF'}
          </span>
        </button>
        <button
          onClick={onCreateTrip}
          className="rounded-2xl px-4 py-2 text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 14px rgba(255,107,92,.3)' }}
        >
          + 新建
        </button>
      </div>

      <motion.div ref={rubberRef} className="overscroll-none overflow-y-auto p-5" style={{ y: rubberY }}>
        {trips.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 text-6xl">{'🗺️'}</div>
            <div className="title-cn mb-1 text-2xl font-extrabold text-ink">欢迎使用 Awesome Trip</div>
            <div className="mb-10 text-sm text-ink3">开始规划你的第一次旅行</div>

            <button
              onClick={onForkTemplate}
              className="mb-4 w-full max-w-sm rounded-2xl border border-line bg-white p-5 text-left shadow-soft cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-pop"
              style={{ border: '1.5px solid var(--color-line)' }}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl"
                  style={{ background: 'linear-gradient(140deg, #FF8A4C, #FF6B5C)' }}>
                  {'🍁'}
                </span>
                <div className="flex-1">
                  <div className="title-cn text-[17px] font-extrabold text-ink">京都赏枫 5 日</div>
                  <div className="mt-1 text-xs text-ink2 clamp-1">追着红叶，慢慢走过古都的秋天</div>
                  <div className="mt-2 text-[11.5px] text-ink3">5天 · 26项 · 11/14 – 11/18</div>
                </div>
                <span className="text-sm font-bold text-brand">{'从模板开始 →'}</span>
              </div>
            </button>

            <button
              onClick={onCreateTrip}
              style={{
                background: 'rgba(255,255,255,.5)',
                border: '2px dashed #D8C7B2',
                borderRadius: 20,
                padding: '20px 18px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 140,
                width: '100%',
                maxWidth: '24rem',
                transition: 'all .2s var(--ease-spring)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-brand)'
                e.currentTarget.style.background = 'rgba(255,255,255,.8)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#D8C7B2'
                e.currentTarget.style.background = 'rgba(255,255,255,.5)'
              }}
            >
              <span style={{ fontSize: 32, color: 'var(--color-ink3)' }}>+</span>
              <span className="text-sm font-bold text-ink2">自己创建一个</span>
            </button>
          </div>
        ) : (
        <motion.div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <AnimatePresence initial={false}>
          {trips.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={enabled ? { scale: 0.9, opacity: 0 } : { opacity: 0 }}
              transition={enabled ? { duration: 0.3, delay: i * 0.06, ease: 'easeOut' } : { duration: 0 }}
              onClick={() => onSelectTrip(t.id)}
              style={{
                position: 'relative',
                background: '#fff',
                border: '1.5px solid var(--color-line)',
                borderRadius: 20,
                padding: '20px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: 'var(--shadow-soft)',
                transition: 'border-color .2s, box-shadow .2s',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-brand)'
                e.currentTarget.style.boxShadow = 'var(--shadow-pop)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-line)'
                e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
              }}
            >
              <span
                className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl"
                style={{ background: `linear-gradient(140deg, ${t.coverColor || '#FF8A4C'}, #FF6B5C)` }}
              >
                {t.coverEmoji || '✈️'}
              </span>
              <div className="title-cn text-[17px] font-extrabold text-ink">{t.title}</div>
              {t.subtitle && <div className="mt-1 text-xs text-ink2 clamp-1">{t.subtitle}</div>}
              <div className="mt-2 text-[11.5px] text-ink3">{tripSummary(t)}</div>
              {t.party && <div className="mt-1 text-[11px] text-ink3">{t.party}</div>}

              <div className="absolute top-2 right-2 flex gap-1">
                {deleting === t.id ? (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDeleteTrip(t.id)
                        setDeleting(null)
                      }}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 8,
                        padding: '4px 10px',
                        background: 'var(--color-brand)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      确认删除
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setDeleting(null)
                      }}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 8,
                        padding: '4px 8px',
                        background: 'transparent',
                        color: 'var(--color-ink3)',
                        fontSize: 12,
                      }}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    {onDuplicateTrip && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onDuplicateTrip(t.id)
                        }}
                        title="复制"
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: 10,
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          color: 'var(--color-ink3)',
                          fontSize: 15,
                          opacity: 0.5,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                      >
                        {'⧉'}
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setDeleting(t.id)
                      }}
                      title="删除"
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 10,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        color: 'var(--color-ink3)',
                        fontSize: 16,
                        opacity: 0.5,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.5' }}
                    >
                      {'⋯'}
                    </button>
                  </>
                )}
              </div>
            </motion.button>
          ))}
          </AnimatePresence>

          <button
            onClick={onCreateTrip}
            style={{
              background: 'rgba(255,255,255,.5)',
              border: '2px dashed #D8C7B2',
              borderRadius: 20,
              padding: '20px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 180,
              transition: 'all .2s var(--ease-spring)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-brand)'
              e.currentTarget.style.background = 'rgba(255,255,255,.8)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#D8C7B2'
              e.currentTarget.style.background = 'rgba(255,255,255,.5)'
            }}
          >
            <span style={{ fontSize: 32, color: 'var(--color-ink3)' }}>+</span>
            <span className="text-sm font-bold text-ink2">新建旅行</span>
          </button>
        </motion.div>
        )}
      </motion.div>
    </div>
  )
}
