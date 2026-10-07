// Talking to Pip. If an AI is set up on the server (a free Gemini key, for example),
// messages go to the /api/chat Netlify function. Otherwise Pip uses its own built-in brain.

let mode = null // 'ai' | 'brain', worked out once per session

/** Find out whether an AI is set up. Anything unexpected means Pip uses its own brain. */
export async function chatMode() {
  if (mode) return mode
  try {
    const res = await fetch('/api/chat', { cache: 'no-store' })
    const type = res.headers.get('content-type') || ''
    const data = res.ok && type.includes('application/json') ? await res.json() : {}
    mode = data.ai ? 'ai' : 'brain'
  } catch {
    // offline: try again next time, use the brain for now
    return 'brain'
  }
  return mode
}

export function useBrainFromNowOn() {
  mode = 'brain'
}

/**
 * Ask the AI. Returns { ok: true, reply, remaining } or { ok: false, reason }.
 * reason: 'not-configured' | 'limit' | 'too-long' | 'busy' | 'slow' | 'offline' | 'server'
 */
export async function askPip({ deviceId, messages, pip }) {
  let res
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, messages, pip }),
    })
  } catch {
    return { ok: false, reason: 'offline' }
  }

  const type = res.headers.get('content-type') || ''
  if (res.status === 404 || !type.includes('application/json')) return { ok: false, reason: 'not-configured' }

  const data = await res.json().catch(() => ({}))
  if (res.ok && data.reply) return { ok: true, reply: data.reply, remaining: data.remaining }
  return { ok: false, reason: data.error || 'server', limit: data.limit }
}
