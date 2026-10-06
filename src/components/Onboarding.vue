<script setup>
// The very first moment: meet a sleepy seed, give it a name, and plant it.
import { nextTick, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { getDayPhase } from '@/utils/timeOfDay'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import HomeStage from './HomeStage.vue'
import Pip from './Pip.vue'
import Sparkles from './Sparkles.vue'
import PipLogo from './PipLogo.vue'

const emit = defineEmits(['done'])
const pip = usePipStore()

const step = ref(0)
const name = ref('Pip')
const pipRef = ref(null)
const sparkling = ref(false)
const input = ref(null)
const phase = getDayPhase()

const SUGGESTIONS = ['Pip', 'Mochi', 'Bean', 'Clover', 'Sprout', 'Biscuit']

async function toName() {
  step.value = 1
  await nextTick()
  input.value?.focus()
  input.value?.select()
}

function plant() {
  pip.start(name.value)
  name.value = pip.plantName
  step.value = 2
  sparkling.value = true
  haptic('success')
  playSound('grow', pip.soundOn)
  setTimeout(() => pipRef.value?.react('happy'), 500)
  setTimeout(() => (sparkling.value = false), 1900)
}

function finish() {
  emit('done')
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex flex-col bg-cream px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col">
      <div class="flex justify-center pt-2"><PipLogo :size="34" /></div>

      <HomeStage :phase="phase" class="relative mt-5 min-h-[16rem] flex-1">
        <div class="absolute bottom-[13%] left-1/2 aspect-[200/250] h-[68%] -translate-x-1/2">
          <Pip
            ref="pipRef"
            :growth="0"
            :droop="0"
            health="healthy"
            :sleeping="step < 2"
            :interactive="step === 2"
            class="h-full w-full"
          />
          <Sparkles :active="sparkling" />
        </div>
      </HomeStage>

      <div class="pt-6 text-center">
        <Transition name="step" mode="out-in">
          <div v-if="step === 0" key="0">
            <h1 class="font-display text-[1.9rem] font-semibold leading-tight text-bark-600">Hello there.</h1>
            <p class="mx-auto mt-2 max-w-[19rem] text-bark-400">
              Someone left a tiny seed here. It’s looking for a friend to look after it.
            </p>
            <button type="button" class="btn btn-primary mt-6 w-full max-w-[20rem]" @click="toName">Take the seed</button>
          </div>

          <form v-else-if="step === 1" key="1" @submit.prevent="plant">
            <h1 class="font-display text-[1.7rem] font-semibold leading-tight text-bark-600">What will you call it?</h1>
            <input
              ref="input"
              v-model="name"
              maxlength="16"
              class="mx-auto mt-4 block h-14 w-full max-w-[17rem] rounded-2xl bg-surface px-4 text-center font-display text-2xl font-semibold text-bark-600 shadow-soft outline-none ring-2 ring-sand-200 transition focus:ring-leaf-300"
              aria-label="Plant name"
            />
            <div class="mt-3 flex flex-wrap justify-center gap-2">
              <button
                v-for="s in SUGGESTIONS"
                :key="s"
                type="button"
                class="rounded-full px-3.5 py-1.5 text-sm font-bold transition"
                :class="name === s ? 'bg-bark-600 text-cream' : 'border border-line bg-surface text-bark-500 hover:bg-sand-100'"
                @click="name = s"
              >
                {{ s }}
              </button>
            </div>
            <button type="submit" class="btn btn-primary mt-6 w-full max-w-[20rem]" data-sound="none">Plant the seed</button>
          </form>

          <div v-else key="2">
            <h1 class="font-display text-[1.9rem] font-semibold leading-tight text-bark-600">Hi, I’m {{ name }}!</h1>
            <p class="mx-auto mt-2 max-w-[19rem] text-bark-400">
              Give me a little water now and then, and we’ll grow together. There’s no rush.
            </p>
            <button type="button" class="btn btn-primary mt-6 w-full max-w-[20rem]" @click="finish">Let’s begin</button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.step-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
