<script setup>
// Choose what to grow in an empty plot. Crops unlock as the farm levels up.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { CROPS } from '@/data/farm'
import { formatMinutes } from '@/utils/farmLogic'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'
import PetalIcon from '../PetalIcon.vue'
import Icon from '../Icon.vue'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'plant', 'plantAll'])

const farm = useFarmStore()
const pip = usePipStore()

const emptyPlots = computed(() => farm.objects.filter((o) => o.type === 'plot' && !o.crop).length)
const crops = computed(() => CROPS.map((c) => ({ ...c, locked: c.level > farm.state.level, afford: pip.petals >= c.seed })))
</script>

<template>
  <BottomSheet :open="open" title="What shall we grow?" eyebrow="Plant a seed" @close="emit('close')">
    <ul class="space-y-2">
      <li
        v-for="c in crops"
        :key="c.id"
        class="flex items-center gap-3 rounded-2xl border border-line p-2.5"
        :class="c.locked ? 'bg-sand-100/60 opacity-70' : 'bg-cream'"
      >
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface shadow-soft">
          <GoodIcon :id="c.id" :size="30" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-semibold leading-tight text-bark-600">{{ c.name }}</p>
          <p class="mt-0.5 text-xs font-semibold text-bark-400">
            <template v-if="c.locked"><Icon name="lock" :size="11" class="-mt-0.5 inline" /> Farm level {{ c.level }}</template>
            <template v-else>{{ formatMinutes(c.minutes) }} · picks {{ c.yield }} · sells {{ c.sell }} each</template>
          </p>
        </div>
        <div v-if="!c.locked" class="flex shrink-0 flex-col items-end gap-1">
          <button type="button" class="btn btn-primary btn-sm h-8! gap-1! px-3!" :disabled="!c.afford" data-sound="none" @click="emit('plant', c.id)">
            <template v-if="c.seed"><PetalIcon :size="14" />{{ c.seed }}</template>
            <template v-else>Free</template>
          </button>
          <button
            v-if="emptyPlots > 1"
            type="button"
            class="text-[0.6875rem] font-bold text-leaf-500 disabled:opacity-40"
            :disabled="!c.afford"
            data-sound="none"
            @click="emit('plantAll', c.id)"
          >
            All {{ emptyPlots }} plots
          </button>
        </div>
      </li>
    </ul>
  </BottomSheet>
</template>
