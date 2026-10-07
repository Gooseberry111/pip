// Weekly goals: three small goals each week. Finish all three to open the bloom box.
// Goals rotate every Monday and nothing carries over or is lost.

export const WEEKLY_POOL = [
  { id: 'water', event: 'water', target: 6, label: (n, name) => `Water ${name} ${n} times` },
  { id: 'stars', event: 'stars', target: 8, label: (n) => `Earn ${n} stars in games` },
  { id: 'games', event: 'game', target: 6, label: (n) => `Finish ${n} game rounds` },
  { id: 'breathe', event: 'breathe', target: 3, label: (n) => `Breathe together ${n} times` },
  { id: 'hello', event: 'petDay', target: 4, label: (n, name) => `Say hi to ${name} on ${n} days` },
  { id: 'checkin', event: 'checkin', target: 4, label: (n) => `Check in on ${n} days` },
  { id: 'gift', event: 'gift', target: 4, label: (n) => `Open ${n} daily gifts` },
  { id: 'harvest', event: 'harvest', target: 25, label: (n) => `Harvest ${n} times on the farm` },
  { id: 'cook', event: 'cook', target: 4, label: (n) => `Cook ${n} dishes in the kitchen` },
  { id: 'orders', event: 'order', target: 4, label: (n) => `Fill ${n} critter orders` },
  { id: 'drinks', event: 'drink', target: 12, label: (n, name) => `Give ${name} ${n} drinks at drink times` },
  { id: 'perfect', event: 'perfectDay', target: 2, label: (n) => `Have ${n} perfect days of drinks` },
  { id: 'wishes', event: 'wish', target: 3, label: (n, name) => `Make ${n} of ${name}’s wishes come true` },
]

export const GOAL_REWARD = 6
export const BLOOM_BOX_PETALS = 25

/** Monday of this week, as YYYYMMDD. */
export function weekKey(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/** Days until next Monday. */
export function daysLeftInWeek(date = new Date()) {
  return 7 - ((date.getDay() + 6) % 7)
}

/** Three goals for a given week, picked the same way every time for that week. */
export function goalsForWeek(key) {
  let seed = Number(key) % 2147483647
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const pool = [...WEEKLY_POOL]
  const picked = []
  while (picked.length < 3) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])
  return picked
}
