<script setup>
// Pond Fishing: the hook swings under the boat. Tap to drop it straight down the line it's
// pointing along. Big catches are worth more but reel in slowly. Leave the boots and the
// grumpy pufferfish alone. Reach the target before the timer runs out.
import { computed, ref, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { FISHING_LEVELS } from '@/data/games'
import { POND_W, POND_H, PIVOT, FISH, newPond, tick, cast, hookTip } from '@/utils/fishingEngine'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import LevelHud from './LevelHud.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const phase = ref('levels') // levels | intro | playing | done
const level = ref(Math.min(pip.levelProgress('fishing').unlocked, FISHING_LEVELS.length))
const score = ref(0)
const timeLeft = ref(0)
const results = ref(null)
const justUnlocked = ref(null)
const field = ref(null)
const canvas = ref(null)
const pops = ref([]) // floating "+25"s

const cfg = computed(() => FISHING_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('fishing'))
const levelList = computed(() => FISHING_LEVELS.map((l) => ({ goal: `Catch ${l.target} points in ${l.time} seconds` })))

let pond = null
let ctx = null
let dpr = 1
let S = 3
let raf = null
let last = 0
let popId = 0

function pick(n) {
  level.value = n
  if (pip.introSeen.fishing) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('fishing')
  pond = newPond(cfg.value)
  score.value = 0
  timeLeft.value = cfg.value.time
  results.value = null
  pops.value = []
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
  S = Math.min(rect.width / POND_W, rect.height / POND_H)
  canvas.value.width = POND_W * S * dpr
  canvas.value.height = POND_H * S * dpr
  canvas.value.style.width = `${POND_W * S}px`
  canvas.value.style.height = `${POND_H * S}px`
  ctx = canvas.value.getContext('2d')
}

function onTap() {
  if (phase.value !== 'playing' || !pond || timeLeft.value <= 0) return
  if (cast(pond)) {
    playSound('shoot')
    haptic('light')
  }
}

function loop(now) {
  if (phase.value === 'levels') return
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
  last = now
  if (phase.value === 'playing' && pond) {
    timeLeft.value = Math.max(0, timeLeft.value - dt)
    const events = tick(pond, cfg.value, dt)
    for (const ev of events) {
      if (ev.type === 'snag') {
        const f = FISH[ev.fish.kind]
        playSound(f.pts < 0 ? 'oops' : f.junk ? 'miss' : 'catch', true, { golden: ev.fish.kind === 'koi' || ev.fish.kind === 'chest' })
        haptic(f.pts >= 60 ? 'success' : 'light')
      } else if (ev.type === 'landed') {
        const f = FISH[ev.fish.kind]
        score.value = pond.score
        popId++
        pops.value = [...pops.value.slice(-3), { id: popId, text: f.pts > 0 ? `+${f.pts} ${f.name}` : f.pts < 0 ? `${f.pts} Ouch!` : f.name, bad: f.pts <= 0 }]
        const id = popId
        setTimeout(() => (pops.value = pops.value.filter((p) => p.id !== id)), 1300)
        if (f.pts > 0) playSound('petals')
      }
    }
    // time's up: let a catch already on the line come in first
    if (timeLeft.value <= 0 && pond.hook.state !== 'in') finish()
  }
  draw()
  raf = requestAnimationFrame(loop)
}

function finish() {
  if (phase.value !== 'playing') return
  phase.value = 'done'
  const t = cfg.value.target
  const s = score.value
  if (s < t) {
    results.value = { success: false, title: 'Not quite this time', subtitle: `You needed ${t}. Wait for a big fish to line up before you drop the hook.` }
    return
  }
  const stars = s >= t * 1.5 ? 3 : s >= t * 1.22 ? 2 : 1
  const reward = pip.completeLevel('fishing', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= FISHING_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === FISHING_LEVELS.length,
    title: stars === 3 ? 'Master angler!' : 'What a catch!',
    subtitle: stars < 3 ? `3 stars: ${Math.ceil(t * 1.5)} points.` : `${pond.caught.filter((k) => FISH[k].pts > 0).length} catches.`,
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

// ---- drawing ----
function draw() {
  if (!ctx || !pond) return
  const X = (x) => x * S
  const Y = (y) => y * S
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, POND_W * S, POND_H * S)
  // sky strip and water
  const g = ctx.createLinearGradient(0, Y(18), 0, Y(POND_H))
  g.addColorStop(0, '#9CCFE0')
  g.addColorStop(0.5, '#5FA0BE')
  g.addColorStop(1, '#3C6E8C')
  ctx.fillStyle = '#E4F1F2'
  ctx.fillRect(0, 0, X(POND_W), Y(20))
  ctx.fillStyle = g
  ctx.fillRect(0, Y(18), X(POND_W), Y(POND_H))
  // light rays
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  for (let k = 0; k < 4; k++) {
    const x = 10 + k * 26 + Math.sin(pond.t * 0.3 + k) * 4
    ctx.beginPath()
    ctx.moveTo(X(x), Y(18))
    ctx.lineTo(X(x + 10), Y(18))
    ctx.lineTo(X(x + 22), Y(POND_H))
    ctx.lineTo(X(x + 4), Y(POND_H))
    ctx.fill()
  }
  // bottom: sand, weeds
  ctx.fillStyle = '#C9B48A'
  ctx.beginPath()
  ctx.moveTo(0, Y(POND_H))
  for (let x = 0; x <= POND_W; x += 10) ctx.lineTo(X(x), Y(154 + Math.sin(x * 0.3) * 2))
  ctx.lineTo(X(POND_W), Y(POND_H))
  ctx.fill()
  ctx.strokeStyle = '#5E9150'
  ctx.lineWidth = 1.4 * S
  ctx.lineCap = 'round'
  for (const wx of [8, 22, 61, 88]) {
    ctx.beginPath()
    ctx.moveTo(X(wx), Y(156))
    ctx.quadraticCurveTo(X(wx + Math.sin(pond.t + wx) * 3), Y(146), X(wx + 1), Y(136))
    ctx.stroke()
  }
  // surface ripple
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 0.6 * S
  ctx.beginPath()
  for (let x = 0; x <= POND_W; x += 2) ctx.lineTo(X(x), Y(18.5 + Math.sin(x * 0.4 + pond.t * 2) * 0.6))
  ctx.stroke()

  for (const f of pond.fish) drawFish(f, X, Y)

  // boat and line
  ctx.fillStyle = '#B98C63'
  ctx.beginPath()
  ctx.moveTo(X(36), Y(14))
  ctx.lineTo(X(64), Y(14))
  ctx.lineTo(X(60), Y(20))
  ctx.lineTo(X(40), Y(20))
  ctx.fill()
  ctx.fillStyle = '#9C7351'
  ctx.fillRect(X(36), Y(13), X(28), Y(1.6))
  // Pip in the boat
  ctx.fillStyle = '#D39A7B'
  ctx.fillRect(X(42), Y(8), X(6), Y(5))
  ctx.fillStyle = '#86AD72'
  ctx.beginPath()
  ctx.ellipse(X(43.5), Y(6), X(2.6), Y(1.4), -0.5, 0, Math.PI * 2)
  ctx.ellipse(X(47), Y(5.6), X(2.6), Y(1.4), 0.5, 0, Math.PI * 2)
  ctx.fill()
  // rod
  ctx.strokeStyle = '#8C6A4F'
  ctx.lineWidth = 0.8 * S
  ctx.beginPath()
  ctx.moveTo(X(47), Y(11))
  ctx.lineTo(X(PIVOT.x), Y(PIVOT.y - 6))
  ctx.stroke()
  const tip = hookTip(pond)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 0.35 * S
  ctx.beginPath()
  ctx.moveTo(X(PIVOT.x), Y(PIVOT.y - 6))
  ctx.lineTo(X(tip.x), Y(tip.y))
  ctx.stroke()
  // aim guide while swinging
  if (pond.hook.state === 'swing') {
    ctx.setLineDash([1 * S, 2.2 * S])
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.beginPath()
    ctx.moveTo(X(tip.x), Y(tip.y))
    ctx.lineTo(X(PIVOT.x + Math.sin(pond.hook.angle) * 60), Y(PIVOT.y + Math.cos(pond.hook.angle) * 60))
    ctx.stroke()
    ctx.setLineDash([])
  }
  // hook
  ctx.strokeStyle = '#D9D4CC'
  ctx.lineWidth = 0.7 * S
  ctx.beginPath()
  ctx.arc(X(tip.x), Y(tip.y + 1.2), 1.3 * S, 0, Math.PI)
  ctx.stroke()
  ctx.fillStyle = '#E35D4B'
  ctx.beginPath()
  ctx.arc(X(tip.x), Y(tip.y - 1), 0.9 * S, 0, Math.PI * 2)
  ctx.fill()
}

function drawFish(f, X, Y) {
  const k = f.kind
  const r = f.r
  const bob = Math.sin(pond.t * 3 + f.bob) * 0.4
  ctx.save()
  ctx.translate(X(f.x), Y(f.y + bob))
  ctx.scale(f.dir < 0 ? -1 : 1, 1)
  if (k === 'boot') {
    ctx.fillStyle = '#6B5646'
    ctx.beginPath()
    ctx.moveTo(-r * S * 0.4, -r * S)
    ctx.lineTo(r * S * 0.2, -r * S)
    ctx.lineTo(r * S * 0.25, 0)
    ctx.lineTo(r * S, r * S * 0.2)
    ctx.lineTo(r * S, r * S * 0.7)
    ctx.lineTo(-r * S * 0.5, r * S * 0.7)
    ctx.fill()
  } else if (k === 'chest') {
    ctx.fillStyle = '#9C7351'
    ctx.fillRect(-r * S, -r * S * 0.6, r * S * 2, r * S * 1.3)
    ctx.fillStyle = '#F2C66B'
    ctx.fillRect(-r * S, -r * S * 0.15, r * S * 2, r * S * 0.25)
    ctx.fillRect(-r * S * 0.15, -r * S * 0.3, r * S * 0.3, r * S * 0.5)
    ctx.fillStyle = 'rgba(255,240,180,0.6)'
    ctx.beginPath()
    ctx.arc(r * S * 0.6, -r * S * 0.8, 0.6 * S + Math.sin(pond.t * 5) * 0.3 * S, 0, Math.PI * 2)
    ctx.fill()
  } else if (k === 'turtle') {
    ctx.fillStyle = '#9CC584'
    ctx.beginPath()
    ctx.arc(r * S * 0.95, 0, r * S * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6E9E5C'
    ctx.beginPath()
    ctx.ellipse(0, 0, r * S, r * S * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#557F48'
    ctx.lineWidth = 0.5 * S
    ctx.stroke()
  } else if (k === 'puffer') {
    ctx.fillStyle = '#E8C268'
    ctx.beginPath()
    ctx.arc(0, 0, r * S * 0.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#C9A646'
    ctx.lineWidth = 0.5 * S
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(ang) * r * S * 0.8, Math.sin(ang) * r * S * 0.8)
      ctx.lineTo(Math.cos(ang) * r * S * 1.1, Math.sin(ang) * r * S * 1.1)
      ctx.stroke()
    }
    ctx.fillStyle = '#3E2F25'
    ctx.beginPath()
    ctx.arc(r * S * 0.35, -r * S * 0.2, 0.5 * S, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const col = { minnow: ['#C9D6DA', '#A9BAC0'], perch: ['#9CC584', '#6E9E5C'], carp: ['#E8A06A', '#C9784A'], koi: ['#F6C443', '#E8A934'] }[k]
    // tail
    ctx.fillStyle = col[1]
    ctx.beginPath()
    ctx.moveTo(-r * S * 0.8, 0)
    ctx.lineTo(-r * S * 1.5, -r * S * 0.55 + Math.sin(pond.t * 8 + f.bob) * 0.5 * S)
    ctx.lineTo(-r * S * 1.5, r * S * 0.55 + Math.sin(pond.t * 8 + f.bob) * 0.5 * S)
    ctx.fill()
    ctx.fillStyle = col[0]
    ctx.beginPath()
    ctx.ellipse(0, 0, r * S, r * S * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    if (k === 'koi') {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.ellipse(-r * S * 0.2, -r * S * 0.15, r * S * 0.35, r * S * 0.18, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#2E2219'
    ctx.beginPath()
    ctx.arc(r * S * 0.5, -r * S * 0.12, Math.max(0.4, r * 0.11) * S, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <GameShell title="Pond Fishing" track="rain" :hide-title="phase === 'playing'" background="linear-gradient(180deg, #E4F1F2 0%, #CFE3EA 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase === 'playing'" class="chip tabular-nums">{{ Math.ceil(timeLeft) }}s</span>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Pond Fishing"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <LevelHud :level="level" :total="FISHING_LEVELS.length" goal="Reach the target" :value="score" :target="cfg.target" color="#4E86AC" />

      <div ref="field" class="relative mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] mt-2 flex flex-1 items-center justify-center" @pointerdown="onTap">
        <canvas ref="canvas" class="touch-none rounded-2xl shadow-soft" />
        <div class="pointer-events-none absolute inset-x-0 top-[22%] flex flex-col items-center gap-1">
          <TransitionGroup name="pop">
            <span v-for="p in pops" :key="p.id" class="rounded-full px-3 py-1 text-sm font-extrabold shadow-soft" :class="p.bad ? 'bg-clay-100 text-clay-400' : 'bg-surface text-leaf-500'">{{ p.text }}</span>
          </TransitionGroup>
        </div>
        <p v-if="phase === 'playing' && score === 0 && level <= 2" class="pointer-events-none absolute bottom-4 rounded-full bg-surface/90 px-4 py-1.5 text-xs font-bold text-bark-500 shadow-soft">
          Tap anywhere to drop the hook
        </p>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#4E86AC', text: 'Tap to drop the hook as it swings' },
          { color: '#F6C443', text: 'Golden koi and treasure are worth the most' },
          { color: '#6B5646', text: 'Boots are heavy and worth nothing' },
          { color: '#E8C268', text: 'Pufferfish take points away' },
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
          { label: 'Points', value: score },
          { label: 'Target', value: cfg.target },
        ]"
        :petals="results.petals ?? 0"
        :has-next="results.success && level < FISHING_LEVELS.length"
        :unlocked="results.unlocked ?? null"
        :all-done="results.allDone ?? false"
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
.pop-enter-active {
  transition: opacity 0.2s ease, transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.pop-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.pop-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}
</style>
