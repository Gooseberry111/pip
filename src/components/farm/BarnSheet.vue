<script setup>
// The barn: everything you've grown, collected and cooked. Sell it at the market,
// or give something to Pip as a treat.
import { computed, ref } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { GOODS, BARN_LEVELS } from '@/data/farm'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'
import PetalIcon from '../PetalIcon.vue'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'sold', 'fed', 'upgrade'])

const farm = useFarmStore()
const pip = usePipStore()
const picked = ref(null)

const KIND_ORDER = { dish: 0, product: 1, fruit: 2, crop: 3 }
const items = computed(() =>
  Object.entries(farm.state.barn)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ ...GOODS[id], count: n }))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.sell - a.sell),
)
const chosen = computed(() => items.value.find((i) => i.id === picked.value) ?? null)
const nextBarn = computed(() => BARN_LEVELS[farm.state.barnLevel + 1] ?? null)
const fill = computed(() => Math.min(1, farm.barnUsed / farm.barnCapacity))

function sell(n) {
  const id = picked.value
  const petals = farm.sell(id, n)
  if (petals) emit('sold', { id, petals })
  if (!farm.state.barn[id]) picked.value = null
}

function feed() {
  const id = picked.value
  const r = farm.feedPip(id)
  if (r) emit('fed', { id, ...r })
  if (!farm.state.barn[id]) picked.value = null
}
</script>

<template>
  <BottomSheet :open="open" title="The barn" :eyebrow="`${farm.barnUsed} of ${farm.barnCapacity} spaces`" @close="emit('close')">
    <div class="h-2 overflow-hidden rounded-full bg-sand-100">
      <div class="h-full rounded-full transition-[width] duration-500" :class="fill >= 1 ? 'bg-clay-300' : 'bg-leaf-400'" :style="{ width: `${fill * 100}%` }" />
    </div>
    <div class="mt-2 flex items-center justify-between text-xs font-semibold text-bark-400">
      <span>{{ fill >= 1 ? 'The barn is full. Sell or cook to make room.' : 'Tap something to sell it or give it to Pip.' }}</span>
      <button v-if="nextBarn" type="button" class="shrink-0 font-bold text-leaf-500" @click="emit('upgrade')">Bigger barn</button>
    </div>

    <p v-if="!items.length" class="mt-6 rounded-2xl bg-cream p-5 text-center text-sm font-semibold text-bark-400">
      Nothing here yet. Plant something, then harvest it to fill the barn.
    </p>

    <div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition"
        :class="picked === item.id ? 'border-leaf-400 bg-leaf-200/50 ring-2 ring-leaf-300/60' : 'border-line bg-cream'"
        :aria-label="`${item.name}, ${item.count}`"
        @click="picked = picked === item.id ? null : item.id"
      >
        <GoodIcon :id="item.id" :size="30" />
        <span class="absolute bottom-1 right-1.5 text-xs font-extrabold tabular-nums text-bark-600">{{ item.count }}</span>
      </button>
    </div>

    <Transition name="pop">
      <div v-if="chosen" class="sticky bottom-0 mt-4 rounded-2xl border border-line bg-surface p-3 shadow-float">
        <div class="flex items-center gap-3">
          <GoodIcon :id="chosen.id" :size="34" />
          <div class="min-w-0 flex-1">
            <p class="font-display text-base font-semibold text-bark-600">{{ chosen.name }} <span class="text-bark-400">× {{ chosen.count }}</span></p>
            <p class="text-xs font-semibold text-bark-400">Sells for {{ chosen.sell }} each{{ chosen.kind === 'dish' ? ' · Pip’s favourite kind of treat' : '' }}</p>
          </div>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2">
          <button type="button" class="btn btn-secondary btn-sm gap-1!" data-sound="petals" @click="sell(1)">Sell 1 <PetalIcon :size="14" />{{ chosen.sell }}</button>
          <button type="button" class="btn btn-secondary btn-sm gap-1!" data-sound="petals" @click="sell(chosen.count)">All <PetalIcon :size="14" />{{ chosen.sell * chosen.count }}</button>
          <button type="button" class="btn btn-primary btn-sm" data-sound="none" @click="feed">Give {{ pip.plantName }}</button>
        </div>
      </div>
    </Transition>
  </BottomSheet>
</template>

<style scoped>
.pop-enter-active {
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
