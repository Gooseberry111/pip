// Endless levels. Each game keeps its hand-made levels at the start; after those, levels are
// made from their number: the same number always gives the same level, for everyone.
//
// Difficulty rises in waves rather than a straight line: every 5th level is a little peak,
// every 10th a big one, and the level after a peak is a breather. Over time the whole wave
// climbs towards each game's hardest playable settings, and stays there.

export const ENDLESS = 999

/** A seeded random number generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WAVE = [0.15, 0.3, 0.45, 0.25, 0.7, 0.35, 0.5, 0.6, 0.4, 1]

/**
 * How hard generated level g is (g = 1 is the first level after the hand-made ones), 0 to 1.
 * Starts a little above the last hand-made level and climbs towards 1 over a few hundred levels.
 */
export function difficulty(g) {
  const climb = 1 - Math.exp(-g / 90)
  const wave = WAVE[(g - 1) % 10]
  return Math.min(1, 0.15 + climb * 0.6 + wave * 0.25)
}

export const lerp = (a, b, t) => a + (b - a) * t
export const pick = (list, rand) => list[Math.floor(rand() * list.length)]

/**
 * An array-like list of levels: the hand-made ones, then made ones up to ENDLESS.
 * make(n, g, d, rand) builds level n (g: its place after the hand-made ones, d: difficulty).
 * Made levels are built once, when first asked for. Works with [i], .length, .map and friends.
 */
export function endless(handmade, make, salt = 1) {
  const cache = new Map()
  const at = (i) => {
    if (i < handmade.length) return handmade[i]
    if (!cache.has(i)) {
      const n = i + 1
      const g = n - handmade.length
      const v = make(n, g, difficulty(g), rng(n * 7919 + salt * 104729))
      // objects get a `made` flag; lists (a level of puzzles) and plain numbers are kept as they are
      cache.set(i, v && typeof v === 'object' && !Array.isArray(v) ? Object.freeze({ ...v, made: true }) : v)
    }
    return cache.get(i)
  }
  const isIndex = (k) => typeof k === 'string' && /^\d+$/.test(k) && Number(k) < ENDLESS
  return new Proxy(handmade, {
    get(target, key, receiver) {
      if (key === 'length') return ENDLESS
      if (key === 'handmade') return handmade.length
      if (isIndex(key)) return at(Number(key))
      return Reflect.get(target, key, receiver)
    },
    has(target, key) {
      return isIndex(key) || Reflect.has(target, key)
    },
  })
}

/** The little label on a level tile: every 10th level is Expert, every 5th Hard. */
export function levelTier(n) {
  if (n % 10 === 0) return 'Expert'
  if (n % 5 === 0) return 'Hard'
  return ''
}
