import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { coverMap } from './registry'

interface CoverIconProps {
  coverId: string
  coverColor: string
  coverEmoji?: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

function CoverIcon({
  coverId,
  coverColor,
  coverEmoji,
  size = 52,
  className,
  style,
}: CoverIconProps): ReactNode {
  const mod = coverMap.get(coverId)

  if (!mod) {
    // Fallback: old emoji rendering for unmigrated trips
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.27),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.54),
          background: `linear-gradient(140deg, ${coverColor || '#FF8A4C'}, #FF6B5C)`,
          flexShrink: 0,
          ...style,
        }}
      >
        {coverEmoji || '✈️'}
      </span>
    )
  }

  const svgStr = useMemo(
    () => mod.svg(coverColor || mod.meta.defaultColor),
    [mod, coverColor],
  )

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
      dangerouslySetInnerHTML={{
        __html: svgStr.replace(
          /<svg\b/,
          `<svg width="${size}" height="${size}"`
        ),
      }}
    />
  )
}

export default memo(CoverIcon)
