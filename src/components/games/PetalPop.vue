<script setup>
// Petal Pop: aim and flick petals up at the cluster. Three or more of a colour pop,
// and anything left hanging falls with them. Bounce shots off the walls for tricky
// angles. Every few shots the ceiling creeps down; let it reach the line and it's over.
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { POP_LEVELS } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const COLS = 9
const DEATH_ROWS = 12 // the line sits this many rows below the top
const COLORS = [
  { fill: '#EE9AAA', light: '#FBDDE2', dark: '#C9677B' },
  { fill: '#F2C45E', light: '#FCEBB5', dark: '#C9952F' },
  { fill: '#7CB3D6', light: '#D3E8F4', dark: '#4E86AC' },
  { fill: '#8CC27A', light: '#D8EDCD', dark: '#5E9150' },
  { fill: '#B48CD1', light: '#E6D6F1', dark: '#8661A6' },
  { fill: '#EE8E6E', light: '#FBD9CC', dark: '#C2603F' },
]

const phase = ref('levels') // levels | intro | playing | done
const level = ref(Math.min(pip.levelProgress('pop').unlocked, POP_LEVELS.length))
const shots = ref(0)
const popped = ref(0)
const startCount = ref(0)
const shotsToDrop = ref(0)
const current = ref(0)
const next = ref(0)
const results = ref(null)
const justUnlocked = ref(null)

const field = ref(null)
const canvas = ref(null)

const cfg = computed(() => POP_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('pop'))
const levelList = computed(() => POP_LEVELS.map((l) => ({ goal: `Clear ${l.rows} rows of ${l.colors} colours` })))
// the shot target tightens as the levels go up
const par = computed(() => Math.round(startCount.value * (0.42 - level.value * 0.004)))
const good = computed(() => Math.round(startCount.value * (0.56 - level.value * 0.004)))

// ---- board ----
let grid = [] // grid[r][c] = colour index or -1
let drop = 0 // how far the ceiling has come down, in rows
let R = 20
let W = 360
let H = 600
let rowH = 34
let top = 8
let shooter = { x: 180, y: 560 }
let aim = -Math.PI / 2
let aiming = false
let shot = null // the petal in flight
let effects = [] // popping and falling petals
let raf = null
let last = 0
let ctx = null
let dpr = 1

const rowLen = (r) => (r % 2 ? COLS - 1 : COLS)
const cellX = (r, c) => R + c * 2 * R + (r % 2 ? R : 0)
const cellY = (r) => top + R + (r + drop) * rowH
const deathY = () => top + R + DEATH_ROWS * rowH

function ensureRows(n) {
  while (grid.length < n) grid.push(Array(rowLen(grid.length)).fill(-1))
}

function neighbours(r, c) {
  const odd = r % 2
  const list = [
    [r, c - 1],
    [r, c + 1],
    [r - 1, odd ? c : c - 1],
    [r - 1, odd ? c + 1 : c],
    [r + 1, odd ? c : c - 1],
    [r + 1, odd ? c + 1 : c],
  ]
  return list.filter(([y, x]) => y >= 0 && y < grid.length && x >= 0 && x < rowLen(y))
}

function colorsLeft() {
  const set = new Set()
  for (const row of grid) for (const v of row) if (v >= 0) set.add(v)
  return [...set]
}

function randomColor() {
  const left = colorsLeft()
  const pool = left.length ? left : [0]
  return pool[Math.floor(Math.random() * pool.length)]
}

function buildBoard() {
  grid = []
  drop = 0
  const n = cfg.value.colors
  for (let r = 0; r < cfg.value.rows; r++) {
    const row = []
    for (let c = 0; c < rowLen(r); c++) {
      // little clumps of colour, so there's something to aim for
      const left = c > 0 ? row[c - 1] : -1
      const up = r > 0 ? grid[r - 1][Math.min(c, rowLen(r - 1) - 1)] : -1
      const roll = Math.random()
      row.push(roll < 0.3 && left >= 0 ? left : roll < 0.48 && up >= 0 ? up : Math.floor(Math.random() * n))
    }
    grid.push(row)
  }
  ensureRows(DEATH_ROWS + 2)
  startCount.value = grid.flat().filter((v) => v >= 0).length
}

// ---- flow ----
function pick(n) {
  level.value = n
  if (pip.introSeen.pop) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('pop')
  buildBoard()
  shots.value = 0
  popped.value = 0
  shotsToDrop.value = cfg.value.drop
  current.value = randomColor()
  next.value = randomColor()
  shot = null
  effects = []
  results.value = null
  aim = -Math.PI / 2
  phase.value = 'playing'
  nextTick(() => {
    resize()
    last = 0
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(loop)
  })
}

function resize() {
  const rect = field.value?.getBoundingClientRect()
  if (!rect || !canvas.value) return
  dpr = Math.min(2, window.devicePixelRatio || 1)
  // fit the width, and make sure the whole playfield fits the height too
  const byWidth = rect.width / (COLS * 2)
  const byHeight = rect.height / (2 + DEATH_ROWS * 1.732 + 5.2)
  R = Math.floor(Math.min(byWidth, byHeight) * 10) / 10
  rowH = R * Math.sqrt(3)
  W = COLS * 2 * R
  H = rect.height
  top = 6
  shooter = { x: W / 2, y: Math.min(H - R * 1.8, deathY() + R * 3.4) }
  canvas.value.width = W * dpr
  canvas.value.height = H * dpr
  canvas.value.style.width = `${W}px`
  canvas.value.style.height = `${H}px`
  ctx = canvas.value.getContext('2d')
}

// ---- aiming and shooting ----
function pointer(e) {
  const rect = canvas.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function setAim(e) {
  const p = pointer(e)
  let a = Math.atan2(p.y - shooter.y, p.x - shooter.x)
  if (a > 0) a = p.x < shooter.x ? -Math.PI + 0.12 : -0.12
  aim = Math.max(-Math.PI + 0.12, Math.min(-0.12, a))
}

function onDown(e) {
  if (phase.value !== 'playing' || shot) return
  aiming = true
  setAim(e)
  canvas.value.setPointerCapture?.(e.pointerId)
}
function onMove(e) {
  if (aiming || e.pointerType === 'mouse') setAim(e)
}
function onUp(e) {
  if (!aiming) return
  aiming = false
  setAim(e)
  fire()
}

function fire() {
  if (shot || phase.value !== 'playing') return
  const speed = R * 52
  shot = { x: shooter.x, y: shooter.y, vx: Math.cos(aim) * speed, vy: Math.sin(aim) * speed, color: current.value }
  current.value = next.value
  next.value = randomColor()
  shots.value += 1
  playSound('shoot')
  haptic('light')
}

function swapNext() {
  if (phase.value !== 'playing' || shot) return
  ;[current.value, next.value] = [next.value, current.value]
  playSound('swap')
}

// ---- landing ----
function snap(x, y, color) {
  // nearest empty cell to where the petal stopped
  const approxR = Math.round((y - top - R) / rowH - drop)
  let best = null
  let bestD = Infinity
  for (let r = Math.max(0, approxR - 2); r <= approxR + 2; r++) {
    ensureRows(r + 2)
    for (let c = 0; c < rowLen(r); c++) {
      if (grid[r][c] >= 0) continue
      // only cells touching the ceiling or another petal
      if (r > 0 && !neighbours(r, c).some(([y2, x2]) => grid[y2][x2] >= 0)) continue
      const d = (cellX(r, c) - x) ** 2 + (cellY(r) - y) ** 2
      if (d < bestD) {
        bestD = d
        best = [r, c]
      }
    }
  }
  if (!best) return
  const [r, c] = best
  grid[r][c] = color
  settle(r, c)
}

function settle(r, c) {
  const color = grid[r][c]
  // the cluster of the same colour
  const cluster = []
  const seen = new Set([`${r},${c}`])
  const stack = [[r, c]]
  while (stack.length) {
    const [y, x] = stack.pop()
    cluster.push([y, x])
    for (const [ny, nx] of neighbours(y, x)) {
      const k = `${ny},${nx}`
      if (!seen.has(k) && grid[ny][nx] === color) {
        seen.add(k)
        stack.push([ny, nx])
      }
    }
  }

  if (cluster.length >= 3) {
    for (const [y, x] of cluster) {
      effects.push({ kind: 'pop', x: cellX(y, x), y: cellY(y), color: grid[y][x], t: 0 })
      grid[y][x] = -1
    }
    // anything no longer hanging from the ceiling falls
    const hung = new Set()
    const queue = []
    for (let x = 0; x < rowLen(0); x++)
      if (grid[0][x] >= 0) {
        hung.add(`0,${x}`)
        queue.push([0, x])
      }
    while (queue.length) {
      const [y, x] = queue.pop()
      for (const [ny, nx] of neighbours(y, x)) {
        const k = `${ny},${nx}`
        if (!hung.has(k) && grid[ny][nx] >= 0) {
          hung.add(k)
          queue.push([ny, nx])
        }
      }
    }
    let fell = 0
    grid.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v >= 0 && !hung.has(`${y},${x}`)) {
          effects.push({ kind: 'fall', x: cellX(y, x), y: cellY(y), vx: (Math.random() - 0.5) * R * 6, vy: -R * 4 * Math.random(), color: v, t: 0 })
          grid[y][x] = -1
          fell++
        }
      }),
    )
    popped.value += cluster.length + fell
    playSound('pop', true, { count: cluster.length + fell })
    haptic(fell ? 'soft' : 'light')
  } else {
    playSound('tap')
    shotsToDrop.value -= 1
    if (shotsToDrop.value <= 0) {
      drop += 1
      shotsToDrop.value = cfg.value.drop
      playSound('oops')
      haptic('soft')
    }
  }

  // the next petals only come in colours still on the board
  const left = colorsLeft()
  if (left.length) {
    if (!left.includes(current.value)) current.value = randomColor()
    if (!left.includes(next.value)) next.value = randomColor()
  }

  if (!left.length) return later(() => finish(true), 650)
  const lowest = grid.reduce((m, row, y) => (row.some((v) => v >= 0) ? y : m), -1)
  if (lowest >= 0 && cellY(lowest) + R > deathY()) later(() => finish(false), 450)
}

const timers = new Set()
function later(fn, ms) {
  phase.value = 'ending'
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

// ---- the loop ----
function loop(now) {
  const dt = last ? Math.min(0.033, (now - last) / 1000) : 0
  last = now
  if (shot) moveShot(dt)
  effects = effects.filter((f) => {
    f.t += dt
    if (f.kind === 'fall') {
      f.vy += R * 60 * dt
      f.x += f.vx * dt
      f.y += f.vy * dt
      return f.y < H + R * 2
    }
    return f.t < 0.3
  })
  draw()
  if (phase.value === 'playing' || phase.value === 'ending' || effects.length) raf = requestAnimationFrame(loop)
}

function moveShot(dt) {
  const steps = Math.ceil((Math.hypot(shot.vx, shot.vy) * dt) / (R * 0.3))
  for (let i = 0; i < steps; i++) {
    shot.x += (shot.vx * dt) / steps
    shot.y += (shot.vy * dt) / steps
    if (shot.x < R) {
      shot.x = R
      shot.vx = Math.abs(shot.vx)
      playSound('bounce')
    } else if (shot.x > W - R) {
      shot.x = W - R
      shot.vx = -Math.abs(shot.vx)
      playSound('bounce')
    }
    if (shot.y <= cellY(0)) return land()
    for (let r = 0; r < grid.length; r++) {
      const y = cellY(r)
      if (Math.abs(y - shot.y) > R * 2) continue
      for (let c = 0; c < rowLen(r); c++) {
        if (grid[r][c] < 0) continue
        if (Math.hypot(cellX(r, c) - shot.x, y - shot.y) < R * 1.7) return land()
      }
    }
  }
}

function land() {
  const s = shot
  shot = null
  snap(s.x, s.y, s.color)
}

// ---- drawing ----
function petal(x, y, color, scale = 1, alpha = 1) {
  const c = COLORS[color]
  const r = R * 0.94 * scale
  ctx.globalAlpha = alpha
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r)
  g.addColorStop(0, c.light)
  g.addColorStop(1, c.fill)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  // five soft petal creases and a centre
  ctx.strokeStyle = c.dark
  ctx.globalAlpha = alpha * 0.35
  ctx.lineWidth = Math.max(1, r * 0.08)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3)
    ctx.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85)
    ctx.stroke()
  }
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#FFF4D6'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function guide() {
  // the aiming line, with one bounce and a short peek past it
  let x = shooter.x
  let y = shooter.y
  let vx = Math.cos(aim)
  let vy = Math.sin(aim)
  let travelled = 0
  let bounced = 0
  const max = H
  ctx.fillStyle = 'rgba(120, 90, 60, 0.35)'
  while (travelled < max) {
    x += vx * R * 0.25
    y += vy * R * 0.25
    travelled += R * 0.25
    if (x < R || x > W - R) {
      vx = -vx
      bounced++
      if (bounced > 1) break
    }
    if (bounced === 1 && travelled > max * 0.55) break
    if (y <= cellY(0)) break
    let hitSomething = false
    for (let r = 0; r < grid.length && !hitSomething; r++) {
      const cy = cellY(r)
      if (Math.abs(cy - y) > R * 2) continue
      for (let c = 0; c < rowLen(r); c++) if (grid[r][c] >= 0 && Math.hypot(cellX(r, c) - x, cy - y) < R * 1.7) hitSomething = true
    }
    if (hitSomething) break
    if (Math.round(travelled / (R * 0.25)) % 3 === 0) {
      ctx.beginPath()
      ctx.arc(x, y, R * 0.12, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function draw() {
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  // the ceiling, coming down
  ctx.fillStyle = '#C9A57C'
  ctx.fillRect(0, 0, W, top + drop * rowH)
  ctx.fillStyle = '#B48E64'
  ctx.fillRect(0, top + drop * rowH - 3, W, 3)
  // the line
  const dy = deathY()
  ctx.strokeStyle = 'rgba(217, 83, 63, 0.45)'
  ctx.setLineDash([R * 0.4, R * 0.35])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, dy)
  ctx.lineTo(W, dy)
  ctx.stroke()
  ctx.setLineDash([])
  // the petals
  grid.forEach((row, r) => row.forEach((v, c) => v >= 0 && petal(cellX(r, c), cellY(r), v)))
  for (const f of effects) {
    if (f.kind === 'pop') petal(f.x, f.y, f.color, 1 + f.t * 2.2, Math.max(0, 1 - f.t / 0.3))
    else petal(f.x, f.y, f.color, 0.95, 0.9)
  }
  if (phase.value === 'playing' && !shot) guide()
  if (shot) petal(shot.x, shot.y, shot.color)
  // the launcher
  ctx.fillStyle = '#E4D3BB'
  ctx.beginPath()
  ctx.arc(shooter.x, shooter.y, R * 1.35, 0, Math.PI * 2)
  ctx.fill()
  if (!shot && phase.value === 'playing') petal(shooter.x, shooter.y, current.value)
}

function finish(success) {
  phase.value = 'done'
  if (!success) {
    results.value = { success: false, title: 'The petals reached the line', subtitle: `You popped ${popped.value} of ${startCount.value}.` }
    return
  }
  const stars = shots.value <= par.value ? 3 : shots.value <= good.value ? 2 : 1
  const reward = pip.completeLevel('pop', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= POP_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === POP_LEVELS.length,
    title: stars === 3 ? 'Sharpshooter!' : stars === 2 ? 'Pop pop pop!' : 'All clear!',
    subtitle: stars < 3 ? `3 stars: clear it in ${par.value} shots or fewer.` : `Cleared in ${shots.value} shots.`,
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

onMounted(() => window.addEventListener('resize', resize))
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  timers.forEach(clearTimeout)
  window.removeEventListener('resize', resize)
})

const swatch = (i) => ({ background: `radial-gradient(circle at 35% 30%, ${COLORS[i].light}, ${COLORS[i].fill})` })
</script>

<template>
  <GameShell title="Petal Pop" track="pop" :hide-title="phase !== 'levels'" background="linear-gradient(180deg, #F6EEE3 0%, #F1E6EE 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase !== 'levels'" class="chip tabular-nums">Level {{ level }}</span>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Petal Pop"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <div class="flex items-center gap-2 px-5 pt-1 text-[0.8125rem] font-bold">
        <span class="chip tabular-nums" :class="{ 'bg-clay-100! text-clay-400!': shots > par }">{{ shots }} / {{ par }} shots</span>
        <span class="chip tabular-nums" :class="{ 'bg-clay-100! text-clay-400!': shotsToDrop <= 1 }">Ceiling in {{ shotsToDrop }}</span>
        <span class="ml-auto text-bark-400">{{ popped }} popped</span>
      </div>

      <div ref="field" class="relative flex flex-1 justify-center overflow-hidden px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <canvas
          ref="canvas"
          class="touch-none select-none rounded-[1.25rem] bg-white/50"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="aiming = false"
        />
        <button
          v-if="phase === 'playing'"
          type="button"
          data-sound="none"
          class="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-6 flex flex-col items-center gap-1"
          aria-label="Swap petals"
          @click="swapNext"
        >
          <span class="h-9 w-9 rounded-full shadow-soft ring-2 ring-white" :style="swatch(next)" />
          <span class="text-[0.625rem] font-extrabold uppercase tracking-wider text-bark-400">Swap</span>
        </button>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#EE9AAA', text: 'Drag to aim, let go to shoot' },
          { color: '#F2C45E', text: '3 or more of a colour pop' },
          { color: '#7CB3D6', text: 'Bounce off the walls for tricky shots' },
          { color: '#EE8E6E', text: 'Misses bring the ceiling closer' },
          { color: '#8CC27A', text: '3 stars: clear it within par' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Shots', value: shots },
          { label: 'Par', value: par },
          { label: 'Popped', value: popped },
        ]"
        :petals="results.petals"
        :has-next="level < POP_LEVELS.length"
        :unlocked="results.unlocked"
        :all-done="results.allDone"
        has-levels
        @next="nextLevel"
        @again="begin"
        @levels="phase = 'levels'"
        @close="emit('close')"
      />
    </template>
  </GameShell>
</template>
