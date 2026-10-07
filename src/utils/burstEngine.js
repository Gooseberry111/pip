// Bloom Burst rules: a 7 x 8 match 3 board. Pure logic, no drawing, so the component can
// animate each step and the levels can be tested with a bot.
//
// Tiles: { id, type, special, r, c }. special is null | 'row' | 'col' | 'bee' | 'rainbow'.
//   4 in a line makes a watering can (row or col) that sweeps its line,
//   an L or T makes a bee that clears the 3 x 3 around it,
//   5 in a line makes a rainbow seed that clears every flower of one kind.
// Mud sits under tiles. Clearing a tile on mud washes one layer away.

export const COLS = 7
export const ROWS = 8
export const POINTS = 60 // per tile cleared

let uid = 0
export function makeTile(type, special = null, r = 0, c = 0) {
  return { id: ++uid, type, special, r, c, pop: false, fresh: false }
}

const key = (r, c) => r * COLS + c
const inside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS
const matchable = (t) => t && t.special !== 'rainbow'

export function newState(level, types, rng = Math.random) {
  const kinds = types.slice(0, level.types)
  const mud = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  for (const [r, c, layers] of level.mud ?? []) mud[r][c] = layers
  const state = { grid: [], mud, kinds, rng }
  fillFresh(state)
  return state
}

function randomKind(state) {
  return state.kinds[Math.floor(state.rng() * state.kinds.length)]
}

/** A fresh board with no matches already on it and at least one move. */
function fillFresh(state) {
  for (let tries = 0; tries < 100; tries++) {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        let type
        do type = randomKind(state)
        while (
          (c >= 2 && g[r][c - 1].type === type && g[r][c - 2].type === type) ||
          (r >= 2 && g[r - 1][c].type === type && g[r - 2][c].type === type)
        )
        g[r][c] = makeTile(type, null, r, c)
      }
    state.grid = g
    if (findMove(state)) return
  }
}

// ---- matching ----
export function findRuns(grid) {
  const runs = []
  for (let r = 0; r < ROWS; r++) {
    let c = 0
    while (c < COLS) {
      const t = grid[r][c]
      let end = c + 1
      if (matchable(t)) while (end < COLS && matchable(grid[r][end]) && grid[r][end].type === t.type) end++
      if (matchable(t) && end - c >= 3) runs.push({ dir: 'h', type: t.type, cells: Array.from({ length: end - c }, (_, i) => [r, c + i]) })
      c = end
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0
    while (r < ROWS) {
      const t = grid[r][c]
      let end = r + 1
      if (matchable(t)) while (end < ROWS && matchable(grid[end][c]) && grid[end][c].type === t.type) end++
      if (matchable(t) && end - r >= 3) runs.push({ dir: 'v', type: t.type, cells: Array.from({ length: end - r }, (_, i) => [r + i, c]) })
      r = end
    }
  }
  return runs
}

/** Runs that share a tile become one group (that's how L and T shapes are spotted). */
function groupRuns(runs) {
  const groups = []
  for (const run of runs) {
    const keys = new Set(run.cells.map(([r, c]) => key(r, c)))
    const joined = groups.filter((g) => g.type === run.type && [...keys].some((k) => g.keys.has(k)))
    const group = { type: run.type, keys: new Set(keys), runs: [run] }
    for (const g of joined) {
      g.keys.forEach((k) => group.keys.add(k))
      group.runs.push(...g.runs)
      groups.splice(groups.indexOf(g), 1)
    }
    groups.push(group)
  }
  return groups
}

function specialFor(group) {
  const longest = Math.max(...group.runs.map((r) => r.cells.length))
  const hasH = group.runs.some((r) => r.dir === 'h')
  const hasV = group.runs.some((r) => r.dir === 'v')
  if (longest >= 5) return 'rainbow'
  if (hasH && hasV) return 'bee'
  if (longest === 4) return group.runs[0].dir === 'h' ? 'row' : 'col'
  return null
}

function specialSpot(group, preferred) {
  for (const [r, c] of preferred) if (group.keys.has(key(r, c))) return [r, c]
  // where the runs cross
  if (group.runs.length > 1) {
    const seen = new Set()
    for (const run of group.runs)
      for (const [r, c] of run.cells) {
        const k = key(r, c)
        if (seen.has(k)) return [r, c]
        seen.add(k)
      }
  }
  const run = group.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a))
  return run.cells[Math.floor(run.cells.length / 2)]
}

// ---- what a special clears ----
function area(kind, r, c) {
  const out = []
  if (kind === 'row') for (let x = 0; x < COLS; x++) out.push([r, x])
  if (kind === 'col') for (let y = 0; y < ROWS; y++) out.push([y, c])
  if (kind === 'bee') for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) if (inside(y, x)) out.push([y, x])
  if (kind === 'cross') return [...area('row', r, c), ...area('col', r, c)]
  if (kind === 'bigcross') for (let d = -1; d <= 1; d++) out.push(...area('row', r + d, c).filter(([y]) => inside(y, 0)), ...area('col', r, c + d).filter(([, x]) => inside(0, x)))
  if (kind === 'big') for (let y = r - 2; y <= r + 2; y++) for (let x = c - 2; x <= c + 2; x++) if (inside(y, x)) out.push([y, x])
  if (kind === 'all') for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) out.push([y, x])
  return out
}

function mostCommonKind(state) {
  const counts = {}
  for (const row of state.grid) for (const t of row) if (matchable(t)) counts[t.type] = (counts[t.type] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
}

function cellsOfKind(state, type) {
  const out = []
  state.grid.forEach((row, r) => row.forEach((t, c) => t && t.type === type && t.special !== 'rainbow' && out.push([r, c])))
  return out
}

/**
 * Clear cells, setting off any specials caught up in it. Mutates the grid.
 * Returns { cleared: [tile], blasts: [{ kind, r, c }], mudWashed }.
 */
function clearCells(state, start, { keep = new Set(), fired = new Set() } = {}) {
  const toClear = new Set()
  const queue = []
  const blasts = []
  const add = ([r, c]) => {
    if (!inside(r, c)) return
    const k = key(r, c)
    if (toClear.has(k)) return
    toClear.add(k)
    queue.push([r, c])
  }
  start.forEach(add)
  while (queue.length) {
    const [r, c] = queue.shift()
    const t = state.grid[r][c]
    if (!t || !t.special || fired.has(t.id) || keep.has(key(r, c))) continue
    fired.add(t.id)
    if (t.special === 'rainbow') {
      const kind = mostCommonKind(state)
      blasts.push({ kind: 'rainbow', r, c, type: kind })
      if (kind) cellsOfKind(state, kind).forEach(add)
    } else {
      blasts.push({ kind: t.special, r, c })
      area(t.special, r, c).forEach(add)
    }
  }
  const cleared = []
  let mudWashed = 0
  for (const k of toClear) {
    const r = Math.floor(k / COLS)
    const c = k % COLS
    const t = state.grid[r][c]
    if (state.mud[r][c] > 0) {
      state.mud[r][c] -= 1
      mudWashed += 1
    }
    if (!t || keep.has(k)) continue
    cleared.push(t)
    state.grid[r][c] = null
  }
  return { cleared, blasts, mudWashed }
}

/**
 * One round of matching. Returns null when nothing matches, otherwise
 * { cleared, created, blasts, mudWashed, points }.
 */
export function matchStep(state, { preferred = [], chain = 0 } = {}) {
  const runs = findRuns(state.grid)
  if (!runs.length) return null
  const groups = groupRuns(runs)
  const created = []
  const start = []
  for (const g of groups) {
    for (const k of g.keys) start.push([Math.floor(k / COLS), k % COLS])
    const special = specialFor(g)
    if (special) {
      const [r, c] = specialSpot(g, preferred)
      created.push({ r, c, type: special === 'rainbow' ? 'rainbow' : g.type, special })
    }
  }
  const result = clearCells(state, start)
  for (const s of created) {
    const t = makeTile(s.type, s.special, s.r, s.c)
    t.fresh = true
    state.grid[s.r][s.c] = t
  }
  const bonus = created.reduce((sum, s) => sum + { row: 120, col: 120, bee: 200, rainbow: 400 }[s.special], 0)
  const points = Math.round(result.cleared.length * POINTS * (1 + chain * 0.5)) + bonus
  return { ...result, created, points }
}

/** Swapping two specials, or a rainbow with anything, sets off something big. */
export function comboStep(state, a, b) {
  const ta = state.grid[a[0]][a[1]]
  const tb = state.grid[b[0]][b[1]]
  if (!ta || !tb) return null
  const sa = ta.special
  const sb = tb.special
  if (!sa && !sb) return null
  if (sa !== 'rainbow' && sb !== 'rainbow' && (!sa || !sb)) return null

  const fired = new Set([ta.id, tb.id])
  const [r, c] = b
  let start = [a, b]
  let blasts = []
  if (sa === 'rainbow' && sb === 'rainbow') {
    start = area('all', r, c)
    blasts = [{ kind: 'rainbow', r, c, type: 'all' }]
  } else if (sa === 'rainbow' || sb === 'rainbow') {
    const other = sa === 'rainbow' ? tb : ta
    const cells = cellsOfKind(state, other.type)
    blasts = [{ kind: 'rainbow', r, c, type: other.type }]
    if (other.special) {
      // every flower of that kind turns special and goes off
      for (const [y, x] of cells) {
        const t = state.grid[y][x]
        if (t !== other) t.special = other.special === 'bee' ? 'bee' : state.rng() < 0.5 ? 'row' : 'col'
      }
      fired.delete(other.id)
    }
    start = [a, b, ...cells]
  } else {
    const lines = ['row', 'col']
    if (lines.includes(sa) && lines.includes(sb)) {
      start = [a, b, ...area('cross', r, c)]
      blasts = [{ kind: 'row', r, c }, { kind: 'col', r, c }]
    } else if (sa === 'bee' && sb === 'bee') {
      start = [a, b, ...area('big', r, c)]
      blasts = [{ kind: 'big', r, c }]
    } else {
      start = [a, b, ...area('bigcross', r, c)]
      blasts = [{ kind: 'row', r, c }, { kind: 'col', r, c }, { kind: 'bee', r, c }]
    }
  }
  const result = clearCells(state, start, { fired })
  return { ...result, blasts: [...blasts, ...result.blasts], created: [], points: result.cleared.length * POINTS + 500 }
}

/** Fire some specials directly (used for the leftover moves bonus). */
export function fireStep(state, cells) {
  const result = clearCells(state, cells)
  return { ...result, created: [], points: result.cleared.length * POINTS }
}

// ---- gravity ----
/** Tiles fall, new ones drop in from above (with a negative row so they can slide in). */
export function gravity(state) {
  const spawned = []
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1
    for (let r = ROWS - 1; r >= 0; r--) {
      const t = state.grid[r][c]
      if (!t) continue
      if (write !== r) {
        state.grid[write][c] = t
        state.grid[r][c] = null
      }
      t.r = write
      t.c = c
      write--
    }
    for (let r = write, n = 1; r >= 0; r--, n++) {
      const t = makeTile(randomKind(state), null, -n, c)
      state.grid[r][c] = t
      spawned.push({ tile: t, r })
    }
  }
  return spawned
}

/** Put every tile's position back in line with the grid (after spawning above the board). */
export function settle(state) {
  state.grid.forEach((row, r) =>
    row.forEach((t, c) => {
      if (!t) return
      t.r = r
      t.c = c
    }),
  )
}

// ---- swaps ----
export function adjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
}

export function swap(state, a, b) {
  const g = state.grid
  const ta = g[a[0]][a[1]]
  const tb = g[b[0]][b[1]]
  g[a[0]][a[1]] = tb
  g[b[0]][b[1]] = ta
  if (tb) Object.assign(tb, { r: a[0], c: a[1] })
  if (ta) Object.assign(ta, { r: b[0], c: b[1] })
}

function makesRun(grid, r, c) {
  const t = grid[r][c]
  if (!matchable(t)) return false
  const same = (y, x) => inside(y, x) && matchable(grid[y][x]) && grid[y][x].type === t.type
  let h = 1
  for (let x = c - 1; same(r, x); x--) h++
  for (let x = c + 1; same(r, x); x++) h++
  if (h >= 3) return true
  let v = 1
  for (let y = r - 1; same(y, c); y--) v++
  for (let y = r + 1; same(y, c); y++) v++
  return v >= 3
}

/** Would swapping these two do anything? */
export function swapWorks(state, a, b) {
  const g = state.grid
  const ta = g[a[0]][a[1]]
  const tb = g[b[0]][b[1]]
  if (!ta || !tb) return false
  if (ta.special === 'rainbow' || tb.special === 'rainbow') return true
  if (ta.special && tb.special) return true
  swap(state, a, b)
  const ok = makesRun(g, a[0], a[1]) || makesRun(g, b[0], b[1])
  swap(state, a, b)
  return ok
}

/** A swap that works, or null. Used for hints and for spotting a stuck board. */
export function findMove(state, all = false) {
  const found = []
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const b = [r + dr, c + dc]
        if (!inside(...b)) continue
        if (swapWorks(state, [r, c], b)) {
          if (!all) return [[r, c], b]
          found.push([[r, c], b])
        }
      }
  return all ? found : null
}

/** No moves left: mix the tiles up (keeping specials) until there is one. */
export function reshuffle(state) {
  const tiles = state.grid.flat().filter(Boolean)
  for (let tries = 0; tries < 200; tries++) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(state.rng() * (i + 1))
      ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    }
    tiles.forEach((t, i) => (state.grid[Math.floor(i / COLS)][i % COLS] = t))
    if (!findRuns(state.grid).length && findMove(state)) break
  }
  settle(state)
}

export function mudLeft(state) {
  return state.mud.flat().reduce((a, b) => a + b, 0)
}
