<script setup>
// A soft, centred card over a blurred backdrop. Used for special moments.
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  label: { type: String, default: 'Dialog' },
  dismissible: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape' && props.dismissible) emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
  { immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-5"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
      >
        <div class="scrim absolute inset-0" @click="dismissible && emit('close')" />
        <div class="card relative w-full max-w-sm rounded-[1.75rem] border border-line bg-surface p-6 text-center shadow-float">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim {
  background: rgb(251 246 238 / 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.4s ease;
}
.modal-enter-active .card {
  transition: transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.4s ease;
}
.modal-leave-active .card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .card {
  transform: translateY(20px) scale(0.94);
  opacity: 0;
}
.modal-leave-to .card {
  transform: translateY(10px) scale(0.98);
  opacity: 0;
}
</style>
