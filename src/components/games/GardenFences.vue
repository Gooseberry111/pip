<script setup>
// Garden Fences: take turns adding one fence between two posts. Close the fourth side of a
// square and you plant your flower in it, and go again. Most squares wins.
// Play Pip, or 2 to 4 friends on one phone.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import PlayerSetup from './PlayerSetup.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const REWARDS = { easy: 3, medium: 6, hard: 11 }
const PLAYERS = [
  { name: 'Green', color: '#6FA35B', flower: '🌱' },
  { name: 'Pink', color: '#E05A7A', flower: '🌸' },
  { name: 'Yellow', color: '#E9B54F', flower: '🌼' },
  { name: 'Blue', color: '#5B8FC0', flower: '🪻' },
]
const SIZES = [
  { id: 'small', label: 'Small', sub: '4 by 4 squares', n: 4 },
  { id: 'big', label: 'Big', sub: '5 by 5 squares', n: 5 },
]

const mode = ref('pip')
const level = ref('medium')
const count = ref(2)
const size = ref('small')
const phase = ref('setup')
const n = ref(4)
const h = ref([]) // h[r][c]: fence along the top of square (r, c); r in 0..n
const v = ref([]) // v[r][c]: fence on the left of square (r, c); c in 0..n
const owner = ref([]) // owner[r][c]: player index or -1
const turn = ref(0)
const lastFence = ref('')
const thinking = ref(false)
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
const players = computed(() =>
  vsPip.value ? [{ ...PLAYERS[0], name: 'You' }, { ...PLAYERS[1], name: pip.plantName }] : PLAYERS.slice(0, count.value),
)
const scores = computed(() => players.value.map((_, i) => owner.value.flat().filter((o) => o === i).length))
const myTurn = computed(() => phase.value === 'playing' && !thinking.value && (!vsPip.value || turn.value === 0))

function start() {
  n.value = SIZES.find((s) => s.id === size.value).n
  const N = n.value
  h.value = Array.from({ length: N + 1 }, () => Array(N).fill(-1))
  v.value = Array.from({ length: N }, () => Array(N + 1).fill(-1))
  owner.value = Array.from({ length: N }, () => Array(N).fill(-1))
  turn.value = 0
  lastFence.value = ''
  results.value = null
  phase.value = 'playing'
}

function sides(r, c, H = h.value, V = v.value) {
  return (H[r][c] >= 0) + (H[r + 1][c] >= 0) + (V[r][c] >= 0) + (V[r][c + 1] >= 0)
}

/** Put a fence down. Returns how many squares it closed. */
function place(kind, r, c) {
  const grid = kind === 'h' ? h : v
  if (grid.value[r][c] >= 0) return -1
  const next = grid.value.map((row) => [...row])
  next[r][c] = turn.value
  grid.value = next
  lastFence.value = `${kind}${r},${c}`
  // the squares this fence touches
  const touched = kind === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]]
  let closed = 0
  const own = owner.value.map((row) => [...row])
  for (const [y, x] of touched) {
    if (y < 0 || x < 0 || y >= n.value || x >= n.value) continue
    if (own[y][x] < 0 && sides(y, x) === 4) {
      own[y][x] = turn.value
      closed++
    }
  }
  owner.value = own
  return closed
}

function afterMove(closed) {
  if (closed > 0) {
    playSound('match')
    haptic('success')
  } else {
    playSound('tap')
    turn.value = (turn.value + 1) % players.value.length
  }
  if (owner.value.flat().every((o) => o >= 0)) return later(finish, 600)
  if (vsPip.value && turn.value === 1) later(pipMove, closed ? 450 : 600)
}

function tapFence(kind, r, c) {
  if (!myTurn.value) return
  const closed = place(kind, r, c)
  if (closed < 0) return
  afterMove(closed)
}

// ---- Pip's thinking
function allFences() {
  const out = []
  for (let r = 0; r <= n.value; r++) for (let c = 0; c < n.value; c++) if (h.value[r][c] < 0) out.push(['h', r, c])
  for (let r = 0; r < n.value; r++) for (let c = 0; c <= n.value; c++) if (v.value[r][c] < 0) out.push(['v', r, c])
  return out
}
function squaresOf([kind, r, c]) {
  const t = kind === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]]
  return t.filter(([y, x]) => y >= 0 && x >= 0 && y < n.value && x < n.value)
}
const closes = (f) => squaresOf(f).some(([y, x]) => sides(y, x) === 3)
const gives = (f) => squaresOf(f).some(([y, x]) => sides(y, x) === 2)

// how many squares the other player could then take in a row (a chain), by trying it out
function chainAfter(f) {
  const H = h.value.map((row) => [...row])
  const V = v.value.map((row) => [...row])
  const set = ([k, r, c]) => ((k === 'h' ? H : V)[r][c] = 9)
  set(f)
  let taken = 0
  let again = true
  while (again) {
    again = false
    for (let y = 0; y < n.value; y++)
      for (let x = 0; x < n.value; x++) {
        if (sides(y, x, H, V) === 3) {
          if (H[y][x] < 0) H[y][x] = 9
          else if (H[y + 1][x] < 0) H[y + 1][x] = 9
          else if (V[y][x] < 0) V[y][x] = 9
          else V[y][x + 1] = 9
          taken++
          again = true
        }
      }
  }
  return taken
}

function pipMove() {
  if (phase.value !== 'playing') return
  thinking.value = true
  later(() => {
    const fences = allFences()
    const rand = (list) => list[Math.floor(Math.random() * list.length)]
    let pick
    const closing = fences.filter(closes)
    const safe = fences.filter((f) => !closes(f) && !gives(f))
    if (level.value === 'easy') pick = closing.length && Math.random() < 0.7 ? rand(closing) : rand(Math.random() < 0.6 && safe.length ? safe : fences)
    else if (closing.length) pick = closing[0]
    else if (safe.length) pick = rand(safe)
    else if (level.value === 'hard') {
      // forced to give something away: give the smallest chain
      let best = Infinity
      for (const f of fences) {
        const k = chainAfter(f)
        if (k < best) {
          best = k
          pick = f
        }
      }
    } else pick = rand(fences)
    thinking.value = false
    const closed = place(...pick)
    afterMove(closed)
  }, 250)
}

function finish() {
  phase.value = 'done'
  const best = Math.max(...scores.value)
  const winners = players.value.map((p, i) => i).filter((i) => scores.value[i] === best)
  const winner = winners.length === 1 ? winners[0] : -1
  let petals = 1
  let title = winner >= 0 ? `${players.value[winner].name} ${vsPip.value && winner === 0 ? 'win' : 'wins'}!` : 'It’s a tie!'
  if (vsPip.value) {
    petals = winner === 0 ? REWARDS[level.value] : winner === -1 ? 2 : 0
    if (winner === 1) title = `${pip.plantName} wins this one`
  }
  const earned = pip.finishRound('fences', petals, vsPip.value && winner === 0 && level.value === 'hard' ? `Beat ${pip.plantName} at Garden Fences on Hard` : null)
  results.value = { winner, title, petals: earned }
  playSound(vsPip.value && winner === 1 ? 'lose' : 'win')
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <GameShell title="Garden Fences" track="puzzle" background="linear-gradient(180deg, #F1EBDD 0%, #E6EEDC 100%)" @close="emit('close')">
    <PlayerSetup
      v-if="phase === 'setup'"
      v-model:mode="mode"
      v-model:level="level"
      v-model:players="count"
      v-model:option="size"
      title="Garden Fences"
      blurb="Add one fence a turn. Close a square to plant your flower in it and go again."
      :max-players="4"
      :rewards="REWARDS"
      :extra="SIZES"
      @start="start"
    >
      <template #art><div class="text-4xl">🌱🌸🌼🪻</div></template>
    </PlayerSetup>

    <div v-else class="flex flex-1 flex-col items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="mt-1 grid w-full max-w-sm gap-2" :style="{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }">
        <div v-for="(p, i) in players" :key="i" class="player" :class="{ 'is-turn': phase === 'playing' && turn === i }" :style="{ '--c': p.color }">
          <span class="text-lg">{{ p.flower }}</span>
          <span class="min-w-0 flex-1 truncate text-xs font-bold text-bark-600">{{ p.name }}</span>
          <span class="font-display text-xl font-semibold tabular-nums text-bark-600">{{ scores[i] }}</span>
        </div>
      </div>
      <p class="mt-2 h-5 text-sm font-bold text-bark-500">
        {{ thinking ? `${pip.plantName} is thinking…` : vsPip ? (turn === 0 ? 'Your turn: tap between two posts' : '') : `${players[turn].name}’s turn` }}
      </p>

      <div class="yard mt-3" :style="{ '--n': n }">
        <!-- squares -->
        <template v-for="r in n" :key="`r${r}`">
          <span v-for="c in n" :key="`s${r},${c}`" class="sq" :style="{ gridRow: r * 2, gridColumn: c * 2, background: owner[r - 1][c - 1] >= 0 ? `${players[owner[r - 1][c - 1]].color}33` : undefined }">
            <span v-if="owner[r - 1][c - 1] >= 0" class="plant">{{ players[owner[r - 1][c - 1]].flower }}</span>
          </span>
        </template>
        <!-- posts -->
        <template v-for="r in n + 1" :key="`pr${r}`">
          <span v-for="c in n + 1" :key="`p${r},${c}`" class="post" :style="{ gridRow: r * 2 - 1, gridColumn: c * 2 - 1 }" />
        </template>
        <!-- fences along the rows -->
        <template v-for="r in n + 1" :key="`hr${r}`">
          <button
            v-for="c in n"
            :key="`h${r},${c}`"
            type="button"
            class="fence h"
            :class="{ 'is-set': h[r - 1][c - 1] >= 0, 'is-last': lastFence === `h${r - 1},${c - 1}` }"
            :style="{ gridRow: r * 2 - 1, gridColumn: c * 2, '--c': h[r - 1][c - 1] >= 0 ? players[h[r - 1][c - 1]].color : '#8C6A4F' }"
            data-sound="none"
            :aria-label="`Fence ${r}, ${c}`"
            @click="tapFence('h', r - 1, c - 1)"
          ><i /></button>
        </template>
        <!-- fences down the columns -->
        <template v-for="r in n" :key="`vr${r}`">
          <button
            v-for="c in n + 1"
            :key="`v${r},${c}`"
            type="button"
            class="fence v"
            :class="{ 'is-set': v[r - 1][c - 1] >= 0, 'is-last': lastFence === `v${r - 1},${c - 1}` }"
            :style="{ gridRow: r * 2, gridColumn: c * 2 - 1, '--c': v[r - 1][c - 1] >= 0 ? players[v[r - 1][c - 1]].color : '#8C6A4F' }"
            data-sound="none"
            :aria-label="`Fence ${r}, ${c}`"
            @click="tapFence('v', r - 1, c - 1)"
          ><i /></button>
        </template>
      </div>
    </div>

    <GameResults
      v-if="phase === 'done' && results"
      :success="!vsPip || results.winner !== 1"
      eyebrow="Garden Fences"
      :title="results.title"
      :stats="players.map((p, i) => ({ label: p.name, value: scores[i] }))"
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
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.6rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 2px solid transparent;
  box-shadow: var(--shadow-soft);
}
.player.is-turn {
  border-color: var(--c);
}
.yard {
  display: grid;
  grid-template-columns: repeat(var(--n), 0.9rem 1fr) 0.9rem;
  grid-template-rows: repeat(var(--n), 0.9rem 1fr) 0.9rem;
  width: min(100%, 24rem, calc(100dvh - 15rem));
  aspect-ratio: 1;
  padding: 0.6rem;
  border-radius: 1.4rem;
  background: #a9cc88;
  box-shadow: inset 0 -5px 0 rgb(40 70 30 / 0.2), 0 16px 30px -18px rgb(58 45 35 / 0.7);
}
.sq {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}
.plant {
  font-size: clamp(1.1rem, 6vw, 2rem);
  animation: grow 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes grow {
  from { transform: scale(0.2) translateY(6px); }
}
.post {
  z-index: 2;
  border-radius: 4px;
  background: #8c6a4f;
  box-shadow: 0 2px 0 #6e513b;
}
.fence {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.fence i {
  display: block;
  border-radius: 999px;
  background: var(--c);
  opacity: 0.18;
  transition: opacity 0.2s ease;
}
.fence.h i {
  width: 100%;
  height: 0.38rem;
}
.fence.v i {
  width: 0.38rem;
  height: 100%;
}
.fence:not(.is-set):active i {
  opacity: 0.45;
}
.fence.is-set i {
  opacity: 1;
}
.fence.is-last i {
  animation: fence 0.4s ease;
}
@keyframes fence {
  from { transform: scale(0.4); }
}
/* bigger targets for fingers */
.fence::before {
  content: '';
  position: absolute;
  inset: -0.5rem;
}
</style>
