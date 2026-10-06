<script setup>
// The Pip wordmark: a rounded "pip" whose i has a tiny sprout for a dot.
defineProps({
  size: { type: Number, default: 30 },
})
</script>

<template>
  <span class="pip-logo inline-flex items-end font-display font-semibold leading-none text-bark-600" :style="{ fontSize: `${size}px` }" aria-label="Pip">
    <span aria-hidden="true">p</span>
    <span class="relative" aria-hidden="true">
      ı
      <svg class="sprout absolute left-1/2 -translate-x-1/2" :style="{ top: `${-size * 0.32}px` }" :width="size * 0.5" :height="size * 0.42" viewBox="0 0 20 16">
        <path d="M10 16 Q10 11 10 8" stroke="#79A066" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M10 9 C8 4 3 3 1 5 C3 9 7 10 10 9Z" fill="#8DB07A" />
        <path d="M10 8 C12 2 17 1 19 3 C17 8 13 9 10 8Z" fill="#A6C78F" />
      </svg>
    </span>
    <span aria-hidden="true">p</span>
  </span>
</template>

<style scoped>
.sprout {
  transform-origin: 50% 100%;
  animation: sprout-sway 5s ease-in-out infinite;
}
@keyframes sprout-sway {
  0%, 100% { transform: translateX(-50%) rotate(-6deg); }
  50% { transform: translateX(-50%) rotate(6deg); }
}
@media (prefers-reduced-motion: reduce) {
  .sprout {
    animation: none;
  }
}
</style>
