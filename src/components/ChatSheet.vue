<script setup>
// Talk to Pip: a little chat with your plant. Kept short, warm and safe.
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { askPip, chatMode, useBrainFromNowOn } from '@/services/chat'
import { brainReply } from '@/utils/pipBrain'
import { needsSupport, SUPPORT_LINES } from '@/utils/safety'
import { getDayPhase, daysTogether } from '@/utils/timeOfDay'
import { findMood } from '@/data/moods'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Pip from './Pip.vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  prefill: { type: String, default: '' },
})

const emit = defineEmits(['close'])
const pip = usePipStore()

const MAX_LENGTH = 300

const draft = ref('')
const sending = ref(false)
const error = ref(null) // { reason, retry }
const showSupport = ref(false)
const confirmClear = ref(false)
const remaining = ref(null)
const mode = ref('brain') // 'ai' when a free AI is set up on the server
const note = ref('') // a gentle one-off note when the AI is resting
const list = ref(null)
const input = ref(null)
const pipRef = ref(null)

const name = computed(() => pip.plantName)
const greeting = computed(() => {
  const phase = getDayPhase()
  const hello = { dawn: 'Good morning!', day: 'Hi there!', dusk: 'Good evening!', night: 'Oh, hello, night owl.' }[phase]
  return `${hello} It’s me, ${name.value}. How’s your day going?`
})

const STARTERS = ['How are you today?', 'Tell me a fun plant fact', 'I’m feeling a bit stressed', 'What do plants dream about?']

const ERRORS = {
  'too-long': () => 'That’s a lot of words for a little plant! Try something a bit shorter.',
}

// When the AI can't answer, Pip's own brain does, with a gentle note the first time.
const RESTING = {
  limit: () => `${name.value}’s big thinking cap is resting until tomorrow, so replies will be a little simpler for now.`,
  busy: () => `${name.value}’s big thinking cap is busy, so replies will be a little simpler for a bit.`,
  slow: () => `${name.value}’s big thinking cap is busy, so replies will be a little simpler for a bit.`,
  offline: () => 'You’re offline, so replies will be a little simpler until you’re back online.',
  server: () => `${name.value}’s big thinking cap is resting, so replies will be a little simpler for now.`,
}

const status = computed(() => {
  if (sending.value) return 'thinking…'
  return { healthy: 'feeling good', thirsty: 'a little thirsty', wilting: 'very thirsty' }[pip.health] ?? 'here for you'
})

function fitInput() {
  nextTick(() => {
    const el = input.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })
}

function scrollToEnd() {
  nextTick(() => list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' }))
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      window.removeEventListener('keydown', onKey)
      return
    }
    error.value = null
    note.value = ''
    confirmClear.value = false
    chatMode().then((m) => (mode.value = m))
    showSupport.value = pip.chat.slice(-6).some((m) => m.role === 'user' && needsSupport(m.text))
    if (props.prefill) draft.value = props.prefill.slice(0, MAX_LENGTH)
    window.addEventListener('keydown', onKey)
    scrollToEnd()
    fitInput()
    nextTick(() => {
      if (props.prefill) input.value?.focus()
    })
  },
  { immediate: true },
)

watch(() => pip.chat.length, scrollToEnd)

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

function pipState() {
  const mood = findMood(pip.daily.mood)
  return {
    name: pip.plantName,
    level: pip.growthLevel,
    stage: pip.stage.name.replace('Pip', pip.plantName),
    health: pip.health,
    days: daysTogether(pip.startedAt),
    mood: mood?.label?.toLowerCase(),
    timeOfDay: getDayPhase(),
  }
}

async function send(text = draft.value) {
  const message = text.trim().slice(0, MAX_LENGTH)
  if (!message || sending.value) return
  if (needsSupport(message)) showSupport.value = true
  pip.addChat('user', message)
  draft.value = ''
  fitInput()
  await request()
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function answer(reply) {
  pip.addChat('pip', reply)
  playSound('boop')
  haptic('light')
  pipRef.value?.react('happy')
}

async function request() {
  sending.value = true
  error.value = null
  scrollToEnd()
  const lastMessage = pip.chat[pip.chat.length - 1]?.text ?? ''

  if (mode.value === 'ai') {
    const result = await askPip({
      deviceId: pip.deviceId,
      messages: pip.chat.slice(-16).map((m) => ({ role: m.role, text: m.text })),
      pip: pipState(),
    })
    if (result.ok) {
      sending.value = false
      remaining.value = result.remaining
      answer(result.reply)
      scrollToEnd()
      return
    }
    if (result.reason === 'too-long') {
      sending.value = false
      error.value = { reason: 'too-long' }
      playSound('miss')
      return
    }
    // the AI couldn't answer: Pip's own brain steps in
    if (result.reason === 'not-configured') {
      useBrainFromNowOn()
      mode.value = 'brain'
    } else if (!note.value) {
      note.value = (RESTING[result.reason] ?? RESTING.server)()
    }
  } else {
    // a little pause, so it feels like Pip is thinking
    await wait(650 + Math.random() * 650)
  }

  sending.value = false
  answer(brainReply(lastMessage, pipState()))
  scrollToEnd()
}

function onEnter(e) {
  if (e.shiftKey) return
  e.preventDefault()
  send()
}

function clearChat() {
  if (!confirmClear.value) {
    confirmClear.value = true
    setTimeout(() => (confirmClear.value = false), 3000)
    return
  }
  pip.clearChat()
  confirmClear.value = false
  showSupport.value = false
  error.value = null
}
</script>

<template>
  <Teleport to="body">
    <Transition name="chat">
      <div v-if="open" class="chat fixed inset-0 z-50 flex flex-col bg-cream" role="dialog" aria-modal="true" :aria-label="`Chat with ${name}`">
        <!-- header -->
        <header class="relative z-10 shrink-0 border-b border-line bg-cream/95 px-4 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] backdrop-blur">
          <div class="mx-auto flex max-w-lg items-center gap-3">
            <button type="button" class="icon-btn" aria-label="Back" @click="emit('close')">
              <Icon name="back" :size="19" :stroke="2.2" />
            </button>
            <span class="relative flex h-11 w-11 shrink-0 items-end justify-center overflow-hidden rounded-full bg-leaf-200/70 ring-1 ring-line">
              <span class="aspect-[200/250] h-[2.6rem] translate-y-1">
                <Pip
                  ref="pipRef"
                  :growth="pip.growthValue"
                  :droop="pip.droop"
                  :health="pip.health"
                  :pot="pip.currentPot"
                  :leaf="pip.currentLeaf"
                  :flower="pip.currentFlower"
                  :interactive="false"
                  :idle="false"
                  class="h-full w-full"
                />
              </span>
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-display text-lg font-semibold leading-tight text-bark-600">{{ name }}</p>
              <p class="flex items-center gap-1.5 text-xs font-semibold text-bark-400">
                <span class="h-1.5 w-1.5 rounded-full" :class="sending ? 'bg-honey-400' : 'bg-leaf-400'" />
                {{ status }}
              </p>
            </div>
            <button
              v-if="pip.chat.length"
              type="button"
              class="icon-btn"
              :class="{ 'bg-clay-100! text-clay-400!': confirmClear }"
              :aria-label="confirmClear ? 'Tap again to clear the chat' : 'Clear chat'"
              @click="clearChat"
            >
              <Icon name="trash" :size="17" :stroke="2" />
            </button>
          </div>
          <p v-if="confirmClear" class="mx-auto mt-2 max-w-lg text-right text-xs font-semibold text-clay-400">Tap again to clear the chat</p>
        </header>

        <!-- messages -->
        <div ref="list" class="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div class="mx-auto flex max-w-lg flex-col gap-2.5">
            <div class="bubble pip-bubble">{{ greeting }}</div>

            <div
              v-for="(m, i) in pip.chat"
              :key="`${m.at}-${i}`"
              class="bubble"
              :class="m.role === 'user' ? 'user-bubble' : 'pip-bubble'"
            >
              {{ m.text }}
            </div>

            <!-- real help, whatever the chat says -->
            <div v-if="showSupport" class="support mt-1 rounded-[1.25rem] border border-petal-400/30 bg-petal-100 px-4 py-3.5">
              <p class="text-sm font-bold text-bark-600">You deserve support right now 💛</p>
              <p class="mt-1 text-xs font-medium text-bark-500">
                {{ name }} is a little plant and can’t keep you safe. Please reach out to someone you trust, or:
              </p>
              <ul class="mt-2 space-y-1.5">
                <li v-for="line in SUPPORT_LINES" :key="line.label" class="text-xs text-bark-600">
                  <span class="font-bold">{{ line.label }}:</span>{{ ' ' }}
                  <a v-if="line.href" :href="line.href" target="_blank" rel="noopener" class="underline decoration-petal-400 underline-offset-2">{{ line.detail }}</a>
                  <span v-else>{{ line.detail }}</span>
                </li>
              </ul>
            </div>

            <p v-if="note" class="mx-auto my-1 max-w-[18rem] text-center text-[0.6875rem] font-semibold text-bark-400">{{ note }}</p>

            <div v-if="sending" class="bubble pip-bubble typing" aria-label="Pip is typing">
              <span /><span /><span />
            </div>

            <div v-if="error" class="mt-1 flex items-center justify-between gap-3 rounded-2xl bg-sand-100 px-4 py-3">
              <p class="text-xs font-semibold text-bark-500">{{ ERRORS[error.reason]?.() }}</p>
            </div>

            <!-- conversation starters -->
            <div v-if="!pip.chat.length && !sending" class="mt-2 flex flex-wrap gap-2">
              <button v-for="s in STARTERS" :key="s" type="button" class="chip h-9! px-3.5! text-[0.8125rem]!" @click="send(s)">{{ s }}</button>
            </div>
          </div>
        </div>

        <!-- input -->
        <div class="shrink-0 border-t border-line bg-cream px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <form class="mx-auto flex max-w-lg items-end gap-2" @submit.prevent="send()">
            <label class="flex min-h-12 flex-1 items-center rounded-[1.5rem] border border-line bg-surface px-4 py-2 shadow-soft focus-within:border-leaf-400">
              <textarea
                ref="input"
                v-model="draft"
                rows="1"
                :maxlength="MAX_LENGTH"
                :placeholder="`Say something to ${name}…`"
                class="max-h-28 w-full resize-none bg-transparent text-[0.9375rem] font-medium leading-snug text-bark-600 outline-none placeholder:text-bark-300"
                aria-label="Message"
                @keydown.enter="onEnter"
                @input="fitInput"
              />
            </label>
            <button
              type="submit"
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bark-600 text-[#FFFAF2] shadow-soft transition active:scale-95 disabled:opacity-40"
              :disabled="!draft.trim() || sending"
              aria-label="Send"
              data-sound="none"
            >
              <Icon name="send" :size="20" :stroke="2.4" />
            </button>
          </form>
          <p class="mx-auto mt-2 max-w-lg text-center text-[0.6875rem] font-medium text-bark-300">
            <template v-if="mode === 'ai'">
              {{ name }} is an AI character, not a person or a counsellor.
              <template v-if="remaining !== null && remaining <= 5"> {{ remaining }} smart replies left today.</template>
            </template>
            <template v-else>{{ name }} answers with its own little brain, right here on your phone. Not a counsellor.</template>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bubble {
  max-width: 82%;
  padding: 0.625rem 0.95rem;
  border-radius: 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  animation: bubble-in 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.pip-bubble {
  align-self: flex-start;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-bottom-left-radius: 0.375rem;
  color: var(--color-bark-600);
  box-shadow: var(--shadow-soft);
}
.user-bubble {
  align-self: flex-end;
  background: var(--color-bark-600);
  color: #fffaf2;
  border-bottom-right-radius: 0.375rem;
}
.typing {
  display: inline-flex;
  gap: 0.3rem;
  padding: 0.85rem 1rem;
}
.typing span {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--color-bark-300);
  animation: dot 1.2s ease-in-out infinite;
}
.typing span:nth-child(2) {
  animation-delay: 0.15s;
}
.typing span:nth-child(3) {
  animation-delay: 0.3s;
}
.support {
  animation: bubble-in 0.45s ease both;
}
@keyframes bubble-in {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
@keyframes dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.chat-enter-active,
.chat-leave-active {
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.chat-enter-from,
.chat-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>
