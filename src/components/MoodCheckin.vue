<script setup>
// The daily check-in: "How are you today?" Pip listens, answers kindly, and on a harder
// day gently offers a minute of breathing together. Always skippable.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePipStore } from '@/stores/pip'
import { MOODS, findMood } from '@/data/moods'
import { pick } from '@/data/messages'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Modal from './Modal.vue'
import MoodFace from './MoodFace.vue'
import Pip from './Pip.vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
const pip = usePipStore()
const router = useRouter()

const chosen = ref(null)
const reply = ref('')
const note = ref('')
const pipRef = ref(null)
const mood = computed(() => findMood(chosen.value))

watch(
  () => props.open,
  (open) => {
    if (open) {
      chosen.value = null
      note.value = ''
    }
  },
)

function choose(id) {
  chosen.value = id
  const m = findMood(id)
  reply.value = pick(m.replies)
  pip.logMood(id)
  playSound(['great', 'good'].includes(id) ? 'select' : 'toggleOn')
  haptic('light')
  setTimeout(() => pipRef.value?.react(['great', 'good'].includes(id) ? 'happy' : 'pet'), 150)
}

function finish() {
  if (chosen.value && note.value.trim()) pip.logMood(chosen.value, note.value)
  emit('close')
}

function breathe() {
  finish()
  router.push({ path: '/play', query: { game: 'breathe' } })
}

function skip() {
  pip.skipCheckin()
  emit('close')
}
</script>

<template>
  <Modal :open="open" label="Daily check-in" @close="chosen ? finish() : skip()">
    <div class="relative mx-auto -mt-1 aspect-[200/250] w-20">
      <Pip
        ref="pipRef"
        :growth="pip.growthValue"
        :droop="0"
        health="healthy"
        :pot="pip.currentPot"
        :leaf="pip.currentLeaf"
        :flower="pip.currentFlower"
        :accessory="pip.currentAccessory"
        :calm="!chosen"
        :interactive="false"
        :idle="false"
        class="h-full w-full"
      />
    </div>

    <Transition name="swap" mode="out-in">
      <!-- step 1: how are you? -->
      <div v-if="!chosen" key="ask">
        <p class="eyebrow mt-2">Daily check-in</p>
        <h2 class="title-xl mt-1 text-[1.6rem]!">How are you today?</h2>
        <p class="mt-1 text-sm font-medium text-bark-400">There’s no wrong answer.</p>
        <div class="mt-5 grid grid-cols-5 gap-1.5">
          <button
            v-for="m in MOODS"
            :key="m.id"
            type="button"
            data-sound="none"
            class="mood flex flex-col items-center gap-1.5 rounded-2xl py-2 transition hover:bg-cream active:scale-95"
            :aria-label="m.label"
            @click="choose(m.id)"
          >
            <MoodFace :mood="m.id" :size="46" />
            <span class="text-[0.6875rem] font-bold text-bark-500">{{ m.label }}</span>
          </button>
        </div>
        <button type="button" class="btn btn-ghost btn-sm mt-4 w-full" @click="skip">Not today</button>
      </div>

      <!-- step 2: Pip answers -->
      <div v-else key="reply">
        <div class="mt-2 flex justify-center"><MoodFace :mood="chosen" :size="40" /></div>
        <h2 class="mt-2 font-display text-[1.35rem] font-semibold leading-snug text-bark-600">{{ reply }}</h2>

        <label class="mt-5 block text-left">
          <span class="eyebrow">Anything on your mind? (optional)</span>
          <textarea
            v-model="note"
            rows="2"
            maxlength="200"
            placeholder="A few words for your journal…"
            class="mt-1.5 w-full resize-none rounded-2xl border border-line bg-cream px-3.5 py-2.5 text-sm font-medium text-bark-600 outline-none placeholder:text-bark-300 focus:border-leaf-400"
          />
        </label>

        <button v-if="mood?.suggest" type="button" class="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#EEE7F3] px-4 py-3 text-left" @click="breathe">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-[#8C7FB5]">
            <Icon name="wind" :size="18" :stroke="2" />
          </span>
          <span class="flex-1">
            <span class="block text-sm font-bold text-bark-600">Breathe together for a minute?</span>
            <span class="block text-xs font-medium text-bark-400">It might help a little.</span>
          </span>
          <Icon name="back" :size="16" :stroke="2.2" class="rotate-180 text-bark-300" />
        </button>

        <button type="button" class="btn btn-primary mt-5 w-full" @click="finish">Thanks, {{ pip.plantName }}</button>
      </div>
    </Transition>
  </Modal>
</template>

<style scoped>
.mood:hover :deep(svg) {
  transform: translateY(-2px) scale(1.05);
}
.mood :deep(svg) {
  transition: transform 0.2s ease;
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.swap-leave-to {
  opacity: 0;
}
</style>
