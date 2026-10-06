<script setup>
// A gentle burst of petals, stars and dots that float out and drift down.
// Change `trigger` to a new value to play it again.
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  trigger: { type: [Number, Boolean], default: 0 },
  count: { type: Number, default: 22 },
  x: { type: Number, default: 50 }, // origin, % of this layer
  y: { type: Number, default: 50 },
  spread: { type: Number, default: 150 }, // px
})

const COLORS = ['#F3B4BE', '#EDB64C', '#A9C79A', '#8FBFD1', '#E9A88F', '#F8E2A6']
const SHAPES = ['petal', 'star', 'dot', 'petal', 'star']

const pieces = ref([])
let burst = 0

function play() {
  burst += 1
  pieces.value = Array.from({ length: props.count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / props.count + Math.random() * 0.5
    const dist = props.spread * (0.5 + Math.random() * 0.6)
    return {
      key: `${burst}-${i}`,
      shape: SHAPES[i % SHAPES.length],
      color: COLORS[i % COLORS.length],
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.8 - 30,
      rot: (Math.random() - 0.5) * 540,
      size: 7 + Math.random() * 7,
      delay: Math.random() * 0.12,
      duration: 1.3 + Math.random() * 0.6,
    }
  })
  setTimeout(() => {
    if (pieces.value[0]?.key.startsWith(`${burst}-`)) pieces.value = []
  }, 2300)
}

watch(
  () => props.trigger,
  (v) => {
    if (v) play()
  },
)

onMounted(() => {
  if (props.trigger) play()
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-40 overflow-visible" aria-hidden="true">
    <span
      v-for="p in pieces"
      :key="p.key"
      class="piece absolute"
      :style="{
        left: `${x}%`,
        top: `${y}%`,
        width: `${p.size}px`,
        height: `${p.size}px`,
        '--dx': `${p.dx}px`,
        '--dy': `${p.dy}px`,
        '--rot': `${p.rot}deg`,
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.duration}s`,
      }"
    >
      <svg viewBox="0 0 20 20" class="h-full w-full">
        <path v-if="p.shape === 'petal'" d="M10 19C5 16 3 12 3 8a7 7 0 0 1 14 0c0 4-2 8-7 11Z" :fill="p.color" />
        <path v-else-if="p.shape === 'star'" d="M10 1.5l2.4 5 5.4.7-4 3.8 1 5.4L10 13.8l-4.8 2.6 1-5.4-4-3.8 5.4-.7z" :fill="p.color" />
        <circle v-else cx="10" cy="10" r="6" :fill="p.color" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.piece {
  margin: -8px 0 0 -8px;
  opacity: 0;
  animation-name: burst;
  animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
  animation-fill-mode: forwards;
}
@keyframes burst {
  0% { opacity: 0; transform: translate(0, 0) scale(0.3) rotate(0); }
  12% { opacity: 1; }
  55% { opacity: 1; transform: translate(var(--dx), var(--dy)) scale(1) rotate(calc(var(--rot) * 0.6)); }
  100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) + 70px)) scale(0.85) rotate(var(--rot)); }
}
@media (prefers-reduced-motion: reduce) {
  .piece {
    display: none;
  }
}
</style>
