import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'forest-hike',
    name: '森林徒步',
    tags: ['登山', '森林', '户外'],
    category: 'nature',
    defaultColor: '#4A7C59',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- trees - back row -->
      <path d="M14 68 L14 30 L8 36 L14 30 L20 36 Z" fill="none" stroke="${accent}99" stroke-width="1" stroke-linejoin="round"/>
      <rect x="11" y="36" width="6" height="32" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- tree left -->
      <path d="M26 68 L26 22 L18 30 L26 22 L34 30 Z" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="23" y="30" width="6" height="38" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- tree right -->
      <path d="M60 68 L60 28 L52 36 L60 28 L68 36 Z" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="57" y="36" width="6" height="32" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- center tree -->
      <path d="M44 68 L44 16 L36 24 L44 16 L52 24 Z" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="41" y="24" width="6" height="44" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <!-- far right tree -->
      <path d="M72 68 L72 34 L66 38 L72 34 L78 38 Z" fill="none" stroke="${accent}99" stroke-width="1" stroke-linejoin="round"/>
      <rect x="70" y="38" width="4" height="30" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- winding trail -->
      <path d="M28 68 Q34 64 32 60 Q30 56 36 52 Q42 48 38 44 Q34 40 40 36 Q46 32 44 28" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- mushrooms -->
      <path d="M20 66 L20 62" stroke="${accent}" stroke-width="1.2"/>
      <path d="M16 62 Q20 58 24 62 Z" fill="${accent}33" stroke="${accent}" stroke-width="0.8"/>
      <path d="M54 64 L54 60" stroke="${accent}99" stroke-width="1"/>
      <path d="M50 60 Q54 56 58 60 Z" fill="${accent}33" stroke="${accent}99" stroke-width="0.8"/>
      <!-- bird -->
      <path d="M34 14 Q36 12 38 14" fill="none" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <path d="M38 14 Q40 12 42 14" fill="none" stroke="${accent}" stroke-width="1" stroke-linecap="round"/>
      <!-- ground texture -->
      <path d="M8 68 Q20 66 30 68" fill="none" stroke="${accent}99" stroke-width="0.8"/>
      <path d="M50 68 Q60 66 72 68" fill="none" stroke="${accent}99" stroke-width="0.8"/>
    </svg>`
  },
}

export default cover
