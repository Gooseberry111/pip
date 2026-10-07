<script setup>
// Pip on the farm: today's wish, and treats from the barn.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { GOODS, WISH_REWARD } from '@/data/farm'
import { recipeById } from '@/utils/farmLogic'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'
import Pip from '../Pip.vue'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'fed', 'barn'])

const farm = useFarmStore()
const pip = usePipStore()

const wish = computed(() => farm.wish)
const haveWish = computed(() => wish.value && (farm.state.barn[wish.value.good] ?? 0) > 0)
const treats = computed(() =>
  Object.entries(farm.state.barn)
    .filter(([id, n]) => n > 0 && recipeById[id])
    .map(([id, n]) => ({ id, n, name: GOODS[id].name, treat: recipeById[id].treat }))
    .sort((a, b) => b.treat - a.treat),
)

function give(id) {
  const r = farm.feedPip(id)
  if (r) emit('fed', { id, ...r })
}
</script>

<template>
  <BottomSheet :open="open" :title="pip.asleep ? `${pip.plantName} is asleep` : `${pip.plantName} on the farm`" eyebrow="Treats and wishes" @close="emit('close')">
    <div class="flex items-center gap-4">
      <div class="relative h-28 w-24 shrink-0">
        <Pip
          :growth="pip.growthValue"
          :droop="pip.droop"
          :health="pip.health"
          :pot="pip.currentPot"
          :leaf="pip.currentLeaf"
          :flower="pip.currentFlower"
          :accessory="pip.currentAccessory"
          :sleeping="pip.asleep"
          :interactive="false"
          class="h-full w-full"
        />
      </div>
      <div class="min-w-0 flex-1">
        <template v-if="wish && !wish.done">
          <p class="eyebrow">Today’s wish</p>
          <p class="mt-1 flex items-center gap-2 font-display text-lg font-semibold text-bark-600">
            <GoodIcon :id="wish.good" :size="28" /> {{ GOODS[wish.good].name }}
          </p>
          <p class="mt-1 text-xs font-semibold text-bark-400">Give one for +{{ WISH_REWARD.petals }} petals and a growth boost.</p>
          <button type="button" class="btn btn-primary btn-sm mt-2.5" :disabled="!haveWish" data-sound="none" @click="give(wish.good)">
            {{ haveWish ? 'Give it' : 'None in the barn yet' }}
          </button>
        </template>
        <template v-else-if="wish?.done">
          <p class="eyebrow text-leaf-500!">Wish come true</p>
          <p class="mt-1 text-sm font-semibold text-bark-500">{{ pip.plantName }} is still smiling about that {{ GOODS[wish.good].name.toLowerCase() }}. A new wish comes tomorrow.</p>
        </template>
        <p v-else class="text-sm font-semibold text-bark-500">Grow a few things and {{ pip.plantName }} will start making wishes.</p>
      </div>
    </div>

    <h3 class="eyebrow mt-6">Treats from the kitchen</h3>
    <p v-if="!treats.length" class="mt-2 rounded-2xl bg-cream p-4 text-sm font-semibold text-bark-400">
      Cook something in the kitchen and give it to {{ pip.plantName }}. Treats help {{ pip.plantName }} grow.
      <button type="button" class="ml-1 font-bold text-leaf-500" @click="emit('barn')">Open the barn</button>
    </p>
    <ul v-else class="mt-2 space-y-2">
      <li v-for="t in treats" :key="t.id" class="flex items-center gap-3 rounded-2xl border border-line bg-cream p-2.5">
        <GoodIcon :id="t.id" :size="32" />
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-semibold text-bark-600">{{ t.name }} <span class="text-bark-400">× {{ t.n }}</span></p>
          <p class="text-xs font-semibold text-bark-400">+{{ t.treat }} growth</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm h-8! px-3!" data-sound="none" @click="give(t.id)">Give</button>
      </li>
    </ul>
  </BottomSheet>
</template>
