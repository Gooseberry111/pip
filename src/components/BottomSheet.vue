<script setup>
// A sheet that slides up from the bottom: a pinned header with a title and close button,
// and scrolling content underneath. Drag it down by the top to close it, like on a phone.
// Used across the farm and the shop.
import { onBeforeUnmount, ref, watch } from 'vue'
import { onBack } from '@/utils/backStack'
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

const dy = ref(0)
const dragging = ref(false)

let offBack = null
watch(
  () => props.open,
  (open) => {
    offBack?.()
    offBack = null
    dy.value = 0
    if (open) {
      window.addEventListener('keydown', onKey)
      offBack = onBack(() => emit('close'))
    } else {
      window.removeEventListener('keydown', onKey)
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  offBack?.()
})

// ---- drag down to close ----
let start = null
function down(e) {
  if (e.target.closest('button, a, input')) return
  start = { y: e.clientY, t: performance.now() }
  dragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
}
function move(e) {
  if (!start) return
  const d = e.clientY - start.y
  // a little resistance when pulled upwards
  dy.value = d > 0 ? d : d / 6
}
function up() {
  if (!start) return
  const speed = dy.value / Math.max(1, performance.now() - start.t)
  start = null
  dragging.value = false
  if (dy.value > 110 || (dy.value > 30 && speed > 0.6)) emit('close')
  else dy.value = 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" :aria-label="title">
        <div class="scrim absolute inset-0" :style="{ opacity: Math.max(0.2, 1 - dy / 400) }" @click="emit('close')" />
        <div
          class="panel relative flex max-h-[86dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] border border-line bg-surface shadow-float"
          :class="{ 'is-dragging': dragging }"
          :style="dy ? { transform: `translateY(${dy}px)` } : null"
        >
          <header
            class="grab flex shrink-0 touch-none items-center gap-3 px-5 pb-3 pt-5"
            @pointerdown="down"
            @pointermove="move"
            @pointerup="up"
            @pointercancel="up"
          >
            <span class="handle" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
              <h2 class="title-md truncate">{{ title }}</h2>
            </div>
            <slot name="actions" />
            <button type="button" class="icon-btn h-9! w-9!" aria-label="Close" @click="emit('close')">
              <Icon name="close" :size="17" :stroke="2.2" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
.panel {
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.panel.is-dragging {
  transition: none;
}
.grab {
  position: relative;
  cursor: grab;
}
.handle {
  position: absolute;
  top: 0.5rem;
  left: 50%;
  width: 2.5rem;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--color-sand-300);
  transform: translateX(-50%);
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
