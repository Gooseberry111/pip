<script setup>
// Vines and Ladders: roll the dice and race your snail up the garden. Land at the foot of a
// ladder to climb it; land on a vine's leafy top and you slide back down. First to square 100
// wins (you need the exact number to land on it). 2 to 4 players on one phone, and Pip can
// join in as a player.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const LADDERS = { 3: 22, 8: 30, 28: 55, 36: 44, 51: 72, 58: 77, 71: 92, 80: 99 }
const VINES = { 17: 4, 32: 10, 48: 26, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 }
const TOKENS = [
  { name: 'Green', color: '#6FA35B' },
  { name: 'Pink', color: '#E05A7A' },
  { name: 'Yellow', color: '#E9B54F' },
  { name: 'Blue', color: '#5B8FC0' },
]
const PIPS = [[], [[50, 50]], [[28, 28], [72, 72]], [[25, 25], [50, 50], [75, 75]], [[28, 28], [72, 28], [28, 72], [72, 72]], [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]]]

const phase = ref('setup')
const people = ref(2)
const withPip = ref(true)
const seats = ref([]) // [{ name, color, pip }]
const pos = ref([])
const turn = ref(0)
const die = ref(1)
const rolling = ref(false)
const moving = ref(false)
const message = ref('')
const results = ref(null)
const timers = new Set()
const later = (fn, ms) =>
  new Promise((resolve) => {
    const t = setTimeout(() => {
      timers.delete(t)
      fn?.()
      resolve()
    }, ms)
    timers.add(t)
  })

const current = computed(() => seats.value[turn.value])
const canRoll = computed(() => phase.value === 'playing' && !rolling.value && !moving.value && !current.value?.pip)

// square n (1..100) to a grid cell, snaking up from the bottom left
function cell(n) {
  const i = n - 1
  const row = Math.floor(i / 10)
  const col = row % 2 ? 9 - (i % 10) : i % 10
  return { x: col, y: 9 - row }
}
const centre = (n) => {
  const { x, y } = cell(n)
  return { x: x * 10 + 5, y: y * 10 + 5 }
}

function start() {
  const list = TOKENS.slice(0, people.value).map((t, i) => ({ ...t, name: people.value === 1 ? 'You' : t.name, pip: false, i }))
  if (withPip.value) list.push({ ...TOKENS[list.length], name: pip.plantName, pip: true })
  seats.value = list
  pos.value = list.map(() => 1)
  turn.value = 0
  message.value = ''
  results.value = null
  phase.value = 'playing'
}

async function roll() {
  if (rolling.value || moving.value || phase.value !== 'playing') return
  rolling.value = true
  playSound('tick')
  for (let k = 0; k < 8; k++) {
    die.value = 1 + Math.floor(Math.random() * 6)
    await later(null, 60)
  }
  die.value = 1 + Math.floor(Math.random() * 6)
  rolling.value = false
  haptic('light')
  await move(die.value)
}

async function move(steps) {
  moving.value = true
  const who = turn.value
  const from = pos.value[who]
  let target = from + steps
  if (target > 100) {
    message.value = `${seats.value[who].name} needs ${100 - from} exactly`
    target = from
  } else message.value = ''
  for (let p = from + 1; p <= target; p++) {
    pos.value = pos.value.map((v, i) => (i === who ? p : v))
    playSound('step', true, { pitch: 1 + (p % 4) * 0.1 })
    await later(null, 170)
  }
  const up = LADDERS[target]
  const down = VINES[target]
  if (up) {
    message.value = `${seats.value[who].name} climbs a ladder!`
    playSound('levelUp')
    await later(null, 250)
    pos.value = pos.value.map((v, i) => (i === who ? up : v))
    await later(null, 500)
  } else if (down) {
    message.value = `Oh no, ${seats.value[who].name} slides down a vine`
    playSound('oops')
    await later(null, 250)
    pos.value = pos.value.map((v, i) => (i === who ? down : v))
    await later(null, 500)
  }
  moving.value = false
  if (pos.value[who] === 100) return finish(who)
  // a six earns another go
  if (steps !== 6) turn.value = (turn.value + 1) % seats.value.length
  else message.value = `A six! ${seats.value[who].name} ${seats.value[who].name === 'You' ? 'roll' : 'rolls'} again`
  if (seats.value[turn.value].pip) later(roll, 700)
}

function finish(who) {
  phase.value = 'done'
  const winner = seats.value[who]
  const humanWon = !winner.pip
  const earned = pip.finishRound('vines', humanWon ? 3 : 1, null)
  results.value = {
    title: winner.pip ? `${pip.plantName} wins the race!` : winner.name === 'You' ? 'You win the race!' : `${winner.name} wins the race!`,
    petals: earned,
    humanWon,
  }
  playSound(humanWon ? 'win' : 'lose')
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <GameShell title="Vines and Ladders" track="race" background="linear-gradient(180deg, #E4EEDC 0%, #F4EAD9 100%)" @close="emit('close')">
    <!-- setup -->
    <div v-if="phase === 'setup'" class="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div class="mx-auto mt-2 flex w-full max-w-sm flex-col gap-5">
        <div class="text-center">
          <div class="text-4xl">🪜🌿🎲</div>
          <h2 class="mt-2 font-display text-2xl font-semibold text-bark-600">Vines and Ladders</h2>
          <p class="mt-1 text-sm font-medium text-bark-400">Roll and race up the garden. Ladders lift you up, vines slide you down. Roll a six to go again.</p>
        </div>
        <section>
          <p class="eyebrow mb-2">People playing on this phone</p>
          <div class="segmented" role="tablist">
            <button v-for="k in 4" :key="k" type="button" role="tab" class="flex-1" :aria-selected="people === k" @click="people = k">{{ k }}</button>
          </div>
        </section>
        <section>
          <label class="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5">
            <span>
              <span class="block font-display text-base font-semibold text-bark-600">{{ pip.plantName }} plays too</span>
              <span class="text-xs font-semibold text-bark-400">Pip rolls on their own turn</span>
            </span>
            <input v-model="withPip" type="checkbox" class="h-5 w-5 accent-[#6FA35B]" :disabled="people === 1 || people === 4" />
          </label>
          <p v-if="people === 1" class="mt-2 text-xs font-semibold text-bark-400">Playing alone, you race {{ pip.plantName }}.</p>
        </section>
        <button type="button" class="btn btn-primary w-full" @click="(people === 1 && (withPip = true), people === 4 && (withPip = false), start())">Start</button>
      </div>
    </div>

    <div v-else class="flex flex-1 flex-col items-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="mt-1 flex w-full max-w-sm flex-wrap justify-center gap-1.5">
        <span v-for="(s, i) in seats" :key="i" class="seat" :class="{ 'is-turn': turn === i && phase === 'playing' }" :style="{ '--c': s.color }">
          <i /> {{ s.name }} <b class="tabular-nums">{{ pos[i] }}</b>
        </span>
      </div>

      <div class="board mt-3">
        <svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full">
          <g v-for="r in 10" :key="r">
            <rect v-for="c in 10" :key="c" :x="(c - 1) * 10" :y="(r - 1) * 10" width="10" height="10" :fill="(r + c) % 2 ? '#BFDDA4' : '#D3E8BE'" />
          </g>
          <text v-for="n in 100" :key="`n${n}`" :x="cell(n).x * 10 + 1.2" :y="cell(n).y * 10 + 3.4" font-size="2.6" font-weight="800" fill="#6E8E5C" opacity="0.8">{{ n }}</text>
          <!-- ladders -->
          <g v-for="(to, from) in LADDERS" :key="`l${from}`">
            <template v-for="side in [-1.4, 1.4]" :key="side">
              <line :x1="centre(+from).x + side" :y1="centre(+from).y" :x2="centre(to).x + side" :y2="centre(to).y" stroke="#B98C63" stroke-width="1" stroke-linecap="round" />
            </template>
            <line
              v-for="k in Math.max(2, Math.round(Math.hypot(centre(to).x - centre(+from).x, centre(to).y - centre(+from).y) / 4))"
              :key="k"
              :x1="centre(+from).x - 1.4 + ((centre(to).x - centre(+from).x) * k) / (Math.max(2, Math.round(Math.hypot(centre(to).x - centre(+from).x, centre(to).y - centre(+from).y) / 4)) + 1)"
              :y1="centre(+from).y + ((centre(to).y - centre(+from).y) * k) / (Math.max(2, Math.round(Math.hypot(centre(to).x - centre(+from).x, centre(to).y - centre(+from).y) / 4)) + 1)"
              :x2="centre(+from).x + 1.4 + ((centre(to).x - centre(+from).x) * k) / (Math.max(2, Math.round(Math.hypot(centre(to).x - centre(+from).x, centre(to).y - centre(+from).y) / 4)) + 1)"
              :y2="centre(+from).y + ((centre(to).y - centre(+from).y) * k) / (Math.max(2, Math.round(Math.hypot(centre(to).x - centre(+from).x, centre(to).y - centre(+from).y) / 4)) + 1)"
              stroke="#D9B48A"
              stroke-width="0.7"
            />
          </g>
          <!-- vines -->
          <g v-for="(to, from) in VINES" :key="`v${from}`">
            <path
              :d="`M${centre(+from).x} ${centre(+from).y} Q${(centre(+from).x + centre(to).x) / 2 + 6} ${(centre(+from).y + centre(to).y) / 2} ${centre(to).x} ${centre(to).y}`"
              stroke="#4F8A3E"
              stroke-width="1.6"
              fill="none"
              stroke-linecap="round"
            />
            <circle :cx="centre(+from).x" :cy="centre(+from).y" r="2.2" fill="#6E9E5C" />
            <path :d="`M${centre(to).x - 2} ${centre(to).y} q2 -3 4 0 q-2 3 -4 0z`" fill="#8FB86A" />
          </g>
          <!-- players -->
          <g v-for="(s, i) in seats" :key="`t${i}`" class="token" :style="{ transform: `translate(${centre(pos[i]).x + (i % 2 ? 1.8 : -1.8)}px, ${centre(pos[i]).y + (i > 1 ? 1.8 : -1.8)}px)` }">
            <circle r="2.6" :fill="s.color" stroke="#fff" stroke-width="0.7" />
            <text v-if="s.pip" y="1" text-anchor="middle" font-size="3">🌱</text>
          </g>
        </svg>
      </div>

      <p class="mt-2 h-5 text-center text-sm font-bold text-bark-500">{{ message || (current?.pip ? `${pip.plantName} is rolling…` : `${current?.name}’s turn`) }}</p>
      <button type="button" class="dice mt-2" :class="{ 'is-rolling': rolling }" :disabled="!canRoll" data-sound="none" :aria-label="`Roll the dice. Last roll ${die}`" @click="roll">
        <svg viewBox="0 0 100 100" class="h-full w-full">
          <rect x="4" y="4" width="92" height="92" rx="20" fill="#FFFDF8" stroke="#E2D6C6" stroke-width="3" />
          <circle v-for="(p, k) in PIPS[die]" :key="k" :cx="p[0]" :cy="p[1]" r="9" :fill="current?.color ?? '#3A2D23'" />
        </svg>
      </button>
      <p class="mt-1 text-xs font-semibold text-bark-400">{{ canRoll ? 'Tap the dice to roll' : '' }}</p>
    </div>

    <GameResults
      v-if="phase === 'done' && results"
      :success="results.humanWon"
      eyebrow="Vines and Ladders"
      :title="results.title"
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
.seat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 2px solid transparent;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-bark-600);
  box-shadow: var(--shadow-soft);
}
.seat i {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: var(--c);
}
.seat.is-turn {
  border-color: var(--c);
}
.board {
  position: relative;
  width: min(100%, 26rem, calc(100dvh - 17rem));
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 1.2rem;
  box-shadow: 0 0 0 5px #8c6a4f, 0 16px 30px -18px rgb(58 45 35 / 0.8);
}
.token {
  transition: transform 0.16s ease;
}
.dice {
  width: 4.2rem;
  height: 4.2rem;
  filter: drop-shadow(0 6px 8px rgb(58 45 35 / 0.3));
  transition: transform 0.15s ease;
}
.dice:disabled {
  opacity: 0.75;
}
.dice.is-rolling {
  animation: tumble 0.5s linear infinite;
}
@keyframes tumble {
  to { transform: rotate(360deg); }
}
</style>
