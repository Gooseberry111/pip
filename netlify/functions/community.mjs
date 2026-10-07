// The neighbourhood goal: every farmer's orders count towards one shared goal each week.
//
//   GET  /api/community            { week, total, goal, players }
//   POST /api/community            add orders { deviceId, add }
//
// The goal grows with the number of people taking part, so it's always within reach
// if everyone helps a little. Phones are counted by a hash of their anonymous id.
import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

const PER_PLAYER = 20 // orders each person is expected to add in a week
const MIN_GOAL = 60
const MAX_ADD = 20 // per request
const MAX_PER_PLAYER = 300 // per week, so nobody can fill it alone

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

/** Monday of this week (UTC), as YYYYMMDD. */
function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

const goalFor = (players) => Math.max(MIN_GOAL, players * PER_PLAYER)

export default async (req) => {
  let store
  try {
    store = getStore({ name: 'pip-community', consistency: 'strong' })
  } catch (err) {
    console.error('community store unavailable', err)
    return json({ error: 'server' }, 500)
  }
  const week = weekKey()
  try {
    const rec = (await store.get(`week:${week}`, { type: 'json' })) ?? { total: 0, players: 0 }

    if (req.method === 'GET') {
      return json({ week, total: rec.total, goal: goalFor(rec.players), players: rec.players })
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const device = String(body.deviceId || '')
      if (!/^[a-f0-9]{8,64}$/.test(device)) return json({ error: 'bad-request' }, 400)
      const add = Math.max(0, Math.min(MAX_ADD, Math.floor(Number(body.add) || 0)))
      const devKey = `week:${week}:dev:${createHash('sha256').update(device).digest('hex').slice(0, 32)}`
      const mine = Number(await store.get(devKey)) || 0
      const counted = Math.max(0, Math.min(add, MAX_PER_PLAYER - mine))
      if (!mine) rec.players += 1
      rec.total += counted
      await store.set(devKey, String(mine + counted))
      await store.setJSON(`week:${week}`, rec)
      return json({ week, total: rec.total, goal: goalFor(rec.players), players: rec.players, counted })
    }

    return json({ error: 'method' }, 405)
  } catch (err) {
    console.error('community failed', err)
    return json({ error: 'server' }, 500)
  }
}

export const config = { path: '/api/community' }
