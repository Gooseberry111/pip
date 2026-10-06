<script setup>
// Little things that float up and fade: hearts when Pip is petted, "+3" when petals are earned.
import { ref } from 'vue'
import PetalIcon from './PetalIcon.vue'

const items = ref([])
let nextId = 0

/** x, y are percentages of this layer. kind: 'heart' | 'petals' | 'note' */
function spawn({ x = 50, y = 40, kind = 'heart', text = '' }) {
  const id = nextId++
  const drift = (Math.random() * 2 - 1) * 18
  items.value.push({ id, x, y, kind, text, drift })
  setTimeout(() => (items.value = items.value.filter((i) => i.id !== id)), 1800)
}

defineExpose({ spawn })
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
    <span
      v-for="item in items"
      :key="item.id"
      class="floater absolute"
      :style="{ left: `${item.x}%`, top: `${item.y}%`, '--drift': `${item.drift}px` }"
    >
      <svg v-if="item.kind === 'heart'" width="22" height="22" viewBox="0 0 24 24">
        <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.7a4.2 4.2 0 0 1 7.5 2.5c0 5.7-7.5 10.3-7.5 10.3Z" fill="#F2A5AE" />
        <ellipse cx="8.4" cy="10.4" rx="1.6" ry="1.1" fill="#fff" opacity="0.5" />
      </svg>
      <span
        v-else-if="item.kind === 'petals'"
        class="flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-sm font-extrabold text-clay-400 shadow-soft"
      >
        <PetalIcon :size="15" />{{ item.text }}
      </span>
      <span v-else class="font-display text-xl text-bark-400">{{ item.text || '♪' }}</span>
    </span>
  </div>
</template>

<style scoped>
.floater {
  transform: translate(-50%, -50%);
  animation: float-up 1.8s cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
}
@keyframes float-up {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  15% { opacity: 1; transform: translate(-50%, -60%) scale(1.1); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--drift)), -260%) scale(0.9); }
}
</style>
