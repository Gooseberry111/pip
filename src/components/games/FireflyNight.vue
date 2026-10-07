<script setup>
// Firefly Night: fireflies blink into the dark garden. Tap them before they fade away,
// but leave the moths alone, they cost a heart. Catch enough to clear the level.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { FIREFLY_LEVELS, starRating, THREE_STAR_TIP } from '@/data/games'
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

const phase = ref('levels')
const level = ref(Math.min(pip.levelProgress('firefly').unlocked, FIREFLY_LEVELS.length))
const bugs = ref([])
const caught = ref(0)
const combo = ref(0)
const bestCombo = ref(0)
const hearts = ref(HEARTS)
const timeLeft = ref(0)
const results = ref(null)
const justUnlocked = ref(null)
const pipRef = ref(null)
const floaters = ref(null)
const now = ref(0)

const cfg = computed(() => FIREFLY_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('firefly'))
const levelList = computed(() => FIREFLY_LEVELS.map((l) => ({ goal: `Catch ${l.target} fireflies` })))
const timeLabel = computed(() => `0:${String(Math.ceil(timeLeft.value)).padStart(2, '0')}`)

let raf = null
let startedAt = 0
let nextSpawn = 0
let nextId = 0
let ending = false

// ---- flow ----
function pick(n) {
  level.value = n
  // the how-to card only shows the first time; after that, straight to the countdown
  if (pip.introSeen.firefly) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('firefly')
  phase.value = 'countdown'
}

function start() {
  bugs.value = []
  caught.value = 0
  combo.value = 0
  bestCombo.value = 0
  hearts.value = HEARTS
  timeLeft.value = cfg.value.time
  results.value = null
  ending = false
  phase.value = 'playing'
  startedAt = performance.now()
  nextSpawn = startedAt + 300
  raf = requestAnimationFrame(loop)
}

function finish(success) {
  if (ending) return
  ending = true
  cancelAnimationFrame(raf)
  bugs.value = []
  let petals = 0
  let stars = 0
  let unlocked = null
  let allDone = false
  if (success) {
    stars = starRating({ heartsLost: HEARTS - hearts.value, timeLeft: timeLeft.value / cfg.value.time })
    const reward = pip.completeLevel('firefly', level.value, stars)
    petals = reward.petals
    unlocked = reward.unlocked && reward.unlocked <= FIREFLY_LEVELS.length ? reward.unlocked : null
    allDone = reward.firstClear && level.value === FIREFLY_LEVELS.length
    justUnlocked.value = unlocked
  }
  results.value = {
    success,
    stars,
    petals,
    unlocked,
    allDone,
    title: success ? (stars === 3 ? 'A jar full of light!' : 'The garden is glowing!') : hearts.value <= 0 ? 'The moths got shy' : 'Nearly there',
    subtitle: success ? (stars < 3 ? '3 stars: no moths tapped and 30% of the time left.' : '') : hearts.value <= 0 ? 'Moths are fuzzy and grey. Let them be.' : `${caught.value} of ${cfg.value.target}. Try once more?`,
  }
  phase.value = 'done'
}

// ---- loop ----
function spawn(t) {
  const isMoth = Math.random() < cfg.value.moths
  bugs.value.push({
    id: nextId++,
    type: isMoth ? 'moth' : 'fly',
    x: 8 + Math.random() * 84,
    y: 8 + Math.random() * 60,
    born: t,
    life: cfg.value.life * (isMoth ? 1.3 : 0.85 + Math.random() * 0.3),
  })
}

function loop(t) {
  now.value = t
  const elapsed = (t - startedAt) / 1000
  timeLeft.value = Math.max(0, cfg.value.time - elapsed)

  if (t >= nextSpawn) {
    spawn(t)
    const pace = cfg.value.every * (1 - Math.min(0.3, elapsed / cfg.value.time / 3))
    nextSpawn = t + pace * (0.7 + Math.random() * 0.6)
  }

  // fireflies that fade away quietly just end the current run
  bugs.value = bugs.value.filter((b) => {
    if (t - b.born < b.life) return true
    if (b.type === 'fly') combo.value = 0
    return false
  })

  if (caught.value >= cfg.value.target) return finish(true)
  if (hearts.value <= 0) return finish(false)
  if (timeLeft.value <= 0) return finish(false)
  raf = requestAnimationFrame(loop)
}

function fade(b) {
  const age = (now.value - b.born) / b.life
  if (age < 0.12) return age / 0.12
  if (age > 0.75) return Math.max(0, (1 - age) / 0.25)
  return 1
}

function tapBug(b) {
  if (phase.value !== 'playing') return
  bugs.value = bugs.value.filter((x) => x.id !== b.id)
  if (b.type === 'moth') {
    hearts.value -= 1
    combo.value = 0
    playSound('oops')
    haptic('error')
    pipRef.value?.react('wiggle')
    floaters.value?.spawn({ x: b.x, y: b.y, kind: 'note', text: 'Oops' })
    return
  }
  caught.value += 1
  combo.value += 1
  bestCombo.value = Math.max(bestCombo.value, combo.value)
  playSound('catch', true, { combo: Math.min(combo.value, 8) })
  haptic('light')
  floaters.value?.spawn({ x: b.x, y: b.y, kind: 'note', text: '✦' })
  if (combo.value % 5 === 0) pipRef.value?.react('happy')
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <GameShell title="Firefly Night" track="firefly" dark background="linear-gradient(180deg, #232a44 0%, #36405f 55%, #4b5574 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase !== 'levels'">
        <span class="inline-flex h-[1.875rem] items-center gap-1.5 rounded-full bg-white/12 px-3 text-xs font-bold tabular-nums text-[#F6EFE2]" :class="{ 'bg-clay-400/70!': phase === 'playing' && timeLeft <= 8 }">
          <Icon name="timer" :size="14" :stroke="2.2" />{{ phase === 'playing' || phase === 'done' ? timeLabel : `0:${cfg.time}` }}
        </span>
        <span class="inline-flex h-[1.875rem] items-center gap-0.5 rounded-full bg-white/12 px-2" :aria-label="`${hearts} hearts left`">
          <svg v-for="i in HEARTS" :key="i" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7.5 2.5c0 5.7-7.5 10.3-7.5 10.3Z" :fill="i <= hearts ? '#F0A2AF' : 'rgba(255,255,255,0.18)'" />
          </svg>
        </span>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Firefly Night"
      dark
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <LevelHud
        :level="level"
        :total="FIREFLY_LEVELS.length"
        :goal="`Catch ${cfg.target} fireflies`"
        :value="caught"
        :target="cfg.target"
        color="#F4D98A"
        dark
      />

      <div class="relative flex-1 select-none overflow-hidden">
        <!-- stars and moon -->
        <svg class="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
          <circle v-for="i in 18" :key="i" :cx="(i * 37) % 100" :cy="(i * 23) % 55" r="0.35" fill="#F6EEDB" class="twinkle" :style="{ animationDelay: `${i * 0.4}s` }" />
        </svg>
        <svg class="pointer-events-none absolute right-6 top-6 h-12 w-12" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M24 4a16 16 0 1 0 12 26A13 13 0 1 1 24 4z" fill="#F3EBD6" />
        </svg>

        <!-- bushes and grass -->
        <svg class="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 360 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 80 Q40 40 80 70 T160 60 T240 74 T320 56 L360 66 L360 160 L0 160Z" fill="#2c3550" />
          <path d="M0 110 Q60 86 120 104 T240 98 T360 106 L360 160 L0 160Z" fill="#232b43" />
        </svg>

        <!-- Pip watching -->
        <div class="absolute bottom-3 left-1/2 aspect-[200/250] w-28 -translate-x-1/2">
          <Pip
            ref="pipRef"
            :growth="pip.growthValue"
            :droop="0"
            health="healthy"
            :pot="pip.currentPot"
            :leaf="pip.currentLeaf"
            :flower="pip.currentFlower"
            :interactive="phase === 'playing'"
            :idle="false"
            class="h-full w-full"
          />
        </div>

        <!-- fireflies and moths -->
        <button
          v-for="b in bugs"
          :key="b.id"
          type="button"
          data-sound="none"
          class="bug absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          :style="{ left: `${b.x}%`, top: `${b.y}%`, opacity: fade(b) }"
          :aria-label="b.type === 'fly' ? 'Firefly' : 'Moth'"
          @pointerdown.prevent="tapBug(b)"
        >
          <svg v-if="b.type === 'fly'" viewBox="-20 -20 40 40" class="firefly h-full w-full overflow-visible">
            <circle r="16" fill="url(#ff-glow)" />
            <ellipse cx="-4" cy="-4" rx="4" ry="2.4" fill="#fff" opacity="0.45" transform="rotate(-30 -4 -4)" />
            <ellipse cx="4" cy="-4" rx="4" ry="2.4" fill="#fff" opacity="0.45" transform="rotate(30 4 -4)" />
            <ellipse cx="0" cy="1" rx="3" ry="4.2" fill="#5B4636" />
            <circle cx="0" cy="4" r="3.4" fill="#FDF0B8" />
          </svg>
          <svg v-else viewBox="-20 -20 40 40" class="moth h-full w-full overflow-visible">
            <g class="moth-wings">
              <path d="M0 0 C-6 -12 -16 -12 -15 -3 C-14 3 -6 4 0 1Z" fill="#9C8E83" />
              <path d="M0 0 C6 -12 16 -12 15 -3 C14 3 6 4 0 1Z" fill="#9C8E83" />
              <path d="M0 1 C-5 6 -11 9 -9 3Z" fill="#857869" />
              <path d="M0 1 C5 6 11 9 9 3Z" fill="#857869" />
              <circle cx="-8" cy="-4" r="1.6" fill="#B9AEA4" />
              <circle cx="8" cy="-4" r="1.6" fill="#B9AEA4" />
            </g>
            <ellipse cx="0" cy="0" rx="2" ry="6" fill="#6B5F55" />
            <path d="M-0.6 -5 Q-3 -9 -5 -10 M0.6 -5 Q3 -9 5 -10" stroke="#6B5F55" stroke-width="0.9" fill="none" stroke-linecap="round" />
          </svg>
        </button>

        <svg width="0" height="0" class="absolute" aria-hidden="true">
          <defs>
            <radialGradient id="ff-glow">
              <stop offset="0" stop-color="#FCE7A0" stop-opacity="0.95" />
              <stop offset="0.45" stop-color="#F7D776" stop-opacity="0.45" />
              <stop offset="1" stop-color="#F7D776" stop-opacity="0" />
            </radialGradient>
          </defs>
        </svg>

        <Floaters ref="floaters" />

        <p v-if="phase === 'playing' && combo >= 3" class="absolute left-1/2 top-3 -translate-x-1/2 font-display text-lg font-semibold text-[#F4D98A]">
          {{ combo }} in a row
        </p>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="`Catch ${cfg.target} fireflies`"
        :stars="progress.stars[level] ?? 0"
        dark
        :tips="[
          { color: '#F4D98A', text: 'Tap fireflies before they fade' },
          ...(cfg.moths ? [{ color: '#9C8E83', text: 'Leave the grey moths alone' }] : []),
          { color: '#F0A2AF', text: THREE_STAR_TIP },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" dark :label="`Level ${level}`" :goal="`Catch ${cfg.target} fireflies`" @done="start" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Caught', value: caught },
          { label: 'Best run', value: bestCombo },
        ]"
        :petals="results.petals"
        :has-next="level < FIREFLY_LEVELS.length"
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
.bug {
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  animation: wander 2.4s ease-in-out infinite alternate;
}
.firefly {
  animation: blink 1.1s ease-in-out infinite;
}
.moth-wings {
  transform-box: fill-box;
  transform-origin: center;
  animation: flap 0.3s ease-in-out infinite;
}
.twinkle {
  animation: twinkle 4s ease-in-out infinite;
}
@keyframes wander {
  from { transform: translate(-50%, -50%); }
  to { transform: translate(-50%, -50%) translate(10px, -8px); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}
@keyframes flap {
  0%, 100% { transform: scaleX(1); }
  50% { transform: scaleX(0.55); }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.3; }
}
</style>
