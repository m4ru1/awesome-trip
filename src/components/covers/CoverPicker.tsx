import { coverList } from './registry'
import CoverIcon from './CoverIcon'

const PRESET_COLORS = [
  { color: '#D4753B', name: '暖橙' },
  { color: '#4A90D9', name: '天蓝' },
  { color: '#2A9D8F', name: '松绿' },
  { color: '#E8738A', name: '樱粉' },
  { color: '#8B5CF6', name: '暮紫' },
  { color: '#6B7280', name: '岩灰' },
]

interface CoverPickerProps {
  selectedId: string
  selectedColor: string
  onSelect: (coverId: string) => void
  onColorChange: (color: string) => void
}

export default function CoverPicker({
  selectedId,
  selectedColor,
  onSelect,
  onColorChange,
}: CoverPickerProps) {
  return (
    <div>
      {/* Cover grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
        }}
      >
        {coverList.map(c => (
          <button
            key={c.meta.id}
            onClick={() => onSelect(c.meta.id)}
            title={c.meta.name}
            style={{
              aspectRatio: '1',
              borderRadius: 12,
              border: c.meta.id === selectedId
                ? '2px solid var(--color-brand)'
                : '2px solid transparent',
              padding: 0,
              cursor: 'pointer',
              background: 'transparent',
              overflow: 'hidden',
              transition: 'border-color .15s',
            }}
          >
            <CoverIcon
              coverId={c.meta.id}
              coverColor={selectedColor}
              size={52}
              style={{ borderRadius: 10 }}
            />
          </button>
        ))}
      </div>

      {/* Color swatches */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-ink3)', marginBottom: 8 }}>
          预设色调
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {PRESET_COLORS.map(({ color, name }) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              title={name}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: color,
                border: selectedColor === color
                  ? '2px solid var(--color-brand)'
                  : '2px solid transparent',
                outline: selectedColor === color
                  ? '2px solid #fff'
                  : 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'border-color .15s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
