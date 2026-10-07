<script setup>
// This week among your neighbours: harvests, orders and game stars.
import { computed, ref, watch } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { weekKey } from '@/data/weekly'
import { fetchBoard } from '@/services/farmShare'

const props = defineProps({ open: { type: Boolean, default: false } })

const farm = useFarmStore()
const pip = usePipStore()
const metric = ref('harvests')
const others = ref(null)

const METRICS = [
  { id: 'harvests', label: 'Harvests' },
  { id: 'orders', label: 'Orders' },
  { id: 'stars', label: 'Game stars' },
]

watch(
  () => props.open,
  async (open) => {
    if (!open || !farm.state.neighbours.length) return
    const r = await fetchBoard(farm.state.neighbours.map((n) => n.code))
    others.value = r.ok ? r.farms : []
  },
  { immediate: true },
)

const rows = computed(() => {
  const week = weekKey()
  const me = { code: farm.state.code, name: farm.name, plant: pip.plantName, me: true, week: farm.weekStats() }
  const list = [me, ...(others.value ?? [])].map((f) => {
    // stars count all time; harvests and orders only this week
    const w = f.week ?? {}
    const value = metric.value === 'stars' ? w.stars ?? 0 : w.key === week ? w[metric.value] ?? 0 : 0
    return { ...f, value }
  })
  return list.sort((a, b) => b.value - a.value)
})
</script>

<template>
  <section v-if="farm.state.neighbours.length">
    <h3 class="eyebrow">This week among neighbours</h3>
    <div class="segmented mt-2 w-full">
      <button v-for="m in METRICS" :key="m.id" type="button" role="tab" class="flex-1" :aria-selected="metric === m.id" @click="metric = m.id">{{ m.label }}</button>
    </div>
    <p v-if="others === null" class="mt-2 text-sm font-semibold text-bark-400">Counting…</p>
    <ol v-else class="mt-2 space-y-1.5">
      <li
        v-for="(r, i) in rows"
        :key="r.code"
        class="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
        :class="r.me ? 'border-leaf-300 bg-leaf-200/40' : 'border-line bg-surface'"
      >
        <span class="w-6 text-center font-display text-lg font-semibold" :class="i === 0 ? 'text-honey-400' : 'text-bark-400'">{{ i === 0 ? '👑' : i + 1 }}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-bark-600">{{ r.me ? 'You' : r.name }}</p>
          <p class="text-xs font-semibold text-bark-400">{{ r.plant }}</p>
        </div>
        <span class="font-display text-lg font-semibold tabular-nums text-bark-600">{{ r.value }}</span>
      </li>
    </ol>
    <p class="mt-2 text-xs font-medium text-bark-400">Only neighbours who share their farm show up here. Harvests and orders start again every Monday.</p>
  </section>
</template>
