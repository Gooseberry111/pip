<script setup>
// The farm tour: Pip shows a new farmer around, one small step at a time.
// Each step finishes by itself when you do the thing (planting, picking, opening the board…).
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import Pip from '../Pip.vue'

const emit = defineEmits(['skip'])
const farm = useFarmStore()
const pip = usePipStore()

const STEPS = [
  { text: (n) => `Welcome to our farm! I’m so happy you’re here. Let’s grow something together.`, next: 'Let’s go' },
  { text: () => 'Tap one of the brown soil plots and plant some wheat. Wheat is free.' },
  { text: () => 'Wheat grows in about a minute. When it’s ready, tap it to pick it. It goes into the barn.' },
  { text: () => 'Our neighbours leave orders on the board. Tap Orders to see what they’d like.' },
  { text: (n) => `Dishes from the kitchen sell for more, and they’re my favourite treats. Tap Kitchen to have a look.` },
  { text: () => 'Last thing: tap Arrange to move things around. Then visit the Shop to make the farm your own.' },
]

const step = computed(() => farm.state.tutorial)
const current = computed(() => (typeof step.value === 'number' ? STEPS[step.value] : null))
</script>

<template>
  <Transition name="tour">
    <div v-if="current" class="tour fixed inset-x-0 z-30 mx-auto max-w-lg px-4">
      <div class="flex items-start gap-3 rounded-[1.5rem] border border-line bg-surface/97 p-3 shadow-float backdrop-blur-xl">
        <div class="relative h-16 w-14 shrink-0">
          <Pip
            :growth="pip.growthValue"
            :droop="0"
            health="healthy"
            :pot="pip.currentPot"
            :leaf="pip.currentLeaf"
            :flower="pip.currentFlower"
            :accessory="pip.currentAccessory"
            :interactive="false"
            class="h-full w-full"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="eyebrow text-leaf-500!">Farm tour · {{ step + 1 }} of {{ STEPS.length }}</p>
          <p :key="step" class="line mt-1 text-sm font-semibold leading-snug text-bark-600">{{ current.text(pip.plantName) }}</p>
          <div class="mt-2 flex items-center gap-2">
            <button v-if="current.next" type="button" class="btn btn-primary btn-sm h-8! px-3!" @click="farm.tourNext(step)">{{ current.next }}</button>
            <button type="button" class="text-xs font-bold text-bark-400" @click="emit('skip')">Skip the tour</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tour {
  bottom: calc(5.75rem + env(safe-area-inset-bottom));
}
.line {
  animation: line-in 0.35s ease-out both;
}
@keyframes line-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
.tour-enter-active,
.tour-leave-active {
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.tour-enter-from,
.tour-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
