<script setup>
// One to three stars. With `animate`, they pop in one by one with a little chime each.
import { onMounted, ref } from 'vue'
import { playSound } from '@/utils/sound'

const props = defineProps({
  count: { type: Number, default: 0 },
  size: { type: Number, default: 16 },
  animate: { type: Boolean, default: false },
  dark: { type: Boolean, default: false },
})

const shown = ref(props.animate ? 0 : props.count)

onMounted(() => {
  if (!props.animate) return
  for (let i = 0; i < props.count; i++) {
    setTimeout(() => {
      shown.value = i + 1
      playSound('star', true, { index: i })
    }, 450 + i * 320)
  }
})
</script>

<template>
  <span class="inline-flex items-end gap-0.5" :aria-label="`${count} of 3 stars`">
    <svg
      v-for="i in 3"
      :key="i"
      :width="animate && i === 2 ? size * 1.2 : size"
      :height="animate && i === 2 ? size * 1.2 : size"
      viewBox="0 0 24 24"
      :class="{ 'is-on': i <= shown, 'is-animated': animate }"
      aria-hidden="true"
    >
      <path
        d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z"
        :fill="i <= shown ? '#EDB64C' : dark ? 'rgba(255,255,255,0.16)' : '#E7DDCF'"
        stroke-linejoin="round"
        :stroke="i <= shown ? '#D99D33' : 'none'"
        stroke-width="1"
      />
    </svg>
  </span>
</template>

<style scoped>
.is-animated.is-on path {
  transform-box: fill-box;
  transform-origin: center;
  animation: star-pop 0.5s cubic-bezier(0.3, 1.8, 0.5, 1);
}
@keyframes star-pop {
  0% { transform: scale(0.2) rotate(-40deg); }
  100% { transform: scale(1) rotate(0); }
}
</style>
