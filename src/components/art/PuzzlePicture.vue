<script setup>
// The picture for Bloom Puzzle, on a 300 x 300 canvas: a scene with a potted plant in
// bloom and plenty of little details, so most tiles have something to recognise.
import { computed } from 'vue'
import SceneBackground from './SceneBackground.vue'
import PotArt from './PotArt.vue'
import LeafArt from './LeafArt.vue'
import FlowerArt from './FlowerArt.vue'
import DecorationArt from './DecorationArt.vue'

const props = defineProps({
  picture: { type: String, default: 'meadow' },
})

const LOOKS = {
  meadow: { pot: 'honey', leaf: 'round', flower: 'daisy', deco: ['mushroom', 'butterfly'] },
  sunset: { pot: 'terracotta', leaf: 'classic', flower: 'poppy', deco: ['lantern', 'pebbles'] },
  spring: { pot: 'blush', leaf: 'heart', flower: 'blossom', deco: ['bunny', 'butterfly'] },
  windowsill: { pot: 'cream', leaf: 'variegated', flower: 'tulip', deco: ['teacup', 'kitty'] },
  night: { pot: 'moon', leaf: 'starlight', flower: 'sunny', deco: ['starjar', 'snail'] },
  rainy: { pot: 'drip', leaf: 'rosy', flower: 'blossom', deco: ['lantern', 'mushroom'] },
}

const look = computed(() => LOOKS[props.picture] ?? LOOKS.meadow)

const LEAVES = [
  { y: -18, side: 1, angle: -20, len: 34 },
  { y: -30, side: -1, angle: -26, len: 32 },
  { y: -46, side: 1, angle: -32, len: 28 },
  { y: -58, side: -1, angle: -36, len: 26 },
  { y: -72, side: 1, angle: -46, len: 22 },
  { y: -72, side: -1, angle: -46, len: 22 },
]
</script>

<template>
  <g>
    <!-- the scene, cropped to its lower part -->
    <g transform="translate(0 -95)">
      <SceneBackground :scene="picture" />
    </g>

    <!-- a few extra details so every corner has something in it -->
    <g v-if="picture !== 'night'" fill="#fff" opacity="0.9">
      <ellipse cx="52" cy="38" rx="26" ry="8" /><circle cx="44" cy="32" r="9" /><circle cx="58" cy="30" r="10" />
      <ellipse cx="246" cy="64" rx="20" ry="6" /><circle cx="240" cy="59" r="8" />
    </g>
    <g v-if="picture !== 'night'" stroke="#7D6B5B" stroke-width="1.6" fill="none" stroke-linecap="round">
      <path d="M140 30 q4 -4 8 0 q4 -4 8 0" />
      <path d="M176 46 q3 -3 6 0 q3 -3 6 0" />
    </g>
    <g v-else fill="#F6EEDB">
      <circle v-for="([x, y], i) in [[30, 30], [90, 60], [140, 20], [200, 50], [270, 30], [60, 110], [250, 120], [170, 90]]" :key="i" :cx="x" :cy="y" r="1.6" />
    </g>
    <g>
      <g v-for="([x, c], i) in [[28, '#F3BCC2'], [62, '#F6D274'], [236, '#F3BCC2'], [272, '#FFFDF7']]" :key="`f${i}`" :transform="`translate(${x} 276)`">
        <path d="M0 18 V2" stroke="#79A066" stroke-width="2" />
        <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :transform="`rotate(${a}) translate(0 -5)`" r="4" :fill="c" />
        <circle r="3" fill="#F2C66B" />
      </g>
    </g>

    <!-- decorations either side -->
    <g :transform="`translate(56 238) scale(1.25)`"><DecorationArt :decoration="look.deco[0]" :animated="false" /></g>
    <g :transform="`translate(248 ${look.deco[1] === 'butterfly' ? 120 : 238}) scale(1.25)`"><DecorationArt :decoration="look.deco[1]" :animated="false" /></g>

    <!-- the plant in its pot -->
    <g transform="translate(23 -48) scale(1.27)">
      <PotArt :pot="look.pot" />
      <g transform="translate(100 171)">
        <path d="M0 0 Q -4 -40 0 -86" stroke="#6F9A5E" stroke-width="4" stroke-linecap="round" fill="none" />
        <g v-for="(l, i) in LEAVES" :key="i" :transform="`translate(${i % 2 ? -1 : 1} ${l.y}) scale(${l.side} 1) rotate(${l.angle})`">
          <LeafArt :variant="look.leaf" :length="l.len" />
        </g>
        <g transform="translate(0 -90)"><FlowerArt :flower="look.flower" :bloom="1" :size="1.6" /></g>
        <g transform="translate(-26 -60) rotate(-20)"><FlowerArt :flower="look.flower" :bloom="1" :size="0.8" /></g>
        <g transform="translate(26 -52) rotate(18)"><FlowerArt :flower="look.flower" :bloom="1" :size="0.75" /></g>
      </g>
      <!-- Pip's happy face on the pot -->
      <g transform="translate(100 207)" fill="#47352A">
        <ellipse cx="-14" cy="-1" rx="4.5" ry="5" />
        <ellipse cx="14" cy="-1" rx="4.5" ry="5" />
        <circle cx="-12.4" cy="-3" r="1.7" fill="#fff" />
        <circle cx="15.6" cy="-3" r="1.7" fill="#fff" />
        <path d="M-4.2 6.6 Q0 10.4 4.2 6.6" stroke="#47352A" stroke-width="1.9" fill="none" stroke-linecap="round" />
        <ellipse cx="-24" cy="6.5" rx="6" ry="3.5" fill="#F09A8A" opacity="0.5" />
        <ellipse cx="24" cy="6.5" rx="6" ry="3.5" fill="#F09A8A" opacity="0.5" />
      </g>
    </g>
  </g>
</template>
