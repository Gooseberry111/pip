<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePipStore } from '@/stores/pip'
import { DAILY_TASKS } from '@/data/daily'
import { PACKET_COST, packetItems } from '@/data/items'
import {
  GAMES,
  GAME_GROUPS,
  COMING_SOON,
  MEMORY_LEVELS,
  RAIN_LEVELS,
  FIREFLY_LEVELS,
  GLIDE_LEVELS,
  PUZZLE_LEVELS,
  BURST_LEVELS,
  RACE_LEVELS,
  RHYTHM_LEVELS,
  HOTEL_LEVELS,
  POP_LEVELS,
} from '@/data/games'
import { PICTURE_LEVELS, SEARCH_LEVELS } from '@/data/words'
import { haptic } from '@/utils/haptics'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import PetalBadge from '@/components/PetalBadge.vue'
import PetalIcon from '@/components/PetalIcon.vue'
import UnlockReveal from '@/components/UnlockReveal.vue'
import WeeklyGoals from '@/components/WeeklyGoals.vue'
import GameArt from '@/components/games/GameArt.vue'
import BreatheWithPip from '@/components/games/BreatheWithPip.vue'
import RaindropCatch from '@/components/games/RaindropCatch.vue'
import SeedMemory from '@/components/games/SeedMemory.vue'
import FireflyNight from '@/components/games/FireflyNight.vue'
import FlowerSong from '@/components/games/FlowerSong.vue'
import SeedGlide from '@/components/games/SeedGlide.vue'
import BloomPuzzle from '@/components/games/BloomPuzzle.vue'
import BloomBurst from '@/components/games/BloomBurst.vue'
import GardenTacToe from '@/components/games/GardenTacToe.vue'
import GardenCheckers from '@/components/games/GardenCheckers.vue'
import SnailRace from '@/components/games/SnailRace.vue'
import RainRhythm from '@/components/games/RainRhythm.vue'
import BugHotel from '@/components/games/BugHotel.vue'
import PetalPop from '@/components/games/PetalPop.vue'
import LeafWords from '@/components/games/LeafWords.vue'
import PacketOpening from '@/components/games/PacketOpening.vue'

const pip = usePipStore()
const router = useRouter()
const route = useRoute()

const activeGame = ref(null)
const packetOpen = ref(false)
const revealed = ref(null)
const soonTapped = ref(null)

const tasks = computed(() => DAILY_TASKS.map((t) => ({ ...t, text: t.label(pip.plantName), done: pip.isTaskDone(t.id) })))
const doneCount = computed(() => tasks.value.filter((t) => t.done).length)

const totalPacketItems = packetItems().length
const found = computed(() => totalPacketItems - pip.lockedPacketItems.length)
const allFound = computed(() => pip.lockedPacketItems.length === 0)
const petalsNeeded = computed(() => Math.max(0, PACKET_COST - pip.petals))

const LEVEL_COUNTS = {
  rain: RAIN_LEVELS.length,
  memory: MEMORY_LEVELS.length,
  firefly: FIREFLY_LEVELS.length,
  glide: GLIDE_LEVELS.length,
  puzzle: PUZZLE_LEVELS.length,
  burst: BURST_LEVELS.length,
  race: RACE_LEVELS.length,
  rhythm: RHYTHM_LEVELS.length,
  hotel: HOTEL_LEVELS.length,
  pop: POP_LEVELS.length,
}
const ART_BG = {
  rain: '#D7E6EC',
  memory: '#E1ECD8',
  firefly: '#2E3754',
  song: '#F0E4EE',
  breathe: '#E8E2EE',
  glide: '#E3EDF1',
  puzzle: '#F6E5E1',
  burst: '#EAF0DF',
  tac: '#EEF3E6',
  checkers: '#F6E5E1',
  race: '#F1EBDD',
  rhythm: '#E7E4F0',
  hotel: '#F3E9DA',
  pop: '#F9E6EA',
  words: '#E4EED9',
}

// the Play tab, in sections. An odd one out at the top of a section gets a wide tile.
const groups = computed(() =>
  GAME_GROUPS.map((g) => {
    const games = GAMES.filter((x) => x.group === g.id)
    return { ...g, games, wideFirst: games.length % 2 === 1 }
  }),
)

const GAME_COMPONENTS = {
  breathe: BreatheWithPip,
  rain: RaindropCatch,
  memory: SeedMemory,
  firefly: FireflyNight,
  song: FlowerSong,
  glide: SeedGlide,
  puzzle: BloomPuzzle,
  burst: BloomBurst,
  tac: GardenTacToe,
  checkers: GardenCheckers,
  race: SnailRace,
  rhythm: RainRhythm,
  hotel: BugHotel,
  pop: PetalPop,
  words: LeafWords,
}

function meta(game) {
  if (game.id === 'words') {
    const stars = pip.totalStars('words') + pip.totalStars('search')
    return `${stars} / ${(PICTURE_LEVELS.length + SEARCH_LEVELS.length) * 3}`
  }
  if (game.levels) return `${pip.totalStars(game.id)} / ${LEVEL_COUNTS[game.id] * 3}`
  if (game.id === 'tac') return 'Easy, medium, hard'
  if (game.id === 'checkers') return 'Classic rules'
  if (game.id === 'song') return pip.bestScores.song ? `Best ${pip.bestScores.song} notes` : 'New'
  return '1 minute'
}

function onTask(task) {
  if (task.id === 'breathe') activeGame.value = 'breathe'
  else if (task.id === 'play') activeGame.value = 'rain'
  else if (task.id === 'farm') router.push('/farm')
  else router.push('/')
}

function buyPacket() {
  if (!pip.canOpenPacket) return
  revealHeadline.value = 'From the seed packet'
  revealed.value = pip.openPacket()
  packetOpen.value = true
  haptic('soft')
}

function useRevealed(item) {
  pip.wear(item.category, item.id)
  revealed.value = null
}

// The check-in can send someone straight to a game (a calm minute of breathing).
onMounted(() => {
  const game = route.query.game
  if (game && GAMES.some((g) => g.id === game)) {
    activeGame.value = game
    router.replace({ query: {} })
  }
})

const revealHeadline = ref('From the seed packet')

function onBloomTreasure(item) {
  revealHeadline.value = 'From the bloom box'
  revealed.value = item
}

function tapSoon(id) {
  soonTapped.value = id
  haptic('light')
  setTimeout(() => {
    if (soonTapped.value === id) soonTapped.value = null
  }, 1600)
}
</script>

<template>
  <section class="page">
    <PageHeader eyebrow="Play" title="Games and rituals">
      <PetalBadge :count="pip.petals" />
    </PageHeader>

    <!-- today -->
    <div class="card mt-5 overflow-hidden">
      <div class="flex items-center justify-between px-5 pb-2 pt-4">
        <div>
          <h2 class="title-md">Today with {{ pip.plantName }}</h2>
          <p class="mt-0.5 text-xs font-semibold text-bark-400">
            {{ doneCount === tasks.length ? 'All done. What a lovely day.' : 'No pressure. Anything counts.' }}
          </p>
        </div>
        <div class="relative h-11 w-11">
          <svg viewBox="0 0 44 44" class="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-sand-100)" stroke-width="5" />
            <circle
              cx="22" cy="22" r="18" fill="none" stroke="var(--color-leaf-400)" stroke-width="5" stroke-linecap="round"
              :stroke-dasharray="113.1" :stroke-dashoffset="113.1 * (1 - doneCount / tasks.length)"
              class="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-bark-600">{{ doneCount }}/{{ tasks.length }}</span>
        </div>
      </div>
      <ul class="divide-y divide-line">
        <li v-for="task in tasks" :key="task.id">
          <button type="button" class="flex min-h-14 w-full items-center gap-3.5 px-5 text-left transition hover:bg-cream/60" @click="onTask(task)">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-500"
              :class="task.done ? 'bg-leaf-400 text-white' : 'bg-sand-100 text-bark-500'"
            >
              <Icon :name="task.done ? 'check' : task.icon" :size="16" :stroke="2.2" />
            </span>
            <span class="flex-1 text-[0.9375rem] font-semibold" :class="task.done ? 'text-bark-300 line-through decoration-sand-300' : 'text-bark-600'">
              {{ task.text }}
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-extrabold" :class="task.done ? 'text-bark-300' : 'text-petal-500'">
              <PetalIcon :size="13" />+{{ task.reward }}
            </span>
          </button>
        </li>
      </ul>
    </div>

    <!-- this week -->
    <WeeklyGoals class="mt-3" @treasure="onBloomTreasure" />

    <!-- games -->
    <div class="mt-8 flex items-baseline justify-between">
      <h2 class="title-md">Games</h2>
      <span class="eyebrow">{{ GAMES.length }} to play</span>
    </div>
    <section v-for="g in groups" :key="g.id" class="mt-5 first-of-type:mt-3">
      <div class="flex items-baseline gap-2">
        <h3 class="font-display text-base font-semibold text-bark-600">{{ g.title }}</h3>
        <span class="truncate text-xs font-semibold text-bark-400">{{ g.blurb }}</span>
      </div>
    <div class="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        v-for="(game, i) in g.games"
        :key="game.id"
        type="button"
        class="game-tile card group overflow-hidden text-left transition duration-300 active:scale-[0.98]"
        :class="{ 'col-span-2 sm:col-span-1': i === 0 && g.wideFirst }"
        @click="activeGame = game.id"
      >
        <div class="relative overflow-hidden" :class="i === 0 && g.wideFirst ? 'aspect-[16/8] sm:aspect-[16/11]' : 'aspect-[16/11]'" :style="{ background: ART_BG[game.id] }">
          <GameArt :game="game.id" class="transition-transform duration-500 group-hover:scale-105" />
          <span
            class="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wider"
            :class="game.id === 'firefly' ? 'bg-white/15 text-white' : 'bg-white/80 text-bark-500'"
          >
            {{ game.tag }}
          </span>
        </div>
        <div class="px-3.5 pb-3.5 pt-3">
          <p class="font-display text-[1.0625rem] font-semibold leading-tight text-bark-600">{{ game.title }}</p>
          <p class="mt-0.5 line-clamp-1 text-xs font-medium text-bark-400">{{ game.blurb }}</p>
          <p class="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-bark-500">
            <Icon v-if="game.levels" name="star" :size="13" :stroke="2.2" class="text-honey-400" />
            {{ meta(game) }}
          </p>
        </div>
      </button>
    </div>
    </section>

    <!-- seed packets -->
    <div class="packet-card relative mt-8 overflow-hidden rounded-[var(--radius-card)] p-5">
      <div class="flex items-center gap-4">
        <svg viewBox="0 0 120 150" class="packet-mini w-[4.5rem] shrink-0" aria-hidden="true">
          <path d="M10 8 Q10 2 16 2 L104 2 Q110 2 110 8 L110 28 L10 28Z" fill="#EBAFB1" />
          <path d="M10 28 L110 28 L110 140 Q110 146 104 146 L16 146 Q10 146 10 140Z" fill="#FFFBF4" />
          <rect x="20" y="40" width="80" height="62" rx="10" fill="#F3E6D3" />
          <path d="M60 94 Q60 80 60 70" stroke="#79A066" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M60 74 C54 62 42 62 40 68 C46 76 56 77 60 74Z" fill="#8DB07A" />
          <path d="M60 71 C66 58 78 58 80 64 C74 72 64 73 60 71Z" fill="#A6C78F" />
          <circle cx="92" cy="44" r="11" fill="#F2C66B" />
          <text x="92" y="49" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="Fredoka Variable, sans-serif">?</text>
        </svg>
        <div class="min-w-0 flex-1">
          <p class="eyebrow text-petal-500!">Rare finds</p>
          <h2 class="title-md mt-0.5">Mystery seed packet</h2>
          <div class="mt-2 flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70">
              <div class="h-full rounded-full bg-petal-400 transition-[width] duration-700" :style="{ width: `${(found / totalPacketItems) * 100}%` }" />
            </div>
            <span class="text-xs font-extrabold tabular-nums text-bark-500">{{ found }}/{{ totalPacketItems }}</span>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-primary mt-4 w-full" data-sound="none" :disabled="!pip.canOpenPacket" @click="buyPacket">
        <template v-if="allFound">You found everything!</template>
        <template v-else-if="pip.canOpenPacket">Open for {{ PACKET_COST }} <PetalIcon :size="19" /></template>
        <template v-else><PetalIcon :size="17" /> {{ petalsNeeded }} more to open</template>
      </button>
    </div>

    <!-- coming soon -->
    <div class="mt-8 flex items-baseline justify-between">
      <h2 class="title-md">Coming soon</h2>
      <span class="eyebrow">Growing in the greenhouse</span>
    </div>
    <div class="no-scrollbar -mx-5 mt-3 overflow-x-auto px-5 pb-1">
      <div class="flex w-max gap-3">
        <button
          v-for="game in COMING_SOON"
          :key="game.id"
          type="button"
          class="soon card flex w-40 flex-col overflow-hidden text-left"
          :class="{ 'is-tapped': soonTapped === game.id }"
          @click="tapSoon(game.id)"
        >
          <div class="relative aspect-[16/11]" :style="{ background: game.tint }">
            <GameArt :game="game.id" class="opacity-60 grayscale-[35%]" />
            <span class="absolute inset-0 flex items-center justify-center">
              <span class="inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-wider shadow-soft" :style="{ color: game.accent }">
                <Icon name="lock" :size="11" :stroke="2.4" /> Coming soon
              </span>
            </span>
          </div>
          <div class="px-3.5 pb-3.5 pt-3">
            <p class="font-display text-base font-semibold leading-tight text-bark-500">{{ game.title }}</p>
            <p class="mt-0.5 min-h-[2.5rem] text-xs font-medium leading-snug text-bark-400">
              {{ soonTapped === game.id ? 'Still sprouting. Check back soon!' : game.blurb }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <component :is="GAME_COMPONENTS[activeGame]" v-if="activeGame" @close="activeGame = null" />

    <PacketOpening :open="packetOpen" @opened="packetOpen = false" />
    <UnlockReveal :item="packetOpen ? null : revealed" :headline="revealHeadline" @use="useRevealed" @close="revealed = null" />
  </section>
</template>

<style scoped>
.packet-card {
  background: linear-gradient(135deg, #f9e3e3 0%, #fbefe4 100%);
  border: 1px solid rgb(201 103 122 / 0.12);
}
.packet-mini {
  filter: drop-shadow(0 8px 10px rgb(91 70 54 / 0.15));
  animation: packet-bob 3.6s ease-in-out infinite;
}
@keyframes packet-bob {
  0%, 100% { transform: rotate(-4deg) translateY(0); }
  50% { transform: rotate(3deg) translateY(-4px); }
}
.game-tile:hover {
  transform: translateY(-2px);
}
.soon.is-tapped {
  animation: nudge 0.4s ease-in-out;
}
@keyframes nudge {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
