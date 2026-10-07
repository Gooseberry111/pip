<script setup>
// The farm kitchen: turn produce into dishes. Dishes sell for more, fill the fanciest
// orders, and make the best treats for Pip. More stoves can be bought in the shop.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { RECIPES, GOODS, KITCHEN_SLOTS } from '@/data/farm'
import { recipeById, formatLeft, formatMinutes, growthFraction, hasAll } from '@/utils/farmLogic'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'
import Icon from '../Icon.vue'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'cooked', 'collected', 'upgrade'])

const farm = useFarmStore()
const now = computed(() => farm.now)
const freeSlot = computed(() => farm.state.kitchen.findIndex((k) => !k))
const nextStove = computed(() => KITCHEN_SLOTS[farm.state.kitchenLevel + 1] ?? null)

const recipes = computed(() =>
  RECIPES.map((r) => ({ ...r, locked: r.level > farm.state.level, can: hasAll(farm.state.barn, r.needs), made: farm.state.almanac[r.id] ?? 0 })).sort(
    (a, b) => Number(a.locked) - Number(b.locked) || Number(b.can) - Number(a.can) || a.level - b.level,
  ),
)

function cook(id) {
  const r = farm.cook(freeSlot.value, id)
  if (r.ok) emit('cooked', id)
}

function collect(i) {
  const r = farm.collectDish(i)
  if (r) emit('collected', r)
}
</script>

<template>
  <BottomSheet :open="open" title="The kitchen" eyebrow="Cook something lovely" @close="emit('close')">
    <!-- the stoves -->
    <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${farm.state.kitchen.length + (nextStove ? 1 : 0)}, minmax(0, 1fr))` }">
      <div v-for="(k, i) in farm.state.kitchen" :key="i" class="relative flex min-h-24 flex-col items-center justify-center rounded-2xl border border-line bg-cream p-2 text-center">
        <template v-if="k">
          <GoodIcon :id="k.recipe" :size="34" />
          <template v-if="now >= k.readyAt">
            <button type="button" class="btn btn-primary btn-sm mt-1.5 h-8! px-3!" data-sound="none" @click="collect(i)">Collect</button>
          </template>
          <template v-else>
            <p class="mt-1 text-xs font-extrabold tabular-nums text-bark-500">{{ formatLeft(k.readyAt - now) }}</p>
            <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
              <div class="h-full rounded-full bg-honey-400" :style="{ width: `${growthFraction(k.startedAt, k.readyAt, now) * 100}%` }" />
            </div>
          </template>
        </template>
        <template v-else>
          <span class="text-2xl">🍳</span>
          <p class="mt-1 text-xs font-bold text-bark-400">Free stove</p>
        </template>
      </div>
      <button v-if="nextStove" type="button" class="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-dashed border-sand-300 p-2 text-center text-xs font-bold text-bark-400" @click="emit('upgrade')">
        <Icon name="lock" :size="16" />
        <span class="mt-1">Another stove in the shop</span>
      </button>
    </div>

    <h3 class="eyebrow mt-5">Recipes</h3>
    <ul class="mt-2 space-y-2">
      <li v-for="r in recipes" :key="r.id" class="rounded-2xl border border-line p-3" :class="r.locked ? 'bg-sand-100/60 opacity-70' : 'bg-surface'">
        <div class="flex items-center gap-3">
          <GoodIcon :id="r.id" :size="34" />
          <div class="min-w-0 flex-1">
            <p class="font-display text-base font-semibold leading-tight text-bark-600">
              {{ r.name }}
              <span v-if="r.made" class="ml-1 align-middle text-[0.625rem] font-extrabold uppercase tracking-wider text-leaf-500">Made {{ r.made }}</span>
            </p>
            <p class="text-xs font-semibold text-bark-400">
              <template v-if="r.locked"><Icon name="lock" :size="11" class="-mt-0.5 inline" /> Farm level {{ r.level }}</template>
              <template v-else>{{ formatMinutes(r.minutes) }} · sells {{ r.sell }} · treat +{{ r.treat }} growth</template>
            </p>
          </div>
          <button
            v-if="!r.locked"
            type="button"
            class="btn btn-primary btn-sm h-8! shrink-0 px-3!"
            :disabled="!r.can || freeSlot < 0"
            @click="cook(r.id)"
          >
            Cook
          </button>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="(n, id) in r.needs"
            :key="id"
            class="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-xs font-bold"
            :class="(farm.state.barn[id] ?? 0) >= n ? 'text-bark-600' : 'text-clay-400'"
            :title="GOODS[id].name"
          >
            <GoodIcon :id="id" :size="16" /> {{ farm.state.barn[id] ?? 0 }}/{{ n }}
          </span>
        </div>
      </li>
    </ul>
  </BottomSheet>
</template>
