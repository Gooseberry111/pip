<script setup>
// Seed Glide: a dandelion seed floats on the breeze. Hold to rise, let go to drift down,
// and slip through the gaps between branches. Dewdrops in the gaps are a bonus.
// Bumping a branch costs a heart. Later levels sway the branches and add gusts of wind.
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { GLIDE_LEVELS, starRating } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import LevelHud from './LevelHud.vue'
import Countdown from './Countdown.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const HEARTS = 3
const SPACING = 230 // px between branches

const phase = ref('levels')
const level = ref(Math.min(pip.levelProgress('glide').unlocked, GLIDE_LEVELS.length))
const passed = ref(0)
const dew = ref(0)
const hearts = ref(HEARTS)
const results = ref(null)
const justUnlocked = ref(null)
const hint = ref(true)

const field = ref(null)
const canvas = ref(null)

const cfg = computed(() => GLIDE_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('glide'))
const levelList = computed(() => GLIDE_LEVELS.map((l) => ({ goal: `Pass ${l.branches} branches` })))
const dewTarget = computed(() => Math.ceil(cfg.value.branches * 0.7))

let ctx = null
let dpr = 1
let W = 360
let H = 640
let raf = null
let last = 0
let holding = false
let seed = { y: 0, vy: 0 }
let branches = []
let sparkles = []
let travelled = 0
let invulnerable = 0
let gust = 0
let gustTimer = 0
let t = 0
let ending = false

function resize() {
  const r = field.value?.getBoundingClientRect()
  if (!r || !canvas.value) return
  W = r.width
  H = r.height
  dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.value.width = W * dpr
  canvas.value.height = H * dpr
  ctx = canvas.value.getContext('2d')
  if (phase.value !== 'playing') draw()
}

// ---- flow ----
function pick(n) {
  level.value = n
  // the how-to card only shows the first time; after that, straight to the countdown
  if (pip.introSeen.glide) begin()
  else phase.value = 'intro'
  nextTick(() => {
    resize()
    reset()
    draw()
  })
}

function begin() {
  pip.markIntroSeen('glide')
  phase.value = 'countdown'
}

function reset() {
  seed = { y: H * 0.45, vy: 0 }
  branches = []
  sparkles = []
  travelled = 0
  invulnerable = 0
  gust = 0
  gustTimer = 3
  t = 0
  passed.value = 0
  dew.value = 0
  hearts.value = HEARTS
  hint.value = true
  for (let i = 0; i < 4; i++) addBranch(W + 120 + i * SPACING)
}

function start() {
  resize()
  reset()
  ending = false
  results.value = null
  phase.value = 'playing'
  last = 0
  raf = requestAnimationFrame(loop)
}

function addBranch(x) {
  const index = branches.length ? branches[branches.length - 1].index + 1 : 0
  if (index >= cfg.value.branches) return
  const gapH = H * cfg.value.gap
  const margin = 70
  const center = margin + gapH / 2 + Math.random() * (H - 2 * margin - gapH)
  branches.push({ x, index, center, gapH, phase: Math.random() * Math.PI * 2, scored: false, dew: true })
}

function finish(success) {
  if (ending) return
  ending = true
  cancelAnimationFrame(raf)
  let petals = 0
  let stars = 0
  let unlocked = null
  let allDone = false
  if (success) {
    stars = starRating({ heartsLost: HEARTS - hearts.value, timeLeft: 1, mistakesOk: dew.value >= dewTarget.value })
    const reward = pip.completeLevel('glide', level.value, stars)
    petals = reward.petals
    unlocked = reward.unlocked && reward.unlocked <= GLIDE_LEVELS.length ? reward.unlocked : null
    allDone = reward.firstClear && level.value === GLIDE_LEVELS.length
    justUnlocked.value = unlocked
  }
  results.value = {
    success,
    stars,
    petals,
    unlocked,
    allDone,
    title: success ? (stars === 3 ? 'Light as a feather!' : 'Safely through!') : 'Blown off course',
    subtitle: success
      ? stars < 3
        ? `3 stars: no bumps and ${dewTarget.value} or more dewdrops.`
        : ''
      : `You passed ${passed.value} of ${cfg.value.branches} branches.`,
  }
  phase.value = 'done'
}

// ---- loop ----
function loop(time) {
  const dt = last ? Math.min(0.04, (time - last) / 1000) : 0.016
  last = time
  t += dt

  // the seed: hold to rise, release to drift down
  const lift = holding ? -1150 : 520
  seed.vy += lift * dt
  // gusts of wind on harder levels
  if (cfg.value.wind) {
    gustTimer -= dt
    if (gustTimer <= 0) {
      gust = (Math.random() < 0.5 ? -1 : 1) * cfg.value.wind * (120 + Math.random() * 80)
      gustTimer = 2.5 + Math.random() * 2.5
    }
    gust *= 1 - dt * 1.4
    seed.vy += gust * dt
  }
  seed.vy = Math.max(-300, Math.min(260, seed.vy))
  seed.y += seed.vy * dt
  if (seed.y < 18) {
    seed.y = 18
    seed.vy = 0
  }
  if (seed.y > H - 30) {
    seed.y = H - 30
    seed.vy = 0
  }

  // the world scrolls past
  const speed = cfg.value.speed * (W / 390)
  travelled += speed * dt
  const seedX = W * 0.28
  for (const b of branches) {
    b.x -= speed * dt
    const center = b.center + Math.sin(t * 1.6 + b.phase) * H * cfg.value.sway
    b.liveCenter = center
    const half = b.gapH / 2
    const within = Math.abs(b.x - seedX) < 26
    if (within && invulnerable <= 0 && (seed.y - 11 < center - half || seed.y + 11 > center + half)) bump()
    if (b.dew && Math.abs(b.x - seedX) < 18 && Math.abs(seed.y - center) < 22) {
      b.dew = false
      dew.value += 1
      sparkle(seedX, seed.y)
      playSound('catch', true, { combo: Math.min(dew.value, 8) })
      haptic('light')
    }
    if (!b.scored && b.x < seedX - 26) {
      b.scored = true
      passed.value += 1
      playSound('tick')
    }
  }
  branches = branches.filter((b) => b.x > -60)
  const lastX = branches.length ? branches[branches.length - 1].x : 0
  if (lastX < W + 40) addBranch(lastX + SPACING)

  invulnerable = Math.max(0, invulnerable - dt)
  sparkles = sparkles.filter((s) => (s.life -= dt) > 0)
  for (const s of sparkles) {
    s.x += s.vx * dt
    s.y += s.vy * dt
  }

  draw()

  if (hearts.value <= 0) return finish(false)
  if (passed.value >= cfg.value.branches) return finish(true)
  raf = requestAnimationFrame(loop)
}

function bump() {
  hearts.value -= 1
  invulnerable = 1.4
  seed.vy = -seed.vy * 0.4
  playSound('oops')
  haptic('error')
}

function sparkle(x, y) {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8
    sparkles.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 0.45 })
  }
}

// ---- drawing ----
function draw() {
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // distant hills drift slowly
  const hillShift = (travelled * 0.2) % W
  ctx.fillStyle = '#DCE6D3'
  for (let k = -1; k < 2; k++) {
    ctx.beginPath()
    ctx.ellipse(k * W - hillShift + W * 0.3, H + 10, W * 0.5, 90, 0, Math.PI, 0)
    ctx.ellipse(k * W - hillShift + W * 0.85, H + 20, W * 0.45, 70, 0, Math.PI, 0)
    ctx.fill()
  }

  // branches
  for (const b of branches) {
    const center = b.liveCenter ?? b.center
    const half = b.gapH / 2
    drawBranch(b.x, 0, center - half, true)
    drawBranch(b.x, center + half, H, false)
    if (b.dew) {
      ctx.fillStyle = '#9CC4D3'
      ctx.beginPath()
      ctx.moveTo(b.x, center - 9)
      ctx.quadraticCurveTo(b.x + 6, center, b.x + 5, center + 3)
      ctx.arc(b.x, center + 3, 5, 0, Math.PI)
      ctx.quadraticCurveTo(b.x - 6, center, b.x, center - 9)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath()
      ctx.arc(b.x - 1.6, center + 2, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // sparkles
  ctx.fillStyle = '#BFE0EA'
  for (const s of sparkles) {
    ctx.globalAlpha = s.life / 0.45
    ctx.beginPath()
    ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // the seed
  const x = W * 0.28
  const blink = invulnerable > 0 && Math.floor(invulnerable * 10) % 2 === 0
  if (!blink) drawSeed(x, seed.y, Math.max(-0.5, Math.min(0.5, seed.vy / 500)))
}

function drawBranch(x, y1, y2, fromTop) {
  if (y2 - y1 < 4) return
  const w = 26
  ctx.fillStyle = '#A9826A'
  roundRect(x - w / 2, y1 - (fromTop ? 20 : 0), w, y2 - y1 + 20, 13)
  ctx.fillStyle = '#B9937A'
  ctx.fillRect(x - w / 2 + 5, y1 - (fromTop ? 20 : 0), 4, y2 - y1 + 20)
  // leafy tip at the gap
  const tipY = fromTop ? y2 : y1
  ctx.fillStyle = '#8DB07A'
  ctx.beginPath()
  ctx.ellipse(x - 12, tipY + (fromTop ? -4 : 4), 13, 7, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#A6C78F'
  ctx.beginPath()
  ctx.ellipse(x + 12, tipY + (fromTop ? -6 : 6), 12, 6.5, 0.5, 0, Math.PI * 2)
  ctx.fill()
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.fill()
}

function drawSeed(x, y, tilt) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt)
  // the fluffy parachute
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 1.3
  for (let i = -3; i <= 3; i++) {
    const a = -Math.PI / 2 + i * 0.32
    ctx.beginPath()
    ctx.moveTo(0, -4)
    ctx.lineTo(Math.cos(a) * 20, -4 + Math.sin(a) * 20)
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(Math.cos(a) * 20, -4 + Math.sin(a) * 20, 2.6, 0, Math.PI * 2)
    ctx.fill()
  }
  // the seed with a tiny face
  ctx.fillStyle = '#B98D66'
  ctx.beginPath()
  ctx.ellipse(0, 4, 6, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#47352A'
  ctx.beginPath()
  ctx.arc(-2, 3, 1, 0, Math.PI * 2)
  ctx.arc(2, 3, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---- controls ----
function press(e) {
  if (phase.value !== 'playing') return
  e?.preventDefault?.()
  holding = true
  hint.value = false
}
function release() {
  holding = false
}
function onKey(e) {
  if (e.code === 'Space' || e.key === 'ArrowUp') {
    if (e.type === 'keydown') press(e)
    else release()
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

onMounted(() => {
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  window.addEventListener('pointerup', release)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKey)
  window.removeEventListener('pointerup', release)
})
</script>

<template>
  <GameShell title="Seed Glide" track="glide" :hide-title="phase !== 'levels'" background="linear-gradient(180deg, #CFE3EA 0%, #E9F0EA 60%, #F4EFE3 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase !== 'levels'">
        <span class="chip tabular-nums">
          <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M6 1C8 3.8 10.5 6.4 10.5 9A4.5 4.5 0 0 1 1.5 9C1.5 6.4 4 3.8 6 1Z" fill="#8FBFD1" /></svg>
          {{ dew }}
        </span>
        <span class="chip gap-0.5! px-2!" :aria-label="`${hearts} hearts left`">
          <svg v-for="i in HEARTS" :key="i" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7.5 2.5c0 5.7-7.5 10.3-7.5 10.3Z" :fill="i <= hearts ? '#E48C9C' : '#E7DDCF'" />
          </svg>
        </span>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Seed Glide"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <LevelHud
        :level="level"
        :total="GLIDE_LEVELS.length"
        :goal="`Pass ${cfg.branches} branches`"
        :value="passed"
        :target="cfg.branches"
        color="var(--color-water-400)"
      />

      <div
        ref="field"
        class="relative mt-2 flex-1 touch-none select-none overflow-hidden"
        @pointerdown="press"
        @pointerup="release"
        @pointercancel="release"
        @pointerleave="release"
      >
        <canvas ref="canvas" class="absolute inset-0 h-full w-full" />
        <p v-if="phase === 'playing' && hint" class="hint pointer-events-none absolute inset-x-0 bottom-10 text-center font-display text-lg font-semibold text-bark-500">
          Hold to float up, let go to drift down
        </p>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="`Pass ${cfg.branches} branches`"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#A6C78F', text: 'Hold anywhere to float up, let go to drift down' },
          { color: '#8FBFD1', text: `Collect dewdrops in the gaps (${dewTarget} for 3 stars)` },
          ...(cfg.sway ? [{ color: '#A9826A', text: 'The branches sway, watch the gaps' }] : []),
          ...(cfg.wind ? [{ color: '#C3B4DA', text: 'Gusts of wind will push you around' }] : []),
          { color: '#E48C9C', text: 'Each bump costs a heart' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" :label="`Level ${level}`" :goal="`Pass ${cfg.branches} branches`" @done="start" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Branches', value: passed },
          { label: 'Dewdrops', value: dew },
        ]"
        :petals="results.petals"
        :has-next="level < GLIDE_LEVELS.length"
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

<style scoped>
.hint {
  animation: hint 1.6s ease-in-out infinite;
}
@keyframes hint {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.4; }
}
</style>
