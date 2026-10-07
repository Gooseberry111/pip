// Garden Checkers rules (English draughts on 8 x 8).
// Board: 64 numbers. 1 = your ladybird, 2 = your crowned ladybird, -1 / -2 = the beetles.
// Ladybirds (side 1) start at the bottom and move up. Jumps are compulsory, and a piece
// keeps jumping while it can. Reaching the far row crowns a piece and ends the move.

export const N = 8
const rc = (i) => [Math.floor(i / N), i % N]
const at = (r, c) => (r >= 0 && r < N && c >= 0 && c < N ? r * N + c : -1)

export function startBoard() {
  const b = Array(64).fill(0)
  for (let i = 0; i < 64; i++) {
    const [r, c] = rc(i)
    if ((r + c) % 2 === 0) continue
    if (r < 3) b[i] = -1
    if (r > 4) b[i] = 1
  }
  return b
}

function dirsFor(piece) {
  if (Math.abs(piece) === 2) return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  return piece > 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
}

const crowns = (piece, sq) => Math.abs(piece) === 1 && rc(sq)[0] === (piece > 0 ? 0 : N - 1)

/** Every legal move for a side: { from, path: [squares], caps: [squares] }. */
export function legalMoves(b, side) {
  const jumps = []
  for (let i = 0; i < 64; i++) {
    if (Math.sign(b[i]) !== side) continue
    const piece = b[i]
    const walk = (sq, path, caps) => {
      let extended = false
      if (!(path.length && crowns(piece, sq))) {
        const [r, c] = rc(sq)
        for (const [dr, dc] of dirsFor(piece)) {
          const mid = at(r + dr, c + dc)
          const land = at(r + dr * 2, c + dc * 2)
          if (mid < 0 || land < 0) continue
          if (Math.sign(b[mid]) !== -side || caps.includes(mid)) continue
          if (b[land] !== 0 && land !== i) continue
          extended = true
          walk(land, [...path, land], [...caps, mid])
        }
      }
      if (!extended && path.length) jumps.push({ from: i, path, caps })
    }
    walk(i, [], [])
  }
  if (jumps.length) return jumps
  const steps = []
  for (let i = 0; i < 64; i++) {
    if (Math.sign(b[i]) !== side) continue
    const [r, c] = rc(i)
    for (const [dr, dc] of dirsFor(b[i])) {
      const to = at(r + dr, c + dc)
      if (to >= 0 && b[to] === 0) steps.push({ from: i, path: [to], caps: [] })
    }
  }
  return steps
}

export function applyMove(b, move) {
  const next = [...b]
  const piece = next[move.from]
  next[move.from] = 0
  for (const cap of move.caps) next[cap] = 0
  const to = move.path[move.path.length - 1]
  next[to] = crowns(piece, to) ? piece * 2 : piece
  return next
}

// ---- Pip's thinking ----
function evaluate(b, side) {
  let score = 0
  for (let i = 0; i < 64; i++) {
    const p = b[i]
    if (!p) continue
    const [r, c] = rc(i)
    let v = Math.abs(p) === 2 ? 170 : 100
    if (Math.abs(p) === 1) v += (p > 0 ? N - 1 - r : r) * 4 // pushing forward
    if (c > 1 && c < 6 && r > 1 && r < 6) v += 6 // the middle
    if (Math.abs(p) === 1 && r === (p > 0 ? N - 1 : 0)) v += 8 // guarding the back row
    score += Math.sign(p) * v
  }
  return score * side
}

function negamax(b, side, depth, alpha, beta, deadline, stats) {
  const moves = legalMoves(b, side)
  if (!moves.length) return -100000 - depth
  if (depth === 0 || performance.now() > deadline) {
    // keep going while there are captures, so Pip doesn't stop mid swap
    if (moves[0].caps.length && stats.q < 6) {
      stats.q++
      depth = 1
    } else return evaluate(b, side)
  }
  let best = -Infinity
  moves.sort((x, y) => y.caps.length - x.caps.length)
  for (const m of moves) {
    const v = -negamax(applyMove(b, m), -side, depth - 1, -beta, -alpha, deadline, stats)
    if (v > best) best = v
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

/** Pick a move for `side`. depth is how far Pip looks ahead; noise makes easier levels slip up. */
export function chooseMove(b, side, { depth = 4, noise = 0, timeMs = 700 } = {}) {
  const moves = legalMoves(b, side)
  if (moves.length <= 1) return moves[0] ?? null
  if (noise && Math.random() < noise) return moves[Math.floor(Math.random() * moves.length)]
  const deadline = performance.now() + timeMs
  let bestMoves = moves
  // look a little further each time, while there's time
  for (let d = 1; d <= depth; d++) {
    let best = -Infinity
    let picks = []
    for (const m of moves) {
      const v = -negamax(applyMove(b, m), -side, d - 1, -Infinity, Infinity, deadline, { q: 0 })
      if (v > best + 0.5) {
        best = v
        picks = [m]
      } else if (Math.abs(v - best) <= 0.5) picks.push(m)
    }
    if (performance.now() > deadline && d > 1) break
    bestMoves = picks
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}

export function countPieces(b) {
  let mine = 0
  let theirs = 0
  for (const p of b) {
    if (p > 0) mine++
    else if (p < 0) theirs++
  }
  return { mine, theirs }
}
