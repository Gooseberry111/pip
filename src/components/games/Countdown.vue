<script setup>
// 3, 2, 1, go! Emits `done` when it's time to play.
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { playSound } from '@/utils/sound'

const props = defineProps({
  dark: { type: Boolean, default: false },
  label: { type: String, default: '' },
  goal: { type: String, default: '' },
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
  // a beat longer on the first number when there's a goal to read
  timer = setTimeout(step, props.goal ? 1100 : 650)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
    <div v-if="label || goal" class="intro-line mb-2 text-center">
      <p v-if="label" class="eyebrow" :class="{ 'text-white/60!': dark }">{{ label }}</p>
      <p v-if="goal" class="mt-1 px-6 font-display text-xl font-semibold" :class="dark ? 'text-[#F6EFE2]' : 'text-bark-600'">{{ goal }}</p>
    </div>
    <span :key="n" class="count font-display text-8xl font-semibold" :class="dark ? 'text-[#F6EFE2]' : 'text-bark-600'">
      {{ n || 'Go!' }}
    </span>
  </div>
</template>

<style scoped>
.intro-line {
  animation: intro-in 0.4s ease-out both;
}
@keyframes intro-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.count {
  animation: count 0.65s ease-out both;
}
@keyframes count {
  0% { opacity: 0; transform: scale(1.7); }
  30% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.85); }
}
</style>
