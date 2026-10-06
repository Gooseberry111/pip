<script setup>
// Soft, slowly turning light rays behind something special.
import { useId } from 'vue'

const uid = useId()

defineProps({
  color: { type: String, default: '#F6E3B4' },
})
</script>

<template>
  <svg viewBox="-100 -100 200 200" class="rays pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient :id="`${uid}-fade`">
        <stop offset="0.15" stop-color="#fff" stop-opacity="1" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
      <mask :id="`${uid}-mask`"><circle r="100" :fill="`url(#${uid}-fade)`" /></mask>
    </defs>
    <g :mask="`url(#${uid}-mask)`">
      <path v-for="i in 12" :key="i" :transform="`rotate(${i * 30})`" d="M0 0 L-9 -100 L9 -100Z" :fill="color" opacity="0.55" />
      <circle r="38" :fill="color" opacity="0.6" />
    </g>
  </svg>
</template>

<style scoped>
.rays {
  animation: spin 24s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .rays {
    animation: none;
  }
}
</style>
