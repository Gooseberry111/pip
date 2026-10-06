<script setup>
// Pip's little corner: a sky that follows the real time of day, soft hills,
// floating motes of light and a wooden shelf for Pip to sit on.
import { computed, useId } from 'vue'
import { DAY_PHASES } from '@/utils/timeOfDay'

const props = defineProps({
  phase: { type: String, default: 'day' },
})

const p = computed(() => DAY_PHASES[props.phase] ?? DAY_PHASES.day)
const uid = useId()

const stars = [
  [40, 50, 1.3], [90, 110, 1], [140, 40, 1.5], [200, 86, 1], [300, 50, 1.2], [330, 130, 0.9],
  [250, 160, 1.1], [60, 180, 1], [170, 150, 0.8], [20, 120, 0.9], [120, 200, 0.8], [310, 210, 1],
]

// Deterministic "random" motes so the layout is stable between renders.
const motes = Array.from({ length: 11 }, (_, i) => ({
  left: (i * 37 + 11) % 92 + 4,
  top: (i * 53 + 17) % 70 + 8,
  size: 3 + (i % 3) * 1.5,
  delay: (i * 1.7) % 9,
  duration: 9 + (i % 4) * 3,
}))
</script>

<template>
  <div class="stage relative isolate overflow-hidden rounded-[2.25rem] shadow-soft" :class="{ 'is-dark': p.dark }">
    <svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMax slice" class="absolute inset-0 -z-10 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="p.skyTop" />
          <stop offset="1" :stop-color="p.skyBottom" />
        </linearGradient>
        <radialGradient :id="`${uid}-glow`">
          <stop offset="0" :stop-color="p.glow" stop-opacity="0.95" />
          <stop offset="1" :stop-color="p.glow" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="360" height="440" :fill="`url(#${uid}-sky)`" />
      <circle cx="268" :cy="p.orbY * 440" r="130" :fill="`url(#${uid}-glow)`" />

      <g v-if="phase === 'night'">
        <circle
          v-for="([x, y, r], i) in stars"
          :key="i"
          :cx="x"
          :cy="y"
          :r="r"
          fill="#F6EEDB"
          class="twinkle"
          :style="{ animationDelay: `${i * 0.6}s` }"
        />
        <path d="M262 64 a24 24 0 1 0 26 30 a19 19 0 1 1 -26 -30z" :fill="p.orb" />
      </g>
      <circle v-else cx="268" :cy="p.orbY * 440" r="28" :fill="p.orb" />

      <g v-if="phase !== 'night'" fill="#fff" class="clouds">
        <g class="cloud" style="animation-duration: 70s">
          <ellipse cx="70" cy="92" rx="34" ry="10" opacity="0.75" />
          <ellipse cx="88" cy="84" rx="20" ry="11" opacity="0.75" />
        </g>
        <g class="cloud" style="animation-duration: 95s; animation-delay: -30s">
          <ellipse cx="190" cy="150" rx="26" ry="8" opacity="0.6" />
          <ellipse cx="202" cy="144" rx="14" ry="8" opacity="0.6" />
        </g>
      </g>

      <path d="M0 316 Q90 276 190 304 T360 290 L360 440 L0 440Z" :fill="p.hills[0]" />
      <path d="M0 350 Q120 318 230 342 T360 336 L360 440 L0 440Z" :fill="p.hills[1]" />
    </svg>

    <!-- floating motes of light (fireflies at night) -->
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <span
        v-for="(m, i) in motes"
        :key="i"
        class="mote absolute rounded-full"
        :style="{
          left: `${m.left}%`,
          top: `${m.top}%`,
          width: `${m.size}px`,
          height: `${m.size}px`,
          background: p.motes,
          boxShadow: p.dark ? `0 0 ${m.size * 3}px ${m.size}px rgba(248, 227, 162, 0.45)` : 'none',
          animationDelay: `${-m.delay}s`,
          animationDuration: `${m.duration}s`,
        }"
      />
    </div>

    <!-- the shelf -->
    <div class="absolute inset-x-0 bottom-0 -z-10 h-[17%]" aria-hidden="true">
      <div class="h-[22%] w-full" :style="{ background: `linear-gradient(180deg, ${p.floorTop}, ${p.floor})` }" />
      <div class="shelf-front relative h-[78%] w-full" :style="{ background: `linear-gradient(180deg, ${p.floor}, ${p.floorEdge})` }" />
    </div>

    <slot />
  </div>
</template>

<style scoped>
.stage {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.45),
    0 1px 2px rgb(91 70 54 / 0.04),
    0 10px 30px rgb(91 70 54 / 0.09);
}
.shelf-front::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0 9px,
    rgb(120 90 60 / 0.06) 9px 10px
  );
}
.twinkle {
  animation: twinkle 5s ease-in-out infinite;
}
.cloud {
  animation: drift linear infinite;
}
.mote {
  opacity: 0;
  animation: mote ease-in-out infinite;
}
.is-dark .mote {
  animation-name: firefly;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.3; }
}
@keyframes drift {
  0% { transform: translateX(-140px); }
  100% { transform: translateX(400px); }
}
@keyframes mote {
  0% { opacity: 0; transform: translate(0, 20px); }
  30% { opacity: 0.7; }
  70% { opacity: 0.5; }
  100% { opacity: 0; transform: translate(14px, -50px); }
}
@keyframes firefly {
  0% { opacity: 0; transform: translate(0, 0); }
  25% { opacity: 1; transform: translate(10px, -12px); }
  50% { opacity: 0.3; transform: translate(-6px, -20px); }
  75% { opacity: 1; transform: translate(8px, -30px); }
  100% { opacity: 0; transform: translate(0, -40px); }
}
@media (prefers-reduced-motion: reduce) {
  .twinkle,
  .cloud,
  .mote {
    animation: none;
  }
  .mote {
    opacity: 0.5;
  }
}
</style>
