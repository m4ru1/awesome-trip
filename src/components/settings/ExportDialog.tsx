import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  tripCount: number
  currentTripTitle: string
  onExport: (scope: 'current' | 'all') => void
  onClose: () => void
}

export default function ExportDialog({
  open, tripCount, currentTripTitle, onExport, onClose,
}: Props): ReactNode {
  const [scope, setScope] = useState<'current' | 'all'>('current')

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
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
        <div className="title-cn mb-5" style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>
          导出行程
        </div>

        <div className="mb-4 space-y-2">
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-brand"
            style={{ borderColor: scope === 'current' ? 'var(--color-brand)' : undefined }}
            onClick={() => setScope('current')}
          >
            <input type="radio" name="scope" checked={scope === 'current'} onChange={() => setScope('current')}
              className="accent-brand" />
            <div>
              <div className="text-sm font-bold text-ink">当前行程</div>
              <div className="text-xs text-ink3">{currentTripTitle}</div>
            </div>
          </label>
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-brand"
            style={{ borderColor: scope === 'all' ? 'var(--color-brand)' : undefined }}
            onClick={() => setScope('all')}
          >
            <input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')}
              className="accent-brand" />
            <div>
              <div className="text-sm font-bold text-ink">全部行程</div>
              <div className="text-xs text-ink3">{tripCount} 个行程</div>
            </div>
          </label>
        </div>

        <div className="mb-4 rounded-lg bg-bg px-3 py-2 text-xs text-ink3">
          导出为 .ajourney 文件（JSON 格式），可用于备份或导入到其他设备
        </div>

        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            className="btn text-white"
            onClick={() => onExport(scope)}
            style={{
              background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)',
              boxShadow: '0 6px 16px rgba(255,107,92,.32)',
            }}
          >
            下载
          </button>
        </div>
      </div>
    </div>
  )
}
