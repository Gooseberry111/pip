<script setup>
// Two farm collections: everything you've grown or gathered, and every dish you've cooked.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { GOODS, RECIPES } from '@/data/farm'
import GoodIcon from './GoodIcon.vue'

const props = defineProps({
  kind: { type: String, default: 'harvest' }, // harvest | recipes
})

const farm = useFarmStore()

const entries = computed(() => {
  const list = props.kind === 'recipes' ? RECIPES.map((r) => GOODS[r.id]) : Object.values(GOODS).filter((g) => g.kind !== 'dish')
  return list
    .map((g) => ({ ...g, count: farm.state.almanac[g.id] ?? 0 }))
    .sort((a, b) => a.level - b.level)
})
const found = computed(() => entries.value.filter((e) => e.count > 0).length)
</script>

<template>
  <div>
    <p class="mt-4 text-[0.8125rem] font-medium text-bark-400">
      {{ kind === 'recipes' ? 'Every dish you’ve cooked in the farm kitchen.' : 'Everything you’ve grown, picked and gathered on the farm.' }}
      <b class="text-bark-600">{{ found }} / {{ entries.length }}</b> found.
    </p>
    <div class="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      <div
        v-for="(e, i) in entries"
        :key="e.id"
        class="stagger flex flex-col items-center rounded-[1.25rem] p-2.5 text-center"
        :class="e.count ? 'card' : 'border border-dashed border-sand-300 bg-sand-100/50'"
        :style="{ animationDelay: `${i * 25}ms` }"
      >
        <span class="flex aspect-square w-full items-center justify-center rounded-2xl" :class="e.count ? 'bg-cream' : ''">
          <span :class="{ silhouette: !e.count }"><GoodIcon :id="e.id" :size="38" /></span>
        </span>
        <p class="mt-1.5 text-[0.8125rem] font-bold leading-tight" :class="e.count ? 'text-bark-600' : 'text-bark-300'">{{ e.count ? e.name : '???' }}</p>
        <p class="text-[0.6875rem] font-semibold text-bark-400">
          {{ e.count ? (kind === 'recipes' ? `Cooked ${e.count}` : `Picked ${e.count}`) : `Farm level ${e.level}` }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.silhouette {
  filter: grayscale(1) brightness(0.6);
  opacity: 0.35;
}
.stagger {
  animation: rise 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
</style>
