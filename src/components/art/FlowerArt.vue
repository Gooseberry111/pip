<script setup>
// A flower centred on (0, 0). `bloom` goes from a closed bud (0) to fully open (1).
import { computed, useId } from 'vue'

const props = defineProps({
  flower: { type: String, default: 'daisy' },
  bloom: { type: Number, default: 1 },
  size: { type: Number, default: 1 },
})

const FLOWERS = {
  daisy: { petals: 11, tip: '#FFFDF7', base: '#EFE3CD', center: '#F3C76C', centerDark: '#DFA24A', w: 3.3, len: 10 },
  blossom: { petals: 5, tip: '#F9D3D6', base: '#E89DA8', center: '#F8E2A6', centerDark: '#E7B96A', w: 6.6, len: 8.6, round: true },
  sunny: { petals: 13, tip: '#F8D97E', base: '#E7AA45', center: '#94694A', centerDark: '#6F4C35', w: 3, len: 10 },
  poppy: { petals: 5, tip: '#F6A48D', base: '#DF6650', center: '#5B4636', centerDark: '#3E2F25', w: 7.4, len: 8.6, round: true },
  tulip: { tip: '#F6B4A6', base: '#E58876', center: '#F6B4A6', centerDark: '#E58876' },
  violet: { petals: 5, tip: '#C9B2E6', base: '#8F6FC2', center: '#F8E2A6', centerDark: '#E7B96A', w: 6.4, len: 8, round: true },
  cornflower: { petals: 9, tip: '#A9C8F0', base: '#5B86D4', center: '#4A5A84', centerDark: '#384669', w: 3.6, len: 10 },
  peony: { petals: 8, tip: '#FBDDE3', base: '#EFA3B4', center: '#F9E6B8', centerDark: '#EFC97D', w: 6.2, len: 9, round: true },
}

const f = computed(() => FLOWERS[props.flower] ?? FLOWERS.daisy)
const open = computed(() => Math.max(0, (props.bloom - 0.3) / 0.7))
const isBud = computed(() => props.bloom < 0.3)
const angles = computed(() => Array.from({ length: f.value.petals ?? 0 }, (_, i) => (360 / f.value.petals) * i))

const petalPath = computed(() => {
  const { w, len, round } = f.value
  const L = len * (0.6 + open.value * 0.4)
  if (round) return `M0 0 C ${-w} ${-L * 0.3} ${-w * 1.05} ${-L} 0 ${-L * 1.02} C ${w * 1.05} ${-L} ${w} ${-L * 0.3} 0 0Z`
  return `M0 0 C ${-w} ${-L * 0.35} ${-w * 0.8} ${-L} 0 ${-L * 1.05} C ${w * 0.8} ${-L} ${w} ${-L * 0.35} 0 0Z`
})

const uid = useId()
const petalId = `${uid}-petal`
const centerId = `${uid}-center`
const centerDots = [[-1.6, -1.2], [1.4, -1.5], [0, 1.6], [-1.9, 1], [1.9, 0.9], [0, -2.4]]
</script>

<template>
  <g :transform="`scale(${size})`">
    <defs>
      <radialGradient :id="petalId" cx="0.5" cy="1" r="1" fx="0.5" fy="1">
        <stop offset="0" :stop-color="f.base" />
        <stop offset="0.6" :stop-color="f.tip" />
      </radialGradient>
      <radialGradient :id="centerId" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" :stop-color="f.center" />
        <stop offset="1" :stop-color="f.centerDark" />
      </radialGradient>
    </defs>

    <!-- bud -->
    <g v-if="isBud" :transform="`scale(${0.6 + bloom * 1.3})`">
      <ellipse cx="0" cy="-1.5" rx="4.2" ry="6.2" :fill="f.base" />
      <ellipse cx="-1" cy="-2.5" rx="1.6" ry="3.2" :fill="f.tip" opacity="0.7" />
      <path d="M-4.8 0 Q-4.2 5.8 0 6.2 Q4.2 5.8 4.8 0 Q2.4 2.8 0 2.4 Q-2.4 2.8 -4.8 0Z" fill="#7FA76B" />
      <path d="M-4.8 0 Q-3 -3 -1.5 -4.5 Q-2.5 -1 -1 1Z" fill="#8DB07A" />
    </g>

    <!-- tulip: a little cup -->
    <g v-else-if="flower === 'tulip'" :transform="`scale(${0.7 + open * 0.35})`">
      <path d="M-1 -2 C -3 -10 -2 -15 0 -16 C 2 -15 3 -10 1 -2Z" :fill="f.base" />
      <path :d="`M0 2 C ${-9 - open * 2} 0 ${-9 - open * 2} -10 ${-5 - open * 2} -15 C -3 -10 -1 -6 0 2Z`" :fill="`url(#${petalId})`" />
      <path :d="`M0 2 C ${9 + open * 2} 0 ${9 + open * 2} -10 ${5 + open * 2} -15 C 3 -10 1 -6 0 2Z`" :fill="f.base" opacity="0.92" />
      <path d="M0 2 C -5 0 -5 -9 0 -13 C 5 -9 5 0 0 2Z" :fill="`url(#${petalId})`" />
      <path d="M-1.5 -2 Q-2.5 -6 -1 -10" stroke="#fff" stroke-width="1" fill="none" opacity="0.4" stroke-linecap="round" />
    </g>

    <!-- open flower -->
    <g v-else :transform="`scale(${0.45 + open * 0.55})`">
      <path
        v-for="a in angles"
        :key="a"
        :d="petalPath"
        :transform="`rotate(${a})`"
        :fill="`url(#${petalId})`"
        :stroke="f.base"
        stroke-width="0.4"
        stroke-opacity="0.5"
      />
      <circle r="4.8" :fill="`url(#${centerId})`" />
      <circle v-for="([x, y], i) in centerDots" :key="i" :cx="x" :cy="y" r="0.5" :fill="f.centerDark" opacity="0.7" />
      <circle cx="-1.4" cy="-1.6" r="1.3" fill="#fff" opacity="0.35" />
    </g>
  </g>
</template>
