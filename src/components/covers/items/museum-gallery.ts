import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'museum-gallery',
    name: '博物馆',
    tags: ['艺术', '展览', '历史'],
    category: 'culture',
    defaultColor: '#8B5CF6',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- pediment / triangle top -->
      <path d="M20 32 L40 14 L60 32 Z" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- roof line -->
      <line x1="18" y1="32" x2="62" y2="32" stroke="${accent}" stroke-width="1.5"/>
      <!-- building facade -->
      <rect x="20" y="32" width="40" height="30" rx="1" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- columns -->
      <rect x="24" y="36" width="4" height="26" rx="0.5" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="32" y="36" width="4" height="26" rx="0.5" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="44" y="36" width="4" height="26" rx="0.5" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <rect x="52" y="36" width="4" height="26" rx="0.5" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- column tops -->
      <line x1="24" y1="36" x2="28" y2="36" stroke="${accent}" stroke-width="1.5"/>
      <line x1="32" y1="36" x2="36" y2="36" stroke="${accent}" stroke-width="1.5"/>
      <line x1="44" y1="36" x2="48" y2="36" stroke="${accent}" stroke-width="1.5"/>
      <line x1="52" y1="36" x2="56" y2="36" stroke="${accent}" stroke-width="1.5"/>
      <!-- door -->
      <path d="M34 62 L34 44 Q40 40 46 44 L46 62" fill="${accent}33" stroke="${accent}" stroke-width="1.5"/>
      <!-- art frame inside -->
      <rect x="28" y="20" width="10" height="8" rx="0.5" fill="none" stroke="${accent}99" stroke-width="1"/>
      <path d="M30 24 Q33 22 36 26" fill="none" stroke="${accent}99" stroke-width="0.8"/>
      <!-- statue silhouette -->
      <path d="M66 62 L66 50" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="66" cy="46" r="3" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M63 55 L69 55" stroke="${accent}" stroke-width="1.2" stroke-linecap="round"/>
      <!-- base -->
      <rect x="62" y="62" width="8" height="4" rx="1" fill="none" stroke="${accent}" stroke-width="1"/>
      <!-- steps -->
      <line x1="28" y1="62" x2="52" y2="62" stroke="${accent}" stroke-width="1"/>
      <line x1="26" y1="66" x2="54" y2="66" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
