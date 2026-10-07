<script setup>
// Leaf Words: two word games in one.
//   Picture Words: four pictures share one word. Spell it with the letter tiles before
//   the clock runs out. Stuck? Spend petals to reveal a letter.
//   Word Search: drag across the letters to find the hidden words. Later levels hide
//   them diagonally and backwards.
import { computed, ref, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { PICTURE_LEVELS, PICTURE_TIMES, SEARCH_LEVELS, WORD_HINT_COST, makeSearch, letterBank } from '@/data/words'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import Countdown from './Countdown.vue'
import Icon from '../Icon.vue'
import PetalIcon from '../PetalIcon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const FOUND_COLORS = ['#F6C7CD', '#CFE5F1', '#F8E2A6', '#D8EDCD', '#E6D6F1', '#FBD9CC']

const game = ref(null) // pics | search
const phase = ref('menu') // menu | levels | intro | countdown | playing | done
const level = ref(1)
const timeLeft = ref(0)
const results = ref(null)
const justUnlocked = ref(null)

const key = computed(() => (game.value === 'pics' ? 'words' : 'search'))
const levelsData = computed(() => (game.value === 'pics' ? PICTURE_LEVELS : SEARCH_LEVELS))
const progress = computed(() => pip.levelProgress(key.value))
const totalTime = computed(() => (game.value === 'pics' ? PICTURE_TIMES[level.value - 1] : SEARCH_LEVELS[level.value - 1].time))
const levelList = computed(() =>
  game.value === 'pics'
    ? PICTURE_LEVELS.map((l, i) => {
        const min = Math.min(...l.map((p) => p.word.length))
        const max = Math.max(...l.map((p) => p.word.length))
        return { goal: `5 words of ${min === max ? min : `${min} to ${max}`} letters in ${PICTURE_TIMES[i]}s` }
      })
    : SEARCH_LEVELS.map((l) => ({ goal: `${l.title}: find ${l.words.length} words` })),
)
const goalText = computed(() => levelList.value[level.value - 1]?.goal ?? '')
const timeLabel = computed(() => {
  const s = Math.max(0, Math.ceil(timeLeft.value))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

function open(which) {
  game.value = which
  level.value = Math.min(pip.levelProgress(which === 'pics' ? 'words' : 'search').unlocked, (which === 'pics' ? PICTURE_LEVELS : SEARCH_LEVELS).length)
  phase.value = 'levels'
}

function pick(n) {
  level.value = n
  if (pip.introSeen[key.value]) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen(key.value)
  results.value = null
  if (game.value === 'pics') setupPics()
  else setupSearch()
  timeLeft.value = totalTime.value
  phase.value = 'countdown'
}

// ---- the clock ----
let clock = null
let endsAt = 0
function startClock() {
  phase.value = 'playing'
  endsAt = performance.now() + timeLeft.value * 1000
  clearInterval(clock)
  clock = setInterval(() => {
    timeLeft.value = Math.max(0, (endsAt - performance.now()) / 1000)
    if (timeLeft.value <= 0) finish(false)
  }, 100)
}
function stopClock() {
  clearInterval(clock)
  clock = null
}

// ================= Picture Words =================
const puzzleIndex = ref(0)
const slots = ref([]) // [{ letter, from, locked }]
const bank = ref([]) // [{ ch, used }]
const wrong = ref(0)
const hintsUsed = ref(0)
const shakeSlots = ref(false)
const solvedFlash = ref(false)
const noPetals = ref(false)

const puzzle = computed(() => PICTURE_LEVELS[level.value - 1]?.[puzzleIndex.value])

function setupPics() {
  puzzleIndex.value = 0
  wrong.value = 0
  hintsUsed.value = 0
  loadPuzzle()
}

function loadPuzzle() {
  const word = puzzle.value.word
  slots.value = word.split('').map(() => ({ letter: '', from: -1, locked: false }))
  bank.value = letterBank(word).map((ch) => ({ ch, used: false }))
  solvedFlash.value = false
}

function tapLetter(i) {
  if (phase.value !== 'playing' || solvedFlash.value) return
  const tile = bank.value[i]
  if (tile.used) return
  const slot = slots.value.findIndex((s) => !s.letter)
  if (slot < 0) return
  slots.value[slot] = { letter: tile.ch, from: i, locked: false }
  tile.used = true
  playSound('tap')
  haptic('light')
  if (slots.value.every((s) => s.letter)) check()
}

function tapSlot(i) {
  const s = slots.value[i]
  if (phase.value !== 'playing' || solvedFlash.value || !s.letter || s.locked) return
  bank.value[s.from].used = false
  slots.value[i] = { letter: '', from: -1, locked: false }
  playSound('toggleOff')
}

function check() {
  const guess = slots.value.map((s) => s.letter).join('')
  if (guess === puzzle.value.word) {
    solvedFlash.value = true
    playSound('match')
    haptic('success')
    setTimeout(() => {
      if (phase.value !== 'playing') return
      if (puzzleIndex.value === PICTURE_LEVELS[level.value - 1].length - 1) return finish(true)
      puzzleIndex.value += 1
      loadPuzzle()
    }, 900)
  } else {
    wrong.value += 1
    shakeSlots.value = true
    playSound('oops')
    haptic('error')
    setTimeout(() => {
      shakeSlots.value = false
      slots.value.forEach((s, i) => {
        if (s.locked || !s.letter) return
        bank.value[s.from].used = false
        slots.value[i] = { letter: '', from: -1, locked: false }
      })
    }, 550)
  }
}

function hint() {
  if (phase.value !== 'playing' || solvedFlash.value) return
  const word = puzzle.value.word
  const i = slots.value.findIndex((s, j) => !s.locked && s.letter !== word[j])
  if (i < 0) return
  if (!pip.spendPetals(WORD_HINT_COST)) {
    noPetals.value = true
    playSound('miss')
    setTimeout(() => (noPetals.value = false), 2000)
    return
  }
  hintsUsed.value += 1
  // free the slot, then find a tile with the right letter (taking it back from another slot if needed)
  const s = slots.value[i]
  if (s.letter) bank.value[s.from].used = false
  let from = bank.value.findIndex((t) => !t.used && t.ch === word[i])
  if (from < 0) {
    const j = slots.value.findIndex((x, k) => !x.locked && k !== i && x.letter === word[i])
    from = slots.value[j].from
    slots.value[j] = { letter: '', from: -1, locked: false }
  }
  bank.value[from].used = true
  slots.value[i] = { letter: word[i], from, locked: true }
  playSound('hint')
  haptic('soft')
  if (slots.value.every((x) => x.letter)) check()
}

// ================= Word Search =================
const board = ref([])
const placed = ref([])
const found = ref([]) // [{ word, cells, color }]
const drag = ref(null) // { from: [r, c], to: [r, c] }
const gridEl = ref(null)
const cellSize = ref(36)

const searchCfg = computed(() => SEARCH_LEVELS[level.value - 1])
const dragCells = computed(() => (drag.value ? lineCells(drag.value.from, drag.value.to) : []))

function setupSearch() {
  const made = makeSearch(searchCfg.value)
  board.value = made.grid
  placed.value = made.placed
  found.value = []
  drag.value = null
  nextTick(measure)
}

function measure() {
  const w = gridEl.value?.parentElement?.clientWidth ?? 340
  cellSize.value = Math.floor(Math.min(46, (w - 8) / searchCfg.value.size))
}

function lineCells([r0, c0], [r1, c1]) {
  const dr = Math.sign(r1 - r0)
  const dc = Math.sign(c1 - c0)
  const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0))
  // only straight lines and true diagonals
  if (dr && dc && Math.abs(r1 - r0) !== Math.abs(c1 - c0)) {
    // snap to the nearest straight or diagonal line
    const ar = Math.abs(r1 - r0)
    const ac = Math.abs(c1 - c0)
    if (ar > ac * 2) return lineCells([r0, c0], [r1, c0])
    if (ac > ar * 2) return lineCells([r0, c0], [r0, c1])
    const n = Math.min(ar, ac)
    return lineCells([r0, c0], [r0 + dr * n, c0 + dc * n])
  }
  return Array.from({ length: len + 1 }, (_, i) => [r0 + dr * i, c0 + dc * i])
}

function cellFrom(e) {
  const rect = gridEl.value.getBoundingClientRect()
  const n = searchCfg.value.size
  const c = Math.min(n - 1, Math.max(0, Math.floor((e.clientX - rect.left) / cellSize.value)))
  const r = Math.min(n - 1, Math.max(0, Math.floor((e.clientY - rect.top) / cellSize.value)))
  return [r, c]
}

function onDown(e) {
  if (phase.value !== 'playing') return
  const at = cellFrom(e)
  drag.value = { from: at, to: at }
  gridEl.value.setPointerCapture?.(e.pointerId)
  playSound('tap')
}

function onMove(e) {
  if (!drag.value) return
  const at = cellFrom(e)
  if (at[0] !== drag.value.to[0] || at[1] !== drag.value.to[1]) {
    drag.value = { ...drag.value, to: at }
    haptic('light')
  }
}

function onUp() {
  if (!drag.value) return
  const cells = dragCells.value
  drag.value = null
  if (cells.length < 2) return
  const word = cells.map(([r, c]) => board.value[r][c]).join('')
  const same = (a, b) => a.length === b.length && a.every(([r, c], i) => r === b[i][0] && c === b[i][1])
  const match = placed.value.find(
    (p) => !found.value.some((f) => f.word === p.word) && (same(p.cells, cells) || same(p.cells, [...cells].reverse()) || p.word === word),
  )
  if (!match) {
    playSound('miss')
    return
  }
  found.value = [...found.value, { word: match.word, cells: match.cells, color: FOUND_COLORS[found.value.length % FOUND_COLORS.length] }]
  playSound('match')
  haptic('success')
  if (found.value.length === placed.value.length) setTimeout(() => finish(true), 500)
}

function capsule(cells, pad = 0.42) {
  const [r0, c0] = cells[0]
  const [r1, c1] = cells[cells.length - 1]
  const s = cellSize.value
  return {
    x1: (c0 + 0.5) * s,
    y1: (r0 + 0.5) * s,
    x2: (c1 + 0.5) * s,
    y2: (r1 + 0.5) * s,
    w: s * pad * 2,
  }
}

const isFound = (w) => found.value.some((f) => f.word === w)

// ================= finishing =================
function finish(success) {
  if (phase.value !== 'playing') return
  stopClock()
  phase.value = 'done'
  const frac = timeLeft.value / totalTime.value
  if (!success) {
    results.value = {
      success: false,
      title: 'Out of time',
      subtitle:
        game.value === 'pics'
          ? `You solved ${puzzleIndex.value} of 5 words.`
          : `You found ${found.value.length} of ${placed.value.length} words.`,
    }
    playSound('lose')
    return
  }
  let stars
  let tip
  if (game.value === 'pics') {
    stars = hintsUsed.value === 0 && wrong.value <= 1 && frac >= 0.3 ? 3 : hintsUsed.value <= 1 && frac >= 0.1 ? 2 : 1
    tip = '3 stars: no hints, one wrong guess at most, and time to spare.'
  } else {
    stars = frac >= 0.4 ? 3 : frac >= 0.15 ? 2 : 1
    tip = '3 stars: find them all with 40% of the time left.'
  }
  const reward = pip.completeLevel(key.value, level.value, stars)
  const max = levelsData.value.length
  const unlocked = reward.unlocked && reward.unlocked <= max ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === max,
    title: stars === 3 ? 'Word wizard!' : stars === 2 ? 'Well spotted!' : 'Got them all!',
    subtitle: stars < 3 ? tip : '',
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function back() {
  stopClock()
  phase.value = 'levels'
}

onBeforeUnmount(stopClock)
</script>

<template>
  <GameShell
    title="Leaf Words"
    track="memory"
    :hide-title="phase === 'playing'"
    background="linear-gradient(180deg, #EEF3E6 0%, #F6EFE4 100%)"
    @close="emit('close')"
  >
    <template #stats>
      <span v-if="['countdown', 'playing', 'done'].includes(phase)" class="chip tabular-nums" :class="{ 'bg-clay-100! text-clay-400!': phase === 'playing' && timeLeft <= 15 }">
        <Icon name="timer" :size="14" :stroke="2.2" />{{ timeLabel }}
      </span>
    </template>

    <!-- choose a word game -->
    <div v-if="phase === 'menu'" class="flex flex-1 flex-col justify-center gap-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <button type="button" class="menu-card" data-sound="select" @click="open('pics')">
        <span class="grid grid-cols-4 gap-1.5 text-2xl leading-none">
          <span v-for="p in ['🌧️', '☔', '💧', '🌈']" :key="p" class="flex h-11 w-11 items-center justify-center rounded-xl bg-cream">{{ p }}</span>
        </span>
        <span class="mt-3 font-display text-xl font-semibold text-bark-600">Picture Words</span>
        <span class="text-sm font-semibold text-bark-400">Four pictures, one word. Can you spell it?</span>
        <span class="chip mt-2">{{ pip.totalStars('words') }} / {{ PICTURE_LEVELS.length * 3 }} stars</span>
      </button>
      <button type="button" class="menu-card" data-sound="select" @click="open('search')">
        <span class="grid grid-cols-6 gap-1 font-display text-base font-semibold text-bark-500">
          <span v-for="(l, i) in 'LEAFRSOMSEEDTUBIRK'.split('')" :key="i" class="flex h-6 w-6 items-center justify-center rounded-md" :class="i < 4 || (i >= 8 && i <= 11) ? 'bg-leaf-200/80' : 'bg-cream'">
            {{ l }}
          </span>
        </span>
        <span class="mt-3 font-display text-xl font-semibold text-bark-600">Word Search</span>
        <span class="text-sm font-semibold text-bark-400">Find the words hiding in the leaves</span>
        <span class="chip mt-2">{{ pip.totalStars('search') }} / {{ SEARCH_LEVELS.length * 3 }} stars</span>
      </button>
    </div>

    <template v-else>
      <LevelSelect
        v-if="phase === 'levels'"
        :key="game"
        :levels="levelList"
        :progress="progress"
        :celebrate="justUnlocked"
        :heading="game === 'pics' ? 'Picture Words' : 'Word Search'"
        @select="pick"
        @help="phase = 'intro'"
        @celebrated="justUnlocked = null"
      />

      <!-- Picture Words -->
      <div v-else-if="game === 'pics'" class="flex flex-1 flex-col items-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div class="flex w-full max-w-sm items-center gap-2.5">
          <span class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-bark-600 px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#FFFAF2]">
            Level {{ level }}
          </span>
          <span class="flex flex-1 gap-1">
            <i v-for="n in 5" :key="n" class="h-1.5 flex-1 rounded-full" :class="n - 1 < puzzleIndex ? 'bg-leaf-400' : n - 1 === puzzleIndex ? 'bg-honey-400' : 'bg-sand-200'" />
          </span>
          <span class="text-[0.8125rem] font-extrabold tabular-nums text-bark-500">{{ puzzleIndex + 1 }} / 5</span>
        </div>

        <div v-if="puzzle" :key="puzzle.word" class="pics mt-4 grid w-full max-w-[17rem] grid-cols-2 gap-2.5">
          <div v-for="(p, i) in puzzle.pics" :key="i" class="pic flex aspect-square items-center justify-center rounded-[1.25rem] bg-surface text-[3.2rem] shadow-soft" :style="{ animationDelay: `${i * 70}ms` }">
            {{ p }}
          </div>
        </div>

        <div class="mt-5 flex flex-wrap justify-center gap-1.5" :class="{ shake: shakeSlots, solved: solvedFlash }">
          <button
            v-for="(s, i) in slots"
            :key="i"
            type="button"
            data-sound="none"
            class="slot flex items-center justify-center font-display text-2xl font-semibold"
            :class="{ 'is-filled': s.letter, 'is-locked': s.locked }"
            :style="{ width: slots.length > 9 ? '1.85rem' : slots.length > 7 ? '2.15rem' : '2.5rem' }"
            @click="tapSlot(i)"
          >
            {{ s.letter }}
          </button>
        </div>

        <div class="mt-5 grid w-full max-w-sm gap-1.5" :style="{ gridTemplateColumns: `repeat(${Math.ceil(bank.length / 2)}, minmax(0, 1fr))` }">
          <button
            v-for="(t, i) in bank"
            :key="i"
            type="button"
            data-sound="none"
            class="tile flex aspect-square items-center justify-center font-display text-xl font-semibold"
            :class="{ 'is-used': t.used }"
            :disabled="t.used"
            @click="tapLetter(i)"
          >
            {{ t.ch }}
          </button>
        </div>

        <div class="mt-auto flex flex-col items-center gap-1 pt-4">
          <button type="button" class="btn btn-secondary btn-sm gap-1.5!" @click="hint">
            Reveal a letter <PetalIcon :size="15" /> {{ WORD_HINT_COST }}
          </button>
          <p v-if="noPetals" class="text-xs font-semibold text-clay-400">Not enough petals. Play other games to earn more.</p>
        </div>
      </div>

      <!-- Word Search -->
      <div v-else class="flex flex-1 flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div class="flex w-full items-center gap-2.5">
          <span class="inline-flex h-6 shrink-0 items-center rounded-full bg-bark-600 px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#FFFAF2]">
            Level {{ level }}
          </span>
          <span class="flex-1 truncate text-[0.8125rem] font-bold text-bark-500">{{ searchCfg.title }}</span>
          <span class="text-[0.8125rem] font-extrabold tabular-nums text-bark-600">{{ found.length }} / {{ placed.length }}</span>
        </div>

        <div class="mt-3 flex w-full justify-center">
          <div
            ref="gridEl"
            class="search relative touch-none select-none"
            :style="{ width: `${cellSize * searchCfg.size}px`, height: `${cellSize * searchCfg.size}px` }"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="drag = null"
          >
            <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <line
                v-for="f in found"
                :key="f.word"
                v-bind="{ x1: capsule(f.cells).x1, y1: capsule(f.cells).y1, x2: capsule(f.cells).x2, y2: capsule(f.cells).y2 }"
                :stroke="f.color"
                :stroke-width="capsule(f.cells).w"
                stroke-linecap="round"
                class="found-line"
              />
              <line
                v-if="dragCells.length"
                v-bind="{ x1: capsule(dragCells).x1, y1: capsule(dragCells).y1, x2: capsule(dragCells).x2, y2: capsule(dragCells).y2 }"
                stroke="rgba(242, 198, 107, 0.6)"
                :stroke-width="capsule(dragCells).w"
                stroke-linecap="round"
              />
            </svg>
            <template v-for="(row, r) in board" :key="r">
              <span
                v-for="(ch, c) in row"
                :key="`${r}-${c}`"
                class="absolute flex items-center justify-center font-display font-semibold text-bark-600"
                :style="{ left: `${c * cellSize}px`, top: `${r * cellSize}px`, width: `${cellSize}px`, height: `${cellSize}px`, fontSize: `${cellSize * 0.5}px` }"
              >
                {{ ch }}
              </span>
            </template>
          </div>
        </div>

        <div class="mt-4 flex max-w-sm flex-wrap justify-center gap-1.5">
          <span
            v-for="p in placed"
            :key="p.word"
            class="rounded-full px-3 py-1 text-xs font-extrabold tracking-wide transition"
            :class="isFound(p.word) ? 'bg-leaf-200 text-leaf-500 line-through' : 'bg-surface text-bark-500 shadow-soft'"
          >
            {{ p.word }}
          </span>
        </div>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="goalText"
        :stars="progress.stars[level] ?? 0"
        :tips="
          game === 'pics'
            ? [
                { color: '#E48C9C', text: 'All four pictures share one word' },
                { color: '#F2C66B', text: 'Tap letters to spell it, tap a box to take one back' },
                { color: '#86AD72', text: `Stuck? Reveal a letter for ${WORD_HINT_COST} petals` },
                { color: '#7CB3D6', text: '3 stars: no hints, one wrong guess at most' },
              ]
            : [
                { color: '#86AD72', text: 'Drag across the letters to circle a word' },
                { color: '#F2C66B', text: 'Words run across, down, and later diagonally and backwards' },
                { color: '#E48C9C', text: '3 stars: find them all with 40% of the time left' },
              ]
        "
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" :label="`Level ${level}`" :goal="goalText" @done="startClock" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`${game === 'pics' ? 'Picture Words' : 'Word Search'} · Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="
          game === 'pics'
            ? [
                { label: 'Words', value: `${results.success ? 5 : puzzleIndex}/5` },
                { label: 'Wrong', value: wrong },
                { label: 'Hints', value: hintsUsed },
              ]
            : [
                { label: 'Found', value: `${found.length}/${placed.length}` },
                { label: 'Time left', value: timeLabel },
              ]
        "
        :petals="results.petals"
        :has-next="level < levelsData.length"
        :unlocked="results.unlocked"
        :all-done="results.allDone"
        has-levels
        @next="nextLevel"
        @again="begin"
        @levels="back"
        @close="emit('close')"
      />
    </template>

    <button
      v-if="phase === 'levels'"
      type="button"
      class="btn btn-ghost btn-sm mx-auto mb-[max(0.75rem,env(safe-area-inset-bottom))]"
      @click="phase = 'menu'"
    >
      Other word game
    </button>
  </GameShell>
</template>

<style scoped>
.menu-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.1rem 1.2rem;
  border-radius: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-soft);
  text-align: left;
  transition: transform 0.15s ease;
}
.menu-card:active {
  transform: scale(0.98);
}
.pic {
  animation: pic-in 0.45s cubic-bezier(0.3, 1.5, 0.5, 1) both;
}
@keyframes pic-in {
  from { opacity: 0; transform: scale(0.7) rotate(-6deg); }
  to { opacity: 1; transform: none; }
}
.slot {
  height: 2.9rem;
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 0.6);
  border: 2px dashed var(--color-sand-300);
  color: var(--color-bark-600);
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.slot.is-filled {
  background: var(--color-surface);
  border-style: solid;
  border-color: var(--color-line);
  box-shadow: var(--shadow-soft);
}
.slot.is-locked {
  background: var(--color-honey-100);
  border-color: var(--color-honey-400);
}
.solved .slot {
  background: var(--color-leaf-200);
  border-color: var(--color-leaf-400);
  animation: hop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
.solved .slot:nth-child(2) { animation-delay: 0.04s; }
.solved .slot:nth-child(3) { animation-delay: 0.08s; }
.solved .slot:nth-child(4) { animation-delay: 0.12s; }
.solved .slot:nth-child(5) { animation-delay: 0.16s; }
.solved .slot:nth-child(6) { animation-delay: 0.2s; }
.solved .slot:nth-child(7) { animation-delay: 0.24s; }
.solved .slot:nth-child(8) { animation-delay: 0.28s; }
.solved .slot:nth-child(9) { animation-delay: 0.32s; }
@keyframes hop {
  40% { transform: translateY(-8px); }
}
.shake {
  animation: shake 0.45s ease;
}
@keyframes shake {
  20%, 60% { transform: translateX(-7px); }
  40%, 80% { transform: translateX(7px); }
}
.tile {
  border-radius: 0.8rem;
  background: linear-gradient(180deg, #FFFDF8 0%, #F6EDDD 100%);
  box-shadow: inset 0 -3px 0 rgb(120 90 60 / 0.14), 0 3px 8px -5px rgb(58 45 35 / 0.5);
  color: var(--color-bark-600);
  transition: transform 0.12s ease, opacity 0.2s ease;
}
.tile:active {
  transform: scale(0.92);
}
.tile.is-used {
  opacity: 0.18;
  box-shadow: none;
}
.search {
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft), 0 0 0 6px var(--color-surface);
}
.found-line {
  animation: draw 0.35s ease-out both;
}
@keyframes draw {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
