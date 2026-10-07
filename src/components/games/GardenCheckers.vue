<script setup>
// Garden Checkers: ladybirds against beetles, by the classic rules. Jumps are a must,
// keep hopping while you can, and reach the far side to be crowned. Play Pip or a friend.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { CHECKERS_REWARDS } from '@/data/games'
import { startBoard, legalMoves, applyMove, chooseMove, countPieces, N } from '@/utils/checkersEngine'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import Pip from '../Pip.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const LEVELS = {
  easy: { label: 'Easy', depth: 1, noise: 0.35 },
  medium: { label: 'Medium', depth: 3, noise: 0.08 },
  hard: { label: 'Hard', depth: 7, noise: 0 },
}
const DRAW_AFTER = 50 // moves in a row with no jumps

const mode = ref('pip')
const difficulty = ref('medium')
const phase = ref('setup') // setup | playing | done
const board = ref(startBoard())
const ids = ref([]) // a steady id per piece so moves can animate
const turn = ref(1)
const selected = ref(-1)
const steps = ref([]) // squares hopped to so far in this move
const lastMove = ref(null)
const thinking = ref(false)
const quiet = ref(0)
const results = ref(null)
const pipRef = ref(null)

const vsPip = computed(() => mode.value === 'pip')
const names = computed(() => (vsPip.value ? { 1: 'You', '-1': pip.plantName } : { 1: 'Ladybirds', '-1': 'Beetles' }))
const moves = computed(() => (phase.value === 'playing' ? legalMoves(board.value, turn.value) : []))
const mustJump = computed(() => moves.value[0]?.caps.length > 0)
const myTurn = computed(() => phase.value === 'playing' && !thinking.value && (!vsPip.value || turn.value === 1))
const movable = computed(() => new Set(myTurn.value ? moves.value.map((m) => m.from) : []))
const candidates = computed(() =>
  selected.value < 0 ? [] : moves.value.filter((m) => m.from === selected.value && steps.value.every((s, i) => m.path[i] === s)),
)
const targets = computed(() => new Set(candidates.value.map((m) => m.path[steps.value.length]).filter((s) => s !== undefined)))
const counts = computed(() => countPieces(board.value))
const status = computed(() => {
  if (thinking.value) return `${pip.plantName} is thinking…`
  if (phase.value !== 'playing') return ''
  const who = vsPip.value ? 'Your turn' : `${names.value[turn.value]}, your turn`
  if (steps.value.length) return 'Keep hopping!'
  return mustJump.value ? `${who}. You must jump!` : who
})
// where each piece is drawn: during a multi hop, the moving piece sits on its latest square
const pieces = computed(() => {
  const out = []
  board.value.forEach((p, i) => {
    if (!p) return
    const sq = i === selected.value && steps.value.length ? steps.value[steps.value.length - 1] : i
    out.push({ id: ids.value[i], p, sq })
  })
  return out
})
const hoppedOver = computed(() => {
  if (!steps.value.length) return new Set()
  const m = candidates.value[0]
  return new Set(m ? m.caps.slice(0, steps.value.length) : [])
})

function resetIds() {
  let n = 0
  ids.value = board.value.map((p) => (p ? ++n : 0))
}

const timers = new Set()
function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function startGame() {
  board.value = startBoard()
  resetIds()
  turn.value = 1
  selected.value = -1
  steps.value = []
  lastMove.value = null
  quiet.value = 0
  results.value = null
  phase.value = 'playing'
}

function tapSquare(i) {
  if (!myTurn.value) return
  if (movable.value.has(i) && !steps.value.length) {
    selected.value = selected.value === i ? -1 : i
    playSound(selected.value >= 0 ? 'select' : 'tap')
    return
  }
  if (selected.value >= 0 && targets.value.has(i)) {
    steps.value = [...steps.value, i]
    const done = candidates.value.find((m) => m.path.length === steps.value.length)
    if (done) return commit(done)
    // a multi hop: one hop at a time
    playSound('place', true, { high: turn.value < 0 })
    haptic('light')
    return
  }
  if (Math.sign(board.value[i]) === turn.value && !steps.value.length) {
    playSound('miss')
    if (mustJump.value) flashMust()
  }
}

const mustFlash = ref(false)
function flashMust() {
  mustFlash.value = true
  later(() => (mustFlash.value = false), 700)
}

function commit(move) {
  const piece = board.value[move.from]
  const nextIds = [...ids.value]
  const id = nextIds[move.from]
  nextIds[move.from] = 0
  for (const c of move.caps) nextIds[c] = 0
  nextIds[move.path[move.path.length - 1]] = id
  board.value = applyMove(board.value, move)
  ids.value = nextIds
  lastMove.value = move
  selected.value = -1
  steps.value = []
  quiet.value = move.caps.length ? 0 : quiet.value + 1
  const crowned = Math.abs(board.value[move.path[move.path.length - 1]]) === 2 && Math.abs(piece) === 1
  if (crowned) {
    playSound('levelUp')
    haptic('success')
  } else if (move.caps.length) {
    playSound('pop', true, { count: move.caps.length * 2 })
    haptic('soft')
  } else {
    playSound('place', true, { high: turn.value < 0 })
    haptic('light')
  }
  turn.value = -turn.value
  if (checkEnd()) return
  if (vsPip.value && turn.value === -1) pipTurn()
}

function pipTurn() {
  thinking.value = true
  later(() => {
    const lvl = LEVELS[difficulty.value]
    const move = chooseMove(board.value, -1, { depth: lvl.depth, noise: lvl.noise, timeMs: 650 })
    thinking.value = false
    if (move && phase.value === 'playing') commit(move)
  }, 380)
}

function checkEnd() {
  const options = legalMoves(board.value, turn.value)
  if (!options.length) {
    later(() => endGame(-turn.value), 500)
    phase.value = 'ending'
    return true
  }
  if (quiet.value >= DRAW_AFTER) {
    later(() => endGame(0), 500)
    phase.value = 'ending'
    return true
  }
  return false
}

function endGame(winner) {
  phase.value = 'done'
  let petals = 0
  let title
  let subtitle = ''
  if (vsPip.value) {
    if (winner === 1) {
      petals = CHECKERS_REWARDS[difficulty.value]
      title = difficulty.value === 'hard' ? 'You beat Pip on Hard!' : `You beat ${pip.plantName}!`
      pipRef.value?.react('wiggle')
    } else if (winner === 0) {
      petals = CHECKERS_REWARDS.draw
      title = 'A draw'
      subtitle = `${DRAW_AFTER} moves with no jumps.`
    } else {
      title = `${pip.plantName}’s beetles win`
      subtitle = 'Try keeping your back row safe for longer.'
      pipRef.value?.react('happy')
    }
  } else {
    petals = 1
    title = winner ? `${names.value[winner]} win!` : 'A draw'
    subtitle = 'Good game, both of you'
  }
  const note = vsPip.value && winner === 1 && difficulty.value === 'hard' ? `Beat ${pip.plantName} at Garden Checkers on Hard` : null
  const earned = pip.finishRound('checkers', petals, note)
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

const sqStyle = (sq) => ({ transform: `translate(${(sq % N) * 100}%, ${Math.floor(sq / N) * 100}%)` })
const dark = (i) => (Math.floor(i / N) + (i % N)) % 2 === 1
const lastSquares = computed(() => (lastMove.value ? new Set([lastMove.value.from, ...lastMove.value.path]) : new Set()))
</script>

<template>
  <GameShell title="Garden Checkers" track="puzzle" background="linear-gradient(180deg, #F3ECE0 0%, #EAF0DF 100%)" @close="emit('close')">
    <!-- setup -->
    <div v-if="phase === 'setup'" class="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div class="mx-auto mt-2 flex w-full max-w-sm flex-col gap-5">
        <div class="flex items-center justify-center gap-5 py-2">
          <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-soft">
            <svg viewBox="-20 -20 40 40" class="h-11 w-11"><use x="-20" y="-20" width="40" height="40" href="#ck-ladybird" /></svg>
          </span>
          <span class="font-display text-lg font-semibold text-bark-400">vs</span>
          <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-soft">
            <svg viewBox="-20 -20 40 40" class="h-11 w-11"><use x="-20" y="-20" width="40" height="40" href="#ck-beetle" /></svg>
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
            <button v-for="(l, id) in LEVELS" :key="id" type="button" role="tab" class="flex-1" :aria-selected="difficulty === id" @click="difficulty = id">
              {{ l.label }}
            </button>
          </div>
          <p class="mt-2 text-xs font-semibold text-bark-400">
            Win for <b class="text-petal-500">{{ CHECKERS_REWARDS[difficulty] }} petals</b>.
            <template v-if="difficulty === 'hard'"> {{ pip.plantName }} looks several moves ahead. Good luck!</template>
          </p>
        </section>

        <ul class="space-y-1.5 rounded-2xl bg-surface p-4 text-sm font-semibold text-bark-500 shadow-soft">
          <li>• Move diagonally forward, one square at a time.</li>
          <li>• Jump over a beetle to capture it. If you can jump, you must.</li>
          <li>• Keep hopping while you can.</li>
          <li>• Reach the far side to be crowned. Crowned bugs move both ways.</li>
        </ul>

        <button type="button" class="btn btn-primary w-full" @click="startGame">Start game</button>
      </div>
    </div>

    <!-- the game -->
    <div v-else class="flex flex-1 flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="mt-1 flex w-full max-w-md items-stretch gap-2.5">
        <div class="player" :class="{ 'is-turn': turn === 1 && phase === 'playing' }">
          <svg viewBox="-20 -20 40 40" class="h-7 w-7 shrink-0"><use x="-20" y="-20" width="40" height="40" href="#ck-ladybird" /></svg>
          <span class="min-w-0 flex-1 truncate text-sm font-bold text-bark-600">{{ names[1] }}</span>
          <span class="font-display text-xl font-semibold tabular-nums text-bark-600">{{ counts.mine }}</span>
        </div>
        <div class="player" :class="{ 'is-turn': turn === -1 && phase === 'playing' }">
          <span class="font-display text-xl font-semibold tabular-nums text-bark-600">{{ counts.theirs }}</span>
          <span class="min-w-0 flex-1 truncate text-right text-sm font-bold text-bark-600">{{ names[-1] }}</span>
          <span v-if="vsPip" class="relative -my-2 h-10 w-8 shrink-0">
            <Pip
              ref="pipRef"
              :growth="pip.growthValue"
              :droop="0"
              health="healthy"
              :pot="pip.currentPot"
              :leaf="pip.currentLeaf"
              :flower="pip.currentFlower"
              :accessory="pip.currentAccessory"
              :interactive="false"
              :idle="thinking"
              class="h-full w-full"
            />
          </span>
          <svg v-else viewBox="-20 -20 40 40" class="h-7 w-7 shrink-0"><use x="-20" y="-20" width="40" height="40" href="#ck-beetle" /></svg>
        </div>
      </div>

      <p class="mt-3 h-7 font-display text-lg font-semibold text-bark-600" :class="{ thinking, 'text-clay-400!': mustFlash }">{{ status }}</p>

      <div class="flex w-full flex-1 items-center justify-center py-2">
        <div class="board relative aspect-square w-full max-w-[26rem]" :class="{ 'is-flipped': !vsPip && turn === -1 }">
          <div class="absolute inset-0 grid grid-cols-8 grid-rows-8">
            <button
              v-for="i in 64"
              :key="i"
              type="button"
              data-sound="none"
              class="square relative"
              :class="{
                dark: dark(i - 1),
                'is-last': lastSquares.has(i - 1),
                'is-target': targets.has(i - 1),
                'is-movable': movable.has(i - 1) && selected < 0,
                'is-selected': selected === i - 1,
              }"
              :aria-label="`Square ${i}`"
              @click="tapSquare(i - 1)"
            >
              <span v-if="targets.has(i - 1)" class="dot" />
            </button>
          </div>
          <div
            v-for="pc in pieces"
            :key="pc.id"
            class="piece pointer-events-none absolute left-0 top-0 flex h-[12.5%] w-[12.5%] items-center justify-center"
            :class="{ 'is-gone': hoppedOver.has(pc.sq) }"
            :style="sqStyle(pc.sq)"
          >
            <svg viewBox="-20 -20 40 40" class="h-[86%] w-[86%] overflow-visible" :class="{ lifted: pc.sq === (steps.length ? steps[steps.length - 1] : selected) }">
              <use x="-20" y="-20" width="40" height="40" :href="pc.p > 0 ? '#ck-ladybird' : '#ck-beetle'" />
              <use x="-20" y="-20" width="40" height="40" v-if="Math.abs(pc.p) === 2" href="#ck-crown" />
            </svg>
          </div>
        </div>
      </div>

      <button v-if="phase === 'playing'" type="button" class="btn btn-ghost btn-sm" @click="backToSetup">New game</button>
    </div>

    <GameResults
      v-if="results"
      :eyebrow="vsPip ? `Garden Checkers · ${LEVELS[difficulty].label}` : 'Garden Checkers'"
      :success="results.winner !== -1 || !vsPip"
      :title="results.title"
      :subtitle="results.subtitle"
      :stats="[
        { label: names[1], value: counts.mine },
        { label: names[-1], value: counts.theirs },
      ]"
      :petals="results.petals"
      has-levels
      levels-label="Settings"
      @again="startGame"
      @levels="backToSetup"
      @close="emit('close')"
    />

    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <radialGradient id="ck-red" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#F08C7C" /><stop offset="1" stop-color="#C73A2D" /></radialGradient>
        <radialGradient id="ck-teal" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#5DB3A8" /><stop offset="1" stop-color="#1F5E58" /></radialGradient>
        <symbol id="ck-ladybird" viewBox="-20 -20 40 40" overflow="visible">
          <circle r="17" fill="#000" opacity="0.18" cy="2" />
          <circle cx="0" cy="-12" r="6.5" fill="#2E2219" />
          <circle r="16" fill="url(#ck-red)" />
          <path d="M0 -16 V16" stroke="#2E2219" stroke-width="1.8" />
          <circle cx="-7.5" cy="-5" r="3" fill="#2E2219" /><circle cx="7.5" cy="-5" r="3" fill="#2E2219" />
          <circle cx="-6.5" cy="6" r="2.6" fill="#2E2219" /><circle cx="6.5" cy="6" r="2.6" fill="#2E2219" />
          <ellipse cx="-7" cy="-10" rx="3.2" ry="1.8" fill="#fff" opacity="0.45" transform="rotate(-30 -7 -10)" />
        </symbol>
        <symbol id="ck-beetle" viewBox="-20 -20 40 40" overflow="visible">
          <circle r="17" fill="#000" opacity="0.18" cy="2" />
          <ellipse cx="0" cy="12" rx="7" ry="5.5" fill="#173B37" />
          <circle r="16" fill="url(#ck-teal)" />
          <path d="M0 -16 V16" stroke="#173B37" stroke-width="1.8" />
          <ellipse cx="-6" cy="-6" rx="3.4" ry="6" fill="#B4ECE2" opacity="0.4" />
        </symbol>
        <symbol id="ck-crown" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M-9 4 L-10 -6 L-4.5 -1.5 L0 -9 L4.5 -1.5 L10 -6 L9 4Z" fill="#F6CF6E" stroke="#C9952F" stroke-width="1.4" stroke-linejoin="round" />
          <circle cx="0" cy="-9" r="1.6" fill="#fff" />
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
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.option.is-on {
  border-color: var(--color-leaf-400);
  box-shadow: 0 0 0 3px rgb(134 173 114 / 0.22);
}
.player {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 1.1rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-line);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.player.is-turn {
  border-color: var(--color-honey-400);
  box-shadow: 0 0 0 3px rgb(242 198 107 / 0.25);
}
.board {
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 0 0 7px #B08A63, 0 0 0 9px #9A764F, 0 18px 34px -18px rgb(58 45 35 / 0.7);
  transition: transform 0.6s cubic-bezier(0.5, 0, 0.3, 1);
}
.board.is-flipped {
  transform: rotate(180deg);
}
.board.is-flipped .piece svg {
  transform: rotate(180deg);
}
.square {
  background: #F3E6CF;
  -webkit-tap-highlight-color: transparent;
}
.square.dark {
  background: #8FB07A;
}
.square.dark.is-last {
  background: #A6C38F;
}
.square.is-movable::after {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.6);
}
.square.is-selected {
  background: #C9DE9F !important;
}
.dot {
  position: absolute;
  inset: 34%;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.85);
  box-shadow: 0 0 0 4px rgb(255 255 255 / 0.3);
  animation: pulse 1s ease-in-out infinite alternate;
}
@keyframes pulse {
  to { transform: scale(1.2); }
}
.piece {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}
.piece.is-gone {
  opacity: 0.35;
}
.piece svg {
  transition: transform 0.2s ease;
}
.piece svg.lifted {
  transform: scale(1.14) translateY(-6%);
  filter: drop-shadow(0 4px 4px rgb(58 45 35 / 0.35));
}
.board.is-flipped .piece svg.lifted {
  transform: rotate(180deg) scale(1.14) translateY(-6%);
}
.thinking {
  animation: breathe 1.2s ease-in-out infinite;
}
@keyframes breathe {
  50% { opacity: 0.55; }
}
</style>
