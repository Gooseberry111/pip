// Backups: everything about Pip and the farm, saved under a private recovery code.
//
//   POST   /api/backup            save { code, data }
//   GET    /api/backup?code=...   get it back on any phone
//   DELETE /api/backup            remove it { code }
//
// The code itself is the secret (12 characters, about a quintillion possibilities).
// It's stored only as a hash, so the stored key can't be turned back into a code.
import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

const CODE = /^[A-HJ-NP-Z2-9]{12}$/
const MAX_BYTES = 400_000

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

const clean = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const keyFor = (code) => `backup:${createHash('sha256').update(`pip-backup:${code}`).digest('hex')}`

export default async (req) => {
  let store
  try {
    store = getStore({ name: 'pip-backups', consistency: 'strong' })
  } catch (err) {
    console.error('backup store unavailable', err)
    return json({ error: 'server' }, 500)
  }

  try {
    if (req.method === 'GET') {
      const code = clean(new URL(req.url).searchParams.get('code'))
      if (!CODE.test(code)) return json({ error: 'bad-code' }, 400)
      const rec = await store.get(keyFor(code), { type: 'json' })
      if (!rec) return json({ error: 'not-found' }, 404)
      return json({ data: rec.data, at: rec.at })
    }

    const raw = await req.text()
    if (raw.length > MAX_BYTES) return json({ error: 'too-big' }, 413)
    let body
    try {
      body = JSON.parse(raw)
    } catch {
      return json({ error: 'bad-request' }, 400)
    }
    const code = clean(body.code)
    if (!CODE.test(code)) return json({ error: 'bad-code' }, 400)

    if (req.method === 'DELETE') {
      await store.delete(keyFor(code))
      return json({ ok: true })
    }

    if (req.method === 'POST') {
      const data = body.data
      if (!data || typeof data !== 'object' || !data.pip) return json({ error: 'bad-request' }, 400)
      const at = Date.now()
      await store.setJSON(keyFor(code), { data, at })
      return json({ ok: true, at })
    }

    return json({ error: 'method' }, 405)
  } catch (err) {
    console.error('backup failed', err)
    return json({ error: 'server' }, 500)
  }
}

export const config = { path: '/api/backup' }
