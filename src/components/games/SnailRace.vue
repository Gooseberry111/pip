<script setup>
// Snail Race: tap to speed your snail along. Every tap uses a little stamina, and it
// comes back when you ease off. Run it dry and your snail naps for a moment.
// Race the computer snails through six levels, or race up to three friends on one phone.
import { computed, ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { RACE_LEVELS } from '@/data/games'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import Countdown from './Countdown.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

// the physics (tuned with a little simulation: about 6.5 taps a second keeps going forever)
const P = { boost: 2.0, drag: 1.5, vmax: 15, cost: 5.5, regen: 36, sleep: 1.5, wake: 45 }
const SHELLS = ['#E48C9C', '#7CB3D6', '#F2C66B', '#9BC487']
const RIVAL_NAMES = ['Shelly', 'Dash', 'Mossy']
const PLAYER_NAMES = ['Pink', 'Blue', 'Yellow', 'Green']

const mode = ref('race') // race | party
const phase = ref('menu') // menu | levels | intro | party | countdown | racing | done
const level = ref(Math.min(pip.levelProgress('race').unlocked, RACE_LEVELS.length))
const players = ref(2)
const snails = ref([])
const results = ref(null)
const justUnlocked = ref(null)
const finishedOrder = ref([])

const cfg = computed(() => RACE_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('race'))
const levelList = computed(() =>
  RACE_LEVELS.map((l) => {
    const who = l.kick ? 'sprinting' : l.smart ? 'clever' : 'little'
    const track = l.length > 120 ? ' on a long track' : l.length > 100 ? ' on a longer track' : ''
    return { goal: `Beat ${l.rivals} ${who} snails${track}` }
  }),
)
const me = computed(() => snails.value[0])
const trackLength = computed(() => (mode.value === 'race' ? cfg.value.length ?? 100 : 100))
const humans = computed(() => snails.value.filter((s) => s.human))

function makeSnail(name, color, human, rate = 0, smart = false) {
  return reactive({ name, color, human, rate, smart, x: 0, v: 0, st: 100, sleep: 0, acc: Math.random(), naps: 0, done: null, rest: false, taps: 0, bump: 0 })
}

// ---- flow ----
function openRace() {
  mode.value = 'race'
  phase.value = 'levels'
}
function openParty() {
  mode.value = 'party'
  phase.value = 'party'
}

function pick(n) {
  level.value = n
  if (pip.introSeen.race) begin()
  else phase.value = 'intro'
}

function begin() {
  if (mode.value === 'race') {
    pip.markIntroSeen('race')
    snails.value = [
      makeSnail('You', SHELLS[0], true),
      ...Array.from({ length: cfg.value.rivals }, (_, i) =>
        Object.assign(makeSnail(RIVAL_NAMES[i], SHELLS[i + 1], false, cfg.value.tapRate * (0.92 + Math.random() * 0.16), cfg.value.smart), { kick: cfg.value.kick }),
      ),
    ]
  } else {
    snails.value = Array.from({ length: players.value }, (_, i) => makeSnail(PLAYER_NAMES[i], SHELLS[i], true))
  }
  finishedOrder.value = []
  results.value = null
  phase.value = 'countdown'
}

let raf = null
let last = 0
let elapsed = 0

function start() {
  phase.value = 'racing'
  last = 0
  elapsed = 0
  raf = requestAnimationFrame(loop)
}

function loop(now) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
  last = now
  elapsed += dt
  for (const s of snails.value) step(s, dt)
  if (phase.value === 'racing') raf = requestAnimationFrame(loop)
}

function step(s, dt) {
  if (s.done !== null) {
    s.v *= Math.exp(-4 * dt)
    return
  }
  if (s.sleep > 0) {
    s.sleep -= dt
    if (s.sleep <= 0) {
      s.sleep = 0
      s.st = P.wake
    }
    s.v *= Math.exp(-P.drag * 3 * dt)
  } else {
    if (!s.human) {
      let rate = s.rate
      if (s.smart) {
        if (s.st < 20) s.rest = true
        if (s.st > 55) s.rest = false
        // sprinters give it everything over the last fifth
        const sprint = s.kick && s.x > trackLength.value * 0.8 && s.st > 8
        if (s.rest && !sprint) rate = (P.regen / P.cost) * 0.9
        if (sprint) rate = Math.max(rate, s.rate * 1.15)
      }
      s.acc += rate * dt
      while (s.acc >= 1 && s.sleep === 0) {
        s.acc -= 1
        tapSnail(s)
      }
    }
    s.st = Math.min(100, s.st + P.regen * dt)
    s.v *= Math.exp(-P.drag * dt)
  }
  s.x = Math.min(trackLength.value, s.x + s.v * dt)
  if (s.x >= trackLength.value && s.done === null) crossLine(s)
}

function tapSnail(s) {
  s.v = Math.min(P.vmax, s.v + P.boost)
  s.st -= P.cost
  s.taps += 1
  s.bump = (s.bump + 1) % 1000
  if (s.st <= 0) {
    s.st = 0
    s.sleep = P.sleep
    s.naps += 1
    if (s.human) {
      playSound('snore')
      haptic('error')
    }
  }
}

function tap(i) {
  if (phase.value !== 'racing') return
  const s = humans.value[i]
  if (!s || s.sleep > 0 || s.done !== null) return
  tapSnail(s)
  if (s.sleep === 0) playSound('step', true, { pitch: 0.9 + (s.v / P.vmax) * 0.8 })
}

function crossLine(s) {
  s.done = elapsed
  finishedOrder.value = [...finishedOrder.value, s]
  if (mode.value === 'party') {
    playSound('win')
    haptic('success')
    return endRace()
  }
  if (s.human) return endRace()
  playSound('miss')
  // with everyone else ahead, there's no catching up
  const places = cfg.value.rivals + 1
  const failPlace = places >= 4 ? 3 : places
  if (finishedOrder.value.length >= failPlace - 1 && !me.value.done) endRace()
}

function endRace() {
  phase.value = 'done'
  cancelAnimationFrame(raf)
  if (mode.value === 'party') {
    const winner = finishedOrder.value[0]
    const earned = pip.finishRound('race', 1)
    results.value = { party: true, success: true, title: `${winner.name} wins!`, subtitle: 'What a race. Rematch?', petals: earned, stars: -1 }
    return
  }
  const place = me.value.done !== null ? finishedOrder.value.indexOf(me.value) + 1 : finishedOrder.value.length + 1
  const success = place <= 2
  const stars = place === 1 ? (me.value.naps === 0 ? 3 : 2) : place === 2 ? 1 : 0
  const PLACE = ['1st', '2nd', '3rd', '4th']
  if (!success) {
    results.value = { success: false, stars: -1, petals: 0, place, title: `${PLACE[place - 1]} place`, subtitle: 'Finish in the top two to clear the level.' }
    return
  }
  const reward = pip.completeLevel('race', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= RACE_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    place,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === RACE_LEVELS.length,
    title: place === 1 ? (stars === 3 ? 'Wide awake winner!' : 'First place!') : '2nd place',
    subtitle: stars < 3 ? (place === 1 ? '3 stars: win without a single nap.' : '2 stars for first place, 3 for winning without a nap.') : '',
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function again() {
  begin()
}

function onKey(e) {
  if (phase.value !== 'racing' || e.repeat) return
  if (mode.value === 'race' && (e.code === 'Space' || e.code === 'Enter')) {
    e.preventDefault()
    tap(0)
  }
  // party on a keyboard: A, L, Q and P
  if (mode.value === 'party') {
    const i = ['KeyA', 'KeyL', 'KeyQ', 'KeyP'].indexOf(e.code)
    if (i >= 0 && i < players.value) tap(i)
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey)
})

const staminaColor = (s) => (s.st < 25 ? '#E07A62' : s.st < 50 ? '#F2C66B' : '#86AD72')
const placeOf = (s) => finishedOrder.value.indexOf(s) + 1
</script>

<template>
  <GameShell title="Snail Race" track="race" :hide-title="phase === 'racing'" background="linear-gradient(180deg, #E8F0DC 0%, #F4EEDF 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="mode === 'race' && ['intro', 'countdown', 'racing', 'done'].includes(phase)" class="chip tabular-nums">Level {{ level }}</span>
    </template>

    <!-- choose a race -->
    <div v-if="phase === 'menu'" class="flex flex-1 flex-col justify-center gap-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <button type="button" class="menu-card" data-sound="select" @click="openRace">
        <span class="flex -space-x-3">
          <svg v-for="(c, i) in SHELLS.slice(0, 3)" :key="i" viewBox="0 0 64 44" class="h-10 w-14"><use href="#snail" :style="{ '--shell': c }" /></svg>
        </span>
        <span class="mt-2 font-display text-xl font-semibold text-bark-600">Race the snails</span>
        <span class="text-sm font-semibold text-bark-400">Six levels against quicker and cleverer snails</span>
        <span class="chip mt-2">{{ pip.totalStars('race') }} / {{ RACE_LEVELS.length * 3 }} stars</span>
      </button>
      <button type="button" class="menu-card" data-sound="select" @click="openParty">
        <span class="flex -space-x-3">
          <svg v-for="(c, i) in SHELLS" :key="i" viewBox="0 0 64 44" class="h-10 w-14"><use href="#snail" :style="{ '--shell': c }" /></svg>
        </span>
        <span class="mt-2 font-display text-xl font-semibold text-bark-600">Party race</span>
        <span class="text-sm font-semibold text-bark-400">2 to 4 players, everyone taps on the same phone</span>
      </button>
    </div>

    <!-- party setup -->
    <div v-else-if="phase === 'party'" class="flex flex-1 flex-col justify-center gap-5 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div class="text-center">
        <p class="eyebrow">Party race</p>
        <h2 class="title-xl mt-1">How many racers?</h2>
      </div>
      <div class="grid grid-cols-3 gap-2.5">
        <button
          v-for="n in [2, 3, 4]"
          :key="n"
          type="button"
          class="count-card"
          :class="{ 'is-on': players === n }"
          data-sound="select"
          @click="players = n"
        >
          <span class="font-display text-3xl font-semibold text-bark-600">{{ n }}</span>
          <span class="flex justify-center gap-1">
            <i v-for="c in SHELLS.slice(0, n)" :key="c" class="h-2.5 w-2.5 rounded-full" :style="{ background: c }" />
          </span>
        </button>
      </div>
      <p class="text-center text-sm font-semibold text-bark-400">Each racer gets a pad. Tap fast, but don’t tire your snail out!</p>
      <button type="button" class="btn btn-primary w-full" @click="begin">Ready, set…</button>
      <button type="button" class="btn btn-ghost btn-sm" @click="phase = 'menu'">Back</button>
    </div>

    <LevelSelect
      v-else-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Snail Race"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <!-- the race -->
    <template v-else>
      <div class="flex flex-1 flex-col justify-center gap-2 px-4 py-2">
        <div v-for="(s, i) in snails" :key="i" class="lane relative" :class="{ 'is-you': mode === 'race' && i === 0 }">
          <span class="absolute left-3 top-1.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-bark-500/80">
            {{ s.name }}
            <template v-if="s.done !== null"> · {{ ['1st', '2nd', '3rd', '4th'][placeOf(s) - 1] }}</template>
          </span>
          <div class="finish" />
          <div class="trail" :style="{ width: `calc((100% - 4.5rem) * ${s.x / trackLength} + 1.5rem)`, background: `${s.color}55` }" />
          <div class="snail-wrap" :style="{ left: `calc((100% - 4.5rem) * ${s.x / trackLength})` }">
            <svg
              viewBox="0 0 64 44"
              class="snail h-11 w-16"
              :class="{ 'is-sleep': s.sleep > 0 }"
              :style="{ '--shell': s.color, '--speed': `${Math.max(0.18, 0.9 - (s.v / P.vmax) * 0.7)}s` }"
            >
              <use href="#snail" />
            </svg>
            <span v-if="s.sleep > 0" class="zzz absolute -top-3 right-1 font-display text-base font-semibold text-bark-400">z<span>z</span><span>z</span></span>
          </div>
        </div>
      </div>

      <!-- tap pads -->
      <div class="pads grid gap-2.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" :class="humans.length === 3 ? 'grid-cols-3' : humans.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'">
        <button
          v-for="(s, i) in humans"
          :key="i"
          type="button"
          data-sound="none"
          class="pad relative flex flex-col items-center justify-center overflow-hidden"
          :class="{ 'is-sleep': s.sleep > 0, 'h-32': humans.length <= 3, 'h-24': humans.length === 4 }"
          :style="{ '--pad': s.color }"
          :aria-label="`Tap for ${s.name}`"
          @pointerdown.prevent="tap(i)"
        >
          <span :key="s.bump" class="pad-pulse" />
          <span class="relative font-display text-2xl font-semibold text-white drop-shadow">
            {{ s.sleep > 0 ? 'Zzz…' : phase === 'racing' ? 'Tap!' : s.name }}
          </span>
          <span class="relative mt-2 h-2 w-3/4 overflow-hidden rounded-full bg-white/40">
            <span class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100" :style="{ width: `${s.st}%`, background: s.sleep > 0 ? '#fff' : staminaColor(s) }" />
          </span>
          <span v-if="mode === 'race'" class="relative mt-1 text-[0.6875rem] font-bold uppercase tracking-wider text-white/85">Stamina</span>
        </button>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#E48C9C', text: 'Tap the pad as fast as you can' },
          { color: '#86AD72', text: 'Each tap uses stamina. Ease off to refill it' },
          { color: '#E07A62', text: 'Empty stamina means a nap!' },
          { color: '#F2C66B', text: '3 stars: win without a single nap' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown
        v-if="phase === 'countdown'"
        :label="mode === 'race' ? `Level ${level}` : 'Party race'"
        :goal="mode === 'race' ? levelList[level - 1].goal : 'First to the leaf wins'"
        @done="start"
      />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="mode === 'race' ? `Level ${level}` : 'Party race'"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="
          mode === 'race'
            ? [
                { label: 'Place', value: results.place },
                { label: 'Taps', value: me.taps },
                { label: 'Naps', value: me.naps },
              ]
            : humans.map((s) => ({ label: s.name, value: s.done !== null ? `${s.done.toFixed(1)}s` : `${Math.round((s.x / trackLength) * 100)}%` }))
        "
        :petals="results.petals"
        :has-next="mode === 'race' && level < RACE_LEVELS.length"
        :unlocked="results.unlocked"
        :all-done="results.allDone"
        has-levels
        :levels-label="mode === 'race' ? 'Levels' : 'Players'"
        @next="nextLevel"
        @again="again"
        @levels="phase = mode === 'race' ? 'levels' : 'party'"
        @close="emit('close')"
      />
    </template>

    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <symbol id="snail" viewBox="0 0 64 44" overflow="visible">
          <path d="M6 38 C6 31 14 29 22 29 L50 29 C55 29 58 25 58 19 C58 14 61 12 63 13 C64 20 62 38 50 38 Z" fill="#E9CFA9" />
          <path d="M57 15 L55 5 M61 14 L62 4" stroke="#C9A97F" stroke-width="2" stroke-linecap="round" />
          <circle cx="55" cy="4.5" r="2.4" fill="#3E2F25" />
          <circle cx="62" cy="3.5" r="2.4" fill="#3E2F25" />
          <circle cx="59" cy="22" r="1" fill="#C98A7A" />
          <path d="M57.5 24.5 Q59.5 26 61.5 24.5" stroke="#8C6A4F" stroke-width="1.2" fill="none" stroke-linecap="round" />
          <circle cx="30" cy="20" r="16" style="fill: var(--shell)" />
          <path d="M30 20 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6 a9 9 0 1 1 -9 -9 a12 12 0 1 1 12 12" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round" />
          <ellipse cx="24" cy="10" rx="5" ry="2.6" fill="#fff" opacity="0.35" transform="rotate(-25 24 10)" />
        </symbol>
      </defs>
    </svg>
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
.count-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.9rem 0;
  border-radius: 1.25rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-line);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.count-card.is-on {
  border-color: var(--color-leaf-400);
  box-shadow: 0 0 0 3px rgb(134 173 114 / 0.22);
}
.lane {
  height: clamp(3.6rem, 10vh, 4.6rem);
  border-radius: 1.1rem;
  background: repeating-linear-gradient(90deg, #CFE0B6 0 22px, #C7DAAD 22px 44px);
  box-shadow: inset 0 -4px 0 rgb(80 110 60 / 0.12);
  overflow: hidden;
}
.lane.is-you {
  box-shadow: inset 0 -4px 0 rgb(80 110 60 / 0.12), 0 0 0 2.5px #E48C9C;
}
.finish {
  position: absolute;
  right: 0.6rem;
  top: 0;
  bottom: 0;
  width: 10px;
  background: repeating-linear-gradient(0deg, #fff 0 8px, #3E2F25 8px 16px);
  opacity: 0.75;
}
.trail {
  position: absolute;
  left: 0;
  bottom: 0.65rem;
  height: 6px;
  border-radius: 999px;
}
.snail-wrap {
  position: absolute;
  bottom: 0.2rem;
  width: 4rem;
}
.snail {
  overflow: visible;
  transform-origin: 50% 90%;
  animation: crawl var(--speed) ease-in-out infinite alternate;
}
.snail.is-sleep {
  animation: none;
  filter: saturate(0.6);
}
@keyframes crawl {
  from { transform: scaleX(1) translateY(0); }
  to { transform: scaleX(1.08) translateY(-1px); }
}
.zzz span {
  display: inline-block;
  animation: float 1.2s ease-in-out infinite;
}
.zzz span:nth-child(2) {
  animation-delay: 0.3s;
}
@keyframes float {
  50% { transform: translateY(-4px); }
}
.pad {
  border-radius: 1.5rem;
  background: var(--pad);
  box-shadow: inset 0 -6px 0 rgb(0 0 0 / 0.12), 0 12px 24px -14px rgb(58 45 35 / 0.6);
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: transform 0.06s ease, filter 0.2s ease;
}
.pad:active {
  transform: scale(0.97) translateY(2px);
}
.pad.is-sleep {
  filter: grayscale(0.6) brightness(0.9);
}
.pad-pulse {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle, rgb(255 255 255 / 0.5), transparent 60%);
  animation: pulse 0.35s ease-out both;
}
@keyframes pulse {
  from { opacity: 1; transform: scale(0.6); }
  to { opacity: 0; transform: scale(1.3); }
}
</style>
