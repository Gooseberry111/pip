<script setup>
// A grid of levels with their stars. Finishing a level unlocks the next one.
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Icon from '../Icon.vue'
import StarRow from './StarRow.vue'
import Celebration from '../Celebration.vue'

const props = defineProps({
  levels: { type: Array, required: true }, // [{ goal: 'Catch 12 raindrops' }]
  progress: { type: Object, required: true }, // { unlocked, stars }
  dark: { type: Boolean, default: false },
  heading: { type: String, default: 'Choose a level' },
  celebrate: { type: Number, default: null }, // a newly unlocked level to open with a flourish
})

const emit = defineEmits(['select', 'celebrated', 'help'])

// The new tile starts locked, then the lock wiggles and pops off.
const opening = ref(props.celebrate) // level still showing its lock
const popped = ref(null)
const burst = ref(0)
const burstAt = ref({ x: 50, y: 50 })
const tiles = ref([])
let timers = []

function isLocked(n) {
  return n > props.progress.unlocked || n === opening.value
}

onMounted(() => {
  if (!props.celebrate) return
  const n = props.celebrate
  timers.push(
    setTimeout(() => {
      const el = tiles.value[n - 1]
      const host = el?.offsetParent
      if (el && host) {
        burstAt.value = {
          x: ((el.offsetLeft + el.offsetWidth / 2) / host.offsetWidth) * 100,
          y: ((el.offsetTop + el.offsetHeight / 2) / host.offsetHeight) * 100,
        }
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
      popped.value = n
      playSound('unlockPop')
      haptic('success')
    }, 700),
    setTimeout(() => {
      opening.value = null
      burst.value += 1
      playSound('levelUp')
    }, 1150),
    setTimeout(() => emit('celebrated'), 2600),
  )
})

onBeforeUnmount(() => timers.forEach(clearTimeout))

// the second half of every game is marked Hard, the last few Expert
function tier(i) {
  const n = props.levels.length
  if (i >= n - Math.max(3, Math.round(n * 0.2))) return 'Expert'
  if (i >= Math.floor(n / 2)) return 'Hard'
  return ''
}

const earned = computed(() => Object.values(props.progress.stars).reduce((a, b) => a + b, 0))
</script>

<template>
  <div class="flex flex-1 flex-col overflow-y-auto px-5 pb-10 pt-3">
    <div class="flex items-end justify-between gap-3">
      <div class="min-w-0">
        <p class="eyebrow" :class="{ '!text-white/55': dark }">Levels</p>
        <h2 class="truncate font-display text-2xl font-semibold" :class="dark ? 'text-[#F6EFE2]' : 'text-bark-600'">{{ heading }}</h2>
      </div>
      <span
        class="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums"
        :class="dark ? 'bg-white/10 text-[#F6EFE2]' : 'bg-honey-100 text-bark-600'"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" fill="#EDB64C" /></svg>
        {{ earned }} / {{ levels.length * 3 }}
      </span>
    </div>
    <button
      type="button"
      class="mt-2 inline-flex h-8 items-center gap-1.5 self-start rounded-full px-3 text-xs font-bold transition"
      :class="dark ? 'bg-white/10 text-[#F6EFE2] hover:bg-white/15' : 'border border-line bg-surface text-bark-500 hover:bg-sand-100'"
      @click="emit('help')"
    >
      <span class="flex h-4 w-4 items-center justify-center rounded-full text-[0.625rem] font-extrabold" :class="dark ? 'bg-white/20' : 'bg-sand-200'">?</span>
      How to play
    </button>

    <div class="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Celebration :trigger="burst" :x="burstAt.x" :y="burstAt.y" :count="20" :spread="120" />
      <button
        v-for="(level, i) in levels"
        :key="i"
        :ref="(el) => (tiles[i] = el)"
        type="button"
        class="tile relative flex min-h-[7.25rem] flex-col justify-between rounded-[1.25rem] p-4 text-left transition duration-200 active:scale-[0.97]"
        :class="[
          !isLocked(i + 1)
            ? dark
              ? 'bg-white/10 ring-1 ring-white/12 hover:bg-white/15'
              : 'card'
            : dark
              ? 'bg-white/5'
              : 'bg-sand-100',
          { 'is-next': i + 1 === progress.unlocked && !progress.stars[i + 1] && !isLocked(i + 1), 'is-opening': popped === i + 1 },
        ]"
        :disabled="isLocked(i + 1)"
        :aria-label="`Level ${i + 1}. ${level.goal}`"
        :style="{ animationDelay: `${Math.min(i, 12) * 40}ms` }"
        @click="emit('select', i + 1)"
      >
        <div class="flex items-start justify-between">
          <span class="flex items-center gap-1.5">
            <span class="font-display text-3xl font-semibold leading-none" :class="dark ? 'text-[#F6EFE2]' : 'text-bark-600'">{{ i + 1 }}</span>
            <span
              v-if="tier(i)"
              class="rounded-full px-1.5 py-0.5 text-[0.5625rem] font-extrabold uppercase tracking-wider"
              :class="tier(i) === 'Expert' ? 'bg-clay-100 text-clay-400' : dark ? 'bg-white/10 text-white/70' : 'bg-honey-100 text-bark-500'"
            >
              {{ tier(i) }}
            </span>
          </span>
          <Icon
            v-if="isLocked(i + 1)"
            name="lock"
            :size="16"
            :class="[dark ? 'text-white/35' : 'text-bark-300', { 'lock-pop': popped === i + 1 }]"
          />
          <span v-else-if="celebrate === i + 1" class="new-tag rounded-full bg-leaf-400 px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wider text-white">New</span>
          <StarRow v-else :count="progress.stars[i + 1] ?? 0" :size="15" :dark="dark" />
        </div>
        <p class="mt-3 text-[0.8125rem] font-semibold leading-snug" :class="dark ? 'text-white/65' : 'text-bark-400'">{{ level.goal }}</p>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tile {
  animation: rise 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
.tile:disabled {
  opacity: 0.6;
}
.tile.is-opening:disabled {
  opacity: 1;
  animation: tile-shake 0.45s ease-in-out;
}
.tile.is-opening:not(:disabled) {
  animation: tile-pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.lock-pop {
  animation: lock-pop 0.45s ease-in forwards;
}
.new-tag {
  animation: tile-pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes tile-shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
@keyframes tile-pop {
  0% { transform: scale(0.85); }
  60% { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes lock-pop {
  0% { transform: translateY(0) rotate(0); opacity: 1; }
  100% { transform: translate(8px, -22px) rotate(35deg); opacity: 0; }
}
.is-next::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 1.5rem;
  border: 2px solid var(--color-leaf-300);
  animation: pulse 2.2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
