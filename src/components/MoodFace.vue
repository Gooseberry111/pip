<script setup>
// A soft round face for each mood in the daily check-in.
import { computed } from 'vue'
import { findMood } from '@/data/moods'

const props = defineProps({
  mood: { type: String, required: true },
  size: { type: Number, default: 48 },
})

const color = computed(() => findMood(props.mood)?.color ?? '#D8C9B5')
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22" :fill="color" />
    <ellipse cx="17" cy="15" rx="6" ry="3.4" fill="#fff" opacity="0.28" transform="rotate(-24 17 15)" />
    <g fill="#47352A" stroke="#47352A" stroke-linecap="round" stroke-linejoin="round">
      <!-- eyes -->
      <template v-if="mood === 'great'">
        <path d="M14 21 Q17 16.5 20 21 M28 21 Q31 16.5 34 21" stroke-width="2.2" fill="none" />
      </template>
      <template v-else-if="mood === 'tough'">
        <path d="M14 19 L19.5 21 M34 19 L28.5 21" stroke-width="2" fill="none" />
        <circle cx="17" cy="23" r="2.2" stroke="none" />
        <circle cx="31" cy="23" r="2.2" stroke="none" />
      </template>
      <template v-else-if="mood === 'low'">
        <path d="M13.5 22 Q17 24.5 20.5 22 M27.5 22 Q31 24.5 34.5 22" stroke-width="2" fill="none" />
      </template>
      <template v-else>
        <circle cx="17" cy="21.5" r="2.4" stroke="none" />
        <circle cx="31" cy="21.5" r="2.4" stroke="none" />
      </template>

      <!-- mouth -->
      <path v-if="mood === 'great'" d="M17 28.5 Q24 36 31 28.5 Q24 31 17 28.5Z" stroke-width="1.6" fill="#8E4F45" />
      <path v-else-if="mood === 'good'" d="M18.5 29 Q24 33.5 29.5 29" stroke-width="2" fill="none" />
      <path v-else-if="mood === 'okay'" d="M19 31 L29 31" stroke-width="2" fill="none" />
      <path v-else-if="mood === 'low'" d="M19.5 32 Q24 29.5 28.5 32" stroke-width="2" fill="none" />
      <path v-else d="M19 32.5 Q24 28.5 29 32.5" stroke-width="2" fill="none" />
    </g>
    <ellipse cx="12.5" cy="27" rx="3.4" ry="2" fill="#F09A8A" opacity="0.45" />
    <ellipse cx="35.5" cy="27" rx="3.4" ry="2" fill="#F09A8A" opacity="0.45" />
    <path v-if="mood === 'low'" d="M34 26 q1.6 2.6 0 4 q-1.6 -1.4 0 -4z" fill="#8FBFD1" />
  </svg>
</template>
