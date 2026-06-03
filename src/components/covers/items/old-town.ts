import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'old-town',
    name: '古镇小巷',
    tags: ['古镇', '石板路', '老建筑'],
    category: 'culture',
    defaultColor: '#B5653B',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- left building -->
      <rect x="6" y="28" width="26" height="32" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- curved roof left -->
      <path d="M4 28 Q10 20 19 16 Q28 20 34 28" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- roof ridge detail -->
      <path d="M12 22 Q19 18 26 22" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- window left -->
      <rect x="14" y="38" width="8" height="6" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <line x1="18" y1="38" x2="18" y2="44" stroke="${accent}" stroke-width="0.8"/>
      <line x1="14" y1="41" x2="22" y2="41" stroke="${accent}" stroke-width="0.8"/>
      <!-- right building -->
      <rect x="48" y="24" width="28" height="36" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- curved roof right -->
      <path d="M46 24 Q54 14 62 12 Q70 14 78 24" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- roof ridge detail -->
      <path d="M54 18 Q62 14 70 18" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- window right -->
      <rect x="56" y="34" width="10" height="8" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <line x1="61" y1="34" x2="61" y2="42" stroke="${accent}" stroke-width="0.8"/>
      <!-- hanging lantern -->
      <line x1="56" y1="20" x2="56" y2="14" stroke="${accent}" stroke-width="1"/>
      <ellipse cx="56" cy="12" rx="3.5" ry="4.5" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <line x1="56" y1="16.5" x2="56" y2="10" stroke="${accent}" stroke-width="0.8"/>
      <!-- bridge -->
      <path d="M30 60 Q36 50 44 50 Q52 50 54 60" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="32" y1="58" x2="52" y2="58" stroke="${accent}" stroke-width="0.8"/>
      <!-- water under bridge -->
      <path d="M24 64 Q30 62 36 64 Q42 66 48 64 Q54 62 60 64" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- cobblestone path -->
      <path d="M10 68 L30 60 Q40 52 54 60 L72 68" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="16" cy="66" rx="2" ry="1" fill="none" stroke="${accent}99" stroke-width="0.8"/>
      <ellipse cx="22" cy="64" rx="2" ry="1" fill="none" stroke="${accent}99" stroke-width="0.8"/>
      <ellipse cx="60" cy="64" rx="2" ry="1" fill="none" stroke="${accent}99" stroke-width="0.8"/>
      <ellipse cx="66" cy="66" rx="2" ry="1" fill="none" stroke="${accent}99" stroke-width="0.8"/>
    </svg>`
  },
}

export default cover
