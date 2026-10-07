<script setup>
// "Did you know?" A little fact from Pip, with a gentle thought underneath.
import { computed, ref, watch } from 'vue'
import { usePipStore } from '@/stores/pip'
import { THOUGHTS, FACTS } from '@/data/facts'
import { pick } from '@/data/messages'
import { playSound } from '@/utils/sound'
import Modal from './Modal.vue'
import Pip from './Pip.vue'
import PetalIcon from './PetalIcon.vue'
import Icon from './Icon.vue'

const props = defineProps({
  fact: { type: Object, default: null }, // { fact, petals }
})

const emit = defineEmits(['close', 'ask'])
const pip = usePipStore()

const thought = ref('')
watch(
  () => props.fact,
  (f) => {
    if (!f) return
    thought.value = pick(THOUGHTS)
    if (f.petals) setTimeout(() => playSound('petals'), 600)
  },
)

const collected = computed(() => `${pip.factsSeen.length} of ${FACTS.length} in your fact book`)
</script>

<template>
  <Modal :open="!!fact" label="Did you know?" @close="emit('close')">
    <template v-if="fact">
      <div class="flex items-center justify-center gap-2">
        <span class="inline-flex h-7 items-center gap-1.5 rounded-full bg-honey-100 px-3 text-xs font-extrabold text-clay-400">
          <Icon name="sparkle" :size="13" :stroke="2.2" /> Did you know?
        </span>
        <span class="chip h-7!">{{ fact.fact.topic }}</span>
      </div>

      <div class="relative mx-auto mt-3 aspect-[200/250] w-20">
        <Pip
          :growth="pip.growthValue"
          :droop="0"
          health="healthy"
          :pot="pip.currentPot"
          :leaf="pip.currentLeaf"
          :flower="pip.currentFlower"
          :interactive="false"
          :idle="false"
          class="h-full w-full"
        />
      </div>

      <p class="mt-3 font-display text-[1.3rem] font-semibold leading-snug text-bark-600">{{ fact.fact.text }}</p>

      <span v-if="fact.petals" class="earn mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-petal-100 px-3 py-1 text-sm font-extrabold text-petal-500">
        <PetalIcon :size="15" /> +{{ fact.petals }} petal
      </span>

      <div class="mt-5 flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 text-left">
        <svg width="20" height="20" viewBox="0 0 20 20" class="shrink-0" aria-hidden="true">
          <path d="M10 18V9" stroke="#86AD72" stroke-width="2" stroke-linecap="round" />
          <path d="M10 10C8 5 3 4 2 6c2 4 6 5 8 4Z M10 9c2-5 7-6 8-4-2 4-6 5-8 4Z" fill="#A9C79A" />
        </svg>
        <p class="text-sm font-medium italic text-bark-500">{{ thought }}</p>
      </div>

      <p class="mt-3 text-xs font-semibold text-bark-300">{{ collected }} · a new one every few hours</p>

      <div class="mt-5 flex flex-col gap-1.5">
        <button type="button" class="btn btn-primary w-full" @click="emit('close')">Lovely!</button>
        <button type="button" class="btn btn-ghost btn-sm w-full" @click="emit('ask', fact.fact)">
          <Icon name="smile" :size="16" :stroke="2" /> Ask {{ pip.plantName }} about it
        </button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.earn {
  animation: pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) 0.4s both;
}
@keyframes pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
</style>
