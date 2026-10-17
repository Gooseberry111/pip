// Ask the build worker for a board, and remember recent ones so a level only builds once.
// Falls back to building right here if workers aren't available.
import { makeHotel } from './hotelEngine'
import { makeSudoku } from './sudokuEngine'
import { makeTiles } from './tilesEngine'
import { rng } from './levelGen'

const KEY = 'pip:boards:v1'
const KEEP = 24
let worker = null
let nextId = 1
const waiting = new Map()
const inflight = new Map()

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}
function writeCache(cache) {
  try {
    const keys = Object.keys(cache)
    for (const k of keys.slice(0, Math.max(0, keys.length - KEEP))) delete cache[k]
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // storage full or blocked: the board is just built again next time
  }
}

function getWorker() {
  if (worker !== null) return worker
  try {
    worker = new Worker(new URL('../workers/build.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      const p = waiting.get(data.id)
      waiting.delete(data.id)
      if (!p) return
      if (data.error) p.reject(new Error(data.error))
      else p.resolve(data.result)
    }
    worker.onerror = () => {
      for (const p of waiting.values()) p.reject(new Error('worker'))
      waiting.clear()
      worker = false
    }
  } catch {
    worker = false
  }
  return worker
}

function buildHere(type, args) {
  if (type === 'hotel') return makeHotel(args.cfg, rng(args.seed)) ?? makeHotel({ ...args.cfg, empty: args.cfg.empty + 1 }, rng(args.seed + 1))
  if (type === 'sudoku') return makeSudoku(args.size, args.givens, args.seed)
  return makeTiles(args.cfg, args.seed)
}

/** Build (or fetch from the cache) the board for `key`. Resolves to the board. */
export function buildBoard(key, type, args) {
  const cache = readCache()
  if (cache[key]) return Promise.resolve(cache[key])
  if (inflight.has(key)) return inflight.get(key)
  const w = getWorker()
  const job = (
    w
      ? new Promise((resolve, reject) => {
          const id = nextId++
          waiting.set(id, { resolve, reject })
          w.postMessage({ id, type, args })
        }).catch(() => buildHere(type, args))
      : Promise.resolve().then(() => buildHere(type, args))
  ).then((board) => {
    inflight.delete(key)
    if (board) {
      const c = readCache()
      delete c[key]
      c[key] = board
      writeCache(c)
    }
    return board
  })
  inflight.set(key, job)
  return job
}
