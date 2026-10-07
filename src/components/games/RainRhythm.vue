<script setup>
// Rain Rhythm: raindrops fall in time with the music. Tap each drop while it's falling to
// catch it, and it plays a note of the tune, so the more you catch, the better it sounds.
// Drops that reach the bottom are missed. Later songs rain faster and harder.
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePipStore } from '@/stores/pip'
import { RHYTHM_LEVELS } from '@/data/games'
import { getAudio, buses, midiToFreq } from '@/utils/audio'
import { kalimba, bass, pad, shaker, tok, bell } from '@/utils/synth'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import Countdown from './Countdown.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const BARS = 16
const COUNT_IN = 4 // beats before the first drop
const LANE_COLORS = ['#7CB3D6', '#86AD72', '#E48C9C', '#E8B54F']
const KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK']
// I vi IV V, and the notes each lane plays over each chord
const CHORDS = [
  { root: 48, tones: [72, 76, 79, 84] },
  { root: 45, tones: [69, 72, 76, 81] },
  { root: 41, tones: [69, 72, 77, 81] },
  { root: 43, tones: [71, 74, 79, 83] },
]

const phase = ref('levels') // levels | intro | countdown | playing | done
const level = ref(Math.min(pip.levelProgress('rhythm').unlocked, RHYTHM_LEVELS.length))
const counts = ref({ caught: 0, miss: 0, stray: 0 })
const combo = ref(0)
const bestCombo = ref(0)
const judgements = ref([])
const results = ref(null)
const justUnlocked = ref(null)

const field = ref(null)
const canvas = ref(null)

const cfg = computed(() => RHYTHM_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('rhythm'))
const levelList = computed(() => RHYTHM_LEVELS.map((l) => ({ goal: `${l.title}: ${l.pass}% accuracy` })))
const lanes = computed(() => cfg.value.lanes)
// taps that miss every drop count against you a little, so tapping everywhere doesn't pay
const accuracy = computed(() => {
  const total = counts.value.caught + counts.value.miss + counts.value.stray * 0.5
  if (!total) return 100
  return Math.max(0, Math.round((counts.value.caught / total) * 100))
})

// ---- the song ----
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeNotes(c) {
  const rand = rng(c.seed)
  const notes = []
  let prev = -1
  for (let step = 0; step < BARS * 8; step++) {
    const bar = Math.floor(step / 8)
    const inBar = step % 8
    // breathe at the end of every four bars
    if (bar % 4 === 3 && inBar >= 6) continue
    const onBeat = inBar % 2 === 0
    const chance = Math.min(0.97, c.density * 1.15 * (onBeat ? 1 : c.offbeat ?? 0.5) * (bar < 2 ? 0.75 : 1))
    if (rand() >= chance) continue
    let lane = Math.floor(rand() * c.lanes)
    if (lane === prev && rand() < 0.6) lane = (lane + 1 + Math.floor(rand() * (c.lanes - 1))) % c.lanes
    prev = lane
    const beat = COUNT_IN + step / 2
    const chord = CHORDS[bar % 4]
    notes.push({ beat, lane, midi: chord.tones[lane], jitter: rand() - 0.5, done: null })
    if (rand() < c.chords) {
      const other = (lane + 1 + Math.floor(rand() * (c.lanes - 1))) % c.lanes
      notes.push({ beat, lane: other, midi: chord.tones[other], jitter: rand() - 0.5, done: null })
    }
  }
  return notes
}

// ---- timing ----
let ac = null
let t0 = 0
// The game runs on its own clock, so it keeps going even if the phone holds back audio.
// The music is lined up with it on the audio clock whenever audio is available.
let pausedTotal = 0
let hiddenAt = null
const clock = () => performance.now() / 1000 - pausedTotal
// the gap between the two clocks, only adjusted when it drifts noticeably (keeps the beat steady)
let audioOffset = null
function audioAt(gameTime) {
  if (!ac) return 0
  const gap = ac.currentTime - clock()
  if (audioOffset === null || Math.abs(gap - audioOffset) > 0.05) audioOffset = gap
  return gameTime + audioOffset
}
let notes = []
let raf = null
let scheduledBeat = 0
let backing = null
let endBeat = 0

const spb = () => 60 / cfg.value.bpm
const timeOf = (beat) => t0 + beat * spb()
// seconds a drop takes to fall the whole way: quicker every song
const travel = () => Math.max(0.95, 2.1 - level.value * 0.06)

function pick(n) {
  level.value = n
  if (pip.introSeen.rhythm) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('rhythm')
  results.value = null
  phase.value = 'countdown'
  // make sure audio is awake while we count down
  ac = getAudio()
  nextTick(resize)
}

function start() {
  ac = getAudio()
  counts.value = { caught: 0, miss: 0, stray: 0 }
  splashes = []
  combo.value = 0
  bestCombo.value = 0
  judgements.value = []
  notes = makeNotes(cfg.value)
  endBeat = COUNT_IN + BARS * 4
  pausedTotal = 0
  hiddenAt = null
  audioOffset = null
  t0 = clock() + 0.25
  scheduledBeat = 0
  backing = null
  if (ac) {
    backing = ac.createGain()
    backing.gain.value = pip.musicOn ? 1 : 0
    backing.connect(buses().sfx)
  }
  phase.value = 'playing'
  resize()
  raf = requestAnimationFrame(loop)
}

watch(
  () => pip.musicOn,
  (on) => {
    if (backing && ac) backing.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, 0.05)
  },
)

// the backing band: bass, a soft pad, shaker and a rim click, scheduled a little ahead
function schedule(now) {
  const horizon = now + 0.25
  while (timeOf(scheduledBeat) < horizon && scheduledBeat <= endBeat + 2) {
    const b = scheduledBeat
    scheduledBeat++
    // beats that slipped by (after a pause, or with no audio) are simply skipped
    if (!backing || timeOf(b) < now - 0.05) continue
    const t = audioAt(timeOf(b))
    if (b < COUNT_IN) {
      tok(backing, t, { pitch: b === 0 ? 1.5 : 1.25, vol: 0.06 })
    } else if (b < endBeat) {
      const beatInSong = b - COUNT_IN
      const bar = Math.floor(beatInSong / 4)
      const inBar = beatInSong % 4
      const chord = CHORDS[bar % 4]
      if (inBar === 0) {
        pad(backing, midiToFreq(chord.root + 24), t, { vol: 0.012, length: spb() * 4, attack: 0.3 })
        pad(backing, midiToFreq(chord.root + 28 + (bar % 4 === 1 || bar % 4 === 2 ? -1 : 0)), t, { vol: 0.009, length: spb() * 4, attack: 0.3 })
      }
      if (inBar === 0 || inBar === 2) bass(backing, midiToFreq(chord.root), t, { vol: 0.11, decay: spb() * 1.6 })
      if (inBar === 1 || inBar === 3) tok(backing, t, { pitch: 0.7, vol: 0.035 })
      shaker(backing, t, { vol: 0.012 })
      shaker(backing, t + spb() / 2, { vol: 0.007 })
    } else if (b === endBeat) {
      bass(backing, midiToFreq(48), t, { vol: 0.12, decay: 2 })
      bell(backing, midiToFreq(84), t, { vol: 0.03, decay: 2.5 })
    }
  }
}

function loop() {
  const now = clock()
  schedule(now)
  // drops that fell all the way down
  for (const n of notes) {
    if (n.done === null && now > timeOf(n.beat)) {
      n.done = 'miss'
      judge('miss', dropAt(n, now).x, H - 30)
    }
  }
  draw(now)
  if (now > timeOf(endBeat) + 0.6) return finish()
  raf = requestAnimationFrame(loop)
}

// ---- tapping ----
let splashes = []

const dropSize = () => Math.min(22, (W / lanes.value) * 0.24)

/** Where a drop is right now: it falls from above the top to below the bottom. */
function dropAt(n, now) {
  const laneW = W / lanes.value
  const size = dropSize()
  const fall = 1 - (timeOf(n.beat) - now) / travel()
  return { x: (n.lane + 0.5 + n.jitter * 0.5) * laneW, y: -size * 1.5 + fall * (H + size * 3), size }
}

function catchDrop(n, now) {
  const p = dropAt(n, now)
  n.done = 'caught'
  if (pip.soundOn && ac) kalimba(buses().sfx, midiToFreq(n.midi), ac.currentTime + 0.005, { vol: 0.1, decay: 1.2 })
  haptic('light')
  splashes.push({ x: p.x, y: p.y, at: now, color: LANE_COLORS[n.lane] })
  judge('caught', p.x, p.y)
}

/** A tap at (x, y) on the sky catches the nearest falling drop under the finger. */
function tapAt(x, y) {
  if (phase.value !== 'playing') return
  const now = clock()
  const reach = Math.max(34, dropSize() * 2.3)
  let best = null
  let bestD = Infinity
  for (const n of notes) {
    if (n.done !== null) continue
    if (timeOf(n.beat) - now > travel()) break
    const p = dropAt(n, now)
    const d = Math.hypot(p.x - x, p.y - y)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  if (best && bestD <= reach) return catchDrop(best, now)
  counts.value = { ...counts.value, stray: counts.value.stray + 1 }
  combo.value = 0
  if (pip.soundOn && ac) tok(buses().sfx, ac.currentTime, { pitch: 0.6, vol: 0.03 })
}

function onPointer(e) {
  const r = field.value.getBoundingClientRect()
  tapAt(e.clientX - r.left, e.clientY - r.top)
}

/** Keyboard: D F J K catch the lowest drop in that column. */
function hitLane(lane) {
  if (phase.value !== 'playing' || lane >= lanes.value) return
  const now = clock()
  const live = notes.filter((n) => n.done === null && n.lane === lane && timeOf(n.beat) - now < travel())
  if (live.length) return catchDrop(live[0], now)
  counts.value = { ...counts.value, stray: counts.value.stray + 1 }
  combo.value = 0
}

let jid = 0
function judge(grade, x, y) {
  counts.value = { ...counts.value, [grade]: counts.value[grade] + 1 }
  if (grade === 'miss') combo.value = 0
  else {
    combo.value += 1
    bestCombo.value = Math.max(bestCombo.value, combo.value)
  }
  // a little word now and then: every miss, and combo milestones
  const text = grade === 'miss' ? 'Miss' : combo.value % 10 === 0 ? `${combo.value} in a row!` : ''
  if (!text) return
  const id = ++jid
  judgements.value = [...judgements.value.slice(-3), { id, x, y, grade, text }]
  setTimeout(() => (judgements.value = judgements.value.filter((j) => j.id !== id)), 650)
}

// leaving the app mid song pauses it, instead of letting every drop fall
function onVisibility() {
  if (phase.value !== 'playing') return
  if (document.hidden) {
    hiddenAt = performance.now() / 1000
    cancelAnimationFrame(raf)
    raf = null
  } else if (hiddenAt !== null) {
    pausedTotal += performance.now() / 1000 - hiddenAt
    hiddenAt = null
    raf = requestAnimationFrame(loop)
  }
}

function onKey(e) {
  if (e.repeat) return
  const lane = KEYS.indexOf(e.code)
  if (lane >= 0) {
    e.preventDefault()
    hitLane(lane)
  }
}

// ---- drawing ----
let ctx = null
let dpr = 1
let W = 360
let H = 560

function resize() {
  const r = field.value?.getBoundingClientRect()
  if (!r || !canvas.value) return
  W = r.width
  H = r.height
  dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.value.width = W * dpr
  canvas.value.height = H * dpr
  ctx = canvas.value.getContext('2d')
}

function dropPath(x, y, s) {
  ctx.beginPath()
  ctx.moveTo(x, y - s * 1.35)
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.65, x + s, y - s * 0.1, x + s, y + s * 0.3)
  ctx.arc(x, y + s * 0.3, s, 0, Math.PI)
  ctx.bezierCurveTo(x - s, y - s * 0.1, x - s * 0.5, y - s * 0.65, x, y - s * 1.35)
  ctx.closePath()
}

function draw(now) {
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  // soft rain streaks in the background
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1.5
  const drift = (now * 260) % 60
  for (let x = 12; x < W; x += 28) {
    for (let y = -60 + drift + ((x * 7) % 60); y < H; y += 60) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - 3, y + 14)
      ctx.stroke()
    }
  }
  // splashes where drops were caught
  splashes = splashes.filter((sp) => now - sp.at < 0.45)
  for (const sp of splashes) {
    const k = (now - sp.at) / 0.45
    ctx.globalAlpha = 1 - k
    ctx.strokeStyle = sp.color
    ctx.fillStyle = sp.color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, 10 + k * 34, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(sp.x + Math.cos(a) * (8 + k * 30), sp.y + Math.sin(a) * (8 + k * 30), 3 * (1 - k), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  // drops
  for (const n of notes) {
    if (n.done !== null) continue
    if (timeOf(n.beat) - now > travel()) break
    const { x, y, size } = dropAt(n, now)
    dropPath(x, y, size)
    ctx.fillStyle = LANE_COLORS[n.lane]
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x - size * 0.35, y + size * 0.05, size * 0.22, size * 0.38, 0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fill()
  }
}

function finish() {
  cancelAnimationFrame(raf)
  raf = null
  const acc = accuracy.value
  const success = acc >= cfg.value.pass
  setTimeout(() => backing?.disconnect(), 3000)
  if (!success) {
    results.value = { success: false, title: 'The rain got away', subtitle: `${acc}% accuracy. You need ${cfg.value.pass}% to clear ${cfg.value.title}.` }
  } else {
    const stars = acc >= 92 ? 3 : acc >= 85 ? 2 : 1
    const reward = pip.completeLevel('rhythm', level.value, stars)
    const unlocked = reward.unlocked && reward.unlocked <= RHYTHM_LEVELS.length ? reward.unlocked : null
    justUnlocked.value = unlocked
    results.value = {
      success: true,
      stars,
      petals: reward.petals,
      unlocked,
      allDone: reward.firstClear && level.value === RHYTHM_LEVELS.length,
      title: stars === 3 ? 'Perfect pitter patter!' : stars === 2 ? 'In the groove!' : 'You kept the beat!',
      subtitle: stars < 3 ? `${acc}% accuracy. 2 stars at 85%, 3 stars at 92%.` : `${acc}% accuracy.`,
    }
  }
  phase.value = 'done'
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function leave() {
  cancelAnimationFrame(raf)
  backing?.disconnect()
  backing = null
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  leave()
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
})

</script>

<template>
  <GameShell title="Rain Rhythm" track="silent" dark :hide-title="phase === 'playing'" background="linear-gradient(180deg, #2B3550 0%, #3E5470 60%, #557189 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase === 'playing' || phase === 'done'">
        <span class="chip tabular-nums bg-white/12! text-[#F6EFE2]!">{{ accuracy }}%</span>
        <span class="chip tabular-nums bg-white/12! text-[#F6EFE2]!">×{{ combo }}</span>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Rain Rhythm"
      dark
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <div class="flex items-center gap-2.5 px-5 pt-1 text-[#F6EFE2]">
        <span class="inline-flex h-6 items-center rounded-full bg-[#F6EFE2] px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#2E3754]">Level {{ level }}</span>
        <span class="flex-1 truncate text-[0.8125rem] font-bold text-white/80">{{ cfg.title }} · {{ cfg.bpm }} bpm</span>
        <span class="text-[0.8125rem] font-extrabold tabular-nums" :class="accuracy >= cfg.pass ? 'text-[#A9D8A0]' : 'text-[#F6B6A5]'">need {{ cfg.pass }}%</span>
      </div>

      <div ref="field" class="relative mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] mt-2 flex-1 overflow-hidden rounded-[1.5rem] bg-white/5">
        <canvas ref="canvas" class="absolute inset-0 h-full w-full" />

        <!-- tap anywhere on the sky to catch the drop under your finger -->
        <div class="sky absolute inset-0" aria-label="Tap the falling drops" @pointerdown.prevent="onPointer" />
        <span
          v-for="j in judgements"
          :key="j.id"
          class="judge pointer-events-none absolute font-display text-lg font-semibold"
          :class="`is-${j.grade}`"
          :style="{ left: `${j.x}px`, top: `${j.y - 34}px` }"
        >
          {{ j.text }}
        </span>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        dark
        :level="level"
        :goal="`${cfg.title}: ${cfg.pass}% accuracy`"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#7CB3D6', text: 'Tap the drops as they fall to catch them' },
          { color: '#86AD72', text: 'Every drop you catch plays a note of the song' },
          { color: '#E48C9C', text: 'Drops that reach the bottom are missed' },
          { color: '#E8B54F', text: 'Tapping empty sky costs a little accuracy' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />
      <Countdown v-if="phase === 'countdown'" dark :label="`Level ${level}`" :goal="cfg.title" @done="start" />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level} · ${cfg.title}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Caught', value: counts.caught },
          { label: 'Missed', value: counts.miss },
          { label: 'Combo', value: bestCombo },
        ]"
        :petals="results.petals"
        :has-next="level < RHYTHM_LEVELS.length"
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
.sky {
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}
.judge {
  transform: translateX(-50%);
  animation: judge 0.5s ease-out both;
  pointer-events: none;
  white-space: nowrap;
}
.judge.is-caught {
  color: #F8DE92;
  text-shadow: 0 0 12px rgb(248 222 146 / 0.6);
}
.judge.is-miss {
  color: rgb(255 255 255 / 0.45);
}
@keyframes judge {
  0% { opacity: 0; transform: translate(-50%, 6px) scale(0.8); }
  25% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -14px) scale(1); }
}
</style>
