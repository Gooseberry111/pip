// Shared farms: friends can visit each other's farms with a 6 character code.
//
//   GET    /api/farm?code=ABC123      a farm's public snapshot (layout, crops, Pip's look)
//   POST   /api/farm                  publish or update your farm { code, key, farm, listed }
//   DELETE /api/farm                  stop sharing { code, key }
//   POST   /api/farm/help             water a crop on someone's farm { code, uid, from }
//   GET    /api/farm/explore          recently updated farms whose owners chose to be listed
//
// Stored in Netlify Blobs (free). Nothing personal is kept: a farm name, a plant name,
// the layout, and first names friends type when they visit. The owner's key is stored
// only as a hash, so nobody else can change a farm even if they know its code.
import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

const CODE = /^[A-HJ-NP-Z2-9]{6}$/
const MAX_BYTES = 60_000
const MAX_HELPS_KEPT = 60
const HELPS_PER_DAY = 40
const EXPLORE_SIZE = 30

// a short list of words that should never appear in a shared name
const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'nigg', 'faggot', 'slut', 'whore', 'pussy', 'rapist', 'nazi', 'porn']

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
const kind = (text) => !BLOCKED.some((w) => text.toLowerCase().replace(/[^a-z]/g, '').includes(w))
const hash = (key) => createHash('sha256').update(String(key)).digest('hex')
const today = () => new Date().toISOString().slice(0, 10)

function farms() {
  return getStore({ name: 'pip-farms', consistency: 'strong' })
}

async function readIndex(store) {
  return (await store.get('index:listed', { type: 'json' }).catch(() => null)) ?? []
}

async function writeIndex(store, entry, remove = false) {
  const list = (await readIndex(store)).filter((e) => e.code !== entry.code)
  if (!remove) list.unshift(entry)
  await store.setJSON('index:listed', list.slice(0, EXPLORE_SIZE))
}

/** Keep only what a visitor needs to draw the farm. */
function sanitizeFarm(f) {
  const objects = Array.isArray(f?.objects) ? f.objects.slice(0, 400) : []
  return {
    name: clean(f?.name, 24) || 'A little farm',
    plant: clean(f?.plant, 16) || 'Pip',
    level: Math.max(1, Math.min(99, Number(f?.level) || 1)),
    rows: Math.max(6, Math.min(30, Number(f?.rows) || 10)),
    objects: objects.map((o) => ({
      uid: Number(o.uid) || 0,
      type: clean(o.type, 20),
      x: Number(o.x) || 0,
      y: Number(o.y) || 0,
      ...(o.crop ? { crop: { id: clean(o.crop.id, 20), plantedAt: Number(o.crop.plantedAt) || 0, readyAt: Number(o.crop.readyAt) || 0 } } : {}),
      ...(o.readyAt ? { readyAt: Number(o.readyAt) || 0 } : {}),
    })),
    pip: {
      growth: Number(f?.pip?.growth) || 0,
      pot: clean(f?.pip?.pot, 20),
      leaf: clean(f?.pip?.leaf, 20),
      flower: f?.pip?.flower ? clean(f.pip.flower, 20) : null,
    },
    at: Date.now(),
  }
}

export default async (req) => {
  const url = new URL(req.url)
  const sub = url.pathname.replace(/^\/api\/farm\/?/, '')
  let store
  try {
    store = farms()
  } catch (err) {
    console.error('farm store unavailable', err)
    return json({ error: 'server' }, 500)
  }

  try {
    // ---- explore ----
    if (sub === 'explore' && req.method === 'GET') {
      return json({ farms: await readIndex(store) })
    }

    // ---- a visitor waters a crop ----
    if (sub === 'help' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const code = String(body.code || '').toUpperCase()
      if (!CODE.test(code)) return json({ error: 'bad-code' }, 400)
      const rec = await store.get(`farm:${code}`, { type: 'json' })
      if (!rec) return json({ error: 'not-found' }, 404)
      const day = today()
      const count = rec.helpDay === day ? rec.helpCount ?? 0 : 0
      if (count >= HELPS_PER_DAY) return json({ error: 'limit' }, 429)
      const from = clean(body.from, 16)
      const help = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, uid: Number(body.uid) || 0, from: from && kind(from) ? from : 'A friend', at: Date.now() }
      rec.helps = [...(rec.helps ?? []), help].slice(-MAX_HELPS_KEPT)
      rec.helpDay = day
      rec.helpCount = count + 1
      await store.setJSON(`farm:${code}`, rec)
      return json({ ok: true })
    }

    if (sub) return json({ error: 'not-found' }, 404)

    // ---- read a farm ----
    if (req.method === 'GET') {
      const code = String(url.searchParams.get('code') || '').toUpperCase()
      if (!CODE.test(code)) return json({ error: 'bad-code' }, 400)
      const rec = await store.get(`farm:${code}`, { type: 'json' })
      if (!rec) return json({ error: 'not-found' }, 404)
      return json({ code, farm: rec.farm })
    }

    const raw = await req.text()
    if (raw.length > MAX_BYTES) return json({ error: 'too-big' }, 413)
    let body
    try {
      body = JSON.parse(raw)
    } catch {
      return json({ error: 'bad-request' }, 400)
    }
    const code = String(body.code || '').toUpperCase()
    if (!CODE.test(code) || typeof body.key !== 'string' || body.key.length < 16) return json({ error: 'bad-code' }, 400)
    const existing = await store.get(`farm:${code}`, { type: 'json' })
    if (existing && existing.keyHash !== hash(body.key)) return json({ error: 'not-yours' }, 403)

    // ---- stop sharing ----
    if (req.method === 'DELETE') {
      if (existing) {
        await store.delete(`farm:${code}`)
        await writeIndex(store, { code }, true)
      }
      return json({ ok: true })
    }

    // ---- publish ----
    if (req.method === 'POST') {
      const farm = sanitizeFarm(body.farm)
      if (!kind(farm.name) || !kind(farm.plant)) return json({ error: 'name' }, 400)
      const rec = { ...(existing ?? {}), keyHash: hash(body.key), farm, listed: Boolean(body.listed), updatedAt: Date.now() }
      await store.setJSON(`farm:${code}`, rec)
      if (rec.listed) await writeIndex(store, { code, name: farm.name, plant: farm.plant, level: farm.level, at: farm.at })
      else if (existing?.listed) await writeIndex(store, { code }, true)
      return json({ ok: true, helps: rec.helps ?? [] })
    }

    return json({ error: 'method' }, 405)
  } catch (err) {
    console.error('farm function failed', err)
    return json({ error: 'server' }, 500)
  }
}

export const config = { path: ['/api/farm', '/api/farm/*'] }
