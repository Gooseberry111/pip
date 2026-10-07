// The neighbourhood goal: everyone's filled orders add up to one goal each week.
// Orders are counted here and sent to /api/community every couple of minutes.
import { ref } from 'vue'

/** { week, total, goal, players } or null when offline / not on Netlify */
export const community = ref(null)
let pending = 0
let deviceId = ''
let timer = null

async function call(method, body) {
  try {
    const res = await fetch('/api/community', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    const type = res.headers.get('content-type') || ''
    if (!res.ok || !type.includes('application/json')) return null
    return await res.json()
  } catch {
    return null
  }
}

async function flush() {
  if (pending > 0 && deviceId) {
    const add = Math.min(pending, 20)
    pending -= add
    const r = await call('POST', { deviceId, add })
    if (r) community.value = r
    else pending += add // try again next time
  } else {
    const r = await call('GET')
    if (r) community.value = r
  }
}

/** A filled order counts towards this week's goal. */
export function countOrder(n = 1) {
  pending += n
  clearTimeout(timer)
  timer = setTimeout(flush, 4000)
}

export function startCommunity(id) {
  deviceId = id
  flush()
  setInterval(() => {
    if (document.visibilityState === 'visible') flush()
  }, 2 * 60 * 1000)
}

export const COMMUNITY_REWARD = 30
