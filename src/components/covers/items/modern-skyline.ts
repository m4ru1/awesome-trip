import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'modern-skyline',
    name: '都市天际',
    tags: ['夜景', '摩登', '购物'],
    category: 'city',
    defaultColor: '#4A6FA5',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- moon -->
      <path d="M60 18 A8 8 0 1 1 52 26 A9 9 0 0 0 60 18" fill="${accent}33" stroke="${accent}" stroke-width="1.5"/>
      <!-- stars -->
      <line x1="16" y1="12" x2="16" y2="16" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <line x1="14" y1="14" x2="18" y2="14" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <line x1="30" y1="10" x2="30" y2="14" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <line x1="28" y1="12" x2="32" y2="12" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <line x1="70" y1="8" x2="70" y2="12" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <line x1="68" y1="10" x2="72" y2="10" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <circle cx="44" cy="12" r="1.2" fill="${accent}33"/>
      <circle cx="10" cy="22" r="1" fill="${accent}33"/>
      <circle cx="36" cy="24" r="1" fill="${accent}33"/>
      <circle cx="74" cy="24" r="1.2" fill="${accent}33"/>
      <!-- skyscraper 1 - tall left -->
      <rect x="10" y="28" width="10" height="40" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="12" y="32" width="2.5" height="3" fill="${accent}33"/>
      <rect x="16" y="32" width="2.5" height="3" fill="${accent}33"/>
      <rect x="12" y="38" width="2.5" height="3" fill="${accent}33"/>
      <rect x="16" y="38" width="2.5" height="3" fill="${accent}33"/>
      <rect x="12" y="44" width="2.5" height="3" fill="${accent}33"/>
      <rect x="16" y="44" width="2.5" height="3" fill="${accent}33"/>
      <!-- skyscraper 2 - medium -->
      <rect x="23" y="38" width="8" height="30" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="25" y="42" width="2" height="3" fill="${accent}33"/>
      <rect x="28" y="42" width="2" height="3" fill="${accent}33"/>
      <rect x="25" y="48" width="2" height="3" fill="${accent}33"/>
      <rect x="28" y="48" width="2" height="3" fill="${accent}33"/>
      <!-- skyscraper 3 - tallest center -->
      <rect x="34" y="18" width="10" height="50" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="36" y="22" width="2.5" height="3" fill="${accent}33"/>
      <rect x="40" y="22" width="2.5" height="3" fill="${accent}33"/>
      <rect x="36" y="28" width="2.5" height="3" fill="${accent}33"/>
      <rect x="40" y="28" width="2.5" height="3" fill="${accent}33"/>
      <rect x="36" y="34" width="2.5" height="3" fill="${accent}33"/>
      <rect x="40" y="34" width="2.5" height="3" fill="${accent}33"/>
      <rect x="36" y="40" width="2.5" height="3" fill="${accent}33"/>
      <rect x="40" y="40" width="2.5" height="3" fill="${accent}33"/>
      <!-- antenna -->
      <line x1="39" y1="18" x2="39" y2="12" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <!-- skyscraper 4 -->
      <rect x="47" y="30" width="10" height="38" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="49" y="34" width="2.5" height="3" fill="${accent}33"/>
      <rect x="53" y="34" width="2.5" height="3" fill="${accent}33"/>
      <rect x="49" y="40" width="2.5" height="3" fill="${accent}33"/>
      <rect x="53" y="40" width="2.5" height="3" fill="${accent}33"/>
      <rect x="49" y="46" width="2.5" height="3" fill="${accent}33"/>
      <rect x="53" y="46" width="2.5" height="3" fill="${accent}33"/>
      <!-- skyscraper 5 - short right -->
      <rect x="60" y="42" width="10" height="26" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="62" y="46" width="2.5" height="3" fill="${accent}33"/>
      <rect x="66" y="46" width="2.5" height="3" fill="${accent}33"/>
      <rect x="62" y="52" width="2.5" height="3" fill="${accent}33"/>
      <rect x="66" y="52" width="2.5" height="3" fill="${accent}33"/>
      <!-- skyscraper 6 - far right -->
      <rect x="73" y="34" width="5" height="34" rx="0.5" fill="none" stroke="${accent}99" stroke-width="1"/>
      <rect x="74" y="38" width="1.5" height="2" fill="${accent}33"/>
      <rect x="76" y="38" width="1.5" height="2" fill="${accent}33"/>
      <!-- ground line -->
      <line x1="6" y1="68" x2="76" y2="68" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
