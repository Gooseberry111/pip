<script setup>
// Mini Golf: pull back from anywhere to aim, let go to putt. The further you pull, the harder
// the shot. Mind the water (one stroke and back you go), the sand (it slows you right down)
// and the spinning windmills. Sink it in par or under for 3 stars.
import { computed, ref, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { GOLF_LEVELS } from '@/data/games'
import { W, H, BALL, CUP, MAX_SPEED, step, moverRect, spinnerEnds } from '@/utils/golfEngine'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const phase = ref('levels') // levels | intro | playing | done
const level = ref(Math.min(pip.levelProgress('golf').unlocked, GOLF_LEVELS.length))
const strokes = ref(0)
const results = ref(null)
const justUnlocked = ref(null)
const note = ref('')
const field = ref(null)
const canvas = ref(null)

const course = computed(() => GOLF_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('golf'))
const levelList = computed(() => GOLF_LEVELS.map((c) => ({ goal: `${c.name}, par ${c.par}` })))
const maxStrokes = computed(() => course.value.par + 3)

let ctx = null
let dpr = 1
let S = 3 // pixels per course unit
let ox = 0
let oy = 0
let raf = null
let last = 0
let acc = 0
let t = 0
let ball = { x: 0, y: 0, vx: 0, vy: 0 }
let rolling = false
let shotFrom = null
let drag = null // { sx, sy, x, y }
let sinking = 0
let splash = null
let lastBump = 0
let trail = []

function pick(n) {
  level.value = n
  if (pip.introSeen.golf) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('golf')
  const c = course.value
  ball = { x: c.start[0], y: c.start[1], vx: 0, vy: 0 }
  rolling = false
  strokes.value = 0
  results.value = null
  sinking = 0
  splash = null
  trail = []
  t = 0
  note.value = ''
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
  S = Math.min(rect.width / (W + 6), rect.height / (H + 6))
  const cw = (W + 6) * S
  const ch = (H + 6) * S
  ox = 3 * S
  oy = 3 * S
  canvas.value.width = cw * dpr
  canvas.value.height = ch * dpr
  canvas.value.style.width = `${cw}px`
  canvas.value.style.height = `${ch}px`
  ctx = canvas.value.getContext('2d')
}

// ---- aiming ----
function toCourse(e) {
  const r = canvas.value.getBoundingClientRect()
  return { x: (e.clientX - r.left - ox) / S, y: (e.clientY - r.top - oy) / S }
}
function onDown(e) {
  if (phase.value !== 'playing' || rolling || sinking || splash) return
  const p = toCourse(e)
  drag = { sx: p.x, sy: p.y, x: p.x, y: p.y }
  canvas.value.setPointerCapture?.(e.pointerId)
}
function onMove(e) {
  if (!drag) return
  const p = toCourse(e)
  drag.x = p.x
  drag.y = p.y
}
function pull() {
  if (!drag) return null
  const dx = drag.sx - drag.x
  const dy = drag.sy - drag.y
  const len = Math.hypot(dx, dy)
  if (len < 2) return null
  return { angle: Math.atan2(dy, dx), power: Math.min(1, len / 45) }
}
function onUp() {
  const p = pull()
  drag = null
  if (!p || p.power < 0.06) return
  shotFrom = { x: ball.x, y: ball.y }
  ball.vx = Math.cos(p.angle) * p.power * MAX_SPEED
  ball.vy = Math.sin(p.angle) * p.power * MAX_SPEED
  rolling = true
  strokes.value += 1
  trail = []
  playSound('shoot')
  haptic('light')
}

// ---- the game loop ----
function loop(now) {
  if (phase.value === 'levels') return
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
  last = now
  if (phase.value === 'playing') update(dt)
  draw()
  raf = requestAnimationFrame(loop)
}

function update(dt) {
  acc += dt
  const STEP = 1 / 240
  while (acc >= STEP) {
    acc -= STEP
    t += STEP
    if (sinking) {
      sinking += STEP
      if (sinking > 0.55) {
        sinking = 0
        finish(true)
        return
      }
      continue
    }
    if (splash) {
      splash.t += STEP
      if (splash.t > 0.7) {
        splash = null
        ball = { x: shotFrom.x, y: shotFrom.y, vx: 0, vy: 0 }
        afterShot()
      }
      continue
    }
    if (!rolling) continue
    const r = step(course.value, ball, STEP, t)
    if (r.bumped && t - lastBump > 0.08) {
      lastBump = t
      playSound('bounce')
    }
    if (r.event === 'cup') {
      rolling = false
      sinking = 0.0001
      ball.x = course.value.hole[0]
      ball.y = course.value.hole[1]
      playSound('match')
      haptic('success')
      return
    }
    if (r.event === 'water') {
      rolling = false
      splash = { x: ball.x, y: ball.y, t: 0 }
      strokes.value += 1
      note.value = 'Splash! One stroke penalty.'
      setTimeout(() => (note.value = ''), 1600)
      playSound('water')
      haptic('error')
      return
    }
    if (r.event === 'stop') {
      rolling = false
      afterShot()
    }
    if (Math.floor(t * 60) % 2 === 0) {
      trail.push({ x: ball.x, y: ball.y })
      if (trail.length > 24) trail.shift()
    }
  }
}

function afterShot() {
  if (strokes.value >= maxStrokes.value) setTimeout(() => finish(false), 300)
  else if (strokes.value === maxStrokes.value - 1) {
    note.value = 'Last stroke!'
    setTimeout(() => (note.value = ''), 1600)
  }
}

function finish(won) {
  if (phase.value !== 'playing') return
  phase.value = 'done'
  const par = course.value.par
  if (!won) {
    results.value = { success: false, title: 'Out of strokes', subtitle: 'Try a gentler pull. Banking off the walls can help.' }
    return
  }
  const s = strokes.value
  const stars = s <= par ? 3 : s === par + 1 ? 2 : 1
  const reward = pip.completeLevel('golf', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= GOLF_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  const word = s === 1 ? 'Hole in one!' : s <= par - 2 ? 'Eagle!' : s === par - 1 ? 'Birdie!' : s === par ? 'Par. Lovely!' : s === par + 1 ? 'Bogey' : 'In the hole!'
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === GOLF_LEVELS.length,
    title: word,
    subtitle: stars < 3 ? `3 stars: ${par} strokes or fewer.` : `${s} ${s === 1 ? 'stroke' : 'strokes'} on a par ${par}.`,
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

// ---- drawing ----
const X = (x) => ox + x * S
const Y = (y) => oy + y * S

function rrect(x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(X(x), Y(y), w * S, h * S, r * S)
}

function draw() {
  if (!ctx) return
  const c = course.value
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const cw = canvas.value.width / dpr
  const ch = canvas.value.height / dpr
  ctx.clearRect(0, 0, cw, ch)
  // rail and grass
  ctx.fillStyle = '#9C7351'
  ctx.beginPath()
  ctx.roundRect(0, 0, cw, ch, 4 * S)
  ctx.fill()
  ctx.fillStyle = '#8CC27A'
  rrect(0, 0, W, H, 2.5)
  ctx.fill()
  // mown stripes
  ctx.save()
  ctx.clip()
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = 0; y < H; y += 20) ctx.fillRect(X(0), Y(y), W * S, 10 * S)
  ctx.restore()

  for (const [x, y, w, h] of c.sand ?? []) {
    ctx.fillStyle = '#EED7A6'
    rrect(x, y, w, h, 5)
    ctx.fill()
    ctx.fillStyle = 'rgba(180,140,90,0.35)'
    for (let k = 0; k < (w * h) / 40; k++) {
      const px = x + ((k * 37) % w)
      const py = y + ((k * 53) % h)
      ctx.beginPath()
      ctx.arc(X(px), Y(py), 0.5 * S, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (const [x, y, w, h] of c.water ?? []) {
    ctx.fillStyle = '#7FB2CB'
    rrect(x, y, w, h, 3)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 0.6 * S
    for (let k = 0; k < h / 6; k++) {
      const wy = y + 3 + k * 6
      const shift = Math.sin(t * 2 + k) * 2
      ctx.beginPath()
      ctx.moveTo(X(x + 3 + shift), Y(wy))
      ctx.quadraticCurveTo(X(x + 6 + shift), Y(wy - 1.2), X(x + 9 + shift), Y(wy))
      ctx.stroke()
    }
  }
  // the hole and flag
  const [hx, hy] = c.hole
  ctx.fillStyle = '#3E4A32'
  ctx.beginPath()
  ctx.ellipse(X(hx), Y(hy), CUP * S, CUP * S * 0.85, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5B4636'
  ctx.lineWidth = 0.7 * S
  ctx.beginPath()
  ctx.moveTo(X(hx + 0.6), Y(hy))
  ctx.lineTo(X(hx + 0.6), Y(hy - 14))
  ctx.stroke()
  ctx.fillStyle = '#E48C9C'
  ctx.beginPath()
  const wave = Math.sin(t * 4) * 0.8
  ctx.moveTo(X(hx + 0.6), Y(hy - 14))
  ctx.quadraticCurveTo(X(hx + 4), Y(hy - 13 + wave), X(hx + 8), Y(hy - 11.5))
  ctx.lineTo(X(hx + 0.6), Y(hy - 9))
  ctx.fill()

  for (const r of c.walls ?? []) drawWall(r)
  for (const m of c.movers ?? []) drawWall(moverRect(m, t), true)
  for (const [x, y, r] of c.bumpers ?? []) {
    ctx.fillStyle = 'rgba(58,45,35,0.2)'
    ctx.beginPath()
    ctx.arc(X(x + 0.6), Y(y + 0.9), r * S, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#E35D4B'
    ctx.beginPath()
    ctx.arc(X(x), Y(y), r * S, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFF8EA'
    for (const [dx, dy, rr] of [[-0.35, -0.3, 0.22], [0.3, -0.1, 0.17], [-0.05, 0.35, 0.15]]) {
      ctx.beginPath()
      ctx.arc(X(x + dx * r), Y(y + dy * r), rr * r * S, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (const sp of c.spinners ?? []) {
    const [x1, y1, x2, y2] = spinnerEnds(sp, t)
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#FFFBF4'
    ctx.lineWidth = 2.6 * S
    ctx.beginPath()
    ctx.moveTo(X(x1), Y(y1))
    ctx.lineTo(X(x2), Y(y2))
    ctx.stroke()
    ctx.strokeStyle = '#B9927A'
    ctx.lineWidth = 0.6 * S
    ctx.stroke()
    ctx.fillStyle = '#C9584A'
    ctx.beginPath()
    ctx.arc(X(sp[0]), Y(sp[1]), 2.4 * S, 0, Math.PI * 2)
    ctx.fill()
  }

  // trail and ball
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  trail.forEach((p, i) => {
    ctx.beginPath()
    ctx.arc(X(p.x), Y(p.y), BALL * S * (i / trail.length) * 0.7, 0, Math.PI * 2)
    ctx.fill()
  })
  if (splash) {
    const k = splash.t / 0.7
    ctx.strokeStyle = `rgba(255,255,255,${1 - k})`
    ctx.lineWidth = 0.8 * S
    for (const r of [3, 6]) {
      ctx.beginPath()
      ctx.arc(X(splash.x), Y(splash.y), (r + k * 6) * S, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else {
    const shrink = sinking ? Math.max(0, 1 - sinking / 0.5) : 1
    ctx.fillStyle = 'rgba(58,45,35,0.25)'
    ctx.beginPath()
    ctx.arc(X(ball.x + 0.5), Y(ball.y + 0.7), BALL * S * shrink, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(X(ball.x), Y(ball.y), BALL * S * shrink, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#86AD72'
    ctx.beginPath()
    ctx.ellipse(X(ball.x + 0.5), Y(ball.y - 0.6), 0.9 * S * shrink, 0.45 * S * shrink, -0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  // aiming
  const p = pull()
  if (p && !rolling) {
    const len = 8 + p.power * 34
    const col = p.power < 0.5 ? '#6FA35B' : p.power < 0.8 ? '#E9B54F' : '#D9533F'
    ctx.strokeStyle = col
    ctx.lineWidth = 1 * S
    ctx.setLineDash([1.4 * S, 1.6 * S])
    ctx.beginPath()
    ctx.moveTo(X(ball.x), Y(ball.y))
    ctx.lineTo(X(ball.x + Math.cos(p.angle) * len), Y(ball.y + Math.sin(p.angle) * len))
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(X(ball.x), Y(ball.y), (BALL + 2 + p.power * 3) * S, -Math.PI / 2, -Math.PI / 2 + p.power * Math.PI * 2)
    ctx.stroke()
  }
}

function drawWall([x, y, w, h], log = false) {
  ctx.fillStyle = 'rgba(58,45,35,0.22)'
  rrect(x + 0.6, y + 1, w, h, 1.6)
  ctx.fill()
  ctx.fillStyle = log ? '#B98C63' : '#6E9E5C'
  rrect(x, y, w, h, 1.6)
  ctx.fill()
  ctx.fillStyle = log ? '#D9B48A' : '#86B570'
  rrect(x, y, w, Math.min(h, 2.2), 1.2)
  ctx.fill()
}

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <GameShell title="Mini Golf" track="glide" :hide-title="phase === 'playing'" background="linear-gradient(180deg, #E4EEDC 0%, #D6E6CC 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase === 'playing'" class="chip">{{ strokes }} / {{ course.par }} par</span>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Mini Golf"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <div class="px-5 pt-1">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-bark-600 px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#FFFAF2]">
            Hole {{ level }}
          </span>
          <span class="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-bark-500">{{ course.name }}</span>
          <span class="shrink-0 text-[0.8125rem] font-extrabold tabular-nums" :class="strokes > course.par ? 'text-clay-400' : 'text-bark-600'">{{ maxStrokes - strokes }} left</span>
        </div>
      </div>

      <div ref="field" class="relative mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] mt-2 flex flex-1 items-center justify-center">
        <canvas ref="canvas" class="touch-none rounded-2xl" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" />
        <Transition name="note">
          <p v-if="note" class="pointer-events-none absolute top-3 rounded-full bg-bark-600 px-4 py-1.5 text-sm font-bold text-[#FFFAF2] shadow-float">{{ note }}</p>
        </Transition>
        <p v-if="phase === 'playing' && strokes === 0 && level <= 2" class="pointer-events-none absolute bottom-3 rounded-full bg-surface/90 px-4 py-1.5 text-xs font-bold text-bark-500 shadow-soft">
          Pull back anywhere, then let go
        </p>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#6FA35B', text: 'Pull back from anywhere to aim, let go to putt' },
          { color: '#7FB2CB', text: 'Water costs a stroke and puts you back' },
          { color: '#EED7A6', text: 'Sand slows the ball right down' },
          { color: '#E48C9C', text: '3 stars: sink it in par or under' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Hole ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Strokes', value: strokes },
          { label: 'Par', value: course.par },
        ]"
        :petals="results.petals ?? 0"
        :has-next="results.success && level < GOLF_LEVELS.length"
        :unlocked="results.unlocked ?? null"
        :all-done="results.allDone ?? false"
        has-levels
        levels-label="Holes"
        @next="nextLevel"
        @again="begin"
        @levels="phase = 'levels'"
        @close="emit('close')"
      />
    </template>
  </GameShell>
</template>

<style scoped>
.note-enter-active,
.note-leave-active {
  transition: opacity 0.25s ease, transform 0.3s ease;
}
.note-enter-from,
.note-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
