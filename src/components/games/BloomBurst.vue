<script setup>
// Bloom Burst: swap neighbouring flowers to make lines of three or more.
// 4 in a line makes a watering can that sweeps its line, an L or T makes a bee that
// clears around it, and 5 in a line makes a rainbow seed. Swap two specials together
// for something bigger. Each level has a goal and a set number of moves.
import { computed, reactive, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { BURST_LEVELS, BURST_TYPES, burstGoalText } from '@/data/games'
import * as E from '@/utils/burstEngine'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import StarRow from './StarRow.vue'
import PetalIcon from '../PetalIcon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const EXTRA_MOVES = 5
const EXTRA_COST = 12

const phase = ref('levels') // levels | intro | playing | outOfMoves | bonus | done
const level = ref(Math.min(pip.levelProgress('burst').unlocked, BURST_LEVELS.length))
const state = reactive({ grid: [], mud: [], kinds: [], rng: Math.random })
const popping = ref([])
const effects = ref([])
const floats = ref([])
const moves = ref(0)
const score = ref(0)
const collected = ref({})
const selected = ref(null)
const hintPair = ref(null)
const busy = ref(false)
const banner = ref(null)
const extraUsed = ref(false)
const results = ref(null)
const justUnlocked = ref(null)

const wrap = ref(null)
const cell = ref(48)

const cfg = computed(() => BURST_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('burst'))
const levelList = computed(() => BURST_LEVELS.map((l) => ({ goal: burstGoalText(l.goal) })))
const tiles = computed(() => [...state.grid.flat().filter(Boolean), ...popping.value])
const mudLeft = computed(() => state.mud.flat().reduce((a, b) => a + b, 0))
const mudTotal = ref(0)
const starsNow = computed(() => (!goalMet() ? 0 : score.value >= cfg.value.stars[1] ? 3 : score.value >= cfg.value.stars[0] ? 2 : 1))
const scoreMax = computed(() => cfg.value.stars[1] * 1.08)
const goalItems = computed(() => {
  const g = cfg.value.goal
  if (g.type === 'collect') return Object.entries(g.items).map(([type, n]) => ({ type, left: Math.max(0, n - (collected.value[type] ?? 0)) }))
  if (g.type === 'mud') return [{ type: 'mud', left: mudLeft.value }]
  return [{ type: 'score', left: Math.max(0, g.target - score.value) }]
})

function goalMet() {
  const g = cfg.value.goal
  if (g.type === 'score') return score.value >= g.target
  if (g.type === 'mud') return mudLeft.value === 0
  return Object.entries(g.items).every(([k, n]) => (collected.value[k] ?? 0) >= n)
}

// ---- timing helpers ----
const timers = new Set()
const wait = (ms) =>
  new Promise((resolve) => {
    const id = setTimeout(() => {
      timers.delete(id)
      resolve()
    }, ms)
    timers.add(id)
  })
const frame = () => new Promise((r) => requestAnimationFrame(() => r()))
let alive = true

// ---- flow ----
function pick(n) {
  level.value = n
  if (pip.introSeen.burst) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('burst')
  Object.assign(state, E.newState(cfg.value, BURST_TYPES))
  mudTotal.value = mudLeft.value
  popping.value = []
  effects.value = []
  moves.value = cfg.value.moves
  score.value = 0
  collected.value = {}
  selected.value = null
  hintPair.value = null
  extraUsed.value = false
  results.value = null
  busy.value = false
  phase.value = 'playing'
  nextTick(measure)
  showBanner(`Level ${level.value}`, burstGoalText(cfg.value.goal), 1600)
  armHint()
}

async function showBanner(title, text = '', ms = 1200) {
  const id = Math.random()
  banner.value = { id, title, text }
  await wait(ms)
  if (banner.value?.id === id) banner.value = null
}

// ---- input: drag a flower, or tap one then a neighbour ----
let press = null

function cellAt(e) {
  const rect = wrap.value.getBoundingClientRect()
  const c = Math.floor((e.clientX - rect.left) / cell.value)
  const r = Math.floor((e.clientY - rect.top) / cell.value)
  if (r < 0 || r >= E.ROWS || c < 0 || c >= E.COLS) return null
  return [r, c]
}

function onDown(e) {
  if (phase.value !== 'playing' || busy.value) return
  const at = cellAt(e)
  if (!at) return
  press = { at, x: e.clientX, y: e.clientY, used: false }
  wrap.value.setPointerCapture?.(e.pointerId)
}

function onMove(e) {
  if (!press || press.used) return
  const dx = e.clientX - press.x
  const dy = e.clientY - press.y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < cell.value * 0.35) return
  press.used = true
  const [r, c] = press.at
  const to = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c]
  selected.value = null
  if (to[0] >= 0 && to[0] < E.ROWS && to[1] >= 0 && to[1] < E.COLS) trySwap(press.at, to)
}

function onUp() {
  if (!press) return
  const { at, used } = press
  press = null
  if (used || busy.value) return
  // a tap: select, or swap with the selected neighbour
  if (selected.value && E.adjacent(selected.value, at)) {
    const from = selected.value
    selected.value = null
    trySwap(from, at)
  } else if (selected.value && selected.value[0] === at[0] && selected.value[1] === at[1]) {
    selected.value = null
  } else {
    selected.value = at
    playSound('tap')
  }
}

// ---- turns ----
async function trySwap(a, b) {
  if (busy.value || phase.value !== 'playing') return
  busy.value = true
  hintPair.value = null
  clearHint()
  const works = E.swapWorks(state, a, b)
  E.swap(state, a, b)
  playSound('swap')
  haptic('light')
  await wait(190)
  if (!alive) return
  if (!works) {
    E.swap(state, a, b)
    playSound('miss')
    await wait(190)
    busy.value = false
    armHint()
    return
  }
  moves.value -= 1
  const combo = E.comboStep(state, a, b)
  if (combo) {
    await showStep(combo, 0, true)
    await drop()
  }
  await resolveBoard([a, b])
  if (!alive) return
  busy.value = false
  afterTurn()
}

async function resolveBoard(preferred = []) {
  let chain = 0
  for (;;) {
    const step = E.matchStep(state, { preferred, chain })
    if (!step) break
    await showStep(step, chain)
    await drop()
    if (!alive) return
    preferred = []
    chain++
  }
  if (chain >= 3 && phase.value === 'playing') showBanner(['Lovely!', 'Blooming!', 'Wonderful!', 'Garden party!'][Math.min(3, chain - 3)], '', 900)
  if (!E.findMove(state)) {
    await showBanner('No moves left', 'Giving the garden a shake', 900)
    E.reshuffle(state)
    playSound('tear')
    await wait(380)
  }
}

let floatId = 0
async function showStep(step, chain, combo = false) {
  // count what was cleared
  const counts = { ...collected.value }
  for (const t of step.cleared) counts[t.type] = (counts[t.type] ?? 0) + 1
  collected.value = counts
  score.value += step.points

  for (const t of step.cleared) t.pop = true
  popping.value = [...popping.value, ...step.cleared]

  for (const b of step.blasts) {
    const id = ++floatId
    effects.value.push({ id, ...b })
    later(() => (effects.value = effects.value.filter((x) => x.id !== id)), 650)
  }
  if (step.cleared.length) {
    const r = step.cleared.reduce((s, t) => s + t.r, 0) / step.cleared.length
    const c = step.cleared.reduce((s, t) => s + t.c, 0) / step.cleared.length
    const id = ++floatId
    floats.value.push({ id, r, c, text: step.points.toLocaleString('en') })
    later(() => (floats.value = floats.value.filter((x) => x.id !== id)), 900)
  }

  if (step.blasts.length || combo) {
    playSound('special')
    haptic('soft')
  } else {
    playSound('burst', true, { chain })
  }
  if (step.created.length) later(() => playSound('unlock'), 120)

  await wait(240)
  const gone = new Set(step.cleared.map((t) => t.id))
  popping.value = popping.value.filter((t) => !gone.has(t.id))
}

async function drop() {
  E.gravity(state)
  await nextTick()
  await frame()
  await frame()
  E.settle(state)
  await wait(300)
}

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function afterTurn() {
  if (phase.value !== 'playing') return
  const early = cfg.value.goal.type !== 'score'
  if (goalMet() && (early || moves.value === 0)) return bloomBonus()
  if (moves.value <= 0) {
    if (!extraUsed.value) {
      phase.value = 'outOfMoves'
      playSound('miss')
      return
    }
    return finish(false)
  }
  if (moves.value === 5) showBanner('5 moves left', '', 900)
  armHint()
}

function buyMoves() {
  if (!pip.spendPetals(EXTRA_COST)) return
  extraUsed.value = true
  moves.value += EXTRA_MOVES
  phase.value = 'playing'
  playSound('petals')
  haptic('success')
  armHint()
}

// Leftover moves become watering cans, then they all go off.
async function bloomBonus() {
  phase.value = 'bonus'
  busy.value = true
  playSound('levelUp')
  await showBanner(moves.value ? 'Bloom bonus!' : 'Goal reached!', moves.value ? 'Every move left becomes a watering can' : '', 1100)
  const cells = []
  while (moves.value > 0 && alive) {
    const free = state.grid.flat().filter((t) => t && !t.special)
    if (!free.length) break
    const t = free[Math.floor(Math.random() * free.length)]
    t.special = Math.random() < 0.5 ? 'row' : 'col'
    t.fresh = true
    cells.push([t.r, t.c])
    moves.value -= 1
    score.value += 200
    playSound('catch', true, { combo: Math.min(8, cells.length) })
    await wait(130)
  }
  if (cells.length && alive) {
    await wait(250)
    await showStep(E.fireStep(state, cells), 0, true)
    await drop()
    await resolveBoard()
  }
  if (alive) finish(true)
}

function finish(success) {
  phase.value = 'done'
  busy.value = false
  clearHint()
  if (!success) {
    results.value = {
      success: false,
      title: 'Out of moves',
      subtitle: goalSummary(),
    }
    return
  }
  const stars = starsNow.value
  const reward = pip.completeLevel('burst', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= BURST_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === BURST_LEVELS.length,
    title: stars === 3 ? 'A garden in full bloom!' : stars === 2 ? 'Bursting with flowers!' : 'Goal reached!',
    subtitle: stars < 3 ? `3 stars at ${cfg.value.stars[1].toLocaleString('en')} points. Finish early and make big combos.` : '',
  }
}

function goalSummary() {
  const g = cfg.value.goal
  if (g.type === 'score') return `${score.value.toLocaleString('en')} of ${g.target.toLocaleString('en')} points.`
  if (g.type === 'mud') return `${mudTotal.value - mudLeft.value} of ${mudTotal.value} patches of mud washed away.`
  const left = goalItems.value.reduce((sum, i) => sum + i.left, 0)
  return `Just ${left} more ${left === 1 ? 'flower' : 'flowers'} to collect.`
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

// ---- hints: a gentle wiggle after a few quiet seconds ----
let hintTimer = null
function armHint() {
  clearHint()
  hintTimer = setTimeout(() => {
    if (phase.value === 'playing' && !busy.value) hintPair.value = E.findMove(state)
  }, 6000)
}
function clearHint() {
  clearTimeout(hintTimer)
}
const hinted = (t) => hintPair.value?.some(([r, c]) => r === t.r && c === t.c)

// ---- sizing ----
let ro = null
function measure() {
  const host = wrap.value?.parentElement
  if (!host) return
  const w = host.clientWidth - 24
  const h = host.clientHeight - 16
  cell.value = Math.max(30, Math.floor(Math.min(w / E.COLS, h / E.ROWS, 58)))
}
onMounted(() => window.addEventListener('resize', measure))
function observe(el) {
  if (!el) return
  ro ??= new ResizeObserver(measure)
  ro.observe(el)
}

onBeforeUnmount(() => {
  alive = false
  timers.forEach(clearTimeout)
  clearHint()
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})

const tileStyle = (t) => ({
  width: `${cell.value}px`,
  height: `${cell.value}px`,
  transform: `translate(${t.c * cell.value}px, ${t.r * cell.value}px)`,
})
const EFFECT_COLORS = { row: '#8FBFD1', col: '#8FBFD1', bee: '#F2C66B', big: '#F2C66B', rainbow: '#E48C9C' }
</script>

<template>
  <GameShell title="Bloom Burst" track="burst" :hide-title="phase !== 'levels'" background="linear-gradient(180deg, #F3EBDD 0%, #EAF0DF 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase !== 'levels'" class="chip tabular-nums">Level {{ level }}</span>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Bloom Burst"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <!-- goal, moves and score -->
      <div class="flex items-stretch gap-2.5 px-4 pt-1">
        <div class="flex w-[4.6rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-surface py-1.5 shadow-soft">
          <span class="font-display text-[1.9rem] font-semibold leading-none tabular-nums" :class="moves <= 3 && phase !== 'intro' ? 'text-clay-400' : 'text-bark-600'">{{ phase === 'intro' ? cfg.moves : moves }}</span>
          <span class="mt-0.5 text-[0.625rem] font-extrabold uppercase tracking-wider text-bark-400">moves</span>
        </div>
        <div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5 rounded-2xl bg-surface px-3 py-2 shadow-soft">
          <div class="flex items-center gap-3">
            <span v-for="g in goalItems" :key="g.type" class="flex items-center gap-1.5">
              <span v-if="g.type === 'mud'" class="h-6 w-6 rounded-md bg-[#A88466]" />
              <span v-else-if="g.type === 'score'" class="text-[0.6875rem] font-extrabold uppercase tracking-wider text-bark-400">Goal</span>
              <svg v-else viewBox="-20 -20 40 40" class="h-6 w-6"><use x="-20" y="-20" width="40" height="40" :href="`#bb-${g.type}`" /></svg>
              <span class="text-sm font-extrabold tabular-nums" :class="g.left ? 'text-bark-600' : 'text-leaf-500'">
                <template v-if="!g.left">✓</template>
                <template v-else>{{ g.type === 'score' ? cfg.goal.target.toLocaleString('en') : g.left }}</template>
              </span>
            </span>
            <span class="ml-auto font-display text-lg font-semibold tabular-nums text-bark-600">{{ score.toLocaleString('en') }}</span>
          </div>
          <div class="relative h-2 rounded-full bg-sand-100">
            <div class="absolute inset-y-0 left-0 rounded-full bg-petal-400 transition-[width] duration-300" :style="{ width: `${Math.min(100, (score / scoreMax) * 100)}%` }" />
            <span
              v-for="(s, i) in cfg.stars"
              :key="i"
              class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              :style="{ left: `${(s / scoreMax) * 100}%` }"
            >
              <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8z" :fill="score >= s ? '#F2C66B' : '#E7DDCF'" stroke="#fff" stroke-width="1.5" /></svg>
            </span>
          </div>
        </div>
      </div>

      <!-- the board -->
      <div :ref="observe" class="relative flex flex-1 items-center justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div
          ref="wrap"
          class="board relative touch-none select-none"
          :style="{ width: `${cell * E.COLS}px`, height: `${cell * E.ROWS}px` }"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        >
          <!-- soil squares and mud -->
          <template v-for="(row, r) in state.mud" :key="`m${r}`">
            <div
              v-for="(m, c) in row"
              :key="`m${r}-${c}`"
              class="absolute rounded-[22%]"
              :class="m === 2 ? 'mud-2' : m === 1 ? 'mud-1' : (r + c) % 2 ? 'soil-a' : 'soil-b'"
              :style="{ width: `${cell - 2}px`, height: `${cell - 2}px`, left: `${c * cell + 1}px`, top: `${r * cell + 1}px` }"
            />
          </template>

          <div
            v-for="t in tiles"
            :key="t.id"
            class="tile absolute left-0 top-0 flex items-center justify-center"
            :class="{
              'is-pop': t.pop,
              'is-fresh': t.fresh,
              'is-selected': selected && selected[0] === t.r && selected[1] === t.c && !t.pop,
              'is-hint': hinted(t) && !t.pop,
            }"
            :style="tileStyle(t)"
          >
            <svg viewBox="-20 -20 40 40" class="h-[86%] w-[86%] overflow-visible" aria-hidden="true">
              <use x="-20" y="-20" width="40" height="40" v-if="t.special === 'rainbow'" href="#bb-rainbow" />
              <template v-else>
                <use x="-20" y="-20" width="40" height="40" :href="`#bb-${t.type}`" />
                <use x="-20" y="-20" width="40" height="40" v-if="t.special === 'row'" href="#bb-row" />
                <use x="-20" y="-20" width="40" height="40" v-if="t.special === 'col'" href="#bb-row" transform="rotate(90)" />
                <use x="-20" y="-20" width="40" height="40" v-if="t.special === 'bee'" href="#bb-bee" />
              </template>
            </svg>
          </div>

          <!-- blasts -->
          <div
            v-for="fx in effects"
            :key="fx.id"
            class="fx pointer-events-none absolute"
            :class="`fx-${fx.kind}`"
            :style="{
              '--fx': EFFECT_COLORS[fx.kind] ?? '#F2C66B',
              ...(fx.kind === 'row' ? { left: 0, right: 0, top: `${fx.r * cell}px`, height: `${cell}px` } : {}),
              ...(fx.kind === 'col' ? { top: 0, bottom: 0, left: `${fx.c * cell}px`, width: `${cell}px` } : {}),
              ...(['bee', 'big', 'rainbow'].includes(fx.kind)
                ? { left: `${(fx.c + 0.5) * cell}px`, top: `${(fx.r + 0.5) * cell}px`, width: `${cell * (fx.kind === 'bee' ? 3 : 5)}px`, height: `${cell * (fx.kind === 'bee' ? 3 : 5)}px` }
                : {}),
            }"
          />

          <span
            v-for="f in floats"
            :key="f.id"
            class="points pointer-events-none absolute font-display text-lg font-semibold"
            :style="{ left: `${(f.c + 0.5) * cell}px`, top: `${(f.r + 0.5) * cell}px` }"
          >
            {{ f.text }}
          </span>
        </div>

        <Transition name="banner">
          <div v-if="banner" :key="banner.id" class="pointer-events-none absolute inset-x-6 top-1/3 z-10 text-center">
            <p class="banner-title font-display text-[2.1rem] font-semibold leading-tight">{{ banner.title }}</p>
            <p v-if="banner.text" class="mt-1 inline-block rounded-full bg-surface/95 px-4 py-1.5 text-sm font-bold text-bark-500 shadow-soft">{{ banner.text }}</p>
          </div>
        </Transition>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="burstGoalText(cfg.goal)"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#E48C9C', text: 'Swipe a flower to swap it with a neighbour' },
          { color: '#8FBFD1', text: '4 in a line makes a watering can' },
          { color: '#F2C66B', text: 'An L or T shape makes a bee' },
          { color: '#B48CD1', text: '5 in a line makes a rainbow seed' },
          { color: '#86AD72', text: 'Swap two specials together for a big burst' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />

      <!-- out of moves: a second chance for petals -->
      <div v-if="phase === 'outOfMoves'" class="absolute inset-0 z-30 flex items-center justify-center bg-cream/50 p-5 backdrop-blur-[6px]">
        <div class="pop-card w-full max-w-sm rounded-[1.75rem] bg-surface p-6 text-center shadow-float">
          <p class="eyebrow">Out of moves</p>
          <h2 class="mt-1.5 font-display text-[1.6rem] font-semibold leading-tight text-bark-600">So close!</h2>
          <p class="mt-1 text-sm font-medium text-bark-400">Keep going with {{ EXTRA_MOVES }} more moves?</p>
          <button type="button" class="btn btn-primary mt-5 w-full" :disabled="pip.petals < EXTRA_COST" @click="buyMoves">
            +{{ EXTRA_MOVES }} moves for <PetalIcon :size="16" class="ml-1" /> {{ EXTRA_COST }}
          </button>
          <p v-if="pip.petals < EXTRA_COST" class="mt-2 text-xs font-semibold text-bark-400">You have {{ pip.petals }} petals.</p>
          <button type="button" class="btn btn-ghost btn-sm mt-1 w-full" @click="finish(false)">End level</button>
        </div>
      </div>

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[{ label: 'Score', value: score.toLocaleString('en') }]"
        :petals="results.petals"
        :has-next="level < BURST_LEVELS.length"
        :unlocked="results.unlocked"
        :all-done="results.allDone"
        has-levels
        @next="nextLevel"
        @again="begin"
        @levels="phase = 'levels'"
        @close="emit('close')"
      />
    </template>

    <!-- the flowers, drawn once -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <radialGradient id="bbg-blossom" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#FCE1E4" /><stop offset="1" stop-color="#E7899A" /></radialGradient>
        <radialGradient id="bbg-sunny" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#FBE29A" /><stop offset="1" stop-color="#E9A43E" /></radialGradient>
        <radialGradient id="bbg-poppy" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#F8A58E" /><stop offset="1" stop-color="#D9533F" /></radialGradient>
        <linearGradient id="bbg-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A9CF88" /><stop offset="1" stop-color="#4F8344" /></linearGradient>
        <linearGradient id="bbg-drop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9D8EA" /><stop offset="1" stop-color="#4E96BD" /></linearGradient>
        <linearGradient id="bbg-rainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#E7899A" /><stop offset="0.3" stop-color="#F2C66B" /><stop offset="0.55" stop-color="#8CC27A" /><stop offset="0.8" stop-color="#7CB3D6" /><stop offset="1" stop-color="#B48CD1" />
        </linearGradient>

        <symbol id="bb-daisy" viewBox="-20 -20 40 40" overflow="visible">
          <ellipse v-for="a in [0, 40, 80, 120, 160, 200, 240, 280, 320]" :key="a" cx="0" cy="-10" rx="4.2" ry="8.6" :transform="`rotate(${a})`" fill="#FFFDF8" stroke="#D9CDB6" stroke-width="0.8" />
          <circle r="6.2" fill="#F3C452" />
          <circle cx="-1.8" cy="-2" r="2" fill="#fff" opacity="0.5" />
        </symbol>
        <symbol id="bb-blossom" viewBox="-20 -20 40 40" overflow="visible">
          <ellipse v-for="a in [0, 72, 144, 216, 288]" :key="a" cx="0" cy="-9.5" rx="8" ry="9.6" :transform="`rotate(${a})`" fill="url(#bbg-blossom)" />
          <circle r="4.6" fill="#F8E2A6" />
        </symbol>
        <symbol id="bb-sunny" viewBox="-20 -20 40 40" overflow="visible">
          <path v-for="a in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]" :key="a" d="M0 -18 L4 -7 L-4 -7Z" :transform="`rotate(${a})`" fill="url(#bbg-sunny)" stroke="#E0A040" stroke-width="0.6" stroke-linejoin="round" />
          <circle r="8" fill="#8B6142" />
          <circle r="8" fill="none" stroke="#6E4A31" stroke-width="1.2" stroke-dasharray="1.5 2" />
        </symbol>
        <symbol id="bb-poppy" viewBox="-20 -20 40 40" overflow="visible">
          <ellipse v-for="a in [45, 135, 225, 315]" :key="a" cx="0" cy="-9" rx="10.5" ry="10" :transform="`rotate(${a})`" fill="url(#bbg-poppy)" />
          <circle r="5" fill="#3E2F25" />
          <circle v-for="a in [0, 60, 120, 180, 240, 300]" :key="`d${a}`" cx="0" cy="-6.6" r="1" :transform="`rotate(${a})`" fill="#3E2F25" />
        </symbol>
        <symbol id="bb-leaf" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M-14 14 C-16 -4 -2 -16 16 -16 C16 2 4 16 -14 14Z" fill="url(#bbg-leaf)" />
          <path d="M-12 12 C-4 4 4 -4 12 -12" stroke="#E5F2D6" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.8" />
          <path d="M-4 4 L-8 -4 M2 -2 L0 -10 M2 -2 L10 0 M-4 4 L4 8" stroke="#E5F2D6" stroke-width="1.1" stroke-linecap="round" opacity="0.55" />
        </symbol>
        <symbol id="bb-drop" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M0 -17 C6 -8 13 -1 13 5.5 A13 13 0 0 1 -13 5.5 C-13 -1 -6 -8 0 -17Z" fill="url(#bbg-drop)" />
          <ellipse cx="-5" cy="1" rx="3" ry="5" fill="#fff" opacity="0.55" transform="rotate(20 -5 1)" />
        </symbol>
        <symbol id="bb-rainbow" viewBox="-20 -20 40 40" overflow="visible">
          <ellipse rx="12.5" ry="16" fill="url(#bbg-rainbow)" transform="rotate(-20)" />
          <ellipse rx="12.5" ry="16" fill="none" stroke="#fff" stroke-width="1.6" transform="rotate(-20)" />
          <path d="M-3 -8 C-6 -3 -6 3 -3 8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.7" transform="rotate(-20)" />
          <circle cx="8" cy="-12" r="1.6" fill="#fff" class="twinkle" />
          <circle cx="-10" cy="10" r="1.2" fill="#fff" class="twinkle" style="animation-delay: -0.6s" />
        </symbol>
        <!-- watering can stripes: arrows that point both ways along its line -->
        <symbol id="bb-row" viewBox="-20 -20 40 40" overflow="visible">
          <rect x="-19" y="-3.6" width="38" height="7.2" rx="3.6" fill="#fff" opacity="0.88" />
          <path d="M-17 0 L-12 -3 L-12 3Z M17 0 L12 -3 L12 3Z" fill="#4E96BD" />
          <rect x="-9" y="-1.2" width="18" height="2.4" rx="1.2" fill="#8FBFD1" />
        </symbol>
        <symbol id="bb-bee" viewBox="-20 -20 40 40" overflow="visible">
          <g transform="translate(7 7)">
            <ellipse cx="-3" cy="-7" rx="4.5" ry="3.2" fill="#fff" opacity="0.92" transform="rotate(-25 -3 -7)" />
            <ellipse cx="3" cy="-7" rx="4.5" ry="3.2" fill="#fff" opacity="0.92" transform="rotate(25 3 -7)" />
            <ellipse rx="8.5" ry="6.5" fill="#F6C443" stroke="#3E2F25" stroke-width="1.2" />
            <path d="M-2.5 -6 V6 M2.5 -6 V6" stroke="#3E2F25" stroke-width="2.4" />
            <circle cx="5.2" cy="-1.2" r="1.1" fill="#3E2F25" />
          </g>
        </symbol>
      </defs>
    </svg>
  </GameShell>
</template>

<style scoped>
.board {
  border-radius: 1.25rem;
  background: #CFDDB9;
  box-shadow: 0 0 0 6px #CFDDB9, 0 18px 34px -20px rgb(58 45 35 / 0.6);
  overflow: hidden;
}
.soil-a {
  background: #DCE8C8;
}
.soil-b {
  background: #E4EED3;
}
.mud-1 {
  background: #C6A889;
  box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.08);
}
.mud-2 {
  background: #A1805F;
  box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.12), inset 0 0 0 3px rgb(255 255 255 / 0.12);
}
.tile {
  transition: transform 0.28s cubic-bezier(0.45, 0.05, 0.4, 1.15);
  will-change: transform;
  pointer-events: none;
}
.tile svg {
  filter: drop-shadow(0 2px 1.5px rgb(58 45 35 / 0.22));
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.tile.is-pop svg {
  transform: scale(0);
  opacity: 0;
  transition: transform 0.22s cubic-bezier(0.6, -0.4, 0.7, 1), opacity 0.22s ease;
}
.tile.is-fresh svg {
  animation: fresh 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
.tile.is-selected svg {
  transform: scale(1.14);
}
.tile.is-selected::before {
  content: '';
  position: absolute;
  inset: 6%;
  border-radius: 28%;
  background: rgb(255 255 255 / 0.65);
}
.tile.is-hint svg {
  animation: hint 0.9s ease-in-out infinite;
}
@keyframes fresh {
  0% { transform: scale(0.3) rotate(-30deg); }
  100% { transform: none; }
}
@keyframes hint {
  0%, 100% { transform: scale(1) rotate(0); }
  25% { transform: scale(1.1) rotate(-8deg); }
  75% { transform: scale(1.1) rotate(8deg); }
}
.twinkle {
  animation: twinkle 1.2s ease-in-out infinite;
}
@keyframes twinkle {
  50% { opacity: 0.2; }
}
.fx {
  z-index: 5;
}
.fx-row,
.fx-col {
  background: linear-gradient(var(--dir, 90deg), transparent, rgb(255 255 255 / 0.95), transparent);
  box-shadow: 0 0 18px var(--fx);
  border-radius: 999px;
  animation: sweep 0.55s ease-out both;
}
.fx-col {
  --dir: 0deg;
}
.fx-bee,
.fx-big,
.fx-rainbow {
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgb(255 255 255 / 0.95) 0%, var(--fx) 45%, transparent 70%);
  animation: boom 0.55s ease-out both;
}
.fx-rainbow {
  background: radial-gradient(circle, #fff 0%, #F2C66B 25%, #8CC27A 40%, #7CB3D6 55%, transparent 72%);
}
@keyframes sweep {
  0% { opacity: 0; transform: scale(0.6); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.05); }
}
@keyframes boom {
  0% { opacity: 0.9; transform: translate(-50%, -50%) scale(0.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.25); }
}
.points {
  z-index: 6;
  color: #fff;
  text-shadow: 0 1px 0 #C9707F, 0 2px 6px rgb(120 60 70 / 0.45);
  transform: translate(-50%, -50%);
  animation: rise 0.9s ease-out both;
}
@keyframes rise {
  0% { opacity: 0; transform: translate(-50%, -30%) scale(0.7); }
  20% { opacity: 1; transform: translate(-50%, -60%) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -180%) scale(1); }
}
.banner-title {
  color: #fff;
  text-shadow: 0 2px 0 #D57E8E, 0 4px 14px rgb(120 60 70 / 0.4);
  -webkit-text-stroke: 1px #D57E8E;
}
.banner-enter-active {
  transition: opacity 0.25s ease, transform 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.banner-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.banner-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.banner-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.pop-card {
  animation: card-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: none; }
}
</style>
