<script setup>
// Garden Tac Toe: sprouts against blossoms. Play Pip (easy, medium or hard) or pass the
// phone to a friend. Classic 3x3, or a big 5x5 board where you need four in a row.
// A match is five rounds at most: the first to three round wins takes it.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { TAC_REWARDS } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import Pip from '../Pip.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const ROUNDS = 5
const TO_WIN = 3
const BOARDS = {
  small: { n: 3, k: 3, label: 'Classic', sub: '3 in a row' },
  big: { n: 5, k: 4, label: 'Big board', sub: '4 in a row' },
}
const LEVELS = {
  easy: { label: 'Easy', random: 0.5, depth: { small: 1, big: 1 } },
  medium: { label: 'Medium', random: 0.12, depth: { small: 3, big: 2 } },
  hard: { label: 'Hard', random: 0, depth: { small: 9, big: 4 } },
}

// ---- setup ----
const mode = ref('pip') // pip | friend
const difficulty = ref('medium')
const boardSize = ref('small')

// ---- match state ----
const phase = ref('setup') // setup | playing | roundEnd | done
const board = ref([])
const turn = ref(1) // 1 = sprouts (you / player 1), 2 = blossoms (Pip / player 2)
const starter = ref(1)
const wins = ref({ 1: 0, 2: 0 })
const draws = ref(0)
const round = ref(1)
const winLine = ref(null)
const lastMove = ref(-1)
const thinking = ref(false)
const banner = ref('')
const results = ref(null)
const pipRef = ref(null)

const cfg = computed(() => BOARDS[boardSize.value])
const vsPip = computed(() => mode.value === 'pip')
const names = computed(() => (vsPip.value ? { 1: 'You', 2: pip.plantName } : { 1: 'Sprouts', 2: 'Blossoms' }))
const yourTurn = computed(() => phase.value === 'playing' && !thinking.value && (!vsPip.value || turn.value === 1))
const status = computed(() => {
  if (phase.value !== 'playing') return banner.value
  if (thinking.value) return `${pip.plantName} is thinking…`
  if (vsPip.value) return 'Your turn'
  return `${names.value[turn.value]}’ turn`
})

// every line of k cells on an n x n board
const linesCache = {}
function lines(n, k) {
  const key = `${n}-${k}`
  if (linesCache[key]) return linesCache[key]
  const out = []
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      for (const [dr, dc] of dirs) {
        const er = r + dr * (k - 1)
        const ec = c + dc * (k - 1)
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue
        out.push(Array.from({ length: k }, (_, i) => (r + dr * i) * n + c + dc * i))
      }
  return (linesCache[key] = out)
}

function winnerOf(b, n, k) {
  for (const line of lines(n, k)) {
    const v = b[line[0]]
    if (v && line.every((i) => b[i] === v)) return { player: v, line }
  }
  return null
}

// ---- Pip's brain ----
// Negamax with alpha-beta. Full depth on 3x3 (unbeatable on hard); on 5x5 it looks a few
// moves ahead and scores every open window of four.
const WINDOW = [0, 1, 8, 60, 0]

function evaluate(b, me, n, k) {
  const them = 3 - me
  let score = 0
  for (const line of lines(n, k)) {
    let mine = 0
    let theirs = 0
    for (const i of line) {
      if (b[i] === me) mine++
      else if (b[i] === them) theirs++
    }
    if (mine && !theirs) score += WINDOW[mine]
    else if (theirs && !mine) score -= WINDOW[theirs] * 1.15
  }
  // a little love for the middle
  const mid = (n - 1) / 2
  b.forEach((v, i) => {
    if (!v) return
    const d = Math.abs(Math.floor(i / n) - mid) + Math.abs((i % n) - mid)
    score += (v === me ? 1 : -1) * (n - d) * 0.3
  })
  return score
}

function candidates(b, n) {
  const empty = []
  const filled = b.some(Boolean)
  const mid = (n - 1) / 2
  for (let i = 0; i < b.length; i++) {
    if (b[i]) continue
    if (n > 3 && filled) {
      // only cells next to something already on the board
      const r = Math.floor(i / n)
      const c = i % n
      let near = false
      for (let dr = -1; dr <= 1 && !near; dr++)
        for (let dc = -1; dc <= 1 && !near; dc++) {
          const rr = r + dr
          const cc = c + dc
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && b[rr * n + cc]) near = true
        }
      if (!near) continue
    }
    empty.push(i)
  }
  const dist = (i) => Math.abs(Math.floor(i / n) - mid) + Math.abs((i % n) - mid)
  return empty.sort((a, z) => dist(a) - dist(z))
}

const WIN = 100000

function negamax(b, player, depth, alpha, beta, ply, n, k) {
  const w = winnerOf(b, n, k)
  if (w) return w.player === player ? WIN - ply : -(WIN - ply)
  const moves = candidates(b, n)
  if (!moves.length) return 0
  if (depth === 0) return evaluate(b, player, n, k)
  let best = -Infinity
  for (const m of moves) {
    b[m] = player
    const v = -negamax(b, 3 - player, depth - 1, -beta, -alpha, ply + 1, n, k)
    b[m] = 0
    if (v > best) best = v
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

function pipMove(b, player) {
  const { n, k } = cfg.value
  const lvl = LEVELS[difficulty.value]
  const moves = candidates(b, n)
  const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
  if (Math.random() < lvl.random) return empty[Math.floor(Math.random() * empty.length)]
  const depth = lvl.depth[boardSize.value]
  const work = [...b]
  let best = -Infinity
  let picks = []
  for (const m of moves) {
    work[m] = player
    const v = -negamax(work, 3 - player, depth - 1, -Infinity, Infinity, 1, n, k)
    work[m] = 0
    if (v > best + 0.5) {
      best = v
      picks = [m]
    } else if (Math.abs(v - best) <= 0.5) picks.push(m)
  }
  return picks[Math.floor(Math.random() * picks.length)] ?? empty[0]
}

// ---- flow ----
const timers = new Set()
function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function startMatch() {
  wins.value = { 1: 0, 2: 0 }
  draws.value = 0
  round.value = 1
  starter.value = 1
  results.value = null
  startRound()
}

function startRound() {
  const { n } = cfg.value
  board.value = Array(n * n).fill(0)
  winLine.value = null
  lastMove.value = -1
  turn.value = starter.value
  banner.value = ''
  phase.value = 'playing'
  if (vsPip.value && turn.value === 2) pipTurn()
}

function tapCell(i) {
  if (!yourTurn.value || board.value[i]) return
  place(i)
}

function place(i) {
  const b = [...board.value]
  b[i] = turn.value
  board.value = b
  lastMove.value = i
  playSound('place', true, { high: turn.value === 2 })
  haptic('light')
  const { n, k } = cfg.value
  const w = winnerOf(b, n, k)
  if (w) return endRound(w.player, w.line)
  if (b.every(Boolean)) return endRound(0)
  turn.value = 3 - turn.value
  if (vsPip.value && turn.value === 2) pipTurn()
}

function pipTurn() {
  thinking.value = true
  later(() => {
    const move = pipMove(board.value, 2)
    thinking.value = false
    if (phase.value === 'playing') place(move)
  }, 450 + Math.random() * 450)
}

function endRound(winner, line = null) {
  phase.value = 'roundEnd'
  winLine.value = line
  if (winner) wins.value = { ...wins.value, [winner]: wins.value[winner] + 1 }
  else draws.value += 1

  if (!winner) {
    banner.value = 'A draw. Nobody grew a row.'
    playSound('miss')
  } else if (vsPip.value) {
    banner.value = winner === 1 ? 'You win the round!' : `${pip.plantName} wins the round`
    playSound(winner === 1 ? 'match' : 'oops')
    pipRef.value?.react(winner === 1 ? 'wiggle' : 'happy')
  } else {
    banner.value = `${names.value[winner]} win the round!`
    playSound('match')
  }
  haptic(winner === 1 || !vsPip.value ? 'success' : 'light')

  const over = wins.value[1] >= TO_WIN || wins.value[2] >= TO_WIN || round.value >= ROUNDS
  later(() => {
    if (over) return endMatch()
    round.value += 1
    starter.value = 3 - starter.value // take turns going first
    startRound()
  }, 1500)
}

function endMatch() {
  phase.value = 'done'
  const a = wins.value[1]
  const b = wins.value[2]
  const winner = a > b ? 1 : b > a ? 2 : 0
  let petals = 0
  let title
  let subtitle
  if (vsPip.value) {
    const big = boardSize.value === 'big'
    if (winner === 1) {
      petals = TAC_REWARDS[difficulty.value] + (big ? 2 : 0)
      title = difficulty.value === 'hard' ? 'You beat Pip on Hard!' : `You beat ${pip.plantName}!`
    } else if (winner === 0) {
      petals = difficulty.value === 'hard' ? TAC_REWARDS.hardDraw : 1
      title = 'A tied match'
    } else {
      title = `${pip.plantName} wins this one`
    }
    subtitle = `${LEVELS[difficulty.value].label}, ${cfg.value.label.toLowerCase()}`
    if (difficulty.value === 'hard' && boardSize.value === 'small' && winner !== 2) subtitle = 'On Hard, a draw is the best anyone can do. Well played!'
  } else {
    petals = 1
    title = winner ? `${names.value[winner]} win the match!` : 'A tied match'
    subtitle = 'Good game, both of you'
  }
  const note = vsPip.value && winner === 1 && difficulty.value === 'hard' ? `Beat ${pip.plantName} at Garden Tac Toe on Hard` : null
  const earned = pip.finishRound('tac', petals, note)
  results.value = { winner, title, subtitle, petals: earned }
}

function backToSetup() {
  timers.forEach(clearTimeout)
  timers.clear()
  thinking.value = false
  results.value = null
  phase.value = 'setup'
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <GameShell title="Garden Tac Toe" track="puzzle" background="linear-gradient(180deg, #EEF3E6 0%, #F7F1E8 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase !== 'setup'" class="chip tabular-nums">Round {{ round }} / {{ ROUNDS }}</span>
    </template>

    <!-- setup -->
    <div v-if="phase === 'setup'" class="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div class="mx-auto mt-2 flex w-full max-w-sm flex-col gap-5">
        <div class="flex items-center justify-center gap-5 py-2">
          <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-soft">
            <svg viewBox="-20 -20 40 40" class="h-11 w-11"><use x="-20" y="-20" width="40" height="40" href="#tac-sprout" /></svg>
          </span>
          <span class="font-display text-lg font-semibold text-bark-400">vs</span>
          <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-soft">
            <svg viewBox="-20 -20 40 40" class="h-11 w-11"><use x="-20" y="-20" width="40" height="40" href="#tac-blossom" /></svg>
          </span>
        </div>

        <section>
          <p class="eyebrow mb-2">Who are you playing?</p>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="m in [
                { id: 'pip', title: `Play ${pip.plantName}`, sub: 'One player' },
                { id: 'friend', title: 'Play a friend', sub: 'Pass the phone' },
              ]"
              :key="m.id"
              type="button"
              class="option"
              :class="{ 'is-on': mode === m.id }"
              data-sound="select"
              @click="mode = m.id"
            >
              <span class="font-display text-base font-semibold text-bark-600">{{ m.title }}</span>
              <span class="text-xs font-semibold text-bark-400">{{ m.sub }}</span>
            </button>
          </div>
        </section>

        <section v-if="mode === 'pip'">
          <p class="eyebrow mb-2">How tough is {{ pip.plantName }}?</p>
          <div class="segmented" role="tablist">
            <button
              v-for="(l, id) in LEVELS"
              :key="id"
              type="button"
              role="tab"
              class="flex-1"
              :aria-selected="difficulty === id"
              @click="difficulty = id"
            >
              {{ l.label }}
            </button>
          </div>
          <p class="mt-2 text-xs font-semibold text-bark-400">
            Win the match for
            <b class="text-petal-500">{{ TAC_REWARDS[difficulty] + (boardSize === 'big' ? 2 : 0) }} petals</b>.
            <template v-if="difficulty === 'hard' && boardSize === 'small'"> On Hard 3×3, {{ pip.plantName }} never loses. Can you hold a draw?</template>
          </p>
        </section>

        <section>
          <p class="eyebrow mb-2">Board</p>
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="(b, id) in BOARDS"
              :key="id"
              type="button"
              class="option"
              :class="{ 'is-on': boardSize === id }"
              data-sound="select"
              @click="boardSize = id"
            >
              <span class="mini" :style="{ gridTemplateColumns: `repeat(${b.n}, 1fr)` }">
                <i v-for="c in b.n * b.n" :key="c" />
              </span>
              <span class="font-display text-base font-semibold text-bark-600">{{ b.label }}</span>
              <span class="text-xs font-semibold text-bark-400">{{ b.sub }}</span>
            </button>
          </div>
        </section>

        <p class="text-center text-xs font-semibold text-bark-400">Up to {{ ROUNDS }} rounds. First to {{ TO_WIN }} wins the match.</p>
        <button type="button" class="btn btn-primary w-full" @click="startMatch">Start match</button>
      </div>
    </div>

    <!-- the match -->
    <div v-else class="flex flex-1 flex-col items-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div class="mt-1 flex w-full max-w-sm items-stretch gap-2.5">
        <div class="player" :class="{ 'is-turn': phase === 'playing' && turn === 1 }">
          <svg viewBox="-20 -20 40 40" class="h-8 w-8 shrink-0"><use x="-20" y="-20" width="40" height="40" href="#tac-sprout" /></svg>
          <span class="min-w-0 flex-1 truncate text-sm font-bold text-bark-600">{{ names[1] }}</span>
          <span class="font-display text-2xl font-semibold tabular-nums text-bark-600">{{ wins[1] }}</span>
        </div>
        <div class="player" :class="{ 'is-turn': phase === 'playing' && turn === 2 }">
          <span class="font-display text-2xl font-semibold tabular-nums text-bark-600">{{ wins[2] }}</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm font-bold text-bark-600">{{ names[2] }}</span>
          <span v-if="vsPip" class="relative -my-2 h-11 w-9 shrink-0">
            <Pip
              ref="pipRef"
              :growth="pip.growthValue"
              :droop="0"
              health="healthy"
              :pot="pip.currentPot"
              :leaf="pip.currentLeaf"
              :flower="pip.currentFlower"
              :interactive="false"
              :idle="thinking"
              class="h-full w-full"
            />
          </span>
          <svg v-else viewBox="-20 -20 40 40" class="h-8 w-8 shrink-0"><use x="-20" y="-20" width="40" height="40" href="#tac-blossom" /></svg>
        </div>
      </div>

      <Transition name="fade" mode="out-in">
        <p :key="status" class="mt-4 h-7 font-display text-xl font-semibold text-bark-600" :class="{ thinking }">{{ status }}</p>
      </Transition>

      <div class="flex w-full flex-1 items-center justify-center py-3">
        <div
          class="board relative grid w-full max-w-[22rem]"
          :class="cfg.n === 3 ? 'gap-2.5 p-2.5' : 'gap-1.5 p-2'"
          :style="{ gridTemplateColumns: `repeat(${cfg.n}, minmax(0, 1fr))` }"
        >
          <button
            v-for="(v, i) in board"
            :key="i"
            type="button"
            data-sound="none"
            class="cell"
            :class="{
              'is-win': winLine?.includes(i),
              'is-dim': winLine && !winLine.includes(i),
              'can-tap': yourTurn && !v,
              'rounded-2xl': cfg.n === 3,
              'rounded-xl': cfg.n > 3,
            }"
            :aria-label="v ? (v === 1 ? 'Sprout' : 'Blossom') : `Empty, row ${Math.floor(i / cfg.n) + 1} column ${(i % cfg.n) + 1}`"
            @click="tapCell(i)"
          >
            <svg v-if="v" viewBox="-20 -20 40 40" class="piece h-[74%] w-[74%]" :class="{ 'is-new': i === lastMove }">
              <use x="-20" y="-20" width="40" height="40" :href="v === 1 ? '#tac-sprout' : '#tac-blossom'" />
            </svg>
            <svg
              v-else-if="yourTurn"
              viewBox="-20 -20 40 40"
              class="ghost h-[74%] w-[74%]"
            >
              <use x="-20" y="-20" width="40" height="40" :href="turn === 1 ? '#tac-sprout' : '#tac-blossom'" />
            </svg>
          </button>
        </div>
      </div>

      <button v-if="phase !== 'done'" type="button" class="btn btn-ghost btn-sm" @click="backToSetup">Change settings</button>
    </div>

    <GameResults
      v-if="results"
      :eyebrow="vsPip ? `Garden Tac Toe · ${LEVELS[difficulty].label}` : 'Garden Tac Toe'"
      :success="results.winner !== 2 || !vsPip"
      :title="results.title"
      :subtitle="results.subtitle"
      :stats="[
        { label: names[1], value: wins[1] },
        { label: 'Draws', value: draws },
        { label: names[2], value: wins[2] },
      ]"
      :petals="results.petals"
      @again="startMatch"
      @levels="backToSetup"
      has-levels
      levels-label="Settings"
      @close="emit('close')"
    />

    <!-- the two pieces, drawn once -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <radialGradient id="tac-petal" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#FBD9DD" />
          <stop offset="1" stop-color="#E48C9C" />
        </radialGradient>
        <linearGradient id="tac-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#A9CB8C" />
          <stop offset="1" stop-color="#5E8A4E" />
        </linearGradient>
        <symbol id="tac-sprout" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M0 15 C0 8 0 2 0 -3" stroke="#5E8A4E" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M0 -2 C-3 -12 -13 -15 -17 -11 C-15 -3 -6 0 0 -2Z" fill="url(#tac-leaf)" />
          <path d="M0 -4 C4 -14 14 -16 17 -11 C14 -4 6 -1 0 -4Z" fill="url(#tac-leaf)" />
          <path d="M-2 -4 C-6 -9 -10 -11 -13 -11" stroke="#fff" stroke-opacity="0.45" stroke-width="1.2" fill="none" stroke-linecap="round" />
          <ellipse cx="0" cy="16" rx="9" ry="2.6" fill="#8C6A4F" opacity="0.35" />
        </symbol>
        <symbol id="tac-blossom" viewBox="-20 -20 40 40" overflow="visible">
          <g>
            <ellipse v-for="a in [0, 72, 144, 216, 288]" :key="a" cx="0" cy="-9" rx="7.4" ry="9.2" :transform="`rotate(${a})`" fill="url(#tac-petal)" />
          </g>
          <circle r="5.6" fill="#F6CF6E" />
          <circle r="5.6" fill="none" stroke="#E3A845" stroke-width="1.2" />
          <circle cx="-1.6" cy="-1.8" r="1.6" fill="#fff" opacity="0.6" />
        </symbol>
      </defs>
    </svg>
  </GameShell>
</template>

<style scoped>
.option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.85rem 0.95rem;
  border-radius: 1.25rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-line);
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}
.option:active {
  transform: scale(0.98);
}
.option.is-on {
  border-color: var(--color-leaf-400);
  box-shadow: 0 0 0 3px rgb(134 173 114 / 0.22);
}
.mini {
  display: grid;
  gap: 2px;
  width: 2.2rem;
  margin-bottom: 0.4rem;
}
.mini i {
  aspect-ratio: 1;
  border-radius: 2px;
  background: var(--color-sand-200);
}
.player {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border-radius: 1.1rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-line);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.player.is-turn {
  border-color: var(--color-honey-400);
  box-shadow: 0 0 0 3px rgb(242 198 107 / 0.25);
  transform: translateY(-1px);
}
.board {
  aspect-ratio: 1;
  border-radius: 1.6rem;
  background: #DCC9AE;
  box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.35), 0 14px 30px -18px rgb(58 45 35 / 0.6);
}
.cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #F9F2E6 0%, #F1E6D4 100%);
  box-shadow: inset 0 -3px 0 rgb(120 90 60 / 0.12);
  transition: transform 0.15s ease, background-color 0.2s ease, opacity 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}
.cell.can-tap:active {
  transform: scale(0.94);
}
.cell.is-win {
  background: linear-gradient(180deg, #FFF6D9 0%, #F7E3A6 100%);
  animation: win-glow 0.9s ease-in-out infinite alternate;
}
.cell.is-dim {
  opacity: 0.55;
}
@keyframes win-glow {
  from { box-shadow: inset 0 -3px 0 rgb(120 90 60 / 0.12), 0 0 0 0 rgb(242 198 107 / 0.6); }
  to { box-shadow: inset 0 -3px 0 rgb(120 90 60 / 0.12), 0 0 0 5px rgb(242 198 107 / 0); }
}
.piece {
  overflow: visible;
}
.piece.is-new {
  animation: plant 0.42s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
@keyframes plant {
  0% { transform: scale(0.2) translateY(30%); opacity: 0; }
  100% { transform: none; opacity: 1; }
}
.ghost {
  opacity: 0;
  transition: opacity 0.15s ease;
}
@media (hover: hover) {
  .cell.can-tap:hover .ghost {
    opacity: 0.28;
  }
}
.thinking {
  animation: breathe 1.2s ease-in-out infinite;
}
@keyframes breathe {
  50% { opacity: 0.55; }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
