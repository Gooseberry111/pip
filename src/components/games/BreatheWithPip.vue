<script setup>
// Breathe with Pip: about a minute of slow breathing. A soft circle grows as you breathe in
// and settles as you breathe out, and Pip breathes along with you.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { BREATHE_PHASES, BREATHE_ROUNDS } from '@/data/daily'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import Pip from '../Pip.vue'
import PetalIcon from '../PetalIcon.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const state = ref('intro') // intro | breathing | done
const round = ref(0)
const phaseIndex = ref(0)
const secondsLeft = ref(0)
const reward = ref(0)

const phase = computed(() => BREATHE_PHASES[phaseIndex.value])
const expanded = computed(() => state.value === 'breathing' && phase.value.id !== 'out')
const orbDuration = computed(() => `${phase.value.seconds}s`)

let timer = null

function begin() {
  state.value = 'breathing'
  round.value = 0
  runPhase(0)
}

function runPhase(index) {
  phaseIndex.value = index
  secondsLeft.value = BREATHE_PHASES[index].seconds
  if (BREATHE_PHASES[index].id !== 'hold') {
    playSound('breath', pip.soundOn, { rising: BREATHE_PHASES[index].id === 'in' })
    haptic('light')
  }
  tick()
}

function tick() {
  timer = setTimeout(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value > 0) return tick()
    const next = phaseIndex.value + 1
    if (next < BREATHE_PHASES.length) return runPhase(next)
    round.value += 1
    if (round.value < BREATHE_ROUNDS) return runPhase(0)
    complete()
  }, 1000)
}

function complete() {
  clearTimeout(timer)
  state.value = 'done'
  reward.value = pip.completeTask('breathe')
  if (reward.value) playSound('petals', pip.soundOn)
  haptic('success')
}

function stop() {
  clearTimeout(timer)
  emit('close')
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <GameShell title="Breathe Together" track="breathe" background="linear-gradient(180deg, #E7E3EE 0%, #F1E7E2 50%, #F8F1E7 100%)" @close="stop">
    <div class="flex flex-1 flex-col items-center justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
      <!-- the breathing circle, with Pip in the middle -->
      <div class="relative flex aspect-square w-full max-w-[19rem] items-center justify-center">
        <span class="orb orb-outer absolute rounded-full" :class="{ 'is-expanded': expanded }" :style="{ transitionDuration: orbDuration }" />
        <span class="orb orb-inner absolute rounded-full" :class="{ 'is-expanded': expanded }" :style="{ transitionDuration: orbDuration }" />
        <div class="breathe-pip relative aspect-[200/250] w-[46%]" :class="{ 'is-expanded': expanded }" :style="{ transitionDuration: orbDuration }">
          <Pip
            :growth="pip.growthValue"
            :droop="0"
            health="healthy"
            :pot="pip.currentPot"
            :leaf="pip.currentLeaf"
            :flower="pip.currentFlower"
            :accessory="pip.currentAccessory"
            :calm="state !== 'done'"
            :interactive="false"
            :idle="false"
            class="h-full w-full"
          />
        </div>
      </div>

      <div class="mt-6 min-h-[8.5rem]">
        <Transition name="fade" mode="out-in">
          <div v-if="state === 'intro'" key="intro">
            <h2 class="font-display text-[1.6rem] font-semibold text-bark-600">Take a minute with {{ pip.plantName }}</h2>
            <p class="mx-auto mt-1.5 max-w-[18rem] text-sm text-bark-400">Follow the circle. Breathe in as it grows, out as it settles.</p>
            <button type="button" class="btn btn-primary mt-5 w-full max-w-[18rem]" @click="begin">
              Begin
            </button>
          </div>

          <div v-else-if="state === 'breathing'" key="breathing">
            <Transition name="fade" mode="out-in">
              <p :key="`${round}-${phase.id}`" class="font-display text-[2rem] font-semibold text-bark-600">{{ phase.label }}</p>
            </Transition>
            <p class="mt-1 text-sm font-bold tabular-nums text-bark-400">{{ secondsLeft }}</p>
            <div class="mt-4 flex justify-center gap-2" aria-label="Rounds">
              <span
                v-for="i in BREATHE_ROUNDS"
                :key="i"
                class="h-2 w-2 rounded-full transition-colors duration-500"
                :class="i <= round ? 'bg-leaf-400' : i === round + 1 ? 'bg-bark-300' : 'bg-sand-300'"
              />
            </div>
          </div>

          <div v-else key="done">
            <h2 class="font-display text-[1.6rem] font-semibold text-bark-600">Thank you for breathing with me.</h2>
            <p class="mt-1.5 text-sm text-bark-400">That was nice. Come back any time.</p>
            <p v-if="reward" class="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-petal-100 px-3.5 py-2 font-extrabold text-petal-500">
              <PetalIcon :size="18" /> +{{ reward }} petals
            </p>
            <button type="button" class="btn btn-primary mx-auto mt-5 flex w-full max-w-[18rem]" @click="emit('close')">
              Back to {{ pip.plantName }}
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </GameShell>
</template>

<style scoped>
.orb {
  inset: 18%;
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
  transform: scale(0.72);
}
.orb-outer {
  background: radial-gradient(circle, rgb(214 228 204 / 0.65) 0%, rgb(214 228 204 / 0) 70%);
  inset: 0;
}
.orb-inner {
  background: radial-gradient(circle at 40% 35%, #fffaf2 0%, #eef2e4 70%);
  box-shadow: 0 10px 40px rgb(141 176 122 / 0.25);
}
.orb.is-expanded {
  transform: scale(1);
}
.breathe-pip {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
  transform: scale(0.94);
}
.breathe-pip.is-expanded {
  transform: scale(1.04);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
