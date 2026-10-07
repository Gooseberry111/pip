<script setup>
// A new badge: its picture, what it was for, and what it gave.
import { watch, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Modal from './Modal.vue'
import Celebration from './Celebration.vue'
import ItemPreview from './ItemPreview.vue'
import PetalIcon from './PetalIcon.vue'

const props = defineProps({ badge: { type: Object, default: null } }) // { ...badge, gift: { petals, item } }
const emit = defineEmits(['close'])
const pip = usePipStore()
const burst = ref(0)

watch(
  () => props.badge,
  (b) => {
    if (!b) return
    setTimeout(() => {
      burst.value += 1
      playSound('levelUp')
      haptic('success')
    }, 250)
  },
)

function wear() {
  const item = props.badge.gift.item
  pip.wear(item.category, item.id)
  emit('close')
}
</script>

<template>
  <Modal :open="Boolean(badge)" label="New badge" @close="emit('close')">
    <template v-if="badge">
      <div class="medal mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl">{{ badge.icon }}</div>
      <p class="eyebrow mt-4 text-clay-400!">New badge</p>
      <h2 class="title-xl mt-1">{{ badge.name }}</h2>
      <p class="mt-1 text-sm font-medium text-bark-400">{{ badge.text }}</p>
      <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-petal-100 px-3.5 py-1.5 text-sm font-extrabold text-petal-500">
          <PetalIcon :size="17" /> +{{ badge.gift.petals }} petals
        </span>
      </div>
      <div v-if="badge.gift.item" class="mt-4 flex items-center gap-3 rounded-2xl bg-cream p-3 text-left">
        <span class="h-14 w-14 shrink-0 rounded-xl bg-surface p-1.5"><ItemPreview :category="badge.gift.item.category" :id="badge.gift.item.id" /></span>
        <div class="min-w-0 flex-1">
          <p class="text-[0.6875rem] font-extrabold uppercase tracking-wider text-leaf-500">Unlocked</p>
          <p class="font-display text-base font-semibold text-bark-600">{{ badge.gift.item.name }}</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" @click="wear">Wear it</button>
      </div>
      <button type="button" class="btn mt-5 w-full" :class="badge.gift.item ? 'btn-secondary' : 'btn-primary'" @click="emit('close')">Lovely</button>
    </template>
    <Celebration :trigger="burst" :y="20" :count="26" :spread="160" />
  </Modal>
</template>

<style scoped>
.medal {
  background: radial-gradient(circle at 35% 30%, #FFF6D9 0%, #F8E2A6 55%, #E8B54F 100%);
  box-shadow: 0 0 0 6px rgb(248 226 166 / 0.45), 0 14px 30px -14px rgb(201 149 47 / 0.8);
  animation: medal 0.9s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
@keyframes medal {
  0% { transform: scale(0.3) rotate(-30deg); opacity: 0; }
  100% { transform: none; opacity: 1; }
}
</style>
