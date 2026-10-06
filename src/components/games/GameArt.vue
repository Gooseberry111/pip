<script setup>
// Cover art for each game tile in the Play tab.
defineProps({
  game: { type: String, required: true },
})
</script>

<template>
  <svg viewBox="0 0 160 110" class="h-full w-full" aria-hidden="true">
    <!-- Raindrop Catch -->
    <g v-if="game === 'rain'">
      <rect width="160" height="110" fill="#D7E6EC" />
      <g fill="#fff" opacity="0.9">
        <ellipse cx="40" cy="20" rx="26" ry="8" /><circle cx="30" cy="15" r="9" /><circle cx="46" cy="12" r="11" />
        <ellipse cx="124" cy="16" rx="22" ry="7" /><circle cx="118" cy="11" r="9" />
      </g>
      <path d="M44 34 q5 8 5 11 a5 5 0 0 1 -10 0 q0 -3 5 -11z" fill="#8FBFD1" class="fall" />
      <path d="M104 30 q6 10 6 13 a6 6 0 0 1 -12 0 q0 -3 6 -13z" fill="#F2C66B" class="fall" style="animation-delay: -0.8s" />
      <g class="fall" style="animation-delay: -1.4s">
        <path d="M128 46 q6 10 6 13 a6 6 0 0 1 -12 0 q0 -3 6 -13z" fill="#8C7461" />
        <circle cx="126" cy="58" r="0.9" fill="#2E2219" /><circle cx="130" cy="58" r="0.9" fill="#2E2219" />
      </g>
      <path d="M58 82 L102 82 L97 104 Q96 108 91 108 L69 108 Q64 108 63 104Z" fill="#D39A7B" />
      <rect x="54" y="76" width="52" height="10" rx="5" fill="#E4B192" />
      <circle cx="73" cy="94" r="2.2" fill="#47352A" /><circle cx="87" cy="94" r="2.2" fill="#47352A" />
      <path d="M76.5 99 Q80 101.5 83.5 99" stroke="#47352A" stroke-width="1.4" fill="none" stroke-linecap="round" />
    </g>

    <!-- Seed Memory -->
    <g v-else-if="game === 'memory'">
      <rect width="160" height="110" fill="#E1ECD8" />
      <g transform="translate(46 56) rotate(-12)">
        <rect x="-20" y="-27" width="40" height="54" rx="8" fill="#86AD72" />
        <path d="M0 12 V0 M0 2 C-4 -6 -11 -6 -12 -2 C-9 3 -3 4 0 2Z M0 0 C4 -8 11 -8 12 -4 C9 1 3 2 0 0Z" fill="#fff" stroke="#fff" stroke-width="1.5" />
      </g>
      <g transform="translate(80 52)">
        <rect x="-20" y="-27" width="40" height="54" rx="8" fill="#fff" />
        <g><circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :transform="`rotate(${a}) translate(0 -7)`" r="5.4" fill="#F3BCC2" /><circle r="4" fill="#F8E2A6" /></g>
      </g>
      <g transform="translate(114 58) rotate(12)">
        <rect x="-20" y="-27" width="40" height="54" rx="8" fill="#fff" />
        <g><circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :transform="`rotate(${a}) translate(0 -7)`" r="5.4" fill="#F3BCC2" /><circle r="4" fill="#F8E2A6" /></g>
      </g>
      <path d="M120 22 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8z" fill="#E9B54F" class="twinkle" />
    </g>

    <!-- Firefly Night -->
    <g v-else-if="game === 'firefly'">
      <rect width="160" height="110" fill="#2E3754" />
      <circle v-for="i in 9" :key="i" :cx="(i * 41) % 160" :cy="(i * 17) % 50" r="0.9" fill="#F6EEDB" opacity="0.8" />
      <path d="M128 14 a12 12 0 1 0 10 18 a9 9 0 1 1 -10 -18z" fill="#F3EBD6" />
      <path d="M0 86 Q40 66 80 82 T160 76 L160 110 L0 110Z" fill="#232b43" />
      <g v-for="([x, y], i) in [[40, 50], [74, 34], [108, 58], [58, 74]]" :key="i" class="glow" :style="{ animationDelay: `${i * 0.5}s` }">
        <circle :cx="x" :cy="y" r="11" fill="#F7D776" opacity="0.25" />
        <circle :cx="x" :cy="y" r="3.4" fill="#FDF0B8" />
      </g>
    </g>

    <!-- Flower Song -->
    <g v-else-if="game === 'song'">
      <rect width="160" height="110" fill="#F0E4EE" />
      <g v-for="([x, y, c], i) in [[48, 40, '#F3BCC2'], [112, 40, '#F6D274'], [48, 82, '#F4EBD6'], [112, 82, '#F49A82']]" :key="i">
        <rect :x="x - 22" :y="y - 18" width="44" height="36" rx="11" fill="#fff" />
        <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :transform="`translate(${x} ${y}) rotate(${a}) translate(0 -6)`" r="4.6" :fill="c" />
        <circle :cx="x" :cy="y" r="3.4" fill="#F8E2A6" />
      </g>
      <text x="80" y="66" text-anchor="middle" font-size="22" fill="#9B7FA6" class="bob" font-family="Fredoka Variable, sans-serif">♪</text>
    </g>

    <!-- Breathe -->
    <g v-else-if="game === 'breathe'">
      <rect width="160" height="110" fill="#E8E2EE" />
      <circle cx="80" cy="56" r="42" fill="#fff" opacity="0.45" class="breath" />
      <circle cx="80" cy="56" r="28" fill="#F6F1E8" />
      <path d="M80 74 V54" stroke="#79A066" stroke-width="3" stroke-linecap="round" />
      <path d="M80 58 C74 46 63 47 62 52 C67 60 75 61 80 58Z" fill="#8DB07A" />
      <path d="M80 55 C86 43 97 44 98 49 C93 57 85 58 80 55Z" fill="#A6C78F" />
    </g>

    <!-- coming soon -->
    <g v-else-if="game === 'glide'">
      <rect width="160" height="110" fill="#E3EDF1" />
      <path d="M0 30 Q40 20 80 32 T160 26" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8" />
      <path d="M10 70 Q50 58 90 72 T160 64" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8" />
      <path d="M120 0 L120 40 Q120 46 114 48 L100 54" stroke="#A9826A" stroke-width="5" fill="none" stroke-linecap="round" />
      <g transform="translate(70 52) rotate(-15)">
        <ellipse rx="7" ry="5" fill="#B98D66" />
        <path d="M0 -4 Q-14 -24 -2 -30 M0 -4 Q14 -24 2 -30 M0 -4 L0 -30" stroke="#fff" stroke-width="1.4" fill="none" />
      </g>
    </g>
    <g v-else-if="game === 'puzzle'">
      <rect width="160" height="110" fill="#F6E5E1" />
      <g transform="translate(46 17)">
        <rect v-for="i in 9" :key="i" :x="((i - 1) % 3) * 23" :y="Math.floor((i - 1) / 3) * 25" width="21" height="23" rx="4" :fill="i === 9 ? 'none' : i % 2 ? '#E9A88F' : '#F3C4B2'" :stroke="i === 9 ? '#E9A88F' : 'none'" stroke-dasharray="3 3" />
      </g>
    </g>
    <g v-else-if="game === 'snail'">
      <rect width="160" height="110" fill="#F1EBDD" />
      <path d="M0 86 L160 86" stroke="#E0D3BC" stroke-width="2" stroke-dasharray="6 6" />
      <rect x="132" y="56" width="3" height="30" fill="#A9826A" />
      <path d="M135 56 L152 61 L135 66Z" fill="#E48C9C" />
      <g transform="translate(64 86) scale(1.8)">
        <path d="M-14 0 Q-14 -4 -8 -4 L8 -4 Q11 -4 12 -9 Q13 -13 16 -12 Q18 -11 16 -6 Q15 -1 10 0Z" fill="#E9D8BE" />
        <circle cx="0" cy="-12" r="9" fill="#C99A72" />
        <path d="M0 -18 a6 6 0 1 1 -5.6 8" stroke="#A97A56" stroke-width="1.3" fill="none" />
      </g>
    </g>
    <g v-else-if="game === 'bughotel'">
      <rect width="160" height="110" fill="#F3E9DA" />
      <path d="M50 30 L80 12 L110 30 Z" fill="#C79A72" />
      <rect x="52" y="30" width="56" height="64" rx="4" fill="#E3C9A6" />
      <g fill="#A9826A">
        <rect x="58" y="36" width="20" height="16" rx="3" /><rect x="82" y="36" width="20" height="16" rx="3" />
        <rect x="58" y="56" width="20" height="16" rx="3" /><rect x="82" y="56" width="20" height="16" rx="3" />
        <rect x="58" y="76" width="44" height="12" rx="3" />
      </g>
      <g fill="#EDB3B5"><circle cx="68" cy="44" r="3" /><circle cx="92" cy="64" r="3" /></g>
      <circle cx="122" cy="40" r="4" fill="#E07A62" /><circle cx="122" cy="40" r="1.2" fill="#3A2D23" />
    </g>
    <g v-else-if="game === 'petalpop'">
      <rect width="160" height="110" fill="#F9E6EA" />
      <g v-for="([x, y, c], i) in [[40, 34, '#F3BCC2'], [80, 26, '#F6D274'], [120, 38, '#C3B4DA'], [56, 70, '#F6D274'], [100, 72, '#F3BCC2'], [130, 82, '#A9C79A']]" :key="i">
        <circle :cx="x" :cy="y" r="15" :fill="c" opacity="0.35" />
        <path :d="`M${x} ${y + 9} C${x - 7} ${y + 4} ${x - 8} ${y - 4} ${x} ${y - 9} C${x + 8} ${y - 4} ${x + 7} ${y + 4} ${x} ${y + 9}Z`" :fill="c" />
      </g>
    </g>
    <g v-else-if="game === 'rhythm'">
      <rect width="160" height="110" fill="#E7E4F0" />
      <g v-for="i in 4" :key="i">
        <rect :x="22 + (i - 1) * 32" y="20" width="22" height="80" rx="11" fill="#fff" opacity="0.7" />
        <path :d="`M${33 + (i - 1) * 32} ${30 + ((i * 23) % 40)} q5 8 5 11 a5 5 0 0 1 -10 0 q0 -3 5 -11z`" fill="#8C7FB5" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.fall {
  animation: fall 2.4s ease-in infinite;
}
.twinkle,
.glow {
  animation: twinkle 2.4s ease-in-out infinite;
}
.bob {
  animation: bob 2s ease-in-out infinite;
}
.breath {
  transform-box: fill-box;
  transform-origin: center;
  animation: breath 5s ease-in-out infinite;
}
@keyframes fall {
  0% { transform: translateY(-8px); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(26px); opacity: 0; }
}
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes breath {
  0%, 100% { transform: scale(0.82); }
  50% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .fall,
  .twinkle,
  .glow,
  .bob,
  .breath {
    animation: none;
  }
}
</style>
