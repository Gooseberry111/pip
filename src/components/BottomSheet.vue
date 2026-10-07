<script setup>
// A sheet that slides up from the bottom: a pinned header with a title and close button,
// and scrolling content underneath. Used across the farm and the shop.
import { onBeforeUnmount, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
})

const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
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
    <Transition name="sheet">
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" :aria-label="title">
        <div class="scrim absolute inset-0" @click="emit('close')" />
        <div class="panel relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] border border-line bg-surface shadow-float">
          <header class="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4">
            <div class="min-w-0 flex-1">
              <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
              <h2 class="title-md truncate">{{ title }}</h2>
            </div>
            <slot name="actions" />
            <button type="button" class="icon-btn h-9! w-9!" aria-label="Close" @click="emit('close')">
              <Icon name="close" :size="17" :stroke="2.2" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim {
  background: rgb(58 45 35 / 0.22);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-enter-active .panel {
  transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.sheet-leave-active .panel {
  transition: transform 0.25s ease-in;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .panel,
.sheet-leave-to .panel {
  transform: translateY(100%);
}
</style>
