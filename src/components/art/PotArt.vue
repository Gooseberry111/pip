<script setup>
// Pip's pot. Drawn in Pip's coordinate space: rim top at y=166, centred on x=100.
// Light comes softly from the upper left.
import { computed, useId } from 'vue'

const props = defineProps({
  pot: { type: String, default: 'terracotta' },
  soil: { type: Boolean, default: true },
  wet: { type: Boolean, default: false },
})

const POTS = {
  terracotta: { light: '#E4B192', base: '#D39A7B', dark: '#B67A5D', rimLight: '#EDC0A4', rimDark: '#C88B6D' },
  cream: { light: '#FCF7EE', base: '#EFE5D5', dark: '#D3C2A9', rimLight: '#FFFDF8', rimDark: '#E0D2BD', accent: '#D6B892' },
  honey: { light: '#F5DCAA', base: '#EAC889', dark: '#CDA463', rimLight: '#F9E8C4', rimDark: '#DCB674', accent: '#FBF1DC' },
  sage: { light: '#C8D5B8', base: '#B3C1A3', dark: '#93A285', rimLight: '#D5E0C8', rimDark: '#A2B092', accent: '#86957A' },
  drip: { light: '#FBF6EC', base: '#F0E7D9', dark: '#D6C7B1', rimLight: '#B9CED8', rimDark: '#8BA5B4', accent: '#9FB9C6' },
  blush: { light: '#F4D0C3', base: '#E8BBAC', dark: '#CF9C8C', rimLight: '#F8DDD3', rimDark: '#DCAC9C', accent: '#FCEDE6' },
  strawberry: { light: '#F2A39B', base: '#E5827A', dark: '#C5645D', rimLight: '#A9CB92', rimDark: '#7FA76B', accent: '#FBE8A6' },
  lilac: { light: '#DED2E8', base: '#CBBAD9', dark: '#A996BC', rimLight: '#E8DFF0', rimDark: '#B9A7CB', accent: '#FFFBF4' },
  cloud: { light: '#D3E6F0', base: '#B7D3E3', dark: '#93B3C8', rimLight: '#E1EEF5', rimDark: '#A3C2D4', accent: '#FFFFFF' },
  moon: { light: '#A6B1C8', base: '#8E9AB4', dark: '#73809C', rimLight: '#B6C0D4', rimDark: '#8592AD', accent: '#F3EAD6' },
  mint: { light: '#D6EEE2', base: '#BFE2D0', dark: '#9CC8B2', rimLight: '#E4F4EC', rimDark: '#ADD4C0' },
  cocoa: { light: '#B88E70', base: '#A07558', dark: '#835C43', rimLight: '#C9A285', rimDark: '#93684C' },
  coral: { light: '#F7B9A0', base: '#EE9C82', dark: '#D47C63', rimLight: '#FBD0A4', rimDark: '#EDAF7E' },
  midnight: { light: '#5C6C96', base: '#4A5A84', dark: '#384669', rimLight: '#6E7EA6', rimDark: '#4F5F8A' },
}

const p = computed(() => POTS[props.pot] ?? POTS.terracotta)

const uid = useId()
const ids = {
  body: `${uid}-body`,
  rim: `${uid}-rim`,
  shade: `${uid}-shade`,
  clip: `${uid}-clip`,
  soil: `${uid}-soil`,
}

const BODY = 'M62 182 L138 182 L131.5 226 Q130 234 121 234 L79 234 Q70 234 68.5 226 Z'
const DRIP =
  'M60 180 L140 180 L137 197 Q133 205 129 197 Q125 189 120 201 Q116 211 111 199 Q107 191 101 201 Q96 209 91 197 Q87 190 82 200 Q77 207 73 196 Q70 190 64 198 Z'

const speckles = [
  [76, 192, 1.6], [88, 222, 1.3], [108, 190, 1.2], [124, 214, 1.6], [96, 228, 1.1],
  [72, 214, 1.2], [118, 228, 1.3], [128, 194, 1.1], [84, 200, 0.9], [104, 212, 0.8], [116, 204, 1],
]
const seeds = [[74, 194], [86, 190], [98, 196], [111, 191], [124, 195], [80, 207], [93, 212], [106, 206], [119, 210], [129, 205], [86, 224], [100, 227], [114, 223]]
const blooms = [[76, 196], [102, 192], [126, 200], [88, 220], [116, 224]]
const clouds = [[80, 200, 1], [118, 214, 1.15], [92, 228, 0.7]]
const crumbs = [[80, 170, 1.2], [92, 168.5, 0.9], [110, 171, 1.1], [120, 169, 0.8], [101, 172, 0.7]]
</script>

<template>
  <g>
    <defs>
      <linearGradient :id="ids.body" x1="62" x2="138" y1="0" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" :stop-color="p.light" />
        <stop offset="0.45" :stop-color="p.base" />
        <stop offset="1" :stop-color="p.dark" />
      </linearGradient>
      <linearGradient :id="ids.rim" x1="0" x2="0" y1="166" y2="184" gradientUnits="userSpaceOnUse">
        <stop offset="0" :stop-color="p.rimLight" />
        <stop offset="1" :stop-color="p.rimDark" />
      </linearGradient>
      <linearGradient :id="ids.shade" x1="0" x2="0" y1="182" y2="234" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4A3426" stop-opacity="0.14" />
        <stop offset="0.12" stop-color="#4A3426" stop-opacity="0" />
        <stop offset="0.75" stop-color="#4A3426" stop-opacity="0" />
        <stop offset="1" stop-color="#4A3426" stop-opacity="0.12" />
      </linearGradient>
      <radialGradient :id="ids.soil" cx="0.45" cy="0.35" r="0.7">
        <stop offset="0" :stop-color="wet ? '#6B4D3A' : '#8A6A53'" />
        <stop offset="1" :stop-color="wet ? '#4F3729' : '#6C503D'" />
      </radialGradient>
      <clipPath :id="ids.clip"><path :d="BODY" /></clipPath>
    </defs>

    <!-- body -->
    <path :d="BODY" :fill="`url(#${ids.body})`" />

    <!-- glaze & patterns, clipped to the pot -->
    <g :clip-path="`url(#${ids.clip})`">
      <g v-if="pot === 'cream'" :stroke="p.accent" stroke-linecap="round" opacity="0.75">
        <path d="M60 212 L140 212" stroke-width="2.4" />
        <path d="M60 218 L140 218" stroke-width="1.2" />
      </g>
      <g v-else-if="pot === 'honey'" :fill="p.accent" opacity="0.7">
        <rect x="55" y="193" width="90" height="4.5" />
        <rect x="55" y="207" width="90" height="4.5" />
        <rect x="55" y="221" width="90" height="4.5" />
      </g>
      <g v-else-if="pot === 'sage' || pot === 'blush'">
        <circle v-for="([x, y, r], i) in speckles" :key="i" :cx="x" :cy="y" :r="r" :fill="p.accent" :opacity="pot === 'blush' ? 0.95 : 0.7" />
      </g>
      <path v-else-if="pot === 'drip'" :d="DRIP" :fill="p.accent" />
      <g v-else-if="pot === 'strawberry'" :fill="p.accent">
        <path v-for="([x, y], i) in seeds" :key="i" :d="`M${x} ${y - 1.6} Q${x + 1.2} ${y} ${x} ${y + 1.4} Q${x - 1.2} ${y} ${x} ${y - 1.6}Z`" />
      </g>
      <g v-else-if="pot === 'lilac'" :fill="p.accent">
        <g v-for="([x, y], i) in blooms" :key="i" :transform="`translate(${x} ${y})`">
          <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :transform="`rotate(${a}) translate(0 -2)`" r="1.5" />
          <circle r="1.1" fill="#F1D38A" />
        </g>
      </g>
      <g v-else-if="pot === 'cloud'" :fill="p.accent" opacity="0.9">
        <g v-for="([x, y, k], i) in clouds" :key="i" :transform="`translate(${x} ${y}) scale(${k})`">
          <ellipse cx="0" cy="0" rx="8" ry="3.4" />
          <circle cx="-3" cy="-2.4" r="3.4" />
          <circle cx="2.4" cy="-3" r="4" />
        </g>
      </g>
      <g v-else-if="pot === 'moon'" :fill="p.accent" opacity="0.85">
        <path d="M79 222 a5 5 0 1 0 6 6.5 a4 4 0 1 1 -6 -6.5 z" />
        <circle cx="123" cy="195" r="1.3" />
        <circle cx="128" cy="219" r="1" />
        <circle cx="73" cy="196" r="1.1" />
        <circle cx="96" cy="229" r="0.8" />
        <path d="M113 224 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z" />
      </g>
      <!-- soft shading: shadow under the rim and near the base -->
      <rect x="55" y="182" width="90" height="54" :fill="`url(#${ids.shade})`" />
      <!-- glossy highlight -->
      <path d="M72 190 Q70.5 206 74 224" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity="0.22" />
    </g>

    <!-- rim -->
    <rect x="56" y="166" width="88" height="18" rx="9" :fill="`url(#${ids.rim})`" />
    <rect x="62" y="168.2" width="44" height="2.6" rx="1.3" fill="#fff" opacity="0.32" />

    <!-- soil -->
    <template v-if="soil">
      <ellipse cx="100" cy="169.6" rx="39.5" ry="6.4" fill="#4E3829" opacity="0.55" />
      <ellipse cx="100" cy="170.2" rx="37" ry="5.2" :fill="`url(#${ids.soil})`" class="soil" />
      <circle
        v-for="([x, y, r], i) in crumbs"
        :key="i"
        :cx="x"
        :cy="y"
        :r="r"
        :fill="i % 2 ? '#A3826A' : '#5B4232'"
        opacity="0.6"
      />
      <ellipse v-if="wet" cx="94" cy="169.4" rx="10" ry="1.4" fill="#C9E0E8" opacity="0.35" class="puddle" />
    </template>
  </g>
</template>

<style scoped>
.puddle {
  animation: puddle 6s ease-in forwards;
}
@keyframes puddle {
  0% { opacity: 0.45; }
  100% { opacity: 0; }
}
</style>
