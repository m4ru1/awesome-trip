import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useWheelRubberBand } from '@/hooks/useWheelRubberBand'
import { fetchMarketplace, fetchMarketTrip, incrementCopyCount } from '@/api/marketplace'
import type { MarketplaceItem } from '@/api/marketplace'
import type { Trip } from '@/types'

interface Props {
  onCopyTrip: (trip: Trip, remixInfo?: { author: string; share_id: string; share_code: string }) => void
  onBack: () => void
  myShareIds: Set<string>
  showToast: (msg: string) => void
}

export default function MarketplaceView({ onCopyTrip, onBack, myShareIds, showToast }: Props) {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [sort, setSort] = useState<'newest' | 'popular'>('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { ref: rubberRef, y: rubberY } = useWheelRubberBand()

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchMarketplace(sort, q || undefined)
      setItems(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [sort])

  useEffect(() => { load() }, [load])

  // Debounced search
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      load(search.trim() || undefined)
    }, 300)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [search, load])

  const handleCopy = async (item: MarketplaceItem) => {
    // Own trip → hint, don't duplicate
    if (myShareIds.has(item.share_id)) {
      showToast('这是你自己的方案，无需复制')
      return
    }
    setCopying(item.share_id)
    try {
      const { trip } = await fetchMarketTrip(item.share_id)
      incrementCopyCount(item.share_id)
      const remixInfo = item.original_author
        ? { author: item.original_author, share_id: item.share_id, share_code: item.original_share_code || item.share_code }
        : { author: item.publisher_nickname || 'momo', share_id: item.share_id, share_code: item.share_code }
      onCopyTrip(trip as unknown as Trip, remixInfo)
    } catch (e) {
      setError(e instanceof Error ? e.message : '复制失败')
      setCopying(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex flex-col gap-2 px-5 py-3"
        style={{ borderBottom: '1px solid var(--color-line)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn btn-ghost h-9 !px-2.5 text-lg">
            ←
          </button>
          <span className="title-cn flex-1 text-[22px] font-extrabold text-ink">方案市场</span>
          <div className="flex rounded-xl bg-paper p-0.5 text-xs font-bold">
            <button
              onClick={() => setSort('newest')}
              className={`rounded-[10px] px-3 py-1.5 transition-colors ${
                sort === 'newest' ? 'bg-white text-brand shadow-soft' : 'text-ink2'
              }`}
            >
              最新
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`rounded-[10px] px-3 py-1.5 transition-colors ${
                sort === 'popular' ? 'bg-white text-brand shadow-soft' : 'text-ink2'
              }`}
            >
              最热
            </button>
          </div>
          <button onClick={() => load()} className="btn btn-ghost h-9 !px-2.5 text-lg" title="刷新">
            🔄
          </button>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink3">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索分享码或标题..."
            className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm font-bold text-ink outline-none transition-colors focus:border-brand"
          />
        </div>
      </div>

      {/* Content */}
      <motion.div ref={rubberRef} className="overscroll-none overflow-y-auto p-5" style={{ y: rubberY }}>
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="mb-3 text-4xl animate-pulse">⏳</div>
            <div className="text-sm text-ink2">加载中...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-20">
            <div className="mb-3 text-4xl">😵</div>
            <div className="mb-4 text-sm text-ink2">{error}</div>
            <button onClick={() => load()} className="btn btn-primary">重试</button>
          </div>
        ) : items.length === 0 && search ? (
          <div className="flex flex-col items-center py-20">
            <div className="mb-3 text-5xl">🔍</div>
            <div className="title-cn mb-1 text-lg font-extrabold text-ink">没有找到匹配的方案</div>
            <div className="text-sm text-ink2">试试其他分享码或关键词</div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="mb-3 text-5xl">📭</div>
            <div className="title-cn mb-1 text-lg font-extrabold text-ink">市场空空如也</div>
            <div className="text-sm text-ink2">还没有人发布过旅行方案</div>
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
              {items.map((item, i) => (
                <motion.div
                  key={item.share_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  style={{
                    background: '#fff',
                    border: `1.5px solid ${myShareIds.has(item.share_id) ? 'var(--color-brand)' : 'var(--color-line)'}`,
                    borderRadius: 20,
                    padding: '20px 18px',
                    boxShadow: 'var(--shadow-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-2xl"
                      style={{ background: 'linear-gradient(140deg, #FF8A4C, #FF6B5C)' }}
                    >
                      {item.cover_emoji || '🗺️'}
                    </span>
                    {myShareIds.has(item.share_id) && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                        📌 我的
                      </span>
                    )}
                  </div>
                  <div className="title-cn text-[17px] font-extrabold text-ink">{item.title}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.destination && (
                      <span className="chip text-[11px]">📍 {item.destination}</span>
                    )}
                    <span className="chip text-[11px]">📅 {item.days_count}天</span>
                    {item.party && (
                      <span className="chip text-[11px]">👫 {item.party}</span>
                    )}
                  </div>
                  {item.original_author && (
                    <div className="mt-1.5 text-[10px] text-ink3">
                      🎨 改编自 <span className="font-bold">{item.original_author}</span>
                      {item.original_share_code && (
                        <span className="ml-1 font-bold tracking-[1px] text-brand/60">· {item.original_share_code}</span>
                      )}
                    </div>
                  )}
                  <div className="mt-1 text-[10px] font-bold tracking-[1px] text-brand/70">
                    分享码 {item.share_code}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-ink3">
                    <span>👤 {item.publisher_nickname || 'momo'}</span>
                    <span>{item.copy_count} 次复制</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-ink3">
                    {item.updated_at
                      ? `更新于 ${new Date(item.updated_at).toLocaleDateString('zh-CN')}`
                      : new Date(item.published_at).toLocaleDateString('zh-CN')}
                    {item.version > 0 && ` · v${item.version}`}
                  </div>
                  <button
                    onClick={() => handleCopy(item)}
                    disabled={copying === item.share_id || myShareIds.has(item.share_id)}
                    className="mt-auto cursor-pointer"
                    style={{
                      marginTop: 14,
                      border: 'none',
                      borderRadius: 14,
                      padding: '10px 0',
                      background: myShareIds.has(item.share_id)
                        ? 'var(--color-paper2)'
                        : copying === item.share_id
                          ? 'var(--color-ink3)'
                          : 'linear-gradient(135deg, #FF8A4C, #FF6B5C)',
                      color: myShareIds.has(item.share_id) ? 'var(--color-ink3)' : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      opacity: copying === item.share_id ? 0.6 : 1,
                      transition: 'all .15s',
                    }}
                  >
                    {myShareIds.has(item.share_id)
                      ? '我的方案'
                      : copying === item.share_id
                        ? '复制中...'
                        : '复制到我的'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
