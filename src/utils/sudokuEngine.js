// Seed Sudoku: build puzzles with exactly one answer. Works for 4x4, 6x6 and 9x9 grids.
// A grid is a flat array of length n*n; 0 means empty, 1..n is a seed.

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box size: rows and columns of each little box. */
export function boxOf(n) {
  if (n === 4) return { br: 2, bc: 2 }
  if (n === 6) return { br: 2, bc: 3 }
  return { br: 3, bc: 3 }
}

// which cells share a row, column or box with each cell
const peerCache = new Map()
export function peers(n) {
  if (peerCache.has(n)) return peerCache.get(n)
  const { br, bc } = boxOf(n)
  const list = []
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n)
    const c = i % n
    const set = new Set()
    for (let k = 0; k < n; k++) {
      set.add(r * n + k)
      set.add(k * n + c)
    }
    const r0 = Math.floor(r / br) * br
    const c0 = Math.floor(c / bc) * bc
    for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) set.add(y * n + x)
    set.delete(i)
    list.push([...set])
  }
  peerCache.set(n, list)
  return list
}

function candidates(grid, n, i, P) {
  const used = new Array(n + 1).fill(false)
  for (const j of P[i]) used[grid[j]] = true
  const out = []
  for (let v = 1; v <= n; v++) if (!used[v]) out.push(v)
  return out
}

/** Fill the empty cells. Returns how many answers there are, up to `limit`. */
export function countSolutions(grid, n, limit = 2) {
  const g = grid.slice()
  const P = peers(n)
  let count = 0
  function solve() {
    // the emptiest choice first keeps this quick
    let best = -1
    let bestC = null
    for (let i = 0; i < g.length; i++) {
      if (g[i]) continue
      const c = candidates(g, n, i, P)
      if (!c.length) return
      if (!bestC || c.length < bestC.length) {
        best = i
        bestC = c
        if (c.length === 1) break
      }
    }
    if (best < 0) {
      count++
      return
    }
    for (const v of bestC) {
      g[best] = v
      solve()
      if (count >= limit) return
    }
    g[best] = 0
  }
  solve()
  return count
}

function solvedGrid(n, rand) {
  const g = new Array(n * n).fill(0)
  const P = peers(n)
  function fill(i) {
    if (i === g.length) return true
    const c = candidates(g, n, i, P)
    for (let k = c.length - 1; k > 0; k--) {
      const j = Math.floor(rand() * (k + 1))
      ;[c[k], c[j]] = [c[j], c[k]]
    }
    for (const v of c) {
      g[i] = v
      if (fill(i + 1)) return true
    }
    g[i] = 0
    return false
  }
  fill(0)
  return g
}

/**
 * A puzzle with one answer and about `givens` seeds showing (never fewer than it can manage
 * while staying unique). The same seed always gives the same puzzle.
 */
export function makeSudoku(n, givens, seed) {
  const rand = rng(seed)
  const solution = solvedGrid(n, rand)
  const puzzle = solution.slice()
  const order = Array.from({ length: n * n }, (_, i) => i)
  for (let k = order.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1))
    ;[order[k], order[j]] = [order[j], order[k]]
  }
  let shown = n * n
  for (const i of order) {
    if (shown <= givens) break
    const keep = puzzle[i]
    puzzle[i] = 0
    if (countSolutions(puzzle, n, 2) !== 1) puzzle[i] = keep
    else shown--
  }
  return { puzzle, solution, givens: shown }
}
