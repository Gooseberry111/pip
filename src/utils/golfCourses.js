// Builds Mini Golf holes from ready-made pieces stacked between the tee and the cup:
// a hedge with a gap, a stream with a crossing, a windmill gate, a sliding gate, a bumper
// patch, or a sandpit. Every gap is wider than the ball, so every hole can be finished.
import { lerp, pick } from './levelGen'

const FIRST = ['Windy', 'Mossy', 'Sunny', 'Misty', 'Breezy', 'Shady', 'Muddy', 'Starry', 'Sleepy', 'Rocky', 'Puddle', 'Clover', 'Bramble', 'Willow', 'Thistle']
const SECOND = ['Meadow', 'Lane', 'Hollow', 'Bend', 'Corner', 'Crossing', 'Garden', 'Hill', 'Brook', 'Patch', 'Path', 'Dell', 'Green', 'Orchard', 'Ridge']

function gapAt(rand, gap) {
  return gap / 2 + 6 + rand() * (100 - gap - 12)
}

/** One hole. d is how hard (0 to 1). */
export function makeCourse(rand, d) {
  const course = { walls: [], water: [], sand: [], bumpers: [], spinners: [], movers: [] }
  const bands = 2 + Math.round(d * 2 + rand() * 0.8)
  const top = 40
  const bottom = 118
  const path = [[25 + rand() * 50, 138]]
  const kinds = ['wall', 'water', 'windmill', 'gate', 'bumpers', 'sand']
  const weights = [3, 2.5 + d, 1 + d * 2.5, 0.6 + d * 2, 1.2, 1]
  const roll = () => {
    let r = rand() * weights.reduce((a, b) => a + b, 0)
    for (let i = 0; i < kinds.length; i++) if ((r -= weights[i]) <= 0) return kinds[i]
    return 'wall'
  }
  for (let b = 0; b < bands; b++) {
    const y = bottom - (b * (bottom - top)) / Math.max(1, bands - 1)
    const kind = roll()
    if (kind === 'wall' || kind === 'windmill' || kind === 'gate') {
      const gap = kind === 'wall' ? lerp(30, 15, d) : lerp(30, 22, d)
      const gx = gapAt(rand, gap)
      course.walls.push([0, y, gx - gap / 2, 5], [gx + gap / 2, y, 100 - gx - gap / 2, 5])
      if (kind === 'windmill') course.spinners.push([gx, y + 2.5, gap / 2 - 1.5, lerp(1.6, 3.1, d) * (rand() < 0.5 ? -1 : 1)])
      if (kind === 'gate') course.movers.push([gx - gap * 0.3, y - 0.5, gap * 0.6, 6, gap * 0.5, lerp(3, 1.8, d)])
      path.push([gx, y + 2.5])
    } else if (kind === 'water') {
      const gap = lerp(32, 16, d)
      const gx = gapAt(rand, gap)
      const h = 9 + rand() * 5
      course.water.push([0, y - h / 2, gx - gap / 2, h], [gx + gap / 2, y - h / 2, 100 - gx - gap / 2, h])
      path.push([gx, y])
    } else if (kind === 'bumpers') {
      const n = 3 + Math.round(d * 2)
      for (let k = 0; k < n; k++) course.bumpers.push([12 + ((k + rand() * 0.6) * 76) / n, y - 6 + rand() * 12, 4 + rand() * 2])
      path.push([50, y])
    } else {
      const w = lerp(36, 64, d)
      const x = rand() * (100 - w)
      course.sand.push([x, y - 9, w, 18])
      path.push([x + w / 2, y])
    }
  }
  const hole = [18 + rand() * 64, 14 + rand() * 10]
  path.push(hole)
  // guard the green on harder holes
  if (d > 0.45 && rand() < 0.6) course.sand.push([hole[0] - 12, hole[1] + 5, 24, 9])
  if (d > 0.7 && rand() < 0.5) course.bumpers.push([hole[0] + (rand() < 0.5 ? -9 : 9), hole[1] - 2, 3.5])

  // par: one shot per change of direction along the way, plus the putt
  let par = 1
  for (let i = 1; i < path.length - 1; i++) {
    const [ax, ay] = path[i - 1]
    const [bx, by] = path[i]
    const [cx, cy] = path[i + 1]
    const a1 = Math.atan2(by - ay, bx - ax)
    const a2 = Math.atan2(cy - by, cx - bx)
    if (Math.abs(Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1))) > 0.35) par++
  }
  // (checked against the golf bot: a sharp player needs about this many)
  par = Math.max(2, Math.min(par, Math.ceil(bands * 0.75)))

  const name = `${pick(FIRST, rand)} ${pick(SECOND, rand)}`
  return { name, start: path[0], hole, par, ...Object.fromEntries(Object.entries(course).filter(([, v]) => v.length)) }
}
