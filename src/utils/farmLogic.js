// Pure farm rules: no Vue, no storage. Times are milliseconds since 1970 unless named minutes.
import { CROPS, TREES, PRODUCERS, RECIPES, GOODS, PLACEABLE, CRITTERS, xpForLevel, MAX_FARM_LEVEL, LAND, DECOR } from '@/data/farm'

export const MINUTE = 60 * 1000

export const cropById = Object.fromEntries(CROPS.map((c) => [c.id, c]))
export const treeById = Object.fromEntries(TREES.map((t) => [t.id, t]))
export const producerById = Object.fromEntries(PRODUCERS.map((p) => [p.id, p]))
export const recipeById = Object.fromEntries(RECIPES.map((r) => [r.id, r]))
export const critterById = Object.fromEntries(CRITTERS.map((c) => [c.id, c]))

export function sizeOf(type) {
  const p = PLACEABLE[type]
  return { w: p?.w ?? 1, h: p?.h ?? 1 }
}

export function kindOf(type) {
  if (type === 'plot') return 'plot'
  if (treeById[type]) return 'tree'
  if (producerById[type]) return 'producer'
  if (['barn', 'kitchen', 'board', 'pip'].includes(type)) return 'fixed'
  return 'decor'
}

/** 0 just planted … 1 ready. */
export function growthFraction(start, ready, now) {
  if (!ready) return 0
  if (now >= ready) return 1
  return Math.max(0, Math.min(1, (now - start) / (ready - start)))
}

/** Crop look stage: 0 seeds, 1 sprout, 2 growing, 3 ready. */
export function cropStage(crop, now) {
  if (!crop) return -1
  const f = growthFraction(crop.plantedAt, crop.readyAt, now)
  if (f >= 1) return 3
  if (f >= 0.5) return 2
  if (f >= 0.15) return 1
  return 0
}

export function timeLeft(readyAt, now) {
  return Math.max(0, readyAt - now)
}

export function formatLeft(ms) {
  const s = Math.ceil(ms / 1000)
  if (s <= 0) return 'Ready'
  if (s < 60) return `${s}s`
  const m = Math.ceil(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h}h ${rest}m` : `${h}h`
}

export function formatMinutes(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Add XP, rolling into new levels. */
export function addXp(level, xp, gain) {
  let l = level
  let x = xp + gain
  const gained = []
  while (l < MAX_FARM_LEVEL && x >= xpForLevel(l)) {
    x -= xpForLevel(l)
    l += 1
    gained.push(l)
  }
  if (l >= MAX_FARM_LEVEL) x = 0
  return { level: l, xp: x, gained }
}

/** What becomes available at a farm level (for the level up card). */
export function unlocksAt(level) {
  return [
    ...CROPS.filter((c) => c.level === level).map((c) => ({ kind: 'Crop', name: c.name, id: c.id })),
    ...TREES.filter((t) => t.level === level).map((t) => ({ kind: 'Tree', name: t.name, id: t.id })),
    ...PRODUCERS.filter((p) => p.level === level).map((p) => ({ kind: 'Building', name: p.name, id: p.id })),
    ...RECIPES.filter((r) => r.level === level).map((r) => ({ kind: 'Recipe', name: r.name, id: r.id })),
    ...DECOR.filter((d) => d.level === level).map((d) => ({ kind: 'Decoration', name: d.name, id: d.id })),
    ...LAND.filter((l, i) => i > 0 && l.level === level).map(() => ({ kind: 'Land', name: 'More land to buy', id: 'land' })),
  ]
}

// ---- the map ----
export function cells(obj) {
  const { w, h } = sizeOf(obj.type)
  const out = []
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push([obj.x + dx, obj.y + dy])
  return out
}

/** Can `type` sit with its top left at (x, y)? `ignore` is the uid being moved. */
export function fits(objects, type, x, y, cols, rows, ignore = null) {
  const { w, h } = sizeOf(type)
  if (x < 0 || y < 0 || x + w > cols || y + h > rows) return false
  const taken = new Set()
  for (const o of objects) {
    if (o.uid === ignore) continue
    for (const [cx, cy] of cells(o)) taken.add(`${cx},${cy}`)
  }
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (taken.has(`${x + dx},${y + dy}`)) return false
  return true
}

export function firstFree(objects, type, cols, rows) {
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (fits(objects, type, x, y, cols, rows)) return { x, y }
  return null
}

// ---- the barn ----
export function barnCount(barn) {
  return Object.values(barn).reduce((a, b) => a + b, 0)
}

export function hasAll(barn, needs, times = 1) {
  return Object.entries(needs).every(([id, n]) => (barn[id] ?? 0) >= n * times)
}

/** Things the player can make at this level (for orders and Pip's wishes). */
export function goodsAvailable(level, ownedTypes = new Set()) {
  // fruit and products need the tree or building first
  const raw = Object.values(GOODS).filter((g) => {
    if (g.level > level || g.kind === 'dish') return false
    if (g.kind === 'fruit') return TREES.some((t) => t.fruit === g.id && ownedTypes.has(t.id))
    if (g.kind === 'product') return PRODUCERS.some((p) => p.makes === g.id && ownedTypes.has(p.id))
    return true
  })
  const have = new Set(raw.map((g) => g.id))
  const dishes = RECIPES.filter((r) => r.level <= level && Object.keys(r.needs).every((id) => have.has(id))).map((r) => GOODS[r.id])
  return [...raw, ...dishes]
}

/** A new order from a critter neighbour, with things this farm can actually make. */
export function makeOrder(level, ownedTypes, rand = Math.random) {
  const pool = goodsAvailable(level, ownedTypes)
  const critter = CRITTERS[Math.floor(rand() * CRITTERS.length)]
  const liked = pool.filter((g) => critter.likes.includes(g.id))
  const count = level < 3 ? 1 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 3)
  const needs = {}
  for (let i = 0; i < count; i++) {
    const from = i === 0 && liked.length ? liked : pool
    const g = from[Math.floor(rand() * from.length)]
    if (!g || needs[g.id]) continue
    const many = g.kind === 'dish' ? 1 + Math.floor(rand() * 2) : g.kind === 'crop' ? 2 + Math.floor(rand() * (3 + level / 3)) : 1 + Math.floor(rand() * 3)
    needs[g.id] = many
  }
  const value = Object.entries(needs).reduce((s, [id, n]) => s + GOODS[id].sell * n, 0)
  return {
    id: `${Date.now().toString(36)}${Math.floor(rand() * 1e6).toString(36)}`,
    critter: critter.id,
    needs,
    petals: Math.round(value * 1.6) + 3,
    xp: Math.round(value / 2) + 2,
  }
}

export { GOODS, xpForLevel }
