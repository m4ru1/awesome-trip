import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Trip } from '@/types'
import EdInput from '@/components/ui/EdInput'
import EdField from '@/components/ui/EdField'
import EmojiPicker from '@/components/ui/EmojiPicker'

interface Props {
  onConfirm: (trip: Trip) => void
  onCancel: () => void
}

export default function TripCreateDialog({ onConfirm, onCancel }: Props): ReactNode {
  const [title, setTitle] = useState('新旅行')
  const [coverEmoji, setCoverEmoji] = useState('✈️')
  const [destinationCity, setDestinationCity] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [party, setParty] = useState('')

  const handleConfirm = () => {
    const trip: Trip = {
      id: 't-' + Date.now(),
      title: title.trim() || '新旅行',
      subtitle: '',
      destinationCity,
      coverEmoji: coverEmoji || '✈️',
      coverColor: '#FF8A4C',
      dateRange,
      party,
      days: [],
    }
    onConfirm(trip)
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.35)',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-card)',
          padding: '28px 24px 22px',
          maxWidth: 380,
          width: '90%',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        <div
          className="title-cn mb-5 text-xl font-extrabold text-ink"
          style={{ fontSize: 20 }}
        >
          新建旅行
        </div>

        <EdField label="旅行名称">
          <EdInput value={title} onChange={setTitle} placeholder="新旅行" />
        </EdField>
        <EdField label="封面 Emoji">
          <div className="flex items-center gap-2">
            <EmojiPicker value={coverEmoji} onChange={setCoverEmoji} placeholder="✈️" />
            <span className="text-xs text-ink3">{coverEmoji || '✈️'}</span>
          </div>
        </EdField>
        <EdField label="目的地">
          <EdInput value={destinationCity} onChange={setDestinationCity} placeholder="京都 · Kyoto" />
        </EdField>
        <EdField label="日期范围">
          <EdInput value={dateRange} onChange={setDateRange} placeholder="6/1 – 6/5" />
        </EdField>
        <EdField label="出行人">
          <EdInput value={party} onChange={setParty} placeholder="2 人 · 情侣" />
        </EdField>

        <div className="mt-5 flex gap-3 justify-end">
          <button className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button
            className="btn text-white"
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)',
              boxShadow: '0 6px 16px rgba(255,107,92,.32)',
            }}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
