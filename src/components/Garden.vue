<script setup>
// Pip's little home: a background scene, decorations and Pip, layered together.
// Decorations are tappable and each has its own small reaction.
import { computed, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Pip from './Pip.vue'
import SceneBackground from './art/SceneBackground.vue'
import DecorationArt from './art/DecorationArt.vue'

const pip = usePipStore()
const pipRef = ref(null)
const pokes = ref({})

function onTapPip() {
  pipRef.value?.react('wiggle')
  playSound('boop', pip.soundOn)
  haptic('light')
}

function onPetPip() {
  pipRef.value?.react('pet')
}

function poke(id) {
  pokes.value = { ...pokes.value, [id]: (pokes.value[id] ?? 0) + 1 }
  playSound('boop', pip.soundOn)
  haptic('light')
}

// Decorations in the 300 x 400 scene. Ground items take the free spots either side of the pot.
const GROUND_SLOTS = [250, 50, 92]
const LOOK = {
  pebbles: { scale: 1.4, front: true },
  mushroom: { scale: 1.25, front: true },
  lantern: { scale: 1.3, front: false },
  teacup: { scale: 1.3, front: true },
  snail: { scale: 1.2, front: true },
  bunny: { scale: 1.35, front: true },
  kitty: { scale: 1.3, front: true },
  starjar: { scale: 1.3, front: false },
}

const decorations = computed(() => {
  let slot = 0
  return pip.currentDecorations.map((id) => {
    if (id === 'butterfly') return { id, x: 214, y: 168, scale: 1.2, front: false, float: true }
    if (id === 'rainbow') return { id, x: 150, y: 118, scale: 1.6, front: false }
    return { id, x: GROUND_SLOTS[slot++ % GROUND_SLOTS.length], y: 334, ...(LOOK[id] ?? { scale: 1.3, front: true }) }
  })
})
</script>

<template>
  <div class="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] shadow-soft">
    <svg viewBox="0 0 300 400" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <SceneBackground :scene="pip.currentBackground" />
      <g
        v-for="deco in decorations.filter((d) => !d.front)"
        :key="deco.id"
        :transform="`translate(${deco.x} ${deco.y}) scale(${deco.scale})`"
        class="cursor-pointer"
        @click="poke(deco.id)"
      >
        <g :class="{ 'garden-float': deco.float }">
          <DecorationArt :decoration="deco.id" :poke="pokes[deco.id] ?? 0" />
        </g>
      </g>
    </svg>

    <!-- Pip sits on the ground line (y = 330 of 400) -->
    <div class="absolute left-1/2 w-[52%] -translate-x-1/2" style="bottom: 14.5%">
      <div class="aspect-[200/250]">
        <Pip
          ref="pipRef"
          :growth="pip.growthValue"
          :droop="pip.droop"
          :health="pip.health"
          :pot="pip.currentPot"
          :leaf="pip.currentLeaf"
          :flower="pip.currentFlower"
          :accessory="pip.currentAccessory"
          @tap="onTapPip"
          @pet="onPetPip"
        />
      </div>
    </div>

    <svg viewBox="0 0 300 400" class="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g
        v-for="deco in decorations.filter((d) => d.front)"
        :key="deco.id"
        :transform="`translate(${deco.x} ${deco.y}) scale(${deco.scale})`"
        class="pointer-events-auto cursor-pointer"
        @click="poke(deco.id)"
      >
        <DecorationArt :decoration="deco.id" :poke="pokes[deco.id] ?? 0" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.garden-float {
  animation: float 9s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(-4deg); }
  25% { transform: translate(-16px, -10px) rotate(3deg); }
  50% { transform: translate(-30px, 4px) rotate(-2deg); }
  75% { transform: translate(-12px, 12px) rotate(4deg); }
}
@media (prefers-reduced-motion: reduce) {
  .garden-float {
    animation: none;
  }
}
</style>
