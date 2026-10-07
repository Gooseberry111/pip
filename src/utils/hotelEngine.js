// Bug Hotel rules: towers of rooms, bugs move from the top of one tower to another.
// A move carries the whole run of matching bugs on top (as many as fit), onto an empty
// tower or onto the same kind of bug. Every tower of one kind (or empty) means solved.
//
// Towers are arrays of bug kinds, bottom first. Levels are shuffled, then checked with a
// solver so every hotel can be sorted, and the solver's move count becomes the par.

export function topRun(tower) {
  if (!tower.length) return 0
  const kind = tower[tower.length - 1]
  let n = 0
  for (let i = tower.length - 1; i >= 0 && tower[i] === kind; i--) n++
  return n
}

/** How many bugs would move from a to b (0 if the move isn't allowed). */
export function moveCount(towers, a, b, height) {
  if (a === b) return 0
  const from = towers[a]
  const to = towers[b]
  if (!from.length || to.length >= height) return 0
  const kind = from[from.length - 1]
  if (to.length && to[to.length - 1] !== kind) return 0
  const run = topRun(from)
  // moving a whole tower into an empty one changes nothing
  if (!to.length && run === from.length) return 0
  return Math.min(run, height - to.length)
}

export function applyMove(towers, a, b, height) {
  const n = moveCount(towers, a, b, height)
  if (!n) return null
  const next = towers.map((t) => [...t])
  next[b].push(...next[a].splice(next[a].length - n, n))
  return next
}

export function solved(towers, height) {
  return towers.every((t) => !t.length || (t.length === height && t.every((k) => k === t[0])))
}

const keyOf = (towers) =>
  towers
    .map((t) => t.join(''))
    .sort()
    .join('|')

// how far from sorted: breaks between different bugs, plus bugs sitting on the wrong base
function score(towers) {
  let h = 0
  for (const t of towers) {
    for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) h++
  }
  const bases = new Map()
  for (const t of towers) if (t.length) bases.set(t[0], (bases.get(t[0]) ?? 0) + 1)
  for (const n of bases.values()) h += n - 1
  return h
}

/**
 * Weighted best-first search. Returns the moves ([a, b] pairs) or null if it gives up.
 */
export function solve(start, height, limit = 60000) {
  const heap = []
  const push = (node) => {
    heap.push(node)
    let i = heap.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (heap[p].f <= heap[i].f) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length) {
      heap[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < heap.length && heap[l].f < heap[m].f) m = l
        if (r < heap.length && heap[r].f < heap[m].f) m = r
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i], heap[m]]
        i = m
      }
    }
    return top
  }
  const seen = new Map()
  push({ towers: start, g: 0, f: score(start) * 1.6, path: null })
  seen.set(keyOf(start), 0)
  let nodes = 0
  while (heap.length && nodes < limit) {
    const node = pop()
    nodes++
    if (solved(node.towers, height)) {
      const moves = []
      for (let p = node.path; p; p = p.prev) moves.unshift(p.move)
      return moves
    }
    for (let a = 0; a < node.towers.length; a++)
      for (let b = 0; b < node.towers.length; b++) {
        const next = applyMove(node.towers, a, b, height)
        if (!next) continue
        const k = keyOf(next)
        const g = node.g + 1
        if (seen.has(k) && seen.get(k) <= g) continue
        seen.set(k, g)
        push({ towers: next, g, f: g + score(next) * 1.6, path: { move: [a, b], prev: node.path } })
      }
  }
  return null
}

/** A shuffled hotel that can be sorted. Returns { towers, par }. */
export function makeHotel({ kinds, empty, height }, rng = Math.random) {
  const kindsList = 'abcdefg'.slice(0, kinds).split('')
  for (let tries = 0; tries < 150; tries++) {
    const bugs = kindsList.flatMap((k) => Array(height).fill(k))
    for (let i = bugs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[bugs[i], bugs[j]] = [bugs[j], bugs[i]]
    }
    const towers = Array.from({ length: kinds }, (_, i) => bugs.slice(i * height, (i + 1) * height))
    for (let i = 0; i < empty; i++) towers.push([])
    // no free gifts: no tower already sorted, and not too many matching neighbours
    if (towers.some((t) => t.length && topRun(t) >= height - 1)) continue
    const moves = solve(towers, height)
    if (moves) return { towers, par: moves.length }
  }
  return null
}
