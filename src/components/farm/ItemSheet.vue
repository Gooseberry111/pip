<script setup>
// Details for something growing or working on the farm: time left, watering, fertiliser,
// and feeding the animals and the windmill.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { cropById, treeById, producerById, formatLeft, growthFraction, hasAll } from '@/utils/farmLogic'
import { GOODS, PLACEABLE } from '@/data/farm'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'

const props = defineProps({ uid: { type: Number, default: null } })
const emit = defineEmits(['close', 'water', 'fertilise', 'feed', 'collect'])

const farm = useFarmStore()
const o = computed(() => (props.uid == null ? null : farm.find(props.uid)))
const now = computed(() => farm.now)

const info = computed(() => {
  const x = o.value
  if (!x) return null
  if (x.crop) {
    const c = cropById[x.crop.id]
    return {
      title: c.name,
      eyebrow: 'Growing',
      icon: c.id,
      left: x.crop.readyAt - now.value,
      progress: growthFraction(x.crop.plantedAt, x.crop.readyAt, now.value),
      canWater: !x.crop.watered && now.value < x.crop.readyAt,
      watered: x.crop.watered,
      note: `Picks ${c.yield} for the barn when it’s ready.`,
    }
  }
  const t = treeById[x.type]
  if (t) {
    return {
      title: t.name,
      eyebrow: x.grown ? 'Fruit on the way' : 'Still growing',
      icon: t.fruit,
      left: x.readyAt - now.value,
      progress: growthFraction(x.readyAt - (x.grown ? t.every : t.grow) * 60000, x.readyAt, now.value),
      note: `Gives ${t.yield} ${GOODS[t.fruit].name.toLowerCase()} fruit every ${t.every} minutes, again and again.`,
    }
  }
  const p = producerById[x.type]
  if (p) {
    const fed = Boolean(x.readyAt)
    return {
      title: p.name,
      eyebrow: fed ? 'Busy' : 'Waiting',
      icon: p.makes,
      left: fed ? x.readyAt - now.value : null,
      progress: fed ? growthFraction(x.readyAt - p.minutes * 60000, x.readyAt, now.value) : 0,
      feed: !fed && Object.keys(p.feed).length ? p.feed : null,
      canFeed: !fed && hasAll(farm.state.barn, p.feed),
      note: p.blurb,
    }
  }
  return { title: PLACEABLE[x.type]?.name ?? 'Decoration', eyebrow: 'Decoration', note: 'Just here to look lovely.' }
})
</script>

<template>
  <BottomSheet :open="Boolean(info)" :title="info?.title ?? ''" :eyebrow="info?.eyebrow" @close="emit('close')">
    <div v-if="info" class="pb-1">
      <div class="flex items-center gap-4">
        <span v-if="info.icon" class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cream shadow-soft">
          <GoodIcon :id="info.icon" :size="40" />
        </span>
        <div class="min-w-0 flex-1">
          <template v-if="info.left !== null && info.left !== undefined">
            <p class="font-display text-3xl font-semibold tabular-nums text-bark-600">{{ formatLeft(info.left) }}</p>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-sand-100">
              <div class="h-full rounded-full bg-leaf-400 transition-[width] duration-1000" :style="{ width: `${info.progress * 100}%` }" />
            </div>
          </template>
          <p class="mt-2 text-sm font-medium text-bark-400">{{ info.note }}</p>
        </div>
      </div>

      <div v-if="info.feed" class="mt-4 rounded-2xl bg-cream p-3">
        <p class="text-xs font-bold uppercase tracking-wider text-bark-400">Needs</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span v-for="(n, id) in info.feed" :key="id" class="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-sm font-bold shadow-soft" :class="(farm.state.barn[id] ?? 0) >= n ? 'text-bark-600' : 'text-clay-400'">
            <GoodIcon :id="id" :size="20" /> {{ farm.state.barn[id] ?? 0 }} / {{ n }}
          </span>
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-2">
        <button v-if="info.feed" type="button" class="btn btn-primary w-full" :disabled="!info.canFeed" @click="emit('feed')">
          {{ info.canFeed ? 'Fill it up' : 'Not enough in the barn yet' }}
        </button>
        <button v-if="info.canWater" type="button" class="btn btn-secondary w-full" data-sound="water" @click="emit('water')">Water it (grows 15% quicker)</button>
        <p v-else-if="info.watered" class="text-center text-xs font-semibold text-water-500">Watered. Growing a little quicker.</p>
        <button
          v-if="info.left > 0"
          type="button"
          class="btn btn-ghost w-full"
          :disabled="farm.state.fertiliser <= 0"
          @click="emit('fertilise')"
        >
          Use fertiliser: half the time ({{ farm.state.fertiliser }} left)
        </button>
      </div>
    </div>
  </BottomSheet>
</template>
