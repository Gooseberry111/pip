<script setup>
// Watering can + falling droplets, laid over Pip using the same 200 x 250 canvas.
defineProps({
  active: { type: Boolean, default: false },
})

const drops = [
  { x: 104, delay: 0.35, r: 2.6 },
  { x: 110, delay: 0.5, r: 2.2 },
  { x: 99, delay: 0.62, r: 2 },
  { x: 107, delay: 0.78, r: 2.6 },
  { x: 113, delay: 0.9, r: 2 },
  { x: 101, delay: 1.02, r: 2.3 },
  { x: 108, delay: 1.15, r: 2.1 },
]
</script>

<template>
  <svg viewBox="0 0 200 250" class="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
    <g v-if="active">
      <!-- watering can -->
      <g class="can">
        <g transform="translate(150 70)">
          <path d="M-14 -4 L-36 -22" stroke="#9BB9C6" stroke-width="5" stroke-linecap="round" />
          <ellipse cx="-38" cy="-24" rx="4.5" ry="3" fill="#9BB9C6" transform="rotate(-40 -38 -24)" />
          <rect x="-16" y="-18" width="34" height="28" rx="9" fill="#B4CFD9" />
          <path d="M14 -12 Q30 -12 28 0 Q26 8 16 6" stroke="#9BB9C6" stroke-width="4" fill="none" stroke-linecap="round" />
          <rect x="-12" y="-14" width="10" height="4" rx="2" fill="#fff" opacity="0.45" />
        </g>
      </g>

      <!-- droplets falling onto the soil -->
      <g v-for="(drop, i) in drops" :key="i" class="drop" :style="{ animationDelay: `${drop.delay}s` }">
        <path
          :d="`M${drop.x} ${88 - drop.r * 2.4} Q${drop.x + drop.r} ${88 - drop.r * 0.6} ${drop.x} ${88 + drop.r} Q${drop.x - drop.r} ${88 - drop.r * 0.6} ${drop.x} ${88 - drop.r * 2.4}Z`"
          fill="#9CC4D3"
        />
      </g>

      <!-- little splashes on the soil -->
      <g v-for="i in 3" :key="`s${i}`" class="splash" :style="{ animationDelay: `${0.7 + i * 0.22}s` }">
        <ellipse :cx="96 + i * 5" cy="170" rx="7" ry="2" fill="none" stroke="#9CC4D3" stroke-width="1.2" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.can {
  transform-box: view-box;
  transform-origin: 150px 70px;
  animation: can-pour 1.9s ease-in-out forwards;
}
.drop {
  opacity: 0;
  animation: drop-fall 0.65s cubic-bezier(0.5, 0, 0.9, 0.6) forwards;
}
.splash {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: splash 0.6s ease-out forwards;
}
@keyframes can-pour {
  0% { opacity: 0; transform: translate(18px, -10px) rotate(0deg); }
  18% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
  32%, 72% { opacity: 1; transform: translate(0, 0) rotate(-24deg); }
  88% { opacity: 1; transform: translate(4px, -4px) rotate(0deg); }
  100% { opacity: 0; transform: translate(18px, -10px) rotate(0deg); }
}
@keyframes drop-fall {
  0% { opacity: 0; transform: translateY(0); }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translateY(78px); }
}
@keyframes splash {
  0% { opacity: 0.9; transform: scale(0.3); }
  100% { opacity: 0; transform: scale(1.4); }
}
</style>
