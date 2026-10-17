// Mini Golf physics. Courses are 100 units wide and 150 tall; y grows downwards.
// A course: { start: [x, y], hole: [x, y], par,
//   walls: [[x, y, w, h]], water: [[x, y, w, h]], sand: [[x, y, w, h]],
//   bumpers: [[x, y, r]], spinners: [[x, y, len, speed]], movers: [[x, y, w, h, dx, seconds]] }

export const W = 100
export const H = 150
export const BALL = 1.9
export const CUP = 3.2
export const MAX_SPEED = 150

const ROLL = 0.55 // friction (per second, as a share of speed)
const DRAG = 9 // and a steady slow down, units per second
const SAND = 4.5
const BOUNCE = 0.72
const BUMP = 1.15

/** Where a moving wall is at time t. */
export function moverRect(m, t) {
  const [x, y, w, h, dx, secs] = m
  const s = Math.sin((t / secs) * Math.PI * 2)
  return [x + s * dx, y, w, h]
}

/** A spinner's blade ends at time t. */
export function spinnerEnds(sp, t) {
  const [x, y, len, speed] = sp
  const a = t * speed
  const cx = Math.cos(a) * len
  const cy = Math.sin(a) * len
  return [x - cx, y - cy, x + cx, y + cy]
}

const inRect = (px, py, [x, y, w, h]) => px >= x && px <= x + w && py >= y && py <= y + h

function hitRect(ball, rect, restitution = BOUNCE) {
  const [x, y, w, h] = rect
  const cx = Math.max(x, Math.min(ball.x, x + w))
  const cy = Math.max(y, Math.min(ball.y, y + h))
  let dx = ball.x - cx
  let dy = ball.y - cy
  let d = Math.hypot(dx, dy)
  if (d >= BALL) return false
  if (d === 0) {
    // centre inside the wall: push out the shortest way
    const opts = [
      [ball.x - x, -1, 0], [x + w - ball.x, 1, 0], [ball.y - y, 0, -1], [y + h - ball.y, 0, 1],
    ].sort((a, b) => a[0] - b[0])
    dx = opts[0][1]
    dy = opts[0][2]
    d = 0
    ball.x += dx * (opts[0][0] + BALL)
    ball.y += dy * (opts[0][0] + BALL)
  } else {
    dx /= d
    dy /= d
    ball.x = cx + dx * BALL
    ball.y = cy + dy * BALL
  }
  const vn = ball.vx * dx + ball.vy * dy
  if (vn < 0) {
    ball.vx -= (1 + restitution) * vn * dx
    ball.vy -= (1 + restitution) * vn * dy
  }
  return true
}

function hitCircle(ball, [x, y, r]) {
  const dx = ball.x - x
  const dy = ball.y - y
  const d = Math.hypot(dx, dy)
  if (d >= r + BALL || d === 0) return false
  const nx = dx / d
  const ny = dy / d
  ball.x = x + nx * (r + BALL)
  ball.y = y + ny * (r + BALL)
  const vn = ball.vx * nx + ball.vy * ny
  if (vn < 0) {
    ball.vx -= (1 + BUMP) * vn * nx
    ball.vy -= (1 + BUMP) * vn * ny
  }
  // a bumper always gives a little kick
  const sp = Math.hypot(ball.vx, ball.vy)
  if (sp < 30) {
    ball.vx += nx * 25
    ball.vy += ny * 25
  }
  return true
}

function hitSegment(ball, [x1, y1, x2, y2], sp, t) {
  const vx = x2 - x1
  const vy = y2 - y1
  const len2 = vx * vx + vy * vy
  let u = ((ball.x - x1) * vx + (ball.y - y1) * vy) / len2
  u = Math.max(0, Math.min(1, u))
  const cx = x1 + u * vx
  const cy = y1 + u * vy
  const dx = ball.x - cx
  const dy = ball.y - cy
  const d = Math.hypot(dx, dy)
  const R = BALL + 1.2
  if (d >= R || d === 0) return false
  const nx = dx / d
  const ny = dy / d
  ball.x = cx + nx * R
  ball.y = cy + ny * R
  // the blade's own speed where it touched
  const [ox, oy, , speed] = sp
  const bvx = -(cy - oy) * speed
  const bvy = (cx - ox) * speed
  const rvx = ball.vx - bvx
  const rvy = ball.vy - bvy
  const vn = rvx * nx + rvy * ny
  if (vn < 0) {
    ball.vx -= (1 + BOUNCE) * vn * nx
    ball.vy -= (1 + BOUNCE) * vn * ny
  }
  return true
}

/**
 * Move the ball on by dt seconds at course time t. Returns an event:
 * null (still rolling), 'stop', 'cup', 'water', plus `bumped` when it hit something.
 */
export function step(course, ball, dt, t) {
  let bumped = false
  const sp = Math.hypot(ball.vx, ball.vy)
  // the cup: slow enough and close enough, it drops in; fast balls lip out
  const [hx, hy] = course.hole
  const toCup = Math.hypot(ball.x - hx, ball.y - hy)
  if (toCup < CUP && sp < 95) return { event: 'cup' }
  if (toCup < CUP * 2.2 && sp < 70) {
    // a gentle pull towards the cup when rolling past slowly
    ball.vx += ((hx - ball.x) / toCup) * 40 * dt
    ball.vy += ((hy - ball.y) / toCup) * 40 * dt
  }
  ball.x += ball.vx * dt
  ball.y += ball.vy * dt
  // edges of the course
  if (ball.x < BALL) {
    ball.x = BALL
    ball.vx = Math.abs(ball.vx) * BOUNCE
    bumped = true
  } else if (ball.x > W - BALL) {
    ball.x = W - BALL
    ball.vx = -Math.abs(ball.vx) * BOUNCE
    bumped = true
  }
  if (ball.y < BALL) {
    ball.y = BALL
    ball.vy = Math.abs(ball.vy) * BOUNCE
    bumped = true
  } else if (ball.y > H - BALL) {
    ball.y = H - BALL
    ball.vy = -Math.abs(ball.vy) * BOUNCE
    bumped = true
  }
  for (const r of course.walls ?? []) if (hitRect(ball, r)) bumped = true
  for (const m of course.movers ?? []) if (hitRect(ball, moverRect(m, t))) bumped = true
  for (const b of course.bumpers ?? []) if (hitCircle(ball, b)) bumped = true
  for (const s of course.spinners ?? []) if (hitSegment(ball, spinnerEnds(s, t), s, t)) bumped = true
  for (const w of course.water ?? []) if (inRect(ball.x, ball.y, w)) return { event: 'water', bumped }
  // slowing down
  const inSand = (course.sand ?? []).some((s) => inRect(ball.x, ball.y, s))
  const speed = Math.hypot(ball.vx, ball.vy)
  const k = inSand ? SAND : ROLL
  let next = speed * Math.exp(-k * dt) - (inSand ? DRAG * 3 : DRAG) * dt
  if (speed > MAX_SPEED * 1.4) next = MAX_SPEED * 1.4
  if (next <= 2.5) {
    ball.vx = 0
    ball.vy = 0
    return { event: 'stop', bumped }
  }
  ball.vx *= next / speed
  ball.vy *= next / speed
  return { event: null, bumped }
}

/** Play one shot to the end (for checking courses). Returns { x, y, result, time }. */
export function simulate(course, from, angle, power, t0 = 0, maxTime = 12) {
  const ball = { x: from[0], y: from[1], vx: Math.cos(angle) * power * MAX_SPEED, vy: Math.sin(angle) * power * MAX_SPEED }
  const dt = 1 / 240
  let t = t0
  while (t - t0 < maxTime) {
    const r = step(course, ball, dt, t)
    t += dt
    if (r.event === 'cup') return { x: course.hole[0], y: course.hole[1], result: 'cup', time: t }
    if (r.event === 'water') return { x: from[0], y: from[1], result: 'water', time: t }
    if (r.event === 'stop') return { x: ball.x, y: ball.y, result: 'stop', time: t }
  }
  return { x: ball.x, y: ball.y, result: 'stop', time: t }
}
