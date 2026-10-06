<script setup>
// The main way to care for Pip. Ripples where you touch it and gently glows when Pip is thirsty.
import { computed, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  name: { type: String, default: 'Pip' },
  busy: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
  inviting: { type: Boolean, default: false }, // Pip is thirsty: a soft halo invites a tap
})

const emit = defineEmits(['water'])

const ripples = ref([])
let nextId = 0

const label = computed(() => {
  if (props.busy) return 'Watering…'
  if (props.full) return `${props.name} is nice and full`
  return `Water ${props.name}`
})

function onPress(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const id = nextId++
  ripples.value.push({ id, x: e.clientX - rect.left, y: e.clientY - rect.top })
  setTimeout(() => (ripples.value = ripples.value.filter((r) => r.id !== id)), 700)
}
</script>

<template>
  <div class="relative w-full max-w-xs">
    <span v-if="inviting && !busy" class="halo absolute inset-0 rounded-full" aria-hidden="true" />
    <button
      type="button"
      class="water-btn group relative flex h-15 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full font-display text-[1.125rem] font-semibold tracking-[0.01em] text-white transition duration-200 ease-out active:scale-[0.97]"
      :class="{ 'is-busy': busy, 'is-full': full && !busy }"
      :aria-disabled="busy"
      data-sound="none"
      @pointerdown="onPress"
      @click="!busy && emit('water')"
    >
      <span class="water-btn__shine" aria-hidden="true" />
      <span
        v-for="r in ripples"
        :key="r.id"
        class="ripple"
        :style="{ left: `${r.x}px`, top: `${r.y}px` }"
        aria-hidden="true"
      />
      <span class="drop relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
        <Icon name="drop" :size="20" :stroke="2.1" />
      </span>
      <span class="relative">{{ label }}</span>
    </button>
  </div>
</template>

<style scoped>
.water-btn {
  background: linear-gradient(180deg, #82b3c6 0%, #5e93a8 100%);
  box-shadow:
    0 12px 24px -10px rgb(70 120 140 / 0.7),
    inset 0 1px 0 rgb(255 255 255 / 0.25),
    inset 0 -3px 0 rgb(40 80 100 / 0.15);
}
.water-btn.is-full {
  background: linear-gradient(180deg, #a9c6d1 0%, #8fb1bf 100%);
}
.water-btn.is-busy {
  cursor: default;
}
.water-btn.is-busy .drop {
  animation: pour 0.9s ease-in-out infinite;
}
.water-btn__shine {
  position: absolute;
  inset: 3px 14px auto 14px;
  height: 45%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
}
.ripple {
  position: absolute;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.45);
  animation: ripple 0.7s ease-out forwards;
}
.halo {
  background: rgb(127 168 185 / 0.35);
  animation: halo 2.6s ease-out infinite;
}
@keyframes ripple {
  to { transform: scale(22); opacity: 0; }
}
@keyframes halo {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.18, 1.5); opacity: 0; }
}
@keyframes pour {
  0%, 100% { transform: rotate(0) translateY(0); }
  50% { transform: rotate(-12deg) translateY(2px); }
}
@media (prefers-reduced-motion: reduce) {
  .halo {
    animation: none;
    opacity: 0;
  }
}
</style>
