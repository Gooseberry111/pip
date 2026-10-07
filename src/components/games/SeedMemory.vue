<script setup>
// Seed Memory: turn over cards to find matching pairs before the timer runs out.
// Each level adds more cards. Stuck? A hint lights up a pair, for a few petals.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { ITEMS } from '@/data/items'
import { MEMORY_LEVELS, HINT_COST, MAX_HINTS, starRating } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import Countdown from './Countdown.vue'
import LevelHud from './LevelHud.vue'
import ItemPreview from '../ItemPreview.vue'
import PetalIcon from '../PetalIcon.vue'
import Icon from '../Icon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const FACES = Object.entries(ITEMS)
  .filter(([category]) => category !== 'backgrounds')
  .flatMap(([category, list]) => list.map((item) => ({ category, id: item.id })))

const phase = ref('levels') // levels | intro | countdown | playing | done
const level = ref(pip.levelProgress('memory').unlocked > MEMORY_LEVELS.length ? MEMORY_LEVELS.length : pip.levelProgress('memory').unlocked)
const cards = ref([])
const flipped = ref([])
const moves = ref(0)
const matches = ref(0)
const locked = ref(false)
const timeLeft = ref(0)
const hinted = ref([])
const results = ref(null)
const noPetals = ref(false)
const hintsUsed = ref(0)
const justUnlocked = ref(null)

const cfg = computed(() => MEMORY_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('memory'))
const levelList = computed(() => MEMORY_LEVELS.map((l) => ({ goal: `${l.pairs} pairs in ${l.time}s` })))
const rows = computed(() => Math.ceil((cfg.value.pairs * 2) / 4))
const aspect = computed(() => (rows.value <= 3 ? 0.8 : rows.value === 4 ? 0.88 : 1))
const gridWidth = computed(() => `min(100%, calc((100dvh - 300px) * ${4 / rows.value} * ${aspect.value}))`)
const timeFraction = computed(() => (cfg.value ? timeLeft.value / cfg.value.time : 1))
const timeLabel = computed(() => {
  const s = Math.ceil(timeLeft.value)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const canHint = computed(
  () => phase.value === 'playing' && !locked.value && hinted.value.length === 0 && hintsUsed.value < MAX_HINTS,
)
// a tidy memory: at most about three wrong guesses for every four pairs
const mistakeLimit = computed(() => Math.ceil(cfg.value.pairs * 0.75))
const mistakes = computed(() => moves.value - matches.value)

let timer = null
let lastTick = 0

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---- flow ----
function pick(n) {
  level.value = n
  // the how-to card only shows the first time; after that, straight to the countdown
  if (pip.introSeen.memory) begin()
  else phase.value = 'intro'
}

function pickFaces() {
  if (!cfg.value.similar) return shuffle(FACES).slice(0, cfg.value.pairs)
  // harder levels: cards from just one or two kinds of item, so they look alike
  const kinds = shuffle(['pots', 'flowers', 'decorations', 'leaves'])
  let pool = []
  for (const kind of kinds) {
    pool = pool.concat(shuffle(FACES.filter((f) => f.category === kind)))
    if (pool.length >= cfg.value.pairs) break
  }
  return pool.slice(0, cfg.value.pairs)
}

function deal() {
  const faces = pickFaces()
  cards.value = shuffle(
    faces.flatMap((face, pair) => [0, 1].map((k) => ({ key: `${pair}-${k}`, pair, ...face, up: false, matched: false }))),
  )
  flipped.value = []
  hinted.value = []
  moves.value = 0
  matches.value = 0
  hintsUsed.value = 0
  locked.value = false
  results.value = null
  timeLeft.value = cfg.value.time
}

function begin() {
  pip.markIntroSeen('memory')
  deal()
  phase.value = 'countdown'
}

function start() {
  phase.value = 'playing'
  lastTick = Math.ceil(timeLeft.value)
  const t0 = performance.now()
  const total = cfg.value.time
  clearInterval(timer)
  timer = setInterval(() => {
    timeLeft.value = Math.max(0, total - (performance.now() - t0) / 1000)
    const whole = Math.ceil(timeLeft.value)
    if (whole !== lastTick) {
      lastTick = whole
      if (whole <= 5 && whole > 0) playSound('tick')
    }
    if (timeLeft.value <= 0) finish(false)
  }, 100)
}

function finish(success) {
  clearInterval(timer)
  locked.value = true
  if (success) {
    const stars = starRating({
      timeLeft: timeFraction.value,
      mistakesOk: mistakes.value <= mistakeLimit.value,
      heartsLost: mistakes.value > mistakeLimit.value * 2 ? 2 : 0,
    })
    const reward = pip.completeLevel('memory', level.value, stars)
    const unlocked = reward.unlocked && reward.unlocked <= MEMORY_LEVELS.length ? reward.unlocked : null
    justUnlocked.value = unlocked
    results.value = {
      success: true,
      stars,
      petals: reward.petals,
      unlocked,
      allDone: reward.firstClear && level.value === MEMORY_LEVELS.length,
      title: stars === 3 ? 'Sharp as a thorn!' : stars === 2 ? 'Lovely matching!' : 'Just in time!',
      subtitle: stars < 3 ? `3 stars: ${mistakeLimit.value} or fewer wrong guesses, and time to spare.` : '',
    }
  } else {
    results.value = { success: false, stars: 0, petals: 0, title: 'Out of time', subtitle: `You found ${matches.value} of ${cfg.value.pairs} pairs.` }
  }
  setTimeout(() => (phase.value = 'done'), success ? 700 : 300)
}

// ---- playing ----
function flip(index) {
  const card = cards.value[index]
  if (phase.value !== 'playing' || locked.value || card.up || card.matched) return
  card.up = true
  flipped.value.push(index)
  playSound('flip')
  haptic('light')

  if (flipped.value.length < 2) return
  moves.value += 1
  const [a, b] = flipped.value.map((i) => cards.value[i])
  if (a.pair === b.pair) {
    a.matched = b.matched = true
    flipped.value = []
    matches.value += 1
    hinted.value = []
    setTimeout(() => playSound('match'), 140)
    if (matches.value === cfg.value.pairs) finish(true)
  } else {
    locked.value = true
    setTimeout(() => {
      playSound('miss')
      a.up = b.up = false
      flipped.value = []
      locked.value = false
    }, 750)
  }
}

function hint() {
  if (!canHint.value) return
  if (!pip.spendPetals(HINT_COST)) {
    noPetals.value = true
    setTimeout(() => (noPetals.value = false), 2200)
    playSound('miss')
    return
  }
  const open = flipped.value[0]
  const pair = open !== undefined ? cards.value[open].pair : shuffle(cards.value.filter((c) => !c.matched))[0]?.pair
  hintsUsed.value += 1
  hinted.value = cards.value.map((c, i) => (c.pair === pair && !c.matched ? i : -1)).filter((i) => i >= 0)
  playSound('hint')
  haptic('soft')
  setTimeout(() => (hinted.value = []), 1400)
}

function next() {
  justUnlocked.value = null
  pick(Math.min(level.value + 1, MEMORY_LEVELS.length))
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <GameShell title="Seed Memory" track="memory" @close="emit('close')">
    <template #stats>
      <template v-if="phase === 'playing' || phase === 'done'">
        <span class="chip tabular-nums" :class="{ 'bg-clay-100! text-clay-400!': timeLeft <= 10 }">
          <Icon name="timer" :size="14" :stroke="2.2" />{{ timeLabel }}
        </span>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Seed Memory"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <LevelHud
        :level="level"
        :total="MEMORY_LEVELS.length"
        :goal="`Find ${cfg.pairs} pairs`"
        :value="matches"
        :target="cfg.pairs"
      />
      <!-- time left -->
      <div class="flex items-center gap-2 px-5 pt-2.5">
        <Icon name="timer" :size="13" :stroke="2.2" :class="timeFraction > 0.25 ? 'text-bark-400' : 'text-clay-400'" />
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200">
          <div
            class="h-full rounded-full transition-[width] duration-100 ease-linear"
            :class="timeFraction > 0.25 ? 'bg-leaf-400' : 'bg-clay-300'"
            :style="{ width: `${timeFraction * 100}%` }"
          />
        </div>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center px-5 py-4">
        <div class="grid grid-cols-4 gap-2.5" :style="{ width: gridWidth }">
          <button
            v-for="(card, i) in cards"
            :key="card.key"
            type="button"
            data-sound="none"
            class="card-btn relative"
            :class="{ 'is-up': card.up || card.matched || hinted.includes(i), 'is-matched': card.matched, 'is-hinted': hinted.includes(i) }"
            :style="{ aspectRatio: aspect }"
            :aria-label="card.up || card.matched ? card.id : 'Hidden card'"
            @click="flip(i)"
          >
            <span class="card-inner absolute inset-0">
              <span class="card-face card-back absolute inset-0 flex items-center justify-center rounded-[0.9rem]">
                <svg viewBox="0 0 40 40" class="h-[42%] w-[42%]" aria-hidden="true">
                  <path d="M20 34 V20" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
                  <path d="M20 22 C16 14 8 14 7 18 C10 23 16 24 20 22Z" fill="#fff" opacity="0.8" />
                  <path d="M20 20 C24 12 32 12 33 16 C30 21 24 22 20 20Z" fill="#fff" />
                </svg>
              </span>
              <span class="card-face card-front absolute inset-0 rounded-[0.9rem] bg-surface p-[14%]">
                <ItemPreview :category="card.category" :id="card.id" />
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- hint -->
      <div v-if="phase === 'playing'" class="flex items-center justify-between gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <p class="text-sm font-semibold text-bark-400">
          <template v-if="noPetals">You need {{ HINT_COST }} petals for a hint.</template>
          <template v-else-if="hintsUsed >= MAX_HINTS">No hints left this round.</template>
          <template v-else>
            <span :class="{ 'text-clay-400': mistakes > mistakeLimit }">{{ mistakes }} wrong</span>
            <span class="text-bark-300"> · aim for {{ mistakeLimit }} or fewer</span>
          </template>
        </p>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          data-sound="none"
          :disabled="!canHint"
          @click="hint"
        >
          <Icon name="sparkle" :size="16" :stroke="2.2" class="text-honey-400" />
          Hint
          <span class="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-petal-100 px-2 py-0.5 text-xs font-extrabold text-petal-500">
            <PetalIcon :size="12" />{{ HINT_COST }}
          </span>
        </button>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="`Find ${cfg.pairs} pairs in ${cfg.time} seconds`"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#86AD72', text: 'Turn two cards over to find a match' },
          { color: '#E9B54F', text: `3 stars: time to spare and ${mistakeLimit} or fewer wrong guesses` },
          ...(cfg.similar ? [{ color: '#C97858', text: 'Careful: these cards look alike' }] : []),
          { color: '#E48C9C', text: `Stuck? Up to ${MAX_HINTS} hints, ${HINT_COST} petals each` },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" :label="`Level ${level}`" :goal="`Find ${cfg.pairs} pairs in ${cfg.time} seconds`" @done="start" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Wrong', value: mistakes },
          { label: 'Time left', value: results.success ? timeLabel : '0:00' },
        ]"
        :petals="results.petals"
        :has-next="level < MEMORY_LEVELS.length"
        :unlocked="results.unlocked"
        :all-done="results.allDone"
        has-levels
        @next="next"
        @again="begin"
        @levels="phase = 'levels'"
        @close="emit('close')"
      />
    </template>
  </GameShell>
</template>

<style scoped>
.card-btn {
  perspective: 700px;
}
.card-btn:active:not(.is-up) {
  transform: scale(0.95);
}
.card-inner {
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.4, 1);
}
.is-up .card-inner {
  transform: rotateY(180deg);
}
.card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: 1px solid var(--color-line);
  box-shadow: 0 4px 10px -6px rgb(58 45 35 / 0.3);
}
.card-back {
  background:
    radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.25), transparent 50%),
    linear-gradient(160deg, #9fc28c, #78a265);
  border-color: rgb(0 0 0 / 0.04);
}
.card-front {
  transform: rotateY(180deg);
}
.is-matched .card-front {
  border-color: #c7dcb8;
  box-shadow: 0 0 0 3px #e3eedb;
  animation: matched 0.5s ease-out 0.15s;
}
.is-hinted .card-front {
  border-color: #eac56f;
  box-shadow: 0 0 0 3px #f8e6b8, 0 0 18px #f3d68b;
}
@keyframes matched {
  0%, 100% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.08); }
}
</style>
