<script setup>
// Pip's journey: six little stops from seed to flower, with the path filling in as Pip grows.
import { computed } from 'vue'
import { GROWTH_STAGES } from '@/data/growthStages'

const props = defineProps({
  stageIndex: { type: Number, default: 0 },
  stagePercent: { type: Number, default: 0 }, // toward the next stage
  name: { type: String, default: 'Pip' },
  compact: { type: Boolean, default: false },
  level: { type: Number, default: 0 },
  levelPercent: { type: Number, default: 0 },
})

const atMax = computed(() => props.stageIndex >= GROWTH_STAGES.length - 1)
const fill = computed(() => {
  const steps = GROWTH_STAGES.length - 1
  return ((props.stageIndex + (atMax.value ? 0 : props.stagePercent / 100)) / steps) * 100
})
const label = computed(() => {
  const stage = GROWTH_STAGES[props.stageIndex]?.name.replace('Pip', props.name)
  return props.level ? `Level ${props.level} · ${stage}` : stage
})
const right = computed(() => {
  if (atMax.value && (!props.level || props.levelPercent >= 100)) return 'Fully grown'
  if (props.level) return `${props.levelPercent}% to level ${props.level + 1}`
  return `${props.stagePercent}% grown`
})
</script>

<template>
  <div class="w-full max-w-[19rem]">
    <div class="relative mx-3 h-9">
      <!-- track -->
      <div class="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-sand-200" />
      <div
        class="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-leaf-300 to-leaf-400 transition-[width] duration-[1600ms] ease-out"
        :style="{ width: `${fill}%` }"
      />
      <!-- stops -->
      <div
        v-for="(stage, i) in GROWTH_STAGES"
        :key="stage.id"
        class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        :style="{ left: `${(i / (GROWTH_STAGES.length - 1)) * 100}%` }"
      >
        <span
          class="stop flex items-center justify-center rounded-full transition-all duration-500"
          :class="[
            i === stageIndex ? 'is-current h-9 w-9 bg-surface shadow-soft ring-2 ring-leaf-300' : 'h-6 w-6',
            i < stageIndex ? 'bg-leaf-300' : i > stageIndex ? 'bg-sand-200' : '',
          ]"
          :title="stage.name"
        >
          <svg :width="i === stageIndex ? 22 : 14" :height="i === stageIndex ? 22 : 14" viewBox="0 0 20 20" aria-hidden="true">
            <g :fill="i <= stageIndex ? (i === stageIndex ? '#7EA76B' : '#fff') : '#C9B79F'" :stroke="i <= stageIndex ? (i === stageIndex ? '#7EA76B' : '#fff') : '#C9B79F'" stroke-linecap="round">
              <ellipse v-if="i === 0" cx="10" cy="12" rx="4.5" ry="3.4" transform="rotate(-18 10 12)" stroke="none" />
              <template v-else>
                <path :d="`M10 18 V${[0, 11, 9, 6, 5, 6][i]}`" stroke-width="1.8" fill="none" />
                <path d="M10 12 C7 9 4 10 4 12 C6 14 9 13 10 12Z" stroke="none" />
                <path d="M10 11 C13 8 16 9 16 11 C14 13 11 12 10 11Z" stroke="none" />
                <path v-if="i >= 2" d="M10 9 C8 5 5 6 5.5 8 C7 10 9 9.5 10 9Z" stroke="none" />
                <path v-if="i >= 3" d="M10 7.5 C12 3.5 15 4.5 14.5 6.5 C13 8.5 11 8 10 7.5Z" stroke="none" />
                <path v-if="i >= 4" d="M10 15 C6.5 13.5 3.5 15 4 16.5 C6 17.5 9 16.5 10 15Z" stroke="none" />
                <circle v-if="i === 5" cx="10" cy="4.5" r="3" :fill="i === stageIndex ? '#EBA5AF' : '#fff'" stroke="none" />
              </template>
            </g>
          </svg>
        </span>
      </div>
    </div>

    <div v-if="!compact" class="mt-2 flex items-baseline justify-between px-0.5 text-xs font-bold">
      <span class="text-bark-600">{{ label }}</span>
      <span class="text-bark-400">{{ right }}</span>
    </div>
  </div>
</template>

<style scoped>
.is-current {
  animation: glow-ring 3s ease-in-out infinite;
}
@keyframes glow-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgb(169 199 154 / 0.5), 0 4px 12px rgb(91 70 54 / 0.08); }
  50% { box-shadow: 0 0 0 6px rgb(169 199 154 / 0), 0 4px 12px rgb(91 70 54 / 0.08); }
}
</style>
