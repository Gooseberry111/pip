<script setup>
// The view behind the farm: sky, sun or moon, clouds, and rolling hills with a little
// farmhouse far away. It follows the time of day, the season and the real weather.
import { computed } from 'vue'
import { DAY_PHASES } from '@/utils/timeOfDay'

const props = defineProps({
  phase: { type: String, default: 'day' },
  season: { type: String, default: 'summer' },
  weather: { type: String, default: null },
})

const p = computed(() => DAY_PHASES[props.phase] ?? DAY_PHASES.day)
const grey = computed(() => ['cloudy', 'rain', 'storm', 'fog', 'snow'].includes(props.weather))
const sky = computed(() => {
  if (props.phase === 'night') return [p.value.skyTop, p.value.skyBottom]
  if (props.weather === 'storm') return ['#8D97A8', '#C3C8CF']
  if (grey.value) return ['#B9C6CE', '#E6E6E0']
  return [p.value.skyTop, p.value.skyBottom]
})
const HILLS = {
  spring: [['#B9D99A', '#A3CB83'], ['#C9E2AD', '#B3D492']],
  summer: [['#A9CC88', '#94BD74'], ['#BFD9A0', '#A9CC88']],
  autumn: [['#D3B878', '#C49E5E'], ['#DCC791', '#CDB177']],
  winter: [['#E4ECEE', '#D3DFE2'], ['#F1F5F6', '#E2EAEC']],
}
const hills = computed(() => {
  const h = HILLS[props.season] ?? HILLS.summer
  return props.phase === 'night' ? [['#56617D', '#4C5672'], ['#647090', '#56617D']] : h
})
const TREE = { spring: ['#F6C7CD', '#9CC584'], summer: ['#7FAA5C', '#6E9E5C'], autumn: ['#E39A4A', '#D2773A'], winter: ['#C9D6DA', '#B5C5CA'] }
const trees = computed(() => (props.phase === 'night' ? ['#45506B', '#3E4862'] : TREE[props.season] ?? TREE.summer))
const showSun = computed(() => props.phase !== 'night' && !grey.value)
const orbY = computed(() => 20 + p.value.orbY * 60)
</script>

<template>
  <div class="sky" aria-hidden="true">
    <svg viewBox="0 0 360 130" preserveAspectRatio="xMidYMax slice" class="block h-full w-full">
      <defs>
        <linearGradient id="farm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="sky[0]" />
          <stop offset="1" :stop-color="sky[1]" />
        </linearGradient>
        <radialGradient id="farm-glow">
          <stop offset="0" :stop-color="p.glow" stop-opacity="0.9" />
          <stop offset="1" :stop-color="p.glow" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="130" fill="url(#farm-sky)" />

      <!-- stars -->
      <g v-if="phase === 'night'" fill="#FFF6D9">
        <circle v-for="(s, i) in [[30, 18], [70, 40], [110, 14], [150, 34], [200, 12], [240, 42], [290, 20], [330, 38], [180, 52], [55, 62]]" :key="i" :cx="s[0]" :cy="s[1]" :r="i % 3 ? 0.9 : 1.4" class="star" :style="{ animationDelay: `${i * 0.4}s` }" />
      </g>

      <!-- sun or moon -->
      <g v-if="showSun || phase === 'night'">
        <circle cx="292" :cy="orbY" r="34" fill="url(#farm-glow)" />
        <circle cx="292" :cy="orbY" r="13" :fill="p.orb" />
        <circle v-if="phase === 'night'" cx="297" :cy="orbY - 4" r="11" :fill="sky[0]" />
      </g>

      <!-- clouds -->
      <g class="clouds" :fill="phase === 'night' ? '#7D88A4' : props.weather === 'storm' ? '#9AA3B0' : '#FFFFFF'" :opacity="grey ? 0.95 : 0.85">
        <g class="cloud c1"><ellipse cx="60" cy="30" rx="22" ry="8" /><ellipse cx="72" cy="25" rx="13" ry="9" /><ellipse cx="50" cy="27" rx="10" ry="7" /></g>
        <g class="cloud c2"><ellipse cx="200" cy="22" rx="18" ry="6" /><ellipse cx="210" cy="18" rx="10" ry="7" /></g>
        <g v-if="grey" class="cloud c3"><ellipse cx="130" cy="40" rx="30" ry="9" /><ellipse cx="146" cy="33" rx="16" ry="11" /><ellipse cx="116" cy="36" rx="12" ry="8" /></g>
        <g v-if="grey" class="cloud c1"><ellipse cx="300" cy="34" rx="26" ry="9" /><ellipse cx="312" cy="27" rx="14" ry="10" /></g>
      </g>

      <!-- far hills, a farmhouse and a few trees -->
      <path d="M0 92 Q60 62 130 84 T260 74 T360 82 V130 H0Z" :fill="hills[1][0]" />
      <g transform="translate(232 62)">
        <path d="M0 14 L12 4 L24 14 V26 H0Z" :fill="phase === 'night' ? '#6E5E5A' : '#E9D7B8'" />
        <path d="M-2 15 L12 2 L26 15" :stroke="phase === 'night' ? '#5A4A48' : '#C9584A'" stroke-width="3" fill="none" stroke-linejoin="round" />
        <rect x="9" y="17" width="6" height="9" :fill="phase === 'night' ? '#FFE9A8' : '#A77A57'" />
        <rect x="17" y="-1" width="3" height="7" :fill="phase === 'night' ? '#5A4A48' : '#B9927A'" />
      </g>
      <g v-for="(t, i) in [[40, 78, 1], [62, 74, 0.8], [168, 80, 0.9], [318, 74, 1.1], [340, 78, 0.8]]" :key="i" :transform="`translate(${t[0]} ${t[1]}) scale(${t[2]})`">
        <rect x="-1.5" y="0" width="3" height="10" :fill="phase === 'night' ? '#3E4862' : '#9C7351'" />
        <circle cy="-4" r="8" :fill="trees[i % 2]" />
      </g>
      <path d="M0 108 Q80 86 170 102 T360 96 V130 H0Z" :fill="hills[0][0]" />
      <path d="M0 118 Q90 104 190 114 T360 110 V130 H0Z" :fill="hills[0][1]" />

      <!-- birds on a fine day -->
      <g v-if="showSun" class="birds" stroke="#5B4636" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.55">
        <path d="M0 0 q3 -3 6 0 q3 -3 6 0" />
        <path d="M16 6 q2.5 -2.5 5 0 q2.5 -2.5 5 0" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.sky {
  position: relative;
  height: 128px;
  border-radius: 1.75rem 1.75rem 0 0;
  overflow: hidden;
}
.cloud {
  animation: drift 60s linear infinite;
}
.c2 {
  animation-duration: 80s;
  animation-delay: -30s;
}
.c3 {
  animation-duration: 95s;
  animation-delay: -50s;
}
@keyframes drift {
  from { transform: translateX(-120px); }
  to { transform: translateX(400px); }
}
.star {
  animation: twinkle 3s ease-in-out infinite;
}
@keyframes twinkle {
  50% { opacity: 0.3; }
}
.birds {
  animation: birds 40s linear infinite;
}
@keyframes birds {
  from { transform: translate(-40px, 40px); }
  to { transform: translate(400px, 20px); }
}
</style>
