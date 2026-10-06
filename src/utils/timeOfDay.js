// The home scene follows the real sky, so Pip lives in the same day you do.

export const DAY_PHASES = {
  dawn: {
    skyTop: '#F3D3C2', skyBottom: '#FBEDE0', glow: '#FBE3C4', orb: '#F9D9AE', orbY: 0.62,
    hills: ['#EBD3C1', '#E3C6B1'], floor: '#E6D2BC', floorTop: '#EFDFCB', floorEdge: '#D8C0A6',
    motes: '#FFF6E6', dark: false,
  },
  day: {
    skyTop: '#D8E8EC', skyBottom: '#F8F2E7', glow: '#FFF7E3', orb: '#FBEFCB', orbY: 0.22,
    hills: ['#DCE3D0', '#CFD9C0'], floor: '#E6D2BC', floorTop: '#F0E1CD', floorEdge: '#D8C0A6',
    motes: '#FFFBF0', dark: false,
  },
  dusk: {
    skyTop: '#EDB9A2', skyBottom: '#F8DFCA', glow: '#FAD4B4', orb: '#F4B08A', orbY: 0.58,
    hills: ['#E2B39C', '#D6A58E'], floor: '#DDC2A8', floorTop: '#E9D2BA', floorEdge: '#CBAE92',
    motes: '#FFE9D2', dark: false,
  },
  night: {
    skyTop: '#3F4A68', skyBottom: '#6D7894', glow: '#8C93AE', orb: '#F3EBD6', orbY: 0.2,
    hills: ['#56617D', '#4C5672'], floor: '#B8A792', floorTop: '#C9B9A4', floorEdge: '#9E8D79',
    motes: '#F8E3A2', dark: true,
  },
}

export function getDayPhase(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Hello, night owl'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Calendar days since a timestamp, starting at "Day 1". Never resets. */
export function daysTogether(since, now = Date.now()) {
  if (!since) return 1
  const start = new Date(since)
  start.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((today - start) / 86400000) + 1)
}
