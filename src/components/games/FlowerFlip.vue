<script setup>
// Flower Flip: place a flower so that it traps a straight line of the other colour between
// yours, and they all flip to your colour. No move? Your turn passes. Most flowers at the end
// wins. Play Pip on three levels, or a friend.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import PlayerSetup from './PlayerSetup.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const N = 8
const REWARDS = { easy: 3, medium: 7, hard: 14 }
const COLORS = { 1: { fill: '#FFFDF8', center: '#F2B544' }, 2: { fill: '#E05A7A', center: '#FBE3A0' } }
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
// corners are gold, the squares beside them dangerous
const WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
]

const mode = ref('pip')
const level = ref('medium')
const phase = ref('setup')
const board = ref([])
const turn = ref(1)
const flipped = ref(new Set())
const placed = ref(-1)
const thinking = ref(false)
const note = ref('')
const results = ref(null)
const timers = new Set()
const later = (fn, ms) => {
  const t = setTimeout(() => {
    timers.delete(t)
    fn()
  }, ms)
  timers.add(t)
}

const vsPip = computed(() => mode.value === 'pip')
const names = computed(() => (vsPip.value ? { 1: 'You', 2: pip.plantName } : { 1: 'Daisies', 2: 'Roses' }))
const counts = computed(() => ({ 1: board.value.filter((v) => v === 1).length, 2: board.value.filter((v) => v === 2).length }))
const legal = computed(() => (phase.value === 'playing' ? movesFor(board.value, turn.value) : new Map()))
const myTurn = computed(() => phase.value === 'playing' && !thinking.value && (!vsPip.value || turn.value === 1))

function start() {
  const b = Array(N * N).fill(0)
  b[27] = 2
  b[28] = 1
  b[35] = 1
  b[36] = 2
  board.value = b
  turn.value = 1
  flipped.value = new Set()
  placed.value = -1
  note.value = ''
  results.value = null
  phase.value = 'playing'
}

function flipsFor(b, i, who) {
  if (b[i]) return []
  const r = Math.floor(i / N)
  const c = i % N
  const out = []
  for (const [dr, dc] of DIRS) {
    const line = []
    let y = r + dr
    let x = c + dc
    while (y >= 0 && y < N && x >= 0 && x < N && b[y * N + x] === 3 - who) {
      line.push(y * N + x)
      y += dr
      x += dc
    }
    if (line.length && y >= 0 && y < N && x >= 0 && x < N && b[y * N + x] === who) out.push(...line)
  }
  return out
}
function movesFor(b, who) {
  const m = new Map()
  for (let i = 0; i < N * N; i++) {
    const f = flipsFor(b, i, who)
    if (f.length) m.set(i, f)
  }
  return m
}

function play(i) {
  const f = flipsFor(board.value, i, turn.value)
  if (!f.length) return false
  const b = [...board.value]
  b[i] = turn.value
  for (const k of f) b[k] = turn.value
  board.value = b
  placed.value = i
  flipped.value = new Set(f)
  playSound('flip')
  haptic('light')
  nextTurn()
  return true
}

function nextTurn() {
  const other = 3 - turn.value
  if (movesFor(board.value, other).size) {
    turn.value = other
    note.value = ''
  } else if (movesFor(board.value, turn.value).size) {
    note.value = `${names.value[other]} can’t move, so ${names.value[turn.value]} ${vsPip.value && turn.value === 1 ? 'go' : 'goes'} again`
  } else return later(finish, 700)
  if (vsPip.value && turn.value === 2) later(pipMove, 650)
}

function tap(i) {
  if (!myTurn.value) return
  if (!play(i)) playSound('miss')
}

// ---- Pip's thinking
function evaluate(b, me) {
  let s = 0
  for (let i = 0; i < N * N; i++) if (b[i]) s += (b[i] === me ? 1 : -1) * WEIGHTS[Math.floor(i / N)][i % N]
  const mob = movesFor(b, me).size - movesFor(b, 3 - me).size
  return s + mob * 4
}
function search(b, depth, alpha, beta, me) {
  const moves = movesFor(b, me)
  if (depth === 0) return evaluate(b, me)
  if (!moves.size) {
    if (!movesFor(b, 3 - me).size) {
      const d = b.filter((v) => v === me).length - b.filter((v) => v === 3 - me).length
      return d * 1000
    }
    return -search(b, depth - 1, -beta, -alpha, 3 - me)
  }
  let best = -Infinity
  for (const [i, f] of moves) {
    const nb = [...b]
    nb[i] = me
    for (const k of f) nb[k] = me
    const v = -search(nb, depth - 1, -beta, -alpha, 3 - me)
    if (v > best) best = v
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}
function pipMove() {
  if (phase.value !== 'playing') return
  thinking.value = true
  later(() => {
    const moves = [...movesFor(board.value, 2)]
    let pick = moves[0]?.[0]
    if (level.value === 'easy') {
      // grabs whatever flips the most, with a little dithering
      moves.sort((a, b) => b[1].length - a[1].length)
      pick = moves[Math.floor(Math.random() * Math.min(3, moves.length))][0]
    } else {
      const depth = level.value === 'medium' ? 2 : 4
      let best = -Infinity
      for (const [i, f] of moves) {
        const nb = [...board.value]
        nb[i] = 2
        for (const k of f) nb[k] = 2
        const v = -search(nb, depth - 1, -Infinity, Infinity, 1)
        if (v > best) {
          best = v
          pick = i
        }
      }
    }
    thinking.value = false
    if (pick != null) play(pick)
  }, 300)
}

function finish() {
  phase.value = 'done'
  const { 1: a, 2: b } = counts.value
  const winner = a > b ? 1 : b > a ? 2 : 0
  let petals = 1
  let title = winner ? `${names.value[winner]} ${vsPip.value && winner === 1 ? 'win' : 'win!'}` : 'A draw!'
  if (vsPip.value) {
    petals = winner === 1 ? REWARDS[level.value] : winner === 0 ? 2 : 0
    title = winner === 1 ? `You beat ${pip.plantName}!` : winner === 2 ? `${pip.plantName} wins this one` : 'A draw!'
  }
  const earned = pip.finishRound('flip', petals, vsPip.value && winner === 1 && level.value === 'hard' ? `Beat ${pip.plantName} at Flower Flip on Hard` : null)
  results.value = { winner, title, petals: earned }
  playSound(winner === 2 && vsPip.value ? 'lose' : 'win')
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <GameShell title="Flower Flip" track="puzzle" background="linear-gradient(180deg, #EAF1E4 0%, #F4EAD9 100%)" @close="emit('close')">
    <PlayerSetup v-if="phase === 'setup'" v-model:mode="mode" v-model:level="level" title="Flower Flip" blurb="Trap a line of the other colour between two of yours and they flip. Most flowers wins." :rewards="REWARDS" @start="start">
      <template #art>
        <div class="mx-auto grid w-max grid-cols-2 gap-1">
          <span v-for="k in 4" :key="k" class="flower" :style="{ '--fill': COLORS[k === 1 || k === 4 ? 2 : 1].fill, '--center': COLORS[k === 1 || k === 4 ? 2 : 1].center, width: '1.8rem', height: '1.8rem' }" />
        </div>
      </template>
    </PlayerSetup>

    <div v-else class="flex flex-1 flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="mt-1 flex w-full max-w-sm gap-2">
        <div v-for="p in [1, 2]" :key="p" class="player" :class="{ 'is-turn': phase === 'playing' && turn === p }">
          <span class="flower shrink-0" :style="{ '--fill': COLORS[p].fill, '--center': COLORS[p].center, width: '1.6rem', height: '1.6rem' }" />
          <span class="min-w-0 flex-1 truncate text-sm font-bold text-bark-600">{{ names[p] }}</span>
          <span class="font-display text-2xl font-semibold tabular-nums text-bark-600">{{ counts[p] }}</span>
        </div>
      </div>
      <p class="mt-2 h-5 text-center text-sm font-bold text-bark-500">
        {{ note || (thinking ? `${pip.plantName} is thinking…` : vsPip ? (turn === 1 ? 'Your turn' : '') : `${names[turn]}’ turn`) }}
      </p>
      <div class="lawn mt-3">
        <button
          v-for="(v, i) in board"
          :key="i"
          type="button"
          class="sq"
          :class="{ 'is-legal': myTurn && legal.has(i) }"
          data-sound="none"
          :aria-label="`Square ${i + 1}`"
          @click="tap(i)"
        >
          <span v-if="v" :key="`${i}-${v}`" class="flower" :class="{ 'is-flip': flipped.has(i), 'is-new': placed === i }" :style="{ '--fill': COLORS[v].fill, '--center': COLORS[v].center }" />
        </button>
      </div>
    </div>

    <GameResults
      v-if="phase === 'done' && results"
      :success="results.winner !== 2 || !vsPip"
      eyebrow="Flower Flip"
      :title="results.title"
      :stats="[{ label: names[1], value: counts[1] }, { label: names[2], value: counts[2] }]"
      :petals="results.petals"
      has-levels
      levels-label="Change players"
      @again="start"
      @levels="phase = 'setup'"
      @close="emit('close')"
    />
  </GameShell>
</template>

<style scoped>
.player {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 2px solid transparent;
  box-shadow: var(--shadow-soft);
}
.player.is-turn {
  border-color: var(--color-leaf-400);
}
.lawn {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 3px;
  width: min(100%, 26rem, calc(100dvh - 15rem));
  aspect-ratio: 1;
  padding: 6px;
  border-radius: 1.2rem;
  background: #6e9e5c;
  box-shadow: inset 0 -5px 0 rgb(40 70 30 / 0.3), 0 16px 30px -18px rgb(58 45 35 / 0.8);
}
.sq {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #8fbc76;
  -webkit-tap-highlight-color: transparent;
}
.sq:nth-child(odd) {
  background: #94c27b;
}
.sq.is-legal::after {
  content: '';
  width: 26%;
  height: 26%;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.55);
}
.flower {
  display: block;
  width: 82%;
  height: 82%;
  border-radius: 999px;
  background:
    radial-gradient(circle, var(--center) 0 22%, transparent 23%),
    radial-gradient(circle at 50% 12%, var(--fill) 0 22%, transparent 23%),
    radial-gradient(circle at 88% 38%, var(--fill) 0 22%, transparent 23%),
    radial-gradient(circle at 74% 84%, var(--fill) 0 22%, transparent 23%),
    radial-gradient(circle at 26% 84%, var(--fill) 0 22%, transparent 23%),
    radial-gradient(circle at 12% 38%, var(--fill) 0 22%, transparent 23%),
    radial-gradient(circle, var(--fill) 0 36%, transparent 37%);
  filter: drop-shadow(0 2px 1px rgb(0 0 0 / 0.2));
}
.flower.is-flip {
  animation: flip 0.45s ease;
}
.flower.is-new {
  animation: pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes flip {
  0% { transform: rotateY(90deg); }
  100% { transform: rotateY(0); }
}
@keyframes pop {
  from { transform: scale(0.3); }
}
</style>
