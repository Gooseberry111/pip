<script setup>
// Raindrop Catch: slide Pip's pot to catch the rain and reach each level's goal.
// Golden drops are worth 5, petal drops go to your pocket, and grumpy mud drops
// cost a heart. Lose all three hearts and the level ends. The rain waters Pip.
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { RAIN_LEVELS, rainGoalText, starRating, THREE_STAR_TIP } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import Countdown from './Countdown.vue'
import LevelHud from './LevelHud.vue'
import Pip from '../Pip.vue'
import Floaters from '../Floaters.vue'
import Icon from '../Icon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const HEARTS = 3

const phase = ref('levels') // levels | intro | countdown | playing | done
const level = ref(Math.min(pip.levelProgress('rain').unlocked, RAIN_LEVELS.length))
const timeLeft = ref(0)
const score = ref(0)
const caught = ref(0)
const golden = ref(0)
const combo = ref(0)
const bestCombo = ref(0)
const hearts = ref(HEARTS)
const petalsCaught = ref(0)
const hurt = ref(false)
const results = ref(null)
const justUnlocked = ref(null)

const field = ref(null)
const canvas = ref(null)
const pipRef = ref(null)
const floaters = ref(null)
const size = ref({ w: 360, h: 640 })
const potX = ref(0.5)

const cfg = computed(() => RAIN_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('rain'))
const levelList = computed(() => RAIN_LEVELS.map((l) => ({ goal: rainGoalText(l.goal) })))
const multiplier = computed(() => (combo.value >= 16 ? 3 : combo.value >= 8 ? 2 : 1))
const potWidth = computed(() => Math.min(132, Math.max(92, size.value.w * 0.28)))
const timeLabel = computed(() => `0:${String(Math.ceil(timeLeft.value)).padStart(2, '0')}`)
const goalValue = computed(() => {
  const g = cfg.value.goal
  return { drops: caught.value, score: score.value, golden: golden.value, combo: bestCombo.value }[g.type]
})
const goalFraction = computed(() => Math.min(1, goalValue.value / cfg.value.goal.target))

let drops = []
let splashes = []
let raf = null
let last = 0
let elapsed = 0
let spawnAcc = 0
let targetX = 0.5
let dpr = 1
let ctx = null
let ending = false

function resize() {
  const r = field.value?.getBoundingClientRect()
  if (!r || !canvas.value) return
  size.value = { w: r.width, h: r.height }
  dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.value.width = r.width * dpr
  canvas.value.height = r.height * dpr
  ctx = canvas.value.getContext('2d')
}

function rim() {
  const pw = potWidth.value
  const ph = pw * 1.25
  const top = size.value.h - 14 - ph
  return { y: top + ph * (166 / 250), half: (pw * 0.44) / 2 + 6, cx: potX.value * size.value.w }
}

// ---- flow ----
function pick(n) {
  level.value = n
  // the how-to card only shows the first time; after that, straight to the countdown
  if (pip.introSeen.rain) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('rain')
  phase.value = 'countdown'
  nextTick(resize)
}

function start() {
  drops = []
  splashes = []
  elapsed = 0
  spawnAcc = 0
  ending = false
  score.value = 0
  caught.value = 0
  golden.value = 0
  combo.value = 0
  bestCombo.value = 0
  hearts.value = HEARTS
  petalsCaught.value = 0
  timeLeft.value = cfg.value.time
  results.value = null
  phase.value = 'playing'
  last = 0
  resize()
  raf = requestAnimationFrame(loop)
}

function finish(success) {
  if (ending) return
  ending = true
  cancelAnimationFrame(raf)
  raf = null

  if (petalsCaught.value) pip.earn(petalsCaught.value)
  const rain = Math.min(40, Math.round(caught.value * 1.2))
  const watered = rain > 0 ? pip.giveWater(rain) : null
  pip.queueCelebration(watered)

  let petals = petalsCaught.value
  let stars = 0
  let unlocked = null
  let allDone = false
  if (success) {
    stars = starRating({ heartsLost: HEARTS - hearts.value, timeLeft: timeLeft.value / cfg.value.time })
    const reward = pip.completeLevel('rain', level.value, stars)
    petals += reward.petals
    unlocked = reward.unlocked && reward.unlocked <= RAIN_LEVELS.length ? reward.unlocked : null
    allDone = reward.firstClear && level.value === RAIN_LEVELS.length
    justUnlocked.value = unlocked
  }
  const best = success && pip.recordScore('rain', score.value)
  results.value = {
    success,
    stars,
    petals,
    best,
    unlocked,
    allDone,
    water: watered && !watered.wasFull ? watered.absorbed : 0,
    title: success ? (stars === 3 ? 'Flawless!' : stars === 2 ? 'Goal reached!' : 'Just made it!') : hearts.value <= 0 ? 'Too much mud' : 'So close',
    subtitle: success ? (stars < 3 ? '3 stars: no mud caught and 30% of the time left.' : '') : hearts.value <= 0 ? 'Dodge the grumpy brown drops.' : `${goalValue.value} of ${cfg.value.goal.target}. One more go?`,
  }
  phase.value = 'done'
}

// ---- the game loop ----
function spawn() {
  const roll = Math.random()
  let type = 'rain'
  if (roll < cfg.value.mud) type = 'mud'
  else if (roll < cfg.value.mud + 0.09) type = 'golden'
  else if (roll < cfg.value.mud + 0.13 && petalsCaught.value < 6) type = 'petal'
  const speedScale = (size.value.h / 700) * cfg.value.speed
  drops.push({
    x: 24 + Math.random() * (size.value.w - 48),
    y: -20,
    vy: (150 + elapsed * 5 + Math.random() * 50) * speedScale * (type === 'petal' ? 0.7 : type === 'mud' ? 0.92 : 1),
    type,
    spin: Math.random() * Math.PI,
  })
}

function loop(time) {
  const dt = last ? Math.min(0.05, (time - last) / 1000) : 0.016
  last = time
  elapsed += dt
  timeLeft.value = Math.max(0, cfg.value.time - elapsed)
  potX.value += (targetX - potX.value) * Math.min(1, dt * 12)

  spawnAcc += dt * (1.2 + (elapsed / cfg.value.time) * 1.6) * Math.sqrt(cfg.value.speed) * (cfg.value.rate ?? 1)
  while (spawnAcc >= 1) {
    spawn()
    spawnAcc -= 1
  }

  const r = rim()
  const keep = []
  for (const d of drops) {
    const prevY = d.y
    d.y += d.vy * dt
    d.spin += dt * 3
    if (prevY < r.y && d.y >= r.y && Math.abs(d.x - r.cx) <= r.half) {
      onCatch(d, r)
      continue
    }
    if (d.y > size.value.h + 24) {
      if (d.type === 'rain' || d.type === 'golden') combo.value = 0
      continue
    }
    keep.push(d)
  }
  drops = keep

  splashes = splashes.filter((s) => (s.life -= dt) > 0)
  for (const s of splashes) {
    s.x += s.vx * dt
    s.y += s.vy * dt
    s.vy += 500 * dt
  }

  draw()

  if (goalValue.value >= cfg.value.goal.target) return finish(true)
  if (hearts.value <= 0) return finish(false)
  if (elapsed >= cfg.value.time) return finish(false)
  raf = requestAnimationFrame(loop)
}

function splash(x, y, color) {
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (Math.PI * i) / 6
    splashes.push({ x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 120, life: 0.5, color })
  }
}

function onCatch(d, r) {
  const point = { x: (d.x / size.value.w) * 100, y: (r.y / size.value.h) * 100 - 4 }

  if (d.type === 'mud') {
    hearts.value -= 1
    combo.value = 0
    splash(d.x, r.y, '#8C7461')
    playSound('oops')
    haptic('error')
    hurt.value = true
    setTimeout(() => (hurt.value = false), 900)
    pipRef.value?.react('wiggle')
    floaters.value?.spawn({ ...point, kind: 'note', text: 'Yuck!' })
    return
  }

  combo.value += 1
  bestCombo.value = Math.max(bestCombo.value, combo.value)
  splash(d.x, r.y, d.type === 'golden' ? '#F2C66B' : d.type === 'petal' ? '#F3B4BE' : '#9CC4D3')

  if (d.type === 'petal') {
    petalsCaught.value += 1
    floaters.value?.spawn({ ...point, kind: 'petals', text: '+1' })
    playSound('petals')
    haptic('light')
    return
  }
  caught.value += 1
  if (d.type === 'golden') golden.value += 1
  const value = (d.type === 'golden' ? 5 : 1) * multiplier.value
  score.value += value
  floaters.value?.spawn({ ...point, kind: 'note', text: `+${value}` })
  playSound('catch', true, { combo: Math.min(combo.value, 8), golden: d.type === 'golden' })
  haptic(d.type === 'golden' ? 'soft' : 'light')
  if (d.type === 'golden') pipRef.value?.react('happy')
}

function drawDrop(color, shine = true) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -11)
  ctx.quadraticCurveTo(7, -1, 6, 4)
  ctx.arc(0, 4, 6, 0, Math.PI)
  ctx.quadraticCurveTo(-7, -1, 0, -11)
  ctx.fill()
  if (shine) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.beginPath()
    ctx.ellipse(-2, 3, 1.6, 2.6, -0.3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function draw() {
  if (!ctx) return
  const { w, h } = size.value
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  for (const d of drops) {
    ctx.save()
    ctx.translate(d.x, d.y)
    if (d.type === 'petal') {
      ctx.rotate(Math.sin(d.spin) * 0.8)
      ctx.fillStyle = '#F3B4BE'
      ctx.beginPath()
      ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.ellipse(-2, -1.5, 3, 1.4, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (d.type === 'mud') {
      // a grumpy little mud drop
      ctx.rotate(Math.sin(d.spin * 2) * 0.15)
      ctx.scale(1.45, 1.45)
      drawDrop('#8C7461', false)
      ctx.fillStyle = '#6E5847'
      ctx.beginPath()
      ctx.ellipse(2.5, 5, 2.4, 1.4, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#2E2219'
      ctx.beginPath()
      ctx.arc(-2.2, 2.4, 0.9, 0, Math.PI * 2)
      ctx.arc(2.2, 2.4, 0.9, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#2E2219'
      ctx.lineWidth = 0.8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-1.6, 6.2)
      ctx.quadraticCurveTo(0, 5, 1.6, 6.2)
      ctx.moveTo(-3.4, 0.6)
      ctx.lineTo(-1.2, 1.4)
      ctx.moveTo(3.4, 0.6)
      ctx.lineTo(1.2, 1.4)
      ctx.stroke()
    } else {
      const isGolden = d.type === 'golden'
      if (isGolden) {
        ctx.fillStyle = 'rgba(246, 214, 130, 0.35)'
        ctx.beginPath()
        ctx.arc(0, 2, 16 + Math.sin(d.spin * 2) * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.scale(1.35, 1.35)
      }
      drawDrop(isGolden ? '#F2C66B' : '#8FBFD1')
    }
    ctx.restore()
  }

  for (const s of splashes) {
    ctx.globalAlpha = Math.max(0, s.life / 0.5)
    ctx.fillStyle = s.color
    ctx.beginPath()
    ctx.arc(s.x, s.y, 2.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ---- controls ----
function onPointer(e) {
  if (phase.value !== 'playing') return
  const r = field.value.getBoundingClientRect()
  targetX = Math.min(0.92, Math.max(0.08, (e.clientX - r.left) / r.width))
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function onKey(e) {
  if (phase.value !== 'playing') return
  if (e.key === 'ArrowLeft') targetX = Math.max(0.08, targetX - 0.08)
  if (e.key === 'ArrowRight') targetX = Math.min(0.92, targetX + 0.08)
}

onMounted(() => {
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <GameShell title="Raindrop Catch" track="rain" :hide-title="phase !== 'levels'" background="linear-gradient(180deg, #CCDCE3 0%, #E6EDEA 45%, #F7F0E4 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase !== 'levels'">
        <span class="chip tabular-nums" :class="{ 'bg-clay-100! text-clay-400!': phase === 'playing' && timeLeft <= 8 }">
          <Icon name="timer" :size="14" :stroke="2.2" />{{ phase === 'intro' || phase === 'countdown' ? `0:${cfg.time}` : timeLabel }}
        </span>
        <span class="chip gap-0.5! px-2!" :aria-label="`${hearts} hearts left`">
          <svg v-for="i in HEARTS" :key="i" width="15" height="15" viewBox="0 0 24 24" :class="{ 'heart-lost': i > hearts }" aria-hidden="true">
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
      heading="Raindrop Catch"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <LevelHud
        :level="level"
        :total="RAIN_LEVELS.length"
        :goal="rainGoalText(cfg.goal)"
        :value="goalValue"
        :target="cfg.goal.target"
        color="var(--color-water-400)"
      />

      <div
        ref="field"
        class="relative flex-1 touch-none select-none overflow-hidden"
        :class="{ shake: hurt }"
        @pointerdown="onPointer"
        @pointermove="onPointer"
      >
        <!-- soft clouds -->
        <svg class="pointer-events-none absolute inset-x-0 top-0 h-24 w-full" viewBox="0 0 360 90" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
          <g v-for="(c, i) in [[60, 26, 1], [190, 16, 1.25], [310, 30, 0.9]]" :key="i" :transform="`translate(${c[0]} ${c[1]}) scale(${c[2]})`">
            <g fill="#fff" opacity="0.85" class="cloud" :style="{ animationDelay: `${-i * 6}s` }">
              <ellipse cx="0" cy="10" rx="44" ry="13" />
              <circle cx="-18" cy="2" r="16" />
              <circle cx="6" cy="-4" r="20" />
              <circle cx="26" cy="4" r="13" />
            </g>
          </g>
        </svg>

        <canvas ref="canvas" class="absolute inset-0 h-full w-full" />

        <div class="absolute bottom-3.5" :style="{ width: `${potWidth}px`, height: `${potWidth * 1.25}px`, left: `${potX * size.w - potWidth / 2}px` }">
          <Pip
            ref="pipRef"
            :growth="pip.growthValue"
            :droop="0"
            :health="hurt ? 'wilting' : 'healthy'"
            :pot="pip.currentPot"
            :leaf="pip.currentLeaf"
            :flower="pip.currentFlower"
            :accessory="pip.currentAccessory"
            :interactive="false"
            :idle="false"
            class="h-full w-full"
          />
        </div>

        <Floaters ref="floaters" />

        <Transition name="pop">
          <div
            v-if="phase === 'playing' && multiplier > 1"
            :key="multiplier"
            class="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-honey-400 px-4 py-1.5 font-display text-lg font-semibold text-white shadow-soft"
          >
            Combo ×{{ multiplier }}
          </div>
        </Transition>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="rainGoalText(cfg.goal)"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#8FBFD1', text: 'Slide your finger to move the pot' },
          { color: '#F2C66B', text: 'Golden drops are worth 5' },
          ...(cfg.mud ? [{ color: '#8C7461', text: 'Dodge the grumpy mud drops' }] : []),
          { color: '#E48C9C', text: THREE_STAR_TIP },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" :label="`Level ${level}`" :goal="rainGoalText(cfg.goal)" @done="start" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Score', value: score },
          { label: 'Drops', value: caught },
          { label: 'Combo', value: bestCombo },
        ]"
        :petals="results.petals"
        :water="results.water"
        :best="results.best"
        :has-next="level < RAIN_LEVELS.length"
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
.cloud {
  animation: cloud-drift 18s ease-in-out infinite alternate;
}
@keyframes cloud-drift {
  from { transform: translateX(-12px); }
  to { transform: translateX(16px); }
}
.shake {
  animation: shake 0.35s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.heart-lost {
  animation: heart-lost 0.4s ease-out;
}
@keyframes heart-lost {
  0% { transform: scale(1.5); }
  100% { transform: scale(1); }
}
.pop-enter-active {
  transition: transform 0.4s cubic-bezier(0.3, 1.6, 0.5, 1), opacity 0.3s;
}
.pop-leave-active {
  transition: opacity 0.3s;
}
.pop-enter-from {
  transform: translateX(-50%) scale(0.5);
  opacity: 0;
}
.pop-leave-to {
  opacity: 0;
}
</style>
