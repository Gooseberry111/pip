// Garden Tiles: stacked tiles, tap free ones into a tray, three alike disappear.
// Positions are in half tiles, so upper layers can sit across the gaps of the layer below.
// Boards are built backwards from a winning order, so every board can be cleared.
import { rng } from './sudokuEngine'

export const TRAY = 7

/** a covers b when it sits on a higher layer and overlaps it */
export function covers(a, b) {
  return a.z > b.z && Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2
}

/** Tiles still on the board that nothing is sitting on. */
export function freeTiles(tiles) {
  return tiles.filter((t) => !tiles.some((o) => o !== t && covers(o, t)))
}

export function isFree(tile, tiles) {
  return !tiles.some((o) => o !== tile && covers(o, tile))
}

function layout(cfg, rand) {
  const { cols, rows, layers, density = 0.85 } = cfg
  const tiles = []
  for (let z = 0; z < layers; z++) {
    // each layer is a little smaller and shifted by half a tile
    const shrink = Math.floor(z / 2)
    const off = z % 2
    const c = cols - shrink * 2 - off
    const r = rows - shrink * 2 - off
    for (let y = 0; y < r; y++)
      for (let x = 0; x < c; x++) {
        const edge = x === 0 || y === 0 || x === c - 1 || y === r - 1
        const keep = z === 0 ? rand() < (edge ? 0.95 : 0.9) : rand() < density - z * 0.04
        // a symmetric gap pattern on some boards
        if (cfg.holes && z === 0 && (x + y) % 4 === 1 && !edge) continue
        if (keep) tiles.push({ x: (x + shrink) * 2 + off, y: (y + shrink) * 2 + off, z })
      }
  }
  return tiles
}

/**
 * Build a board: { tiles: [{ id, x, y, z, kind }], width, height } (width/height in half tiles).
 * cfg: { cols, rows, layers, kinds, density, mix }
 */
export function makeTiles(cfg, seed) {
  const rand = rng(seed)
  let tiles = layout(cfg, rand)
  // a whole number of triples: take spare tiles off the top
  while (tiles.length % 3) {
    const free = freeTiles(tiles).sort((a, b) => b.z - a.z)
    tiles = tiles.filter((t) => t !== free[0])
  }
  // play it backwards: a random order of taking free tiles
  const left = tiles.slice()
  const order = []
  while (left.length) {
    const free = freeTiles(left)
    // prefer high tiles a little, like a person would
    free.sort((a, b) => b.z - a.z || rand() - 0.5)
    const pick = free[Math.floor(Math.pow(rand(), 1.6) * free.length)]
    order.push(pick)
    left.splice(left.indexOf(pick), 1)
  }
  // give out kinds in triples along that order; `mix` interleaves a few triples at once
  // (the tray never needs more than 3 * mix slots, so mix up to 2 always stays winnable)
  const mix = Math.max(1, Math.min(2, cfg.mix ?? 1))
  const groups = order.length / 3
  const kinds = []
  for (let g = 0; g < groups; g++) kinds.push(Math.floor(rand() * cfg.kinds))
  for (let g = 0; g < groups; g += mix) {
    const span = order.slice(g * 3, (g + mix) * 3)
    const bag = []
    for (let k = 0; k < span.length / 3; k++) bag.push(kinds[g + k], kinds[g + k], kinds[g + k])
    // shuffle within the window
    for (let k = bag.length - 1; k > 0; k--) {
      const j = Math.floor(rand() * (k + 1))
      ;[bag[k], bag[j]] = [bag[j], bag[k]]
    }
    span.forEach((t, k) => (t.kind = bag[k]))
  }
  tiles.forEach((t, i) => (t.id = i))
  const width = Math.max(...tiles.map((t) => t.x)) + 2
  const height = Math.max(...tiles.map((t) => t.y)) + 2
  return { tiles, width, height }
}

/** Put a tile in the tray next to others of its kind. Returns the new tray and any cleared kind. */
export function addToTray(tray, tile) {
  const next = tray.slice()
  let at = next.length
  for (let i = next.length - 1; i >= 0; i--)
    if (next[i].kind === tile.kind) {
      at = i + 1
      break
    }
  next.splice(at, 0, tile)
  const same = next.filter((t) => t.kind === tile.kind)
  if (same.length >= 3) return { tray: next.filter((t) => t.kind !== tile.kind), cleared: tile.kind, removed: same }
  return { tray: next, cleared: null, removed: [] }
}
