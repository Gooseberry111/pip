<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { playSound } from '@/utils/sound'
import { wakeMusic } from '@/utils/music'
import { scheduleReminders } from '@/services/notifications'
import BottomNavigation from '@/components/BottomNavigation.vue'
import Onboarding from '@/components/Onboarding.vue'

const pip = usePipStore()

// First visit: meet the seed before anything else.
const onboarding = ref(!pip.hasStarted)

const badges = computed(() => ({
  '/collection': pip.unseenCount > 0,
  '/play': pip.canOpenPacket || pip.weeklyClaimable,
}))

// Reschedule gentle reminders whenever something they depend on changes.
function reschedule() {
  scheduleReminders({
    enabled: pip.remindersOn && pip.hasStarted,
    time: pip.reminderTime,
    name: pip.plantName,
    hoursUntilThirsty: pip.hoursToThirsty,
  })
}
watch(() => [pip.remindersOn, pip.reminderTime, pip.plantName, pip.lastWatered, pip.hasStarted], reschedule)

// Every tap makes a soft sound. An element can choose its own with data-sound="name",
// or stay silent with data-sound="none" when it plays something more specific itself.
const TAPPABLE = 'button, a, [role="button"], [role="tab"], [role="switch"], label, summary'

function onTap(e) {
  wakeMusic()
  const el = e.target.closest?.(TAPPABLE)
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return
  const sound = el.closest('[data-sound]')?.dataset.sound ?? 'tap'
  if (sound !== 'none') playSound(sound)
}

// Pip keeps living while the app is open: check in every minute and whenever we come back.
let interval = null

function checkIn() {
  if (document.visibilityState === 'visible') {
    pip.catchUp()
    pip.save()
  } else {
    reschedule()
  }
}

onMounted(() => {
  interval = setInterval(checkIn, 60 * 1000)
  document.addEventListener('visibilitychange', checkIn)
  document.addEventListener('click', onTap, true)
  document.addEventListener('pointerdown', wakeMusic, { once: true })
  reschedule()
})

onBeforeUnmount(() => {
  clearInterval(interval)
  document.removeEventListener('visibilitychange', checkIn)
  document.removeEventListener('click', onTap, true)
})
</script>

<template>
  <div class="relative mx-auto flex min-h-dvh w-full flex-col">
    <main class="flex flex-1 flex-col">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" class="flex-1" />
        </Transition>
      </RouterView>
    </main>
    <BottomNavigation :badges="badges" />
    <Transition name="onboarding">
      <Onboarding v-if="onboarding" @done="onboarding = false" />
    </Transition>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}
.onboarding-leave-active {
  transition: opacity 0.6s ease;
}
.onboarding-leave-to {
  opacity: 0;
}
</style>
