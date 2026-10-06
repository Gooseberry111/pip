<script setup>
// Soft sparkles around Pip for growth moments. Uses Pip's 200 x 250 canvas.
defineProps({
  active: { type: Boolean, default: false },
  color: { type: String, default: '#E9C77E' },
})

const sparkles = [
  { x: 52, y: 80, s: 1, delay: 0 },
  { x: 150, y: 64, s: 0.8, delay: 0.15 },
  { x: 40, y: 140, s: 0.6, delay: 0.3 },
  { x: 160, y: 128, s: 1.1, delay: 0.25 },
  { x: 98, y: 38, s: 0.7, delay: 0.45 },
  { x: 128, y: 96, s: 0.5, delay: 0.6 },
  { x: 70, y: 112, s: 0.55, delay: 0.7 },
]
</script>

<template>
  <svg viewBox="0 0 200 250" class="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
    <g v-if="active">
      <g v-for="(sp, i) in sparkles" :key="i" :transform="`translate(${sp.x} ${sp.y}) scale(${sp.s})`">
        <path
          class="sparkle"
          :style="{ animationDelay: `${sp.delay}s` }"
          d="M0 -9 C1 -3 3 -1 9 0 C3 1 1 3 0 9 C-1 3 -3 1 -9 0 C-3 -1 -1 -3 0 -9Z"
          :fill="i % 3 === 1 ? '#F3DDA9' : color"
        />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.sparkle {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: sparkle 1.6s ease-in-out forwards;
}
@keyframes sparkle {
  0% { opacity: 0; transform: scale(0.2) rotate(0deg); }
  35% { opacity: 1; transform: scale(1.1) rotate(20deg); }
  70% { opacity: 0.8; transform: scale(0.9) rotate(35deg); }
  100% { opacity: 0; transform: scale(0.3) rotate(50deg) translateY(-6px); }
}
</style>
