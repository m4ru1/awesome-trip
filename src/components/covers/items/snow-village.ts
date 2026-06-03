import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'snow-village',
    name: '雪国小镇',
    tags: ['冬天', '温泉', '雪景'],
    category: 'seasonal',
    defaultColor: '#6B7280',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- mountains -->
      <path d="M4 42 L20 18 L36 42" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M28 42 L48 14 L68 42" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M56 42 L72 24 L76 42" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- snow caps -->
      <path d="M18 23 L20 18 L24 22" fill="none" stroke="${accent}" stroke-width="1"/>
      <path d="M45 18 L48 14 L52 19" fill="none" stroke="${accent}" stroke-width="1"/>
      <!-- left house -->
      <rect x="12" y="42" width="18" height="16" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M10 42 L21 34 L32 42" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- snow on left roof -->
      <path d="M10 42 Q21 36 32 42" fill="${accent}33" stroke="none"/>
      <rect x="19" y="48" width="4" height="5" fill="none" stroke="${accent}" stroke-width="1"/>
      <!-- right house -->
      <rect x="44" y="40" width="18" height="18" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M42 40 L53 32 L64 40" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- snow on right roof -->
      <path d="M42 40 Q53 34 64 40" fill="${accent}33" stroke="none"/>
      <rect x="51" y="46" width="4" height="5" fill="none" stroke="${accent}" stroke-width="1"/>
      <!-- onsen steam -->
      <path d="M68 54 Q70 48 66 42" fill="none" stroke="${accent}99" stroke-width="1" stroke-linecap="round"/>
      <path d="M72 54 Q74 49 70 44" fill="none" stroke="${accent}99" stroke-width="1" stroke-linecap="round"/>
      <path d="M70 56 Q72 51 68 46" fill="none" stroke="${accent}99" stroke-width="0.8" stroke-linecap="round"/>
      <!-- onsen pool -->
      <ellipse cx="70" cy="58" rx="8" ry="3" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <!-- falling snow -->
      <circle cx="10" cy="14" r="1.2" fill="${accent}33"/>
      <circle cx="28" cy="8" r="1" fill="${accent}33"/>
      <circle cx="50" cy="10" r="1.2" fill="${accent}33"/>
      <circle cx="72" cy="12" r="1" fill="${accent}33"/>
      <circle cx="16" cy="26" r="0.8" fill="${accent}33"/>
      <circle cx="62" cy="22" r="1" fill="${accent}33"/>
      <circle cx="38" cy="28" r="0.8" fill="${accent}33"/>
      <circle cx="8" cy="34" r="1" fill="${accent}33"/>
      <circle cx="74" cy="34" r="0.8" fill="${accent}33"/>
      <!-- ground -->
      <path d="M4 60 Q30 56 76 60" fill="none" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
