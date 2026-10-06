<script setup>
// The end of a round: stars, what was earned, and where to go next.
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import PetalIcon from '../PetalIcon.vue'
import Icon from '../Icon.vue'
import StarRow from './StarRow.vue'
import Celebration from '../Celebration.vue'

const props = defineProps({
  success: { type: Boolean, default: true },
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  stars: { type: Number, default: -1 }, // -1 hides the stars
  stats: { type: Array, default: () => [] }, // [{ label, value }]
  petals: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  best: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
  hasLevels: { type: Boolean, default: false },
  unlocked: { type: Number, default: null }, // a level this finish just opened
  allDone: { type: Boolean, default: false }, // the very last level, cleared for the first time
})

const emit = defineEmits(['next', 'again', 'levels', 'close'])

const showUnlock = ref(false)
const burst = ref(0)
let timer = null

onMounted(() => {
  playSound(props.success ? 'win' : 'lose')
  haptic(props.success ? 'success' : 'error')
  if (props.petals) setTimeout(() => playSound('petals'), 1400)
  // after the stars have landed, celebrate the new level
  if (props.unlocked || props.allDone) {
    timer = setTimeout(() => {
      showUnlock.value = true
      burst.value += 1
      playSound('levelUp')
      haptic('success')
      setTimeout(() => playSound('unlockPop'), 250)
    }, props.stars > 0 ? 450 + props.stars * 320 + 350 : 600)
  }
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="absolute inset-0 z-30 flex items-center justify-center bg-cream/50 p-5 backdrop-blur-[6px]">
    <div class="results w-full max-w-sm rounded-[1.75rem] bg-surface p-6 text-center shadow-float">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <div v-if="stars >= 0" class="mt-2 flex justify-center">
        <StarRow :count="stars" :size="42" animate />
      </div>
      <p v-if="best" class="mx-auto mt-3 inline-flex items-center gap-1 rounded-full bg-honey-100 px-3 py-1 text-[0.6875rem] font-extrabold uppercase tracking-wider text-clay-400">
        <Icon name="sparkle" :size="12" :stroke="2.4" /> New best
      </p>
      <h2 class="mt-2 font-display text-[1.7rem] font-semibold leading-tight text-bark-600">{{ title }}</h2>
      <p v-if="subtitle" class="mt-1 text-sm font-medium text-bark-400">{{ subtitle }}</p>

      <div
        v-if="stats.length"
        class="mt-5 grid divide-x divide-line rounded-2xl bg-cream py-3"
        :style="{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }"
      >
        <div v-for="s in stats" :key="s.label" class="px-1">
          <p class="font-display text-2xl font-semibold tabular-nums text-bark-600">{{ s.value }}</p>
          <p class="text-[0.6875rem] font-bold uppercase tracking-wide text-bark-400">{{ s.label }}</p>
        </div>
      </div>

      <div v-if="petals || water" class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span v-if="petals" class="earn inline-flex items-center gap-1.5 rounded-full bg-petal-100 px-3.5 py-1.5 text-sm font-extrabold text-petal-500">
          <PetalIcon :size="17" /> +{{ petals }} petals
        </span>
        <span v-if="water" class="earn inline-flex items-center gap-1.5 rounded-full bg-water-100 px-3.5 py-1.5 text-sm font-extrabold text-water-500" style="animation-delay: 1.5s">
          <Icon name="drop" :size="15" :stroke="2.4" /> Watered with rain
        </span>
      </div>

      <Transition name="unlock">
        <div
          v-if="showUnlock"
          class="unlock-banner relative mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
          :class="allDone ? 'bg-honey-100' : 'bg-leaf-200/70'"
        >
          <span
            class="lock flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface shadow-soft"
            :class="allDone ? 'text-honey-400' : 'text-leaf-500'"
          >
            <Icon :name="allDone ? 'trophy' : 'unlock'" :size="22" :stroke="2.2" />
          </span>
          <span class="min-w-0">
            <span class="eyebrow block" :class="allDone ? 'text-clay-400!' : 'text-leaf-500!'">{{ allDone ? 'You did it' : 'New level unlocked' }}</span>
            <span class="title-md block">{{ allDone ? 'Every level complete!' : `Level ${unlocked} is ready` }}</span>
          </span>
        </div>
      </Transition>

      <div class="mt-6 flex flex-col gap-1.5">
        <button
          v-if="success && hasNext"
          type="button"
          class="btn btn-primary w-full"
          :class="{ 'next-glow': showUnlock }"
          @click="emit('next')"
        >
          {{ unlocked ? `Play level ${unlocked}` : 'Next level' }}
        </button>
        <button type="button" class="btn w-full" :class="success && hasNext ? 'btn-secondary' : 'btn-primary'" @click="emit('again')">
          {{ success ? 'Play again' : 'Try again' }}
        </button>
        <div class="mt-1 flex gap-1.5">
          <button v-if="hasLevels" type="button" class="btn btn-ghost btn-sm flex-1" @click="emit('levels')">Levels</button>
          <button type="button" class="btn btn-ghost btn-sm flex-1" @click="emit('close')">Back to Pip</button>
        </div>
      </div>
    </div>
    <Celebration :trigger="burst" :y="44" :count="28" :spread="170" />
  </div>
</template>

<style scoped>
.results {
  animation: rise 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.15) both;
}
.unlock-enter-active {
  transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.4);
}
.unlock-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}
.unlock-banner .lock {
  animation: lock-open 0.9s cubic-bezier(0.3, 1.6, 0.5, 1) 0.1s both;
}
@keyframes lock-open {
  0% { transform: scale(0.4) rotate(-20deg); }
  40% { transform: scale(1.2) rotate(10deg); }
  70% { transform: scale(0.95) rotate(-4deg); }
  100% { transform: scale(1) rotate(0); }
}
.next-glow {
  animation: next-glow 1.8s ease-in-out infinite;
}
@keyframes next-glow {
  0%, 100% { box-shadow: 0 8px 18px -10px rgb(41 31 24 / 0.7), 0 0 0 0 rgb(134 173 114 / 0.5); }
  50% { box-shadow: 0 8px 18px -10px rgb(41 31 24 / 0.7), 0 0 0 7px rgb(134 173 114 / 0); }
}
.earn {
  animation: pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  animation-delay: 1.3s;
}
@keyframes rise {
  0% { opacity: 0; transform: translateY(24px) scale(0.96); }
  100% { opacity: 1; transform: none; }
}
@keyframes pop {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
