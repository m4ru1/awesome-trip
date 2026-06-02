import type { ReactNode } from 'react'
import type { Block, Mode, BlockStatus } from '@/types'
import { TYPE_META } from '@/data/constants'
import TypeTag from '@/components/ui/TypeTag'
import ImageTile from '@/components/ui/ImageTile'
import OptionDetailBody from '@/components/cards/OptionDetailBody'
import TransportConnector from '@/components/panels/TransportConnector'
import AlternativeDeck from '@/components/panels/AlternativeDeck'

interface TransportHandlers {
  editable: boolean
  onSwitchAlt: (segIdx: number, altIdx: number) => void
  onSetMode: (segIdx: number, k: string) => void
  onSetField: (segIdx: number, f: string, v: string) => void
  onAdd: () => void
  onRemove: (segIdx: number) => void
  onReorder?: (fromIdx: number, toIdx: number) => void
}

interface Props {
  block: Block
  mode: Mode
  onClose: () => void
  onSetPrimary: (kind: string, idx: number) => void
  onAddAlt: () => void
  onEditAlt: (idx: number) => void
  onDeleteAlt: (idx: number) => void
  onToggleStatus: (status: BlockStatus) => void
  onEdit: () => void
  onDelete: () => void
  transport: TransportHandlers
}

export default function DetailContent({
  block,
  mode,
  onClose,
  onSetPrimary,
  onAddAlt,
  onEditAlt,
  onDeleteAlt,
  onToggleStatus,
  onEdit,
  onDelete,
  transport,
}: Props): ReactNode {
  const m = TYPE_META[block.type]
  const p = block.primary
  const editable = mode === 'plan'
  const viewerSeesAlts = mode !== 'share'

  return (
    <div>
      {/* Cover tile + close button + type tag + status chips */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: 130 }}>
          <ImageTile
            type={block.type}
            emoji={p.emoji}
            height={130}
            radius={0}
          />
        </div>
        <button
          onClick={onClose}
          aria-label="关闭"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 34,
            height: 34,
            borderRadius: 99,
            border: 'none',
            background: 'rgba(255,255,255,.92)',
            cursor: 'pointer',
            fontSize: 16,
            boxShadow: '0 3px 8px rgba(0,0,0,.12)',
          }}
        >
          ✕
        </button>
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 12,
            display: 'flex',
            gap: 7,
          }}
        >
          <TypeTag type={block.type} />
          {block.status === 'done' && (
            <span
              className="chip"
              style={{ background: '#15B8A6', color: '#fff' }}
            >
              ✓ 已完成
            </span>
          )}
          {block.status === 'skipped' && (
            <span
              className="chip"
              style={{ background: 'var(--color-ink3)', color: '#fff' }}
            >
              已跳过
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 20px' }}>
        {/* Time range */}
        <div
          className="num"
          style={{ color: m.color, fontWeight: 700, fontSize: 15 }}
        >
          {block.startTime}
          {block.endTime !== '次日'
            ? ` – ${block.endTime}`
            : ' 起'}
        </div>

        {/* Title */}
        <h2
          style={{ margin: '4px 0 6px', fontSize: 23, fontWeight: 800 }}
          className="title-cn"
        >
          {p.emoji} {p.name}
        </h2>

        {/* Address */}
        {p.address && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--color-ink2)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            📍 {p.address}
          </div>
        )}

        {/* Highlight callout */}
        {p.highlight && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: 'var(--color-ink)',
              background: m.soft,
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            ✨ {p.highlight}
          </div>
        )}

        {/* Conflict warning */}
        {block.conflict && (
          <div
            className="conflict-pulse"
            style={{
              marginTop: 10,
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--color-brand)',
              background: 'rgba(255,107,92,.1)',
              borderRadius: 12,
              padding: '9px 12px',
            }}
          >
            ⚠️ 时间冲突：{block.conflict.msg}
          </div>
        )}

        {/* Type-specific detail body */}
        <div style={{ marginTop: 14 }}>
          <OptionDetailBody option={p} type={block.type} />
        </div>

        {/* Transport connector */}
        {(block.transportToNext.length > 0 || (transport && transport.editable)) && (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 10,
              }}
              className="title-cn"
            >
              前往下一站
            </div>
            <TransportConnector
              connectors={block.transportToNext}
              layout="timeline"
              editable={transport ? transport.editable : editable}
              onSwitchAlt={transport?.onSwitchAlt}
              onSetMode={transport?.onSetMode}
              onSetField={transport?.onSetField}
              onAdd={transport?.onAdd}
              onRemove={transport?.onRemove}
              onReorder={transport?.onReorder}
            />
          </div>
        )}

        {/* Alternative deck */}
        {viewerSeesAlts && (
          <AlternativeDeck
            block={block}
            editable={editable}
            onSetPrimary={(i: number) => onSetPrimary?.('alt', i)}
            onEditAlt={onEditAlt}
            onDeleteAlt={onDeleteAlt}
            onAddAlt={onAddAlt}
          />
        )}

        {/* Action row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 9,
            marginTop: 20,
          }}
        >
          {mode === 'execute' && (
            <>
              <button
                className="btn"
                style={{
                  background:
                    block.status === 'done'
                      ? '#15B8A6'
                      : 'var(--color-paper2)',
                  color:
                    block.status === 'done'
                      ? '#fff'
                      : 'var(--color-ink)',
                }}
                onClick={() => onToggleStatus('done')}
              >
                ✓{' '}
                {block.status === 'done' ? '已完成' : '完成打卡'}
              </button>
              <button
                className="btn btn-soft"
                onClick={() => onToggleStatus('skipped')}
              >
                跳过
              </button>
            </>
          )}
          {editable && (
            <>
              <button className="btn btn-primary" onClick={onEdit}>
                ✏️ 编辑
              </button>
              <button
                className="btn"
                onClick={onDelete}
                style={{
                  background: 'rgba(255,107,92,.1)',
                  color: 'var(--color-brand)',
                }}
              >
                🗑️ 删除
              </button>
            </>
          )}
          <button
            className="btn btn-ghost"
            style={{ marginLeft: 'auto' }}
          >
            🗺️ 地图打开
          </button>
        </div>
      </div>
    </div>
  )
}
