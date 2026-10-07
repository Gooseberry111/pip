<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePipStore } from '@/stores/pip'
import { useFarmStore } from '@/stores/farm'
import { DRINK_SLOTS } from '@/utils/plantLogic'
import { GOODS } from '@/data/farm'
import GoodIcon from '@/components/farm/GoodIcon.vue'
import { personality } from '@/utils/badges'
import { getDayPhase, getGreeting, daysTogether } from '@/utils/timeOfDay'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import {
  STATUS_HEADLINES,
  STATUS_MESSAGES,
  WATERED_MESSAGES,
  RECOVERING_MESSAGES,
  FULL_MESSAGES,
  GROWTH_MESSAGES,
  WELCOME_BACK,
  AWAY_GROWTH_MESSAGE,
  GENTLE_MESSAGES,
  TAP_MESSAGES,
  TRAIT_MESSAGES,
  PET_MESSAGES,
  WAKE_MESSAGES,
  SLEEP_MESSAGE,
  NIGHT_MESSAGES,
  MORNING_MESSAGES,
  pick,
} from '@/data/messages'
import { GIFT_MESSAGES } from '@/data/daily'
import Pip from '@/components/Pip.vue'
import PipStatus from '@/components/PipStatus.vue'
import PipLogo from '@/components/PipLogo.vue'
import HomeStage from '@/components/HomeStage.vue'
import GiftBox from '@/components/GiftBox.vue'
import WaterButton from '@/components/WaterButton.vue'
import GrowthProgress from '@/components/GrowthProgress.vue'
// these open later, so they load just after Home appears
const LevelUpMoment = defineAsyncComponent(() => import('@/components/LevelUpMoment.vue'))
import WaterDrops from '@/components/WaterDrops.vue'
import Sparkles from '@/components/Sparkles.vue'
import Floaters from '@/components/Floaters.vue'
import PetalBadge from '@/components/PetalBadge.vue'
import DecorationArt from '@/components/art/DecorationArt.vue'
import Icon from '@/components/Icon.vue'
const SettingsSheet = defineAsyncComponent(() => import('@/components/SettingsSheet.vue'))
const MoodCheckin = defineAsyncComponent(() => import('@/components/MoodCheckin.vue'))
const FactCard = defineAsyncComponent(() => import('@/components/FactCard.vue'))
const ChatSheet = defineAsyncComponent(() => import('@/components/ChatSheet.vue'))

const pip = usePipStore()
const farm = useFarmStore()

const pipRef = ref(null)
const floaters = ref(null)
const message = ref('')
const busy = ref(false)
const watering = ref(false)
const wet = ref(false)
const sparkling = ref(false)
const sleeping = ref(false)
const phase = ref(getDayPhase())
const levelUp = ref(null) // { level, newStage, unlocks } shown in the level up moment
const pokes = ref({})
const route = useRoute()
const router = useRouter()

// Settings is part of the page history, so the back button (or the phone's back gesture)
// takes you back to exactly where you were.
const settingsOpen = computed(() => route.query.settings === '1')

function openSettings() {
  router.push({ query: { ...route.query, settings: '1' } })
}

function closeSettings() {
  if (window.history.state?.back) router.back()
  else router.replace({ query: {} })
}

// Talking to Pip also lives in the page history, so back returns here.
const chatOpen = computed(() => route.query.chat === '1')
const chatPrefill = ref('')

function openChat(prefill = '') {
  chatPrefill.value = prefill
  router.push({ query: { ...route.query, chat: '1' } })
}

function closeChat() {
  chatPrefill.value = ''
  if (window.history.state?.back) router.back()
  else router.replace({ query: {} })
}

// Did you know? A new fact each morning and evening.
const shownFact = ref(null)

function openFact() {
  shownFact.value = pip.readFact()
  haptic('light')
}

function askAboutFact(fact) {
  shownFact.value = null
  setTimeout(() => openChat(`I just learned: “${fact.text}” Tell me more!`), 250)
}
const checkinOpen = ref(false)

const timers = new Set()
function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
  return id
}

// ---- night: Pip sleeps from 10pm to 7am, and wakes for a little while when you tap ----
const nightAwake = ref(false)
let nightTimer = null
const asleepNow = computed(() => sleeping.value || (pip.asleep && !nightAwake.value))

function wakeForNight() {
  if (!pip.asleep || nightAwake.value) return false
  nightAwake.value = true
  clearTimeout(nightTimer)
  nightTimer = later(() => (nightAwake.value = false), 45000)
  pipRef.value?.react('stretch')
  say('Mmm? Oh, hello. It’s sleepy time, but I’m glad you’re here.', 4500)
  return true
}

const DRINK_THANKS = {
  morning: 'A fresh morning drink. Thank you!',
  afternoon: 'Just what I needed this afternoon.',
  night: 'A cosy drink before bed. Thank you!',
}
const drinkLabel = computed(() =>
  DRINK_SLOTS.map((s) => `${s.label}: ${pip.drinksToday[s.id] ? 'had a drink' : 'not yet'}`).join(', '),
)

// ---- Pip's wish from the farm ----
const wish = computed(() => (farm.wish && !farm.wish.done ? farm.wish.good : null))
const wishInBarn = computed(() => wish.value && (farm.state.barn[wish.value] ?? 0) > 0)

function grantWish() {
  onActivity()
  if (!wishInBarn.value) {
    say(`I’d love a ${GOODS[wish.value].name.toLowerCase()}. Could you grow one on the farm?`, 4500)
    return
  }
  const r = farm.feedPip(wish.value)
  if (!r) return
  pipRef.value?.react('happy')
  haptic('success')
  sparkling.value = true
  later(() => (sparkling.value = false), 1600)
  say('My wish came true! You’re the best.', 5000)
  later(() => showPetals(8), 500)
}

// ---- words ----
const greeting = computed(() => getGreeting())
const headline = computed(() => STATUS_HEADLINES[pip.health].replace('Pip', pip.plantName))
const days = computed(() => daysTogether(pip.startedAt))
const sound = (name, opts) => playSound(name, pip.soundOn, opts)

let settleTimer = null
function say(text, holdMs = 5200) {
  message.value = text
  clearTimeout(settleTimer)
  settleTimer = later(() => {
    message.value = sleeping.value ? SLEEP_MESSAGE : pick(STATUS_MESSAGES[pip.health])
  }, holdMs)
}

// ---- decorations on the shelf ----
const shelfDecorations = computed(() => {
  const ground = pip.currentDecorations.filter((d) => !['butterfly', 'rainbow'].includes(d))
  const spots = pip.giftWaiting ? ['right: 4%', 'right: 19%'] : ['right: 5%', 'left: 5%']
  return ground.slice(0, 2).map((id, i) => ({ id, style: spots[i] }))
})
const hasButterfly = computed(() => pip.currentDecorations.includes('butterfly'))
const hasRainbow = computed(() => pip.currentDecorations.includes('rainbow'))

function poke(id) {
  pokes.value = { ...pokes.value, [id]: (pokes.value[id] ?? 0) + 1 }
  sound('boop')
  haptic('light')
  onActivity()
}

// ---- sleeping when left alone for a while (sooner at night) ----
let sleepTimer = null

function resetSleep() {
  clearTimeout(sleepTimer)
  sleepTimer = later(() => {
    if (busy.value) return resetSleep()
    sleeping.value = true
    message.value = SLEEP_MESSAGE
  }, phase.value === 'night' ? 25000 : 50000)
}

function wake() {
  if (!sleeping.value) return false
  sleeping.value = false
  pipRef.value?.react('stretch')
  say(pick(WAKE_MESSAGES), 3500)
  return true
}

function onActivity() {
  resetSleep()
}

// ---- petals floating up ----
function showPetals(amount, at = { x: 50, y: 30 }) {
  if (!amount) return
  floaters.value?.spawn({ ...at, kind: 'petals', text: `+${amount}` })
  sound('petals')
}

// ---- watering ----
function water() {
  if (busy.value) return
  onActivity()
  wake()
  if (pip.asleep) {
    nightAwake.value = true
    clearTimeout(nightTimer)
    nightTimer = later(() => (nightAwake.value = false), 45000)
  }
  pip.catchUp()
  haptic('light')

  if (pip.isFull) {
    pipRef.value?.react('wiggle')
    say(pick(FULL_MESSAGES), 4000)
    return
  }

  busy.value = true
  watering.value = true
  sound('water')

  later(() => {
    const result = pip.water()
    wet.value = true
    later(() => (wet.value = false), 7000)
    pipRef.value?.react('happy')
    haptic('soft')
    const recovering = result.wasHealth === 'wilting' || result.health === 'wilting'
    const drink = result.drink
    if (drink?.perfect) say('Morning, afternoon and night. A perfect day of drinks!', 6000)
    else if (drink) say(DRINK_THANKS[drink.slot])
    else say(pick(recovering ? RECOVERING_MESSAGES : WATERED_MESSAGES))
    later(() => showPetals((result.reward ?? 0) + (drink?.petals ?? 0)), 500)
    if (drink?.perfect) {
      sparkling.value = true
      later(() => (sparkling.value = false), 1800)
    }
    if (result.leveledUp) later(() => celebrate(result), 1400)
    else later(() => (busy.value = false), 900)
  }, 1050)

  later(() => (watering.value = false), 1950)
}

// ---- growing ----
function celebrate(result, text) {
  busy.value = true
  sparkling.value = true
  pipRef.value?.react('grow')
  sound('grow')
  haptic('success')
  say(text ?? pick(GROWTH_MESSAGES), 6000)
  later(() => (sparkling.value = false), 1800)
  later(() => {
    busy.value = false
    // every new level gets its moment, with whatever it unlocked (after the check-in, if it's open)
    const moment = { level: pip.growthLevel, newStage: result.newStage ?? null, unlocks: result.unlocks ?? [] }
    if (checkinOpen.value) pendingLevelUp = moment
    else levelUp.value = moment
  }, 1500)
}

let pendingLevelUp = null

function closeLevelUp() {
  const hadStyle = levelUp.value?.unlocks?.some((i) => ['pots', 'leaves', 'flowers'].includes(i.category))
  levelUp.value = null
  if (hadStyle) later(() => pipRef.value?.react('happy'), 300)
}

// ---- today's gift ----
function openGift() {
  onActivity()
  wake()
  const amount = pip.claimGift()
  haptic('success')
  showPetals(amount, { x: 22, y: 70 })
  sparkling.value = true
  later(() => (sparkling.value = false), 1600)
  pipRef.value?.react('happy')
  say(pick(GIFT_MESSAGES), 5000)
}

// ---- tapping and petting Pip ----
function onTapPip() {
  onActivity()
  if (wakeForNight()) return
  if (wake()) return
  if (busy.value) return
  sound('boop')
  haptic('light')
  pipRef.value?.react('wiggle')
  floaters.value?.spawn({ x: 50 + (Math.random() * 20 - 10), y: 40, kind: 'heart' })
  const traits = personality(pip).traits
  const roll = Math.random()
  if (traits.length && roll < 0.3) say(pick(TRAIT_MESSAGES[traits[Math.floor(Math.random() * traits.length)].id]), 3800)
  else say(roll < 0.5 ? pick(GENTLE_MESSAGES) : pick(TAP_MESSAGES), 3500)
  later(() => showPetals(pip.completeTask('pet'), { x: 60, y: 30 }), 400)
}

let lastPet = 0
function onPetPip() {
  onActivity()
  if (sleeping.value) wake()
  const now = Date.now()
  floaters.value?.spawn({ x: 40 + Math.random() * 20, y: 38 + Math.random() * 10, kind: 'heart' })
  haptic('light')
  if (now - lastPet > 1500) {
    pipRef.value?.react('pet')
    sound('boop')
    say(pick(PET_MESSAGES), 3500)
    later(() => showPetals(pip.completeTask('pet'), { x: 60, y: 30 }), 400)
  }
  lastPet = now
}

// Growth that happened on its own (time passing, or rain from a game).
watch(
  () => pip.pendingCelebration,
  (result) => {
    if (!result) return
    pip.clearCelebration()
    later(() => celebrate(result), busy.value ? 2500 : 600)
  },
  { immediate: true },
)

// Words settle with Pip's health when it changes on its own.
watch(
  () => pip.health,
  () => {
    if (!busy.value && !sleeping.value) say(pick(STATUS_MESSAGES[pip.health]), 6000)
  },
)

// Right after the seed is planted, Pip points out today's gift.
watch(
  () => pip.giftWaiting,
  (waiting) => {
    if (waiting && !busy.value) later(() => say('I have something for you.', 6000), 800)
  },
)

// Once a day, Pip gently asks how you are. Not in the first few minutes after planting.
function maybeCheckin() {
  const settled = pip.startedAt && Date.now() - pip.startedAt > 10 * 60 * 1000
  if (settled && pip.checkinWaiting && !levelUp.value && !checkinOpen.value) later(() => (checkinOpen.value = true), 900)
}

function closeCheckin() {
  checkinOpen.value = false
  if (pendingLevelUp) {
    const moment = pendingLevelUp
    pendingLevelUp = null
    later(() => (levelUp.value = moment), 500)
    return
  }
  const mood = pip.daily.mood
  if (mood && mood !== 'skipped') later(() => say(['great', 'good'].includes(mood) ? 'Let’s have a lovely day.' : 'I’m here whenever you need me.', 4500), 500)
}

let phaseTimer = null

onMounted(() => {
  const welcome = pip.welcome
  if (welcome) {
    pip.clearWelcome()
    say(WELCOME_BACK[welcome.health], 4500)
    if (welcome.grewWhileAway) later(() => celebrate({ unlocks: welcome.unlocks }, AWAY_GROWTH_MESSAGE), 1600)
  } else if (pip.giftWaiting) {
    say('I have something for you.', 6000)
  } else if (phase.value === 'night' && Math.random() < 0.5) {
    say(pick(NIGHT_MESSAGES), 5000)
  } else if (phase.value === 'dawn' && Math.random() < 0.5) {
    say(pick(MORNING_MESSAGES), 5000)
  } else if (Math.random() < 0.3) {
    say(pick(GENTLE_MESSAGES), 5000)
  } else {
    message.value = pick(STATUS_MESSAGES[pip.health])
  }
  resetSleep()
  maybeCheckin()
  window.addEventListener('pointerdown', onActivity)
  phaseTimer = setInterval(() => (phase.value = getDayPhase()), 60000)
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  clearInterval(phaseTimer)
  window.removeEventListener('pointerdown', onActivity)
})
</script>

<template>
  <section class="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
    <!-- top bar -->
    <div class="flex items-center justify-between px-1 pt-1">
      <PipLogo :size="28" />
      <div class="flex items-center gap-2">
        <PetalBadge :count="pip.petals" size="sm" />
        <RouterLink to="/journal" class="icon-btn" aria-label="Journal">
          <Icon name="book" :size="18" :stroke="2" />
        </RouterLink>
        <button
          type="button"
          class="icon-btn"
          :aria-label="pip.musicOn ? 'Mute music' : 'Play music'"
          :aria-pressed="!pip.musicOn"
          :data-sound="pip.musicOn ? 'toggleOff' : 'toggleOn'"
          @click="pip.toggleMusic()"
        >
          <Icon :name="pip.musicOn ? 'music' : 'music-off'" :size="17" :stroke="2" />
        </button>
        <button type="button" class="icon-btn" aria-label="Settings" @click="openSettings">
          <Icon name="settings" :size="18" :stroke="2" />
        </button>
      </div>
    </div>

    <!-- greeting -->
    <header class="mt-4 px-1">
      <p class="eyebrow">{{ greeting }}</p>
      <Transition name="fade" mode="out-in">
        <h1 :key="headline" class="title-xl mt-1 text-[1.7rem]!">{{ headline }}</h1>
      </Transition>
      <div class="mt-2.5 flex flex-wrap items-center gap-2">
        <span class="chip border-leaf-300! bg-leaf-200/60! text-leaf-500!" :aria-label="`Level ${pip.growthLevel}, ${pip.stage.name.replace('Pip', pip.plantName)}`">
          <svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 18V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M10 10C8 5 3 4 2 6c2 4 6 5 8 4Z M10 9c2-5 7-6 8-4-2 4-6 5-8 4Z" fill="currentColor" />
          </svg>
          Level {{ pip.growthLevel }} · {{ pip.stage.name.replace('Pip', pip.plantName) }}
        </span>
        <span class="chip">
          <Icon name="heart" :size="13" :stroke="2.2" class="text-petal-400" />
          Day {{ days }}
        </span>
        <button
          v-if="pip.factWaiting"
          type="button"
          class="fact-chip chip border-honey-400/40! bg-honey-100! text-clay-400!"
          data-sound="select"
          @click="openFact"
        >
          <Icon name="sparkle" :size="13" :stroke="2.2" />
          Did you know?
          <span class="h-1.5 w-1.5 rounded-full bg-clay-300" />
        </button>
        <span class="chip gap-1! pl-2!" :aria-label="`Drinks today. ${drinkLabel}`">
          <span
            v-for="s in DRINK_SLOTS"
            :key="s.id"
            class="drink relative flex h-5 w-5 items-center justify-center rounded-full"
            :class="{ 'is-done': pip.drinksToday[s.id], 'is-now': pip.slotNow.slot === s.id && !pip.drinksToday[s.id] }"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
              <template v-if="s.id === 'morning'">
                <path d="M3 14 H17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                <path d="M5.5 14 A4.5 4.5 0 0 1 14.5 14Z" fill="#F2B544" />
                <path d="M10 5.5 V7.5 M4.5 8 L5.8 9.2 M15.5 8 L14.2 9.2" stroke="#F2B544" stroke-width="1.5" stroke-linecap="round" />
              </template>
              <template v-else-if="s.id === 'afternoon'">
                <circle cx="10" cy="10" r="4" fill="#F2C66B" />
                <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" stroke="#F2C66B" stroke-width="1.5" stroke-linecap="round" />
              </template>
              <path v-else d="M14.5 13.2A6 6 0 0 1 7 4.5a6 6 0 1 0 7.5 8.7Z" fill="#8E9AB4" />
            </svg>
            <span v-if="pip.drinksToday[s.id]" class="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-water-400 text-[0.4rem] text-white">✓</span>
          </span>
        </span>
        <RouterLink v-if="farm.readyCount" to="/farm" class="chip border-leaf-300! bg-surface! text-leaf-500!">
          🧺 {{ farm.readyCount }} ready on the farm
        </RouterLink>
      </div>
    </header>

    <!-- Pip's corner -->
    <HomeStage :phase="phase" class="relative mt-4 min-h-[15rem] flex-1">
      <div class="absolute inset-x-3 top-3 z-10">
        <PipStatus :message="message" />
      </div>

      <svg v-if="hasRainbow" viewBox="-30 -30 60 32" class="absolute left-[5%] top-[24%] w-[26%] opacity-90" aria-hidden="true">
        <DecorationArt decoration="rainbow" :poke="pokes.rainbow ?? 0" />
      </svg>

      <div v-if="pip.giftWaiting" class="absolute bottom-[15%] left-[6%] z-10 aspect-[60/64] w-[17%]" data-sound="none">
        <GiftBox @open="openGift" />
      </div>

      <button
        v-for="deco in shelfDecorations"
        :key="deco.id"
        type="button"
        class="absolute bottom-[15.5%] z-10 aspect-[56/50] w-[15%]"
        :style="deco.style"
        :aria-label="deco.id"
        data-sound="none"
        @click="poke(deco.id)"
      >
        <svg viewBox="-28 -46 56 50" class="h-full w-full overflow-visible">
          <DecorationArt :decoration="deco.id" :poke="pokes[deco.id] ?? 0" />
        </svg>
      </button>

      <button
        v-if="hasButterfly"
        type="button"
        class="butterfly absolute right-[12%] top-[30%] z-10 aspect-square w-[11%]"
        aria-label="butterfly"
        data-sound="none"
        @click="poke('butterfly')"
      >
        <svg viewBox="-18 -30 36 32" class="h-full w-full overflow-visible">
          <DecorationArt decoration="butterfly" :poke="pokes.butterfly ?? 0" />
        </svg>
      </button>

      <div class="absolute bottom-[12.5%] left-1/2 aspect-[200/250] h-[64%] max-w-[80%] -translate-x-1/2">
        <Pip
          ref="pipRef"
          :growth="pip.growthValue"
          :droop="pip.droop"
          :health="pip.health"
          :pot="pip.currentPot"
          :leaf="pip.currentLeaf"
          :flower="pip.currentFlower"
          :accessory="pip.currentAccessory"
          :sleeping="asleepNow"
          :wet="wet"
          class="h-full w-full"
          @tap="onTapPip"
          @pet="onPetPip"
        />
        <WaterDrops :active="watering" />
        <Sparkles :active="sparkling" />
        <Floaters ref="floaters" />
      </div>

      <!-- Pip's wish -->
      <button
        v-if="wish"
        type="button"
        class="wish absolute bottom-[3.5%] left-3 z-20 inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface/95 pl-1.5 pr-3.5 text-[0.8125rem] font-bold text-bark-600 shadow-soft backdrop-blur"
        :class="{ 'is-ready': wishInBarn }"
        data-sound="none"
        @click="grantWish"
      >
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-honey-100"><GoodIcon :id="wish" :size="20" /></span>
        {{ wishInBarn ? 'Give the wish' : 'A wish' }}
      </button>

      <!-- talk to Pip -->
      <button
        type="button"
        class="talk absolute bottom-[3.5%] right-3 z-20 inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3.5 text-[0.8125rem] font-bold text-bark-600 shadow-soft backdrop-blur"
        @click="openChat()"
      >
        <Icon name="chat" :size="17" :stroke="2" class="text-leaf-500" />
        Talk to {{ pip.plantName }}
      </button>
    </HomeStage>

    <!-- care -->
    <div class="flex flex-col items-center gap-4 pt-4">
      <WaterButton
        :name="pip.plantName"
        :busy="busy"
        :full="pip.isFull"
        :inviting="pip.health !== 'healthy'"
        @water="water"
      />
      <GrowthProgress
        :stage-index="pip.stageIndex"
        :stage-percent="pip.stagePercent"
        :name="pip.plantName"
        :level="pip.growthLevel"
        :level-percent="pip.levelPercent"
      />
    </div>

    <LevelUpMoment :moment="levelUp" @close="closeLevelUp" />
    <SettingsSheet :open="settingsOpen" @close="closeSettings" />
    <MoodCheckin :open="checkinOpen" @close="closeCheckin" />
    <FactCard :fact="shownFact" @close="shownFact = null" @ask="askAboutFact" />
    <ChatSheet :open="chatOpen" :prefill="chatPrefill" @close="closeChat" />
  </section>
</template>

<style scoped>
.butterfly {
  animation: flutter-path 10s ease-in-out infinite;
}
.drink {
  filter: grayscale(1);
  opacity: 0.4;
  color: var(--color-bark-300);
}
.drink.is-done {
  filter: none;
  opacity: 1;
}
.drink.is-now {
  filter: none;
  opacity: 1;
  box-shadow: 0 0 0 2px rgb(111 163 184 / 0.55);
  animation: chip-glow 2.6s ease-in-out infinite;
}
.wish.is-ready {
  animation: chip-glow 2.2s ease-in-out infinite;
  border-color: var(--color-honey-400);
}
.fact-chip {
  animation: chip-glow 2.6s ease-in-out infinite;
}
@keyframes chip-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgb(233 181 79 / 0.35); }
  50% { box-shadow: 0 0 0 5px rgb(233 181 79 / 0); }
}
@keyframes flutter-path {
  0%, 100% { transform: translate(0, 0) rotate(-4deg); }
  25% { transform: translate(-14px, -10px) rotate(4deg); }
  50% { transform: translate(-26px, 6px) rotate(-2deg); }
  75% { transform: translate(-8px, 12px) rotate(5deg); }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .butterfly {
    animation: none;
  }
}
</style>
