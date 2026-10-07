<script setup>
// One card in the collection grid. Unlocked items can be put on; locked ones appear as a
// soft silhouette with a hint about how to find them.
import { computed, ref } from 'vue'
import { playSound } from '@/utils/sound'
import ItemPreview from './ItemPreview.vue'
import Icon from './Icon.vue'

const props = defineProps({
  category: { type: String, required: true },
  item: { type: Object, required: true },
  unlocked: { type: Boolean, default: false },
  equipped: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  currentLevel: { type: Number, default: 1 },
  levelPercent: { type: Number, default: 0 },
  showsAt: { type: String, default: '' }, // chosen, but Pip isn't big enough to show it yet
})

const emit = defineEmits(['select', 'locked'])

const TINTS = {
  pots: '#F6EDE2',
  leaves: '#EEF3E6',
  flowers: '#F9EEEE',
  decorations: '#F3EEE6',
}

// How close Pip is to unlocking this, counting the progress through the current level.
const closeness = computed(() => {
  if (props.unlocked || props.item.packet || props.item.shop) return 1
  const done = props.currentLevel - 1 + props.levelPercent / 100
  return Math.min(0.97, Math.max(0.05, done / (props.item.level - 1)))
})

const hint = computed(() => {
  if (props.item.packet) return 'Found in seed packets'
  if (props.item.shop) return `In the shop · ${props.item.shop} petals`
  const away = props.item.level - props.currentLevel
  return away === 1 ? 'Almost there' : `Grows at level ${props.item.level}`
})

const popping = ref(false)
const nudging = ref(false)

function onClick() {
  if (!props.unlocked) {
    playSound('miss')
    nudging.value = false
    requestAnimationFrame(() => (nudging.value = true))
    emit('locked', props.item)
    return
  }
  popping.value = false
  requestAnimationFrame(() => (popping.value = true))
  emit('select', props.item)
}
</script>

<template>
  <button
    type="button"
    class="group relative flex flex-col items-stretch rounded-[1.4rem] p-2 text-left transition duration-300 ease-out"
    :class="[
      unlocked ? 'card active:scale-[0.97]' : 'border border-dashed border-sand-300 bg-sand-100/50',
      equipped ? 'ring-2 ring-leaf-300 ring-offset-2 ring-offset-cream' : '',
      { 'is-popping': popping, 'is-nudging': nudging },
    ]"
    :aria-label="unlocked ? `${item.name}${equipped ? ', in use' : ''}` : `${item.name}, locked. ${hint}`"
    :aria-pressed="unlocked ? equipped : undefined"
    data-sound="none"
    @click="onClick"
    @animationend="popping = nudging = false"
  >
    <div
      class="relative aspect-square overflow-hidden rounded-[1.05rem]"
      :style="category === 'backgrounds' ? {} : { background: unlocked ? TINTS[category] : '#EFE6D9' }"
    >
      <div class="absolute inset-0" :class="[category === 'backgrounds' ? 'p-0' : 'p-3.5', !unlocked && (category === 'backgrounds' ? 'locked-scene' : 'silhouette')]">
        <ItemPreview :category="category" :id="item.id" />
      </div>

      <span
        v-if="!unlocked"
        class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-bark-300 shadow-soft"
      >
        <Icon :name="item.packet ? 'gift' : 'lock'" :size="14" />
      </span>
      <span
        v-else-if="equipped"
        class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-leaf-400 text-white shadow-soft"
      >
        <Icon name="check" :size="15" :stroke="2.4" />
      </span>
      <span
        v-else-if="isNew"
        class="new-pill absolute left-2 top-2 rounded-full bg-clay-300 px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wider text-white"
      >
        New
      </span>
      <span
        v-if="unlocked && item.packet"
        class="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-clay-400"
      >
        Rare
      </span>
    </div>

    <div class="px-1.5 pb-1 pt-2.5">
      <p class="truncate text-[0.875rem] font-bold" :class="unlocked ? 'text-bark-600' : 'text-bark-400'">
        {{ unlocked ? item.name : '???' }}
      </p>
      <p v-if="unlocked" class="truncate text-xs font-medium text-bark-400">
        {{ equipped ? showsAt || 'With Pip now' : item.blurb }}
      </p>
      <template v-else>
        <p class="truncate text-xs font-semibold text-bark-400">{{ hint }}</p>
        <div v-if="!item.packet" class="mt-1.5 h-1 overflow-hidden rounded-full bg-sand-200">
          <div class="h-full rounded-full bg-leaf-300" :style="{ width: `${closeness * 100}%` }" />
        </div>
      </template>
    </div>
  </button>
</template>

<style scoped>
.silhouette {
  filter: brightness(0) opacity(0.13);
}
.locked-scene {
  filter: grayscale(0.8) opacity(0.45) blur(1.5px);
}
.new-pill {
  animation: soft-pulse 2.4s ease-in-out infinite;
}
.is-popping {
  animation: pop 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.is-nudging {
  animation: nudge 0.45s ease-in-out;
}
@keyframes soft-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
@keyframes pop {
  0%, 100% { transform: scale(1); }
  40% { transform: scale(1.05); }
}
@keyframes nudge {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
