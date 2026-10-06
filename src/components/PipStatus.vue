<script setup>
// Pip's little speech bubble. Messages fade softly from one to the next.
defineProps({
  message: { type: String, default: '' },
})
</script>

<template>
  <div class="relative flex min-h-13 items-center justify-center" aria-live="polite">
    <Transition name="bubble" mode="out-in">
      <p
        v-if="message"
        :key="message"
        class="speech relative max-w-[18rem] rounded-3xl bg-surface px-5 py-2.5 text-center text-[0.95rem] font-bold text-bark-600 shadow-soft"
      >
        {{ message }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.speech::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -5px;
  width: 12px;
  height: 12px;
  background: inherit;
  border-radius: 3px;
  transform: translateX(-50%) rotate(45deg);
}
.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.bubble-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
