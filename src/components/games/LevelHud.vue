<script setup>
// The strip under the header while playing: which level you're on, the goal, and progress.
import { computed } from 'vue'

const props = defineProps({
  level: { type: Number, required: true },
  total: { type: Number, required: true },
  goal: { type: String, required: true },
  value: { type: Number, default: 0 },
  target: { type: Number, default: 1 },
  color: { type: String, default: 'var(--color-leaf-400)' },
  dark: { type: Boolean, default: false },
})

const fraction = computed(() => Math.min(1, props.value / props.target))
const done = computed(() => props.value >= props.target)
</script>

<template>
  <div class="relative z-10 px-5 pt-1">
    <div class="flex items-center gap-2.5">
      <span
        class="inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[0.6875rem] font-extrabold uppercase tracking-wider"
        :class="dark ? 'bg-[#F6EFE2] text-[#2E3754]' : 'bg-bark-600 text-[#FFFAF2]'"
      >
        Level {{ level }}<span class="opacity-55">/ {{ total }}</span>
      </span>
      <span class="min-w-0 flex-1 truncate text-[0.8125rem] font-bold" :class="dark ? 'text-white/80' : 'text-bark-500'">{{ goal }}</span>
      <span
        class="shrink-0 text-[0.8125rem] font-extrabold tabular-nums"
        :class="[dark ? 'text-white/80' : 'text-bark-600', { 'goal-done': done }]"
      >
        {{ Math.min(value, target) }}/{{ target }}
      </span>
    </div>
    <div class="mt-2 h-2 overflow-hidden rounded-full" :class="dark ? 'bg-white/10' : 'bg-white/70 ring-1 ring-line'">
      <div class="h-full rounded-full transition-[width] duration-300 ease-out" :style="{ width: `${fraction * 100}%`, background: color }" />
    </div>
  </div>
</template>

<style scoped>
.goal-done {
  animation: goal-pop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes goal-pop {
  50% { transform: scale(1.25); }
}
</style>
