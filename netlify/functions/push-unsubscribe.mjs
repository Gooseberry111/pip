// Forgets a phone when reminders are turned off.
import { store, keyFor, json } from '../lib/push.mjs'
import { cors } from '../lib/cors.mjs'

const handler = async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  if (!body?.endpoint) return json({ error: 'Missing endpoint' }, 400)
  await store().delete(keyFor(body.endpoint))
  return json({ ok: true })
}

export default cors(handler)

export const config = { path: '/api/push/unsubscribe' }
