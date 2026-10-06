<script setup>
// Today's little gift from Pip. Sits on the shelf, bobbing gently, until it's opened.
import { ref } from 'vue'

const emit = defineEmits(['open'])
const opening = ref(false)

function open() {
  if (opening.value) return
  opening.value = true
  setTimeout(() => emit('open'), 650)
}
</script>

<template>
  <button
    type="button"
    class="gift relative block h-full w-full"
    :class="{ 'is-opening': opening }"
    aria-label="Open today’s gift"
    @click="open"
  >
    <svg viewBox="0 0 60 64" class="h-full w-full overflow-visible">
      <ellipse cx="30" cy="61" rx="20" ry="3" fill="#4A3426" opacity="0.12" />
      <g class="box">
        <rect x="10" y="30" width="40" height="30" rx="5" fill="#F3D9CF" />
        <rect x="38" y="30" width="12" height="30" rx="5" fill="#E7C2B4" opacity="0.6" />
        <rect x="26.5" y="30" width="7" height="30" fill="#E8A3A6" />
      </g>
      <g class="lid">
        <rect x="7" y="23" width="46" height="10" rx="4" fill="#F7E3DB" />
        <rect x="26" y="23" width="8" height="10" fill="#EBAFB1" />
        <path d="M30 23 C24 12 14 14 18 20 C20 23 30 23 30 23Z" fill="#EBAFB1" />
        <path d="M30 23 C36 12 46 14 42 20 C40 23 30 23 30 23Z" fill="#E8A3A6" />
        <circle cx="30" cy="22" r="3" fill="#E39A9E" />
      </g>
      <g class="shine" fill="#F5D89A">
        <path d="M50 12 l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z" />
        <path d="M8 16 l0.9 2 2 0.9 -2 0.9 -0.9 2 -0.9 -2 -2 -0.9 2 -0.9z" />
      </g>
    </svg>
  </button>
</template>

<style scoped>
.gift {
  -webkit-tap-highlight-color: transparent;
  animation: bob 3.2s ease-in-out infinite;
  transform-origin: 50% 100%;
}
.lid {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: lid-peek 3.2s ease-in-out infinite;
}
.shine {
  animation: shine 2.4s ease-in-out infinite;
}
.is-opening {
  animation: open-shake 0.6s ease-in-out;
}
.is-opening .lid {
  animation: lid-pop 0.65s cubic-bezier(0.3, 0.6, 0.4, 1) forwards;
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes lid-peek {
  0%, 70%, 100% { transform: rotate(0) translateY(0); }
  78% { transform: rotate(-6deg) translateY(-3px); }
  86% { transform: rotate(4deg) translateY(-1px); }
}
@keyframes shine {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}
@keyframes open-shake {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-7deg); }
  40% { transform: rotate(7deg); }
  60% { transform: rotate(-4deg); }
}
@keyframes lid-pop {
  0% { transform: translate(0, 0) rotate(0); opacity: 1; }
  100% { transform: translate(14px, -30px) rotate(30deg); opacity: 0; }
}
</style>
