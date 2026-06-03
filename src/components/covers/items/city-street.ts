import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'city-street',
    name: '城市街巷',
    tags: ['咖啡', '建筑', '街区'],
    category: 'city',
    defaultColor: '#E8734A',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- buildings -->
      <rect x="8" y="20" width="16" height="35" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="10" y="25" width="4" height="4" fill="${accent}33"/>
      <rect x="16" y="25" width="4" height="4" fill="${accent}33"/>
      <rect x="10" y="33" width="4" height="4" fill="${accent}33"/>
      <rect x="16" y="33" width="4" height="4" fill="${accent}33"/>
      <rect x="26" y="10" width="14" height="45" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="28" y="16" width="4" height="4" fill="${accent}33"/>
      <rect x="34" y="16" width="4" height="4" fill="${accent}33"/>
      <rect x="28" y="24" width="4" height="4" fill="${accent}33"/>
      <rect x="34" y="24" width="4" height="4" fill="${accent}33"/>
      <rect x="28" y="32" width="4" height="4" fill="${accent}33"/>
      <rect x="34" y="32" width="4" height="4" fill="${accent}33"/>
      <rect x="42" y="28" width="15" height="27" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="44" y="33" width="4" height="4" fill="${accent}33"/>
      <rect x="50" y="33" width="4" height="4" fill="${accent}33"/>
      <rect x="44" y="41" width="4" height="4" fill="${accent}33"/>
      <rect x="50" y="41" width="4" height="4" fill="${accent}33"/>
      <rect x="59" y="15" width="15" height="40" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="61" y="20" width="4" height="4" fill="${accent}33"/>
      <rect x="67" y="20" width="4" height="4" fill="${accent}33"/>
      <rect x="61" y="28" width="4" height="4" fill="${accent}33"/>
      <rect x="67" y="28" width="4" height="4" fill="${accent}33"/>
      <!-- street lamp -->
      <line x1="50" y1="55" x2="50" y2="68" stroke="${accent}" stroke-width="1.5"/>
      <path d="M46 55 L54 55" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="50" cy="55" r="2" fill="${accent}33" stroke="${accent}" stroke-width="1"/>
      <!-- coffee cup -->
      <rect x="34" y="62" width="8" height="6" rx="2" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M42 64 Q46 64 42 68" fill="none" stroke="${accent}" stroke-width="1"/>
      <!-- steam -->
      <path d="M36 60 Q37 56 35 54" fill="none" stroke="${accent}99" stroke-width="1"/>
      <path d="M40 60 Q41 57 39 54" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- ground line -->
      <line x1="6" y1="68" x2="74" y2="68" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
