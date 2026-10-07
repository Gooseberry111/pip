<script setup>
// Bloom Puzzle: a picture of Pip in bloom is cut into tiles and shuffled. Slide the tiles
// back into place before the timer runs out. Tap any tile in line with the gap to slide.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { PUZZLE_LEVELS, HINT_COST, MAX_HINTS, starRating } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import LevelHud from './LevelHud.vue'
import Countdown from './Countdown.vue'
import PuzzlePicture from '../art/PuzzlePicture.vue'
import PetalIcon from '../PetalIcon.vue'
import Icon from '../Icon.vue'
import Celebration from '../Celebration.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const phase = ref('levels')
const level = ref(Math.min(pip.levelProgress('puzzle').unlocked, PUZZLE_LEVELS.length))
const tiles = ref([]) // tiles[position] = the tile that belongs at that position
const moves = ref(0)
const timeLeft = ref(0)
const peeking = ref(false)
const peeksUsed = ref(0)
const noPetals = ref(false)
const results = ref(null)
const justUnlocked = ref(null)
const burst = ref(0)

const cfg = computed(() => PUZZLE_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('puzzle'))
const levelList = computed(() => PUZZLE_LEVELS.map((l) => ({ goal: `${l.size}×${l.size} in ${formatTime(l.time)}` })))
const n = computed(() => cfg.value.size)
const blank = computed(() => n.value * n.value - 1)
const tileSize = computed(() => 300 / n.value)
const placed = computed(() => tiles.value.filter((t, i) => t === i && t !== blank.value).length)
const timeFraction = computed(() => (cfg.value ? timeLeft.value / cfg.value.time : 1))
const timeLabel = computed(() => formatTime(Math.ceil(timeLeft.value)))
const canPeek = computed(() => phase.value === 'playing' && !peeking.value && peeksUsed.value < MAX_HINTS)

let timer = null
let lastTick = 0

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ---- setup ----
function neighbours(pos) {
  const size = n.value
  const r = Math.floor(pos / size)
  const c = pos % size
  return [
    r > 0 && pos - size,
    r < size - 1 && pos + size,
    c > 0 && pos - 1,
    c < size - 1 && pos + 1,
  ].filter((p) => p !== false)
}

/** Shuffle by making random legal slides from the solved picture, so it's always solvable. */
function scramble() {
  const arr = Array.from({ length: n.value * n.value }, (_, i) => i)
  let empty = arr.length - 1
  let prev = -1
  for (let i = 0; i < cfg.value.scramble; i++) {
    const options = neighbours(empty).filter((p) => p !== prev)
    const next = options[Math.floor(Math.random() * options.length)]
    ;[arr[empty], arr[next]] = [arr[next], arr[empty]]
    prev = empty
    empty = next
  }
  // never start already solved
  if (arr.every((t, i) => t === i)) return scramble()
  return arr
}

function pick(lvl) {
  level.value = lvl
  tiles.value = scramble()
  // the how-to card only shows the first time; after that, straight to the countdown
  if (pip.introSeen.puzzle) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('puzzle')
  tiles.value = scramble()
  moves.value = 0
  peeksUsed.value = 0
  results.value = null
  timeLeft.value = cfg.value.time
  phase.value = 'countdown'
}

function start() {
  phase.value = 'playing'
  const t0 = performance.now()
  lastTick = Math.ceil(cfg.value.time)
  clearInterval(timer)
  timer = setInterval(() => {
    timeLeft.value = Math.max(0, cfg.value.time - (performance.now() - t0) / 1000)
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
  if (phase.value !== 'playing') return
  if (success) {
    phase.value = 'solved'
    burst.value += 1
    playSound('match')
    const stars = starRating({ timeLeft: timeFraction.value })
    const reward = pip.completeLevel('puzzle', level.value, stars)
    const unlocked = reward.unlocked && reward.unlocked <= PUZZLE_LEVELS.length ? reward.unlocked : null
    justUnlocked.value = unlocked
    results.value = {
      success: true,
      stars,
      petals: reward.petals,
      unlocked,
      allDone: reward.firstClear && level.value === PUZZLE_LEVELS.length,
      title: stars === 3 ? 'Picture perfect!' : stars === 2 ? 'All back in bloom!' : 'Just in time!',
      subtitle: stars < 3 ? 'For 3 stars, finish with at least 30% of the time left.' : '',
    }
    setTimeout(() => (phase.value = 'done'), 1300)
  } else {
    results.value = { success: false, stars: 0, petals: 0, title: 'Out of time', subtitle: `${placed.value} of ${blank.value} tiles were in place.` }
    phase.value = 'done'
  }
}

// ---- playing ----
function tap(pos) {
  if (phase.value !== 'playing') return
  const size = n.value
  const empty = tiles.value.indexOf(blank.value)
  const [er, ec] = [Math.floor(empty / size), empty % size]
  const [r, c] = [Math.floor(pos / size), pos % size]
  if (pos === empty || (r !== er && c !== ec)) {
    playSound('miss')
    return
  }
  // slide every tile between the tap and the gap one step toward the gap
  const step = r === er ? (c < ec ? -1 : 1) : c === ec ? (r < er ? -size : size) : 0
  const next = [...tiles.value]
  let at = empty
  while (at !== pos) {
    const from = at + step
    next[at] = next[from]
    at = from
  }
  next[pos] = blank.value
  tiles.value = next
  moves.value += 1
  playSound('flip')
  haptic('light')
  if (next.every((t, i) => t === i)) finish(true)
}

function peek() {
  if (!canPeek.value) return
  if (!pip.spendPetals(HINT_COST)) {
    noPetals.value = true
    setTimeout(() => (noPetals.value = false), 2200)
    playSound('miss')
    return
  }
  peeksUsed.value += 1
  peeking.value = true
  playSound('hint')
  setTimeout(() => (peeking.value = false), 1600)
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function tileStyle(tile) {
  const pos = tiles.value.indexOf(tile)
  const size = n.value
  return {
    width: `${100 / size}%`,
    height: `${100 / size}%`,
    transform: `translate(${(pos % size) * 100}%, ${Math.floor(pos / size) * 100}%)`,
  }
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <GameShell title="Bloom Puzzle" track="puzzle" @close="emit('close')">
    <template #stats>
      <span v-if="phase !== 'levels'" class="chip tabular-nums" :class="{ 'bg-clay-100! text-clay-400!': phase === 'playing' && timeLeft <= 15 }">
        <Icon name="timer" :size="14" :stroke="2.2" />{{ phase === 'intro' || phase === 'countdown' ? formatTime(cfg.time) : timeLabel }}
      </span>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Bloom Puzzle"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <LevelHud
        :level="level"
        :total="PUZZLE_LEVELS.length"
        goal="Tiles in place"
        :value="placed"
        :target="blank"
        color="var(--color-clay-300)"
      />
      <div class="flex items-center gap-2 px-5 pt-2.5">
        <Icon name="timer" :size="13" :stroke="2.2" :class="timeFraction > 0.3 ? 'text-bark-400' : 'text-clay-400'" />
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200">
          <div class="h-full rounded-full transition-[width] duration-100 ease-linear" :class="timeFraction > 0.3 ? 'bg-leaf-400' : 'bg-clay-300'" :style="{ width: `${timeFraction * 100}%` }" />
        </div>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center px-5 py-4">
        <div class="relative aspect-square w-[min(100%,calc(100dvh-330px))] max-w-[26rem]">
          <!-- the board -->
          <div class="board absolute inset-0 overflow-hidden rounded-[1.25rem] bg-sand-200 p-1 shadow-soft">
            <div class="relative h-full w-full">
              <button
                v-for="tile in tiles.filter((t) => t !== blank)"
                :key="tile"
                type="button"
                data-sound="none"
                class="tile absolute left-0 top-0 p-[1.5px]"
                :style="tileStyle(tile)"
                :aria-label="`Tile ${tile + 1}`"
                @pointerdown.prevent="tap(tiles.indexOf(tile))"
              >
                <span class="relative block h-full w-full overflow-hidden rounded-[0.55rem]" :class="{ 'is-home': tiles.indexOf(tile) === tile }">
                  <svg :viewBox="`${(tile % n) * tileSize} ${Math.floor(tile / n) * tileSize} ${tileSize} ${tileSize}`" class="block h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                    <PuzzlePicture :picture="cfg.picture" />
                  </svg>
                  <span
                    class="absolute left-1 top-0.5 font-display text-[0.6875rem] font-semibold text-white"
                    :class="cfg.numbers ? 'opacity-90' : 'opacity-40'"
                    style="text-shadow: 0 1px 2px rgb(0 0 0 / 0.45)"
                  >
                    {{ tile + 1 }}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <!-- peek at the finished picture -->
          <Transition name="fade">
            <svg v-if="peeking || phase === 'solved' || phase === 'done'" viewBox="0 0 300 300" class="pointer-events-none absolute inset-0 h-full w-full rounded-[1.25rem]" aria-hidden="true">
              <PuzzlePicture :picture="cfg.picture" />
            </svg>
          </Transition>
          <Celebration :trigger="burst" :count="26" :spread="170" />
        </div>
      </div>

      <div v-if="phase === 'playing'" class="flex items-center justify-between gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div class="flex items-center gap-3">
          <span class="h-12 w-12 overflow-hidden rounded-xl border border-line shadow-soft" aria-label="The finished picture">
            <svg viewBox="0 0 300 300" class="h-full w-full" aria-hidden="true"><PuzzlePicture :picture="cfg.picture" /></svg>
          </span>
          <p class="text-sm font-semibold text-bark-400">
            <template v-if="noPetals">You need {{ HINT_COST }} petals to peek.</template>
            <template v-else>{{ moves }} {{ moves === 1 ? 'move' : 'moves' }}</template>
          </p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-sound="none" :disabled="!canPeek" @click="peek">
          <Icon name="sparkle" :size="16" :stroke="2.2" class="text-honey-400" />
          Peek
          <span class="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-petal-100 px-2 py-0.5 text-xs font-extrabold text-petal-500">
            <PetalIcon :size="12" />{{ HINT_COST }}
          </span>
        </button>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="`Rebuild the picture in ${formatTime(cfg.time)}`"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#E09C7D', text: 'Tap a tile next to the gap to slide it' },
          { color: '#86AD72', text: 'Tap further along a row to slide several' },
          { color: '#E9B54F', text: '3 stars: finish with 30% of the time left' },
          { color: '#E48C9C', text: `Stuck? Peek at the picture (${MAX_HINTS} per round, ${HINT_COST} petals)` },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" :label="`Level ${level}`" :goal="`Rebuild the picture in ${formatTime(cfg.time)}`" @done="start" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Moves', value: moves },
          { label: 'Time left', value: results.success ? timeLabel : '0:00' },
        ]"
        :petals="results.petals"
        :has-next="level < PUZZLE_LEVELS.length"
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
.tile {
  transition: transform 0.14s cubic-bezier(0.3, 0.7, 0.4, 1);
  touch-action: none;
}
.tile > span {
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.35);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
