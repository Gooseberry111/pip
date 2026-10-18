<script setup>
// The "who's playing?" card shared by the board and party games: play Pip or friends on one
// phone, how many players, and how tough Pip should be.
import { usePipStore } from '@/stores/pip'
import Pip from '../Pip.vue'

const props = defineProps({
  title: { type: String, required: true },
  blurb: { type: String, default: '' },
  vsPip: { type: Boolean, default: true }, // can you play against Pip?
  minPlayers: { type: Number, default: 2 },
  maxPlayers: { type: Number, default: 2 },
  rewards: { type: Object, default: null }, // { easy, medium, hard }
  extra: { type: Array, default: () => [] }, // [{ id, label, sub }] e.g. board sizes
})
const mode = defineModel('mode', { default: 'pip' }) // pip | friends
const players = defineModel('players', { default: 2 })
const level = defineModel('level', { default: 'medium' })
const option = defineModel('option', { default: null })
const emit = defineEmits(['start'])
const pip = usePipStore()

const LEVELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
</script>

<template>
  <div class="flex flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
    <div class="mx-auto mt-2 flex w-full max-w-sm flex-col gap-5">
      <div class="text-center">
        <slot name="art" />
        <h2 class="mt-2 font-display text-2xl font-semibold text-bark-600">{{ title }}</h2>
        <p v-if="blurb" class="mt-1 text-sm font-medium text-bark-400">{{ blurb }}</p>
      </div>

      <section>
        <p class="eyebrow mb-2">Who’s playing?</p>
        <div class="grid gap-2.5" :class="vsPip ? 'grid-cols-2' : 'grid-cols-1'">
          <button v-if="vsPip" type="button" class="option" :class="{ 'is-on': mode === 'pip' }" data-sound="select" @click="mode = 'pip'">
            <span class="flex items-center gap-2">
              <span class="h-9 w-7"><Pip :growth="pip.growthValue" :droop="0" health="healthy" :pot="pip.currentPot" :leaf="pip.currentLeaf" :flower="pip.currentFlower" :accessory="pip.currentAccessory" :interactive="false" class="h-full w-full" /></span>
              <span class="font-display text-base font-semibold text-bark-600">Play {{ pip.plantName }}</span>
            </span>
            <span class="text-xs font-semibold text-bark-400">You against Pip</span>
          </button>
          <button type="button" class="option" :class="{ 'is-on': mode === 'friends' }" data-sound="select" @click="mode = 'friends'">
            <span class="font-display text-base font-semibold text-bark-600">Play friends</span>
            <span class="text-xs font-semibold text-bark-400">Pass the phone round</span>
          </button>
        </div>
      </section>

      <section v-if="mode === 'friends' && maxPlayers > minPlayers">
        <p class="eyebrow mb-2">How many players?</p>
        <div class="segmented" role="tablist">
          <button v-for="n in maxPlayers - minPlayers + 1" :key="n" type="button" role="tab" class="flex-1" :aria-selected="players === n + minPlayers - 1" @click="players = n + minPlayers - 1">
            {{ n + minPlayers - 1 }} players
          </button>
        </div>
      </section>

      <section v-if="mode === 'pip'">
        <p class="eyebrow mb-2">How tough is {{ pip.plantName }}?</p>
        <div class="segmented" role="tablist">
          <button v-for="(l, id) in LEVELS" :key="id" type="button" role="tab" class="flex-1" :aria-selected="level === id" @click="level = id">{{ l }}</button>
        </div>
        <p v-if="rewards" class="mt-2 text-xs font-semibold text-bark-400">
          Beat {{ pip.plantName }} for <b class="text-petal-500">{{ rewards[level] }} petals</b>.
        </p>
      </section>

      <section v-if="extra.length">
        <p class="eyebrow mb-2">Board</p>
        <div class="grid gap-2.5" :style="{ gridTemplateColumns: `repeat(${extra.length}, minmax(0, 1fr))` }">
          <button v-for="x in extra" :key="x.id" type="button" class="option" :class="{ 'is-on': option === x.id }" data-sound="select" @click="option = x.id">
            <span class="font-display text-base font-semibold text-bark-600">{{ x.label }}</span>
            <span class="text-xs font-semibold text-bark-400">{{ x.sub }}</span>
          </button>
        </div>
      </section>

      <slot />
      <button type="button" class="btn btn-primary w-full" @click="emit('start')">Start</button>
    </div>
  </div>
</template>

<style scoped>
.option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.85rem 1rem;
  border-radius: 1.25rem;
  border: 1.5px solid var(--color-line);
  background: var(--color-surface);
  text-align: left;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.option.is-on {
  border-color: var(--color-leaf-400);
  background: #f3f8ee;
}
</style>
