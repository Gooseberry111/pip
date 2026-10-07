// Small, optional things to do with Pip each day. Each one gives petals the first time
// that day. Nothing is lost by skipping a day.

export const DAILY_TASKS = [
  { id: 'water', label: (name) => `Give ${name} a drink`, reward: 3, icon: 'drop' },
  { id: 'pet', label: (name) => `Say hi to ${name}`, reward: 2, icon: 'heart' },
  { id: 'breathe', label: () => 'Breathe together for a minute', reward: 5, icon: 'wind' },
  { id: 'play', label: () => 'Play a little game', reward: 5, icon: 'play' },
  { id: 'farm', label: () => 'Harvest something on the farm', reward: 3, icon: 'farm' },
]

export const GIFT_MESSAGES = [
  'I saved these for you.',
  'A little something, just because.',
  'I found these by the window.',
  'For you. Thanks for visiting.',
]

export const BREATHE_PHASES = [
  { id: 'in', label: 'Breathe in', seconds: 4 },
  { id: 'hold', label: 'Hold', seconds: 2 },
  { id: 'out', label: 'Breathe out', seconds: 6 },
]

export const BREATHE_ROUNDS = 5

export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}
