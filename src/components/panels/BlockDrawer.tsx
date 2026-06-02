import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Block, Mode, BlockStatus } from '@/types'
import DetailContent from '@/components/panels/DetailContent'

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
  return (
    <AnimatePresence>
      <>
        {/* Scrim overlay */}
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(43,45,51,.28)',
            zIndex: 40,
          }}
        />
        {/* Drawer panel */}
        <motion.div
          key="panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 26, mass: 1 }}
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
        </motion.div>
      </>
    </AnimatePresence>
  )
}
