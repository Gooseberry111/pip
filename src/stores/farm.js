// The farm: plots, crops, trees, animals, the barn, the kitchen and the order board.
// Saved separately from Pip (key pip:farm:v1). Petals live in the Pip store and are shared.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createLocalStorageAdapter } from '@/services/storage/localStorageAdapter'
import { usePipStore } from '@/stores/pip'
import { todayKey } from '@/data/daily'
import { weekKey } from '@/data/weekly'
import { countOrder, COMMUNITY_REWARD } from '@/services/community'
import {
  FARM_COLS, LAND, BARN_LEVELS, KITCHEN_SLOTS, FERTILISER, PLOT_PRICE, MAX_PLOTS, WATER_SPEEDUP,
  ORDER_SLOTS, ORDER_WAIT, WISH_REWARD, CROPS, DECOR, TREES, PRODUCERS, RECIPES, GOODS, starterLayout, xpForLevel, MAX_FARM_LEVEL,
} from '@/data/farm'
import {
  MINUTE, cropById, treeById, producerById, recipeById, kindOf, fits, firstFree, barnCount, hasAll, addXp, unlocksAt,
  makeOrder, goodsAvailable,
} from '@/utils/farmLogic'

const storage = createLocalStorageAdapter('pip:farm:v1')
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function newCode() {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

function newKey() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function freshFarm() {
  let uid = 0
  return {
    farmName: '',
    level: 1,
    xp: 0,
    land: 0,
    barnLevel: 0,
    kitchenLevel: 0,
    objects: starterLayout().map((o) => ({ ...o, uid: ++uid })),
    nextUid: uid + 1,
    barn: {},
    kitchen: [null],
    orders: [],
    inventory: {}, // bought but not placed yet: { type: count }
    fertiliser: 2,
    almanac: {}, // { goodId: how many ever made }
    wish: null, // { date, good, done }
    code: newCode(),
    key: newKey(), // secret: proves this phone owns the shared farm
    shared: false, // published so friends with the code can visit
    listed: false, // shown in "explore farms" too
    neighbours: [], // [{ code, name, plant }]
    helpsSeen: [], // visit ids already applied
    lastHelpAt: 0,
    visitsToday: { date: '', farms: {} }, // { CODE: crops watered there today }
    dealDay: '', // the day today's deal was bought
    tutorial: 0, // the farm tour step, or 'done'
    giftsSeen: [], // gift ids already added to the barn
    pendingGifts: [], // gifts waiting for space in the barn
    giftsSent: { date: '', farms: {} }, // { CODE: gifts sent there today }
    communityClaimed: '', // the week whose neighbourhood reward was collected
    goldenCan: false, // the one-time special decoration has been given
    createdAt: Date.now(),
  }
}

export const useFarmStore = defineStore('farm', () => {
  const pip = usePipStore()

  const state = ref(freshFarm())
  const ready = ref(false)
  const levelUp = ref(null) // { level, unlocks } for the celebration card
  const now = ref(Date.now())

  // ---- getters ----
  const cols = FARM_COLS
  const rows = computed(() => LAND[state.value.land].rows)
  const objects = computed(() => state.value.objects)
  const barnCapacity = computed(() => BARN_LEVELS[state.value.barnLevel].capacity)
  const barnUsed = computed(() => barnCount(state.value.barn))
  const barnFull = computed(() => barnUsed.value >= barnCapacity.value)
  const xpNeeded = computed(() => xpForLevel(state.value.level))
  const plotCount = computed(() => state.value.objects.filter((o) => o.type === 'plot').length + (state.value.inventory.plot ?? 0))
  const ownedTypes = computed(() => new Set([...state.value.objects.map((o) => o.type), ...Object.keys(state.value.inventory).filter((k) => state.value.inventory[k] > 0)]))
  const availableCrops = computed(() => CROPS.filter((c) => c.level <= state.value.level))
  const name = computed(() => state.value.farmName || `${pip.plantName}’s farm`)

  const readyCount = computed(() => {
    const t = now.value
    let n = 0
    for (const o of state.value.objects) {
      if (o.crop && t >= o.crop.readyAt) n++
      else if (treeById[o.type] && o.readyAt && t >= o.readyAt) n++
      else if (producerById[o.type] && o.readyAt && t >= o.readyAt) n++
    }
    n += state.value.kitchen.filter((k) => k && t >= k.readyAt).length
    return n
  })
  const ordersReady = computed(() => state.value.orders.filter((o) => o.needs && hasAll(state.value.barn, o.needs)).length)
  /** The soonest time something will be ready (for reminders). */
  const nextReadyAt = computed(() => {
    const times = []
    for (const o of state.value.objects) {
      if (o.crop) times.push(o.crop.readyAt)
      else if ((treeById[o.type] || producerById[o.type]) && o.readyAt) times.push(o.readyAt)
    }
    for (const k of state.value.kitchen) if (k) times.push(k.readyAt)
    const future = times.filter((t) => t > Date.now())
    return future.length ? Math.min(...future) : null
  })

  // ---- saving ----
  let saveTimer = null
  function save() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => storage.save(state.value), 150)
    onChange?.()
  }
  let onChange = null
  function onSave(fn) {
    onChange = fn
  }

  async function load() {
    const saved = await storage.load()
    const base = freshFarm()
    state.value = saved ? { ...base, ...saved } : base
    // farms from before the tour existed: only show it if nothing's been harvested yet
    if (saved && saved.tutorial === undefined) state.value.tutorial = Object.keys(saved.almanac ?? {}).length ? 'done' : 0
    if (state.value.kitchen.length < KITCHEN_SLOTS[state.value.kitchenLevel].slots) {
      state.value.kitchen = [...state.value.kitchen, ...Array(KITCHEN_SLOTS[state.value.kitchenLevel].slots - state.value.kitchen.length).fill(null)]
    }
    tick()
    ensureWish()
    ready.value = true
    if (!saved) storage.save(state.value)
  }

  /** Called every second while the app is open: keeps the clock fresh and the order board full. */
  function tick() {
    now.value = Date.now()
    refillOrders()
    if (!wish.value && ready.value) ensureWish()
  }

  // ---- XP and levels ----
  function gainXp(amount) {
    const before = state.value.level
    const r = addXp(state.value.level, state.value.xp, amount)
    state.value.level = r.level
    state.value.xp = r.xp
    if (r.gained.length) {
      const unlocks = r.gained.flatMap((l) => unlocksAt(l))
      levelUp.value = { level: r.level, unlocks }
      pip.addJournal({ type: 'farm', title: `Farm reached level ${r.level}`, text: unlocks.length ? `New: ${unlocks.slice(0, 4).map((u) => u.name).join(', ')}.` : 'Growing nicely.' })
      pip.track('farmLevel')
    }
    return r.level > before
  }

  function clearLevelUp() {
    levelUp.value = null
  }

  // ---- the barn ----
  function addToBarn(id, amount) {
    const space = barnCapacity.value - barnUsed.value
    const take = Math.min(space, amount)
    if (take <= 0) return 0
    state.value.barn = { ...state.value.barn, [id]: (state.value.barn[id] ?? 0) + take }
    state.value.almanac = { ...state.value.almanac, [id]: (state.value.almanac[id] ?? 0) + take }
    return take
  }

  function takeFromBarn(needs, times = 1) {
    if (!hasAll(state.value.barn, needs, times)) return false
    const barn = { ...state.value.barn }
    for (const [id, n] of Object.entries(needs)) {
      barn[id] -= n * times
      if (barn[id] <= 0) delete barn[id]
    }
    state.value.barn = barn
    return true
  }

  function sell(id, amount = 1) {
    const have = state.value.barn[id] ?? 0
    const n = Math.min(have, amount)
    if (!n) return 0
    takeFromBarn({ [id]: n })
    const petals = GOODS[id].sell * n
    pip.earn(petals)
    pip.track('sell', n)
    save()
    return petals
  }

  // ---- finding things ----
  const find = (uid) => state.value.objects.find((o) => o.uid === uid)

  // ---- crops ----
  function plant(uid, cropId) {
    const o = find(uid)
    const crop = cropById[cropId]
    if (!o || o.type !== 'plot' || o.crop || !crop || crop.level > state.value.level) return { ok: false }
    if (crop.seed && !pip.spendPetals(crop.seed)) return { ok: false, reason: 'petals' }
    const t = Date.now()
    o.crop = { id: cropId, plantedAt: t, readyAt: t + crop.minutes * MINUTE, watered: false }
    pip.track('plant')
    save()
    return { ok: true }
  }

  /** Plant the same crop in every empty plot you can afford. */
  function plantAll(cropId) {
    let n = 0
    for (const o of state.value.objects) if (o.type === 'plot' && !o.crop && plant(o.uid, cropId).ok) n++
    return n
  }

  function harvest(uid) {
    const o = find(uid)
    const t = Date.now()
    if (!o) return null
    if (o.crop && t >= o.crop.readyAt) {
      const crop = cropById[o.crop.id]
      if (barnFull.value) return { full: true }
      const got = addToBarn(crop.id, crop.yield)
      o.crop = null
      const leveled = gainXp(crop.xp)
      pip.track('harvest')
      pip.completeTask('farm')
      save()
      return { good: crop.id, amount: got, xp: crop.xp, leveled }
    }
    const tree = treeById[o.type]
    if (tree && o.readyAt && t >= o.readyAt) {
      if (barnFull.value) return { full: true }
      const got = addToBarn(tree.fruit, tree.yield)
      o.readyAt = t + tree.every * MINUTE
      o.grown = true
      const leveled = gainXp(tree.xp)
      pip.track('harvest')
      pip.completeTask('farm')
      save()
      return { good: tree.fruit, amount: got, xp: tree.xp, leveled }
    }
    const prod = producerById[o.type]
    if (prod && o.readyAt && t >= o.readyAt) {
      if (barnFull.value) return { full: true }
      const got = addToBarn(prod.makes, prod.amount)
      // the bees keep going on their own; the others wait to be fed again
      o.readyAt = Object.keys(prod.feed).length ? null : t + prod.minutes * MINUTE
      const leveled = gainXp(prod.xp)
      pip.track('harvest')
      pip.completeTask('farm')
      save()
      return { good: prod.makes, amount: got, xp: prod.xp, leveled }
    }
    return null
  }

  function harvestAll() {
    const got = {}
    let full = false
    for (const o of state.value.objects) {
      const r = harvest(o.uid)
      if (r?.full) full = true
      if (r?.good) got[r.good] = (got[r.good] ?? 0) + r.amount
    }
    return { got, full }
  }

  /** Water a growing crop: it grows a little quicker. Once per crop. */
  function waterCrop(uid) {
    const o = find(uid)
    const t = Date.now()
    if (!o?.crop || o.crop.watered || t >= o.crop.readyAt) return false
    o.crop.readyAt = t + (o.crop.readyAt - t) * (1 - WATER_SPEEDUP)
    o.crop.watered = true
    save()
    return true
  }

  /** Fertiliser halves the time left on a crop, tree or building. */
  function fertilise(uid) {
    const o = find(uid)
    const t = Date.now()
    if (state.value.fertiliser <= 0 || !o) return false
    if (o.crop && t < o.crop.readyAt) o.crop.readyAt = t + (o.crop.readyAt - t) / 2
    else if (o.readyAt && t < o.readyAt) o.readyAt = t + (o.readyAt - t) / 2
    else return false
    state.value.fertiliser -= 1
    save()
    return true
  }

  /** Feed a coop, mill or cow shed. */
  function startProducer(uid) {
    const o = find(uid)
    const prod = producerById[o?.type]
    if (!prod || o.readyAt) return { ok: false }
    if (!takeFromBarn(prod.feed)) return { ok: false, reason: 'missing' }
    o.readyAt = Date.now() + prod.minutes * MINUTE
    save()
    return { ok: true }
  }

  // ---- the kitchen ----
  function cook(slot, recipeId) {
    const r = recipeById[recipeId]
    if (!r || r.level > state.value.level || state.value.kitchen[slot]) return { ok: false }
    if (!takeFromBarn(r.needs)) return { ok: false, reason: 'missing' }
    const kitchen = [...state.value.kitchen]
    kitchen[slot] = { recipe: recipeId, startedAt: Date.now(), readyAt: Date.now() + r.minutes * MINUTE }
    state.value.kitchen = kitchen
    save()
    return { ok: true }
  }

  function collectDish(slot) {
    const k = state.value.kitchen[slot]
    if (!k || Date.now() < k.readyAt) return null
    if (barnFull.value) return { full: true }
    const r = recipeById[k.recipe]
    addToBarn(r.id, 1)
    const kitchen = [...state.value.kitchen]
    kitchen[slot] = null
    state.value.kitchen = kitchen
    const leveled = gainXp(r.xp)
    pip.track('cook')
    save()
    return { good: r.id, amount: 1, xp: r.xp, leveled }
  }

  // ---- feeding Pip ----
  /** Give Pip something from the barn. Dishes are the best treats. */
  function feedPip(id) {
    if (!takeFromBarn({ [id]: 1 })) return null
    const r = recipeById[id]
    const points = r ? r.treat : Math.max(3, GOODS[id].sell * 2)
    const result = pip.feed(points, GOODS[id].name)
    fulfilWish(id)
    save()
    return { points, ...result }
  }

  // ---- Pip's daily wish ----
  const wish = computed(() => {
    const w = state.value.wish
    return w && w.date === todayKey() ? w : null
  })

  function ensureWish() {
    if (wish.value) return
    const pool = goodsAvailable(state.value.level, ownedTypes.value).filter((g) => g.kind !== 'dish' || state.value.level >= 3)
    if (!pool.length) return
    // the same wish all day, picked from the date so it doesn't change on reload
    const seed = Number(todayKey().replace(/\D/g, '')) + state.value.createdAt
    const good = pool[seed % pool.length]
    state.value.wish = { date: todayKey(), good: good.id, done: false }
    save()
  }

  function fulfilWish(id) {
    const w = wish.value
    if (!w || w.done || w.good !== id) return false
    state.value.wish = { ...w, done: true }
    pip.earn(WISH_REWARD.petals)
    pip.bonusGrowth(WISH_REWARD.growth)
    pip.track('wish')
    return true
  }

  // ---- orders ----
  function refillOrders() {
    const t = Date.now()
    const orders = [...state.value.orders]
    let changed = false
    while (orders.length < ORDER_SLOTS) {
      orders.push({ waitUntil: t + (orders.length < 2 ? 0 : ORDER_WAIT * MINUTE * (orders.length - 1)) })
      changed = true
    }
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].waitUntil && t >= orders[i].waitUntil) {
        orders[i] = makeOrder(state.value.level, ownedTypes.value)
        changed = true
      }
    }
    if (changed) {
      state.value.orders = orders
      save()
    }
  }

  function fulfilOrder(index) {
    const order = state.value.orders[index]
    if (!order?.needs || !takeFromBarn(order.needs)) return null
    pip.earn(order.petals)
    const leveled = gainXp(order.xp)
    const orders = [...state.value.orders]
    orders[index] = { waitUntil: Date.now() + ORDER_WAIT * MINUTE }
    state.value.orders = orders
    pip.track('order')
    countOrder(1)
    save()
    return { petals: order.petals, xp: order.xp, leveled }
  }

  function skipOrder(index) {
    const orders = [...state.value.orders]
    orders[index] = { waitUntil: Date.now() + (ORDER_WAIT / 2) * MINUTE }
    state.value.orders = orders
    save()
  }

  // ---- building and moving ----
  function move(uid, x, y) {
    const o = find(uid)
    if (!o || !fits(state.value.objects, o.type, x, y, cols, rows.value, uid)) return false
    o.x = x
    o.y = y
    save()
    return true
  }

  /** Put something away into the inventory. Fixed buildings and planted plots stay. */
  function store(uid) {
    const o = find(uid)
    if (!o) return { ok: false }
    if (['barn', 'kitchen', 'board', 'pip'].includes(o.type)) return { ok: false, reason: 'fixed' }
    if (o.crop) return { ok: false, reason: 'growing' }
    if (producerById[o.type] && o.readyAt && Object.keys(producerById[o.type].feed).length) return { ok: false, reason: 'busy' }
    state.value.objects = state.value.objects.filter((x) => x.uid !== uid)
    state.value.inventory = { ...state.value.inventory, [o.type]: (state.value.inventory[o.type] ?? 0) + 1 }
    save()
    return { ok: true }
  }

  function place(type, x, y) {
    if (!(state.value.inventory[type] > 0)) return false
    if (!fits(state.value.objects, type, x, y, cols, rows.value)) return false
    const o = { uid: state.value.nextUid++, type, x, y }
    const tree = treeById[type]
    if (tree) {
      o.plantedAt = Date.now()
      o.readyAt = o.plantedAt + tree.grow * MINUTE
    }
    const prod = producerById[type]
    if (prod && !Object.keys(prod.feed).length) o.readyAt = Date.now() + prod.minutes * MINUTE
    state.value.objects = [...state.value.objects, o]
    const left = state.value.inventory[type] - 1
    const inv = { ...state.value.inventory }
    if (left > 0) inv[type] = left
    else delete inv[type]
    state.value.inventory = inv
    save()
    return o
  }

  function placeAnywhere(type) {
    const spot = firstFree(state.value.objects, type, cols, rows.value)
    return spot ? place(type, spot.x, spot.y) : null
  }

  // ---- the shop ----
  /** One decoration or tree a day is 30% off. */
  const deal = computed(() => {
    const pool = [...DECOR, ...TREES].filter((d) => !d.special && d.level <= state.value.level && d.price >= 5)
    if (!pool.length) return null
    const seed = Number(todayKey().replace(/\D/g, ''))
    const item = pool[seed % pool.length]
    return { type: item.id, price: Math.ceil(item.price * 0.7), was: item.price, bought: state.value.dealDay === todayKey() }
  })

  function buy(type) {
    const isDeal = deal.value && deal.value.type === type && !deal.value.bought
    const price = isDeal ? deal.value.price : priceOf(type)
    if (price === null || !pip.spendPetals(price)) return false
    if (isDeal) state.value.dealDay = todayKey()
    state.value.inventory = { ...state.value.inventory, [type]: (state.value.inventory[type] ?? 0) + 1 }
    pip.track('shop')
    save()
    return true
  }

  function priceOf(type) {
    if (type === 'plot') return plotCount.value >= MAX_PLOTS ? null : PLOT_PRICE(plotCount.value)
    const item = TREES.find((t) => t.id === type) ?? PRODUCERS.find((p) => p.id === type) ?? DECOR.find((d) => d.id === type)
    if (!item || item.special || item.level > state.value.level) return null
    return item.price
  }

  function buyLand() {
    const next = LAND[state.value.land + 1]
    if (!next || next.level > state.value.level || !pip.spendPetals(next.price)) return false
    state.value.land += 1
    save()
    return true
  }

  function upgradeBarn() {
    const next = BARN_LEVELS[state.value.barnLevel + 1]
    if (!next || !pip.spendPetals(next.price)) return false
    state.value.barnLevel += 1
    save()
    return true
  }

  function upgradeKitchen() {
    const next = KITCHEN_SLOTS[state.value.kitchenLevel + 1]
    if (!next || !pip.spendPetals(next.price)) return false
    state.value.kitchenLevel += 1
    state.value.kitchen = [...state.value.kitchen, null]
    save()
    return true
  }

  function buyFertiliser(bundle = false) {
    const price = bundle ? FERTILISER.bundlePrice : FERTILISER.price
    if (!pip.spendPetals(price)) return false
    state.value.fertiliser += bundle ? FERTILISER.bundle : 1
    save()
    return true
  }

  // ---- the farm tour ----
  const TOUR_REWARD = 10
  function tourNext(step) {
    if (state.value.tutorial === 'done') return
    if (typeof step === 'number' && state.value.tutorial !== step) return
    state.value.tutorial = state.value.tutorial + 1
    save()
  }
  function tourFinish(rewarded = true) {
    if (state.value.tutorial === 'done') return
    state.value.tutorial = 'done'
    if (rewarded) pip.earn(TOUR_REWARD)
    save()
  }

  function rename(next) {
    state.value.farmName = next.trim().slice(0, 24)
    save()
  }

  // ---- friends ----
  function setSharing(shared, listed = state.value.listed) {
    state.value.shared = shared
    state.value.listed = shared && listed
    save()
  }

  /** Our code was taken by another farm online: pick a fresh one. */
  function newFarmCode() {
    state.value.code = newCode()
    save()
  }

  function rememberNeighbour(n) {
    const others = state.value.neighbours.filter((x) => x.code !== n.code)
    state.value.neighbours = [{ code: n.code, name: n.name, plant: n.plant }, ...others].slice(0, 20)
    save()
  }

  function forgetNeighbour(code) {
    state.value.neighbours = state.value.neighbours.filter((x) => x.code !== code)
    save()
  }

  /** Visitors watered our crops while we were away: each one speeds a crop up. */
  function applyHelps(helps) {
    const fresh = helps.filter((h) => !state.value.helpsSeen.includes(h.id))
    if (!fresh.length) return []
    const t = Date.now()
    for (const h of fresh) {
      const o = state.value.objects.find((x) => x.uid === h.uid && x.crop && t < x.crop.readyAt)
      if (o) o.crop.readyAt = t + (o.crop.readyAt - t) * (1 - WATER_SPEEDUP)
    }
    state.value.helpsSeen = [...state.value.helpsSeen, ...fresh.map((h) => h.id)].slice(-200)
    save()
    return fresh
  }

  // ---- gifts ----
  /** Friends sent us things: they go into the barn (or wait for room). Returns the new ones. */
  function applyGifts(gifts) {
    const fresh = gifts.filter((g) => !state.value.giftsSeen.includes(g.id) && GOODS[g.good])
    if (!fresh.length && !state.value.pendingGifts.length) return []
    const waiting = [...state.value.pendingGifts, ...fresh.map((g) => ({ good: g.good, n: g.n }))]
    const still = []
    for (const w of waiting) {
      const got = addToBarn(w.good, w.n)
      if (got < w.n) still.push({ good: w.good, n: w.n - got })
    }
    state.value.pendingGifts = still
    state.value.giftsSeen = [...state.value.giftsSeen, ...fresh.map((g) => g.id)].slice(-200)
    if (fresh.length) pip.track('giftReceived', fresh.length)
    save()
    return fresh
  }

  const GIFTS_PER_FRIEND = 3
  function giftsSentToday(code) {
    const g = state.value.giftsSent
    return g.date === todayKey() ? g.farms[code] ?? 0 : 0
  }

  /** Take a gift out of the barn to send. Returns false if we don't have it or hit today's limit. */
  function packGift(code, good, n) {
    if (giftsSentToday(code) >= GIFTS_PER_FRIEND) return false
    if (!takeFromBarn({ [good]: n })) return false
    const g = state.value.giftsSent.date === todayKey() ? state.value.giftsSent : { date: todayKey(), farms: {} }
    state.value.giftsSent = { ...g, farms: { ...g.farms, [code]: (g.farms[code] ?? 0) + 1 } }
    pip.track('giftSent')
    save()
    return true
  }

  /** The gift didn't go through: put it back. */
  function unpackGift(code, good, n) {
    addToBarn(good, n)
    const g = state.value.giftsSent
    if (g.farms[code]) state.value.giftsSent = { ...g, farms: { ...g.farms, [code]: g.farms[code] - 1 } }
    save()
  }

  // ---- the neighbourhood goal ----
  /** Collect this week's reward once the goal is reached. */
  function claimCommunity(status) {
    if (!status || status.total < status.goal || state.value.communityClaimed === status.week) return null
    state.value.communityClaimed = status.week
    pip.earn(COMMUNITY_REWARD)
    let can = false
    if (!state.value.goldenCan) {
      state.value.goldenCan = true
      state.value.inventory = { ...state.value.inventory, goldencan: (state.value.inventory.goldencan ?? 0) + 1 }
      can = true
    }
    pip.track('community')
    save()
    return { petals: COMMUNITY_REWARD, can }
  }

  /** How many crops we've watered on someone else's farm today (5 a day per farm). */
  function helpedToday(code) {
    const v = state.value.visitsToday
    return v.date === todayKey() ? v.farms[code] ?? 0 : 0
  }

  function noteHelp(code) {
    const v = state.value.visitsToday.date === todayKey() ? state.value.visitsToday : { date: todayKey(), farms: {} }
    state.value.visitsToday = { ...v, farms: { ...v.farms, [code]: (v.farms[code] ?? 0) + 1 } }
    pip.track('visit')
    save()
  }

  /** This week's numbers for the neighbours' leaderboard. */
  function weekStats() {
    const same = pip.weekly.key === weekKey()
    const p = same ? pip.weekly.progress : {}
    const stars = Object.values(pip.levels).reduce((sum, g) => sum + Object.values(g.stars ?? {}).reduce((a, b) => a + b, 0), 0)
    return { key: weekKey(), harvests: p.harvest ?? 0, orders: p.order ?? 0, stars }
  }

  /** What friends see: the layout and what's growing, never anything private. */
  function snapshot() {
    const t = Date.now()
    return {
      name: name.value,
      plant: pip.plantName,
      level: state.value.level,
      rows: rows.value,
      objects: state.value.objects.map((o) => ({
        uid: o.uid,
        type: o.type,
        x: o.x,
        y: o.y,
        ...(o.crop ? { crop: { id: o.crop.id, plantedAt: o.crop.plantedAt, readyAt: o.crop.readyAt } } : {}),
        ...(o.readyAt ? { readyAt: o.readyAt } : {}),
      })),
      pip: { growth: pip.growthValue, pot: pip.currentPot, leaf: pip.currentLeaf, flower: pip.currentFlower, accessory: pip.currentAccessory },
      week: weekStats(),
      at: t,
    }
  }

  async function devReset() {
    await storage.clear()
    state.value = freshFarm()
    save()
  }

  function devXp(n = 50) {
    gainXp(n)
    save()
  }

  return {
    state, ready, levelUp, now, cols, rows, objects, barnCapacity, barnUsed, barnFull, xpNeeded, plotCount, ownedTypes,
    availableCrops, name, readyCount, ordersReady, nextReadyAt, wish, deal,
    load, save, onSave, tick, gainXp, clearLevelUp, sell, plant, plantAll, harvest, harvestAll, waterCrop, fertilise, startProducer,
    cook, collectDish, feedPip, ensureWish, fulfilWish, refillOrders, fulfilOrder, skipOrder,
    move, store, place, placeAnywhere, buy, priceOf, buyLand, upgradeBarn, upgradeKitchen, buyFertiliser, rename,
    tourNext, tourFinish, applyGifts, packGift, unpackGift, giftsSentToday, claimCommunity, weekStats,
    setSharing, newFarmCode, rememberNeighbour, forgetNeighbour, applyHelps, helpedToday, noteHelp, snapshot, find,
    devReset, devXp,
    MAX_FARM_LEVEL,
  }
})
