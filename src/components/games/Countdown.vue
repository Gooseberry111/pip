<script setup>
// 3, 2, 1, go! Emits `done` when it's time to play.
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { playSound } from '@/utils/sound'

defineProps({
  dark: { type: Boolean, default: false },
  label: { type: String, default: '' },
})

const emit = defineEmits(['done'])
const n = ref(3)
let timer = null

onMounted(() => {
  playSound('tick')
  const step = () => {
    if (n.value > 1) {
      n.value -= 1
      playSound('tick')
      timer = setTimeout(step, 650)
    } else {
      n.value = 0
      playSound('go')
      timer = setTimeout(() => emit('done'), 380)
    }
  }
  timer = setTimeout(step, 650)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
    <p v-if="label" class="eyebrow mb-1" :class="{ 'text-white/60!': dark }">{{ label }}</p>
    <span :key="n" class="count font-display text-8xl font-semibold" :class="dark ? 'text-[#F6EFE2]' : 'text-bark-600'">
      {{ n || 'Go!' }}
    </span>
  </div>
</template>

<style scoped>
.count {
  animation: count 0.65s ease-out both;
}
@keyframes count {
  0% { opacity: 0; transform: scale(1.7); }
  30% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.85); }
}
</style>
