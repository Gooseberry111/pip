// Pip's farm: everything that can be grown, built, cooked and asked for.
// Times are in minutes. Prices and sale values are in petals, the app's one currency.
// Farm level (from farm XP) unlocks crops, trees, buildings and recipes.

export const FARM_COLS = 8

// Land grows downwards. Each size is bought in the shop once the farm level allows.
export const LAND = [
  { rows: 10, price: 0, level: 1 },
  { rows: 12, price: 40, level: 3 },
  { rows: 14, price: 90, level: 5 },
  { rows: 16, price: 160, level: 8 },
  { rows: 18, price: 250, level: 11 },
]

export const MAX_FARM_LEVEL = 20
/** XP needed to go from `level` to the next one. */
export function xpForLevel(level) {
  return 20 + level * level * 8
}

// ---- crops: planted in plots, harvested once, then the plot is free again ----
// seed: cost to plant, sell: petals each at the market, yield: how many you pick
export const CROPS = [
  { id: 'wheat', name: 'Wheat', level: 1, minutes: 1, seed: 0, sell: 1, yield: 3, xp: 1, color: '#E8C268' },
  { id: 'carrot', name: 'Carrot', level: 1, minutes: 3, seed: 1, sell: 1, yield: 2, xp: 1, color: '#EE9447' },
  { id: 'potato', name: 'Potato', level: 2, minutes: 8, seed: 1, sell: 2, yield: 2, xp: 2, color: '#C9A06D' },
  { id: 'tomato', name: 'Tomato', level: 2, minutes: 15, seed: 2, sell: 2, yield: 3, xp: 3, color: '#E35D4B' },
  { id: 'strawberry', name: 'Strawberry', level: 3, minutes: 25, seed: 2, sell: 3, yield: 3, xp: 4, color: '#E5485E' },
  { id: 'corn', name: 'Corn', level: 4, minutes: 40, seed: 3, sell: 3, yield: 3, xp: 5, color: '#F2CB4C' },
  { id: 'sunflower', name: 'Sunflower', level: 5, minutes: 60, seed: 3, sell: 4, yield: 2, xp: 6, color: '#F4B93B' },
  { id: 'pumpkin', name: 'Pumpkin', level: 6, minutes: 90, seed: 4, sell: 6, yield: 2, xp: 8, color: '#EB8C35' },
  { id: 'blueberry', name: 'Blueberry', level: 7, minutes: 120, seed: 5, sell: 6, yield: 3, xp: 9, color: '#5B74C9' },
  { id: 'lavender', name: 'Lavender', level: 8, minutes: 180, seed: 6, sell: 8, yield: 3, xp: 11, color: '#A68BD6' },
  { id: 'watermelon', name: 'Watermelon', level: 9, minutes: 240, seed: 8, sell: 10, yield: 2, xp: 13, color: '#5FA55A' },
  { id: 'rose', name: 'Rose', level: 10, minutes: 360, seed: 10, sell: 14, yield: 2, xp: 16, color: '#E05A7A' },
]

// ---- trees: planted once, fruit again and again ----
// grow: minutes until the first fruit, every: minutes between harvests
export const TREES = [
  { id: 'appletree', fruit: 'apple', name: 'Apple tree', level: 2, price: 25, grow: 30, every: 45, yield: 3, xp: 3 },
  { id: 'cherrytree', fruit: 'cherry', name: 'Cherry tree', level: 4, price: 35, grow: 60, every: 75, yield: 3, xp: 4 },
  { id: 'orangetree', fruit: 'orange', name: 'Orange tree', level: 6, price: 45, grow: 90, every: 100, yield: 3, xp: 6 },
  { id: 'peachtree', fruit: 'peach', name: 'Peach tree', level: 8, price: 60, grow: 120, every: 130, yield: 3, xp: 8 },
  { id: 'lemontree', fruit: 'lemon', name: 'Lemon tree', level: 10, price: 75, grow: 150, every: 160, yield: 3, xp: 10 },
]

// ---- buildings that make things ----
// feed: what goes in each time (empty for ones that work on their own), makes: what comes out
export const PRODUCERS = [
  { id: 'coop', name: 'Chicken coop', level: 3, price: 70, w: 2, h: 2, feed: { wheat: 2 }, makes: 'egg', amount: 2, minutes: 20, xp: 3, blurb: 'Feed the hens wheat, collect eggs.' },
  { id: 'hive', name: 'Beehive', level: 4, price: 60, w: 1, h: 1, feed: {}, makes: 'honey', amount: 1, minutes: 60, xp: 3, blurb: 'The bees make honey all on their own.' },
  { id: 'mill', name: 'Windmill', level: 5, price: 100, w: 2, h: 2, feed: { wheat: 3 }, makes: 'flour', amount: 1, minutes: 6, xp: 2, blurb: 'Turns wheat into flour for baking.' },
  { id: 'cowshed', name: 'Cow shed', level: 7, price: 150, w: 2, h: 2, feed: { corn: 2 }, makes: 'milk', amount: 2, minutes: 40, xp: 5, blurb: 'Feed the cow corn, get fresh milk.' },
]

// ---- everything that can sit in the barn ----
// sell: market price, kind: crop | fruit | product | dish
export const GOODS = {
  ...Object.fromEntries(CROPS.map((c) => [c.id, { id: c.id, name: c.name, sell: c.sell, kind: 'crop', level: c.level }])),
  apple: { id: 'apple', name: 'Apple', sell: 2, kind: 'fruit', level: 2 },
  cherry: { id: 'cherry', name: 'Cherry', sell: 3, kind: 'fruit', level: 4 },
  orange: { id: 'orange', name: 'Orange', sell: 4, kind: 'fruit', level: 6 },
  peach: { id: 'peach', name: 'Peach', sell: 5, kind: 'fruit', level: 8 },
  lemon: { id: 'lemon', name: 'Lemon', sell: 6, kind: 'fruit', level: 10 },
  egg: { id: 'egg', name: 'Egg', sell: 3, kind: 'product', level: 3 },
  honey: { id: 'honey', name: 'Honey', sell: 5, kind: 'product', level: 4 },
  flour: { id: 'flour', name: 'Flour', sell: 3, kind: 'product', level: 5 },
  milk: { id: 'milk', name: 'Milk', sell: 5, kind: 'product', level: 7 },
}

// ---- the kitchen ----
// Dishes sell for more than their parts, fill critter orders, and make the best treats for Pip.
const RECIPE_LIST = [
  { id: 'carrotsoup', name: 'Carrot soup', level: 1, minutes: 3, needs: { carrot: 3 } },
  { id: 'mash', name: 'Buttery mash', level: 2, minutes: 4, needs: { potato: 3 } },
  { id: 'tomatosoup', name: 'Tomato soup', level: 2, minutes: 5, needs: { tomato: 2, carrot: 1 } },
  { id: 'applecrumble', name: 'Apple crumble', level: 3, minutes: 8, needs: { apple: 3, wheat: 2 } },
  { id: 'smoothie', name: 'Berry smoothie', level: 3, minutes: 5, needs: { strawberry: 3 } },
  { id: 'omelette', name: 'Omelette', level: 3, minutes: 6, needs: { egg: 2, tomato: 1 } },
  { id: 'popcorn', name: 'Popcorn', level: 4, minutes: 4, needs: { corn: 2 } },
  { id: 'honeytoast', name: 'Honey toast', level: 4, minutes: 6, needs: { wheat: 3, honey: 1 } },
  { id: 'cherrytart', name: 'Cherry tart', level: 5, minutes: 10, needs: { cherry: 3, flour: 1, egg: 1 } },
  { id: 'pancakes', name: 'Pancakes', level: 5, minutes: 10, needs: { flour: 2, egg: 2, honey: 1 } },
  { id: 'pumpkinpie', name: 'Pumpkin pie', level: 6, minutes: 15, needs: { pumpkin: 1, flour: 2, egg: 1 } },
  { id: 'orangejuice', name: 'Orange juice', level: 6, minutes: 5, needs: { orange: 4 } },
  { id: 'sunbread', name: 'Sunflower bread', level: 6, minutes: 10, needs: { flour: 2, sunflower: 1 } },
  { id: 'muffins', name: 'Blueberry muffins', level: 7, minutes: 15, needs: { blueberry: 2, flour: 2, egg: 1, milk: 1 } },
  { id: 'cobbler', name: 'Peach cobbler', level: 8, minutes: 20, needs: { peach: 3, flour: 2, milk: 1 } },
  { id: 'lavendertea', name: 'Lavender tea', level: 8, minutes: 8, needs: { lavender: 2, honey: 1 } },
  { id: 'slush', name: 'Watermelon slush', level: 9, minutes: 6, needs: { watermelon: 1, honey: 1 } },
  { id: 'lemonade', name: 'Lemonade', level: 10, minutes: 6, needs: { lemon: 3, honey: 1 } },
  { id: 'rosecake', name: 'Rose cake', level: 10, minutes: 30, needs: { rose: 1, flour: 3, egg: 2, milk: 2 } },
  { id: 'feast', name: 'Garden feast', level: 11, minutes: 30, needs: { pumpkin: 1, tomato: 2, potato: 2, corn: 2 } },
]

const partsValue = (needs) => Object.entries(needs).reduce((sum, [id, n]) => sum + GOODS[id].sell * n, 0)

export const RECIPES = RECIPE_LIST.map((r) => {
  const value = partsValue(r.needs)
  // a cooked dish is worth half again its ingredients; treats help Pip grow
  return { ...r, sell: Math.round(value * 1.5) + 2, xp: Math.max(2, Math.round(value / 2)), treat: Math.round(8 + value * 1.2) }
})
for (const r of RECIPES) GOODS[r.id] = { id: r.id, name: r.name, sell: r.sell, kind: 'dish', level: r.level }

// ---- decorations, paths and fences for styling the farm ----
// w, h: tiles it covers. Decor has no job, it just looks lovely (and some critters like it).
export const DECOR = [
  { id: 'stonepath', name: 'Stone path', level: 1, price: 2, w: 1, h: 1, flat: true },
  { id: 'woodpath', name: 'Wooden boards', level: 2, price: 3, w: 1, h: 1, flat: true },
  { id: 'fence', name: 'Wooden fence', level: 1, price: 3, w: 1, h: 1 },
  { id: 'picket', name: 'Picket fence', level: 3, price: 5, w: 1, h: 1 },
  { id: 'bush', name: 'Round bush', level: 1, price: 6, w: 1, h: 1 },
  { id: 'flowerbed', name: 'Flower bed', level: 2, price: 10, w: 1, h: 1 },
  { id: 'mushrooms', name: 'Toadstools', level: 2, price: 8, w: 1, h: 1 },
  { id: 'haybale', name: 'Hay bale', level: 3, price: 10, w: 1, h: 1 },
  { id: 'mailbox', name: 'Mailbox', level: 3, price: 12, w: 1, h: 1 },
  { id: 'bench', name: 'Garden bench', level: 4, price: 18, w: 1, h: 1 },
  { id: 'lamp', name: 'Lamp post', level: 4, price: 20, w: 1, h: 1 },
  { id: 'wheelbarrow', name: 'Wheelbarrow', level: 5, price: 22, w: 1, h: 1 },
  { id: 'gnome', name: 'Garden gnome', level: 5, price: 25, w: 1, h: 1 },
  { id: 'scarecrow', name: 'Scarecrow', level: 6, price: 30, w: 1, h: 1 },
  { id: 'birdbath', name: 'Bird bath', level: 7, price: 35, w: 1, h: 1 },
  { id: 'well', name: 'Wishing well', level: 8, price: 50, w: 1, h: 1 },
  { id: 'picnic', name: 'Picnic blanket', level: 9, price: 40, w: 2, h: 1, flat: true },
  { id: 'pond', name: 'Lily pond', level: 10, price: 80, w: 2, h: 2, flat: true },
  { id: 'gazebo', name: 'Gazebo', level: 12, price: 140, w: 2, h: 2 },
]

// ---- everything that can be placed on the map, by type ----
export const PLACEABLE = {
  plot: { id: 'plot', name: 'Soil plot', w: 1, h: 1, flat: true },
  barn: { id: 'barn', name: 'Barn', w: 2, h: 2 },
  kitchen: { id: 'kitchen', name: 'Kitchen', w: 2, h: 2 },
  board: { id: 'board', name: 'Order board', w: 1, h: 1 },
  pip: { id: 'pip', name: 'Pip', w: 1, h: 1 },
  ...Object.fromEntries(TREES.map((t) => [t.id, { ...t, w: 1, h: 1 }])),
  ...Object.fromEntries(PRODUCERS.map((p) => [p.id, p])),
  ...Object.fromEntries(DECOR.map((d) => [d.id, d])),
}

// The starting farm: a barn, a kitchen, an order board, Pip, and four plots ready to plant.
export function starterLayout() {
  return [
    { type: 'barn', x: 0, y: 0 },
    { type: 'kitchen', x: 6, y: 0 },
    { type: 'board', x: 3, y: 0 },
    { type: 'pip', x: 4, y: 1 },
    { type: 'plot', x: 2, y: 4 },
    { type: 'plot', x: 3, y: 4 },
    { type: 'plot', x: 4, y: 4 },
    { type: 'plot', x: 5, y: 4 },
    { type: 'stonepath', x: 3, y: 2 },
    { type: 'stonepath', x: 4, y: 2 },
    { type: 'stonepath', x: 3, y: 3 },
    { type: 'stonepath', x: 4, y: 3 },
    { type: 'bush', x: 0, y: 3 },
    { type: 'bush', x: 7, y: 3 },
  ]
}

// ---- shop upgrades ----
export const PLOT_PRICE = (owned) => Math.min(60, 10 + Math.max(0, owned - 4) * 4)
export const MAX_PLOTS = 24
export const BARN_LEVELS = [
  { capacity: 60, price: 0 },
  { capacity: 100, price: 50 },
  { capacity: 150, price: 100 },
  { capacity: 220, price: 180 },
  { capacity: 300, price: 280 },
]
export const KITCHEN_SLOTS = [
  { slots: 1, price: 0 },
  { slots: 2, price: 80 },
  { slots: 3, price: 160 },
]
export const FERTILISER = { price: 3, bundle: 5, bundlePrice: 12 } // halves the time left on one crop

// A neighbour's watering speeds a crop up; so does your own.
export const WATER_SPEEDUP = 0.15

// ---- critter neighbours who leave orders on the board ----
export const CRITTERS = [
  { id: 'bunny', name: 'Bun', kind: 'bunny', likes: ['carrot', 'carrotsoup'] },
  { id: 'hedgehog', name: 'Hazel', kind: 'hedgehog', likes: ['apple', 'applecrumble'] },
  { id: 'badger', name: 'Bramble', kind: 'badger', likes: ['potato', 'mash'] },
  { id: 'bee', name: 'Buzz', kind: 'bee', likes: ['honey', 'lavender', 'sunflower'] },
  { id: 'frog', name: 'Fern', kind: 'frog', likes: ['slush', 'lemonade'] },
  { id: 'mouse', name: 'Mimi', kind: 'mouse', likes: ['wheat', 'flour', 'pancakes'] },
  { id: 'owl', name: 'Professor Hoot', kind: 'owl', likes: ['lavendertea', 'cherrytart'] },
  { id: 'fox', name: 'Rusty', kind: 'fox', likes: ['egg', 'omelette', 'feast'] },
]
export const ORDER_SLOTS = 4
export const ORDER_WAIT = 10 // minutes before a new order arrives

// Pip's daily wish: one thing from the farm Pip would love today.
export const WISH_REWARD = { petals: 8, growth: 20 }
