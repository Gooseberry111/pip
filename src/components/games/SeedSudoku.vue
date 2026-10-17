<script setup>
// Seed Sudoku: every row, column and box holds each seed once. Pick a square, then a seed.
// Notes mode jots small reminders. Three mistakes and the seeds wilt.
import { computed, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { SUDOKU_LEVELS } from '@/data/games'
import { makeSudoku, boxOf, peers } from '@/utils/sudokuEngine'
import { buildBoard } from '@/utils/buildAsync'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import GoodIcon from '../farm/GoodIcon.vue'
import Icon from '../Icon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const SEEDS = ['wheat', 'carrot', 'tomato', 'corn', 'strawberry', 'pumpkin', 'sunflower', 'blueberry', 'potato']
const NAMES = { wheat: 'Wheat', carrot: 'Carrot', tomato: 'Tomato', corn: 'Corn', strawberry: 'Strawberry', pumpkin: 'Pumpkin', sunflower: 'Sunflower', blueberry: 'Blueberry', potato: 'Potato' }
const MAX_MISTAKES = 3
const MAX_HINTS = 3

const phase = ref('levels') // levels | intro | building | playing | done
const level = ref(Math.min(pip.levelProgress('sudoku').unlocked, SUDOKU_LEVELS.length))
const grid = ref([])
const given = ref([])
const solution = ref([])
const notes = ref([]) // per cell, a Set of seeds
const selected = ref(-1)
const notesMode = ref(false)
const mistakes = ref(0)
const hints = ref(0)
const wrong = ref(-1)
const popped = ref(new Set())
const results = ref(null)
const justUnlocked = ref(null)
const startedAt = ref(0)
const showNumbers = ref(false)

const cfg = computed(() => SUDOKU_LEVELS[level.value - 1])
const n = computed(() => cfg.value.size)
const progress = computed(() => pip.levelProgress('sudoku'))
const levelList = computed(() => SUDOKU_LEVELS.map((l) => ({ goal: `${l.size} by ${l.size} garden, ${l.givens} seeds to start` })))
const box = computed(() => boxOf(n.value))
const left = computed(() => grid.value.filter((v) => !v).length)
const remaining = computed(() => {
  const out = Array(n.value + 1).fill(n.value)
  for (const v of grid.value) if (v) out[v]--
  return out
})
const selectedValue = computed(() => (selected.value >= 0 ? grid.value[selected.value] : 0))
const peerSet = computed(() => (selected.value >= 0 ? new Set(peers(n.value)[selected.value]) : new Set()))

function pick(l) {
  level.value = l
  if (pip.introSeen.sudoku) begin()
  else phase.value = 'intro'
}

async function begin() {
  pip.markIntroSeen('sudoku')
  const c = cfg.value
  let p
  if (c.made) {
    grid.value = []
    phase.value = 'building'
    const n = level.value
    p = await buildBoard(`sudoku:${n}`, 'sudoku', { size: c.size, givens: c.givens, seed: c.seed })
    if (level.value !== n || phase.value !== 'building') return
  } else p = makeSudoku(c.size, c.givens, c.seed)
  grid.value = p.puzzle.slice()
  given.value = p.puzzle.map((v) => v > 0)
  solution.value = p.solution
  notes.value = p.puzzle.map(() => new Set())
  selected.value = grid.value.findIndex((v) => !v)
  mistakes.value = 0
  hints.value = 0
  notesMode.value = false
  popped.value = new Set()
  results.value = null
  startedAt.value = Date.now()
  phase.value = 'playing'
}

function choose(i) {
  if (phase.value !== 'playing') return
  selected.value = i
  haptic('light')
}

function clearNotes(i, v) {
  for (const j of peers(n.value)[i]) notes.value[j].delete(v)
  notes.value[i].clear()
}

function enter(v) {
  const i = selected.value
  if (phase.value !== 'playing' || i < 0 || given.value[i] || grid.value[i] === solution.value[i]) return
  if (notesMode.value) {
    const set = notes.value[i]
    if (set.has(v)) set.delete(v)
    else set.add(v)
    notes.value = [...notes.value]
    playSound('tap')
    return
  }
  if (solution.value[i] !== v) {
    mistakes.value += 1
    wrong.value = i
    playSound('oops')
    haptic('error')
    setTimeout(() => (wrong.value = -1), 450)
    if (mistakes.value >= MAX_MISTAKES) setTimeout(() => finish(false), 500)
    return
  }
  place(i, v)
}

function place(i, v) {
  const next = grid.value.slice()
  next[i] = v
  grid.value = next
  clearNotes(i, v)
  notes.value = [...notes.value]
  popped.value = new Set([i])
  playSound('place', true, { high: true })
  haptic('light')
  // a whole row, column or box done gets a little flourish
  const done = completedGroups(i)
  if (done.length) {
    popped.value = new Set(done.flat())
    setTimeout(() => playSound('match'), 120)
  }
  if (!left.value) setTimeout(() => finish(true), 600)
  else if (remaining.value[v] === 0) {
    // that seed is all planted: move on to an empty square
    selected.value = grid.value.findIndex((x) => !x)
  }
}

function completedGroups(i) {
  const size = n.value
  const r = Math.floor(i / size)
  const c = i % size
  const { br, bc } = box.value
  const row = Array.from({ length: size }, (_, k) => r * size + k)
  const col = Array.from({ length: size }, (_, k) => k * size + c)
  const r0 = Math.floor(r / br) * br
  const c0 = Math.floor(c / bc) * bc
  const bx = []
  for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) bx.push(y * size + x)
  return [row, col, bx].filter((g) => g.every((k) => grid.value[k]))
}

function erase() {
  const i = selected.value
  if (i < 0 || given.value[i] || grid.value[i]) return
  notes.value[i].clear()
  notes.value = [...notes.value]
  playSound('toggleOff')
}

function hint() {
  if (hints.value >= MAX_HINTS || phase.value !== 'playing') return
  let i = selected.value
  if (i < 0 || grid.value[i]) i = grid.value.findIndex((v) => !v)
  if (i < 0) return
  hints.value += 1
  selected.value = i
  playSound('hint')
  place(i, solution.value[i])
}

function finish(won) {
  if (phase.value !== 'playing') return
  phase.value = 'done'
  const mins = Math.max(1, Math.round((Date.now() - startedAt.value) / 60000))
  if (!won) {
    results.value = { success: false, stars: 0, petals: 0, title: 'The seeds wilted', subtitle: 'Three mistakes. Notes mode helps on the tricky ones.', mins }
    return
  }
  const slips = mistakes.value + hints.value
  const stars = slips === 0 ? 3 : slips <= 2 ? 2 : 1
  const reward = pip.completeLevel('sudoku', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= SUDOKU_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === SUDOKU_LEVELS.length,
    title: stars === 3 ? 'Perfect planting!' : 'Garden complete!',
    subtitle: stars < 3 ? '3 stars: no mistakes and no hints.' : `Solved in about ${mins} ${mins === 1 ? 'minute' : 'minutes'}.`,
    mins,
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function cellClass(i) {
  const size = n.value
  const r = Math.floor(i / size)
  const c = i % size
  const { br, bc } = box.value
  return {
    'is-given': given.value[i],
    'is-selected': selected.value === i,
    'is-peer': peerSet.value.has(i),
    'is-same': selectedValue.value && grid.value[i] === selectedValue.value && selected.value !== i,
    'is-wrong': wrong.value === i,
    'is-pop': popped.value.has(i),
    'edge-r': c % bc === bc - 1 && c < size - 1,
    'edge-b': r % br === br - 1 && r < size - 1,
  }
}

function onKey(e) {
  if (phase.value !== 'playing') return
  const size = n.value
  const num = Number(e.key)
  if (num >= 1 && num <= size) enter(num)
  else if (e.key === 'Backspace' || e.key === 'Delete') erase()
  else if (e.key.startsWith('Arrow') && selected.value >= 0) {
    const d = { ArrowUp: -size, ArrowDown: size, ArrowLeft: -1, ArrowRight: 1 }[e.key]
    selected.value = Math.max(0, Math.min(size * size - 1, selected.value + d))
    e.preventDefault()
  } else if (e.key === 'n') notesMode.value = !notesMode.value
}
</script>

<template>
  <GameShell title="Seed Sudoku" track="puzzle" :hide-title="phase === 'playing'" background="linear-gradient(180deg, #F3EDE2 0%, #E8EFE0 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase === 'playing'">
        <span class="flex items-center gap-0.5" :aria-label="`${MAX_MISTAKES - mistakes} mistakes left`">
          <span v-for="k in MAX_MISTAKES" :key="k" class="text-base" :class="k <= MAX_MISTAKES - mistakes ? '' : 'opacity-25 grayscale'">🌱</span>
        </span>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Seed Sudoku"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <div class="px-5 pt-1">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-bark-600 px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#FFFAF2]">
            Level {{ level }}
          </span>
          <span class="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-bark-500">Each seed once per row, column and box</span>
          <span class="shrink-0 text-[0.8125rem] font-extrabold tabular-nums text-bark-600">{{ left }} left</span>
        </div>
      </div>

      <div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" tabindex="0" @keydown="onKey">
        <div class="board" :style="{ '--n': n }" role="grid" aria-label="Sudoku board">
          <button
            v-for="(v, i) in grid"
            :key="i"
            type="button"
            class="cell"
            :class="cellClass(i)"
            data-sound="none"
            :aria-label="`Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}: ${v ? NAMES[SEEDS[v - 1]] : 'empty'}`"
            @click="choose(i)"
          >
            <GoodIcon v-if="v" :id="SEEDS[v - 1]" :size="n === 9 ? 24 : n === 6 ? 32 : 44" />
            <span v-else-if="notes[i]?.size" class="notes" :style="{ '--box': box.bc }">
              <span v-for="k in n" :key="k" class="note">
                <GoodIcon v-if="notes[i].has(k)" :id="SEEDS[k - 1]" :size="n === 9 ? 9 : 12" />
              </span>
            </span>
            <span v-if="showNumbers && v" class="num">{{ v }}</span>
          </button>
        </div>

        <!-- the seed palette -->
        <div class="flex w-full max-w-md flex-wrap justify-center gap-1.5">
          <button
            v-for="k in n"
            :key="k"
            type="button"
            class="seed"
            :class="{ 'is-out': remaining[k] === 0, 'is-notes': notesMode }"
            :disabled="remaining[k] === 0"
            data-sound="none"
            :aria-label="NAMES[SEEDS[k - 1]]"
            @click="enter(k)"
          >
            <GoodIcon :id="SEEDS[k - 1]" :size="n === 9 ? 26 : 30" />
            <span class="count">{{ showNumbers ? k : remaining[k] }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" class="tool" :class="{ 'is-on': notesMode }" :aria-pressed="notesMode" @click="notesMode = !notesMode">
            <Icon name="pencil" :size="16" :stroke="2.2" /> Notes {{ notesMode ? 'on' : 'off' }}
          </button>
          <button type="button" class="tool" @click="erase"><Icon name="close" :size="15" :stroke="2.4" /> Clear</button>
          <button type="button" class="tool" :disabled="hints >= MAX_HINTS" @click="hint"><Icon name="sparkle" :size="15" :stroke="2.2" /> Hint {{ MAX_HINTS - hints }}</button>
          <button type="button" class="tool" :aria-pressed="showNumbers" @click="showNumbers = !showNumbers">1 2 3</button>
        </div>
      </div>

      <div v-if="phase === 'building'" class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-center">
        <span class="building-dot" />
        <p class="font-display text-lg font-semibold text-bark-600">Planting the seeds…</p>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#86AD72', text: 'Every row, column and box has each seed once' },
          { color: '#F2C66B', text: 'Tap a square, then tap a seed to plant it' },
          { color: '#7CB3D6', text: 'Notes mode jots small reminders in a square' },
          { color: '#D9533F', text: 'Three wrong seeds and the garden wilts' },
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
          { label: 'Mistakes', value: mistakes },
          { label: 'Hints', value: hints },
          { label: 'Minutes', value: results.mins },
        ]"
        :petals="results.petals"
        :has-next="results.success && level < SUDOKU_LEVELS.length"
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
.building-dot {
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 999px;
  border: 4px solid var(--color-sand-200);
  border-top-color: var(--color-leaf-400);
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.board {
  display: grid;
  grid-template-columns: repeat(var(--n), 1fr);
  width: min(100%, 26rem, calc(100dvh - 22rem));
  min-width: 15rem;
  aspect-ratio: 1;
  padding: 4px;
  border-radius: 1.1rem;
  background: #8b6a4f;
  box-shadow: 0 14px 30px -18px rgb(58 45 35 / 0.8);
  gap: 2px;
}
.cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #fbf6ec;
  transition: background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.cell.edge-r {
  margin-right: 3px;
}
.cell.edge-b {
  margin-bottom: 3px;
}
.cell.is-given {
  background: #ecdfca;
}
.cell.is-peer {
  background: #f3ead9;
}
.cell.is-given.is-peer {
  background: #e4d5bc;
}
.cell.is-same {
  background: #e3ecd7;
}
.cell.is-selected {
  background: #fbe7a8;
  box-shadow: inset 0 0 0 2px #e9b54f;
}
.cell.is-wrong {
  background: #f6c9bf;
  animation: shake 0.4s ease;
}
.cell.is-pop :deep(svg) {
  animation: pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes pop {
  0% { transform: scale(0.4); }
  100% { transform: scale(1); }
}
@keyframes shake {
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
.notes {
  display: grid;
  grid-template-columns: repeat(var(--box), 1fr);
  width: 92%;
  height: 92%;
  place-items: center;
}
.num {
  position: absolute;
  right: 3px;
  bottom: 1px;
  font-size: 0.55rem;
  font-weight: 800;
  color: var(--color-bark-400);
}
.seed {
  position: relative;
  display: flex;
  height: 3.1rem;
  width: 3.1rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-soft);
  transition: transform 0.12s ease, opacity 0.2s ease;
}
.seed:active {
  transform: scale(0.92);
}
.seed.is-notes {
  border-style: dashed;
  border-color: var(--color-water-400);
}
.seed.is-out {
  opacity: 0.3;
}
.count {
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 0.625rem;
  font-weight: 800;
  color: var(--color-bark-400);
}
.tool {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 2.25rem;
  padding: 0 0.8rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-bark-600);
}
.tool.is-on {
  background: var(--color-water-100);
  border-color: var(--color-water-400);
}
.tool:disabled {
  opacity: 0.45;
}
</style>
