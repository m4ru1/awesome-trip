import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'autumn-temple',
    name: '古城秋枫',
    tags: ['古城', '秋天', '寺庙', '红叶'],
    category: 'culture',
    defaultColor: '#D4753B',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <circle cx="40" cy="28" r="9" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M30 46 L26 60 L33 55 L40 60 L47 55 L54 60 L50 46 Z" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="36" y="60" width="8" height="10" rx="2" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M28 46 L22 62" stroke="${accent}99" stroke-width="1"/>
      <path d="M52 46 L58 62" stroke="${accent}99" stroke-width="1"/>
      <circle cx="22" cy="68" r="2" fill="${accent}33"/>
      <circle cx="58" cy="68" r="2" fill="${accent}33"/>
    </svg>`
  },
}

export default cover
