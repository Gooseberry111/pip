<script setup>
// Garden backgrounds, drawn on a 300 x 400 canvas. The ground line sits at y = 330.
import { useId } from 'vue'

defineProps({
  scene: { type: String, default: 'windowsill' },
})

const uid = useId()
const springPetals = [[40, 120], [90, 90], [150, 60], [200, 130], [260, 100], [120, 170], [20, 200], [180, 30]]
const rainX = [70, 92, 108, 126, 141, 163, 178, 196, 214, 232, 84, 150, 205]
const glassDrops = [[88, 80], [176, 120], [120, 190], [214, 70], [200, 210]]
const stars = [
  [30, 40, 1.2], [70, 90, 0.9], [120, 30, 1.4], [170, 70, 1], [240, 40, 1.3], [270, 110, 0.9],
  [210, 130, 1.1], [40, 150, 1], [95, 180, 0.8], [260, 190, 1.2], [150, 120, 0.8],
]
</script>

<template>
  <g>
    <defs>
      <linearGradient :id="`${uid}-win`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#D9E7EC" />
        <stop offset="1" stop-color="#F4EEE2" />
      </linearGradient>
      <linearGradient :id="`${uid}-meadow`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E4EEEC" />
        <stop offset="1" stop-color="#FBF3E4" />
      </linearGradient>
      <linearGradient :id="`${uid}-sunset`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F2BFA3" />
        <stop offset="0.6" stop-color="#F8DEC4" />
        <stop offset="1" stop-color="#FAEBD8" />
      </linearGradient>
      <linearGradient :id="`${uid}-spring`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F7E4E4" />
        <stop offset="1" stop-color="#FCF4EA" />
      </linearGradient>
      <linearGradient :id="`${uid}-rain`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#AFBAC4" />
        <stop offset="1" stop-color="#D9DCDC" />
      </linearGradient>
      <clipPath :id="`${uid}-rainclip`"><rect x="60" y="52" width="180" height="196" rx="8" /></clipPath>
      <linearGradient :id="`${uid}-night`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#465271" />
        <stop offset="1" stop-color="#76809C" />
      </linearGradient>
    </defs>

    <!-- Windowsill -->
    <g v-if="scene === 'windowsill'">
      <rect width="300" height="400" fill="#F5ECDF" />
      <rect x="48" y="40" width="204" height="220" rx="14" fill="#FFFCF6" />
      <rect x="60" y="52" width="180" height="196" rx="8" :fill="`url(#${uid}-win)`" />
      <circle cx="196" cy="100" r="22" fill="#FBEFD2" opacity="0.9" />
      <path d="M60 200 Q110 176 160 196 T240 186 L240 248 L60 248Z" fill="#DCE3D2" opacity="0.7" />
      <rect x="146" y="52" width="8" height="196" fill="#FFFCF6" />
      <rect x="60" y="146" width="180" height="8" fill="#FFFCF6" />
      <path d="M40 34 Q30 150 52 270 L72 270 Q60 150 70 34Z" fill="#EAD9C4" />
      <path d="M260 34 Q270 150 248 270 L228 270 Q240 150 230 34Z" fill="#EAD9C4" />
      <rect x="20" y="318" width="260" height="20" rx="8" fill="#E2CFB7" />
      <rect x="20" y="330" width="260" height="70" fill="#EBDDCB" />
      <rect x="28" y="320" width="120" height="3" rx="1.5" fill="#fff" opacity="0.35" />
    </g>

    <!-- Meadow -->
    <g v-else-if="scene === 'meadow'">
      <rect width="300" height="400" :fill="`url(#${uid}-meadow)`" />
      <circle cx="226" cy="86" r="30" fill="#F8E6BC" opacity="0.85" />
      <ellipse cx="80" cy="70" rx="30" ry="9" fill="#fff" opacity="0.7" />
      <ellipse cx="100" cy="64" rx="18" ry="8" fill="#fff" opacity="0.7" />
      <path d="M0 260 Q80 215 160 250 T300 236 L300 400 L0 400Z" fill="#D7DEC3" />
      <path d="M0 300 Q100 268 190 296 T300 290 L300 400 L0 400Z" fill="#C6D1AE" />
      <rect y="330" width="300" height="70" fill="#BFCBA6" />
      <g fill="#FBF6EA">
        <circle cx="40" cy="352" r="2" /><circle cx="250" cy="362" r="2" /><circle cx="200" cy="380" r="1.6" />
      </g>
    </g>

    <!-- Sunset -->
    <g v-else-if="scene === 'sunset'">
      <rect width="300" height="400" :fill="`url(#${uid}-sunset)`" />
      <circle cx="150" cy="232" r="46" fill="#F5B993" opacity="0.8" />
      <path d="M0 250 Q70 220 140 248 T300 240 L300 400 L0 400Z" fill="#E4B49B" />
      <path d="M0 296 Q120 270 210 292 T300 288 L300 400 L0 400Z" fill="#D9A58D" opacity="0.8" />
      <rect y="330" width="300" height="70" fill="#CF9C86" />
    </g>

    <!-- Starry night -->
    <g v-else-if="scene === 'night'">
      <rect width="300" height="400" :fill="`url(#${uid}-night)`" />
      <circle v-for="([x, y, r], i) in stars" :key="i" :cx="x" :cy="y" :r="r" fill="#F6EEDB" class="twinkle" :style="{ animationDelay: `${i * 0.7}s` }" />
      <path d="M232 62 a20 20 0 1 0 22 26 a16 16 0 1 1 -22 -26z" fill="#F4ECD8" />
      <path d="M0 270 Q90 240 170 266 T300 258 L300 400 L0 400Z" fill="#5C6782" />
      <rect y="330" width="300" height="70" fill="#535D77" />
    </g>

    <!-- Cherry blossom spring -->
    <g v-else-if="scene === 'spring'">
      <rect width="300" height="400" :fill="`url(#${uid}-spring)`" />
      <circle cx="232" cy="78" r="26" fill="#FDF1D8" opacity="0.9" />
      <path d="M0 250 Q80 222 160 246 T300 236 L300 400 L0 400Z" fill="#DCE3CB" />
      <g>
        <rect x="52" y="160" width="7" height="96" rx="3" fill="#A9826A" />
        <path d="M56 200 Q40 186 34 170" stroke="#A9826A" stroke-width="4" fill="none" stroke-linecap="round" />
        <circle cx="56" cy="148" r="34" fill="#F2C6CD" />
        <circle cx="30" cy="166" r="22" fill="#EEB7C1" />
        <circle cx="80" cy="166" r="24" fill="#F6D3D8" />
        <circle cx="48" cy="130" r="18" fill="#F8DCE0" />
      </g>
      <g>
        <rect x="241" y="190" width="6" height="70" rx="3" fill="#A9826A" />
        <circle cx="244" cy="182" r="26" fill="#F2C6CD" />
        <circle cx="262" cy="196" r="18" fill="#EEB7C1" />
        <circle cx="228" cy="196" r="16" fill="#F6D3D8" />
      </g>
      <path d="M0 300 Q110 276 200 296 T300 292 L300 400 L0 400Z" fill="#CBD6B3" />
      <rect y="330" width="300" height="70" fill="#C3CFA9" />
      <g fill="#F3C3CB">
        <ellipse v-for="(pt, i) in springPetals" :key="i" :cx="pt[0]" :cy="pt[1]" rx="3" ry="1.8" class="petal-fall" :style="{ animationDelay: `${i * 1.1}s`, animationDuration: `${8 + (i % 3) * 2}s` }" />
      </g>
    </g>

    <!-- Rainy day by the window -->
    <g v-else-if="scene === 'rainy'">
      <rect width="300" height="400" fill="#E9E4DC" />
      <rect x="48" y="40" width="204" height="220" rx="14" fill="#F8F5EF" />
      <rect x="60" y="52" width="180" height="196" rx="8" :fill="`url(#${uid}-rain)`" />
      <ellipse cx="110" cy="96" rx="44" ry="14" fill="#C4CCD3" opacity="0.8" />
      <ellipse cx="190" cy="84" rx="36" ry="12" fill="#CBD2D8" opacity="0.8" />
      <path d="M60 210 Q110 190 160 206 T240 198 L240 248 L60 248Z" fill="#B8C3BE" opacity="0.6" />
      <g :clip-path="`url(#${uid}-rainclip)`" stroke="#F4F7F9" stroke-width="1.2" stroke-linecap="round" opacity="0.7">
        <path v-for="(x, i) in rainX" :key="i" :d="`M${x} 40 l-5 14`" class="rain" :style="{ animationDelay: `${(i * 0.37) % 1.4}s` }" />
      </g>
      <g fill="#F4F7F9" opacity="0.75">
        <circle v-for="([x, y], i) in glassDrops" :key="`g${i}`" :cx="x" :cy="y" r="1.8" class="glass-drop" :style="{ animationDelay: `${i * 1.3}s` }" />
      </g>
      <rect x="146" y="52" width="8" height="196" fill="#F8F5EF" />
      <rect x="60" y="146" width="180" height="8" fill="#F8F5EF" />
      <path d="M40 34 Q30 150 52 270 L72 270 Q60 150 70 34Z" fill="#D9CFC3" />
      <path d="M260 34 Q270 150 248 270 L228 270 Q240 150 230 34Z" fill="#D9CFC3" />
      <rect x="20" y="318" width="260" height="20" rx="8" fill="#D8C8B4" />
      <rect x="20" y="330" width="260" height="70" fill="#E2D6C6" />
      <rect x="28" y="320" width="120" height="3" rx="1.5" fill="#fff" opacity="0.35" />
    </g>
  </g>
</template>

<style scoped>
.twinkle {
  animation: twinkle 5s ease-in-out infinite;
}
.rain {
  animation: rain 1.4s linear infinite;
}
.petal-fall {
  transform-box: fill-box;
  transform-origin: center;
  animation: petal-fall 9s linear infinite;
}
@keyframes petal-fall {
  0% { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
  10% { opacity: 0.9; }
  100% { transform: translate(-60px, 260px) rotate(320deg); opacity: 0; }
}
.glass-drop {
  animation: glass-drop 7s ease-in infinite;
}
@keyframes rain {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(-50px, 220px); opacity: 0.6; }
}
@keyframes glass-drop {
  0%, 60% { transform: translateY(0); opacity: 0.8; }
  100% { transform: translateY(40px); opacity: 0; }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.35; }
}
@media (prefers-reduced-motion: reduce) {
  .twinkle,
  .rain,
  .petal-fall,
  .glass-drop {
    animation: none;
  }
}
</style>
