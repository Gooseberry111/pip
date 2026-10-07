import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage } from '@/services/storage'
import { ITEMS, DEFAULT_LOADOUT, MAX_DECORATIONS, PACKET_COST, itemsUnlockedAtLevel, packetItems, findItem } from '@/data/items'
import { DAILY_TASKS, todayKey } from '@/data/daily'
import { levelReward } from '@/data/rewards'
import { goalsForWeek, weekKey, GOAL_REWARD, BLOOM_BOX_PETALS } from '@/data/weekly'
import { findMood } from '@/data/moods'
import { factOrder, factSlot, findFact } from '@/data/facts'
import { daysTogether } from '@/utils/timeOfDay'
import { setSoundEnabled } from '@/utils/sound'
import { setMusicEnabled } from '@/utils/music'
import { setHapticsEnabled } from '@/utils/haptics'
import {
  HOUR,
  WATER,
  applyGrowth,
  getDroop,
  getGrowthValue,
  getHealth,
  getLevelPercent,
  getNextStage,
  getStage,
  getStageIndex,
  getStagePercent,
  growthFromWatering,
  hoursUntilThirsty,
  isMaxLevel,
  pourWater,
  simulateTime,
  drinkSlot,
  isAsleep,
  DRINK_REWARD,
  PERFECT_DAY,
} from '@/utils/plantLogic'

const SCHEMA_VERSION = 2

const EQUIP_KEYS = {
  pots: 'currentPot',
  leaves: 'currentLeaf',
  flowers: 'currentFlower',
  backgrounds: 'currentBackground',
  accessories: 'currentAccessory',
}

function freshDaily() {
  return { date: todayKey(), done: [], giftClaimed: false, mood: null }
}

function freshWeekly() {
  return { key: weekKey(), progress: {}, claimed: [], boxClaimed: false }
}

const JOURNAL_LIMIT = 300
const CHAT_LIMIT = 60 // messages kept on the phone

function newDeviceId() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
const GAME_NAMES = {
  burst: 'Bloom Burst',
  tac: 'Garden Tac Toe',
  checkers: 'Garden Checkers',
  words: 'Picture Words',
  search: 'Word Search',
  pop: 'Petal Pop',
  hotel: 'Bug Hotel',
  race: 'Snail Race',
  rhythm: 'Rain Rhythm',
  rain: 'Raindrop Catch',
  memory: 'Seed Memory',
  firefly: 'Firefly Night',
  glide: 'Seed Glide',
  puzzle: 'Bloom Puzzle',
}
const MILESTONE_DAYS = [7, 30, 100, 365]

function freshPip(now = Date.now()) {
  return {
    plantName: 'Pip',
    growthLevel: 1,
    growthProgress: 0,
    health: 'healthy',
    waterLevel: 75,
    lastWatered: null,
    lastUpdated: now,
    createdAt: now,
    startedAt: null, // set when the seed is planted during onboarding
    ...DEFAULT_LOADOUT,
    currentDecorations: [],
    unlockedPots: ['terracotta'],
    unlockedLeaves: ['classic'],
    unlockedFlowers: [],
    unlockedDecorations: [],
    unlockedBackgrounds: ['windowsill'],
    unlockedAccessories: [],
    stats: {}, // everything ever done, for badges and Pip's personality
    badges: [], // badge ids earned
    unseenItems: [],
    petals: 0,
    daily: freshDaily(),
    bestScores: { rain: 0, memory: 0, song: 0 },
    levels: {}, // { game: { unlocked: 1, stars: { 1: 3 } } }
    introSeen: {}, // games whose how-to-play card has been shown
    journal: [], // little moments, newest first
    weekly: freshWeekly(),
    factsSeen: [], // fact ids, in the order they were read
    lastFactSlot: null, // the 3 hour window of the last fact read
    chat: [], // { role: 'user' | 'pip', text, at }
    deviceId: newDeviceId(), // anonymous, only used for the daily chat limit
    soundOn: true,
    musicOn: true,
    hapticsOn: true,
    remindersOn: false,
    reminderTime: '19:00',
    checkinOn: true,
    drinks: { day: '', morning: false, afternoon: false, night: false }, // today's three drinks
    calmMotion: false, // fewer animations
    textSize: 'normal', // normal | large | larger
  }
}

export const usePipStore = defineStore('pip', () => {
  // ---- state (mirrors the saved data model) ----
  const plantName = ref('Pip')
  const growthLevel = ref(1)
  const growthProgress = ref(0)
  const health = ref('healthy')
  const waterLevel = ref(75)
  const lastWatered = ref(null)
  const lastUpdated = ref(Date.now())
  const createdAt = ref(Date.now())
  const startedAt = ref(null)
  const currentPot = ref(DEFAULT_LOADOUT.currentPot)
  const currentLeaf = ref(DEFAULT_LOADOUT.currentLeaf)
  const currentFlower = ref(DEFAULT_LOADOUT.currentFlower)
  const currentBackground = ref(DEFAULT_LOADOUT.currentBackground)
  const currentAccessory = ref(null)
  const unlockedAccessories = ref([])
  const stats = ref({})
  const badges = ref([])
  const currentDecorations = ref([])
  const unlockedPots = ref([])
  const unlockedLeaves = ref([])
  const unlockedFlowers = ref([])
  const unlockedDecorations = ref([])
  const unlockedBackgrounds = ref([])
  const unseenItems = ref([]) // "category:id" keys for newly unlocked items
  const petals = ref(0) // earned through care and games, spent on seed packets
  const daily = ref(freshDaily()) // today's little things, refreshed each day
  const bestScores = ref({ rain: 0, memory: 0, song: 0 })
  const levels = ref({})
  const introSeen = ref({})
  const journal = ref([])
  const weekly = ref(freshWeekly())
  const factsSeen = ref([])
  const lastFactSlot = ref(null)
  const chat = ref([])
  const deviceId = ref(newDeviceId())
  const soundOn = ref(true)
  const musicOn = ref(true)
  const hapticsOn = ref(true)
  const remindersOn = ref(false)
  const reminderTime = ref('19:00')
  const checkinOn = ref(true)
  const drinks = ref({ day: '', morning: false, afternoon: false, night: false })
  const calmMotion = ref(false)
  const textSize = ref('normal')

  // ---- session-only state (not saved) ----
  const ready = ref(false)
  const welcome = ref(null) // { health, grewWhileAway, unlocks } shown once on open
  const pendingCelebration = ref(null) // growth that happened on its own while the app was open

  const fields = {
    plantName, growthLevel, growthProgress, health, waterLevel, lastWatered, lastUpdated, createdAt, startedAt,
    currentPot, currentLeaf, currentFlower, currentBackground, currentDecorations, currentAccessory,
    unlockedPots, unlockedLeaves, unlockedFlowers, unlockedDecorations, unlockedBackgrounds, unlockedAccessories, stats, badges,
    unseenItems, petals, daily, bestScores, levels, introSeen, journal, weekly, factsSeen, lastFactSlot, chat, deviceId,
    soundOn, musicOn, hapticsOn, remindersOn, reminderTime, checkinOn, drinks, calmMotion, textSize,
  }
  const unlockedLists = {
    pots: unlockedPots, leaves: unlockedLeaves, flowers: unlockedFlowers,
    decorations: unlockedDecorations, backgrounds: unlockedBackgrounds, accessories: unlockedAccessories,
  }

  // ---- getters ----
  const stage = computed(() => getStage(growthLevel.value))
  const stageIndex = computed(() => getStageIndex(growthLevel.value))
  const nextStage = computed(() => getNextStage(growthLevel.value))
  const stagePercent = computed(() => getStagePercent(growthLevel.value, growthProgress.value))
  const levelPercent = computed(() => getLevelPercent(growthLevel.value, growthProgress.value))
  const growthValue = computed(() => getGrowthValue(growthLevel.value, growthProgress.value))
  const droop = computed(() => getDroop(waterLevel.value))
  const atMaxLevel = computed(() => isMaxLevel(growthLevel.value))
  const isFull = computed(() => waterLevel.value >= WATER.fullAbove)
  const unseenCount = computed(() => unseenItems.value.length)
  const hasStarted = computed(() => startedAt.value !== null)

  const lockedPacketItems = computed(() => packetItems().filter((item) => !isUnlocked(item.category, item.id)))
  const canOpenPacket = computed(() => petals.value >= PACKET_COST && lockedPacketItems.value.length > 0)
  const giftWaiting = computed(() => hasStarted.value && (daily.value.date !== todayKey() || !daily.value.giftClaimed))
  const checkinWaiting = computed(
    () => hasStarted.value && checkinOn.value && (daily.value.date !== todayKey() || !daily.value.mood),
  )
  const weeklyGoals = computed(() => {
    const key = weekly.value.key === weekKey() ? weekly.value.key : weekKey()
    const same = weekly.value.key === key
    return goalsForWeek(key).map((g) => {
      const progress = same ? Math.min(g.target, weekly.value.progress[g.event] ?? 0) : 0
      return { ...g, progress, done: progress >= g.target, claimed: same && weekly.value.claimed.includes(g.id) }
    })
  })
  const weeklyClaimable = computed(
    () =>
      weeklyGoals.value.some((g) => g.done && !g.claimed) ||
      (weeklyGoals.value.every((g) => g.claimed) && !weekly.value.boxClaimed),
  )
  const hoursToThirsty = computed(() => hoursUntilThirsty(waterLevel.value, lastUpdated.value))

  // ---- drink times: morning, afternoon and night ----
  // lastUpdated ticks every minute while the app is open, so these stay fresh.
  const slotNow = computed(() => drinkSlot(new Date(Math.max(Date.now(), lastUpdated.value))))
  const drinksToday = computed(() => {
    const d = drinks.value.day === slotNow.value.day ? drinks.value : { morning: false, afternoon: false, night: false }
    return { morning: d.morning, afternoon: d.afternoon, night: d.night }
  })
  const drinkWaiting = computed(() => hasStarted.value && !drinksToday.value[slotNow.value.slot])
  const asleep = computed(() => hasStarted.value && isAsleep(new Date(Math.max(Date.now(), lastUpdated.value))))

  // ---- did you know? ----
  // lastUpdated ticks every minute while the app is open, so this stays fresh.
  const currentSlot = computed(() => factSlot(Math.max(Date.now(), lastUpdated.value)))
  const nextFact = computed(() => {
    const order = factOrder(createdAt.value)
    const unseen = order.find((id) => !factsSeen.value.includes(id))
    return findFact(unseen ?? order[currentSlot.value % order.length])
  })
  const factWaiting = computed(() => hasStarted.value && lastFactSlot.value !== currentSlot.value)

  function isUnlocked(category, id) {
    return unlockedLists[category]?.value.includes(id) ?? false
  }

  function isEquipped(category, id) {
    if (category === 'decorations') return currentDecorations.value.includes(id)
    return fields[EQUIP_KEYS[category]].value === id
  }

  function isTaskDone(id) {
    return daily.value.date === todayKey() && daily.value.done.includes(id)
  }

  // ---- persistence ----
  function serialize() {
    const data = { version: SCHEMA_VERSION }
    for (const [key, field] of Object.entries(fields)) data[key] = field.value
    return data
  }

  function applyData(data) {
    const base = freshPip()
    for (const [key, field] of Object.entries(fields)) {
      field.value = data[key] !== undefined ? data[key] : base[key]
    }
    if (!deviceId.value) deviceId.value = newDeviceId()
    // Saves from before onboarding existed already have a planted Pip.
    if (data.startedAt === undefined && data.version) startedAt.value = data.createdAt ?? Date.now()
    applySettings()
  }

  function applySettings() {
    setSoundEnabled(soundOn.value)
    setMusicEnabled(musicOn.value)
    setHapticsEnabled(hapticsOn.value)
    applyLook()
  }

  /** Calmer motion and text size live on the page itself. */
  function applyLook() {
    if (typeof document === 'undefined') return
    const html = document.documentElement
    const osCalm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    html.classList.toggle('calm-motion', calmMotion.value || osCalm)
    html.classList.toggle('text-large', textSize.value === 'large')
    html.classList.toggle('text-larger', textSize.value === 'larger')
  }

  function toggleCalmMotion() {
    calmMotion.value = !calmMotion.value
    applyLook()
    save()
  }

  function setTextSize(size) {
    textSize.value = ['normal', 'large', 'larger'].includes(size) ? size : 'normal'
    applyLook()
    save()
  }

  async function save() {
    await getStorage().save(serialize())
  }

  /** Load Pip, then catch up on the time that passed while the app was closed. */
  async function load() {
    const saved = await getStorage().load()
    applyData(saved ?? freshPip())
    syncUnlocks({ markUnseen: false })
    catchUp({ isOpening: Boolean(saved) })
    ready.value = true
    await save()
  }

  // ---- time ----
  /** Let real time pass: water evaporates and Pip grows gently on its own. */
  function catchUp({ isOpening = false, celebrate = true, now = Date.now() } = {}) {
    ensureToday()
    // Before the seed is planted, time stands still.
    if (!startedAt.value) {
      lastUpdated.value = now
      return { leveledUp: false, newStage: null, unlocks: [] }
    }
    const elapsed = Math.max(0, now - lastUpdated.value)
    const before = growthLevel.value
    const { waterLevel: water, growthGain } = simulateTime(waterLevel.value, elapsed, now)
    waterLevel.value = water
    health.value = getHealth(water)
    lastUpdated.value = now
    const result = grow(growthGain)

    if (isOpening && elapsed > 6 * HOUR) {
      welcome.value = { health: health.value, grewWhileAway: growthLevel.value > before, unlocks: result.unlocks }
    } else if (celebrate && result.leveledUp) {
      pendingCelebration.value = result
    }
    return result
  }

  function ensureToday() {
    if (daily.value.date !== todayKey()) {
      daily.value = freshDaily()
      const days = daysTogether(startedAt.value)
      if (startedAt.value && MILESTONE_DAYS.includes(days) && !journal.value.some((e) => e.type === 'days' && e.days === days)) {
        addJournal({ type: 'days', days, title: `${days} days together`, text: 'Every day you came back counted.' })
      }
    }
    if (weekly.value.key !== weekKey()) weekly.value = freshWeekly()
  }

  // ---- growth ----
  function grow(points) {
    const before = stageIndex.value
    const { level, progress, levelsGained } = applyGrowth(growthLevel.value, growthProgress.value, points)
    growthLevel.value = level
    growthProgress.value = progress
    const unlocks = levelsGained.length ? syncUnlocks({ markUnseen: true }) : []
    if (levelsGained.length) {
      const newStageNow = stageIndex.value > before ? stage.value : null
      addJournal({
        type: newStageNow ? 'stage' : 'level',
        level: level,
        title: newStageNow ? `Became a ${newStageNow.name.replace('Pip', plantName.value)}` : `Reached level ${level}`,
        text: unlocks.length ? `Unlocked ${listNames(unlocks.map((i) => i.name))}.` : newStageNow?.line ?? '',
      })
    }
    return {
      leveledUp: levelsGained.length > 0,
      newStage: stageIndex.value > before ? stage.value : null,
      unlocks,
    }
  }

  /** Make sure everything up to the current level is unlocked. Returns newly unlocked items. */
  function syncUnlocks({ markUnseen }) {
    const added = []
    for (let level = 1; level <= growthLevel.value; level++) {
      for (const item of itemsUnlockedAtLevel(level)) {
        if (unlock(item, markUnseen)) added.push(item)
      }
    }
    // The first flower is put on automatically, so Pip blooms without a trip to the menu.
    if (!currentFlower.value && unlockedFlowers.value.length) currentFlower.value = unlockedFlowers.value[0]
    return added
  }

  function unlock(item, markUnseen = true) {
    const list = unlockedLists[item.category]
    if (list.value.includes(item.id)) return false
    list.value.push(item.id)
    if (markUnseen) unseenItems.value.push(`${item.category}:${item.id}`)
    return true
  }

  // ---- watering ----
  /** Give Pip water (from the watering can, or rain caught in a game). Returns what happened. */
  function giveWater(amount = WATER.pour) {
    const passed = catchUp({ celebrate: false })
    const wasHealth = health.value
    const { waterLevel: next, absorbed } = pourWater(waterLevel.value, amount)
    if (absorbed === 0) {
      save()
      return { wasFull: true, absorbed: 0, ...passed }
    }

    waterLevel.value = next
    health.value = getHealth(next)
    lastWatered.value = Date.now()
    const result = grow(growthFromWatering(absorbed))
    save()
    return {
      wasFull: false,
      absorbed,
      wasHealth,
      health: health.value,
      leveledUp: passed.leveledUp || result.leveledUp,
      newStage: result.newStage ?? passed.newStage,
      unlocks: [...passed.unlocks, ...result.unlocks],
    }
  }

  function water() {
    const result = giveWater()
    if (!result.wasFull) {
      result.reward = completeTask('water')
      track('water')
      result.drink = takeDrink()
    }
    return result
  }

  /** The first watering in each drink time is a proper drink: a little thank you, and a bigger one for all three. */
  function takeDrink() {
    const { day, slot } = slotNow.value
    const today = drinks.value.day === day ? drinks.value : { day, morning: false, afternoon: false, night: false }
    if (today[slot]) return null
    const next = { ...today, day, [slot]: true }
    drinks.value = next
    let petalsGiven = DRINK_REWARD.petals
    let growth = DRINK_REWARD.growth
    const perfect = next.morning && next.afternoon && next.night
    if (perfect) {
      petalsGiven += PERFECT_DAY.petals
      growth += PERFECT_DAY.growth
      track('perfectDay')
      if (!journal.value.some((e) => e.type === 'perfect')) {
        addJournal({ type: 'perfect', title: 'A perfect day of drinks', text: 'Morning, afternoon and night. Pip felt so looked after.' })
      }
    }
    petals.value += petalsGiven
    track('drink')
    const result = grow(growth)
    queueCelebration(result)
    save()
    return { slot, petals: petalsGiven, perfect }
  }

  /** A treat from the farm kitchen (or anything from the barn). */
  function feed(points, what = '') {
    catchUp({ celebrate: false })
    const result = grow(points)
    track('treat')
    queueCelebration(result)
    save()
    return { ...result, what }
  }

  /** Growth from a wish come true, an order, or a gift. */
  function bonusGrowth(points) {
    const result = grow(points)
    queueCelebration(result)
    save()
    return result
  }

  // ---- petals & daily things ----
  function earn(amount) {
    petals.value += Math.max(0, Math.round(amount))
    save()
  }

  /** Mark one of today's little things done. Returns the petals earned (0 if already done today). */
  function completeTask(id) {
    ensureToday()
    if (id === 'breathe') track('breathe')
    if (daily.value.done.includes(id)) return 0
    const task = DAILY_TASKS.find((t) => t.id === id)
    if (!task) return 0
    if (id === 'pet') track('petDay')
    daily.value = { ...daily.value, done: [...daily.value.done, id] }
    petals.value += task.reward
    save()
    return task.reward
  }

  /** Open today's gift from Pip. Returns the petals inside (0 if already opened). */
  function claimGift() {
    ensureToday()
    if (daily.value.giftClaimed) return 0
    const amount = 5 + Math.floor(Math.random() * 4)
    daily.value = { ...daily.value, giftClaimed: true }
    track('gift')
    petals.value += amount
    save()
    return amount
  }

  /** Spend petals on a seed packet. Returns the item inside, or null. */
  function openPacket() {
    if (!canOpenPacket.value) return null
    const pool = lockedPacketItems.value
    const item = pool[Math.floor(Math.random() * pool.length)]
    petals.value -= PACKET_COST
    unlock(item)
    addJournal({ type: 'treasure', category: item.category, itemId: item.id, title: `Found a ${item.name}`, text: 'A rare treasure from a mystery seed packet.' })
    save()
    return item
  }

  /** A badge earned: petals, maybe something to wear, and a page in the journal. */
  function awardBadge(badge) {
    if (badges.value.includes(badge.id)) return null
    badges.value = [...badges.value, badge.id]
    petals.value += badge.petals
    let item = null
    if (badge.reward) {
      item = findItem(badge.reward.category, badge.reward.id)
      if (item) unlock({ ...item, category: badge.reward.category })
    }
    addJournal({ type: 'badge', title: `Earned “${badge.name}”`, text: badge.text })
    save()
    return { petals: badge.petals, item: item ? { ...item, category: badge.reward.category } : null }
  }

  /** Buy one of Pip's looks from the shop. */
  function buyItem(category, id) {
    const item = findItem(category, id)
    if (!item?.shop || isUnlocked(category, id)) return false
    if (!spendPetals(item.shop)) return false
    unlock({ ...item, category })
    track('shop')
    save()
    return true
  }

  /** Remember a personal best. For games where fewer is better (moves), pass lowerIsBetter. */
  // ---- game levels ----
  function levelProgress(game) {
    return levels.value[game] ?? { unlocked: 1, stars: {} }
  }

  function totalStars(game) {
    return Object.values(levelProgress(game).stars).reduce((sum, n) => sum + n, 0)
  }

  /** Finish a level with 1 to 3 stars. Unlocks the next one and returns the petals earned. */
  function completeLevel(game, level, stars) {
    const progress = levelProgress(game)
    const before = progress.stars[level] ?? 0
    const firstClear = before === 0
    const newStars = Math.max(0, stars - before)
    levels.value = {
      ...levels.value,
      [game]: {
        unlocked: Math.max(progress.unlocked, level + 1),
        stars: { ...progress.stars, [level]: Math.max(before, stars) },
      },
    }
    const reward = levelReward(level, { firstClear, newStars })
    petals.value += reward
    track('game')
    if (newStars) track('stars', newStars)
    const bonus = completeTask('play')
    save()
    if (firstClear && stars) {
      // remember special firsts
      if (level === 1) addJournal({ type: 'game', title: `First try at ${GAME_NAMES[game] ?? 'a game'}`, text: `${stars} ${stars === 1 ? 'star' : 'stars'} on level 1.` })
    }
    // the level number that just opened up, if this finish unlocked a new one
    const unlocked = level + 1 > progress.unlocked ? level + 1 : null
    return { petals: reward + bonus, firstClear, improved: newStars > 0, unlocked }
  }

  // ---- journal ----
  function listNames(names) {
    if (names.length <= 1) return names[0] ?? ''
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  }

  /** Save a little moment, with a snapshot of how Pip looked right then. */
  function addJournal(entry) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
      snapshot: {
        growth: getGrowthValue(growthLevel.value, growthProgress.value),
        pot: currentPot.value,
        leaf: currentLeaf.value,
        flower: currentFlower.value,
        accessory: currentAccessory.value,
      },
      ...entry,
    }
    journal.value = [item, ...journal.value].slice(0, JOURNAL_LIMIT)
  }

  /** Read the waiting fact. Returns it, plus a petal the first time it's read. */
  function readFact() {
    const fact = nextFact.value
    if (!fact) return null
    const isNew = !factsSeen.value.includes(fact.id)
    if (isNew) factsSeen.value = [...factsSeen.value, fact.id]
    lastFactSlot.value = currentSlot.value
    if (isNew) petals.value += 1
    save()
    return { fact, petals: isNew ? 1 : 0 }
  }

  // ---- talking to Pip ----
  function addChat(role, text) {
    if (role === 'user') stats.value = { ...stats.value, chat: (stats.value.chat ?? 0) + 1 }
    chat.value = [...chat.value, { role, text, at: Date.now() }].slice(-CHAT_LIMIT)
    save()
  }

  function clearChat() {
    chat.value = []
    save()
  }

  // ---- mood check-in ----
  function logMood(moodId, note = '') {
    ensureToday()
    const mood = findMood(moodId)
    if (!mood) return
    const first = !daily.value.mood
    daily.value = { ...daily.value, mood: moodId }
    if (first) track('checkin')
    const existing = journal.value.find((e) => e.type === 'mood' && todayKey(new Date(e.at)) === todayKey())
    if (existing) {
      journal.value = journal.value.map((e) =>
        e === existing ? { ...e, mood: moodId, title: `Feeling ${mood.label.toLowerCase()}`, note: note.trim() || e.note } : e,
      )
    } else {
      addJournal({ type: 'mood', mood: moodId, note: note.trim(), title: `Feeling ${mood.label.toLowerCase()}` })
    }
    save()
  }

  function skipCheckin() {
    ensureToday()
    daily.value = { ...daily.value, mood: 'skipped' }
    save()
  }

  // ---- weekly goals ----
  function track(event, amount = 1) {
    ensureToday()
    stats.value = { ...stats.value, [event]: (stats.value[event] ?? 0) + amount }
    const progress = { ...weekly.value.progress, [event]: (weekly.value.progress[event] ?? 0) + amount }
    weekly.value = { ...weekly.value, progress }
  }

  /** Collect the petals for a finished goal. */
  function claimGoal(id) {
    const goal = weeklyGoals.value.find((g) => g.id === id)
    if (!goal || !goal.done || goal.claimed) return 0
    weekly.value = { ...weekly.value, claimed: [...weekly.value.claimed, id] }
    petals.value += GOAL_REWARD
    save()
    return GOAL_REWARD
  }

  /** Open the bloom box once all three goals are collected: petals plus a rare treasure if any are left. */
  function claimBloomBox() {
    if (!weeklyGoals.value.every((g) => g.claimed) || weekly.value.boxClaimed) return null
    weekly.value = { ...weekly.value, boxClaimed: true }
    petals.value += BLOOM_BOX_PETALS
    const pool = lockedPacketItems.value
    const item = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
    if (item) unlock(item)
    addJournal({
      type: 'week',
      category: item?.category,
      itemId: item?.id,
      title: 'Opened a bloom box',
      text: item ? `It held a ${item.name}.` : 'A whole week of little goals, done.',
    })
    save()
    return { petals: BLOOM_BOX_PETALS, item }
  }

  // ---- reminders ----
  function setReminders(on, time = reminderTime.value) {
    remindersOn.value = on
    reminderTime.value = time
    save()
  }

  function toggleCheckin() {
    checkinOn.value = !checkinOn.value
    save()
  }

  function markIntroSeen(game) {
    if (introSeen.value[game]) return
    introSeen.value = { ...introSeen.value, [game]: true }
    save()
  }

  /** A round of a game without levels finished (Tac Toe, party races). Returns petals earned. */
  function finishRound(game, petalsWon = 0, note = null) {
    petals.value += Math.max(0, petalsWon)
    track('game')
    const bonus = completeTask('play')
    if (note && !journal.value.some((e) => e.type === 'game' && e.title === note)) {
      addJournal({ type: 'game', title: note, text: GAME_NAMES[game] ?? '' })
    }
    save()
    return petalsWon + bonus
  }

  /** Spend petals (for hints). Returns false if there aren't enough. */
  function spendPetals(amount) {
    if (petals.value < amount) return false
    petals.value -= amount
    save()
    return true
  }

  function recordScore(game, score, { lowerIsBetter = false } = {}) {
    if (game === 'song') track('game')
    const best = bestScores.value[game] ?? 0
    const isBest = !best || (lowerIsBetter ? score < best : score > best)
    if (isBest) bestScores.value = { ...bestScores.value, [game]: score }
    save()
    return isBest
  }

  // ---- looks ----
  function equip(category, id) {
    if (!isUnlocked(category, id)) return
    if (category === 'decorations') {
      toggleDecoration(id)
    } else if (category === 'flowers' && currentFlower.value === id) {
      currentFlower.value = null // tapping the worn flower takes it off
    } else if (category === 'accessories' && currentAccessory.value === id) {
      currentAccessory.value = null // and the same for accessories
    } else {
      fields[EQUIP_KEYS[category]].value = id
    }
    markSeen(category, id)
    save()
  }

  /** Put an item on (never toggles off). Used by "Try it on". */
  function wear(category, id) {
    if (category === 'decorations') {
      if (!currentDecorations.value.includes(id)) toggleDecoration(id)
      markSeen(category, id)
      save()
    } else if (!isEquipped(category, id)) {
      equip(category, id)
    } else {
      markSeen(category, id)
      save()
    }
  }

  function toggleDecoration(id) {
    const list = currentDecorations.value
    if (list.includes(id)) {
      currentDecorations.value = list.filter((d) => d !== id)
    } else {
      currentDecorations.value = [...list, id].slice(-MAX_DECORATIONS)
    }
  }

  function markSeen(category, id) {
    unseenItems.value = unseenItems.value.filter((key) => key !== `${category}:${id}`)
  }

  function markCategorySeen(category) {
    unseenItems.value = unseenItems.value.filter((key) => !key.startsWith(`${category}:`))
    save()
  }

  /** Plant the seed: the very first moment with Pip. */
  function start(name) {
    const now = Date.now()
    plantName.value = name.trim().slice(0, 16) || 'Pip'
    startedAt.value = now
    lastUpdated.value = now
    addJournal({ type: 'planted', title: `Planted ${plantName.value}`, text: 'A tiny seed, and the start of something lovely.' })
    save()
  }

  function rename(name) {
    const trimmed = name.trim().slice(0, 16)
    plantName.value = trimmed || 'Pip'
    save()
  }

  function toggleSound() {
    soundOn.value = !soundOn.value
    applySettings()
    save()
  }

  function toggleMusic() {
    musicOn.value = !musicOn.value
    applySettings()
    save()
  }

  function toggleHaptics() {
    hapticsOn.value = !hapticsOn.value
    applySettings()
    save()
  }

  function clearWelcome() {
    welcome.value = null
  }

  function queueCelebration(result) {
    if (result?.leveledUp) pendingCelebration.value = result
  }

  function clearCelebration() {
    pendingCelebration.value = null
  }

  // ---- developer helpers (only exposed in dev builds, see main.js) ----
  function devPassTime(hours) {
    lastUpdated.value -= hours * HOUR
    const result = catchUp()
    save()
    return result
  }

  function devGrow(points = 100) {
    const result = grow(points)
    save()
    return result
  }

  function devPetals(amount = 100) {
    earn(amount)
  }

  async function devReset() {
    await getStorage().clear()
    try {
      localStorage.removeItem('pip:farm:v1')
      // forget the backup code here, so a fresh seed never overwrites the old backup
      localStorage.removeItem('pip:backup:v1')
    } catch {
      // ignore
    }
    applyData(freshPip())
    syncUnlocks({ markUnseen: false })
    await save()
  }

  return {
    ...fields,
    ready, welcome, pendingCelebration,
    stage, stageIndex, nextStage, stagePercent, levelPercent, growthValue, droop, atMaxLevel, isFull,
    unseenCount, hasStarted, lockedPacketItems, canOpenPacket, giftWaiting, checkinWaiting,
    weeklyGoals, weeklyClaimable, hoursToThirsty, nextFact, factWaiting, currentSlot, slotNow, drinksToday, drinkWaiting, asleep,
    allItems: ITEMS,
    isUnlocked, isEquipped, isTaskDone,
    load, save, catchUp, water, giveWater, feed, bonusGrowth, takeDrink, unlock, buyItem, awardBadge, equip, wear, markSeen, markCategorySeen, start, rename, toggleSound,
    earn, completeTask, claimGift, openPacket, recordScore, levelProgress, totalStars, completeLevel, spendPetals, markIntroSeen, finishRound,
    toggleMusic, toggleHaptics, toggleCheckin, setReminders, toggleCalmMotion, setTextSize,
    addJournal, logMood, skipCheckin, track, claimGoal, claimBloomBox, readFact, addChat, clearChat,
    clearWelcome, clearCelebration, queueCelebration,
    devPassTime, devGrow, devPetals, devReset,
  }
})
