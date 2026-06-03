import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'cherry-blossom',
    name: '樱花季',
    tags: ['春天', '赏花', '公园'],
    category: 'seasonal',
    defaultColor: '#E8738A',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- tree trunk -->
      <path d="M40 68 Q38 56 36 48 Q34 40 40 38" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
      <path d="M40 50 Q44 44 44 38" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M38 48 Q32 44 28 36" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- branches right -->
      <path d="M40 46 Q48 40 54 34" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M44 44 Q52 44 58 40" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- blossom clusters -->
      <circle cx="28" cy="34" r="5" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <circle cx="28" cy="34" r="2" fill="${accent}33"/>
      <circle cx="40" cy="36" r="6" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <circle cx="40" cy="36" r="2.5" fill="${accent}33"/>
      <circle cx="54" cy="32" r="5" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <circle cx="54" cy="32" r="2" fill="${accent}33"/>
      <circle cx="58" cy="38" r="5" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <circle cx="58" cy="38" r="2" fill="${accent}33"/>
      <circle cx="34" cy="38" r="4" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <circle cx="34" cy="38" r="1.5" fill="${accent}33"/>
      <!-- park bench -->
      <rect x="24" y="60" width="16" height="3" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="24" y="65" width="4" height="8" rx="0.5" fill="none" stroke="${accent}" stroke-width="1"/>
      <rect x="36" y="65" width="4" height="8" rx="0.5" fill="none" stroke="${accent}" stroke-width="1"/>
      <line x1="26" y1="63" x2="26" y2="60" stroke="${accent}" stroke-width="1"/>
      <line x1="38" y1="63" x2="38" y2="60" stroke="${accent}" stroke-width="1"/>
      <!-- falling petals -->
      <circle cx="46" cy="52" r="1.5" fill="${accent}33"/>
      <circle cx="22" cy="48" r="1.5" fill="${accent}33"/>
      <circle cx="64" cy="46" r="1" fill="${accent}33"/>
      <circle cx="52" cy="56" r="1" fill="${accent}33"/>
      <circle cx="18" cy="58" r="1.5" fill="${accent}33"/>
      <circle cx="66" cy="56" r="1" fill="${accent}33"/>
      <!-- ground -->
      <path d="M10 68 Q30 64 50 68 Q60 70 72 66" fill="none" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
