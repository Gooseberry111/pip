// Pond Fishing: a hook swings under the boat; tap to drop it. It goes straight out along
// the swing until it snags something or reaches the edge, then reels back in. Heavy catches
// reel in slowly. The pond is 100 wide and 160 deep; the hook hangs from (50, 14).

export const POND_W = 100
export const POND_H = 160
export const PIVOT = { x: 50, y: 14 }
const CAST = 105 // units per second going out
const REEL = 150 // coming back empty
const SWING = 1.15 // radians either side

export const FISH = {
  minnow: { name: 'Minnow', r: 3, pts: 10, weight: 1, speed: 20, depth: [32, 80] },
  perch: { name: 'Perch', r: 4.5, pts: 25, weight: 1.5, speed: 15, depth: [50, 110] },
  carp: { name: 'Carp', r: 6, pts: 45, weight: 2.4, speed: 10, depth: [85, 140] },
  koi: { name: 'Golden koi', r: 4, pts: 100, weight: 1.4, speed: 36, depth: [95, 145] },
  turtle: { name: 'Turtle', r: 6.5, pts: 60, weight: 3.6, speed: 6, depth: [110, 148] },
  boot: { name: 'Old boot', r: 5, pts: 0, weight: 3, speed: 2, depth: [120, 152], junk: true },
  puffer: { name: 'Pufferfish', r: 5, pts: -30, weight: 1.4, speed: 12, depth: [45, 130], junk: true },
  chest: { name: 'Treasure', r: 7, pts: 200, weight: 5, speed: 0, depth: [150, 152] },
}

export function newPond(cfg, rand = Math.random) {
  const pond = { fish: [], t: 0, hook: { state: 'swing', len: 0, angle: 0, catch: null }, score: 0, nextId: 1, caught: [] }
  for (let i = 0; i < cfg.count; i++) spawn(pond, cfg, rand, true)
  return pond
}

function pickKind(cfg, rand) {
  const entries = Object.entries(cfg.mix)
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [k, w] of entries) {
    r -= w
    if (r <= 0) return k
  }
  return entries[0][0]
}

export function spawn(pond, cfg, rand = Math.random, anywhere = false) {
  const kind = pickKind(cfg, rand)
  const f = FISH[kind]
  const dir = rand() < 0.5 ? -1 : 1
  const y = f.depth[0] + rand() * (f.depth[1] - f.depth[0])
  const x = anywhere ? 8 + rand() * 84 : dir > 0 ? -f.r * 2 : POND_W + f.r * 2
  pond.fish.push({ id: pond.nextId++, kind, x, y, dir, speed: f.speed * (cfg.speed ?? 1) * (0.8 + rand() * 0.4), r: f.r, bob: rand() * 6 })
}

export function hookTip(pond) {
  const h = pond.hook
  return { x: PIVOT.x + Math.sin(h.angle) * h.len, y: PIVOT.y + Math.cos(h.angle) * h.len }
}

/** Drop the hook (only while it's swinging). */
export function cast(pond) {
  if (pond.hook.state !== 'swing') return false
  pond.hook.state = 'out'
  return true
}

/**
 * Move everything on by dt. Returns events: [{ type: 'snag' | 'landed' | 'empty', fish }].
 */
export function tick(pond, cfg, dt, rand = Math.random) {
  const events = []
  pond.t += dt
  const h = pond.hook
  // fish swim; ones that leave the pond are replaced
  for (const f of pond.fish) {
    if (h.catch === f) continue
    f.x += f.dir * f.speed * dt
    if (f.x < -f.r * 3 || f.x > POND_W + f.r * 3) f.gone = true
  }
  const before = pond.fish.length
  pond.fish = pond.fish.filter((f) => !f.gone)
  for (let i = pond.fish.length; i < before; i++) spawn(pond, cfg, rand)

  if (h.state === 'swing') {
    h.angle = Math.sin(pond.t * (cfg.swing ?? 1.6)) * SWING
    h.len = 6
  } else if (h.state === 'out') {
    h.len += CAST * dt
    const tip = hookTip(pond)
    const hit = pond.fish.find((f) => Math.hypot(f.x - tip.x, f.y - tip.y) < f.r + 2.2)
    if (hit) {
      h.catch = hit
      h.state = 'in'
      events.push({ type: 'snag', fish: hit })
    } else if (tip.x < 0 || tip.x > POND_W || tip.y > POND_H) {
      h.state = 'in'
    }
  } else if (h.state === 'in') {
    const w = h.catch ? FISH[h.catch.kind].weight : 0
    h.len -= (h.catch ? (REEL * 0.85) / (0.6 + w * 0.55) : REEL) * dt
    if (h.catch) {
      const tip = hookTip(pond)
      h.catch.x = tip.x
      h.catch.y = tip.y + h.catch.r * 0.6
    }
    if (h.len <= 6) {
      h.len = 6
      h.state = 'swing'
      if (h.catch) {
        const f = h.catch
        pond.score = Math.max(0, pond.score + FISH[f.kind].pts)
        pond.caught.push(f.kind)
        pond.fish = pond.fish.filter((x) => x !== f)
        spawn(pond, cfg, rand)
        events.push({ type: 'landed', fish: f })
        h.catch = null
      } else {
        events.push({ type: 'empty' })
      }
      // carry on swinging from where it is
      pond.t = Math.asin(Math.max(-1, Math.min(1, h.angle / SWING))) / (cfg.swing ?? 1.6)
    }
  }
  return events
}
