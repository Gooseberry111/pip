// Sharing farms with friends through the /api/farm Netlify function.
// A farm is only online if its owner turns sharing on. Friends find it by its code.
// The owner's secret key (kept on this device) is what lets this phone update the farm.

async function call(path, options = {}) {
  let res
  try {
    res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } })
  } catch {
    return { ok: false, reason: 'offline' }
  }
  const type = res.headers.get('content-type') || ''
  if (res.status === 404 && !type.includes('application/json')) return { ok: false, reason: 'unavailable' }
  if (!type.includes('application/json')) return { ok: false, reason: 'unavailable' }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, reason: data.error || 'server' }
  return { ok: true, ...data }
}

export function publishFarm({ code, key, farm, listed }) {
  return call('/api/farm', { method: 'POST', body: JSON.stringify({ code, key, farm, listed }) })
}

export function unpublishFarm({ code, key }) {
  return call('/api/farm', { method: 'DELETE', body: JSON.stringify({ code, key }) })
}

export function fetchFarm(code) {
  return call(`/api/farm?code=${encodeURIComponent(code)}`)
}

export function helpFarm({ code, uid, from }) {
  return call('/api/farm/help', { method: 'POST', body: JSON.stringify({ code, uid, from }) })
}

export function sendGift({ code, from, good, n }) {
  return call('/api/farm/gift', { method: 'POST', body: JSON.stringify({ code, from, good, n }) })
}

export function fetchBoard(codes) {
  return call(`/api/farm/board?codes=${encodeURIComponent(codes.join(','))}`)
}

export function exploreFarms() {
  return call('/api/farm/explore')
}

export const SHARE_ERRORS = {
  offline: 'You’re offline. Try again when you’re connected.',
  unavailable: 'Visiting farms works on the online version of Pip (on Netlify).',
  'not-found': 'No farm with that code. Check the letters and try again.',
  'bad-code': 'Farm codes are 6 letters and numbers.',
  'not-yours': 'That farm code belongs to another phone.',
  'too-big': 'This farm is too big to share right now.',
  limit: 'That farm has had lots of help today. Try again tomorrow.',
  name: 'Please pick a kinder farm name.',
  server: 'Something went wrong. Try again in a moment.',
}
