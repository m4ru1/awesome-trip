import type { CoverCategory, CoverModule } from '@/types'

const modules = import.meta.glob<{ default: CoverModule }>(
  './items/*.ts', { eager: true }
)

export const coverList: CoverModule[] = Object.values(modules).map(m => m.default)

export const coverMap = new Map<string, CoverModule>(
  coverList.map(c => [c.meta.id, c])
)

export const coversByCategory = coverList.reduce((map, c) => {
  const arr = map.get(c.meta.category) ?? []
  arr.push(c)
  map.set(c.meta.category, arr)
  return map
}, new Map<CoverCategory, CoverModule[]>())
