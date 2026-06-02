import type { ReactNode } from 'react'
import type { Block } from '@/types'

interface Props {
  block: Block | null
  nextBlock: Block | null
  transportDuration?: string
  onOpenBlock?: () => void
}

export default function ExecuteNowCard({
  block,
  nextBlock,
  transportDuration,
  onOpenBlock,
}: Props): ReactNode {
  return (
    <div
      className="float-in"
      style={{
        margin: '12px 14px',
        borderRadius: 18,
        padding: 14,
        color: '#fff',
        background:
          'linear-gradient(135deg, #FF8A4C, #FF6B5C)',
        boxShadow:
          '0 10px 26px rgba(255,107,92,.34)',
      }}
    >
      {/* Status header with pulsing dot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 12,
          fontWeight: 700,
          opacity: 0.92,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: '#fff',
            animation:
              'popCheck 1.5s infinite',
          }}
        />
        正在进行
      </div>

      {/* Current activity */}
      {block ? (
        <div
          onClick={onOpenBlock}
          style={{ marginTop: 8, cursor: 'pointer' }}
        >
          <div
            className="title-cn"
            style={{ fontSize: 20, fontWeight: 800 }}
          >
            {block.primary.emoji}{' '}
            {block.primary.name}
          </div>
          <div
            className="num"
            style={{
              fontSize: 13,
              opacity: 0.95,
              marginTop: 2,
            }}
          >
            {block.startTime}–{block.endTime}
            {transportDuration
              ? ` · 剩余 ${transportDuration}`
              : ''}
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          今天的行程还没开始 ☕
        </div>
      )}

      {/* Next activity preview */}
      {nextBlock && (
        <div
          style={{
            marginTop: 12,
            background: 'rgba(255,255,255,.18)',
            borderRadius: 12,
            padding: '9px 11px',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ opacity: 0.85 }}>
            下一步
          </span>
          <span
            className="clamp-1"
            style={{ fontWeight: 700 }}
          >
            → {nextBlock.primary.name}
          </span>
        </div>
      )}
    </div>
  )
}
