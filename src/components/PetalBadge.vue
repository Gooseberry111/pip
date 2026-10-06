<script setup>
// Shows the petal balance, with a happy little bump whenever it changes.
import { ref, watch } from 'vue'
import PetalIcon from './PetalIcon.vue'

const props = defineProps({
  count: { type: Number, default: 0 },
  size: { type: String, default: 'md' },
})

const bump = ref(false)
watch(
  () => props.count,
  () => {
    bump.value = false
    requestAnimationFrame(() => (bump.value = true))
    setTimeout(() => (bump.value = false), 600)
  },
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface font-extrabold text-bark-600 shadow-soft"
    :class="[size === 'sm' ? 'h-10 px-3 text-sm' : 'h-10 px-3.5 text-[0.9375rem]', { bump }]"
    :aria-label="`${count} petals`"
  >
    <PetalIcon :size="size === 'sm' ? 16 : 19" />
    <span class="tabular-nums">{{ count }}</span>
  </span>
</template>

<style scoped>
.bump {
  animation: bump 0.55s cubic-bezier(0.3, 1.6, 0.5, 1);
}
@keyframes bump {
  0%, 100% { transform: scale(1); }
  40% { transform: scale(1.14); }
}
</style>
