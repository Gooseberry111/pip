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
      <linearGradient :id="`${uid}-beach`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#CFE7F0" />
        <stop offset="1" stop-color="#F8F1E2" />
      </linearGradient>
      <linearGradient :id="`${uid}-autumn`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F6DDBE" />
        <stop offset="1" stop-color="#FAEEDB" />
      </linearGradient>
      <linearGradient :id="`${uid}-snow`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#C9D6DF" />
        <stop offset="1" stop-color="#EEF2F4" />
      </linearGradient>
      <linearGradient :id="`${uid}-roof`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7D7EA6" />
        <stop offset="0.6" stop-color="#E7A99A" />
        <stop offset="1" stop-color="#F6C9A6" />
      </linearGradient>
      <linearGradient :id="`${uid}-space`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#231F45" />
        <stop offset="1" stop-color="#4A3F7A" />
      </linearGradient>
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

    <!-- Seaside -->
    <g v-else-if="scene === 'beach'">
      <rect width="300" height="400" :fill="`url(#${uid}-beach)`" />
      <circle cx="230" cy="80" r="26" fill="#FDF0C9" />
      <ellipse cx="70" cy="70" rx="28" ry="8" fill="#fff" opacity="0.8" /><ellipse cx="88" cy="64" rx="16" ry="8" fill="#fff" opacity="0.8" />
      <rect y="210" width="300" height="70" fill="#8CC4D8" />
      <path d="M0 210 H300 V218 Q275 212 250 218 T200 218 T150 218 T100 218 T50 218 T0 218Z" fill="#B7DDE8" />
      <g stroke="#D6EEF4" stroke-width="2" fill="none" stroke-linecap="round" class="wave">
        <path d="M30 236 q10 -5 20 0 M120 248 q10 -5 20 0 M210 232 q10 -5 20 0 M250 258 q10 -5 20 0" />
      </g>
      <path d="M200 205 L206 190 L212 205Z" fill="#fff" /><path d="M199 206 H214" stroke="#9C7351" stroke-width="2" />
      <path d="M0 270 Q80 256 160 268 T300 262 L300 400 L0 400Z" fill="#F4DDB3" />
      <rect y="330" width="300" height="70" fill="#EED2A2" />
      <g transform="translate(232 262) scale(0.7)"><path d="M0 0 L0 -50" stroke="#9C7351" stroke-width="3" /><path d="M-30 -48 Q0 -70 30 -48Z" fill="#E48C9C" /><path d="M-10 -48 Q0 -70 10 -48" fill="#FBF6EA" /></g>
      <g fill="#E8B48A"><path d="M40 320 l6 -4 l6 4 l-2 6 h-8z" /></g>
      <circle cx="80" cy="345" r="3" fill="#F6EFE2" /><circle cx="210" cy="360" r="2" fill="#F6EFE2" />
    </g>

    <!-- Autumn wood -->
    <g v-else-if="scene === 'autumnwood'">
      <rect width="300" height="400" :fill="`url(#${uid}-autumn)`" />
      <circle cx="80" cy="90" r="24" fill="#FBE5BE" opacity="0.9" />
      <path d="M0 250 Q80 220 160 246 T300 236 L300 400 L0 400Z" fill="#E4C58F" />
      <g v-for="(t, i) in [[40, 230, 1.1, '#E39A4A'], [110, 214, 0.8, '#D2773A'], [196, 222, 0.9, '#E8B24C'], [262, 232, 1.2, '#C9603A']]" :key="i" :transform="`translate(${t[0]} ${t[1]}) scale(${t[2]})`">
        <rect x="-4" y="-10" width="8" height="40" rx="3" fill="#8C6A4F" />
        <circle cy="-30" r="28" :fill="t[3]" />
        <circle cx="-18" cy="-14" r="16" :fill="t[3]" opacity="0.9" />
        <circle cx="18" cy="-16" r="17" :fill="t[3]" opacity="0.9" />
      </g>
      <path d="M0 296 Q110 274 200 292 T300 288 L300 400 L0 400Z" fill="#D7AE74" />
      <rect y="330" width="300" height="70" fill="#CFA36A" />
      <g>
        <path v-for="(pt, i) in springPetals" :key="i" :d="`M${pt[0]} ${pt[1]} q4 -4 8 0 q-4 4 -8 0z`" :fill="i % 2 ? '#E39A4A' : '#C9603A'" class="petal-fall" :style="{ animationDelay: `${i * 1.2}s`, animationDuration: `${9 + (i % 3) * 2}s` }" />
      </g>
    </g>

    <!-- Snowy day -->
    <g v-else-if="scene === 'snowy'">
      <rect width="300" height="400" fill="#EEE9E2" />
      <rect x="48" y="40" width="204" height="220" rx="14" fill="#FBF8F3" />
      <rect x="60" y="52" width="180" height="196" rx="8" :fill="`url(#${uid}-snow)`" />
      <path d="M60 200 Q110 180 160 198 T240 190 L240 248 L60 248Z" fill="#FFFFFF" />
      <g transform="translate(200 214)"><path d="M0 -40 L-16 0 H16Z" fill="#9DB7A6" /><path d="M0 -40 L-10 -18 H10Z" fill="#fff" opacity="0.85" /></g>
      <g transform="translate(96 220)"><circle r="12" fill="#fff" /><circle cy="-16" r="8" fill="#fff" /><path d="M0 -16 l7 1.5 l-7 1.5z" fill="#EE9447" /></g>
      <g :clip-path="`url(#${uid}-rainclip)`" fill="#fff">
        <circle v-for="(x, i) in rainX" :key="i" :cx="x" cy="40" :r="1.6 + (i % 3) * 0.5" class="snowfall" :style="{ animationDelay: `${(i * 0.53) % 4}s` }" />
      </g>
      <rect x="146" y="52" width="8" height="196" fill="#FBF8F3" />
      <rect x="60" y="146" width="180" height="8" fill="#FBF8F3" />
      <path d="M40 34 Q30 150 52 270 L72 270 Q60 150 70 34Z" fill="#C9D6DA" />
      <path d="M260 34 Q270 150 248 270 L228 270 Q240 150 230 34Z" fill="#C9D6DA" />
      <rect x="20" y="318" width="260" height="20" rx="8" fill="#E2D6C6" />
      <rect x="20" y="330" width="260" height="70" fill="#EDE3D6" />
      <g transform="translate(280 316)"><rect x="-10" y="-16" width="20" height="16" rx="3" fill="#E48C9C" /><path d="M10 -12 q6 0 6 5 q0 5 -6 5" stroke="#E48C9C" stroke-width="2.4" fill="none" /><path d="M-4 -22 q2 -4 0 -8 M3 -22 q2 -4 0 -8" stroke="#fff" stroke-width="1.4" fill="none" opacity="0.7" /></g>
    </g>

    <!-- Cosy library -->
    <g v-else-if="scene === 'library'">
      <rect width="300" height="400" fill="#E9DCCB" />
      <rect x="20" y="30" width="260" height="290" rx="6" fill="#B98C63" />
      <g v-for="row in 4" :key="row">
        <rect x="28" :y="38 + (row - 1) * 70" width="244" height="62" fill="#8C6A4F" />
        <rect x="24" :y="98 + (row - 1) * 70" width="252" height="6" fill="#C49A6C" />
        <rect v-for="b in 14" :key="b" :x="32 + (b - 1) * 17" :y="48 + (row - 1) * 70 + ((b * row) % 3) * 4" width="13" :height="50 - ((b * row) % 3) * 4" rx="1.5" :fill="['#E8A1A6', '#7FA6C9', '#A9C79A', '#F2C66B', '#C9B2E6', '#E09C7D'][(b + row) % 6]" />
      </g>
      <rect y="318" width="300" height="82" fill="#C9A27C" />
      <rect y="318" width="300" height="10" fill="#B58D67" />
      <g transform="translate(280 318)"><path d="M-14 -46 H14 L8 -30 H-8Z" fill="#F6CF6E" /><rect x="-1.5" y="-30" width="3" height="28" fill="#5B4636" /><ellipse cy="-1" rx="10" ry="3" fill="#5B4636" /><circle cy="-36" r="30" fill="#FBE3A0" opacity="0.25" /></g>
      <path d="M30 360 Q150 340 270 360 L270 400 L30 400Z" fill="#B5544A" opacity="0.6" />
    </g>

    <!-- City rooftop -->
    <g v-else-if="scene === 'rooftop'">
      <rect width="300" height="400" :fill="`url(#${uid}-roof)`" />
      <circle cx="230" cy="70" r="18" fill="#F7D9A8" opacity="0.9" />
      <g fill="#5C6481">
        <rect x="0" y="170" width="46" height="160" /><rect x="50" y="130" width="40" height="200" /><rect x="94" y="190" width="50" height="140" />
        <rect x="148" y="110" width="36" height="220" /><rect x="188" y="160" width="54" height="170" /><rect x="246" y="140" width="54" height="190" />
      </g>
      <g fill="#F8DE9E">
        <rect v-for="(w, i) in [[8, 186], [24, 206], [58, 146], [72, 176], [58, 216], [104, 204], [124, 230], [156, 126], [168, 160], [156, 200], [198, 176], [222, 200], [256, 156], [276, 186], [256, 226]]" :key="i" :x="w[0]" :y="w[1]" width="7" height="9" rx="1" :opacity="i % 3 ? 0.9 : 0.5" class="twinkle" :style="{ animationDelay: `${i * 0.6}s` }" />
      </g>
      <rect y="300" width="300" height="100" fill="#8A7F86" />
      <rect y="300" width="300" height="10" fill="#A0959A" />
      <path d="M20 300 V270 M60 300 V270 M20 274 H60" stroke="#6B6370" stroke-width="3" />
      <g fill="#F6C7CD"><circle cx="30" cy="268" r="1.6" /><circle cx="40" cy="266" r="1.6" /><circle cx="50" cy="268" r="1.6" /></g>
      <path d="M0 250 Q75 262 150 248 T300 252" stroke="#6B6370" stroke-width="0.8" fill="none" />
      <g fill="#F8DE9E"><circle v-for="k in 9" :key="k" :cx="k * 32 - 6" :cy="252 + Math.sin(k) * 4" r="2.2" class="twinkle" :style="{ animationDelay: `${k * 0.4}s` }" /></g>
    </g>

    <!-- Greenhouse -->
    <g v-else-if="scene === 'greenhouse'">
      <rect width="300" height="400" fill="#E6F0E4" />
      <path d="M0 40 Q150 -20 300 40" stroke="#FFFFFF" stroke-width="6" fill="none" />
      <g stroke="#FFFFFF" stroke-width="4"><path d="M60 0 V330 M150 0 V330 M240 0 V330 M0 120 H300 M0 220 H300" /></g>
      <rect width="300" height="330" fill="#CFE6EE" opacity="0.35" />
      <g v-for="(pl, i) in [[30, 300, '#7FAA5C'], [90, 290, '#8FB86A'], [210, 296, '#6E9E5C'], [272, 302, '#7FAA5C']]" :key="i" :transform="`translate(${pl[0]} ${pl[1]})`">
        <rect x="-14" y="0" width="28" height="30" rx="3" fill="#E09C7D" />
        <ellipse cx="-8" cy="-14" rx="10" ry="18" :fill="pl[2]" transform="rotate(-20 -8 -14)" />
        <ellipse cx="8" cy="-16" rx="10" ry="20" :fill="pl[2]" transform="rotate(18 8 -16)" />
        <ellipse cx="0" cy="-24" rx="7" ry="18" :fill="pl[2]" opacity="0.85" />
      </g>
      <g transform="translate(40 120)"><path d="M0 0 V40" stroke="#9C7351" stroke-width="1.4" /><path d="M-18 40 Q0 70 18 40Z" fill="#E09C7D" /><path d="M-14 46 Q-20 70 -10 84 M0 50 Q2 80 -4 96 M12 46 Q20 70 14 86" stroke="#7FAA5C" stroke-width="3" fill="none" stroke-linecap="round" /></g>
      <rect y="330" width="300" height="70" fill="#D9CCB6" />
      <rect y="326" width="300" height="8" fill="#C4B49A" />
    </g>

    <!-- Outer space -->
    <g v-else-if="scene === 'space'">
      <rect width="300" height="400" :fill="`url(#${uid}-space)`" />
      <circle v-for="([x, y, r], i) in stars" :key="i" :cx="x" :cy="y" :r="r" fill="#FFF6D9" class="twinkle" :style="{ animationDelay: `${i * 0.5}s` }" />
      <circle v-for="([x, y, r], i) in stars" :key="`b${i}`" :cx="300 - x" :cy="y + 60" :r="r * 0.7" fill="#E4DCF4" class="twinkle" :style="{ animationDelay: `${i * 0.8}s` }" />
      <g transform="translate(220 90)"><circle r="26" fill="#E8A1A6" /><ellipse rx="42" ry="9" fill="none" stroke="#F6D3D8" stroke-width="4" transform="rotate(-18)" /><circle cx="-8" cy="-6" r="5" fill="#D98A90" /></g>
      <circle cx="60" cy="150" r="10" fill="#A9C8F0" /><circle cx="56" cy="147" r="3" fill="#7FA6C9" />
      <path d="M0 300 Q150 260 300 300 L300 400 L0 400Z" fill="#C9C3D6" />
      <rect y="330" width="300" height="70" fill="#BDB6CC" />
      <g fill="#ADA6BE"><ellipse cx="60" cy="350" rx="18" ry="5" /><ellipse cx="230" cy="365" rx="24" ry="6" /><ellipse cx="150" cy="384" rx="12" ry="3.5" /></g>
      <g transform="translate(272 300)"><path d="M0 0 V-34" stroke="#8C8599" stroke-width="2" /><path d="M0 -34 L20 -28 L0 -22Z" fill="#E35D4B" /></g>
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
.snowfall {
  animation: snowfall 4s linear infinite;
}
@keyframes snowfall {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(-14px, 210px); opacity: 0.8; }
}
.wave {
  animation: wave 4s ease-in-out infinite alternate;
}
@keyframes wave {
  to { transform: translateX(10px); }
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
  .glass-drop,
  .snowfall,
  .wave {
    animation: none;
  }
}
</style>
