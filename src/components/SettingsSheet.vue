<script setup>
// Settings: sound, music, haptics, renaming, and a gentle way to start again.
import { nextTick, ref, watch } from 'vue'
import { usePipStore } from '@/stores/pip'
import { remindersMode, enableReminders, disableReminders } from '@/services/notifications'
import Icon from './Icon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
const pip = usePipStore()

const name = ref(pip.plantName)
const confirmReset = ref(false)
const input = ref(null)

watch(
  () => props.open,
  (open) => {
    if (open) {
      name.value = pip.plantName
      confirmReset.value = false
    }
  },
)

function saveName() {
  if (name.value.trim() && name.value !== pip.plantName) pip.rename(name.value)
  name.value = pip.plantName
}

async function focusName() {
  await nextTick()
  input.value?.select()
}

const mode = remindersMode()
const permissionNote = ref('')
const working = ref(false)

const REASONS = {
  denied: 'Notifications are turned off for Pip. You can allow them in your phone’s settings.',
  install: 'On iPhone, add Pip to your Home Screen first (Share, then Add to Home Screen), and open it from there.',
  unsupported: 'This browser can’t show reminders. Try Chrome on Android, or Pip on your iPhone Home Screen.',
  server: 'Couldn’t reach Pip’s reminder service just now. Please try again in a moment.',
}
const TIMES = [
  { value: '09:00', label: 'Morning' },
  { value: '13:00', label: 'Midday' },
  { value: '19:00', label: 'Evening' },
  { value: '21:00', label: 'Night' },
]

async function toggleReminders() {
  if (working.value) return
  permissionNote.value = ''
  if (pip.remindersOn) {
    pip.setReminders(false)
    await disableReminders()
    return
  }
  working.value = true
  const result = await enableReminders({ time: pip.reminderTime, name: pip.plantName, hoursUntilThirsty: pip.hoursToThirsty })
  working.value = false
  if (!result.ok) {
    permissionNote.value = REASONS[result.reason] ?? REASONS.server
    return
  }
  pip.setReminders(true)
}

async function reset() {
  if (!confirmReset.value) {
    confirmReset.value = true
    return
  }
  await pip.devReset()
  window.location.reload()
}

const ROWS = [
  { key: 'soundOn', label: 'Sound effects', hint: 'Taps, pops and chimes', icon: 'sound-on', tint: '#E2EEF2', color: '#568BA1', toggle: () => pip.toggleSound() },
  { key: 'musicOn', label: 'Music', hint: 'Gentle tunes at home and in games', icon: 'music', tint: '#EEE7F3', color: '#8C7FB5', toggle: () => pip.toggleMusic() },
  { key: 'hapticsOn', label: 'Haptics', hint: 'Little taps you can feel', icon: 'vibrate', tint: '#F8E3D8', color: '#C97858', toggle: () => pip.toggleHaptics() },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="scrim absolute inset-0" @click="emit('close')" />
        <div class="panel relative w-full max-w-md rounded-t-[2rem] bg-cream px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:rounded-[2rem]">
          <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-sand-300 sm:hidden" />
          <div class="flex items-center justify-between">
            <h2 class="title-xl text-[1.6rem]!">Settings</h2>
            <button type="button" class="icon-btn" aria-label="Close" @click="emit('close')"><Icon name="close" :size="18" /></button>
          </div>

          <p class="eyebrow mt-5 px-1">Sound and feel</p>
          <div class="card mt-2 divide-y divide-line overflow-hidden">
            <button
              v-for="row in ROWS"
              :key="row.key"
              type="button"
              role="switch"
              :aria-checked="pip[row.key]"
              :data-sound="pip[row.key] ? 'toggleOff' : 'toggleOn'"
              class="flex min-h-16 w-full items-center gap-3.5 px-4 text-left"
              @click="row.toggle()"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :style="{ background: row.tint, color: row.color }">
                <Icon :name="row.icon" :size="18" :stroke="2" />
              </span>
              <span class="flex-1">
                <span class="block text-[0.9375rem] font-bold text-bark-600">{{ row.label }}</span>
                <span class="block text-xs font-medium text-bark-400">{{ row.hint }}</span>
              </span>
              <span class="switch" :class="{ 'is-on': pip[row.key] }" aria-hidden="true"><span /></span>
            </button>
          </div>

          <p class="eyebrow mt-6 px-1">Gentle reminders</p>
          <div class="card mt-2 divide-y divide-line overflow-hidden">
            <button
              type="button"
              role="switch"
              :aria-checked="pip.remindersOn"
              :aria-busy="working"
              :data-sound="pip.remindersOn ? 'toggleOff' : 'toggleOn'"
              class="flex min-h-16 w-full items-center gap-3.5 px-4 text-left"
              @click="toggleReminders"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-honey-100 text-clay-400">
                <Icon name="bell" :size="18" :stroke="2" />
              </span>
              <span class="flex-1">
                <span class="block text-[0.9375rem] font-bold text-bark-600">Reminders</span>
                <span class="block text-xs font-medium text-bark-400">A kind nudge, and a heads up when {{ pip.plantName }} gets thirsty</span>
              </span>
              <span class="switch" :class="{ 'is-on': pip.remindersOn }" aria-hidden="true"><span /></span>
            </button>
            <div v-if="pip.remindersOn" class="px-4 py-3.5">
              <p class="text-xs font-bold text-bark-400">Daily hello</p>
              <div class="segmented mt-2">
                <button
                  v-for="t in TIMES"
                  :key="t.value"
                  type="button"
                  role="tab"
                  class="flex-1"
                  :aria-selected="pip.reminderTime === t.value"
                  @click="pip.setReminders(true, t.value)"
                >
                  {{ t.label }}
                </button>
              </div>
              <p class="mt-2.5 text-xs font-medium text-bark-400">
                Quiet between 10pm and 8am. No hello if you’ve already visited that day.
              </p>
            </div>
            <p v-if="permissionNote" class="px-4 py-3 text-xs font-semibold text-clay-400">{{ permissionNote }}</p>
            <p v-else-if="!pip.remindersOn && mode === 'install'" class="px-4 py-3 text-xs font-semibold text-bark-400">
              To get reminders on iPhone, add Pip to your Home Screen first.
            </p>
            <button
              type="button"
              role="switch"
              :aria-checked="pip.checkinOn"
              :data-sound="pip.checkinOn ? 'toggleOff' : 'toggleOn'"
              class="flex min-h-16 w-full items-center gap-3.5 px-4 text-left"
              @click="pip.toggleCheckin()"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-petal-100 text-petal-500">
                <Icon name="smile" :size="18" :stroke="2" />
              </span>
              <span class="flex-1">
                <span class="block text-[0.9375rem] font-bold text-bark-600">Daily check-in</span>
                <span class="block text-xs font-medium text-bark-400">{{ pip.plantName }} asks how you are, once a day</span>
              </span>
              <span class="switch" :class="{ 'is-on': pip.checkinOn }" aria-hidden="true"><span /></span>
            </button>
          </div>

          <p class="eyebrow mt-6 px-1">Your plant</p>
          <div class="card mt-2 divide-y divide-line overflow-hidden">
            <label class="flex min-h-16 items-center gap-3.5 px-4" @click="focusName">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-200 text-leaf-500">
                <Icon name="pencil" :size="17" :stroke="2" />
              </span>
              <span class="flex-1">
                <span class="block text-xs font-medium text-bark-400">Name</span>
                <input
                  ref="input"
                  v-model="name"
                  maxlength="16"
                  class="w-full bg-transparent text-[0.9375rem] font-bold text-bark-600 outline-none"
                  aria-label="Plant name"
                  @blur="saveName"
                  @keydown.enter="$event.target.blur()"
                />
              </span>
            </label>
            <button type="button" class="flex min-h-16 w-full items-center gap-3.5 px-4 text-left" @click="reset">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay-100 text-clay-400">
                <Icon name="refresh" :size="17" :stroke="2" />
              </span>
              <span class="flex-1">
                <span class="block text-[0.9375rem] font-bold" :class="confirmReset ? 'text-clay-400' : 'text-bark-600'">
                  {{ confirmReset ? 'Tap again to start over' : 'Start over' }}
                </span>
                <span class="block text-xs font-medium text-bark-400">
                  {{ confirmReset ? `This plants a brand new seed. ${pip.plantName} and your treasures will be gone.` : 'Plant a fresh seed' }}
                </span>
              </span>
            </button>
          </div>

          <p class="mt-6 text-center text-xs font-medium text-bark-300">Pip · a little plant to care for, one day at a time</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scrim {
  background: rgb(41 31 24 / 0.28);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.switch {
  position: relative;
  width: 2.75rem;
  height: 1.625rem;
  border-radius: 999px;
  background: var(--color-sand-300);
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}
.switch > span {
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  transition: transform 0.25s cubic-bezier(0.3, 0.8, 0.3, 1);
}
.switch.is-on {
  background: var(--color-leaf-400);
}
.switch.is-on > span {
  transform: translateX(1.125rem);
}
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-enter-active .panel,
.sheet-leave-active .panel {
  transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .panel,
.sheet-leave-to .panel {
  transform: translateY(40px);
}
</style>
