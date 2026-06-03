import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'mountain-lake',
    name: '山野湖泊',
    tags: ['远足', '湖泊', '自然'],
    category: 'nature',
    defaultColor: '#4A90D9',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- mountains -->
      <path d="M6 54 L22 30 L38 54" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M28 54 L44 24 L60 54" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M50 54 L66 32 L74 54" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- snow caps -->
      <path d="M19 36 L22 30 L25 36" fill="none" stroke="${accent}" stroke-width="1"/>
      <path d="M41 30 L44 24 L47 30" fill="none" stroke="${accent}" stroke-width="1"/>
      <!-- lake -->
      <path d="M10 58 L30 56 L50 60 L70 55" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- reflection -->
      <path d="M20 62 L30 60 L40 64 L50 61 L60 63" stroke="${accent}99" stroke-width="1"/>
      <!-- pine trees -->
      <path d="M14 54 L10 46 L12 46 L8 38 L13 38 L14 54" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M64 54 L60 48 L62 48 L58 42 L63 42 L64 54" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- hiking trail -->
      <path d="M40 68 Q44 64 38 60 Q32 56 36 52" fill="none" stroke="${accent}99" stroke-width="1" stroke-dasharray="2 2"/>
    </svg>`
  },
}

export default cover
