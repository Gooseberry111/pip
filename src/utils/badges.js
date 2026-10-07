// Badge progress and Pip's personality, worked out from what's been done so far.
import { BADGES } from '@/data/badges'
import { RECIPES, GOODS } from '@/data/farm'
import { daysTogether } from '@/utils/timeOfDay'

/** A summary of Pip and the farm that badges and personality read from. */
export function summary(pip, farm) {
  const stats = new Proxy(pip.stats ?? {}, { get: (t, k) => t[k] ?? 0 })
  const almanac = farm?.state?.almanac ?? {}
  return {
    stats,
    level: pip.growthLevel,
    days: pip.startedAt ? daysTogether(pip.startedAt) : 0,
    facts: pip.factsSeen?.length ?? 0,
    stars: Object.values(pip.levels ?? {}).reduce((sum, g) => sum + Object.values(g.stars ?? {}).reduce((a, b) => a + b, 0), 0),
    farmLevel: farm?.state?.level ?? 1,
    recipes: RECIPES.filter((r) => almanac[r.id] > 0).length,
    almanac: Object.values(GOODS).filter((g) => g.kind !== 'dish' && almanac[g.id] > 0).length,
  }
}

/** Every badge with its progress. */
export function badgeList(pip, farm) {
  const c = summary(pip, farm)
  return BADGES.map((b) => {
    const value = Math.min(b.target, b.value(c) || 0)
    return { ...b, value, earned: pip.badges.includes(b.id), ready: value >= b.target && !pip.badges.includes(b.id) }
  })
}

// ---- personality ----
// Pip's character grows from how the two of you spend time together.
export const TRAITS = {
  playful: { name: 'Playful', icon: '🎈', line: 'loves a good game', events: ['game', 'stars'] },
  cuddly: { name: 'Cuddly', icon: '🧸', line: 'adores being looked after', events: ['petDay', 'treat', 'drink'] },
  hardworking: { name: 'Green fingered', icon: '🌾', line: 'is happiest on the farm', events: ['harvest', 'order', 'cook', 'plant'] },
  curious: { name: 'Curious', icon: '🔎', line: 'always wants to know more', events: ['chat', 'fact'] },
  calm: { name: 'Calm', icon: '🍃', line: 'likes slow, quiet moments', events: ['breathe', 'checkin'] },
  social: { name: 'Friendly', icon: '🤝', line: 'loves visiting friends', events: ['visit', 'giftSent', 'giftReceived', 'community'] },
}

// some things happen far more often than others; these even them out
const WEIGHT = { game: 1, stars: 0.3, petDay: 2, treat: 1, drink: 0.6, harvest: 0.3, order: 1, cook: 0.8, plant: 0.15, chat: 0.5, fact: 1, breathe: 2, checkin: 1.5, visit: 1, giftSent: 2, giftReceived: 1, community: 3 }

export function personality(pip) {
  const stats = { ...(pip.stats ?? {}), fact: pip.factsSeen?.length ?? 0 }
  const scores = Object.entries(TRAITS).map(([id, t]) => ({
    id,
    ...t,
    score: t.events.reduce((sum, e) => sum + (stats[e] ?? 0) * (WEIGHT[e] ?? 1), 0),
  }))
  const total = scores.reduce((s, t) => s + t.score, 0)
  if (total < 12) return { growing: true, traits: [] } // too early to tell
  scores.sort((a, b) => b.score - a.score)
  const top = scores.filter((t, i) => i === 0 || (i === 1 && t.score >= scores[0].score * 0.6))
  return { growing: false, traits: top.map((t) => ({ ...t, share: Math.round((t.score / total) * 100) })) }
}
