import { useState } from 'react'
import type { ReactNode } from 'react'
import { EMOJI_CATEGORIES } from '@/data/constants'

interface Props {
  value: string
  onChange: (emoji: string) => void
  placeholder?: string
}

export default function EmojiPicker({ value, onChange, placeholder }: Props): ReactNode {
  const [open, setOpen] = useState(false)
  const [cat, setCat] = useState(EMOJI_CATEGORIES[0].id)
  const [custom, setCustom] = useState('')

  const activeCat = EMOJI_CATEGORIES.find(c => c.id === cat) ?? EMOJI_CATEGORIES[0]

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          border: open ? '2px solid var(--color-brand)' : '1.5px solid var(--color-line)',
          borderRadius: 14,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color .2s',
        }}
      >
        {value || placeholder || '🎯'}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1001,
            background: 'rgba(0,0,0,.35)',
            animation: 'fadeIn .2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              borderRadius: 20,
              width: 340,
              maxWidth: '92%',
              maxHeight: '80%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(43,45,51,.3)',
              animation: 'floatIn .32s var(--ease-spring)',
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <span className="text-sm font-bold text-ink">选择 Emoji</span>
              <span className="flex-1" />
              <button onClick={() => setOpen(false)} className="h-7 w-7 cursor-pointer rounded-full border-none text-base text-ink3">✕</button>
            </div>

            {/* Category tabs */}
            <div
              className="flex gap-1 overflow-x-auto px-4 py-2"
              style={{ borderBottom: '1px solid var(--color-line)' }}
            >
              {EMOJI_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className="shrink-0 cursor-pointer rounded-full px-2.5 py-[5px] text-[11.5px] font-bold transition-all"
                  style={{
                    border: `1.5px solid ${c.id === cat ? 'var(--color-brand)' : 'transparent'}`,
                    background: c.id === cat ? 'rgba(255,107,92,.12)' : 'transparent',
                    color: c.id === cat ? 'var(--color-brand)' : 'var(--color-ink2)',
                  }}
                >
                  {c.zh}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="overflow-y-auto px-4 py-3" style={{ flex: 1 }}>
              <div className="flex flex-wrap gap-2">
                {activeCat.emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onChange(emoji); setOpen(false) }}
                    className="cursor-pointer rounded-xl border-[1.5px] border-transparent text-xl"
                    style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderColor: value === emoji ? 'var(--color-brand)' : 'transparent',
                      background: value === emoji ? 'rgba(255,107,92,.12)' : '#fff',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (value !== emoji) e.currentTarget.style.background = 'var(--color-paper2)' }}
                    onMouseLeave={e => { if (value !== emoji) e.currentTarget.style.background = '#fff' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-line)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { onChange(custom.trim()); setOpen(false); setCustom('') } }}
                  placeholder="自定义输入..."
                  className="flex-1 rounded-xl border-[1.5px] border-line px-3 py-2 text-sm outline-none"
                  style={{ fontFamily: 'var(--font-cn-body)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,92,.15)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  onClick={() => { if (custom.trim()) { onChange(custom.trim()); setOpen(false); setCustom('') } }}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-white"
                  style={{ background: 'var(--color-brand)' }}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
