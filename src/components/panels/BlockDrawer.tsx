import type { ReactNode } from 'react'
import type { Block, Mode, BlockStatus } from '@/types'
import DetailContent from '@/components/panels/DetailContent'

interface TransportHandlers {
  editable: boolean
  onSwitchAlt: (i: number) => void
  onSetMode: (k: string) => void
  onSetField: (f: string, v: string) => void
  onAdd: () => void
  onRemove: () => void
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

export default function BlockDrawer({
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
  if (!block) return null

  return (
    <>
      {/* Scrim overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(43,45,51,.28)',
          zIndex: 40,
          animation: 'fadeIn .2s ease',
        }}
      />
      {/* Drawer panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 410,
          maxWidth: '92vw',
          background: '#fff',
          zIndex: 41,
          boxShadow: '-12px 0 40px rgba(75,55,40,.2)',
          overflowY: 'auto',
          animation: 'drawerIn .34s var(--ease-spring)',
        }}
      >
        <DetailContent
          block={block}
          mode={mode}
          onClose={onClose}
          onSetPrimary={onSetPrimary}
          onAddAlt={onAddAlt}
          onEditAlt={onEditAlt}
          onDeleteAlt={onDeleteAlt}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onDelete={onDelete}
          transport={transport}
        />
      </div>
    </>
  )
}
