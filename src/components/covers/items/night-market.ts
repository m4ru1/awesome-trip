import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'night-market',
    name: '夜市烟火',
    tags: ['美食', '小吃', '夜市'],
    category: 'food',
    defaultColor: '#F4A261',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- left stall -->
      <rect x="10" y="36" width="22" height="22" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <line x1="10" y1="44" x2="32" y2="44" stroke="${accent}" stroke-width="1"/>
      <!-- awning left -->
      <path d="M6 36 L10 28 L32 28 L36 36" fill="${accent}33" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- right stall -->
      <rect x="44" y="36" width="22" height="22" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <line x1="44" y1="44" x2="66" y2="44" stroke="${accent}" stroke-width="1"/>
      <!-- awning right -->
      <path d="M40 36 L44 28 L66 28 L70 36" fill="${accent}33" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- hanging lanterns -->
      <line x1="16" y1="28" x2="16" y2="22" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="16" cy="20" rx="3" ry="4" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <line x1="26" y1="28" x2="26" y2="22" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="26" cy="20" rx="3" ry="4" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <line x1="50" y1="28" x2="50" y2="22" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="50" cy="20" rx="3" ry="4" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <line x1="60" y1="28" x2="60" y2="22" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="60" cy="20" rx="3" ry="4" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <!-- steam / smoke wisps -->
      <path d="M16 36 Q14 30 16 24" fill="none" stroke="${accent}99" stroke-width="1" stroke-linecap="round"/>
      <path d="M22 34 Q20 28 22 22" fill="none" stroke="${accent}99" stroke-width="1" stroke-linecap="round"/>
      <path d="M50 36 Q48 30 50 24" fill="none" stroke="${accent}99" stroke-width="1" stroke-linecap="round"/>
      <path d="M56 34 Q54 28 56 22" fill="none" stroke="${accent}99" stroke-width="1" stroke-linecap="round"/>
      <!-- bowls on counter -->
      <ellipse cx="16" cy="50" rx="5" ry="2" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="28" cy="50" rx="4" ry="1.5" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="50" cy="50" rx="5" ry="2" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="62" cy="50" rx="4" ry="1.5" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <!-- ground -->
      <line x1="8" y1="62" x2="72" y2="62" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
