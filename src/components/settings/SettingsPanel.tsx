import type { ReactNode } from 'react'
import type { StorageStats, IntegrityResult } from '@/types'

interface Props {
  stats: StorageStats | null
  integrity: IntegrityResult | null
  onVerifyIntegrity: () => void
  onExport: () => void
  onImport: () => void
  onClearData: () => void
  onClose: () => void
}

export default function SettingsPanel({
  stats, integrity, onVerifyIntegrity, onExport, onImport, onClearData, onClose,
}: Props): ReactNode {
  const pct = stats ? Math.min(stats.usedBytes / (5 * 1024 * 1024) * 100, 100) : 0

  return (
    <div
      onClick={onClose}
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
          maxWidth: 400,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        {/* Header */}
        <div className="title-cn mb-5 flex items-center justify-between">
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>设置</span>
          <button onClick={onClose} className="btn btn-ghost h-8 w-8 !p-0 text-lg leading-none">&times;</button>
        </div>

        {/* Storage overview */}
        <div className="mb-5 rounded-xl border border-line bg-bg p-4">
          <div className="mb-2 text-[13px] font-bold text-ink">存储空间</div>
          <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-bg2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(pct, 2)}%`,
                background: pct > 80 ? 'linear-gradient(90deg, #FF8A4C, #FF6B5C)' : 'linear-gradient(90deg, #15B8A6, #4C7DFF)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink3">
            <span>{stats ? `${(stats.usedBytes / 1024).toFixed(1)} KB` : '...'}</span>
            <span>共 {stats?.tripCount ?? 0} 个行程</span>
          </div>
          {pct > 80 && (
            <div className="mt-2 rounded-lg border border-[#FF8A4C]/30 bg-[#FF8A4C]/5 px-2.5 py-1.5 text-[11px] text-[#CC6A30]">
              存储空间即将用尽，建议导出行程备份后清理
            </div>
          )}
        </div>

        {/* Trip sizes */}
        {stats && stats.tripSizes.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 text-[13px] font-bold text-ink">行程明细</div>
            <div className="space-y-1.5">
              {stats.tripSizes.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-xs">
                  <span className="font-semibold text-ink truncate mr-2">{t.title}</span>
                  <span className="shrink-0 text-ink3">{(t.bytes / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrity check */}
        <div className="mb-5 rounded-xl border border-line bg-bg p-4">
          <div className="mb-2 text-[13px] font-bold text-ink">数据完整性</div>
          <div className="flex items-center gap-2">
            <button onClick={onVerifyIntegrity} className="btn btn-ghost h-8 !px-3 text-xs font-bold">
              验证数据
            </button>
            {integrity && (
              <span
                className="text-xs font-bold"
                style={{ color: integrity.ok ? '#15B8A6' : '#FF6B5C' }}
              >
                {integrity.ok ? '✓ 数据正常' : `✗ ${integrity.error}`}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-3 flex flex-col gap-2">
          <button onClick={onExport} className="btn btn-ghost justify-start !px-4 text-sm font-bold">
            导出行程
          </button>
          <button onClick={onImport} className="btn btn-ghost justify-start !px-4 text-sm font-bold">
            导入行程
          </button>
        </div>

        <div className="border-t border-line pt-3">
          <button
            onClick={onClearData}
            className="btn btn-ghost justify-start !px-4 text-sm font-bold text-[#FF6B5C]"
          >
            清除全部行程数据
          </button>
          <div className="mt-1 px-4 text-[11px] text-ink3">
            仅清除行程数据，不影响发布状态和应用偏好
          </div>
        </div>
      </div>
    </div>
  )
}
