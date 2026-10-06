<script setup>
// One leaf, drawn pointing along +x from its stem end at (0, 0).
// The upper half catches the light and the lower half sits in soft shade, like a folded leaf.
import { computed } from 'vue'
import { leafShape, leafStripePath, LEAF_COLORS, tiredTint } from '@/utils/shapes'

const props = defineProps({
  variant: { type: String, default: 'classic' },
  length: { type: Number, default: 26 },
  droop: { type: Number, default: 0 },
  dew: { type: Boolean, default: false },
})

const colors = computed(() => LEAF_COLORS[props.variant] ?? LEAF_COLORS.classic)
const top = computed(() => tiredTint(colors.value.top, props.droop))
const bottom = computed(() => tiredTint(colors.value.bottom, props.droop))
const shape = computed(() => leafShape(props.variant, props.length))
</script>

<template>
  <g>
    <path :d="shape.lower" :fill="bottom" />
    <path :d="shape.upper" :fill="top" />
    <path v-if="variant === 'variegated'" :d="leafStripePath(length)" :fill="colors.stripe" opacity="0.75" />
    <path
      v-for="(v, i) in shape.veins"
      :key="i"
      :d="v"
      :stroke="colors.vein"
      stroke-width="0.7"
      stroke-linecap="round"
      fill="none"
      opacity="0.55"
    />
    <path :d="shape.rib" :stroke="colors.vein" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="0.85" />
    <g v-if="variant === 'starlight'" fill="#FFF6D6" class="twinkle">
      <path :transform="`translate(${length * 0.45} ${-length * 0.15}) scale(${length / 30})`" d="M0 -2.4 Q0.4 -0.4 2.4 0 Q0.4 0.4 0 2.4 Q-0.4 0.4 -2.4 0 Q-0.4 -0.4 0 -2.4Z" />
      <circle :cx="length * 0.72" :cy="length * 0.08" :r="length * 0.03" />
    </g>
    <g v-if="dew" class="dew">
      <circle :cx="length * 0.62" :cy="-length * 0.12" :r="Math.max(1.1, length * 0.05)" fill="#E8F4F7" opacity="0.9" />
      <circle :cx="length * 0.62 - 0.5" :cy="-length * 0.12 - 0.5" r="0.5" fill="#fff" />
    </g>
  </g>
</template>

<style scoped>
.twinkle {
  animation: twinkle 3.2s ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.dew {
  animation: dew-fade 7s ease-in forwards;
}
@keyframes dew-fade {
  0%, 70% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
