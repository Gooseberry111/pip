<script setup>
// A small picture of any collectible, used in cards and pickers.
import { computed } from 'vue'
import PotArt from './art/PotArt.vue'
import LeafArt from './art/LeafArt.vue'
import FlowerArt from './art/FlowerArt.vue'
import DecorationArt from './art/DecorationArt.vue'
import SceneBackground from './art/SceneBackground.vue'
import { STEM_COLOR } from '@/utils/shapes'

const props = defineProps({
  category: { type: String, required: true },
  id: { type: String, required: true },
})

const viewBox = computed(() =>
  props.id === 'rainbow'
    ? '-37 -36 74 42'
    : ({
      pots: '46 150 108 92',
      leaves: '-34 -40 68 56',
      flowers: '-20 -20 40 40',
      decorations: '-26 -46 52 52',
      backgrounds: '0 0 300 400',
    })[props.category],
)
</script>

<template>
  <svg
    :viewBox="viewBox"
    class="h-full w-full"
    :preserveAspectRatio="category === 'backgrounds' ? 'xMidYMid slice' : 'xMidYMid meet'"
    aria-hidden="true"
  >
    <PotArt v-if="category === 'pots'" :pot="id" />
    <g v-else-if="category === 'leaves'">
      <path d="M0 14 Q-1 -6 0 -24" :stroke="STEM_COLOR" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <g transform="translate(0 -6) rotate(-28)"><LeafArt :variant="id" :length="28" /></g>
      <g transform="translate(0 -14) scale(-1 1) rotate(-36)"><LeafArt :variant="id" :length="24" /></g>
    </g>
    <FlowerArt v-else-if="category === 'flowers'" :flower="id" :bloom="1" :size="1.35" />
    <DecorationArt v-else-if="category === 'decorations'" :decoration="id" :animated="false" />
    <SceneBackground v-else-if="category === 'backgrounds'" :scene="id" />
  </svg>
</template>
