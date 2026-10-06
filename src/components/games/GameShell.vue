<script setup>
// Full-screen frame for a game: back button, title, live stats, and its own music.
import { useMusic } from '@/utils/music'
import { usePipStore } from '@/stores/pip'
import Icon from '../Icon.vue'

const props = defineProps({
  title: { type: String, required: true },
  background: { type: String, default: 'var(--color-cream)' },
  dark: { type: Boolean, default: false },
  track: { type: String, default: null },
  hideTitle: { type: Boolean, default: false }, // make room for stats while playing
})

const emit = defineEmits(['close'])
const pip = usePipStore()

if (props.track) useMusic(props.track)
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-40 flex flex-col" :style="{ background }" role="dialog" aria-modal="true" :aria-label="title">
      <header
        class="relative z-10 mx-auto flex w-full max-w-lg items-center gap-3 px-4 pb-2 pt-[max(0.875rem,env(safe-area-inset-top))]"
        :class="dark ? 'text-[#F6EFE2]' : 'text-bark-600'"
      >
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95"
          :class="dark ? 'bg-white/12 ring-1 ring-white/15 hover:bg-white/20' : 'icon-btn'"
          aria-label="Back"
          @click="emit('close')"
        >
          <Icon name="back" :size="19" :stroke="2.2" />
        </button>
        <h1 class="flex-1 truncate font-display text-[1.15rem] font-semibold tracking-tight" :class="{ 'sr-only': hideTitle }">{{ title }}</h1>
        <span v-if="hideTitle" class="flex-1" />
        <div class="flex items-center gap-1.5"><slot name="stats" /></div>
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95"
          :class="dark ? 'bg-white/12 ring-1 ring-white/15 hover:bg-white/20' : 'icon-btn'"
          :aria-label="pip.musicOn ? 'Mute music' : 'Play music'"
          :aria-pressed="!pip.musicOn"
          :data-sound="pip.musicOn ? 'toggleOff' : 'toggleOn'"
          @click="pip.toggleMusic()"
        >
          <Icon :name="pip.musicOn ? 'music' : 'music-off'" :size="18" :stroke="2" />
        </button>
      </header>
      <div class="relative mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
