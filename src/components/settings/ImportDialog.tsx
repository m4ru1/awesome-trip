import { useState, useCallback } from 'react'
import type { ReactNode, ChangeEvent, DragEvent } from 'react'
import type { Trip, ImportPreview, ConflictDecision } from '@/types'

interface Props {
  open: boolean
  onImportFile: (json: string) => ImportPreview | { error: string }
  onConfirmImport: (importTrips: Trip[], decisions: ConflictDecision[]) => void
  onClose: () => void
}

type Stage = 'select' | 'preview' | 'conflict'

export default function ImportDialog({
  open, onImportFile, onConfirmImport, onClose,
}: Props): ReactNode {
  const [stage, setStage] = useState<Stage>('select')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importTrips, setImportTrips] = useState<Trip[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conflictDecisions, setConflictDecisions] = useState<ConflictDecision[]>([])
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = onImportFile(reader.result as string)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setError(null)
      setPreview(result)
      const trips = result.items.map(i => i.importTrip)
      setImportTrips(trips)
      if (result.conflictCount > 0) {
        setConflictDecisions(
          result.items.map(item => ({
            tripId: item.importTrip.id,
            action: item.status === 'conflict' ? 'keep-both' as const : ('keep-both' as const),
          })),
        )
        setStage('conflict')
      } else {
        setStage('preview')
      }
    }
    reader.readAsText(file)
  }, [onImportFile])

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleConfirm = () => {
    onConfirmImport(importTrips, conflictDecisions)
    reset()
  }

  const reset = () => {
    setStage('select')
    setPreview(null)
    setImportTrips([])
    setError(null)
    setConflictDecisions([])
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <div
      onClick={handleClose}
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
          maxWidth: 420,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: 'var(--shadow-pop)',
          animation: 'floatIn .32s var(--ease-spring)',
        }}
      >
        <div className="title-cn mb-5 flex items-center justify-between">
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-ink)' }}>导入行程</span>
          <button onClick={handleClose} className="btn btn-ghost h-8 w-8 !p-0 text-lg leading-none">&times;</button>
        </div>

        {stage === 'select' && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-brand)' : 'var(--color-line)'}`,
                borderRadius: 14,
                padding: '32px 16px',
                textAlign: 'center',
                background: dragOver ? 'rgba(255,138,76,.05)' : 'var(--color-bg)',
                transition: 'all .15s ease',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('import-file-input')?.click()}
            >
              <div className="mb-2 text-3xl">📂</div>
              <div className="text-sm font-bold text-ink">点击或拖拽文件到此处</div>
              <div className="mt-1 text-xs text-ink3">支持 .ajourney / .json 文件</div>
              <input
                id="import-file-input"
                type="file"
                accept=".ajourney,.json"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
            {error && (
              <div className="mt-3 rounded-lg border border-[#FF6B5C]/30 bg-[#FF6B5C]/5 px-3 py-2 text-xs text-[#FF6B5C]">
                {error}
              </div>
            )}
          </>
        )}

        {stage === 'preview' && preview && (
          <>
            <div className="mb-4 rounded-xl bg-bg2/60 p-4 text-center">
              <div className="mb-1 text-lg font-extrabold text-ink">{preview.newCount} 个新行程</div>
              <div className="text-xs text-ink3">导入后将添加到你的行程列表</div>
            </div>
            <div className="mb-4 space-y-1.5">
              {preview.items.map(item => (
                <div key={item.importTrip.id} className="flex items-center gap-2.5 rounded-lg bg-bg px-3 py-2 text-sm">
                  <span style={{ color: '#15B8A6' }}>+</span>
                  <span className="font-semibold text-ink truncate">{item.importTrip.title}</span>
                  <span className="shrink-0 text-xs text-ink3">{item.importTrip.days.length}天</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={handleClose}>取消</button>
              <button
                className="btn text-white"
                onClick={handleConfirm}
                style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 16px rgba(255,107,92,.32)' }}
              >
                确认导入
              </button>
            </div>
          </>
        )}

        {stage === 'conflict' && preview && (
          <>
            <div className="mb-1 text-sm font-bold text-ink">
              发现 {preview.conflictCount} 个行程冲突
            </div>
            <div className="mb-4 text-xs text-ink3">选择每个冲突行程的处理方式：</div>
            <div className="mb-4 space-y-2">
              {preview.items.filter(i => i.status === 'conflict').map((item) => {
                const decision = conflictDecisions.find(d => d.tripId === item.importTrip.id)
                const action = decision?.action ?? 'keep-both'
                return (
                  <div key={item.importTrip.id} className="rounded-xl border border-[#F5A300]/40 bg-[#F5A300]/5 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-ink3">导入版</span>
                      <span className="text-sm font-bold text-ink">{item.importTrip.title}</span>
                      <span className="text-xs text-ink3">{item.importTrip.days.length}天</span>
                    </div>
                    {item.existingTrip && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-ink3">本地版</span>
                        <span className="text-sm font-bold text-ink">{item.existingTrip.title}</span>
                        <span className="text-xs text-ink3">{item.existingTrip.days.length}天</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`conflict-${item.importTrip.id}`}
                          checked={action === 'keep-both'}
                          onChange={() => {
                            setConflictDecisions(prev =>
                              prev.map(d => d.tripId === item.importTrip.id ? { ...d, action: 'keep-both' as const } : d),
                            )
                          }}
                          className="accent-brand"
                        />
                        保留两者
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`conflict-${item.importTrip.id}`}
                          checked={action === 'overwrite'}
                          onChange={() => {
                            setConflictDecisions(prev =>
                              prev.map(d => d.tripId === item.importTrip.id ? { ...d, action: 'overwrite' as const } : d),
                            )
                          }}
                          className="accent-brand"
                        />
                        覆盖本地
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
            {preview.items.filter(i => i.status === 'new').length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-xs font-bold text-ink3">
                  新增 {preview.newCount} 个行程
                </div>
                <div className="space-y-1">
                  {preview.items.filter(i => i.status === 'new').map(item => (
                    <div key={item.importTrip.id} className="flex items-center gap-2 rounded-lg bg-bg px-3 py-1.5 text-xs">
                      <span style={{ color: '#15B8A6' }}>+</span>
                      <span className="font-semibold text-ink">{item.importTrip.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={handleClose}>取消</button>
              <button
                className="btn text-white"
                onClick={handleConfirm}
                style={{ background: 'linear-gradient(135deg, #FF8A4C, #FF6B5C)', boxShadow: '0 6px 16px rgba(255,107,92,.32)' }}
              >
                确认导入
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
