<script setup>
// Small decorations, drawn with their bottom centre at (0, 0).
// `poke` replays a little reaction (set it to a new number each time).
import { ref, watch, useId } from 'vue'

const props = defineProps({
  decoration: { type: String, required: true },
  animated: { type: Boolean, default: true },
  poke: { type: Number, default: 0 },
})

const uid = useId()
const glowId = `${uid}-glow`
const capId = `${uid}-cap`

const poked = ref(false)
let timer = null
watch(
  () => props.poke,
  () => {
    poked.value = false
    clearTimeout(timer)
    requestAnimationFrame(() => {
      poked.value = true
      timer = setTimeout(() => (poked.value = false), 1400)
    })
  },
)
</script>

<template>
  <g :class="[`deco deco--${decoration}`, { 'is-animated': animated, 'is-poked': poked }]">
    <g v-if="decoration === 'pebbles'" class="deco-body">
      <ellipse cx="0" cy="0" rx="20" ry="2.5" fill="#4A3426" opacity="0.1" />
      <ellipse cx="-11" cy="-5" rx="10" ry="6" fill="#CFC4B5" />
      <ellipse cx="7" cy="-4.5" rx="8.5" ry="5" fill="#B4A999" />
      <ellipse cx="-1" cy="-11" rx="6.5" ry="4.5" fill="#E0D7CA" />
      <ellipse cx="-13" cy="-7.5" rx="4" ry="1.5" fill="#fff" opacity="0.4" />
      <ellipse cx="-2.5" cy="-13" rx="2.5" ry="1" fill="#fff" opacity="0.45" />
    </g>

    <g v-else-if="decoration === 'mushroom'" class="deco-body">
      <defs>
        <radialGradient :id="capId" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#E7A08C" />
          <stop offset="1" stop-color="#C97A66" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="0" rx="12" ry="2" fill="#4A3426" opacity="0.1" />
      <path d="M-4.5 0 Q-5.5 -10 -3.5 -16 L3.5 -16 Q5.5 -10 4.5 0 Z" fill="#F4ECDD" />
      <path d="M1 -1 Q2.5 -9 1.8 -15 L3.5 -16 Q5.5 -10 4.5 0Z" fill="#E2D6C2" />
      <path d="M-15 -15 Q-14 -31 0 -32 Q14 -31 15 -15 Q0 -12 -15 -15Z" :fill="`url(#${capId})`" />
      <circle cx="-6" cy="-24" r="2.4" fill="#FBF3E6" />
      <circle cx="5" cy="-27" r="1.8" fill="#FBF3E6" />
      <circle cx="8" cy="-19" r="1.5" fill="#FBF3E6" />
      <circle cx="-10" cy="-18" r="1.2" fill="#FBF3E6" />
    </g>

    <g v-else-if="decoration === 'butterfly'" class="deco-body">
      <g transform="translate(0 -14)">
        <g class="wing wing-left">
          <path d="M0 0 Q-14 -14 -15 -3 Q-14 3 0 0Z" fill="#F2C7A0" />
          <path d="M0 1 Q-10 10 -7 12 Q-2 11 0 1Z" fill="#EDB3B5" />
          <circle cx="-9" cy="-4" r="1.6" fill="#FBEBD9" />
        </g>
        <g class="wing wing-right">
          <path d="M0 0 Q14 -14 15 -3 Q14 3 0 0Z" fill="#F2C7A0" />
          <path d="M0 1 Q10 10 7 12 Q2 11 0 1Z" fill="#EDB3B5" />
          <circle cx="9" cy="-4" r="1.6" fill="#FBEBD9" />
        </g>
        <ellipse cx="0" cy="1" rx="1.4" ry="6" fill="#7A5D49" />
        <path d="M-0.5 -4 Q-3 -9 -4.5 -10 M0.5 -4 Q3 -9 4.5 -10" stroke="#7A5D49" stroke-width="0.8" fill="none" stroke-linecap="round" />
      </g>
    </g>

    <g v-else-if="decoration === 'lantern'" class="deco-body">
      <defs>
        <radialGradient :id="glowId">
          <stop offset="0" stop-color="#FBE2A6" stop-opacity="0.9" />
          <stop offset="1" stop-color="#FBE2A6" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="-18" r="24" :fill="`url(#${glowId})`" class="glow" />
      <ellipse cx="0" cy="0" rx="11" ry="2" fill="#4A3426" opacity="0.12" />
      <path d="M-5 -36 Q0 -42 5 -36" stroke="#8A6E57" stroke-width="1.6" fill="none" />
      <rect x="-8" y="-36" width="16" height="4" rx="2" fill="#8A6E57" />
      <rect x="-7" y="-32" width="14" height="26" rx="4" fill="#F7E2B5" stroke="#8A6E57" stroke-width="1.6" />
      <ellipse cx="0" cy="-19" rx="3" ry="5" fill="#F3C16E" class="flame" />
      <rect x="-9" y="-6" width="18" height="5" rx="2.5" fill="#8A6E57" />
    </g>

    <g v-else-if="decoration === 'teacup'" class="deco-body">
      <ellipse cx="0" cy="0" rx="15" ry="2.4" fill="#4A3426" opacity="0.1" />
      <ellipse cx="0" cy="-1.5" rx="14" ry="2.8" fill="#EADFCF" />
      <path d="M-10 -16 L10 -16 Q10 -3 0 -2.5 Q-10 -3 -10 -16Z" fill="#F8F1E6" />
      <path d="M3 -15 L10 -16 Q10 -3 0 -2.5 Q6 -6 3 -15Z" fill="#E6D8C4" />
      <path d="M10 -13 Q16 -13 15 -8 Q14 -5 8.5 -6" stroke="#E6D8C4" stroke-width="2.2" fill="none" stroke-linecap="round" />
      <ellipse cx="0" cy="-16" rx="10" ry="2.2" fill="#B88A68" />
      <path d="M-6 -11 Q0 -9 6 -11" stroke="#E6A79B" stroke-width="1.2" fill="none" opacity="0.8" />
      <g class="steam" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.8">
        <path d="M-3 -20 Q-5 -24 -3 -28 Q-1 -32 -3 -35" />
        <path d="M3 -21 Q1 -25 3 -29 Q5 -33 3 -36" />
      </g>
    </g>

    <g v-else-if="decoration === 'snail'" class="deco-body">
      <g class="snail-crawl">
        <ellipse cx="0" cy="0" rx="14" ry="2" fill="#4A3426" opacity="0.1" />
        <path d="M-14 0 Q-14 -4 -8 -4 L8 -4 Q11 -4 12 -9 Q13 -13 16 -12 Q18 -11 16 -6 Q15 -1 10 0Z" fill="#E9D8BE" />
        <path d="M14 -12 L13 -17 M16 -12 L17 -17" stroke="#C9B497" stroke-width="1" stroke-linecap="round" />
        <circle cx="13" cy="-17.4" r="1.2" fill="#7A5D49" />
        <circle cx="17" cy="-17.4" r="1.2" fill="#7A5D49" />
        <circle cx="0" cy="-12" r="9.5" fill="#C99A72" />
        <path d="M0 -12 m0 -6 a6 6 0 1 1 -5.6 8 a4 4 0 1 1 6.8 -3.6 a2 2 0 1 1 -2.6 1.6" stroke="#A97A56" stroke-width="1.4" fill="none" stroke-linecap="round" />
        <circle cx="-3.5" cy="-16" r="2" fill="#fff" opacity="0.3" />
        <circle cx="14" cy="-8" r="0.8" fill="#5B4636" />
      </g>
    </g>

    <g v-else-if="decoration === 'bunny'" class="deco-body">
      <ellipse cx="0" cy="0" rx="14" ry="2.2" fill="#4A3426" opacity="0.1" />
      <g class="bunny-ear-back"><path d="M5 -22 Q2 -38 7 -40 Q12 -38 10 -22Z" fill="#EDE3D6" /></g>
      <ellipse cx="-3" cy="-9" rx="12" ry="9.5" fill="#F7F1E8" />
      <circle cx="-14" cy="-7" r="3.4" fill="#FFFDF9" />
      <circle cx="6" cy="-18" r="8" fill="#F7F1E8" />
      <g class="bunny-ear"><path d="M2 -24 Q-6 -36 -2 -40 Q4 -40 6 -25Z" fill="#F7F1E8" /><path d="M2 -26 Q-3 -34 -1 -37 Q3 -37 4.5 -27Z" fill="#F1C4C0" /></g>
      <circle cx="9" cy="-19" r="1.3" fill="#47352A" />
      <circle cx="9.4" cy="-19.4" r="0.4" fill="#fff" />
      <ellipse cx="13.4" cy="-16.4" rx="1.2" ry="0.9" fill="#E9A3A0" />
      <ellipse cx="9.5" cy="-14.6" rx="2" ry="1.2" fill="#F3B6B0" opacity="0.6" />
      <ellipse cx="2" cy="-1" rx="4" ry="1.8" fill="#EDE3D6" />
    </g>

    <g v-else-if="decoration === 'kitty'" class="deco-body">
      <ellipse cx="0" cy="0" rx="17" ry="2.4" fill="#4A3426" opacity="0.1" />
      <g class="kitty-breathe">
        <path d="M-16 -1 Q-17 -15 -3 -16 Q10 -17 13 -8 Q14 -1 8 -1Z" fill="#EDBE8E" />
        <path d="M-12 -12 Q-8 -14 -6 -10 M-5 -15 Q-2 -16 0 -12" stroke="#D89F6B" stroke-width="1.6" fill="none" stroke-linecap="round" />
        <path d="M-16 -2 Q-22 -6 -18 -10 Q-15 -12 -14 -8" stroke="#EDBE8E" stroke-width="4" fill="none" stroke-linecap="round" class="kitty-tail" />
        <circle cx="8" cy="-10" r="7.5" fill="#F1C597" />
        <path d="M2.5 -15 L3.5 -21.5 L7.5 -16.5Z" fill="#F1C597" />
        <path d="M9 -16.8 L13 -21 L14 -15Z" fill="#F1C597" />
        <path d="M4 -16 L4.6 -19.6 L6.6 -16.8Z" fill="#F0B3AC" />
        <path d="M4.5 -10 Q6 -8.6 7.5 -10 M10 -10 Q11.5 -8.6 13 -10" stroke="#5B4636" stroke-width="1" fill="none" stroke-linecap="round" />
        <ellipse cx="8.8" cy="-7.6" rx="0.9" ry="0.6" fill="#D98C84" />
        <ellipse cx="3.8" cy="-7.5" rx="2" ry="1.1" fill="#F0A99F" opacity="0.5" />
        <ellipse cx="13.6" cy="-7.5" rx="2" ry="1.1" fill="#F0A99F" opacity="0.5" />
      </g>
    </g>

    <g v-else-if="decoration === 'starjar'" class="deco-body">
      <ellipse cx="0" cy="0" rx="11" ry="2" fill="#4A3426" opacity="0.12" />
      <circle cx="0" cy="-13" r="18" :fill="`url(#${glowId})`" class="glow" />
      <defs>
        <radialGradient :id="glowId">
          <stop offset="0" stop-color="#F8E7A0" stop-opacity="0.8" />
          <stop offset="1" stop-color="#F8E7A0" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect x="-9" y="-26" width="18" height="25" rx="6" fill="#E3EEF0" opacity="0.55" stroke="#C9D8DC" stroke-width="1" />
      <rect x="-7" y="-30" width="14" height="5" rx="1.8" fill="#C79A72" />
      <path d="M-6.5 -28 L6.5 -28" stroke="#A97E5A" stroke-width="0.8" />
      <g fill="#FBE6A0">
        <circle cx="-3" cy="-16" r="1.6" class="firefly" />
        <circle cx="3" cy="-10" r="1.4" class="firefly" style="animation-delay: 0.8s" />
        <circle cx="1" cy="-20" r="1.2" class="firefly" style="animation-delay: 1.6s" />
      </g>
      <path d="M-6 -22 Q-7 -12 -5 -5" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.5" stroke-linecap="round" />
    </g>

    <g v-else-if="decoration === 'rainbow'" class="deco-body">
      <g fill="none" stroke-linecap="round" stroke-width="3.2" class="rainbow-arcs">
        <path d="M-26 0 A26 26 0 0 1 26 0" stroke="#EFB2A6" />
        <path d="M-22.6 0 A22.6 22.6 0 0 1 22.6 0" stroke="#F3CF96" />
        <path d="M-19.2 0 A19.2 19.2 0 0 1 19.2 0" stroke="#C9DBA9" />
        <path d="M-15.8 0 A15.8 15.8 0 0 1 15.8 0" stroke="#A9CADB" />
        <path d="M-12.4 0 A12.4 12.4 0 0 1 12.4 0" stroke="#C7B7DD" />
      </g>
      <g fill="#FFFDF9">
        <ellipse cx="-24" cy="0" rx="9" ry="4.4" /><circle cx="-27" cy="-3" r="4" /><circle cx="-21" cy="-4" r="4.6" />
        <ellipse cx="24" cy="0" rx="9" ry="4.4" /><circle cx="21" cy="-3.6" r="4.4" /><circle cx="27" cy="-3" r="4" />
      </g>
    </g>
  </g>
</template>

<style scoped>
.deco-body,
.wing {
  transform-box: fill-box;
}
.deco-body {
  transform-origin: 50% 100%;
}
.wing-left {
  transform-origin: right center;
}
.wing-right {
  transform-origin: left center;
}

/* idle life */
.is-animated .wing {
  animation: flap 1.6s ease-in-out infinite;
}
.is-animated .glow {
  animation: glow 4s ease-in-out infinite;
}
.is-animated .flame {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: flicker 2.2s ease-in-out infinite;
}
.is-animated .steam path {
  animation: steam 3.2s ease-in-out infinite;
}
.is-animated .steam path:last-child {
  animation-delay: 1.6s;
}
.is-animated .bunny-ear {
  transform-box: fill-box;
  transform-origin: 80% 100%;
  animation: ear-twitch 6s ease-in-out infinite;
}
.is-animated .kitty-breathe {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: kitty-breathe 4s ease-in-out infinite;
}
.is-animated .kitty-tail {
  transform-box: fill-box;
  transform-origin: 100% 100%;
  animation: tail-flick 7s ease-in-out infinite;
}
.is-animated .firefly {
  animation: firefly 2.4s ease-in-out infinite;
}
.is-animated .rainbow-arcs {
  animation: shimmer 6s ease-in-out infinite;
}
.is-animated .snail-crawl {
  animation: crawl 26s ease-in-out infinite;
}

/* reactions when tapped */
.is-poked.deco--pebbles .deco-body,
.is-poked.deco--mushroom .deco-body {
  animation: boing 0.9s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.is-poked.deco--butterfly .wing {
  animation-duration: 0.35s;
}
.is-poked.deco--butterfly .deco-body {
  animation: flutter-up 1.4s ease-in-out;
}
.is-poked.deco--lantern .glow {
  animation: glow-bright 1.4s ease-in-out;
}
.is-poked.deco--teacup .deco-body {
  animation: wobble 0.8s ease-in-out;
}
.is-poked.deco--bunny .deco-body {
  animation: bunny-hop 0.9s ease-in-out;
}
.is-poked.deco--kitty .deco-body {
  animation: wobble 0.8s ease-in-out;
}
.is-poked.deco--starjar .glow,
.is-poked.deco--rainbow .deco-body {
  animation: glow-bright 1.4s ease-in-out;
}
.is-poked.deco--snail .deco-body {
  animation: tuck 1.4s ease-in-out;
}

@keyframes flap {
  0%, 100% { transform: scaleX(1); }
  50% { transform: scaleX(0.45); }
}
@keyframes glow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
@keyframes glow-bright {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  40% { opacity: 1; transform: scale(1.35); }
}
@keyframes flicker {
  0%, 100% { transform: scale(1, 1); }
  30% { transform: scale(0.92, 1.06); }
  60% { transform: scale(1.04, 0.95); }
}
@keyframes steam {
  0% { opacity: 0; transform: translateY(4px); }
  40% { opacity: 0.8; }
  100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes crawl {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-10px); }
}
@keyframes ear-twitch {
  0%, 88%, 100% { transform: rotate(0); }
  92% { transform: rotate(-12deg); }
  96% { transform: rotate(4deg); }
}
@keyframes kitty-breathe {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(1.02, 1.05); }
}
@keyframes tail-flick {
  0%, 85%, 100% { transform: rotate(0); }
  90% { transform: rotate(-14deg); }
  95% { transform: rotate(6deg); }
}
@keyframes firefly {
  0%, 100% { opacity: 1; transform: translate(0, 0); }
  50% { opacity: 0.3; transform: translate(1.5px, -2px); }
}
@keyframes shimmer {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
@keyframes bunny-hop {
  0%, 100% { transform: translateY(0) scale(1, 1); }
  20% { transform: translateY(0) scale(1.08, 0.9); }
  50% { transform: translateY(-12px) scale(0.95, 1.06); }
  80% { transform: translateY(0) scale(1.04, 0.96); }
}
@keyframes boing {
  0%, 100% { transform: scale(1, 1); }
  25% { transform: scale(1.15, 0.8); }
  55% { transform: scale(0.92, 1.12); }
  80% { transform: scale(1.03, 0.97); }
}
@keyframes flutter-up {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-6px, -22px) rotate(-8deg); }
}
@keyframes wobble {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-6deg); }
  60% { transform: rotate(4deg); }
}
@keyframes tuck {
  0%, 100% { transform: scale(1, 1); }
  30%, 70% { transform: scale(0.9, 0.86); }
}
@media (prefers-reduced-motion: reduce) {
  .deco * {
    animation: none !important;
  }
}
</style>
