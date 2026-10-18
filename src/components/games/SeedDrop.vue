<script setup>
// Seed Drop: drop seeds into the garden wall, four in a row (across, up or slanting) wins.
// Play Pip on three levels or pass the phone to a friend. Best of three rounds.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import PlayerSetup from './PlayerSetup.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const COLS = 7
const ROWS = 6
const REWARDS = { easy: 3, medium: 6, hard: 12 }
const DEPTH = { easy: 2, medium: 4, hard: 7 }
const SLIP = { easy: 0.3, medium: 0.06, hard: 0 }
const COLORS = { 1: '#86AD72', 2: '#E48C9C' }

const mode = ref('pip')
const level = ref('medium')
const phase = ref('setup') // setup | playing | done
const board = ref([]) // board[c][r], r = 0 is the bottom
const turn = ref(1)
const wins = ref({ 1: 0, 2: 0 })
const round = ref(1)
const winLine = ref([])
const last = ref(null)
const thinking = ref(false)
const results = ref(null)
const roundOver = ref('')
const timers = new Set()
const later = (fn, ms) => {
  const t = setTimeout(() => {
    timers.delete(t)
    fn()
  }, ms)
  timers.add(t)
}

const vsPip = computed(() => mode.value === 'pip')
const names = computed(() => (vsPip.value ? { 1: 'You', 2: pip.plantName } : { 1: 'Green', 2: 'Pink' }))
const myTurn = computed(() => phase.value === 'playing' && !thinking.value && !roundOver.value && (!vsPip.value || turn.value === 1))

function emptyBoard() {
  return Array.from({ length: COLS }, () => [])
}

function startMatch() {
  wins.value = { 1: 0, 2: 0 }
  round.value = 1
  results.value = null
  startRound(1)
}

function startRound(first) {
  board.value = emptyBoard()
  turn.value = first
  winLine.value = []
  last.value = null
  roundOver.value = ''
  phase.value = 'playing'
  if (vsPip.value && first === 2) later(pipMove, 600)
}

function lineAt(b, c, r) {
  const who = b[c][r]
  for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const cells = [[c, r]]
    for (const s of [1, -1]) {
      let k = 1
      while (true) {
        const x = c + dc * k * s
        const y = r + dr * k * s
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || b[x][y] !== who) break
        cells.push([x, y])
        k++
      }
    }
    if (cells.length >= 4) return cells
  }
  return null
}

function drop(c) {
  if (board.value[c].length >= ROWS) return false
  const b = board.value.map((col) => [...col])
  b[c].push(turn.value)
  board.value = b
  const r = b[c].length - 1
  last.value = { c, r }
  playSound('place', true, { high: turn.value === 1 })
  haptic('light')
  const line = lineAt(b, c, r)
  if (line) {
    winLine.value = line.map(([x, y]) => `${x},${y}`)
    endRound(turn.value)
  } else if (b.every((col) => col.length >= ROWS)) endRound(0)
  else {
    turn.value = 3 - turn.value
    if (vsPip.value && turn.value === 2) later(pipMove, 450)
  }
  return true
}

function tapColumn(c) {
  if (!myTurn.value) return
  if (!drop(c)) playSound('miss')
}

// ---- Pip's thinking: look ahead, scoring how many open threes and twos each side has
function scoreWindow(cells, me) {
  const mine = cells.filter((v) => v === me).length
  const theirs = cells.filter((v) => v === 3 - me).length
  const empty = cells.filter((v) => !v).length
  if (mine === 4) return 1000
  if (mine === 3 && empty === 1) return 6
  if (mine === 2 && empty === 2) return 2
  if (theirs === 3 && empty === 1) return -8
  return 0
}
function evaluate(b, me) {
  let s = 0
  for (let r = 0; r < ROWS; r++) if (b[3][r] === me) s += 3
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++)
      for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const ec = c + dc * 3
        const er = r + dr * 3
        if (ec >= COLS || er < 0 || er >= ROWS) continue
        s += scoreWindow([0, 1, 2, 3].map((k) => b[c + dc * k][r + dr * k]), me)
      }
  return s
}
const ORDER = [3, 2, 4, 1, 5, 0, 6]
function negamax(b, depth, alpha, beta, me) {
  const moves = ORDER.filter((c) => b[c].length < ROWS)
  if (!moves.length) return 0
  if (depth === 0) return evaluate(b, me) - evaluate(b, 3 - me)
  let best = -Infinity
  for (const c of moves) {
    b[c].push(me)
    const win = lineAt(b, c, b[c].length - 1)
    const v = win ? 100000 + depth : -negamax(b, depth - 1, -beta, -alpha, 3 - me)
    b[c].pop()
    if (v > best) best = v
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}
function pipMove() {
  if (phase.value !== 'playing' || roundOver.value) return
  thinking.value = true
  later(() => {
    const b = board.value.map((col) => [...col])
    const moves = ORDER.filter((c) => b[c].length < ROWS)
    let pick = moves[0]
    if (Math.random() < SLIP[level.value]) pick = moves[Math.floor(Math.random() * moves.length)]
    else {
      let best = -Infinity
      for (const c of moves) {
        b[c].push(2)
        const v = lineAt(b, c, b[c].length - 1) ? 1e9 : -negamax(b, DEPTH[level.value] - 1, -Infinity, Infinity, 1)
        b[c].pop()
        if (v > best) {
          best = v
          pick = c
        }
      }
    }
    thinking.value = false
    drop(pick)
  }, 250)
}

function endRound(winner) {
  if (winner) wins.value = { ...wins.value, [winner]: wins.value[winner] + 1 }
  roundOver.value = winner ? `${names.value[winner]} ${vsPip.value && winner === 1 ? 'win' : 'wins'} the round!` : 'A full wall. No winner this round.'
  playSound(winner === 2 && vsPip.value ? 'miss' : 'match')
  const over = wins.value[1] >= 2 || wins.value[2] >= 2 || round.value >= 3
  later(() => {
    if (over) return endMatch()
    round.value += 1
    startRound(round.value % 2 ? 1 : 2)
  }, 1800)
}

function endMatch() {
  phase.value = 'done'
  const a = wins.value[1]
  const b = wins.value[2]
  const winner = a > b ? 1 : b > a ? 2 : 0
  let petals = 1
  let title = winner ? `${names.value[winner]} ${vsPip.value && winner === 1 ? 'win' : 'wins'} the match!` : 'A tied match'
  if (vsPip.value) {
    petals = winner === 1 ? REWARDS[level.value] : winner === 0 ? 1 : 0
    if (winner === 2) title = `${pip.plantName} wins this one`
  }
  const earned = pip.finishRound('drop', petals, vsPip.value && winner === 1 && level.value === 'hard' ? `Beat ${pip.plantName} at Seed Drop on Hard` : null)
  results.value = { winner, title, petals: earned }
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <GameShell title="Seed Drop" track="puzzle" background="linear-gradient(180deg, #EEF3E6 0%, #F7F1E8 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase !== 'setup'" class="chip tabular-nums">Round {{ round }} / 3</span>
    </template>

    <PlayerSetup v-if="phase === 'setup'" v-model:mode="mode" v-model:level="level" title="Seed Drop" blurb="Drop seeds in turn. Four in a row wins. Best of three." :rewards="REWARDS" @start="startMatch">
      <template #art>
        <div class="mx-auto flex w-max gap-1.5">
          <span v-for="k in 4" :key="k" class="h-7 w-7 rounded-full" :style="{ background: k % 2 ? COLORS[1] : COLORS[2] }" />
        </div>
      </template>
    </PlayerSetup>

    <div v-else class="flex flex-1 flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="mt-1 flex w-full max-w-sm gap-2">
        <div v-for="p in [1, 2]" :key="p" class="player" :class="{ 'is-turn': phase === 'playing' && turn === p && !roundOver }">
          <span class="h-6 w-6 rounded-full" :style="{ background: COLORS[p] }" />
          <span class="min-w-0 flex-1 truncate text-sm font-bold text-bark-600">{{ names[p] }}</span>
          <span class="font-display text-2xl font-semibold tabular-nums text-bark-600">{{ wins[p] }}</span>
        </div>
      </div>
      <p class="mt-2 h-5 text-sm font-bold text-bark-500">
        {{ roundOver || (thinking ? `${pip.plantName} is thinking…` : vsPip ? (turn === 1 ? 'Your turn: tap a column' : '') : `${names[turn]}’s turn`) }}
      </p>

      <div class="wall mt-3">
        <button v-for="c in COLS" :key="c" type="button" class="col" :disabled="!myTurn" data-sound="none" :aria-label="`Column ${c}`" @click="tapColumn(c - 1)">
          <span v-for="r in ROWS" :key="r" class="hole">
            <span
              v-if="board[c - 1]?.[ROWS - r] !== undefined"
              class="seed"
              :class="{ 'is-win': winLine.includes(`${c - 1},${ROWS - r}`), 'is-last': last && last.c === c - 1 && last.r === ROWS - r }"
              :style="{ background: COLORS[board[c - 1][ROWS - r]], '--fall': `${-(r + 1) * 115}%` }"
            />
          </span>
        </button>
      </div>
    </div>

    <GameResults
      v-if="phase === 'done' && results"
      :success="results.winner !== 2 || !vsPip"
      eyebrow="Seed Drop"
      :title="results.title"
      :stats="[{ label: names[1], value: wins[1] }, { label: names[2], value: wins[2] }]"
      :petals="results.petals"
      has-levels
      levels-label="Change players"
      @again="startMatch"
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
  transition: border-color 0.2s ease;
}
.player.is-turn {
  border-color: var(--color-leaf-400);
}
.wall {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3%;
  width: min(100%, 24rem, calc((100dvh - 15rem) * 7 / 6));
  aspect-ratio: 7 / 6.3;
  padding: 3%;
  border-radius: 1.4rem;
  background: linear-gradient(180deg, #c49a6c, #a77a57);
  box-shadow: inset 0 -6px 0 rgb(90 60 40 / 0.25), 0 16px 30px -18px rgb(58 45 35 / 0.8);
}
.col {
  display: flex;
  flex-direction: column;
  gap: 6%;
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}
.col:not(:disabled):active {
  background: rgb(255 255 255 / 0.12);
}
.hole {
  position: relative;
  flex: 1;
  border-radius: 999px;
  background: #7a5a3f;
  box-shadow: inset 0 3px 4px rgb(0 0 0 / 0.3);
}
.seed {
  position: absolute;
  inset: 6%;
  border-radius: 999px;
  box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.15), inset 0 3px 0 rgb(255 255 255 / 0.3);
}
.seed.is-last {
  animation: fall 0.35s cubic-bezier(0.5, 0, 0.75, 0) both, land 0.25s 0.35s ease-out;
}
.seed.is-win {
  animation: win 0.9s ease-in-out infinite;
  box-shadow: 0 0 0 3px #fff, inset 0 -3px 0 rgb(0 0 0 / 0.15);
}
@keyframes fall {
  from { transform: translateY(var(--fall)); }
}
@keyframes land {
  50% { transform: scale(1.06, 0.92); }
}
@keyframes win {
  50% { transform: scale(0.86); }
}
</style>
