<script setup>
// Flower Song: Pip sings a little tune on four flowers. Sing it back by tapping them in order.
// Each round adds one more note.
import { computed, ref, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import GameShell from './GameShell.vue'
import GameResults from './GameResults.vue'
import LevelIntro from './LevelIntro.vue'
import Pip from '../Pip.vue'
import FlowerArt from '../art/FlowerArt.vue'

const emit = defineEmits(['close'])
const pip = usePipStore()

const FLOWERS = [
  { id: 'blossom', midi: 72, glow: '#F6C7CD', ring: '#E99AA8' },
  { id: 'sunny', midi: 76, glow: '#F8DE92', ring: '#E8B54F' },
  { id: 'daisy', midi: 79, glow: '#F4EBD6', ring: '#D9C7A3' },
  { id: 'poppy', midi: 84, glow: '#F6B6A5', ring: '#E07A62' },
]

const phase = ref('intro') // intro | listen | repeat | done
const sequence = ref([])
const position = ref(0)
const lit = ref(-1)
const message = ref('')
const results = ref(null)
const pipRef = ref(null)

const round = computed(() => sequence.value.length)
const score = computed(() => Math.max(0, sequence.value.length - 1))

const timers = new Set()
function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function light(i, ms = 380) {
  lit.value = i
  playSound('note', true, { midi: FLOWERS[i].midi, length: 0.9 })
  later(() => {
    if (lit.value === i) lit.value = -1
  }, ms)
}

function start() {
  sequence.value = []
  results.value = null
  nextRound()
}

function nextRound() {
  sequence.value.push(Math.floor(Math.random() * FLOWERS.length))
  phase.value = 'listen'
  message.value = 'Listen…'
  const gap = Math.max(300, 600 - sequence.value.length * 30)
  sequence.value.forEach((f, i) => later(() => light(f, gap * 0.65), 650 + i * gap))
  later(() => {
    phase.value = 'repeat'
    position.value = 0
    message.value = 'Your turn'
  }, 650 + sequence.value.length * gap)
}

function tap(i) {
  if (phase.value !== 'repeat') return
  light(i, 260)
  haptic('light')
  if (i !== sequence.value[position.value]) return end()
  position.value += 1
  if (position.value === sequence.value.length) {
    phase.value = 'listen'
    message.value = ['Lovely!', 'Beautiful!', 'So pretty!', 'Again!'][sequence.value.length % 4]
    pipRef.value?.react('happy')
    later(nextRound, 900)
  }
}

function end() {
  phase.value = 'done'
  pipRef.value?.react('wiggle')
  const notes = score.value
  const fromGame = Math.min(15, Math.floor(notes / 2))
  if (fromGame) pip.earn(fromGame)
  const bonus = notes >= 3 ? pip.completeTask('play') : 0
  const best = notes > 0 && pip.recordScore('song', notes)
  later(() => {
    results.value = {
      title: notes >= 10 ? 'What a singer!' : notes >= 5 ? 'Lovely singing!' : notes > 0 ? 'A sweet little tune' : 'Let’s try that again',
      petals: fromGame + bonus,
      best,
    }
  }, 700)
}

onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<template>
  <GameShell title="Flower Song" track="song" background="linear-gradient(180deg, #F2E9F0 0%, #F7EFE6 100%)" @close="emit('close')">
    <template #stats>
      <span v-if="phase !== 'intro'" class="chip tabular-nums">{{ round }} {{ round === 1 ? 'note' : 'notes' }}</span>
    </template>

    <div class="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div class="relative aspect-[200/250] w-32">
        <Pip
          ref="pipRef"
          :growth="pip.growthValue"
          :droop="0"
          health="healthy"
          :pot="pip.currentPot"
          :leaf="pip.currentLeaf"
          :flower="pip.currentFlower"
          :accessory="pip.currentAccessory"
          :interactive="false"
          :idle="false"
          class="h-full w-full"
        />
        <span v-if="phase === 'listen' && lit >= 0" :key="`${lit}-${position}-${round}`" class="note absolute -right-3 top-6 font-display text-2xl text-bark-400">♪</span>
      </div>

      <Transition name="fade" mode="out-in">
        <p :key="message" class="h-8 font-display text-2xl font-semibold text-bark-600">{{ message }}</p>
      </Transition>

      <div class="grid w-full max-w-[19rem] grid-cols-2 gap-4">
        <button
          v-for="(f, i) in FLOWERS"
          :key="f.id"
          type="button"
          data-sound="none"
          class="pad relative flex aspect-square items-center justify-center rounded-[1.75rem] transition duration-150"
          :class="{ 'is-lit': lit === i, 'is-waiting': phase !== 'repeat' }"
          :style="{ '--glow': f.glow, '--ring': f.ring }"
          :aria-label="`${f.id} flower`"
          @pointerdown.prevent="tap(i)"
        >
          <svg viewBox="-20 -20 40 40" class="h-[64%] w-[64%] overflow-visible" aria-hidden="true">
            <FlowerArt :flower="f.id" :bloom="1" :size="1.5" />
          </svg>
        </button>
      </div>

      <p v-if="phase === 'repeat'" class="text-sm font-semibold text-bark-400">{{ position }} of {{ round }}</p>
    </div>

    <LevelIntro
      v-if="phase === 'intro'"
      goal="Sing Pip’s song back"
      :show-levels="false"
      :tips="[
        { color: '#E99AA8', text: 'Pip plays a tune on the flowers' },
        { color: '#E8B54F', text: 'Tap them in the same order' },
        { color: '#86AD72', text: 'Each round adds one more note' },
      ]"
      @start="start"
    />

    <GameResults
      v-if="results"
      eyebrow="Flower Song"
      :success="score > 0"
      :title="results.title"
      :subtitle="`You remembered ${score} ${score === 1 ? 'note' : 'notes'}.`"
      :stats="[
        { label: 'Notes', value: score },
        { label: 'Best', value: pip.bestScores.song || score },
      ]"
      :petals="results.petals"
      :best="results.best"
      @again="start"
      @close="emit('close')"
    />
  </GameShell>
</template>

<style scoped>
.pad {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-soft), inset 0 -4px 0 rgb(58 45 35 / 0.04);
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}
.pad.is-waiting {
  cursor: default;
}
.pad.is-lit {
  background: var(--glow);
  border-color: var(--ring);
  box-shadow: 0 0 0 4px var(--glow), 0 0 34px var(--glow);
  transform: scale(1.06);
}
.note {
  animation: note 0.8s ease-out forwards;
}
@keyframes note {
  from { opacity: 1; transform: translate(0, 0); }
  to { opacity: 0; transform: translate(10px, -26px); }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
