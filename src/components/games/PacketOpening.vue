<script setup>
// Opening a seed packet: tap it a few times to shake it loose, then it bursts open.
import { computed, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Rays from '../Rays.vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['opened'])
const pip = usePipStore()

const TAPS = 3
const taps = ref(0)
const shaking = ref(false)
const bursting = ref(false)

const hint = computed(() => ['Tap to open', 'Again!', 'One more!'][taps.value] ?? '')

function tap() {
  if (bursting.value) return
  taps.value += 1
  shaking.value = false
  requestAnimationFrame(() => (shaking.value = true))
  playSound('tear', pip.soundOn)
  haptic(taps.value >= TAPS ? 'success' : 'soft')
  if (taps.value >= TAPS) {
    bursting.value = true
    playSound('unlock', pip.soundOn)
    setTimeout(() => {
      emit('opened')
      taps.value = 0
      bursting.value = false
    }, 900)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Seed packet">
        <div class="scrim absolute inset-0" />
        <div class="relative flex aspect-square w-full max-w-[20rem] items-center justify-center">
          <Rays :color="bursting ? '#F9E2B0' : '#F3E6D2'" />
          <button
            type="button"
            class="packet relative w-[58%]"
            :class="[`taps-${taps}`, { 'is-shaking': shaking, 'is-bursting': bursting }]"
            aria-label="Tap the seed packet"
            data-sound="none"
            @click="tap"
          >
            <svg viewBox="0 0 120 150" class="w-full overflow-visible drop-shadow-[0_14px_20px_rgba(91,70,54,0.18)]">
              <!-- top flap that tears away -->
              <g class="flap">
                <path d="M10 8 Q10 2 16 2 L104 2 Q110 2 110 8 L110 28 L10 28Z" fill="#EBAFB1" />
                <path d="M10 28 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4 l3.125 -4 3.125 4" fill="none" stroke="#F8E9DF" stroke-width="1.4" />
              </g>
              <!-- packet body -->
              <path d="M10 28 L110 28 L110 140 Q110 146 104 146 L16 146 Q10 146 10 140Z" fill="#FBF3E6" />
              <path d="M84 28 L110 28 L110 140 Q110 146 104 146 L92 146 Q88 90 84 28Z" fill="#F0E2CC" opacity="0.6" />
              <rect x="20" y="40" width="80" height="62" rx="10" fill="#F3E6D3" />
              <!-- a little sprout illustration -->
              <path d="M60 94 Q60 80 60 70" stroke="#79A066" stroke-width="3" stroke-linecap="round" fill="none" />
              <path d="M60 74 C54 62 42 62 40 68 C46 76 56 77 60 74Z" fill="#8DB07A" />
              <path d="M60 71 C66 58 78 58 80 64 C74 72 64 73 60 71Z" fill="#A6C78F" />
              <ellipse cx="60" cy="96" rx="20" ry="4" fill="#C9A47F" opacity="0.6" />
              <!-- question sticker -->
              <circle cx="92" cy="44" r="11" fill="#F2C66B" />
              <text x="92" y="49" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="Fredoka Variable, sans-serif">?</text>
              <text x="60" y="122" text-anchor="middle" font-size="11" font-weight="700" fill="#8A6E57" font-family="Fredoka Variable, sans-serif" letter-spacing="1">MYSTERY SEEDS</text>
              <!-- tear lines appear as you tap -->
              <path v-if="taps >= 1" d="M30 28 l3 7 -4 4" stroke="#C9A47F" stroke-width="1.4" fill="none" stroke-linecap="round" />
              <path v-if="taps >= 2" d="M88 28 l-2 8 5 5" stroke="#C9A47F" stroke-width="1.4" fill="none" stroke-linecap="round" />
            </svg>
          </button>
          <span v-if="bursting" class="burst absolute inset-0 rounded-full" aria-hidden="true" />
        </div>
        <p class="relative mt-6 font-display text-2xl font-semibold text-bark-600">{{ bursting ? 'Ooh!' : hint }}</p>
        <div class="relative mt-3 flex gap-1.5">
          <span v-for="i in TAPS" :key="i" class="h-2 w-6 rounded-full transition-colors" :class="i <= taps ? 'bg-clay-300' : 'bg-sand-300'" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim {
  background: rgb(251 246 238 / 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.packet {
  -webkit-tap-highlight-color: transparent;
  animation: float 3s ease-in-out infinite;
}
.packet.is-shaking {
  animation: shake 0.45s ease-in-out;
}
.packet.taps-2.is-shaking {
  animation: shake-big 0.5s ease-in-out;
}
.flap {
  transform-box: fill-box;
  transform-origin: 0% 100%;
  transition: transform 0.3s ease;
}
.taps-1 .flap {
  transform: rotate(-3deg);
}
.taps-2 .flap {
  transform: rotate(-8deg) translateY(-2px);
}
.is-bursting .flap {
  transition: transform 0.6s cubic-bezier(0.3, 0.6, 0.4, 1), opacity 0.6s;
  transform: translate(-30px, -80px) rotate(-50deg);
  opacity: 0;
}
.is-bursting {
  animation: burst-scale 0.9s ease-in forwards !important;
}
.burst {
  background: radial-gradient(circle, rgb(255 248 228 / 1) 0%, rgb(255 248 228 / 0) 65%);
  animation: flash 0.9s ease-out forwards;
}
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}
@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-6deg) scale(1.03); }
  50% { transform: rotate(5deg); }
  75% { transform: rotate(-3deg); }
}
@keyframes shake-big {
  0%, 100% { transform: rotate(0) scale(1); }
  20% { transform: rotate(-10deg) scale(1.06); }
  40% { transform: rotate(9deg) scale(1.06); }
  60% { transform: rotate(-6deg) scale(1.04); }
  80% { transform: rotate(4deg); }
}
@keyframes burst-scale {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(0.6); opacity: 0; }
}
@keyframes flash {
  0% { transform: scale(0.3); opacity: 0; }
  40% { opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
