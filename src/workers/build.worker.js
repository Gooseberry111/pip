// Builds the slow boards (solved Bug Hotels, hard Sudokus, tall tile stacks) away from the
// screen, so the game never freezes while it thinks.
import { makeHotel } from '@/utils/hotelEngine'
import { makeSudoku } from '@/utils/sudokuEngine'
import { makeTiles } from '@/utils/tilesEngine'
import { rng } from '@/utils/levelGen'

self.onmessage = ({ data }) => {
  const { id, type, args } = data
  try {
    let result = null
    if (type === 'hotel') {
      const { cfg, seed } = args
      result = makeHotel(cfg, rng(seed)) ?? makeHotel({ ...cfg, empty: cfg.empty + 1 }, rng(seed + 1))
    } else if (type === 'sudoku') {
      result = makeSudoku(args.size, args.givens, args.seed)
    } else if (type === 'tiles') {
      result = makeTiles(args.cfg, args.seed)
    }
    self.postMessage({ id, result })
  } catch (e) {
    self.postMessage({ id, error: String(e?.message ?? e) })
  }
}
