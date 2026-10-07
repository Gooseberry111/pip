<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePipStore } from '@/stores/pip'
import { useFarmStore } from '@/stores/farm'
import { startFarmSync } from '@/services/farmSync'
import { startBackups } from '@/services/backup'
import { startCommunity } from '@/services/community'
import { GOODS } from '@/data/farm'
import { playSound } from '@/utils/sound'
import { wakeMusic } from '@/utils/music'
import { scheduleReminders } from '@/services/notifications'
import BottomNavigation from '@/components/BottomNavigation.vue'
import BadgeEarned from '@/components/BadgeEarned.vue'
import { badgeList } from '@/utils/badges'
import Onboarding from '@/components/Onboarding.vue'

const pip = usePipStore()
const farm = useFarmStore()

// First visit: meet the seed before anything else.
const onboarding = ref(!pip.hasStarted)

const badges = computed(() => ({
  '/collection': pip.unseenCount > 0,
  '/play': pip.canOpenPacket || pip.weeklyClaimable,
  '/farm': farm.readyCount > 0 || farm.ordersReady > 0,
}))

// badges: award each one as it's earned, and show them one at a time
const badgeShown = ref(null)
const badgeQueue = []
let badgeTimer = null
const readyBadges = computed(() => (pip.hasStarted ? badgeList(pip, farm).filter((b) => b.ready) : []))
watch(
  readyBadges,
  (list) => {
    for (const b of list) {
      const gift = pip.awardBadge(b)
      // a few celebrations in a row at most; the rest are awarded quietly (they're in the journal)
      if (gift && badgeQueue.length < 3) badgeQueue.push({ ...b, gift })
    }
    if (!badgeShown.value && badgeQueue.length && !badgeTimer) badgeTimer = setTimeout(showNextBadge, 1200)
  },
  { immediate: true },
)
function showNextBadge() {
  badgeTimer = null
  if (!badgeShown.value && badgeQueue.length) badgeShown.value = badgeQueue.shift()
}
function closeBadge() {
  badgeShown.value = null
  if (badgeQueue.length && !badgeTimer) badgeTimer = setTimeout(showNextBadge, 500)
}

// friends watered our crops while we were away
const helpNote = ref('')
function onHelps(helps) {
  const names = [...new Set(helps.map((h) => h.from))]
  const who = names.length === 1 ? names[0] : `${names.length} friends`
  helpNote.value = `${who} watered ${helps.length} of your crops 💧`
  setTimeout(() => (helpNote.value = ''), 5000)
}
function onGifts(gifts) {
  const g = gifts[0]
  const more = gifts.length > 1 ? ` and ${gifts.length - 1} more` : ''
  setTimeout(() => {
    helpNote.value = `${g.from} sent you ${g.n} ${GOODS[g.good]?.name.toLowerCase() ?? 'treats'}${more} 🎁`
    setTimeout(() => (helpNote.value = ''), 5000)
  }, helpNote.value ? 5200 : 0)
}

// Reschedule gentle reminders whenever something they depend on changes.
function reschedule() {
  scheduleReminders({
    enabled: pip.remindersOn && pip.hasStarted,
    time: pip.reminderTime,
    name: pip.plantName,
    hoursUntilThirsty: pip.hoursToThirsty,
    farmReadyAt: farm.nextReadyAt,
  })
}
watch(() => [pip.remindersOn, pip.reminderTime, pip.plantName, pip.lastWatered, pip.hasStarted, farm.nextReadyAt], reschedule)

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
let farmClock = null
let farmSync = null

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
  farmClock = setInterval(() => farm.tick(), 1000)
  farmSync = startFarmSync(farm, { onHelps, onGifts })
  startCommunity(pip.deviceId)
  startBackups()
  document.addEventListener('visibilitychange', checkIn)
  document.addEventListener('click', onTap, true)
  document.addEventListener('pointerdown', wakeMusic, { once: true })
  reschedule()
})

onBeforeUnmount(() => {
  clearInterval(interval)
  clearInterval(farmClock)
  farmSync?.stop()
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
    <BottomNavigation v-if="!$route.path.startsWith('/visit')" :badges="badges" />
    <Transition name="note">
      <div v-if="helpNote" class="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex justify-center px-4">
        <p class="rounded-full bg-water-500 px-4 py-2 text-sm font-bold text-white shadow-float">{{ helpNote }}</p>
      </div>
    </Transition>
    <BadgeEarned :badge="badgeShown" @close="closeBadge" />
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
.note-enter-active,
.note-leave-active {
  transition: opacity 0.3s ease, transform 0.35s ease;
}
.note-enter-from,
.note-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.onboarding-leave-active {
  transition: opacity 0.6s ease;
}
.onboarding-leave-to {
  opacity: 0;
}
</style>
