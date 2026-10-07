// Saves (or updates) one phone's reminder settings: when to say hello, Pip's name,
// the person's timezone, and when Pip will next get thirsty.
import { store, keyFor, json, setupProblem } from '../lib/push.mjs'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)
  const problem = setupProblem()
  if (problem) return json({ error: problem }, 503)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const sub = body?.subscription
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return json({ error: 'Missing subscription' }, 400)
  if (!/^https:\/\//.test(sub.endpoint)) return json({ error: 'Invalid endpoint' }, 400)

  const key = keyFor(sub.endpoint)
  let blobs
  let existing
  try {
    blobs = store()
    existing = (await blobs.get(key, { type: 'json' })) || {}
  } catch (err) {
    console.error('blobs read failed', err)
    return json({ error: `Could not open reminder storage: ${err?.message || err}` }, 500)
  }

  const record = {
    ...existing,
    subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
    name: String(body.name || 'Pip').slice(0, 16),
    time: TIME.test(body.time) ? body.time : '19:00',
    timeZone: typeof body.timeZone === 'string' ? body.timeZone.slice(0, 64) : 'UTC',
    thirstyAt: Number.isFinite(body.thirstyAt) ? body.thirstyAt : null,
    lastVisit: typeof body.lastVisit === 'string' ? body.lastVisit.slice(0, 10) : existing.lastVisit,
    updatedAt: Date.now(),
  }

  try {
    await blobs.setJSON(key, record)
  } catch (err) {
    console.error('blobs write failed', err)
    return json({ error: `Could not save reminder settings: ${err?.message || err}` }, 500)
  }
  return json({ ok: true })
}

export const config = { path: '/api/push/subscribe' }
