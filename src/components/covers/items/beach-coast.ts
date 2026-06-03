import type { CoverModule } from '@/types'

const cover: CoverModule = {
  meta: {
    id: 'beach-coast',
    name: '海滩海岸',
    tags: ['南洋', '潜水', '日落'],
    category: 'coastal',
    defaultColor: '#2A9D8F',
  },
  svg(accent: string): string {
    return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="${accent}22"/>
      <!-- sun on horizon -->
      <circle cx="56" cy="52" r="8" fill="${accent}33" stroke="${accent}" stroke-width="1.5"/>
      <path d="M44 52 L40 52" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M64 52 L68 52" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M56 40 L56 38" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- ocean waves -->
      <path d="M4 52 Q8 48 12 52 Q16 56 20 52 Q24 48 28 52 Q32 56 36 52 Q40 48 44 52" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <path d="M8 58 Q12 56 16 58 Q20 60 24 58 Q28 56 32 58 Q36 60 40 58 Q44 56 48 58 Q52 60 56 58 Q60 56 64 58 Q68 60 72 58" fill="none" stroke="${accent}99" stroke-width="1"/>
      <!-- palm tree -->
      <path d="M28 68 Q26 54 18 40" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 40 Q10 36 6 42" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 40 Q22 34 18 30" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 40 Q28 32 26 26" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 40 Q30 38 34 34" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M18 40 Q12 42 8 38" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- coconuts -->
      <circle cx="23" cy="42" r="2" fill="${accent}33" stroke="${accent}" stroke-width="0.8"/>
      <circle cx="26" cy="40" r="2" fill="${accent}33" stroke="${accent}" stroke-width="0.8"/>
      <!-- small boat -->
      <path d="M58 60 L54 66 L66 66 L62 60 Z" fill="${accent}33" stroke="${accent}" stroke-width="1" stroke-linejoin="round"/>
      <line x1="60" y1="60" x2="60" y2="55" stroke="${accent}" stroke-width="1"/>
      <path d="M60 55 L66 58 L60 59" fill="none" stroke="${accent}" stroke-width="0.8"/>
      <!-- sand -->
      <path d="M4 68 Q20 64 40 68 Q60 72 76 68" fill="none" stroke="${accent}99" stroke-width="1"/>
    </svg>`
  },
}

export default cover
