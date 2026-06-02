import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAnimation } from '@/hooks/useAnimation'
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

export default function BlockSheet({
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
  const { enabled, tr: animTr } = useAnimation()
  return (
    <AnimatePresence>
      <>
        {/* Scrim overlay */}
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={animTr({ duration: 0.2 })}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(43,45,51,.32)',
            zIndex: 40,
          }}
        />
        {/* Bottom sheet */}
        <motion.div
          key="sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={enabled ? { type: 'spring', stiffness: 400, damping: 30, mass: 1 } : { duration: 0 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '90%',
            background: '#fff',
            zIndex: 41,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflowY: 'auto',
            overscrollBehaviorY: 'contain',
            boxShadow: '0 -12px 40px rgba(75,55,40,.22)',
          }}
        >
          {/* Grab handle */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 0 0',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: 40,
                height: 5,
                borderRadius: 99,
                background: 'rgba(0,0,0,.12)',
              }}
            />
          </div>
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
