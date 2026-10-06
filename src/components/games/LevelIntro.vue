<script setup>
// The card before a level starts: the goal, a few tips, and a Start button.
import StarRow from './StarRow.vue'

defineProps({
  level: { type: Number, default: 0 }, // 0 hides the level label
  goal: { type: String, required: true },
  tips: { type: Array, default: () => [] }, // [{ color, text }]
  stars: { type: Number, default: 0 },
  dark: { type: Boolean, default: false },
  showLevels: { type: Boolean, default: true },
})

const emit = defineEmits(['start', 'levels'])
</script>

<template>
  <div class="absolute inset-0 z-20 flex items-center justify-center p-5" :class="dark ? 'bg-[#1d2236]/45' : 'bg-cream/40'">
    <div class="pop w-full max-w-sm rounded-[1.75rem] bg-surface p-6 shadow-float">
      <div class="flex items-center justify-between">
        <p class="eyebrow">{{ level ? `Level ${level}` : 'How to play' }}</p>
        <StarRow v-if="level" :count="stars" :size="16" />
      </div>
      <h2 class="mt-1.5 font-display text-[1.6rem] font-semibold leading-tight text-bark-600">{{ goal }}</h2>
      <ul v-if="tips.length" class="mt-4 space-y-2.5">
        <li v-for="tip in tips" :key="tip.text" class="flex items-center gap-3 text-sm font-semibold text-bark-500">
          <span class="h-3 w-3 shrink-0 rounded-full" :style="{ background: tip.color }" />
          {{ tip.text }}
        </li>
      </ul>
      <button type="button" class="btn btn-primary mt-6 w-full" data-sound="none" @click="emit('start')">Start</button>
      <button v-if="showLevels" type="button" class="btn btn-ghost btn-sm mt-1 w-full" @click="emit('levels')">All levels</button>
    </div>
  </div>
</template>

<style scoped>
.pop {
  animation: pop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
@keyframes pop {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: none; }
}
</style>
