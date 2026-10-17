<script setup>
// Garden Tiles: tap tiles that nothing is resting on to drop them in the tray. Three alike
// and they're gone. Fill all seven tray spaces and the round is over. Clear the board to win.
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { TILES_LEVELS } from '@/data/games'
import { makeTiles, isFree, addToTray, TRAY } from '@/utils/tilesEngine'
import { buildBoard } from '@/utils/buildAsync'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelSelect from './LevelSelect.vue'
import LevelIntro from './LevelIntro.vue'
import GoodIcon from '../farm/GoodIcon.vue'
import Icon from '../Icon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const KINDS = ['wheat', 'carrot', 'tomato', 'corn', 'strawberry', 'pumpkin', 'sunflower', 'blueberry', 'potato', 'rose', 'lavender', 'watermelon', 'apple', 'cherry', 'lemon', 'honey']
const FACES = ['#FFF8EC', '#FDF1F1', '#F1F7EC', '#FFF6E0']

const phase = ref('levels') // levels | intro | building | playing | done
const level = ref(Math.min(pip.levelProgress('tiles').unlocked, TILES_LEVELS.length))
const tiles = ref([])
const tray = ref([])
const held = ref([]) // put aside with the "Make room" helper
const history = ref([])
const size = ref({ w: 2, h: 2 })
const undos = ref(0)
const roomUsed = ref(false)
const cleared = ref(0)
const total = ref(0)
const flash = ref(null)
const results = ref(null)
const justUnlocked = ref(null)
const area = ref(null)

const cfg = computed(() => TILES_LEVELS[level.value - 1])
const progress = computed(() => pip.levelProgress('tiles'))
const levelList = computed(() => TILES_LEVELS.map((l) => ({ goal: `${l.layers} ${l.layers === 1 ? 'layer' : 'layers'} of tiles, ${l.kinds} kinds` })))
const helpersUsed = computed(() => undos.value + (roomUsed.value ? 1 : 0))
// tile size: fit the board in the space above the tray
const areaSize = ref({ w: 360, h: 480 })
let ro = null
watch(area, (el) => {
  ro?.disconnect()
  if (!el) return
  ro = new ResizeObserver(() => (areaSize.value = { w: el.clientWidth, h: el.clientHeight }))
  ro.observe(el)
})
onBeforeUnmount(() => ro?.disconnect())
const unit = computed(() => {
  const { w, h } = areaSize.value
  const t = Math.min((w - 16) / (size.value.w / 2 + 0.3), (h - 16) / (size.value.h / 2 + 0.3), 64)
  return Math.floor(t)
})
const sorted = computed(() => [...tiles.value].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x))

function pick(n) {
  level.value = n
  if (pip.introSeen.tiles) begin()
  else phase.value = 'intro'
}

async function begin() {
  pip.markIntroSeen('tiles')
  const c = cfg.value
  let board
  if (c.made) {
    tiles.value = []
    phase.value = 'building'
    const n = level.value
    board = await buildBoard(`tiles:${n}`, 'tiles', { cfg: { ...c }, seed: c.seed })
    if (level.value !== n || phase.value !== 'building') return
  } else board = makeTiles(c, c.seed)
  tiles.value = board.tiles.map((t) => ({ ...t }))
  size.value = { w: board.width, h: board.height }
  total.value = board.tiles.length
  tray.value = []
  held.value = []
  history.value = []
  undos.value = 0
  roomUsed.value = false
  cleared.value = 0
  results.value = null
  phase.value = 'playing'
}

function free(t) {
  return isFree(t, tiles.value)
}

function tapTile(t) {
  if (phase.value !== 'playing') return
  if (!free(t)) {
    playSound('miss')
    haptic('light')
    return
  }
  tiles.value = tiles.value.filter((x) => x !== t)
  toTray(t, 'board')
}

function tapHeld(t) {
  if (phase.value !== 'playing') return
  held.value = held.value.filter((x) => x !== t)
  toTray(t, 'held')
}

function toTray(t, from) {
  const r = addToTray(tray.value, t)
  history.value.push({ tile: t, from, cleared: Boolean(r.cleared) })
  tray.value = r.tray
  playSound('place')
  haptic('light')
  if (r.cleared !== null) {
    cleared.value += 3
    flash.value = r.cleared
    setTimeout(() => (flash.value = null), 500)
    setTimeout(() => playSound('match'), 80)
    if (!tiles.value.length && !held.value.length && !tray.value.length) setTimeout(() => finish(true), 600)
  } else if (tray.value.length >= TRAY) {
    setTimeout(() => finish(false), 450)
  }
}

function undo() {
  const last = history.value[history.value.length - 1]
  if (!last || last.cleared || phase.value !== 'playing' || undos.value >= 2) return
  history.value.pop()
  tray.value = tray.value.filter((x) => x !== last.tile)
  if (last.from === 'board') tiles.value = [...tiles.value, last.tile]
  else held.value = [...held.value, last.tile]
  undos.value += 1
  playSound('toggleOff')
}

function makeRoom() {
  if (roomUsed.value || !tray.value.length || phase.value !== 'playing') return
  held.value = [...held.value, ...tray.value.slice(0, 3)]
  tray.value = tray.value.slice(3)
  roomUsed.value = true
  history.value = []
  playSound('swap')
}

function finish(won) {
  if (phase.value !== 'playing') return
  phase.value = 'done'
  if (!won) {
    results.value = { success: false, title: 'The tray is full', subtitle: 'Look underneath before you pick. Which tiles will a move uncover?' }
    return
  }
  const stars = helpersUsed.value === 0 ? 3 : helpersUsed.value === 1 ? 2 : 1
  const reward = pip.completeLevel('tiles', level.value, stars)
  const unlocked = reward.unlocked && reward.unlocked <= TILES_LEVELS.length ? reward.unlocked : null
  justUnlocked.value = unlocked
  results.value = {
    success: true,
    stars,
    petals: reward.petals,
    unlocked,
    allDone: reward.firstClear && level.value === TILES_LEVELS.length,
    title: stars === 3 ? 'Spotless garden!' : 'All cleared!',
    subtitle: stars < 3 ? '3 stars: clear it without Undo or Make room.' : `${total.value} tiles, no help needed.`,
  }
}

function nextLevel() {
  justUnlocked.value = null
  pick(level.value + 1)
}

function tileStyle(t) {
  const u = unit.value
  const lift = t.z * Math.max(2, u * 0.06)
  return {
    left: `${(t.x / 2) * u - lift}px`,
    top: `${(t.y / 2) * u - lift}px`,
    width: `${u - 2}px`,
    height: `${u - 2}px`,
    zIndex: t.z * 10 + 1,
    background: FACES[t.kind % FACES.length],
  }
}
</script>

<template>
  <GameShell title="Garden Tiles" track="memory" :hide-title="phase === 'playing'" background="linear-gradient(180deg, #EAF1E4 0%, #F4EAD9 100%)" @close="emit('close')">
    <template #stats>
      <template v-if="phase === 'playing'">
        <button type="button" class="icon-btn h-9! w-9!" :disabled="undos >= 2 || !history.length || history[history.length - 1]?.cleared" :aria-label="`Undo, ${2 - undos} left`" @click="undo">
          <Icon name="undo" :size="16" :stroke="2.4" />
        </button>
      </template>
    </template>

    <LevelSelect
      v-if="phase === 'levels'"
      :levels="levelList"
      :progress="progress"
      :celebrate="justUnlocked"
      heading="Garden Tiles"
      @select="pick"
      @help="phase = 'intro'"
      @celebrated="justUnlocked = null"
    />

    <template v-else>
      <div class="px-5 pt-1">
        <div class="flex items-center gap-2.5">
          <span class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-bark-600 px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#FFFAF2]">
            Level {{ level }}
          </span>
          <span class="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-bark-500">Three alike clear away</span>
          <span class="shrink-0 text-[0.8125rem] font-extrabold tabular-nums text-bark-600">{{ total - cleared }} left</span>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-line">
          <div class="h-full rounded-full bg-leaf-400 transition-[width] duration-300" :style="{ width: `${(cleared / Math.max(1, total)) * 100}%` }" />
        </div>
      </div>

      <div ref="area" class="relative mx-3 mt-3 flex-1">
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" :style="{ width: `${(size.w / 2) * unit}px`, height: `${(size.h / 2) * unit}px` }">
          <TransitionGroup name="tile">
            <button
              v-for="t in sorted"
              :key="t.id"
              type="button"
              class="tile absolute"
              :class="{ 'is-blocked': !free(t) }"
              :style="tileStyle(t)"
              data-sound="none"
              :aria-label="free(t) ? KINDS[t.kind] : 'Covered tile'"
              @click="tapTile(t)"
            >
              <GoodIcon :id="KINDS[t.kind]" :size="Math.round(unit * 0.62)" />
            </button>
          </TransitionGroup>
        </div>
      </div>

      <!-- set aside, and the tray -->
      <div class="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div v-if="held.length" class="mb-2 flex justify-center gap-1.5">
          <button v-for="t in held" :key="t.id" type="button" class="slot-tile is-held" data-sound="none" :aria-label="KINDS[t.kind]" @click="tapHeld(t)">
            <GoodIcon :id="KINDS[t.kind]" :size="28" />
          </button>
        </div>
        <div class="tray" :class="{ 'is-danger': tray.length >= TRAY - 2 }">
          <div v-for="k in TRAY" :key="k" class="slot">
            <Transition name="slot">
              <span v-if="tray[k - 1]" :key="tray[k - 1].id" class="slot-tile" :class="{ 'is-flash': flash === tray[k - 1].kind }">
                <GoodIcon :id="KINDS[tray[k - 1].kind]" :size="28" />
              </span>
            </Transition>
          </div>
        </div>
        <div class="mt-2 flex justify-center">
          <button type="button" class="helper" :disabled="roomUsed || !tray.length" @click="makeRoom">
            <Icon name="box" :size="15" :stroke="2.2" /> Make room {{ roomUsed ? '(used)' : '' }}
          </button>
        </div>
      </div>

      <LevelIntro
        v-if="phase === 'intro'"
        :level="level"
        :goal="levelList[level - 1].goal"
        :stars="progress.stars[level] ?? 0"
        :tips="[
          { color: '#86AD72', text: 'Tap a tile with nothing on top to move it to the tray' },
          { color: '#F2C66B', text: 'Three alike in the tray clear away' },
          { color: '#D9533F', text: 'Fill all seven spaces and it’s over' },
          { color: '#7CB3D6', text: 'Undo twice, or Make room once. 3 stars: no help' },
        ]"
        @start="begin"
        @levels="phase = 'levels'"
      />

      <GameResults
        v-if="phase === 'done' && results"
        :success="results.success"
        :eyebrow="`Level ${level}`"
        :title="results.title"
        :subtitle="results.subtitle"
        :stars="results.success ? results.stars : -1"
        :stats="[
          { label: 'Cleared', value: cleared },
          { label: 'Undos', value: undos },
          { label: 'Make room', value: roomUsed ? 1 : 0 },
        ]"
        :petals="results.petals ?? 0"
        :has-next="results.success && level < TILES_LEVELS.length"
        :unlocked="results.unlocked ?? null"
        :all-done="results.allDone ?? false"
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
.tile {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22%;
  border: 1.5px solid rgb(120 95 70 / 0.25);
  box-shadow: 0 3px 0 #c9b08a, 0 5px 8px -3px rgb(58 45 35 / 0.45);
  transition: filter 0.2s ease, transform 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.tile:active:not(.is-blocked) {
  transform: translateY(2px);
}
.tile.is-blocked {
  filter: brightness(0.72) saturate(0.6);
}
.tile-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.tile-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.6);
}
.tray {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.3rem;
  padding: 0.45rem;
  border-radius: 1.2rem;
  background: #b98c63;
  box-shadow: inset 0 3px 6px rgb(58 45 35 / 0.35), 0 8px 18px -12px rgb(58 45 35 / 0.7);
  transition: background-color 0.3s ease;
}
.tray.is-danger {
  background: #c9684f;
}
.slot {
  display: flex;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.18);
}
.slot-tile {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: #fff8ec;
  box-shadow: 0 2px 0 #c9b08a;
}
.slot-tile.is-held {
  height: 2.75rem;
  width: 2.75rem;
  border: 1.5px dashed var(--color-water-400);
}
.slot-tile.is-flash {
  animation: flash 0.45s ease;
}
@keyframes flash {
  50% { transform: scale(1.15); background: #fbe7a8; }
}
.slot-enter-active {
  transition: transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1), opacity 0.2s ease;
}
.slot-enter-from {
  opacity: 0;
  transform: translateY(-24px) scale(0.6);
}
.slot-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slot-leave-to {
  opacity: 0;
  transform: scale(1.3);
}
.helper {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 2.25rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-bark-600);
}
.helper:disabled {
  opacity: 0.45;
}
</style>
