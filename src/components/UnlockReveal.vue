<script setup>
// Reveals something new Pip has unlocked, with the option to try it on straight away.
import { computed } from 'vue'
import { CATEGORIES } from '@/data/items'
import Modal from './Modal.vue'
import ItemPreview from './ItemPreview.vue'
import Rays from './Rays.vue'
import Sparkles from './Sparkles.vue'

const props = defineProps({
  item: { type: Object, default: null }, // { id, name, blurb, category }
  index: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
  headline: { type: String, default: 'Something new!' },
})

const emit = defineEmits(['use', 'close'])

const kind = computed(() => CATEGORIES.find((c) => c.id === props.item?.category)?.single ?? 'treasure')
const useLabel = computed(() =>
  ['decorations', 'backgrounds'].includes(props.item?.category) ? 'Add to the garden' : 'Try it on',
)
</script>

<template>
  <Modal :open="!!item" label="New item" @close="emit('close')">
    <template v-if="item">
      <p class="eyebrow text-clay-400!">
        {{ headline }}<span v-if="total > 1" class="text-bark-300"> · {{ index + 1 }} of {{ total }}</span>
      </p>
      <div class="relative mx-auto my-3 aspect-square w-52">
        <Rays />
        <div
          :key="item.id"
          class="reveal absolute inset-9 overflow-hidden rounded-[1.75rem] bg-cream shadow-soft"
          :class="item.category === 'backgrounds' ? '' : 'p-4'"
        >
          <ItemPreview :category="item.category" :id="item.id" />
        </div>
        <Sparkles :active="true" />
      </div>
      <p class="text-sm font-bold capitalize text-bark-400">New {{ kind }}</p>
      <h2 class="font-display text-[1.6rem] font-semibold leading-tight text-bark-600">{{ item.name }}</h2>
      <p class="mt-1 text-sm text-bark-400">{{ item.blurb }}</p>
      <div class="mt-6 flex flex-col gap-2">
        <button
          type="button"
          class="btn btn-primary w-full"
          @click="emit('use', item)"
        >
          {{ useLabel }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm w-full" @click="emit('close')">
          {{ index + 1 < total ? 'Next' : 'Maybe later' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.reveal {
  animation: reveal 0.9s cubic-bezier(0.2, 0.9, 0.3, 1.35) both;
}
@keyframes reveal {
  0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}
</style>
