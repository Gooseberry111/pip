<script setup>
// Build mode's drawer: everything you can put on the farm, by kind. Things you own are free
// to place; anything else is bought as you place it. Pick one and a preview appears on the farm.
import { computed, ref, watch } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { TREES, PRODUCERS, DECOR, PLACEABLE } from '@/data/farm'
import { sizeOf } from '@/utils/farmLogic'
import { haptic } from '@/utils/haptics'
import FarmArt from './FarmArt.vue'
import PetalIcon from '../PetalIcon.vue'
import Icon from '../Icon.vue'

const props = defineProps({
  ghost: { type: Object, default: null }, // what's being placed
  season: { type: String, default: 'summer' },
})
const emit = defineEmits(['pick', 'done'])

const farm = useFarmStore()
const pip = usePipStore()
const level = computed(() => farm.state.level)

const inventory = computed(() =>
  Object.entries(farm.state.inventory)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => ({ id: type, n })),
)

const inSeason = (d) => !d.season || d.season === props.season
const TABS = computed(() => [
  { id: 'yours', label: 'Yours', count: inventory.value.reduce((s, i) => s + i.n, 0) },
  { id: 'plots', label: 'Plots' },
  { id: 'trees', label: 'Trees' },
  { id: 'animals', label: 'Animals' },
  { id: 'decor', label: 'Decor' },
  { id: 'fences', label: 'Fences' },
  { id: 'paths', label: 'Paths' },
])
const tab = ref(inventory.value.length ? 'yours' : 'plots')

const items = computed(() => {
  switch (tab.value) {
    case 'yours': return inventory.value
    case 'plots': return [{ id: 'plot' }]
    case 'trees': return TREES
    case 'animals': return [...PRODUCERS, ...DECOR.filter((d) => d.cat === 'animal')]
    case 'decor': return DECOR.filter((d) => d.cat === 'decor' && !d.special && inSeason(d))
    case 'fences': return DECOR.filter((d) => d.cat === 'fence')
    case 'paths': return DECOR.filter((d) => d.cat === 'path')
    default: return []
  }
})

function info(type) {
  const owned = farm.state.inventory[type] ?? 0
  const p = PLACEABLE[type] ?? {}
  const deal = farm.deal && farm.deal.type === type && !farm.deal.bought ? farm.deal : null
  const price = owned ? 0 : deal ? deal.price : farm.priceOf(type)
  const locked = !owned && p.level > level.value
  const soldOut = !owned && !locked && price === null
  return { owned, price, deal, locked, soldOut, level: p.level, name: p.name ?? type, afford: owned || (price !== null && pip.petals >= price) }
}

function pick(type) {
  const i = info(type)
  if (i.locked || i.soldOut) {
    haptic('light')
    return
  }
  emit('pick', type)
}

// art fits a square tile whatever its footprint
function artBox(type) {
  const { w, h } = sizeOf(type)
  if (PLACEABLE[type]?.flat || type === 'plot') {
    // flat things have nothing above the ground, so show just their tiles
    const size = Math.max(w, h) * 40 + 8
    return `${(w * 40 - size) / 2} ${(h * 40 - size) / 2} ${size} ${size}`
  }
  const size = Math.max(w, h + 1) * 40
  return `${(w * 40 - size) / 2} ${-40 + ((h + 1) * 40 - size) / 2} ${size} ${size}`
}

const ghostInfo = computed(() => (props.ghost ? info(props.ghost.type) : null))
watch(inventory, (inv) => {
  if (tab.value === 'yours' && !inv.length) tab.value = 'decor'
})
</script>

<template>
  <div class="drawer rounded-[1.75rem] border border-line bg-surface/95 shadow-float backdrop-blur-xl">
    <!-- placing something -->
    <div v-if="ghost" class="flex items-center gap-3 p-3">
      <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf-200/60">
        <svg :viewBox="artBox(ghost.type)" class="h-11 w-11 overflow-visible"><FarmArt :type="ghost.type" /></svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate font-display text-base font-semibold text-bark-600">{{ ghostInfo.name }}</p>
        <p class="text-xs font-semibold text-bark-400">
          <template v-if="ghostInfo.owned">Yours to place, free</template>
          <template v-else-if="ghostInfo.price != null">
            <span class="inline-flex items-center gap-0.5 font-extrabold" :class="ghostInfo.afford ? 'text-petal-500' : 'text-clay-400'"><PetalIcon :size="13" />{{ ghostInfo.price }}</span>
            when you place it
          </template>
        </p>
        <p class="mt-0.5 text-[0.6875rem] font-semibold text-bark-300">Drag it or tap a spot, then tap the tick.</p>
      </div>
    </div>

    <!-- the catalogue -->
    <template v-else>
      <div class="flex items-center gap-2 px-3 pt-3">
        <div class="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            class="tab"
            :class="{ 'is-on': tab === t.id }"
            :aria-pressed="tab === t.id"
            @click="tab = t.id"
          >
            {{ t.label }}<span v-if="t.count" class="count">{{ t.count }}</span>
          </button>
        </div>
        <button type="button" class="done" data-sound="toggleOff" @click="emit('done')">Done</button>
      </div>

      <div class="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3 pt-2.5">
        <p v-if="!items.length" class="py-6 text-sm font-semibold text-bark-400">Nothing put away. Things you store from the farm wait here.</p>
        <button
          v-for="it in items"
          :key="it.id"
          type="button"
          class="card-item"
          :class="{ 'is-locked': info(it.id).locked || info(it.id).soldOut, 'is-poor': !info(it.id).afford && !info(it.id).locked }"
          :aria-label="info(it.id).name"
          data-sound="select"
          @click="pick(it.id)"
        >
          <span v-if="info(it.id).deal" class="tag deal">Deal</span>
          <span v-else-if="PLACEABLE[it.id]?.season" class="tag season">Seasonal</span>
          <span class="art">
            <svg :viewBox="artBox(it.id)" class="h-12 w-12 overflow-visible"><FarmArt :type="it.id" /></svg>
            <span v-if="info(it.id).locked" class="lock"><Icon name="lock" :size="16" :stroke="2.2" /></span>
          </span>
          <span class="name">{{ info(it.id).name }}</span>
          <span v-if="info(it.id).owned" class="price owned">×{{ info(it.id).owned }}</span>
          <span v-else-if="info(it.id).locked" class="price">Level {{ info(it.id).level }}</span>
          <span v-else-if="info(it.id).soldOut" class="price">All built</span>
          <span v-else class="price"><PetalIcon :size="12" />{{ info(it.id).price }}<s v-if="info(it.id).deal" class="ml-0.5 opacity-50">{{ info(it.id).deal.was }}</s></span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.8rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-bark-400);
  background: var(--color-sand-100);
  transition: background-color 0.2s ease, color 0.2s ease;
}
.tab.is-on {
  background: var(--color-bark-600);
  color: #fffaf2;
}
.count {
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: var(--color-clay-300);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 800;
  line-height: 1.1rem;
}
.done {
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  background: var(--color-leaf-400);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 800;
}
.card-item {
  position: relative;
  display: flex;
  width: 5.5rem;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.5rem 0.35rem 0.45rem;
  border-radius: 1.1rem;
  border: 1px solid var(--color-line);
  background: var(--color-cream);
  transition: transform 0.15s ease;
}
.card-item:active {
  transform: scale(0.95);
}
.art {
  position: relative;
  display: flex;
  height: 3.25rem;
  width: 3.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.9rem;
  background: radial-gradient(circle at 50% 70%, #dbe8cf 0%, transparent 70%);
}
.name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--color-bark-600);
}
.price {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.6875rem;
  font-weight: 800;
  color: var(--color-petal-500);
}
.price.owned {
  color: var(--color-leaf-500);
}
.is-poor .price {
  color: var(--color-bark-300);
}
.is-locked .art svg {
  filter: grayscale(1);
  opacity: 0.4;
}
.is-locked .price,
.is-locked .name {
  color: var(--color-bark-300);
}
.lock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-bark-500);
}
.tag {
  position: absolute;
  top: -0.35rem;
  right: -0.2rem;
  z-index: 1;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  font-size: 0.5625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
}
.tag.deal {
  background: var(--color-clay-400);
}
.tag.season {
  background: var(--color-water-400);
}
</style>
