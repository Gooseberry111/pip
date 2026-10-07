<script setup>
// The order board: critter neighbours ask for things from the farm and pay in petals.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { GOODS } from '@/data/farm'
import { critterById, formatLeft, hasAll } from '@/utils/farmLogic'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'
import PetalIcon from '../PetalIcon.vue'
import CommunityCard from './CommunityCard.vue'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'delivered', 'community'])

const farm = useFarmStore()
const now = computed(() => farm.now)
const FACES = { bunny: '🐰', hedgehog: '🦔', badger: '🦡', bee: '🐝', frog: '🐸', mouse: '🐭', owl: '🦉', fox: '🦊' }

const orders = computed(() =>
  farm.state.orders.map((o, i) => ({ ...o, i, critter: o.critter ? critterById[o.critter] : null, can: o.needs ? hasAll(farm.state.barn, o.needs) : false })),
)

function deliver(i) {
  const r = farm.fulfilOrder(i)
  if (r) emit('delivered', r)
}
</script>

<template>
  <BottomSheet :open="open" title="Order board" eyebrow="Your neighbours need a hand" @close="emit('close')">
    <CommunityCard class="mb-3" @claimed="(r) => emit('community', r)" />
    <ul class="space-y-2.5">
      <li v-for="o in orders" :key="o.i" class="rounded-2xl border border-line p-3" :class="o.needs ? 'bg-surface' : 'bg-sand-100/50'">
        <template v-if="o.needs">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-2xl">{{ FACES[o.critter.kind] }}</span>
            <div class="min-w-0 flex-1">
              <p class="font-display text-base font-semibold leading-tight text-bark-600">{{ o.critter.name }}</p>
              <p class="text-xs font-semibold text-bark-400">would love these</p>
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-petal-100 px-2.5 py-1 text-sm font-extrabold text-petal-500">
              <PetalIcon :size="15" />{{ o.petals }}
            </span>
          </div>
          <div class="mt-2.5 flex flex-wrap gap-1.5">
            <span
              v-for="(n, id) in o.needs"
              :key="id"
              class="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-sm font-bold"
              :class="(farm.state.barn[id] ?? 0) >= n ? 'text-bark-600' : 'text-clay-400'"
            >
              <GoodIcon :id="id" :size="20" /> {{ farm.state.barn[id] ?? 0 }}/{{ n }}
              <span class="sr-only">{{ GOODS[id].name }}</span>
            </span>
          </div>
          <div class="mt-3 flex items-center gap-2">
            <button type="button" class="btn btn-primary btn-sm flex-1" :disabled="!o.can" data-sound="none" @click="deliver(o.i)">
              {{ o.can ? `Deliver · +${o.xp} XP` : 'Still gathering' }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="farm.skipOrder(o.i)">Skip</button>
          </div>
        </template>
        <p v-else class="py-2 text-center text-sm font-semibold text-bark-400">
          A new order arrives in {{ formatLeft(o.waitUntil - now) }}
        </p>
      </li>
    </ul>
  </BottomSheet>
</template>
