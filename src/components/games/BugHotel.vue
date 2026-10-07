<script setup>
// Bug Hotel: the bugs have checked into the wrong rooms. Tap a tower to pick up the bugs
// on top, then tap another tower to move them. Bugs only sit on their own kind (or in an
// empty tower). Give every kind of bug a tower of its own.
import { computed, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { HOTEL_LEVELS } from '@/data/games'
import { makeHotel, moveCount, applyMove, solved, topRun } from '@/utils/hotelEngine'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import Icon from '../Icon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const BUGS = {
  a: 'ladybird',
  b: 'bee',
  c: 'snail',
  d: 'butterfly',
  e: 'beetle',
  f: 'caterpillar',
  g: 'ant',
}

const phase = ref('levels') // levels | intro | playing | done
const level = ref(Math.min(pip.levelProgress('hotel').unlocked, HOTEL_LEVELS.length))
const towers = ref([])
const start = ref([])
const par = ref(0)
const history = ref([])
const moves = ref(0)
const undos = ref(0)
const selected = ref(-1)
const shake = ref(-1)
const landed = ref({ tower: -1, count: 0, id: 0 })
const finishedTowers = ref(new Set())
const results = ref(null)
const justUnlocked = ref(null)

const cfg = computed(() => HOTEL_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('hotel'))
const levelList = computed(() =>
  HOTEL_LEVELS.map((l) => ({ goal: `Sort ${l.kinds} kinds of bug, ${l.height} rooms high${l.empty === 1 ? ', one spare tower' : ''}` })),
)
const lifted = computed(() => (selected.value >= 0 ? topRun(towers.value[selected.value]) : 0))
const perRow = computed(() => (towers.value.length > 5 ? Math.ceil(towers.value.length / 2) : towers.value.length))
const rows = computed(() => {
  const out = []
  for (let i = 0; i < towers.value.length; i += perRow.value) out.push(towers.value.slice(i, i + perRow.value).map((t, j) => ({ tower: t, index: i + j })))
  return out
})

function pick(n) {
  level.value = n
  if (pip.introSeen.hotel) begin()
  else phase.value = 'intro'
}

function begin() {
  pip.markIntroSeen('hotel')
  // in the rare case no sortable shuffle turns up, an extra empty tower always makes one
  const hotel = makeHotel(cfg.value) ?? makeHotel({ ...cfg.value, empty: cfg.value.empty + 1 })
  start.value = hotel.towers
  par.value = hotel.par
  restart()
  phase.value = 'playing'
}

function restart() {
  towers.value = start.value.map((t) => [...t])
  history.value = []
  moves.value = 0
  undos.value = 0
  selected.value = -1
  finishedTowers.value = new Set()
  results.value = null
}

function isDone(t) {
  return t.length === cfg.value.height && t.every((k) => k === t[0])
}

function tapTower(i) {
  if (phase.value !== 'playing') return
  const t = towers.value[i]
  if (selected.value < 0) {
    if (!t.length || isDone(t)) {
      nudge(i)
      return
    }
    selected.value = i
    playSound('select')
    haptic('light')
    return
  }
  if (selected.value === i) {
    selected.value = -1
    playSound('tap')
    return
  }
  const from = selected.value
  const n = moveCount(towers.value, from, i, cfg.value.height)
  if (!n) {
    // try picking this tower up instead, if it has bugs
    if (t.length && !isDone(t)) {
      selected.value = i
      playSound('select')
    } else {
      selected.value = -1
      nudge(i)
    }
    return
  }
  history.value.push(towers.value)
  towers.value = applyMove(towers.value, from, i, cfg.value.height)
  moves.value += 1
  selected.value = -1
  landed.value = { tower: i, count: n, id: landed.value.id + 1 }
  playSound('hop', true, { count: n })
  haptic('light')
  if (isDone(towers.value[i]) && !finishedTowers.value.has(i)) {
    finishedTowers.value = new Set([...finishedTowers.value, i])
    setTimeout(() => playSound('done'), 160)
  }
  if (solved(towers.value, cfg.value.height)) setTimeout(finish, 700)
}

function nudge(i) {
  shake.value = i
  playSound('miss')
  setTimeout(() => (shake.value = -1), 350)
}

function undo() {
  if (!history.value.length || phase.value !== 'playing') return
  towers.value = history.value.pop()
  moves.value -= 1
  undos.value += 1
  selected.value = -1
  finishedTowers.value = new Set(towers.value.map((t, i) => (isDone(t) ? i : -1)).filter((i) => i >= 0))
  playSound('toggleOff')
}

function finish() {
  if (phase.value !== 'playing') return
  phase.value = 'done'
  const stars = moves.value <= par.value && undos.value === 0 ? 3 : moves.value <= Math.ceil(par.value * 1.25) ? 2 : 1
  const reward = pip.completeLevel('hotel', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= HOTEL_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === HOTEL_LEVELS.length,
    title: stars === 3 ? 'Five star hotel!' : stars === 2 ? 'Everyone’s settled in!' : 'All sorted!',
    subtitle: stars < 3 ? `3 stars: ${par.value} moves or fewer, with no undos.` : `Done in ${moves.value} moves.`,
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

// how high a bug sits, counting from the top of its tower (0 is the top)
const fromTop = (t, j) => t.length - 1 - j
</script>

<template>
  <GameShell title="Bug Hotel" track="hotel" :hide-title="phase === 'playing'" background="linear-gradient(180deg, #F1E8DA 0%, #E6EEDC 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase === 'playing'">
        <button type="button" class="icon-btn h-9! w-9!" :disabled="!history.length" aria-label="Undo" @click="undo">
          <Icon name="undo" :size="16" :stroke="2.4" />
        </button>
        <button type="button" class="chip" @click="restart">Restart</button>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Bug Hotel"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <div class="px-5 pt-1">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-bark-600 px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#FFFAF2]">
            Level {{ level }}<span class="opacity-55">/ {{ HOTEL_LEVELS.length }}</span>
          </span>
          <span class="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-bark-500">Every bug in its own tower</span>
          <span class="shrink-0 text-[0.8125rem] font-extrabold tabular-nums" :class="moves > par ? 'text-clay-400' : 'text-bark-600'">{{ moves }} / {{ par }} moves</span>
        </div>
        <p v-if="undos" class="mt-1 text-right text-[0.6875rem] font-bold text-bark-400">{{ undos }} {{ undos === 1 ? 'undo' : 'undos' }}</p>
      </div>

      <div class="flex flex-1 flex-col justify-center gap-6 px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div v-for="(row, r) in rows" :key="r" class="flex items-end justify-center gap-2">
          <button
            v-for="{ tower, index } in row"
            :key="index"
            type="button"
            data-sound="none"
            class="tower relative flex flex-col-reverse items-center"
            :class="{
              'is-selected': selected === index,
              'is-shake': shake === index,
              'is-done': isDone(tower),
              'is-target': selected >= 0 && selected !== index && moveCount(towers, selected, index, cfg.height) > 0,
            }"
            :style="{ '--rooms': cfg.height }"
            :aria-label="`Tower ${index + 1}: ${tower.map((k) => BUGS[k]).join(', ') || 'empty'}`"
            @click="tapTower(index)"
          >
            <span
              v-for="(k, j) in tower"
              :key="`${index}-${j}-${k}`"
              class="room flex items-center justify-center"
              :class="{
                'is-lifted': selected === index && fromTop(tower, j) < lifted,
                'is-landed': landed.tower === index && fromTop(tower, j) < landed.count,
              }"
            >
              <svg viewBox="-20 -20 40 40" class="h-[82%] w-[82%] overflow-visible"><use x="-20" y="-20" width="40" height="40" :href="`#bug-${BUGS[k]}`" /></svg>
            </span>
            <span v-if="isDone(tower)" class="crown absolute -top-6 left-1/2 -translate-x-1/2 text-honey-400">
              <Icon name="sparkle" :size="18" :stroke="2.4" />
            </span>
          </button>
        </div>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#D9533F', text: 'Tap a tower to pick up the bugs on top' },
          { color: '#F2C66B', text: 'Tap another tower to move them there' },
          { color: '#86AD72', text: 'Bugs only sit on their own kind, or in an empty tower' },
          { color: '#B48CD1', text: '3 stars: sort it within par, no undos' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />

      <GameResults
        v-if="phase === 'done' && results"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.stars"
        :stats="[
          { label: 'Moves', value: moves },
          { label: 'Par', value: par },
          { label: 'Undos', value: undos },
        ]"
        :petals="results.petals"
        :has-next="level < HOTEL_LEVELS.length"
        :unlocked="results.unlocked"
        :all-done="results.allDone"
        has-levels
        @next="nextLevel"
        @again="begin"
        @levels="phase = 'levels'"
        @close="emit('close')"
      />
    </template>

    <!-- the guests -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <symbol id="bug-ladybird" viewBox="-20 -20 40 40" overflow="visible">
          <circle cx="0" cy="-11" r="6" fill="#2E2219" />
          <path d="M-3 -16 L-6 -20 M3 -16 L6 -20" stroke="#2E2219" stroke-width="1.6" stroke-linecap="round" />
          <circle r="14" fill="#D9473A" />
          <path d="M0 -14 V14" stroke="#2E2219" stroke-width="1.8" />
          <circle cx="-7" cy="-4" r="2.8" fill="#2E2219" /><circle cx="7" cy="-4" r="2.8" fill="#2E2219" />
          <circle cx="-6" cy="6" r="2.4" fill="#2E2219" /><circle cx="6" cy="6" r="2.4" fill="#2E2219" />
          <ellipse cx="-6" cy="-9" rx="3" ry="1.8" fill="#fff" opacity="0.45" transform="rotate(-30 -6 -9)" />
        </symbol>
        <symbol id="bug-bee" viewBox="-20 -20 40 40" overflow="visible">
          <ellipse cx="-5" cy="-11" rx="7" ry="5" fill="#fff" opacity="0.9" transform="rotate(-25 -5 -11)" />
          <ellipse cx="5" cy="-11" rx="7" ry="5" fill="#fff" opacity="0.9" transform="rotate(25 5 -11)" />
          <ellipse rx="15" ry="11" fill="#F6C443" />
          <path d="M-5 -10.5 V10.5 M3 -10.8 V10.8" stroke="#2E2219" stroke-width="4" />
          <circle cx="10" cy="-2" r="1.8" fill="#2E2219" />
          <path d="M-15 0 L-19 0" stroke="#2E2219" stroke-width="2" stroke-linecap="round" />
        </symbol>
        <symbol id="bug-snail" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M-17 13 C-17 8 -10 7 -4 7 L10 7 C14 7 15 4 15 0 L15 -7 C17 -8 19 -7 19 -4 C19 6 16 13 8 13Z" fill="#EBCFA6" />
          <path d="M15 -6 L13 -14 M18 -5 L19 -13" stroke="#C9A97F" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="13" cy="-14.5" r="1.8" fill="#2E2219" /><circle cx="19" cy="-13.5" r="1.8" fill="#2E2219" />
          <circle cx="-2" cy="-2" r="11.5" fill="#E48C9C" />
          <path d="M-2 -2 m0 -2.5 a2.5 2.5 0 1 1 -2.5 2.5 a5 5 0 1 1 5 5 a7.5 7.5 0 1 1 -7.5 -7.5" fill="none" stroke="#fff" stroke-opacity="0.65" stroke-width="2" stroke-linecap="round" />
        </symbol>
        <symbol id="bug-butterfly" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M0 -2 C-6 -18 -19 -16 -17 -5 C-16 1 -7 1 0 -2Z" fill="#B48CD1" />
          <path d="M0 -2 C6 -18 19 -16 17 -5 C16 1 7 1 0 -2Z" fill="#B48CD1" />
          <path d="M0 0 C-5 4 -14 6 -12 13 C-9 16 -3 10 0 2Z" fill="#D3B5E6" />
          <path d="M0 0 C5 4 14 6 12 13 C9 16 3 10 0 2Z" fill="#D3B5E6" />
          <circle cx="-9" cy="-8" r="2.4" fill="#fff" opacity="0.7" /><circle cx="9" cy="-8" r="2.4" fill="#fff" opacity="0.7" />
          <ellipse rx="2.2" ry="10" fill="#4A3A5A" />
          <path d="M-1 -9 L-4 -15 M1 -9 L4 -15" stroke="#4A3A5A" stroke-width="1.4" stroke-linecap="round" />
        </symbol>
        <symbol id="bug-beetle" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M-12 -6 L-18 -10 M-12 2 L-19 2 M-11 9 L-17 14 M12 -6 L18 -10 M12 2 L19 2 M11 9 L17 14" stroke="#1F3B3A" stroke-width="2" stroke-linecap="round" />
          <ellipse cx="0" cy="-12" rx="7" ry="5" fill="#1F3B3A" />
          <ellipse cx="0" cy="3" rx="13" ry="14" fill="#2F8F87" />
          <path d="M0 -11 V17" stroke="#1F5E58" stroke-width="1.8" />
          <ellipse cx="-5" cy="-2" rx="3" ry="6" fill="#9FE0D4" opacity="0.5" />
        </symbol>
        <symbol id="bug-caterpillar" viewBox="-20 -20 40 40" overflow="visible">
          <circle cx="-13" cy="6" r="6" fill="#8CC456" />
          <circle cx="-5" cy="3" r="6.5" fill="#9BCF62" />
          <circle cx="3" cy="4" r="6.5" fill="#8CC456" />
          <circle cx="11" cy="0" r="7.5" fill="#A6D96C" />
          <circle cx="13.5" cy="-1" r="1.6" fill="#2E2219" />
          <path d="M9 -7 L7 -12 M14 -7 L16 -12" stroke="#5E8A3A" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="-5" cy="-1" r="1.4" fill="#F6C443" /><circle cx="3" cy="0" r="1.4" fill="#F6C443" />
        </symbol>
        <symbol id="bug-ant" viewBox="-20 -20 40 40" overflow="visible">
          <path d="M-4 -2 L-10 -10 M-4 2 L-12 4 M-2 4 L-8 13 M4 -2 L10 -10 M4 2 L12 4 M2 4 L8 13" stroke="#5B3B2A" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="0" cy="-11" r="5" fill="#7A4E36" />
          <ellipse cx="0" cy="0" rx="4.5" ry="5" fill="#7A4E36" />
          <ellipse cx="0" cy="11" rx="7" ry="7.5" fill="#7A4E36" />
          <path d="M-2 -15 L-5 -19 M2 -15 L5 -19" stroke="#5B3B2A" stroke-width="1.5" stroke-linecap="round" />
          <ellipse cx="-2.5" cy="8" rx="2" ry="3" fill="#fff" opacity="0.25" />
        </symbol>
      </defs>
    </svg>
  </GameShell>
</template>

<style scoped>
.tower {
  --room: clamp(2rem, min(11vw, 5.4vh), 3rem);
  width: calc(var(--room) + 0.75rem);
  height: calc(var(--room) * var(--rooms) + 1.6rem);
  padding: 0.45rem 0.375rem 0.6rem;
  border-radius: 1.4rem 1.4rem 0.9rem 0.9rem;
  background: linear-gradient(180deg, #D8B994 0%, #C9A57C 100%);
  box-shadow: inset 0 -5px 0 rgb(90 60 40 / 0.18), inset 0 0 0 3px rgb(255 255 255 / 0.15), 0 10px 20px -14px rgb(58 45 35 / 0.7);
  justify-content: flex-start;
  gap: 0;
  transition: transform 0.2s ease, box-shadow 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}
.tower::before {
  /* the empty rooms behind the bugs */
  content: '';
  position: absolute;
  inset: 0.45rem 0.375rem 0.6rem;
  border-radius: 1rem 1rem 0.6rem 0.6rem;
  background: repeating-linear-gradient(0deg, #F3E6D0 0 calc(var(--room) - 3px), #E3CFAF calc(var(--room) - 3px) var(--room));
}
.tower.is-selected {
  box-shadow: inset 0 -5px 0 rgb(90 60 40 / 0.18), 0 0 0 3px #F2C66B, 0 14px 24px -14px rgb(58 45 35 / 0.7);
}
.tower.is-target {
  box-shadow: inset 0 -5px 0 rgb(90 60 40 / 0.18), 0 0 0 2px rgb(134 173 114 / 0.75), 0 10px 20px -14px rgb(58 45 35 / 0.7);
}
.tower.is-done {
  background: linear-gradient(180deg, #E8CF8E 0%, #D9B66A 100%);
}
.tower.is-shake {
  animation: shake 0.35s ease;
}
@keyframes shake {
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.room {
  position: relative;
  width: var(--room);
  height: var(--room);
  flex-shrink: 0;
  transition: transform 0.22s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.room svg {
  filter: drop-shadow(0 2px 1.5px rgb(58 45 35 / 0.25));
}
.room.is-lifted {
  transform: translateY(-0.9rem);
}
.room.is-lifted svg {
  animation: wiggle 0.6s ease-in-out infinite;
}
.room.is-landed {
  animation: land 0.4s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
@keyframes wiggle {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}
@keyframes land {
  0% { transform: translateY(-1.2rem) scale(0.9); }
  100% { transform: none; }
}
.crown {
  animation: crown 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
@keyframes crown {
  from { opacity: 0; transform: translate(-50%, 6px) scale(0.4); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
}
</style>
