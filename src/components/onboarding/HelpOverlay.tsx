import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props {
  onClose: () => void
}

interface Page {
  icon: string
  title: string
  items: string[]
}

const pages: Page[] = [
  {
    icon: '📅',
    title: '把行程当课程表来排',
    items: [
      '一张卡片 = 一个站点（景点 / 餐厅 / 交通）',
      '按时间线排好，一目了然',
      '拖动卡片重新排序，时间自动重算',
      '桌面端看课程表网格，手机看时间线',
    ],
  },
  {
    icon: '✏️',
    title: '每张卡片你可以这样玩',
    items: [
      '点击卡片打开详情，看全部信息和备选方案',
      '点击"+"添加行程，自动按时间插入排序',
      '编辑名称、时间、类型等所有字段',
      '两站之间可以设置交通方式、耗时和花费',
    ],
  },
  {
    icon: '🔀',
    title: '四种模式随心切换',
    items: [
      '规划模式：全功能编辑，增删改查随便来',
      '查看模式：只读浏览，不会误触改东西',
      '执行模式：模拟当前时间，打卡/跳过行程',
      '分享模式：生成明信片风格预览并发布',
    ],
  },
  {
    icon: '🅱️',
    title: 'Plan B 备选方案',
    items: [
      '每个景点/餐厅都能加几个备选方案',
      '按场景一键切换：雨天方案、省钱方案、省时方案',
      '切换后自动对比花费和时间差异',
      '支持备选方案的增删改查',
    ],
  },
  {
    icon: '🏪',
    title: '方案市场',
    items: [
      '发布行程到方案市场，别人可以浏览和复制',
      '浏览他人的旅行方案，一键复制到本地编辑',
      '自己的方案在市场中有标记，不会重复复制',
      '支持按分享码或标题搜索方案',
    ],
  },
  {
    icon: '📤',
    title: '分享与同步',
    items: [
      '发布后生成唯一分享码，发给朋友直接搜到',
      '本地修改行程后，手动点击"同步"上传',
      '从市场恢复历史版本，云端版本不丢失',
      '复制他人方案后再发布，显示二创归属',
    ],
  },
]

export default function HelpOverlay({ onClose }: Props) {
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)

  const go = (next: number) => {
    if (next < 0 || next >= pages.length) return
    setDir(next > page ? 1 : -1)
    setPage(next)
  }

  const p = pages[page]
  const isLast = page === pages.length - 1

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center p-5"
      style={{ background: 'rgba(43,45,51,.5)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-3xl bg-white"
        style={{ boxShadow: '0 24px 60px rgba(43,45,51,.34)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div
          className="px-6 py-5 text-white"
          style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)' }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => go(page - 1)}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-opacity"
              style={{ opacity: page === 0 ? 0.3 : 1, background: 'rgba(255,255,255,.15)' }}
            >
              ←
            </button>
            <span className="text-xs font-bold tracking-[2px] opacity-80">
              {page + 1} / {pages.length}
            </span>
            <button
              onClick={() => go(page + 1)}
              disabled={isLast}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-opacity"
              style={{ opacity: isLast ? 0.3 : 1, background: 'rgba(255,255,255,.15)' }}
            >
              →
            </button>
          </div>
        </div>

        {/* Animated page content */}
        <div className="relative min-h-[220px] overflow-hidden" style={{ minHeight: 240 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={page}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col items-center px-6 py-6"
            >
              <span className="text-5xl">{p.icon}</span>
              <h3 className="title-cn mt-3 text-[19px] font-extrabold text-ink">{p.title}</h3>
              <ul className="mt-3 w-full space-y-2.5 text-left">
                {p.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ink2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: dots + action */}
        <div className="border-t border-line px-6 py-3">
          {/* Dots */}
          <div className="mb-3 flex justify-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > page ? 1 : -1); setPage(i) }}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === page ? 20 : 8,
                  background: i === page ? 'var(--color-brand)' : 'var(--color-line)',
                }}
              />
            ))}
          </div>
          <button
            onClick={isLast ? onClose : () => go(page + 1)}
            className="btn btn-primary w-full justify-center text-base"
          >
            {isLast ? '开始使用 →' : '下一页 →'}
          </button>
          <div className="mt-2 text-center text-[11px] text-ink3">
            点击问号 ? 可随时再查看
          </div>
        </div>
      </div>
    </div>
  )
}
